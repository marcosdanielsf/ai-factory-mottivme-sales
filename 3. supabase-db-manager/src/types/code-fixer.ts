// Types for the Self-Healing Code Fixer

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory = 'typescript' | 'eslint' | 'react' | 'security' | 'custom';
export type IssueStatus = 'open' | 'fixing' | 'fixed' | 'ignored';

export interface CodeIssue {
  id: string;
  filePath: string;
  relativePath: string; // Path relative to src/
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  category: IssueCategory;
  severity: IssueSeverity;
  rule?: string; // ESLint rule or TS error code
  codeSnippet: string; // Context around the issue
  status: IssueStatus;
  detectedAt: string;
}

export interface FixSuggestion {
  issueId: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: number; // 0-100
  appliedAt?: string;
}

export interface AnalysisResult {
  issues: CodeIssue[];
  filesAnalyzed: number;
  analysisTime: number;
  lastAnalysis: string;
  errors?: string[];
}

export interface FixHistory {
  id: string;
  issue: CodeIssue;
  suggestion: FixSuggestion;
  appliedAt: string;
  appliedBy: 'user' | 'auto';
  reverted: boolean;
  backupContent?: string;
}

export interface AnalysisOptions {
  paths?: string[];
  forceRefresh?: boolean;
  categories?: IssueCategory[];
}

export interface CustomRule {
  id: string;
  name: string;
  category: IssueCategory;
  severity: IssueSeverity;
  pattern: RegExp;
  message: string;
  suggestion: string;
  fileExtensions?: string[];
  excludePaths?: string[];
}

// API Request/Response types
export interface AnalyzeRequest {
  filePath?: string;
  options?: AnalysisOptions;
}

export interface SuggestRequest {
  issueId: string;
  issue: CodeIssue;
  fileContent: string;
}

export interface ApplyRequest {
  issueId: string;
  filePath: string;
  originalCode: string;
  fixedCode: string;
  confirmed: boolean;
}

export interface ApplyResponse {
  success: boolean;
  newContent?: string;
  backupPath?: string;
  error?: string;
}
