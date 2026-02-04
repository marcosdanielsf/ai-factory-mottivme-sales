"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Plus,
  RefreshCw,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PolicyList } from "@/components/rls/policy-list";
import { PolicyCard } from "@/components/rls/policy-card";
import { PolicyWizard } from "@/components/rls/policy-wizard";
import { PolicyTemplates } from "@/components/rls/policy-templates";
import type { TableWithRLS, RLSPolicy, PolicyTemplate } from "@/types/rls";

interface TableDetails {
  table_name: string;
  rls_enabled: boolean;
  policies: RLSPolicy[];
  columns: { column_name: string; data_type: string; udt_name: string }[];
}

export default function RLSPage() {
  const [selectedTable, setSelectedTable] = useState<TableWithRLS | null>(null);
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(
    null
  );
  const [deletingPolicy, setDeletingPolicy] = useState<string | null>(null);
  const [toggleRLSDialog, setToggleRLSDialog] = useState(false);
  const [togglingRLS, setTogglingRLS] = useState(false);

  const fetchTableDetails = useCallback(async (tableName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rls/${encodeURIComponent(tableName)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch table details");
      }

      setTableDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDetails(selectedTable.table_name);
    } else {
      setTableDetails(null);
    }
  }, [selectedTable, fetchTableDetails]);

  const handleCreatePolicy = async (policy: {
    policy_name: string;
    command: string;
    is_permissive: boolean;
    roles: string[];
    using_expression: string;
    check_expression: string | null;
  }) => {
    if (!selectedTable) return;

    const res = await fetch(
      `/api/rls/${encodeURIComponent(selectedTable.table_name)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create policy");
    }

    // Refresh table details
    await fetchTableDetails(selectedTable.table_name);
  };

  const handleDeletePolicy = async (policyName: string) => {
    if (!selectedTable) return;

    setDeletingPolicy(policyName);
    try {
      const res = await fetch(
        `/api/rls/${encodeURIComponent(selectedTable.table_name)}?policy_name=${encodeURIComponent(policyName)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete policy");
      }

      // Refresh table details
      await fetchTableDetails(selectedTable.table_name);
    } catch (err) {
      console.error("Delete policy error:", err);
    } finally {
      setDeletingPolicy(null);
    }
  };

  const handleToggleRLS = async () => {
    if (!selectedTable || !tableDetails) return;

    setTogglingRLS(true);
    try {
      const res = await fetch(
        `/api/rls/${encodeURIComponent(selectedTable.table_name)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enable: !tableDetails.rls_enabled }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle RLS");
      }

      // Refresh table details
      await fetchTableDetails(selectedTable.table_name);
    } catch (err) {
      console.error("Toggle RLS error:", err);
    } finally {
      setTogglingRLS(false);
      setToggleRLSDialog(false);
    }
  };

  const handleTemplateSelect = (template: PolicyTemplate) => {
    setSelectedTemplate(template);
    setWizardOpen(true);
  };

  const openWizardWithoutTemplate = () => {
    setSelectedTemplate(null);
    setWizardOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Tables Sidebar */}
        <div className="w-80 shrink-0 border rounded-lg overflow-hidden bg-card">
          <PolicyList
            onSelectTable={setSelectedTable}
            selectedTable={selectedTable?.table_name}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {selectedTable && tableDetails ? (
            <div className="space-y-6">
              {/* Table Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        tableDetails.rls_enabled
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {tableDetails.rls_enabled ? (
                        <ShieldCheck className="h-6 w-6" />
                      ) : (
                        <ShieldOff className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight">
                        {selectedTable.table_name}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={
                            tableDetails.rls_enabled
                              ? "border-emerald-500/30 text-emerald-600"
                              : "border-amber-500/30 text-amber-600"
                          }
                        >
                          {tableDetails.rls_enabled ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              RLS Enabled
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              RLS Disabled
                            </>
                          )}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tableDetails.policies.length}{" "}
                          {tableDetails.policies.length === 1
                            ? "policy"
                            : "policies"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTableDetails(selectedTable.table_name)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tableDetails.rls_enabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => setToggleRLSDialog(true)}
                      >
                        {tableDetails.rls_enabled ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Disable RLS
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Enable RLS
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tableDetails.rls_enabled
                        ? "Disable Row Level Security for this table"
                        : "Enable Row Level Security for this table"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Warning if RLS disabled */}
              {!tableDetails.rls_enabled && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-600">
                      Row Level Security is disabled
                    </p>
                    <p className="text-sm text-amber-600/80 mt-1">
                      All authenticated users can read, insert, update, and delete
                      all rows. Enable RLS and create policies to restrict access.
                    </p>
                  </div>
                </div>
              )}

              {/* Policies Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Policies</h2>
                  <div className="flex items-center gap-2">
                    <PolicyTemplates
                      tableName={selectedTable.table_name}
                      columns={tableDetails.columns}
                      onSelectTemplate={handleTemplateSelect}
                      disabled={!tableDetails.rls_enabled}
                    />
                    <Button
                      size="sm"
                      onClick={openWizardWithoutTemplate}
                      disabled={!tableDetails.rls_enabled}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Policy
                    </Button>
                  </div>
                </div>

                {!tableDetails.rls_enabled && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    Enable RLS first to create policies.
                  </div>
                )}

                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                  </div>
                ) : tableDetails.policies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
                    <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No policies yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      {tableDetails.rls_enabled
                        ? "Create your first policy to start controlling access to this table."
                        : "Enable RLS first, then create policies to control access."}
                    </p>
                    {tableDetails.rls_enabled && (
                      <Button
                        className="mt-4"
                        onClick={openWizardWithoutTemplate}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Policy
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {tableDetails.policies.map((policy) => (
                      <PolicyCard
                        key={policy.policy_name}
                        policy={policy}
                        onDelete={handleDeletePolicy}
                        isDeleting={deletingPolicy === policy.policy_name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-48" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-medium">Error loading table</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a table</p>
                <p className="text-sm mt-1">
                  Choose a table from the sidebar to manage its RLS policies
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Policy Wizard */}
        {selectedTable && tableDetails && (
          <PolicyWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            tableName={selectedTable.table_name}
            columns={tableDetails.columns}
            onCreatePolicy={handleCreatePolicy}
            initialTemplate={selectedTemplate}
          />
        )}

        {/* Toggle RLS Confirmation */}
        <AlertDialog open={toggleRLSDialog} onOpenChange={setToggleRLSDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {tableDetails?.rls_enabled ? "Disable" : "Enable"} Row Level
                Security?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tableDetails?.rls_enabled ? (
                  <>
                    Disabling RLS will allow all authenticated users to access all
                    rows in this table. Existing policies will remain but won&apos;t
                    be enforced.
                  </>
                ) : (
                  <>
                    Enabling RLS will enforce access control on this table. Make
                    sure you have policies in place, or no one will be able to
                    access the data (except service role).
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 p-3 rounded-md bg-muted">
              <p className="text-xs text-muted-foreground mb-2">
                SQL to be executed:
              </p>
              <pre className="text-xs font-mono">
                ALTER TABLE public.&quot;{selectedTable?.table_name}&quot;{" "}
                {tableDetails?.rls_enabled ? "DISABLE" : "ENABLE"} ROW LEVEL
                SECURITY;
              </pre>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleRLS}
                disabled={togglingRLS}
                className={
                  tableDetails?.rls_enabled
                    ? "bg-amber-600 hover:bg-amber-700"
                    : ""
                }
              >
                {togglingRLS ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : tableDetails?.rls_enabled ? (
                  <Unlock className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {tableDetails?.rls_enabled ? "Disable RLS" : "Enable RLS"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
