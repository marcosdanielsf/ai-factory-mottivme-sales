"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Sparkles, Clock, FileCode, AlertCircle, Zap, Loader2 } from "lucide-react";
import { IssueList } from "@/components/code-fixer/issue-list";
import { FixPreview } from "@/components/code-fixer/fix-preview";
import type { CodeIssue, FixSuggestion, AnalysisResult } from "@/types/code-fixer";

export default function CodeFixerPage() {
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [suggestion, setSuggestion] = useState<FixSuggestion | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGettingFix, setIsGettingFix] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [gettingFixFor, setGettingFixFor] = useState<string | undefined>();
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [analysisTime, setAnalysisTime] = useState<number>(0);
  const [filesAnalyzed, setFilesAnalyzed] = useState<number>(0);

  // Fix All states
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [fixAllProgress, setFixAllProgress] = useState(0);
  const [fixAllTotal, setFixAllTotal] = useState(0);
  const [fixAllCurrent, setFixAllCurrent] = useState<string>("");
  const [fixAllResults, setFixAllResults] = useState<{ fixed: number; failed: number; skipped: number }>({ fixed: 0, failed: 0, skipped: 0 });
  const [showFixAllConfirm, setShowFixAllConfirm] = useState(false);
  const [showFixAllResults, setShowFixAllResults] = useState(false);

  // Load cached issues on mount
  useEffect(() => {
    fetchCachedIssues();
  }, []);

  const fetchCachedIssues = async () => {
    try {
      const res = await fetch("/api/code-fixer");
      const data = await res.json();

      if (data.issues) {
        setIssues(data.issues);
        setLastAnalysis(data.lastAnalysis);
        setFilesAnalyzed(data.filesAnalyzed || 0);
        setAnalysisTime(data.analysisTime || 0);
      }
    } catch (error) {
      console.error("Failed to fetch cached issues:", error);
    }
  };

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setSuggestion(null);
    setSelectedIssue(null);

    try {
      const res = await fetch("/api/code-fixer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh: true }),
      });

      const data: AnalysisResult = await res.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0]);
      }

      setIssues(data.issues);
      setLastAnalysis(data.lastAnalysis);
      setFilesAnalyzed(data.filesAnalyzed);
      setAnalysisTime(data.analysisTime);

      const errorCount = data.issues.filter((i) => i.severity === "error").length;
      const warningCount = data.issues.filter((i) => i.severity === "warning").length;

      if (data.issues.length === 0) {
        toast.success("No issues found!", {
          description: `Analyzed ${data.filesAnalyzed} files in ${data.analysisTime}ms`,
        });
      } else {
        toast.info(`Found ${data.issues.length} issues`, {
          description: `${errorCount} errors, ${warningCount} warnings`,
        });
      }
    } catch (error) {
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getFixSuggestion = useCallback(async (issue: CodeIssue) => {
    setIsGettingFix(true);
    setGettingFixFor(issue.id);
    setSuggestion(null);
    setSelectedIssue(issue);

    try {
      // First get the file content
      const fileRes = await fetch("/api/code-fixer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: issue.filePath }),
      });

      const fileData = await fileRes.json();

      if (!fileData.fileContent) {
        throw new Error("Could not read file content");
      }

      // Now get the fix suggestion
      const res = await fetch("/api/code-fixer/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          issue,
          fileContent: fileData.fileContent,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSuggestion(data.suggestion);
      toast.success("Fix suggestion ready", {
        description: `Confidence: ${data.suggestion.confidence}%`,
      });
    } catch (error) {
      toast.error("Failed to get fix", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsGettingFix(false);
      setGettingFixFor(undefined);
    }
  }, []);

  const applyFix = useCallback(async () => {
    if (!selectedIssue || !suggestion) return;

    setIsApplying(true);

    try {
      const res = await fetch("/api/code-fixer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: selectedIssue.id,
          filePath: selectedIssue.filePath,
          originalCode: suggestion.originalCode,
          fixedCode: suggestion.fixedCode,
          confirmed: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to apply fix");
      }

      toast.success("Fix applied!", {
        description: `Backup created at ${data.backupPath || "local backup"}`,
      });

      // Remove the fixed issue from the list
      setIssues((prev) => prev.filter((i) => i.id !== selectedIssue.id));
      setSelectedIssue(null);
      setSuggestion(null);
    } catch (error) {
      toast.error("Failed to apply fix", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsApplying(false);
    }
  }, [selectedIssue, suggestion]);

  const rejectSuggestion = useCallback(() => {
    setSuggestion(null);
    toast.info("Suggestion rejected");
  }, []);

  const ignoreIssue = useCallback((issue: CodeIssue) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issue.id
          ? { ...i, status: i.status === "ignored" ? "open" : "ignored" }
          : i
      )
    );
  }, []);

  // Fix All - processes all non-ignored issues
  const fixAll = useCallback(async () => {
    const issuesToFix = issues.filter((i) => i.status !== "ignored");

    if (issuesToFix.length === 0) {
      toast.info("No issues to fix");
      return;
    }

    setIsFixingAll(true);
    setFixAllTotal(issuesToFix.length);
    setFixAllProgress(0);
    setFixAllResults({ fixed: 0, failed: 0, skipped: 0 });
    setShowFixAllConfirm(false);

    const results = { fixed: 0, failed: 0, skipped: 0 };
    const fixedIssueIds: string[] = [];

    for (let i = 0; i < issuesToFix.length; i++) {
      const issue = issuesToFix[i];
      setFixAllProgress(i + 1);
      setFixAllCurrent(`${issue.relativePath}:${issue.line}`);

      try {
        // Get file content
        const fileRes = await fetch("/api/code-fixer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: issue.filePath }),
        });
        const fileData = await fileRes.json();

        if (!fileData.fileContent) {
          results.skipped++;
          continue;
        }

        // Get AI suggestion
        const suggestRes = await fetch("/api/code-fixer/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId: issue.id,
            issue,
            fileContent: fileData.fileContent,
          }),
        });
        const suggestData = await suggestRes.json();

        if (suggestData.error || !suggestData.suggestion) {
          results.failed++;
          continue;
        }

        // Only apply high-confidence fixes (>= 70%)
        if (suggestData.suggestion.confidence < 70) {
          results.skipped++;
          continue;
        }

        // Apply the fix
        const applyRes = await fetch("/api/code-fixer/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId: issue.id,
            filePath: issue.filePath,
            originalCode: suggestData.suggestion.originalCode,
            fixedCode: suggestData.suggestion.fixedCode,
            confirmed: true,
          }),
        });
        const applyData = await applyRes.json();

        if (applyData.success) {
          results.fixed++;
          fixedIssueIds.push(issue.id);
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Fix failed for ${issue.relativePath}:`, error);
        results.failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    // Update state
    setFixAllResults(results);
    setIsFixingAll(false);
    setShowFixAllResults(true);

    // Remove fixed issues from the list
    if (fixedIssueIds.length > 0) {
      setIssues((prev) => prev.filter((i) => !fixedIssueIds.includes(i.id)));
    }

    toast.success(`Fix All completed`, {
      description: `Fixed: ${results.fixed}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
    });
  }, [issues]);

  const activeIssues = issues.filter((i) => i.status !== "ignored");
  const errorCount = issues.filter((i) => i.severity === "error" && i.status !== "ignored").length;
  const warningCount = issues.filter((i) => i.severity === "warning" && i.status !== "ignored").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Code Fixer
          </h1>
          <p className="text-muted-foreground">
            AI-powered code analysis and automatic fixes
          </p>
        </div>

        <div className="flex items-center gap-4">
          {lastAnalysis && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Last: {new Date(lastAnalysis).toLocaleTimeString()}
              </span>
              <span>•</span>
              <FileCode className="h-4 w-4" />
              <span>{filesAnalyzed} files</span>
              <span>•</span>
              <span>{analysisTime}ms</span>
            </div>
          )}

          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`}
            />
            {isAnalyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-4">
          <Badge
            variant={errorCount > 0 ? "destructive" : "secondary"}
            className="gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {errorCount} errors
          </Badge>
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
            {warningCount} warnings
          </Badge>
          <span className="text-sm text-muted-foreground">
            {issues.length} total issues
          </span>
        </div>

        {activeIssues.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowFixAllConfirm(true)}
            disabled={isFixingAll || isAnalyzing}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Zap className="h-4 w-4" />
            Fix All ({activeIssues.length})
          </Button>
        )}
      </div>

      {/* Fix All Progress Dialog */}
      <AlertDialog open={isFixingAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Fixing All Issues...
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="text-sm">
                  Processing {fixAllProgress} of {fixAllTotal}
                </div>
                <Progress value={(fixAllProgress / fixAllTotal) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {fixAllCurrent}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-500">Fixed: {fixAllResults.fixed}</span>
                  <span className="text-red-500">Failed: {fixAllResults.failed}</span>
                  <span className="text-amber-500">Skipped: {fixAllResults.skipped}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fix All Confirmation Dialog */}
      <AlertDialog open={showFixAllConfirm} onOpenChange={setShowFixAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fix All Issues?</AlertDialogTitle>
            <AlertDialogDescription>
              This will attempt to automatically fix <strong>{activeIssues.length}</strong> issues using AI.
              <br /><br />
              <strong>Note:</strong> Only fixes with {">"}= 70% confidence will be applied. Low-confidence fixes will be skipped.
              <br /><br />
              Backups will be created for all modified files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={fixAll}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Fix All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fix All Results Dialog */}
      <AlertDialog open={showFixAllResults} onOpenChange={setShowFixAllResults}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fix All Completed</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 py-4">
                  <div className="text-center p-4 bg-emerald-500/10 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-500">{fixAllResults.fixed}</div>
                    <div className="text-sm text-muted-foreground">Fixed</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <div className="text-3xl font-bold text-red-500">{fixAllResults.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-amber-500/10 rounded-lg">
                    <div className="text-3xl font-bold text-amber-500">{fixAllResults.skipped}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Skipped fixes had {"<"} 70% confidence. Review them manually.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize={45} minSize={30}>
            <IssueList
              issues={issues}
              isLoading={isAnalyzing}
              selectedIssue={selectedIssue}
              onSelectIssue={(issue) => {
                setSelectedIssue(issue);
                setSuggestion(null);
              }}
              onGetFix={getFixSuggestion}
              onIgnoreIssue={ignoreIssue}
              gettingFixFor={gettingFixFor}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55} minSize={30}>
            <FixPreview
              issue={selectedIssue}
              suggestion={suggestion}
              isLoading={isGettingFix}
              isApplying={isApplying}
              onApply={applyFix}
              onReject={rejectSuggestion}
              onGetFix={() => selectedIssue && getFixSuggestion(selectedIssue)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
