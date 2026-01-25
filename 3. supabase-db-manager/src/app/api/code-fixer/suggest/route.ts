import { NextResponse } from 'next/server';
import type { CodeIssue, FixSuggestion, SuggestRequest } from '@/types/code-fixer';

export const dynamic = 'force-dynamic';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a TypeScript/React code fixer expert. Given a code issue and its context, provide a precise fix.

RULES:
1. Only fix the specific issue mentioned - do NOT refactor unrelated code
2. Preserve the existing code style (indentation, quotes, semicolons)
3. Return ONLY the fixed code snippet, not the entire file
4. If the fix requires adding imports, include them
5. Explain briefly why the fix works

OUTPUT FORMAT (valid JSON only):
{
  "fixedCode": "the fixed code snippet that replaces the problematic code",
  "explanation": "brief explanation of what was wrong and how the fix addresses it",
  "confidence": 85
}

IMPORTANT:
- confidence should be 0-100 based on how certain you are the fix is correct
- fixedCode should be a drop-in replacement for the problematic lines
- Do NOT include markdown formatting or code blocks in the JSON values`;

function buildPrompt(issue: CodeIssue, fileContent: string): string {
  const lines = fileContent.split('\n');
  const startLine = Math.max(0, issue.line - 10);
  const endLine = Math.min(lines.length, issue.line + 10);
  const contextLines = lines.slice(startLine, endLine);

  // Mark the problematic line
  const markedContext = contextLines.map((line, i) => {
    const lineNum = startLine + i + 1;
    const marker = lineNum === issue.line ? ' >>> ' : '     ';
    return `${lineNum}${marker}${line}`;
  }).join('\n');

  return `
FILE: ${issue.relativePath}
PROBLEM LINE: ${issue.line}

ISSUE DETAILS:
- Category: ${issue.category}
- Severity: ${issue.severity}
- Rule: ${issue.rule || 'N/A'}
- Message: ${issue.message}

CODE CONTEXT (line ${issue.line} marked with >>>):
\`\`\`typescript
${markedContext}
\`\`\`

FULL FILE FOR REFERENCE:
\`\`\`typescript
${fileContent}
\`\`\`

Generate a JSON response with the fix for line ${issue.line}.
`.trim();
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body: SuggestRequest = await request.json();
    const { issueId, issue, fileContent } = body;

    if (!issue || !fileContent) {
      return NextResponse.json(
        { error: 'Missing required fields: issue, fileContent' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(issue, fileContent);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get fix suggestion from AI' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 502 }
      );
    }

    // Parse JSON from Claude's response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 502 }
      );
    }

    const suggestion: FixSuggestion = {
      issueId,
      originalCode: issue.codeSnippet,
      fixedCode: parsed.fixedCode || '',
      explanation: parsed.explanation || 'No explanation provided',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
    };

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('POST /api/code-fixer/suggest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
