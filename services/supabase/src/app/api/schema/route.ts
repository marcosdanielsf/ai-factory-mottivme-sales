import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getSafeErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Try using the helper function first
    const { data: schemaData, error: schemaError } = await supabase.rpc(
      "get_schema_info"
    );

    if (!schemaError && schemaData && schemaData.length > 0) {
      return NextResponse.json({ tables: schemaData });
    }

    // Fallback: Get tables from OpenAPI spec
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const openApiRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!openApiRes.ok) {
      throw new Error("Failed to fetch OpenAPI spec");
    }

    const openApi = await openApiRes.json();
    const paths = Object.keys(openApi.paths || {});

    // Filter out internal paths and extract table names
    const tableNames = paths
      .filter((p) => p !== "/" && !p.startsWith("/rpc/"))
      .map((p) => p.replace("/", ""));

    // Get row counts for each table (in parallel, limited)
    const tables = await Promise.all(
      tableNames.slice(0, 100).map(async (tableName) => {
        try {
          const { count } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          return {
            table_name: tableName,
            table_schema: "public",
            row_count: count || 0,
            column_count: null,
          };
        } catch {
          return {
            table_name: tableName,
            table_schema: "public",
            row_count: 0,
            column_count: null,
          };
        }
      })
    );

    // Sort by name
    tables.sort((a, b) => a.table_name.localeCompare(b.table_name));

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Schema fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch schema",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
