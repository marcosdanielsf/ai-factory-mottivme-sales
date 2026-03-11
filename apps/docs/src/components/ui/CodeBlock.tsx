import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  copyable?: boolean;
  className?: string;
}

// Minimal syntax highlighting without external deps
// Can be enhanced with shiki later
const tokenize = (code: string, language: string): React.ReactNode[][] => {
  const keywords: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'new', 'this', 'true', 'false', 'null', 'undefined'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'new', 'this', 'true', 'false', 'null', 'undefined', 'interface', 'type', 'enum'],
    python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'return', 'try', 'except', 'with', 'as', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'async', 'await'],
    bash: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'export', 'source', 'echo', 'cd', 'ls', 'cat', 'grep', 'curl'],
    json: [],
    yaml: [],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET'],
  };

  const langKeywords = keywords[language] || [];

  return code.split('\n').map((line, lineIndex) => {
    const result: React.ReactNode[] = [];
    let keyIndex = 0;

    // Simple tokenization
    const tokens = line.split(/(\s+|[{}()\[\];,.:'"=<>])/);
    
    tokens.forEach((token) => {
      if (!token) return;
      
      // Strings
      if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
        result.push(<span key={`${lineIndex}-${keyIndex++}`} className="text-green-400">{token}</span>);
      }
      // Keywords
      else if (langKeywords.includes(token)) {
        result.push(<span key={`${lineIndex}-${keyIndex++}`} className="text-purple-400">{token}</span>);
      }
      // Numbers
      else if (/^\d+\.?\d*$/.test(token)) {
        result.push(<span key={`${lineIndex}-${keyIndex++}`} className="text-amber-400">{token}</span>);
      }
      // Comments (simple detection)
      else if (token.startsWith('//') || token.startsWith('#')) {
        result.push(<span key={`${lineIndex}-${keyIndex++}`} className="text-gray-500">{token}</span>);
      }
      // Default
      else {
        result.push(<span key={`${lineIndex}-${keyIndex++}`}>{token}</span>);
      }
    });

    return result;
  });
};

export function CodeBlock({ 
  code, 
  language = 'plaintext',
  title,
  showLineNumbers = false,
  copyable = true,
  className = '' 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tokenizedLines = tokenize(code, language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-lg overflow-hidden border border-white/10 ${className}`}>
      {/* Header */}
      {(title || copyable) && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm text-gray-400 font-mono">{title}</span>
            )}
            {language && language !== 'plaintext' && (
              <span className="text-xs text-gray-500 uppercase">{language}</span>
            )}
          </div>
          {copyable && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div className="bg-[#0d0d0d] overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code>
            {tokenizedLines.map((line, i) => (
              <div key={i} className="flex">
                {showLineNumbers && (
                  <span className="select-none text-gray-600 w-8 text-right mr-4 flex-shrink-0">
                    {i + 1}
                  </span>
                )}
                <span className="text-gray-200">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
