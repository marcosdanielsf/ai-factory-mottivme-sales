-- =====================================================
-- DB Manager Helper Functions
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Function to execute arbitrary SQL (USE WITH CAUTION - admin only)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to get all tables with metadata
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE (
  table_name text,
  table_schema text,
  row_count bigint,
  column_count bigint,
  table_comment text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.table_name::text,
    t.table_schema::text,
    COALESCE(pg_stat.n_live_tup, 0)::bigint as row_count,
    (
      SELECT COUNT(*)
      FROM information_schema.columns c
      WHERE c.table_name = t.table_name
      AND c.table_schema = t.table_schema
    )::bigint as column_count,
    obj_description((t.table_schema || '.' || t.table_name)::regclass, 'pg_class')::text as table_comment
  FROM information_schema.tables t
  LEFT JOIN pg_stat_user_tables pg_stat
    ON pg_stat.schemaname = t.table_schema
    AND pg_stat.relname = t.table_name
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Function to get columns for a specific table
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  udt_name text,
  is_nullable text,
  column_default text,
  character_maximum_length integer,
  numeric_precision integer,
  ordinal_position integer,
  column_comment text,
  is_primary_key boolean,
  is_foreign_key boolean,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.udt_name::text,
    c.is_nullable::text,
    c.column_default::text,
    c.character_maximum_length::integer,
    c.numeric_precision::integer,
    c.ordinal_position::integer,
    col_description(('public.' || c.table_name)::regclass, c.ordinal_position)::text as column_comment,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
    CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
    fk.foreign_table_name::text,
    fk.foreign_column_name::text
  FROM information_schema.columns c
  LEFT JOIN (
    SELECT kcu.column_name, kcu.table_name, kcu.table_schema
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
  ) pk ON pk.column_name = c.column_name
    AND pk.table_name = c.table_name
    AND pk.table_schema = c.table_schema
  LEFT JOIN (
    SELECT
      kcu.column_name,
      kcu.table_name,
      kcu.table_schema,
      ccu.table_name as foreign_table_name,
      ccu.column_name as foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
  ) fk ON fk.column_name = c.column_name
    AND fk.table_name = c.table_name
    AND fk.table_schema = c.table_schema
  WHERE c.table_schema = 'public' AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$$;

-- Function to get foreign keys for a table
CREATE OR REPLACE FUNCTION get_foreign_keys(p_table_name text)
RETURNS TABLE (
  constraint_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    tc.constraint_name::text,
    kcu.column_name::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = p_table_name;
$$;

-- Function to get RLS policies for a table
CREATE OR REPLACE FUNCTION get_rls_policies(p_table_name text)
RETURNS TABLE (
  policy_name text,
  command text,
  is_permissive boolean,
  using_expression text,
  check_expression text,
  roles text[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pol.polname::text as policy_name,
    pol.polcmd::text as command,
    pol.polpermissive as is_permissive,
    pg_get_expr(pol.polqual, pol.polrelid)::text as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid)::text as check_expression,
    ARRAY(
      SELECT rolname::text
      FROM pg_roles
      WHERE oid = ANY(pol.polroles)
    ) as roles
  FROM pg_policy pol
  JOIN pg_class pc ON pc.oid = pol.polrelid
  WHERE pc.relname = p_table_name;
$$;

-- Function to check if RLS is enabled
CREATE OR REPLACE FUNCTION check_rls_enabled(p_table_name text)
RETURNS TABLE (
  rls_enabled boolean,
  rls_forced boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
  FROM pg_class
  WHERE relname = p_table_name;
$$;

-- Function to detect similar tables (by column names)
CREATE OR REPLACE FUNCTION detect_similar_tables()
RETURNS TABLE (
  table1 text,
  table2 text,
  similarity_percent numeric,
  shared_columns text[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH table_columns AS (
    SELECT
      table_name,
      array_agg(column_name ORDER BY column_name) as columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
  )
  SELECT
    t1.table_name::text as table1,
    t2.table_name::text as table2,
    ROUND(
      (
        SELECT COUNT(*)
        FROM unnest(t1.columns) c1
        WHERE c1 = ANY(t2.columns)
      )::numeric /
      GREATEST(array_length(t1.columns, 1), array_length(t2.columns, 1)) * 100
    ) as similarity_percent,
    (
      SELECT array_agg(c1)
      FROM unnest(t1.columns) c1
      WHERE c1 = ANY(t2.columns)
    ) as shared_columns
  FROM table_columns t1
  CROSS JOIN table_columns t2
  WHERE t1.table_name < t2.table_name
  AND (
    SELECT COUNT(*)
    FROM unnest(t1.columns) c1
    WHERE c1 = ANY(t2.columns)
  )::numeric / GREATEST(array_length(t1.columns, 1), array_length(t2.columns, 1)) > 0.3
  ORDER BY similarity_percent DESC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION get_schema_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION get_foreign_keys TO authenticated;
GRANT EXECUTE ON FUNCTION get_rls_policies TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION detect_similar_tables TO authenticated;

-- Also grant to service_role
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
GRANT EXECUTE ON FUNCTION get_schema_info TO service_role;
GRANT EXECUTE ON FUNCTION get_table_columns TO service_role;
GRANT EXECUTE ON FUNCTION get_foreign_keys TO service_role;
GRANT EXECUTE ON FUNCTION get_rls_policies TO service_role;
GRANT EXECUTE ON FUNCTION check_rls_enabled TO service_role;
GRANT EXECUTE ON FUNCTION detect_similar_tables TO service_role;
