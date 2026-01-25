import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TableColumnInfo {
  table_name: string;
  columns: string[];
  column_types: Record<string, string>;
}

interface SimilarityResult {
  table1: string;
  table2: string;
  similarity_percent: number;
  shared_columns: string[];
  table1_only: string[];
  table2_only: string[];
  table1_columns: string[];
  table2_columns: string[];
}

interface DuplicateColumn {
  column_name: string;
  data_type: string;
  tables: string[];
  occurrence_count: number;
}

// Calculate similarity percentage between two tables based on column names
function calculateSimilarity(
  columns1: string[],
  columns2: string[]
): {
  similarity: number;
  shared: string[];
  only1: string[];
  only2: string[];
} {
  const set1 = new Set(columns1);
  const set2 = new Set(columns2);

  const shared = columns1.filter((col) => set2.has(col));
  const only1 = columns1.filter((col) => !set2.has(col));
  const only2 = columns2.filter((col) => !set1.has(col));

  const maxLength = Math.max(columns1.length, columns2.length);
  const similarity = maxLength > 0 ? (shared.length / maxLength) * 100 : 0;

  return { similarity, shared, only1, only2 };
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fetch OpenAPI spec to get table definitions
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

    // Build table column info
    const tables: TableColumnInfo[] = [];

    for (const [tableName, schema] of Object.entries(definitions)) {
      if (tableName.startsWith("_")) continue;

      const tableSchema = schema as {
        properties?: Record<string, { type?: string; format?: string }>;
      };
      const properties = tableSchema.properties || {};
      const columns = Object.keys(properties);
      const columnTypes: Record<string, string> = {};

      for (const [colName, colSchema] of Object.entries(properties)) {
        columnTypes[colName] = colSchema.format || colSchema.type || "unknown";
      }

      tables.push({
        table_name: tableName,
        columns,
        column_types: columnTypes,
      });
    }

    // Find similar tables (>50% similarity)
    const similarTables: SimilarityResult[] = [];

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const { similarity, shared, only1, only2 } = calculateSimilarity(
          tables[i].columns,
          tables[j].columns
        );

        if (similarity >= 50) {
          similarTables.push({
            table1: tables[i].table_name,
            table2: tables[j].table_name,
            similarity_percent: Math.round(similarity),
            shared_columns: shared,
            table1_only: only1,
            table2_only: only2,
            table1_columns: tables[i].columns,
            table2_columns: tables[j].columns,
          });
        }
      }
    }

    // Sort by similarity descending
    similarTables.sort((a, b) => b.similarity_percent - a.similarity_percent);

    // Find duplicate columns across tables
    const columnOccurrences: Map<
      string,
      { type: string; tables: Set<string> }
    > = new Map();

    for (const table of tables) {
      for (const [colName, colType] of Object.entries(table.column_types)) {
        // Skip common columns like id, created_at, updated_at
        const commonColumns = [
          "id",
          "created_at",
          "updated_at",
          "deleted_at",
          "uuid",
        ];
        if (commonColumns.includes(colName)) continue;

        const key = `${colName}:${colType}`;
        if (!columnOccurrences.has(key)) {
          columnOccurrences.set(key, { type: colType, tables: new Set() });
        }
        columnOccurrences.get(key)!.tables.add(table.table_name);
      }
    }

    // Filter columns that appear in multiple tables
    const duplicateColumns: DuplicateColumn[] = [];

    for (const [key, value] of columnOccurrences.entries()) {
      if (value.tables.size >= 2) {
        const [colName] = key.split(":");
        duplicateColumns.push({
          column_name: colName,
          data_type: value.type,
          tables: Array.from(value.tables).sort(),
          occurrence_count: value.tables.size,
        });
      }
    }

    // Sort by occurrence count descending
    duplicateColumns.sort((a, b) => b.occurrence_count - a.occurrence_count);

    return NextResponse.json({
      similar_tables: similarTables,
      duplicate_columns: duplicateColumns,
      total_tables: tables.length,
      tables_with_similarity: similarTables.length,
      columns_duplicated: duplicateColumns.length,
    });
  } catch (error) {
    console.error("Similar tables detection error:", error);
    return NextResponse.json(
      {
        error: "Failed to detect similar tables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
