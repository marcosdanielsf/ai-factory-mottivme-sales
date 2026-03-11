import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { validateTableName, validateColumnName, validateOperator, getSafeErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ table: string }>;
}

// GET - Fetch paginated data from table
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { table } = await params;

    // Validate table name
    if (!validateTableName(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100);
    const offset = (page - 1) * limit;

    // Sorting
    const sortColumn = searchParams.get("sortColumn");
    const sortDirection = searchParams.get("sortDirection") as "asc" | "desc" | null;

    // Validate sort column if provided
    if (sortColumn && !validateColumnName(sortColumn)) {
      return NextResponse.json(
        { error: "Invalid sort column name" },
        { status: 400 }
      );
    }

    // Filters (JSON string)
    const filtersParam = searchParams.get("filters");
    const filters: { column: string; operator: string; value: string }[] = filtersParam
      ? JSON.parse(filtersParam)
      : [];

    // Validate filters
    for (const filter of filters) {
      if (!validateColumnName(filter.column)) {
        return NextResponse.json(
          { error: `Invalid column name: ${filter.column}` },
          { status: 400 }
        );
      }
      if (!validateOperator(filter.operator)) {
        return NextResponse.json(
          { error: `Invalid operator: ${filter.operator}` },
          { status: 400 }
        );
      }
    }

    // Build query
    let query = supabase.from(table).select("*", { count: "exact" });

    // Apply filters
    for (const filter of filters) {
      const { column, operator, value } = filter;
      switch (operator) {
        case "eq":
          query = query.eq(column, value);
          break;
        case "neq":
          query = query.neq(column, value);
          break;
        case "gt":
          query = query.gt(column, value);
          break;
        case "gte":
          query = query.gte(column, value);
          break;
        case "lt":
          query = query.lt(column, value);
          break;
        case "lte":
          query = query.lte(column, value);
          break;
        case "like":
        case "ilike":
          query = query.ilike(column, `%${value}%`);
          break;
        case "is":
          if (value === "null") {
            query = query.is(column, null);
          } else if (value === "true") {
            query = query.is(column, true);
          } else if (value === "false") {
            query = query.is(column, false);
          }
          break;
        case "in":
          // Parse array value
          const inValues = Array.isArray(value) ? value : JSON.parse(value);
          query = query.in(column, inValues);
          break;
      }
    }

    // Apply sorting
    if (sortColumn) {
      query = query.order(sortColumn, { ascending: sortDirection === "asc" });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Data fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// POST - Insert new row
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

    const supabase = createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase.from(table).insert(body).select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: data?.[0], success: true });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json(
      {
        error: "Failed to insert data",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// PATCH - Update row(s)
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

    const supabase = createAdminClient();
    const body = await request.json();

    const { id, primaryKey = "id", updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { error: "Missing id or updates in request body" },
        { status: 400 }
      );
    }

    // Validate primary key column name
    if (!validateColumnName(primaryKey)) {
      return NextResponse.json(
        { error: "Invalid primary key column name" },
        { status: 400 }
      );
    }

    // @ts-expect-error - Supabase TypeScript has deep instantiation issues with dynamic table names after validation
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(primaryKey, id)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: data?.[0], success: true });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update data",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete row(s)
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

    const supabase = createAdminClient();
    const body = await request.json();

    const { ids, primaryKey = "id" } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid ids in request body" },
        { status: 400 }
      );
    }

    // Validate primary key column name
    if (!validateColumnName(primaryKey)) {
      return NextResponse.json(
        { error: "Invalid primary key column name" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from(table).delete().in(primaryKey, ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete data",
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
