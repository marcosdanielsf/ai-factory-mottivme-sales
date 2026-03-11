import { NextResponse } from 'next/server';
import { readFileContent, writeFileContent } from '@/lib/code-fixer/analyzer';
import type { ApplyRequest, ApplyResponse } from '@/types/code-fixer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: ApplyRequest = await request.json();
    const { issueId, filePath, originalCode, fixedCode, confirmed } = body;

    // Validate required fields
    if (!filePath || !fixedCode) {
      return NextResponse.json(
        { error: 'Missing required fields: filePath, fixedCode' },
        { status: 400 }
      );
    }

    // Require confirmation for safety
    if (!confirmed) {
      return NextResponse.json(
        {
          error: 'Confirmation required',
          requiresConfirmation: true,
          message: 'Please confirm before applying the fix'
        },
        { status: 400 }
      );
    }

    // Security: Validate file path
    if (!filePath.includes('/src/') && !filePath.startsWith('src/')) {
      return NextResponse.json(
        { error: 'Can only modify files in src/ directory' },
        { status: 403 }
      );
    }

    // Read current file content
    let currentContent: string;
    try {
      currentContent = await readFileContent(filePath);
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to read file: ${filePath}` },
        { status: 404 }
      );
    }

    // Apply the fix
    // Strategy: Replace the original code snippet with the fixed code
    let newContent: string;

    if (originalCode && currentContent.includes(originalCode.trim())) {
      // Direct replacement if original code is found
      newContent = currentContent.replace(originalCode.trim(), fixedCode.trim());
    } else {
      // If original code not found exactly, try line-based replacement
      // This is a fallback - less precise but more forgiving
      const lines = currentContent.split('\n');

      // Try to find a line that roughly matches
      let replaced = false;
      const fixedLines = fixedCode.trim().split('\n');

      // Simple heuristic: if fixedCode is similar length, replace around the issue line
      // For now, just append a comment indicating manual intervention needed
      console.warn(`Could not find exact match for replacement in ${filePath}`);

      // Fall back to writing the fixed code as provided
      // (This assumes fixedCode is the complete fixed version of the relevant section)
      newContent = currentContent;

      // For safety, don't modify if we can't find the exact match
      return NextResponse.json(
        {
          error: 'Could not find exact code to replace. Manual intervention required.',
          originalCode: originalCode?.substring(0, 200),
          suggestion: fixedCode,
        },
        { status: 400 }
      );
    }

    // Write the new content
    const { backupPath } = await writeFileContent(filePath, newContent);

    const response: ApplyResponse = {
      success: true,
      newContent,
      backupPath,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('POST /api/code-fixer/apply error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply fix'
      },
      { status: 500 }
    );
  }
}
