import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { CodeIssue, AnalysisResult, IssueCategory } from '@/types/code-fixer';
import { customRules } from './rules';

const execAsync = promisify(exec);

const PROJECT_ROOT = process.cwd();
const SRC_PATH = path.join(PROJECT_ROOT, 'src');

// Generate unique ID for issues
function generateId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract code snippet around a line
async function extractCodeSnippet(
  filePath: string,
  line: number,
  contextLines: number = 3
): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const startLine = Math.max(0, line - contextLines - 1);
    const endLine = Math.min(lines.length, line + contextLines);
    return lines.slice(startLine, endLine).join('\n');
  } catch {
    return '';
  }
}

// Parse TypeScript compiler output
function parseTscOutput(output: string): Omit<CodeIssue, 'codeSnippet'>[] {
  const issues: Omit<CodeIssue, 'codeSnippet'>[] = [];
  const lines = output.split('\n');

  // TSC output format: src/file.ts(line,col): error TS1234: message
  const tscRegex = /^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(tscRegex);
    if (match) {
      const [, filePath, lineNum, col, severity, code, message] = match;

      // Only include files in src/
      if (!filePath.startsWith('src/') && !filePath.startsWith('./src/')) continue;

      issues.push({
        id: generateId(),
        filePath: path.resolve(PROJECT_ROOT, filePath),
        relativePath: filePath.replace(/^\.?\/?(src\/)?/, 'src/'),
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        message,
        category: 'typescript',
        severity: severity === 'error' ? 'error' : 'warning',
        rule: code,
        status: 'open',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return issues;
}

// Parse ESLint JSON output
function parseEslintOutput(output: string): Omit<CodeIssue, 'codeSnippet'>[] {
  const issues: Omit<CodeIssue, 'codeSnippet'>[] = [];

  try {
    const results = JSON.parse(output);

    for (const file of results) {
      // Only include files in src/
      if (!file.filePath.includes('/src/')) continue;

      for (const msg of file.messages) {
        issues.push({
          id: generateId(),
          filePath: file.filePath,
          relativePath: file.filePath.split('/src/').pop() ? `src/${file.filePath.split('/src/').pop()}` : file.filePath,
          line: msg.line || 1,
          column: msg.column || 1,
          endLine: msg.endLine,
          endColumn: msg.endColumn,
          message: msg.message,
          category: 'eslint',
          severity: msg.severity === 2 ? 'error' : 'warning',
          rule: msg.ruleId || undefined,
          status: 'open',
          detectedAt: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Failed to parse ESLint output
  }

  return issues;
}

// Run TypeScript compiler analysis
export async function runTypeScriptAnalysis(): Promise<CodeIssue[]> {
  try {
    // Run tsc with noEmit to check for errors without building
    const { stderr } = await execAsync('npx tsc --noEmit --pretty false 2>&1 || true', {
      cwd: PROJECT_ROOT,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const partialIssues = parseTscOutput(stderr);

    // Add code snippets
    const issues: CodeIssue[] = await Promise.all(
      partialIssues.map(async (issue) => ({
        ...issue,
        codeSnippet: await extractCodeSnippet(issue.filePath, issue.line),
      }))
    );

    return issues;
  } catch (error) {
    console.error('TypeScript analysis failed:', error);
    return [];
  }
}

// Run ESLint analysis
export async function runESLintAnalysis(): Promise<CodeIssue[]> {
  try {
    const { stdout } = await execAsync(
      'npx eslint src/ --format json --max-warnings 999 2>/dev/null || true',
      {
        cwd: PROJECT_ROOT,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const partialIssues = parseEslintOutput(stdout);

    // Add code snippets
    const issues: CodeIssue[] = await Promise.all(
      partialIssues.map(async (issue) => ({
        ...issue,
        codeSnippet: await extractCodeSnippet(issue.filePath, issue.line),
      }))
    );

    return issues;
  } catch (error) {
    console.error('ESLint analysis failed:', error);
    return [];
  }
}

// Run custom rules on a file
export async function runCustomRulesOnFile(filePath: string): Promise<CodeIssue[]> {
  const issues: CodeIssue[] = [];

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const ext = path.extname(filePath);

    for (const rule of customRules) {
      // Check file extension filter
      if (rule.fileExtensions && !rule.fileExtensions.includes(ext)) continue;

      // Check exclude paths
      if (rule.excludePaths?.some(p => filePath.includes(p))) continue;

      // Apply regex pattern
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags + 'g');

      while ((match = regex.exec(content)) !== null) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        issues.push({
          id: generateId(),
          filePath,
          relativePath: filePath.split('/src/').pop() ? `src/${filePath.split('/src/').pop()}` : filePath,
          line: lineNumber,
          column: match.index - beforeMatch.lastIndexOf('\n'),
          message: rule.message,
          category: rule.category,
          severity: rule.severity,
          rule: rule.id,
          codeSnippet: lines.slice(Math.max(0, lineNumber - 3), lineNumber + 3).join('\n'),
          status: 'open',
          detectedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error(`Custom rules failed for ${filePath}:`, error);
  }

  return issues;
}

// Get all TypeScript/JavaScript files in src/
async function getSourceFiles(dir: string = SRC_PATH): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and .next
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        files.push(...await getSourceFiles(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${dir}:`, error);
  }

  return files;
}

// Run custom rules on all source files
export async function runCustomRulesAnalysis(): Promise<CodeIssue[]> {
  const files = await getSourceFiles();
  const allIssues: CodeIssue[] = [];

  for (const file of files) {
    const issues = await runCustomRulesOnFile(file);
    allIssues.push(...issues);
  }

  return allIssues;
}

// Main analysis function
export async function analyzeProject(
  categories?: IssueCategory[]
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const allIssues: CodeIssue[] = [];
  const errors: string[] = [];

  const runAll = !categories || categories.length === 0;

  // Run analyses in parallel
  const analyses: Promise<CodeIssue[]>[] = [];

  if (runAll || categories?.includes('typescript')) {
    analyses.push(
      runTypeScriptAnalysis().catch((e) => {
        errors.push(`TypeScript: ${e.message}`);
        return [];
      })
    );
  }

  if (runAll || categories?.includes('eslint')) {
    analyses.push(
      runESLintAnalysis().catch((e) => {
        errors.push(`ESLint: ${e.message}`);
        return [];
      })
    );
  }

  if (runAll || categories?.includes('react') || categories?.includes('security') || categories?.includes('custom')) {
    analyses.push(
      runCustomRulesAnalysis().catch((e) => {
        errors.push(`Custom rules: ${e.message}`);
        return [];
      })
    );
  }

  const results = await Promise.all(analyses);
  for (const issues of results) {
    allIssues.push(...issues);
  }

  // Deduplicate by file+line+message
  const seen = new Set<string>();
  const uniqueIssues = allIssues.filter((issue) => {
    const key = `${issue.relativePath}:${issue.line}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity then file then line
  uniqueIssues.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    if (a.relativePath !== b.relativePath) {
      return a.relativePath.localeCompare(b.relativePath);
    }
    return a.line - b.line;
  });

  const files = await getSourceFiles();

  return {
    issues: uniqueIssues,
    filesAnalyzed: files.length,
    analysisTime: Date.now() - startTime,
    lastAnalysis: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Analyze a single file
export async function analyzeFile(filePath: string): Promise<CodeIssue[]> {
  const fullPath = filePath.startsWith('/') ? filePath : path.join(PROJECT_ROOT, filePath);

  // Verify file is in src/
  if (!fullPath.includes('/src/')) {
    throw new Error('Can only analyze files in src/ directory');
  }

  return runCustomRulesOnFile(fullPath);
}

// Read file content safely
export async function readFileContent(filePath: string): Promise<string> {
  const fullPath = filePath.startsWith('/') ? filePath : path.join(PROJECT_ROOT, filePath);

  // Security: Only allow reading files in src/
  if (!fullPath.includes('/src/')) {
    throw new Error('Can only read files in src/ directory');
  }

  return fs.readFile(fullPath, 'utf-8');
}

// Write file content safely with backup
export async function writeFileContent(
  filePath: string,
  content: string
): Promise<{ backupPath?: string }> {
  const fullPath = filePath.startsWith('/') ? filePath : path.join(PROJECT_ROOT, filePath);

  // Security: Only allow writing files in src/
  if (!fullPath.includes('/src/')) {
    throw new Error('Can only write files in src/ directory');
  }

  // Create backup
  const timestamp = Date.now();
  const backupDir = path.join(PROJECT_ROOT, '.code-fixer-backups');
  const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.backup`);

  try {
    await fs.mkdir(backupDir, { recursive: true });
    const originalContent = await fs.readFile(fullPath, 'utf-8');
    await fs.writeFile(backupPath, originalContent);
  } catch {
    // Backup failed, continue anyway
  }

  await fs.writeFile(fullPath, content);

  return { backupPath };
}
