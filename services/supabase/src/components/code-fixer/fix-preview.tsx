"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  FileCode,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { CodeIssue, FixSuggestion } from "@/types/code-fixer";

interface FixPreviewProps {
  issue: CodeIssue | null;
  suggestion: FixSuggestion | null;
  isLoading: boolean;
  isApplying: boolean;
  onApply: () => void;
  onReject: () => void;
  onGetFix: () => void;
}

export function FixPreview({
  issue,
  suggestion,
  isLoading,
  isApplying,
  onApply,
  onReject,
  onGetFix,
}: FixPreviewProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <FileCode className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Select an issue</p>
        <p className="text-sm">Click on an issue to see details and get a fix suggestion</p>
      </div>
    );
  }

  const confidenceColor =
    suggestion?.confidence && suggestion.confidence >= 80
      ? "text-emerald-500"
      : suggestion?.confidence && suggestion.confidence >= 60
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="flex flex-col h-full">
      {/* Issue details header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{issue.message}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <FileCode className="h-4 w-4" />
              <span>{issue.relativePath}</span>
              <span>:</span>
              <span>line {issue.line}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={
                issue.severity === "error"
                  ? "destructive"
                  : issue.severity === "warning"
                    ? "outline"
                    : "secondary"
              }
            >
              {issue.severity}
            </Badge>
            <Badge variant="outline">{issue.category}</Badge>
          </div>
        </div>

        {issue.rule && (
          <div className="mt-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {issue.rule}
            </Badge>
          </div>
        )}
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Original code */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Original Code
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-4 bg-zinc-950 text-zinc-300 text-sm overflow-x-auto rounded-b-lg font-mono">
                {issue.codeSnippet || "No code snippet available"}
              </pre>
            </CardContent>
          </Card>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                Getting AI fix suggestion...
              </p>
            </div>
          )}

          {/* No suggestion yet */}
          {!isLoading && !suggestion && (
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Click the button to get an AI-powered fix suggestion
              </p>
              <Button onClick={onGetFix} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Get AI Fix
              </Button>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <>
              <Card className="border-emerald-500/20">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Suggested Fix
                    </span>
                    <Badge variant="outline" className={confidenceColor}>
                      {suggestion.confidence}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-emerald-950/30 text-emerald-200 text-sm overflow-x-auto rounded-b-lg font-mono">
                    {suggestion.fixedCode}
                  </pre>
                </CardContent>
              </Card>

              {/* Explanation */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.explanation}
                  </p>
                </CardContent>
              </Card>

              {/* Confidence warning */}
              {suggestion.confidence < 70 && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-500">
                      Low confidence fix
                    </p>
                    <p className="text-muted-foreground">
                      Review carefully before applying. The AI is not confident
                      about this fix.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Action buttons */}
      {suggestion && (
        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onReject} disabled={isApplying}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={isApplying}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isApplying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Apply Fix
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply this fix?</AlertDialogTitle>
            <AlertDialogDescription>
              This will modify the file <strong>{issue.relativePath}</strong>.
              A backup will be created before applying the fix.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                onApply();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Apply Fix
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
