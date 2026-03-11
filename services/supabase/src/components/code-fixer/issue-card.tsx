"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  FileCode,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import type { CodeIssue } from "@/types/code-fixer";

interface IssueCardProps {
  issue: CodeIssue;
  isSelected: boolean;
  onSelect: (issue: CodeIssue) => void;
  onGetFix: (issue: CodeIssue) => void;
  onIgnore: (issue: CodeIssue) => void;
  isGettingFix?: boolean;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "outline" as const,
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "secondary" as const,
  },
};

const categoryLabels: Record<string, string> = {
  typescript: "TypeScript",
  eslint: "ESLint",
  react: "React",
  security: "Security",
  custom: "Quality",
};

export function IssueCard({
  issue,
  isSelected,
  onSelect,
  onGetFix,
  onIgnore,
  isGettingFix,
}: IssueCardProps) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <Card
      className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${issue.status === "ignored" ? "opacity-50" : ""}`}
      onClick={() => onSelect(issue)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded ${config.bg}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={config.badge} className="text-xs">
              {issue.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {categoryLabels[issue.category] || issue.category}
            </Badge>
            {issue.rule && (
              <span className="text-xs text-muted-foreground font-mono">
                {issue.rule}
              </span>
            )}
          </div>

          <p className="text-sm font-medium truncate">{issue.message}</p>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <FileCode className="h-3 w-3" />
            <span className="truncate">{issue.relativePath}</span>
            <span>:</span>
            <span>{issue.line}</span>
          </div>

          {issue.codeSnippet && (
            <pre className="mt-2 p-2 bg-zinc-900 rounded text-xs overflow-x-auto max-h-24 text-zinc-300">
              {issue.codeSnippet.split("\n").slice(0, 3).join("\n")}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onGetFix(issue);
            }}
            disabled={isGettingFix || issue.status === "ignored"}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            {isGettingFix ? "..." : "Fix"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onIgnore(issue);
            }}
            className="gap-1"
          >
            {issue.status === "ignored" ? (
              <>
                <Eye className="h-3 w-3" />
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
