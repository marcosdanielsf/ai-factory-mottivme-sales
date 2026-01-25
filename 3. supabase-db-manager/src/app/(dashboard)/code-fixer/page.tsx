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
import { RefreshCw, Sparkles, Clock, FileCode, AlertCircle } from "lucide-react";
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
      <div className="flex items-center gap-4 px-6 py-2 bg-muted/50 border-b">
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
