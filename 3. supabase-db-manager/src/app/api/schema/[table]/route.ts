import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { validateTableName, getSafeErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ table: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { table } = await context.params;

    // Validate table name
    if (!validateTableName(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Try using the helper function first
    const { data: columnsData, error: columnsError } = await supabase.rpc(
      "get_table_columns",
      { p_table_name: table }
    );

    if (!columnsError && columnsData && columnsData.length > 0) {
      // Get row count
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      // Get RLS policies
      const { data: policies } = await supabase.rpc("get_rls_policies", {
        p_table_name: table,
      });

      // Check if RLS is enabled
      const { data: rlsStatus } = await supabase.rpc("check_rls_enabled", {
        p_table_name: table,
      });

      // Get foreign keys
      const { data: foreignKeys } = await supabase.rpc("get_foreign_keys", {
        p_table_name: table,
      });

      return NextResponse.json({
        table_name: table,
        row_count: count || 0,
        columns: columnsData,
        foreign_keys: foreignKeys || [],
        policies: policies || [],
        rls_enabled: rlsStatus?.[0]?.rls_enabled || false,
      });
    }

    // Fallback: Get column info from OpenAPI definitions
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
    const definition = openApi.definitions?.[table];

    if (!definition) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    // Get row count
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    // Parse columns from OpenAPI definition
    const properties = definition.properties || {};
    const required = definition.required || [];

    const columns = Object.entries(properties).map(
      ([name, prop]: [string, any], index) => {
        // Map OpenAPI types to PostgreSQL types
        const pgType = mapOpenApiTypeToPg(prop);

        return {
          column_name: name,
          data_type: pgType,
          udt_name: pgType,
          is_nullable: required.includes(name) ? "NO" : "YES",
          column_default: prop.default || null,
          character_maximum_length: prop.maxLength || null,
          numeric_precision: null,
          ordinal_position: index + 1,
          column_comment: prop.description || null,
          is_primary_key: name === "id",
          is_foreign_key: name.endsWith("_id") && name !== "id",
          foreign_table_name: name.endsWith("_id")
            ? name.replace("_id", "")
            : null,
          foreign_column_name: name.endsWith("_id") ? "id" : null,
        };
      }
    );

    // Sort by ordinal position (put id first, then alphabetically)
    columns.sort((a, b) => {
      if (a.column_name === "id") return -1;
      if (b.column_name === "id") return 1;
      if (a.column_name === "created_at") return 1;
      if (b.column_name === "created_at") return -1;
      return a.column_name.localeCompare(b.column_name);
    });

    return NextResponse.json({
      table_name: table,
      row_count: count || 0,
      columns,
      foreign_keys: [],
      policies: [],
      rls_enabled: false,
    });
  } catch (error) {
    console.error("Table details error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch table details",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

function mapOpenApiTypeToPg(prop: any): string {
  const format = prop.format;
  const type = prop.type;

  if (format === "uuid") return "uuid";
  if (format === "timestamp with time zone" || format === "date-time")
    return "timestamp with time zone";
  if (format === "date") return "date";
  if (format === "time") return "time";
  if (format === "bigint") return "bigint";
  if (format === "integer" || type === "integer") return "integer";
  if (format === "double precision" || type === "number") return "numeric";
  if (type === "boolean") return "boolean";
  if (type === "array") return "ARRAY";
  if (type === "object" || prop.additionalProperties) return "jsonb";
  if (type === "string") return "text";

  return type || "text";
}
