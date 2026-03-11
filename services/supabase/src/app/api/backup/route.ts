import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { BackupOptions, BackupResult, BackupType } from "@/types/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow longer execution for large backups

// Helper to escape SQL strings
function escapeSqlString(str: string | null): string {
  if (str === null) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Helper to format value for SQL
function formatValue(value: unknown, dataType: string): string {
  if (value === null || value === undefined) return "NULL";

  // Handle arrays
  if (Array.isArray(value)) {
    return `ARRAY[${value.map((v) => formatValue(v, dataType.replace("[]", ""))).join(", ")}]`;
  }

  // Handle JSON/JSONB
  if (dataType === "jsonb" || dataType === "json") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::${dataType}`;
  }

  // Handle boolean
  if (dataType === "boolean" || dataType === "bool") {
    return value ? "TRUE" : "FALSE";
  }

  // Handle numeric types
  if (
    ["integer", "int4", "int8", "bigint", "smallint", "numeric", "decimal", "real", "float4", "float8", "double precision"].includes(
      dataType
    )
  ) {
    return String(value);
  }

  // Handle UUID
  if (dataType === "uuid") {
    return `'${value}'::uuid`;
  }

  // Handle timestamp types
  if (dataType.includes("timestamp")) {
    return `'${value}'::${dataType}`;
  }

  // Handle date
  if (dataType === "date") {
    return `'${value}'::date`;
  }

  // Default: escape as string
  return escapeSqlString(String(value));
}

// Get table schema (columns with types)
async function getTableSchema(supabase: ReturnType<typeof createAdminClient>, tableName: string) {
  const { data, error } = await supabase.rpc("get_table_columns", {
    p_schema: "public",
    p_table: tableName,
  });

  if (error) {
    // Fallback: try to get from information_schema via raw query
    const { data: fallbackData } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);

    if (fallbackData && fallbackData.length > 0) {
      return Object.keys(fallbackData[0]).map((col) => ({
        column_name: col,
        data_type: "text", // Default type
        is_nullable: "YES",
        column_default: null,
      }));
    }
    return [];
  }

  return data || [];
}

// Get table constraints
async function getTableConstraints(supabase: ReturnType<typeof createAdminClient>, tableName: string) {
  const { data } = await supabase.rpc("get_table_constraints", {
    p_table: tableName,
  });

  return data || [];
}

// Get table indexes
async function getTableIndexes(supabase: ReturnType<typeof createAdminClient>, tableName: string) {
  const { data } = await supabase.rpc("get_table_indexes", {
    p_table: tableName,
  });

  return data || [];
}

// Generate CREATE TABLE statement
async function generateSchemaSQL(
  supabase: ReturnType<typeof createAdminClient>,
  tableName: string,
  includeDropStatements: boolean,
  includeConstraints: boolean
): Promise<string> {
  const columns = await getTableSchema(supabase, tableName);
  const constraints = includeConstraints ? await getTableConstraints(supabase, tableName) : [];
  const indexes = includeConstraints ? await getTableIndexes(supabase, tableName) : [];

  let sql = "";

  // Add DROP statement if requested
  if (includeDropStatements) {
    sql += `-- Drop table if exists\nDROP TABLE IF EXISTS "${tableName}" CASCADE;\n\n`;
  }

  // If no columns, try alternative approach
  if (!columns || columns.length === 0) {
    sql += `-- Unable to retrieve schema for table "${tableName}"\n`;
    sql += `-- Please check if the table exists and you have access\n\n`;
    return sql;
  }

  // CREATE TABLE
  sql += `-- Table: ${tableName}\nCREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

  const columnDefs = columns.map((col: { column_name: string; data_type: string; is_nullable: string; column_default: string | null }) => {
    let def = `  "${col.column_name}" ${col.data_type}`;
    if (col.is_nullable === "NO") def += " NOT NULL";
    if (col.column_default) def += ` DEFAULT ${col.column_default}`;
    return def;
  });

  sql += columnDefs.join(",\n");
  sql += "\n);\n\n";

  // Add indexes
  if (indexes && indexes.length > 0) {
    sql += `-- Indexes for ${tableName}\n`;
    for (const idx of indexes) {
      if (!idx.is_primary) {
        sql += `CREATE ${idx.is_unique ? "UNIQUE " : ""}INDEX IF NOT EXISTS "${idx.index_name}" ON "${tableName}" ("${idx.column_name}");\n`;
      }
    }
    sql += "\n";
  }

  // Add constraints
  if (constraints && constraints.length > 0) {
    sql += `-- Constraints for ${tableName}\n`;
    for (const con of constraints) {
      sql += `-- ${con.constraint_type}: ${con.constraint_name}\n`;
    }
    sql += "\n";
  }

  return sql;
}

// Generate INSERT statements for data
async function generateDataSQL(
  supabase: ReturnType<typeof createAdminClient>,
  tableName: string
): Promise<string> {
  // Get all data from table
  const { data, error } = await supabase.from(tableName).select("*");

  if (error) {
    return `-- Error fetching data from "${tableName}": ${error.message}\n\n`;
  }

  if (!data || data.length === 0) {
    return `-- Table "${tableName}" is empty\n\n`;
  }

  // Get column info
  const columns = await getTableSchema(supabase, tableName);
  const columnTypes: Record<string, string> = {};
  for (const col of columns) {
    columnTypes[col.column_name] = col.data_type;
  }

  let sql = `-- Data for table: ${tableName} (${data.length} rows)\n`;

  // Generate INSERT statements in batches
  const BATCH_SIZE = 100;
  const columnNames = Object.keys(data[0]);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    sql += `INSERT INTO "${tableName}" ("${columnNames.join('", "')}") VALUES\n`;

    const values = batch.map((row) => {
      const rowValues = columnNames.map((col) => {
        const dataType = columnTypes[col] || "text";
        return formatValue(row[col], dataType);
      });
      return `  (${rowValues.join(", ")})`;
    });

    sql += values.join(",\n");
    sql += ";\n\n";
  }

  return sql;
}

export async function POST(request: Request) {
  try {
    const body: BackupOptions = await request.json();
    const { tables, backupType, includeDropStatements = false, includeConstraints = true } = body;

    if (!tables || tables.length === 0) {
      return NextResponse.json(
        { error: "No tables specified for backup" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    let sql = "";

    // Header
    sql += `--\n`;
    sql += `-- PostgreSQL Backup\n`;
    sql += `-- Generated by Supabase DB Manager\n`;
    sql += `-- Date: ${new Date().toISOString()}\n`;
    sql += `-- Backup Type: ${backupType}\n`;
    sql += `-- Tables: ${tables.join(", ")}\n`;
    sql += `--\n\n`;

    sql += `SET statement_timeout = 0;\n`;
    sql += `SET lock_timeout = 0;\n`;
    sql += `SET client_encoding = 'UTF8';\n`;
    sql += `SET standard_conforming_strings = on;\n\n`;

    // Generate SQL for each table
    for (const tableName of tables) {
      sql += `-- ============================================\n`;
      sql += `-- TABLE: ${tableName}\n`;
      sql += `-- ============================================\n\n`;

      if (backupType === "schema" || backupType === "full") {
        sql += await generateSchemaSQL(supabase, tableName, includeDropStatements, includeConstraints);
      }

      if (backupType === "data" || backupType === "full") {
        sql += await generateDataSQL(supabase, tableName);
      }
    }

    const result: BackupResult = {
      sql,
      tables,
      backupType,
      timestamp: new Date().toISOString(),
      size: new Blob([sql]).size,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate backup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
