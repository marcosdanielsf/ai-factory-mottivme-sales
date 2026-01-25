import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import type { RLSPolicy, PolicyCommand } from "@/types/rls";
import { validateTableName, getSafeErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ table: string }>;
}

// GET - Get policies for a specific table
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { table } = await params;

    // Validate table name to prevent SQL injection
    if (!validateTableName(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get RLS status for the table
    // Safe to use identifier quoting after validation
    const rlsStatusQuery = `
      SELECT c.relrowsecurity as rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = '${table}';
    `;

    const { data: rlsStatus, error: rlsError } = await supabase.rpc("exec_sql", {
      sql_query: rlsStatusQuery,
    });

    // Get policies for the table
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
      WHERE n.nspname = 'public' AND c.relname = '${table}'
      ORDER BY pol.polname;
    `;

    const { data: policies, error: policiesError } = await supabase.rpc(
      "exec_sql",
      { sql_query: policiesQuery }
    );

    if (policiesError) {
      return NextResponse.json(
        { error: "Failed to fetch policies", details: getSafeErrorMessage(policiesError) },
        { status: 500 }
      );
    }

    // Get columns for the table
    const columnsQuery = `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
      ORDER BY ordinal_position;
    `;

    const { data: columns } = await supabase.rpc("exec_sql", {
      sql_query: columnsQuery,
    });

    return NextResponse.json({
      table_name: table,
      rls_enabled: rlsStatus?.[0]?.rls_enabled || false,
      policies: policies || [],
      columns: columns || [],
    });
  } catch (error) {
    console.error("Fetch table policies error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch table policies",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST - Create a new policy
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { table } = await params;

    // Validate table name
    if (!validateTableName(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      policy_name,
      command,
      is_permissive = true,
      roles = ["public"],
      using_expression,
      check_expression,
    } = body as {
      policy_name: string;
      command: PolicyCommand;
      is_permissive?: boolean;
      roles?: string[];
      using_expression: string;
      check_expression?: string | null;
    };

    // Validate required fields
    if (!policy_name || !command || !using_expression) {
      return NextResponse.json(
        { error: "policy_name, command, and using_expression are required" },
        { status: 400 }
      );
    }

    // Validate command
    const validCommands = ["SELECT", "INSERT", "UPDATE", "DELETE", "ALL"];
    if (!validCommands.includes(command)) {
      return NextResponse.json(
        { error: "Invalid command. Must be one of: SELECT, INSERT, UPDATE, DELETE, ALL" },
        { status: 400 }
      );
    }

    // Sanitize policy name (only alphanumeric and underscore)
    const sanitizedPolicyName = policy_name.replace(/[^a-zA-Z0-9_]/g, "_");

    const supabase = createAdminClient();

    // Build the CREATE POLICY SQL - use identifier quoting
    const permissive = is_permissive ? "PERMISSIVE" : "RESTRICTIVE";
    const rolesStr = roles.length > 0 ? roles.join(", ") : "public";

    let sql = `CREATE POLICY "${sanitizedPolicyName}" ON public."${table}"\n`;
    sql += `  AS ${permissive}\n`;
    sql += `  FOR ${command}\n`;
    sql += `  TO ${rolesStr}\n`;
    sql += `  USING (${using_expression})`;

    // Add WITH CHECK if provided and command supports it
    if (check_expression && ["INSERT", "UPDATE", "ALL"].includes(command)) {
      sql += `\n  WITH CHECK (${check_expression})`;
    }

    sql += ";";

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to create policy",
          details: getSafeErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Policy "${sanitizedPolicyName}" created successfully`,
    });
  } catch (error) {
    console.error("Create policy error:", error);
    return NextResponse.json(
      {
        error: "Failed to create policy",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a policy
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { table } = await params;

    // Validate table name
    if (!validateTableName(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const policyName = searchParams.get("policy_name");

    if (!policyName) {
      return NextResponse.json(
        { error: "policy_name query parameter is required" },
        { status: 400 }
      );
    }

    // Validate policy name (same rules as table name)
    if (!validateTableName(policyName)) {
      return NextResponse.json(
        { error: "Invalid policy name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const sql = `DROP POLICY IF EXISTS "${policyName}" ON public."${table}";`;

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to delete policy",
          details: getSafeErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Policy "${policyName}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete policy error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete policy",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// PATCH - Update RLS status for the table
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { table } = await params;

    // Validate table name
    if (!validateTableName(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { enable } = body as { enable: boolean };

    if (typeof enable !== 'boolean') {
      return NextResponse.json(
        { error: "enable must be a boolean value" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const action = enable ? "ENABLE" : "DISABLE";
    const sql = `ALTER TABLE public."${table}" ${action} ROW LEVEL SECURITY;`;

    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      return NextResponse.json(
        {
          error: `Failed to ${action.toLowerCase()} RLS`,
          details: getSafeErrorMessage(error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `RLS ${action.toLowerCase()}d for table ${table}`,
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
