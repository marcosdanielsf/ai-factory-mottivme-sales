"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Code,
  Eye,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PolicyCommand, PolicyTemplate } from "@/types/rls";
import { QuickTemplateButtons } from "./policy-templates";

interface PolicyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  columns: { column_name: string; data_type: string }[];
  onCreatePolicy: (policy: {
    policy_name: string;
    command: PolicyCommand;
    is_permissive: boolean;
    roles: string[];
    using_expression: string;
    check_expression: string | null;
  }) => Promise<void>;
  initialTemplate?: PolicyTemplate | null;
}

type WizardStep = "name" | "command" | "expression" | "preview";

const AVAILABLE_ROLES = [
  { value: "public", label: "Public (anyone)" },
  { value: "authenticated", label: "Authenticated users" },
  { value: "service_role", label: "Service role (backend)" },
  { value: "anon", label: "Anonymous" },
];

const COMMANDS: { value: PolicyCommand; label: string; description: string }[] = [
  { value: "SELECT", label: "SELECT", description: "Read records" },
  { value: "INSERT", label: "INSERT", description: "Create new records" },
  { value: "UPDATE", label: "UPDATE", description: "Modify existing records" },
  { value: "DELETE", label: "DELETE", description: "Remove records" },
  { value: "ALL", label: "ALL", description: "All operations" },
];

