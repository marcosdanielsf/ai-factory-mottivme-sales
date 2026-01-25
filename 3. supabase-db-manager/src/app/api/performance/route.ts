import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { PerformanceMetrics, TableSize, SlowQuery, IndexSuggestion, ExplainResult } from "@/types/schema";

export const dynamic = "force-dynamic";

// Get table sizes
async function getTableSizes(supabase: ReturnType<typeof createAdminClient>): Promise<TableSize[]> {
  // Try using RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_table_sizes");

  if (!rpcError && rpcData) {
    return rpcData;
  }

  // Fallback: Get basic info from OpenAPI
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const openApiRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!openApiRes.ok) return [];

    const openApi = await openApiRes.json();
    const paths = Object.keys(openApi.paths || {});

    const tableNames = paths
      .filter((p) => p !== "/" && !p.startsWith("/rpc/"))
      .map((p) => p.replace("/", ""));

    const sizes: TableSize[] = await Promise.all(
      tableNames.slice(0, 50).map(async (tableName) => {
        try {
          const { count } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          return {
            table_name: tableName,
            total_size: "N/A",
            data_size: "N/A",
            index_size: "N/A",
            row_count: count || 0,
            total_bytes: 0,
          };
        } catch {
          return {
            table_name: tableName,
            total_size: "N/A",
            data_size: "N/A",
            index_size: "N/A",
            row_count: 0,
            total_bytes: 0,
          };
        }
      })
    );

    return sizes.sort((a, b) => b.row_count - a.row_count);
  } catch {
    return [];
  }
}

// Get slow queries from pg_stat_statements
async function getSlowQueries(supabase: ReturnType<typeof createAdminClient>): Promise<SlowQuery[]> {
  const { data, error } = await supabase.rpc("get_slow_queries", { limit_count: 20 });

  if (error) {
    // pg_stat_statements might not be enabled
    console.log("Slow queries not available:", error.message);
    return [];
  }

  return data || [];
}

// Get index suggestions based on foreign keys without indexes
async function getIndexSuggestions(supabase: ReturnType<typeof createAdminClient>): Promise<IndexSuggestion[]> {
  const { data, error } = await supabase.rpc("get_missing_indexes");

  if (error) {
    console.log("Index suggestions not available:", error.message);
    return [];
  }

  return data || [];
}

// Get database size
async function getDatabaseSize(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data, error } = await supabase.rpc("get_database_size");

  if (error) {
    return "N/A";
  }

  return data || "N/A";
}

// Get active connections count
async function getActiveConnections(supabase: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data, error } = await supabase.rpc("get_active_connections");

  if (error) {
    return 0;
  }

  return data || 0;
}

// GET - Fetch all performance metrics
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all metrics in parallel
    const [tableSizes, slowQueries, indexSuggestions, databaseSize, activeConnections] =
      await Promise.all([
        getTableSizes(supabase),
        getSlowQueries(supabase),
        getIndexSuggestions(supabase),
        getDatabaseSize(supabase),
        getActiveConnections(supabase),
      ]);

    const metrics: PerformanceMetrics = {
      tableSizes,
      slowQueries,
      indexSuggestions,
      databaseSize,
      activeConnections,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Performance metrics error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch performance metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Run EXPLAIN ANALYZE on a query
export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Validate query is read-only
    const normalizedQuery = query.trim().toLowerCase();
    const forbiddenKeywords = ["insert", "update", "delete", "drop", "truncate", "alter", "create", "grant", "revoke"];

    for (const keyword of forbiddenKeywords) {
      if (normalizedQuery.startsWith(keyword)) {
        return NextResponse.json(
          { error: `Cannot run EXPLAIN on ${keyword.toUpperCase()} statements` },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Run EXPLAIN ANALYZE
    const { data, error } = await supabase.rpc("explain_query", {
      query_text: query,
    });

    if (error) {
      // Try simple explain without the function
      return NextResponse.json(
        {
          error: "EXPLAIN not available",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const result: ExplainResult = {
      plan: data?.plan || data || "No execution plan available",
      execution_time: data?.execution_time,
      planning_time: data?.planning_time,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("EXPLAIN error:", error);
    return NextResponse.json(
      {
        error: "Failed to run EXPLAIN",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
