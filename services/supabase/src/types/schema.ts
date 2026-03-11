export interface TableInfo {
  table_name: string;
  table_schema: string;
  row_count: number;
  column_count: number | null;
  table_comment?: string | null;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  ordinal_position: number;
  column_comment: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table_name: string | null;
  foreign_column_name: string | null;
}

export interface ForeignKey {
  constraint_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

// Import RLSPolicy from rls.ts to avoid duplication
import type { RLSPolicy } from "./rls";

export interface TableDetails {
  table_name: string;
  row_count: number;
  columns: ColumnInfo[];
  foreign_keys: ForeignKey[];
  policies: RLSPolicy[];
  rls_enabled: boolean;
}

export interface SimilarTable {
  table1: string;
  table2: string;
  similarity_percent: number;
  shared_columns: string[];
}

// Backup types
export type BackupType = "schema" | "data" | "full";

export interface BackupOptions {
  tables: string[];
  backupType: BackupType;
  includeDropStatements: boolean;
  includeConstraints: boolean;
}

export interface BackupResult {
  sql: string;
  tables: string[];
  backupType: BackupType;
  timestamp: string;
  size: number;
}

// Performance types
export interface TableSize {
  table_name: string;
  total_size: string;
  data_size: string;
  index_size: string;
  row_count: number;
  total_bytes: number;
}

export interface SlowQuery {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
  query_id: string;
}

export interface IndexSuggestion {
  table_name: string;
  column_name: string;
  reason: string;
  suggestion: string;
}

export interface ExplainResult {
  plan: string;
  execution_time?: number;
  planning_time?: number;
}

export interface PerformanceMetrics {
  tableSizes: TableSize[];
  slowQueries: SlowQuery[];
  indexSuggestions: IndexSuggestion[];
  databaseSize: string;
  activeConnections: number;
}