export function PolicyWizard({
  open,
  onOpenChange,
  tableName,
  columns,
  onCreatePolicy,
  initialTemplate,
}: PolicyWizardProps) {
  const [step, setStep] = useState<WizardStep>("name");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cleanup timer for copied state
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Form state
  const [policyName, setPolicyName] = useState("");
  const [command, setCommand] = useState<PolicyCommand>("SELECT");
  const [isPermissive, setIsPermissive] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["public"]);
  const [usingExpression, setUsingExpression] = useState("true");
  const [checkExpression, setCheckExpression] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (initialTemplate) {
        // Pre-fill from template
        setPolicyName(
          `${initialTemplate.id}_${tableName}`.replace(/[^a-zA-Z0-9_]/g, "_")
        );
        setCommand(initialTemplate.command);
        setSelectedRoles(initialTemplate.roles);
        setUsingExpression(initialTemplate.using_expression);
        setCheckExpression(initialTemplate.check_expression || "");
        setStep("expression"); // Skip to expression step for templates
      } else {
        // Reset to defaults
        setPolicyName("");
        setCommand("SELECT");
        setIsPermissive(true);
        setSelectedRoles(["public"]);
        setUsingExpression("true");
        setCheckExpression("");
        setStep("name");
      }
    }
  }, [open, initialTemplate, tableName]);

  const handleTemplateSelect = (template: PolicyTemplate) => {
    setPolicyName(
      `${template.id}_${tableName}`.replace(/[^a-zA-Z0-9_]/g, "_")
    );
    setCommand(template.command);
    setSelectedRoles(template.roles);
    setUsingExpression(template.using_expression);
    setCheckExpression(template.check_expression || "");
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Generate SQL preview
  const generateSQL = () => {
    const sanitizedName = policyName.replace(/[^a-zA-Z0-9_]/g, "_");
    const permissive = isPermissive ? "PERMISSIVE" : "RESTRICTIVE";
    const rolesStr = selectedRoles.length > 0 ? selectedRoles.join(", ") : "public";

    let sql = `CREATE POLICY "${sanitizedName}" ON public."${tableName}"\n`;
    sql += `  AS ${permissive}\n`;
    sql += `  FOR ${command}\n`;
    sql += `  TO ${rolesStr}\n`;
    sql += `  USING (${usingExpression})`;

    if (checkExpression && ["INSERT", "UPDATE", "ALL"].includes(command)) {
      sql += `\n  WITH CHECK (${checkExpression})`;
    }

    sql += ";";
    return sql;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onCreatePolicy({
        policy_name: policyName,
        command,
        is_permissive: isPermissive,
        roles: selectedRoles,
        using_expression: usingExpression,
        check_expression: checkExpression || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create policy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateSQL());
    setCopied(true);
    // Timer cleanup handled by useEffect
  };

  const canProceed = () => {
    switch (step) {
      case "name":
        return policyName.length >= 3;
      case "command":
        return command && selectedRoles.length > 0;
      case "expression":
        return usingExpression.length > 0;
      case "preview":
        return true;
      default:
        return false;
    }
  };

  const steps: WizardStep[] = ["name", "command", "expression", "preview"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create Policy for {tableName}
          </DialogTitle>
          <DialogDescription>
            Define a new Row Level Security policy to control data access.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between px-4 py-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  i < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentStepIndex
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-2",
                    i < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[300px] py-4">
          {/* Step 1: Name */}
          {step === "name" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Policy Name</label>
                <Input
                  placeholder="e.g., users_can_read_own_data"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use snake_case. Only letters, numbers, and underscores allowed.
                </p>
              </div>

              {/* Quick templates */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Quick Templates</span>
                </div>
                <QuickTemplateButtons
                  columns={columns}
                  onSelectTemplate={handleTemplateSelect}
                />
              </div>
            </div>
          )}

          {/* Step 2: Command & Roles */}
          {step === "command" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Command</label>
                <div className="grid grid-cols-5 gap-2">
                  {COMMANDS.map((cmd) => (
                    <button
                      key={cmd.value}
                      onClick={() => setCommand(cmd.value)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        command === cmd.value
                          ? "border-primary bg-primary/10"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      <span className="text-xs font-mono font-medium">
                        {cmd.label}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {cmd.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Policy Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPermissive(true)}
                    className={cn(
                      "flex-1 p-3 rounded-lg border flex items-center gap-2 transition-all",
                      isPermissive
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "hover:border-muted-foreground/50"
                    )}
                  >
                    <ShieldCheck
                      className={cn(
                        "h-5 w-5",
                        isPermissive ? "text-emerald-600" : "text-muted-foreground"
                      )}
                    />
                    <div className="text-left">
                      <span className="text-sm font-medium">Permissive</span>
                      <p className="text-xs text-muted-foreground">
                        OR with other policies
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsPermissive(false)}
                    className={cn(
                      "flex-1 p-3 rounded-lg border flex items-center gap-2 transition-all",
                      !isPermissive
                        ? "border-amber-500 bg-amber-500/10"
                        : "hover:border-muted-foreground/50"
                    )}
                  >
                    <ShieldX
                      className={cn(
                        "h-5 w-5",
                        !isPermissive ? "text-amber-600" : "text-muted-foreground"
                      )}
                    />
                    <div className="text-left">
                      <span className="text-sm font-medium">Restrictive</span>
                      <p className="text-xs text-muted-foreground">
                        AND with other policies
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => toggleRole(role.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-md border text-sm transition-all",
                        selectedRoles.includes(role.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      {selectedRoles.includes(role.value) && (
                        <Check className="h-3 w-3 inline mr-1" />
                      )}
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Expression */}
          {step === "expression" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">USING Expression</label>
                  <Badge variant="outline" className="text-[10px]">
                    Required
                  </Badge>
                </div>
                <textarea
                  value={usingExpression}
                  onChange={(e) => setUsingExpression(e.target.value)}
                  className="w-full h-24 p-3 rounded-md border bg-muted/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="auth.uid() = user_id"
                />
                <p className="text-xs text-muted-foreground">
                  Determines which rows are visible. Must return boolean.
                </p>
              </div>

              {["INSERT", "UPDATE", "ALL"].includes(command) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      WITH CHECK Expression
                    </label>
                    <Badge variant="outline" className="text-[10px]">
                      Optional
                    </Badge>
                  </div>
                  <textarea
                    value={checkExpression}
                    onChange={(e) => setCheckExpression(e.target.value)}
                    className="w-full h-24 p-3 rounded-md border bg-muted/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="auth.uid() = user_id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Validates new/updated data. Defaults to USING expression if
                    empty.
                  </p>
                </div>
              )}

              {/* Available columns reference */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Available Columns
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-md bg-muted/50 max-h-32 overflow-y-auto">
                  {columns.map((col) => (
                    <Badge
                      key={col.column_name}
                      variant="secondary"
                      className="text-[10px] font-mono cursor-pointer hover:bg-primary/20"
                      onClick={() => {
                        setUsingExpression((prev) =>
                          prev === "true" ? col.column_name : `${prev} AND ${col.column_name}`
                        );
                      }}
                    >
                      {col.column_name}
                      <span className="text-muted-foreground ml-1">
                        ({col.data_type})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  Review the SQL carefully before applying. This will immediately
                  affect data access.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    SQL Preview
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CheckCheck className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <pre className="p-4 rounded-md bg-zinc-900 text-zinc-100 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                  {generateSQL()}
                </pre>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-md bg-muted/50">
                <div>
                  <span className="text-xs text-muted-foreground">Policy Name</span>
                  <p className="font-mono text-sm">{policyName}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Command</span>
                  <p className="font-mono text-sm">{command}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Type</span>
                  <p className="text-sm flex items-center gap-1">
                    {isPermissive ? (
                      <>
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Permissive
                      </>
                    ) : (
                      <>
                        <ShieldX className="h-3 w-3 text-amber-600" />
                        Restrictive
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Roles</span>
                  <p className="text-sm">{selectedRoles.join(", ")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                onClick={() => setStep(steps[currentStepIndex - 1])}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "preview" ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Create Policy
              </Button>
            ) : (
              <Button
                onClick={() => setStep(steps[currentStepIndex + 1])}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
