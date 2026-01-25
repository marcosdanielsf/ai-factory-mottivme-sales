"use client";

import { useCallback, useRef, useEffect } from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function QueryEditor({
  value,
  onChange,
  onExecute,
  isLoading,
  disabled = false,
}: QueryEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Configure SQL language settings
      monaco.languages.registerCompletionItemProvider("sql", {
        provideCompletionItems: (model: editor.ITextModel, position: Monaco["Position"]["prototype"]) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = [
            // Keywords
            ...["SELECT", "FROM", "WHERE", "AND", "OR", "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "ON", "AS", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "INDEX", "PRIMARY KEY", "FOREIGN KEY", "REFERENCES", "NOT NULL", "DEFAULT", "UNIQUE", "CASCADE", "RESTRICT", "WITH", "CASE", "WHEN", "THEN", "ELSE", "END", "IS NULL", "IS NOT NULL", "IN", "NOT IN", "LIKE", "ILIKE", "BETWEEN", "EXISTS", "UNION", "INTERSECT", "EXCEPT"].map((keyword) => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range,
            })),
            // Functions
            ...["NOW()", "CURRENT_TIMESTAMP", "CURRENT_DATE", "COALESCE", "NULLIF", "CAST", "TO_CHAR", "TO_DATE", "EXTRACT", "DATE_TRUNC", "CONCAT", "SUBSTRING", "TRIM", "UPPER", "LOWER", "LENGTH", "REPLACE", "SPLIT_PART", "ARRAY_AGG", "JSON_AGG", "JSONB_AGG", "ROW_NUMBER() OVER", "RANK() OVER", "DENSE_RANK() OVER", "LAG", "LEAD", "FIRST_VALUE", "LAST_VALUE"].map((func) => ({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func,
              range,
            })),
          ];

          return { suggestions };
        },
      });

      // Add keyboard shortcut for execution
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (!isLoading && !disabled) {
          onExecute();
        }
      });

      // Focus the editor
      editor.focus();
    },
    [isLoading, disabled, onExecute]
  );

  // Update keyboard shortcut when dependencies change
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const monaco = monacoRef.current;
      const editor = editorRef.current;

      // Re-add command with updated callback
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (!isLoading && !disabled) {
          onExecute();
        }
      });
    }
  }, [isLoading, disabled, onExecute]);

  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue || "");
    },
    [onChange]
  );

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">SQL Query</span>
          <span className="text-xs text-muted-foreground">
            Press Cmd+Enter to execute
          </span>
        </div>
        <Button
          onClick={onExecute}
          disabled={isLoading || disabled || !value.trim()}
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Query
            </>
          )}
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "JetBrains Mono, Menlo, Monaco, monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
