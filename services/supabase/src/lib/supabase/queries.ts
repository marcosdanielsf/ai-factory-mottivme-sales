// SQL queries for schema introspection

export const QUERIES = {
  // List all tables with metadata
  LIST_TABLES: `
    SELECT
      t.table_name,
      t.table_schema,
      t.table_type,
      COALESCE(pg_stat.n_live_tup, 0) as row_count,
      (
        SELECT COUNT(*)
        FROM information_schema.columns c
        WHERE c.table_name = t.table_name
        AND c.table_schema = t.table_schema
      ) as column_count,
      obj_description((t.table_schema || '.' || t.table_name)::regclass, 'pg_class') as table_comment
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables pg_stat
      ON pg_stat.schemaname = t.table_schema
      AND pg_stat.relname = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `,

  // Get columns for a specific table
  GET_TABLE_COLUMNS: `
    SELECT
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      c.ordinal_position,
      col_description((c.table_schema || '.' || c.table_name)::regclass, c.ordinal_position) as column_comment,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
      CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
      fk.foreign_table_name,
      fk.foreign_column_name
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
    WHERE c.table_schema = $1 AND c.table_name = $2
    ORDER BY c.ordinal_position
  `,

  // Get foreign keys for a table
  GET_FOREIGN_KEYS: `
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = $1
      AND tc.table_name = $2
  `,

  // Get indexes for a table
  GET_INDEXES: `
    SELECT
      i.relname as index_name,
      a.attname as column_name,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relkind = 'r'
      AND t.relname = $1
    ORDER BY i.relname, a.attnum
  `,

  // Get RLS policies for a table
  GET_RLS_POLICIES: `
    SELECT
      pol.polname as policy_name,
      pol.polcmd as command,
      pol.polpermissive as is_permissive,
      pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
      pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expression,
      ARRAY(
        SELECT rolname
        FROM pg_roles
        WHERE oid = ANY(pol.polroles)
      ) as roles
    FROM pg_policy pol
    JOIN pg_class pc ON pc.oid = pol.polrelid
    WHERE pc.relname = $1
  `,

  // Check if RLS is enabled on a table
  CHECK_RLS_ENABLED: `
    SELECT relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
    FROM pg_class
    WHERE relname = $1
  `,

  // Detect similar/duplicate tables
  DETECT_SIMILAR_TABLES: `
    WITH table_columns AS (
      SELECT
        table_name,
        array_agg(column_name ORDER BY column_name) as columns,
        array_agg(data_type ORDER BY column_name) as types
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY table_name
    )
    SELECT
      t1.table_name as table1,
      t2.table_name as table2,
      ROUND(
        (
          SELECT COUNT(*)
          FROM unnest(t1.columns) c1
          WHERE c1 = ANY(t2.columns)
        )::numeric /
        GREATEST(array_length(t1.columns, 1), array_length(t2.columns, 1)) * 100
      ) as similarity_percent
    FROM table_columns t1
    CROSS JOIN table_columns t2
    WHERE t1.table_name < t2.table_name
    AND (
      SELECT COUNT(*)
      FROM unnest(t1.columns) c1
      WHERE c1 = ANY(t2.columns)
    )::numeric / GREATEST(array_length(t1.columns, 1), array_length(t2.columns, 1)) > 0.5
    ORDER BY similarity_percent DESC
  `,
};
