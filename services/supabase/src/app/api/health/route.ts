import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TableHealthInfo {
  table_name: string;
  row_count: number;
  column_count: number;
  has_primary_key: boolean;
  has_rls: boolean;
  has_indexes: boolean;
  columns: string[];
}

interface HealthMetrics {
  total_tables: number;
  tables_without_pk: number;
  tables_without_rls: number;
  tables_without_indexes: number;
  total_columns: number;
  total_rows: number;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all tables with their columns and basic info
    const { data: tablesData, error: tablesError } = await supabase.rpc(
      "get_health_check_data"
    );

    if (tablesError) {
      // Fallback: Use direct queries via OpenAPI
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
      const definitions = openApi.definitions || {};

      const tables: TableHealthInfo[] = [];

      for (const [tableName, schema] of Object.entries(definitions)) {
        if (tableName.startsWith("_")) continue;

        const tableSchema = schema as { properties?: Record<string, unknown> };
        const properties = tableSchema.properties || {};
        const columns = Object.keys(properties);

        // Get row count
        let rowCount = 0;
        try {
          const { count } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });
          rowCount = count || 0;
        } catch {
          // Ignore count errors
        }

        tables.push({
          table_name: tableName,
          row_count: rowCount,
          column_count: columns.length,
          has_primary_key: columns.includes("id"),
          has_rls: false, // Cannot determine without RPC
          has_indexes: columns.includes("id"), // Assume PK has index
          columns,
        });
      }

      // Calculate metrics
      const metrics: HealthMetrics = {
        total_tables: tables.length,
        tables_without_pk: tables.filter((t) => !t.has_primary_key).length,
        tables_without_rls: tables.filter((t) => !t.has_rls).length,
        tables_without_indexes: tables.filter((t) => !t.has_indexes).length,
        total_columns: tables.reduce((acc, t) => acc + t.column_count, 0),
        total_rows: tables.reduce((acc, t) => acc + t.row_count, 0),
      };

      return NextResponse.json({ tables, metrics });
    }

    // Parse RPC data if available
    const tables: TableHealthInfo[] = tablesData || [];

    const metrics: HealthMetrics = {
      total_tables: tables.length,
      tables_without_pk: tables.filter((t) => !t.has_primary_key).length,
      tables_without_rls: tables.filter((t) => !t.has_rls).length,
      tables_without_indexes: tables.filter((t) => !t.has_indexes).length,
      total_columns: tables.reduce((acc, t) => acc + t.column_count, 0),
      total_rows: tables.reduce((acc, t) => acc + t.row_count, 0),
    };

    return NextResponse.json({ tables, metrics });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform health check",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
