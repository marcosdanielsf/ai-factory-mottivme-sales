import { NextResponse } from 'next/server';
import { analyzeProject, analyzeFile, readFileContent } from '@/lib/code-fixer/analyzer';
import type { AnalysisResult, IssueCategory } from '@/types/code-fixer';

export const dynamic = 'force-dynamic';

// In-memory cache for analysis results
let cachedResult: AnalysisResult | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET: Return cached issues or empty result
export async function GET() {
  try {
    const now = Date.now();
    const cacheValid = cachedResult && (now - cacheTimestamp) < CACHE_TTL;

    return NextResponse.json({
      issues: cachedResult?.issues || [],
      lastAnalysis: cachedResult?.lastAnalysis || null,
      cacheValid,
      filesAnalyzed: cachedResult?.filesAnalyzed || 0,
      analysisTime: cachedResult?.analysisTime || 0,
    });
  } catch (error) {
    console.error('GET /api/code-fixer error:', error);
    return NextResponse.json(
      { error: 'Failed to get issues' },
      { status: 500 }
    );
  }
}

// POST: Run full analysis
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paths, forceRefresh, categories, filePath } = body;

    // Single file analysis
    if (filePath) {
      const issues = await analyzeFile(filePath);
      const content = await readFileContent(filePath);

      return NextResponse.json({
        issues,
        fileContent: content,
      });
    }

    // Check cache unless force refresh
    const now = Date.now();
    if (!forceRefresh && cachedResult && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
      });
    }

    // Run full analysis
    const result = await analyzeProject(categories as IssueCategory[] | undefined);

    // Update cache
    cachedResult = result;
    cacheTimestamp = now;

    return NextResponse.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error('POST /api/code-fixer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
