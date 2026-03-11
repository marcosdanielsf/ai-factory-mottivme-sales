import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSafeErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

// SQL keywords that modify data - require confirmation
const DANGEROUS_KEYWORDS = [
  "DELETE",
  "DROP",
  "TRUNCATE",
  "ALTER",
  "UPDATE",
  "INSERT",
  "CREATE",
  "GRANT",
  "REVOKE",
];

function isDangerousQuery(sql: string): boolean {
  const upperSql = sql.toUpperCase().trim();
  return DANGEROUS_KEYWORDS.some((keyword) => {
    // Check if keyword appears at start or after whitespace/semicolon
    const regex = new RegExp(`(^|\\s|;)${keyword}\\s`, "i");
    return regex.test(upperSql);
  });
}

function isSelectOnly(sql: string): boolean {
  const upperSql = sql.toUpperCase().trim();
  // Allow SELECT, WITH (for CTEs), and EXPLAIN
  return (
    upperSql.startsWith("SELECT") ||
    upperSql.startsWith("WITH") ||
    upperSql.startsWith("EXPLAIN")
  );
}

export interface QueryResult {
  data: Record<string, unknown>[] | null;
  columns: string[];
  rowCount: number;
  executionTime: number;
  error?: string;
  warning?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, confirmed = false } = body as {
      sql: string;
      confirmed?: boolean;
    };

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { error: "SQL query is required" },
        { status: 400 }
      );
    }

    const trimmedSql = sql.trim();

    if (!trimmedSql) {
      return NextResponse.json(
        { error: "SQL query cannot be empty" },
        { status: 400 }
      );
    }

    // Check for dangerous queries
    const dangerous = isDangerousQuery(trimmedSql);

    if (dangerous && !confirmed) {
      return NextResponse.json(
        {
          requiresConfirmation: true,
          warning: `This query contains potentially dangerous operations. Are you sure you want to execute it?`,
          detectedKeywords: DANGEROUS_KEYWORDS.filter((kw) =>
            new RegExp(`(^|\\s|;)${kw}\\s`, "i").test(trimmedSql)
          ),
        },
        { status: 409 } // Conflict - requires confirmation
      );
    }

    const supabase = createAdminClient();
    const startTime = performance.now();

    // Execute the raw SQL query using Postgres function
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: trimmedSql,
    });

    const executionTime = Math.round(performance.now() - startTime);

    if (error) {
      // Try direct query for SELECT statements as fallback
      if (isSelectOnly(trimmedSql)) {
        // Use a different approach - REST API raw query
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: "POST",
          headers: {
            apikey: serviceKey!,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ query_text: trimmedSql }),
        });

        if (response.ok) {
          const result = await response.json();
          const endTime = Math.round(performance.now() - startTime);
          const rows = Array.isArray(result) ? result : [];
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

          return NextResponse.json({
            data: rows,
            columns,
            rowCount: rows.length,
            executionTime: endTime,
            warning: dangerous ? "Query executed with confirmation" : undefined,
          } as QueryResult);
        }
      }

      return NextResponse.json(
        {
          data: null,
          columns: [],
          rowCount: 0,
          executionTime,
          error: getSafeErrorMessage(error),
        } as QueryResult,
        { status: 400 }
      );
    }

    // Process results
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      data: rows,
      columns,
      rowCount: rows.length,
      executionTime,
      warning: dangerous ? "Query executed with confirmation" : undefined,
    } as QueryResult);
  } catch (error) {
    console.error("Query execution error:", error);
    return NextResponse.json(
      {
        data: null,
        columns: [],
        rowCount: 0,
        executionTime: 0,
        error: getSafeErrorMessage(error),
      } as QueryResult,
      { status: 500 }
    );
  }
}
