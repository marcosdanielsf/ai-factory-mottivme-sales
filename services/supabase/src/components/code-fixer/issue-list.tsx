"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  Shield,
  Code2,
  FileCode,
} from "lucide-react";
import { IssueCard } from "./issue-card";
import type { CodeIssue, IssueCategory, IssueSeverity } from "@/types/code-fixer";

interface IssueListProps {
  issues: CodeIssue[];
  isLoading: boolean;
  selectedIssue: CodeIssue | null;
  onSelectIssue: (issue: CodeIssue) => void;
  onGetFix: (issue: CodeIssue) => void;
  onIgnoreIssue: (issue: CodeIssue) => void;
  gettingFixFor?: string;
}

export function IssueList({
  issues,
  isLoading,
  selectedIssue,
  onSelectIssue,
  onGetFix,
  onIgnoreIssue,
  gettingFixFor,
}: IssueListProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Count issues by category
  const counts = useMemo(() => {
    const c = {
      all: issues.length,
      error: 0,
      warning: 0,
      info: 0,
      typescript: 0,
      react: 0,
      security: 0,
      eslint: 0,
      custom: 0,
    };

    for (const issue of issues) {
      if (issue.status === "ignored") continue;
      c[issue.severity]++;
      c[issue.category]++;
    }

    return c;
  }, [issues]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    let filtered = issues;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.message.toLowerCase().includes(searchLower) ||
          issue.relativePath.toLowerCase().includes(searchLower) ||
          issue.rule?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tab
    if (activeTab !== "all") {
      if (["error", "warning", "info"].includes(activeTab)) {
        filtered = filtered.filter((i) => i.severity === activeTab);
      } else {
        filtered = filtered.filter((i) => i.category === activeTab);
      }
    }

    return filtered;
  }, [issues, search, activeTab]);

  // Group by file
  const groupedByFile = useMemo(() => {
    const groups: Record<string, CodeIssue[]> = {};

    for (const issue of filteredIssues) {
      if (!groups[issue.relativePath]) {
        groups[issue.relativePath] = [];
      }
      groups[issue.relativePath].push(issue);
    }

    // Sort files by error count
    return Object.entries(groups).sort(([, a], [, b]) => {
      const aErrors = a.filter((i) => i.severity === "error").length;
      const bErrors = b.filter((i) => i.severity === "error").length;
      return bErrors - aErrors;
    });
  }, [filteredIssues]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={counts.error > 0 ? "destructive" : "secondary"}
            className="gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {counts.error} errors
          </Badge>
          <Badge variant="outline" className="gap-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            {counts.warning} warnings
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" />
            {counts.info} info
          </Badge>
        </div>
      </div>

      {/* Tabs by category */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              {counts.security}
            </TabsTrigger>
            <TabsTrigger value="react" className="text-xs gap-1">
              <Code2 className="h-3 w-3" />
              {counts.react}
            </TabsTrigger>
            <TabsTrigger value="typescript" className="text-xs gap-1">
              TS {counts.typescript}
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs gap-1">
              Other {counts.custom + counts.eslint}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="p-4 space-y-4">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No issues found</p>
                  {search && (
                    <Button
                      variant="link"
                      onClick={() => setSearch("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                groupedByFile.map(([filePath, fileIssues]) => (
                  <div key={filePath} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
                      <FileCode className="h-4 w-4" />
                      <span className="truncate">{filePath}</span>
                      <Badge variant="outline" className="text-xs">
                        {fileIssues.length}
                      </Badge>
                    </div>
                    {fileIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        isSelected={selectedIssue?.id === issue.id}
                        onSelect={onSelectIssue}
                        onGetFix={onGetFix}
                        onIgnore={onIgnoreIssue}
                        isGettingFix={gettingFixFor === issue.id}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
