import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { TableWithRLS, RLSPolicy } from "@/types/rls";
import { validateTableName, getSafeErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query to get all tables with their RLS status and policies
    const { data: tablesData, error: tablesError } = await supabase.rpc(
      "get_tables_with_rls"
    );

    if (tablesError) {
      // Fallback: query pg_tables and pg_policies directly
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("pg_tables")
        .select("tablename, schemaname")
        .eq("schemaname", "public");

      if (fallbackError) {
        // Last resort: use raw SQL via admin connection
        const tablesWithRLS = await getTablesWithRLSFallback(supabase);
        return NextResponse.json({ tables: tablesWithRLS });
      }
    }

    if (tablesData && tablesData.length > 0) {
      return NextResponse.json({ tables: tablesData });
    }

    // Fallback approach using raw queries
    const tablesWithRLS = await getTablesWithRLSFallback(supabase);
    return NextResponse.json({ tables: tablesWithRLS });
  } catch (error) {
    console.error("RLS fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch RLS policies",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

async function getTablesWithRLSFallback(
  supabase: ReturnType<typeof createAdminClient>
): Promise<TableWithRLS[]> {
  // Get all public tables with RLS info
  const query = `
    SELECT
      c.relname as table_name,
      n.nspname as table_schema,
      c.relrowsecurity as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `;

  const { data: tables, error: tablesError } = await supabase.rpc(
    "exec_sql",
    { sql_query: query }
  );

  if (tablesError) {
    // Try alternative method - get tables from OpenAPI and check RLS individually
    return await getTablesFromOpenAPI(supabase);
  }

  // Get all policies
  const policiesQuery = `
    SELECT
      pol.polname as policy_name,
      c.relname as table_name,
      n.nspname as table_schema,
      CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
      END as command,
      pol.polpermissive as is_permissive,
      COALESCE(
        ARRAY(
          SELECT rolname
          FROM pg_roles
          WHERE oid = ANY(pol.polroles)
        ),
        ARRAY['public']::name[]
      ) as roles,
      pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
      pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expression
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    ORDER BY c.relname, pol.polname;
  `;

  const { data: policies } = await supabase.rpc("exec_sql", {
    sql_query: policiesQuery,
  });

  // Map policies to tables
  const policiesMap = new Map<string, RLSPolicy[]>();
  if (policies && Array.isArray(policies)) {
    for (const policy of policies) {
      const tablePolicies = policiesMap.get(policy.table_name) || [];
      tablePolicies.push({
        policy_name: policy.policy_name,
        table_name: policy.table_name,
        table_schema: policy.table_schema,
        command: policy.command,
        is_permissive: policy.is_permissive,
        roles: policy.roles || ["public"],
        using_expression: policy.using_expression,
        check_expression: policy.check_expression,
      });
      policiesMap.set(policy.table_name, tablePolicies);
    }
  }

  // Combine tables with their policies
  const result: TableWithRLS[] = (tables || []).map((table: { table_name: string; table_schema: string; rls_enabled: boolean }) => ({
    table_name: table.table_name,
    table_schema: table.table_schema,
    rls_enabled: table.rls_enabled,
    policies: policiesMap.get(table.table_name) || [],
  }));

  return result;
}

async function getTablesFromOpenAPI(
  supabase: ReturnType<typeof createAdminClient>
): Promise<TableWithRLS[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const openApiRes = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceKey!,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!openApiRes.ok) {
    return [];
  }

  const openApi = await openApiRes.json();
  const paths = Object.keys(openApi.paths || {});

  const tableNames = paths
    .filter((p) => p !== "/" && !p.startsWith("/rpc/"))
    .map((p) => p.replace("/", ""));

  // For each table, we'll assume RLS is disabled and no policies
  // since we can't query pg_* tables directly
  return tableNames.map((name) => ({
    table_name: name,
    table_schema: "public",
    rls_enabled: false,
    policies: [],
  }));
}

// POST - Toggle RLS for a table
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table_name, enable } = body;

    if (!table_name) {
      return NextResponse.json(
        { error: "table_name is required" },
        { status: 400 }
      );
    }

    // Validate table name
    if (!validateTableName(table_name)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    if (typeof enable !== 'boolean') {
      return NextResponse.json(
        { error: "enable must be a boolean value" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const action = enable ? "ENABLE" : "DISABLE";
    const sql = `ALTER TABLE public."${table_name}" ${action} ROW LEVEL SECURITY;`;

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      return NextResponse.json(
        { error: `Failed to ${action.toLowerCase()} RLS`, details: getSafeErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `RLS ${action.toLowerCase()}d for table ${table_name}`,
    });
  } catch (error) {
    console.error("Toggle RLS error:", error);
    return NextResponse.json(
      {
        error: "Failed to toggle RLS",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
