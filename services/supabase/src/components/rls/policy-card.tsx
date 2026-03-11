"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Trash2,
  Eye,
  Plus,
  Pencil,
  User,
  Users,
  Server,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { RLSPolicy, PolicyCommand } from "@/types/rls";
import { parseExpression, getCommandDescription } from "@/types/rls";

interface PolicyCardProps {
  policy: RLSPolicy;
  onDelete: (policyName: string) => void;
  isDeleting?: boolean;
}

const commandIcons: Record<PolicyCommand, typeof Eye> = {
  SELECT: Eye,
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  ALL: Shield,
};

const commandColors: Record<PolicyCommand, string> = {
  SELECT: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  INSERT: "bg-green-500/10 text-green-600 border-green-500/20",
  UPDATE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  ALL: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export function PolicyCard({ policy, onDelete, isDeleting }: PolicyCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const CommandIcon = commandIcons[policy.command] || Shield;
  const usingParsed = parseExpression(policy.using_expression);
  const checkParsed = parseExpression(policy.check_expression);

  const getRoleIcon = (role: string) => {
    if (role === "public") return Users;
    if (role === "service_role") return Server;
    return User;
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/20",
        policy.is_permissive
          ? "border-l-4 border-l-emerald-500"
          : "border-l-4 border-l-amber-500"
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                commandColors[policy.command]
              )}
            >
              <CommandIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {policy.policy_name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getCommandDescription(policy.command)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                policy.is_permissive
                  ? "border-emerald-500/30 text-emerald-600"
                  : "border-amber-500/30 text-amber-600"
              )}
            >
              {policy.is_permissive ? (
                <ShieldCheck className="h-3 w-3 mr-1" />
              ) : (
                <ShieldX className="h-3 w-3 mr-1" />
              )}
              {policy.is_permissive ? "Permissive" : "Restrictive"}
            </Badge>
          </div>
        </div>

        {/* Roles */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Roles:</span>
          {policy.roles.map((role) => {
            const RoleIcon = getRoleIcon(role);
            return (
              <Badge
                key={role}
                variant="secondary"
                className="text-xs font-mono"
              >
                <RoleIcon className="h-3 w-3 mr-1" />
                {role}
              </Badge>
            );
          })}
        </div>

        {/* Quick preview of USING expression */}
        <div className="mt-3 p-2 rounded-md bg-muted/50">
          <div className="flex items-center gap-2 text-xs">
            <Code className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">USING:</span>
            <span className="font-mono truncate">{usingParsed.readable}</span>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDetails ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {showDetails ? "Hide" : "Show"} SQL details
        </button>

        {showDetails && (
          <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* USING Expression */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                USING Expression
              </span>
              <pre className="p-2 rounded-md bg-muted/70 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {policy.using_expression || "NULL"}
              </pre>
            </div>

            {/* WITH CHECK Expression */}
            {(policy.command === "INSERT" ||
              policy.command === "UPDATE" ||
              policy.command === "ALL") && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  WITH CHECK Expression
                </span>
                <pre className="p-2 rounded-md bg-muted/70 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {policy.check_expression || "NULL (uses USING)"}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t px-4 py-2 flex justify-end gap-2 bg-muted/30">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Policy</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the policy{" "}
                <strong>{policy.policy_name}</strong>? This action cannot be
                undone and may affect your application&apos;s security.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 p-3 rounded-md bg-muted">
              <p className="text-xs text-muted-foreground mb-2">
                SQL to be executed:
              </p>
              <pre className="text-xs font-mono">
                DROP POLICY IF EXISTS &quot;{policy.policy_name}&quot; ON
                public.&quot;{policy.table_name}&quot;;
              </pre>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(policy.policy_name)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Policy
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
