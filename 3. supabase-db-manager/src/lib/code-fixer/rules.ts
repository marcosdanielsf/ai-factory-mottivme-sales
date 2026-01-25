import type { CustomRule } from '@/types/code-fixer';

export const customRules: CustomRule[] = [
  // React Rules
  {
    id: 'react-missing-key-map',
    name: 'React Missing Key in Map',
    category: 'react',
    severity: 'warning',
    pattern: /\.map\(\s*\([^)]*\)\s*=>\s*(?:<[A-Z][^>]*(?!key=)[^>]*>|<[a-z][^>]*(?!key=)[^>]*>)/,
    message: 'Array elements in .map() should have a unique "key" prop',
    suggestion: 'Add key={uniqueId} or key={index} to the returned element',
    fileExtensions: ['.tsx', '.jsx'],
  },
  {
    id: 'react-missing-key-simple',
    name: 'React Missing Key Pattern',
    category: 'react',
    severity: 'warning',
    pattern: /\{[^}]*\.map\([^)]+\)\s*\}/,
    message: 'Ensure all .map() returns have unique key props',
    suggestion: 'Verify key={uniqueId} is present on mapped elements',
    fileExtensions: ['.tsx', '.jsx'],
  },
  {
    id: 'react-index-as-key',
    name: 'React Index as Key',
    category: 'react',
    severity: 'info',
    pattern: /key=\{(?:i|index|idx)\}/,
    message: 'Using index as key can cause issues with reordering',
    suggestion: 'Use a stable unique identifier if the list can be reordered',
    fileExtensions: ['.tsx', '.jsx'],
  },

  // Security Rules
  {
    id: 'security-dangerous-html',
    name: 'Dangerous HTML',
    category: 'security',
    severity: 'error',
    pattern: /dangerouslySetInnerHTML/,
    message: 'dangerouslySetInnerHTML can cause XSS vulnerabilities',
    suggestion: 'Sanitize HTML using DOMPurify or similar library, or use safe alternatives',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },
  {
    id: 'security-eval-usage',
    name: 'Eval Usage',
    category: 'security',
    severity: 'error',
    pattern: /\beval\s*\(/,
    message: 'eval() is dangerous and can execute arbitrary code',
    suggestion: 'Use JSON.parse() or other safe alternatives',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },
  {
    id: 'security-new-function',
    name: 'Dynamic Function Creation',
    category: 'security',
    severity: 'error',
    pattern: /new\s+Function\s*\(/,
    message: 'new Function() can execute arbitrary code like eval()',
    suggestion: 'Use predefined functions or safer alternatives',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },
  {
    id: 'security-hardcoded-secret',
    name: 'Hardcoded Secret',
    category: 'security',
    severity: 'error',
    pattern: /(?:password|secret|api_?key|token)\s*[:=]\s*["'][^"']{8,}["']/i,
    message: 'Possible hardcoded secret detected',
    suggestion: 'Move secrets to environment variables',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
    excludePaths: ['.test.', '.spec.', '__tests__', '__mocks__'],
  },
  {
    id: 'security-console-log-sensitive',
    name: 'Console Log with Sensitive Data',
    category: 'security',
    severity: 'warning',
    pattern: /console\.log\([^)]*(?:password|secret|token|key|credential)[^)]*\)/i,
    message: 'Logging potentially sensitive data',
    suggestion: 'Remove console.log or redact sensitive information',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },
  {
    id: 'security-exposed-env',
    name: 'Non-Public Env in Client',
    category: 'security',
    severity: 'error',
    pattern: /process\.env\.(?!NEXT_PUBLIC_)[A-Z_]+/,
    message: 'Server-side env variable might be exposed in client code',
    suggestion: 'Use NEXT_PUBLIC_ prefix for client-side env vars or move to server component',
    fileExtensions: ['.tsx', '.jsx'],
    excludePaths: ['/api/', '/lib/', 'server'],
  },

  // TypeScript Best Practices
  {
    id: 'ts-any-usage',
    name: 'Any Type Usage',
    category: 'typescript',
    severity: 'warning',
    pattern: /:\s*any\b/,
    message: 'Avoid using "any" type - it defeats TypeScript benefits',
    suggestion: 'Use a specific type, "unknown", or generic type',
    fileExtensions: ['.tsx', '.ts'],
  },
  {
    id: 'ts-non-null-assertion',
    name: 'Non-Null Assertion',
    category: 'typescript',
    severity: 'info',
    pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*!/,
    message: 'Non-null assertion (!) bypasses TypeScript null checks',
    suggestion: 'Use optional chaining (?.) or proper null checks',
    fileExtensions: ['.tsx', '.ts'],
  },
  {
    id: 'ts-as-any-cast',
    name: 'Cast to Any',
    category: 'typescript',
    severity: 'warning',
    pattern: /as\s+any\b/,
    message: 'Casting to "any" bypasses type safety',
    suggestion: 'Use a more specific type or type guard',
    fileExtensions: ['.tsx', '.ts'],
  },

  // Code Quality
  {
    id: 'quality-todo-fixme',
    name: 'TODO/FIXME Comment',
    category: 'custom',
    severity: 'info',
    pattern: /\/\/\s*(?:TODO|FIXME|HACK|XXX):/i,
    message: 'Unresolved TODO/FIXME comment',
    suggestion: 'Address the TODO or create a ticket to track it',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },
  {
    id: 'quality-console-log',
    name: 'Console Log',
    category: 'custom',
    severity: 'warning',
    pattern: /console\.(?:log|debug|info)\(/,
    message: 'console.log should be removed in production code',
    suggestion: 'Remove console.log or use a proper logging library',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
    excludePaths: ['.test.', '.spec.', '__tests__'],
  },
  {
    id: 'quality-debugger',
    name: 'Debugger Statement',
    category: 'custom',
    severity: 'error',
    pattern: /\bdebugger\b/,
    message: 'debugger statement should not be in production code',
    suggestion: 'Remove the debugger statement',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },
  {
    id: 'quality-empty-catch',
    name: 'Empty Catch Block',
    category: 'custom',
    severity: 'warning',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    message: 'Empty catch block silently swallows errors',
    suggestion: 'Log the error or handle it appropriately',
    fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
  },

  // Next.js Specific
  {
    id: 'nextjs-missing-use-client',
    name: 'Missing use client',
    category: 'react',
    severity: 'info',
    pattern: /(?:useState|useEffect|useCallback|useMemo|useRef)\s*\(/,
    message: 'React hooks detected - ensure "use client" directive if needed',
    suggestion: 'Add "use client" at the top of the file if this is a client component',
    fileExtensions: ['.tsx'],
    excludePaths: ['/api/', 'layout.tsx', 'loading.tsx', 'error.tsx'],
  },

  // Performance
  {
    id: 'perf-inline-function-props',
    name: 'Inline Function in Props',
    category: 'react',
    severity: 'info',
    pattern: /(?:onClick|onChange|onSubmit|on[A-Z]\w+)=\{\s*\(\)\s*=>/,
    message: 'Inline arrow functions in props can cause unnecessary re-renders',
    suggestion: 'Extract to useCallback or define outside render',
    fileExtensions: ['.tsx', '.jsx'],
  },
  {
    id: 'perf-inline-object-props',
    name: 'Inline Object in Props',
    category: 'react',
    severity: 'info',
    pattern: /(?:style|className)=\{\s*\{/,
    message: 'Inline objects in props can cause unnecessary re-renders',
    suggestion: 'Extract to useMemo or define outside render',
    fileExtensions: ['.tsx', '.jsx'],
  },
];

// Get rules by category
export function getRulesByCategory(category: string): CustomRule[] {
  return customRules.filter(rule => rule.category === category);
}

// Get rule by ID
export function getRuleById(id: string): CustomRule | undefined {
  return customRules.find(rule => rule.id === id);
}

// Get all rule IDs
export function getAllRuleIds(): string[] {
  return customRules.map(rule => rule.id);
}
