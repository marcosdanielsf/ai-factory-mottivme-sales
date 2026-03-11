"use client";

import {
  User,
  Eye,
  Lock,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Server,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { POLICY_TEMPLATES, type PolicyTemplate } from "@/types/rls";

interface PolicyTemplatesProps {
  tableName: string;
  columns: { column_name: string; data_type: string }[];
  onSelectTemplate: (template: PolicyTemplate) => void;
  disabled?: boolean;
}

const iconMap: Record<string, typeof User> = {
  user: User,
  eye: Eye,
  lock: Lock,
  shield: Shield,
  plus: Plus,
  pencil: Pencil,
  trash: Trash2,
  server: Server,
};

export function PolicyTemplates({
  tableName,
  columns,
  onSelectTemplate,
  disabled,
}: PolicyTemplatesProps) {
  const hasUserIdColumn = columns.some(
    (col) =>
      col.column_name === "user_id" ||
      col.column_name === "owner_id" ||
      col.column_name === "created_by"
  );

  // Filter templates based on table columns
  const availableTemplates = POLICY_TEMPLATES.filter((template) => {
    if (template.requires_user_id_column && !hasUserIdColumn) {
      return false;
    }
    return true;
  });

  const unavailableTemplates = POLICY_TEMPLATES.filter((template) => {
    return template.requires_user_id_column && !hasUserIdColumn;
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Shield className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Policy Templates</DialogTitle>
          <DialogDescription>
            Select a pre-configured policy template for{" "}
            <strong>{tableName}</strong>. Templates provide common security
            patterns that you can customize.
          </DialogDescription>
        </DialogHeader>

        {!hasUserIdColumn && (
          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
            <strong>Note:</strong> Some templates require a{" "}
            <code className="bg-amber-500/20 px-1 rounded">user_id</code>,{" "}
            <code className="bg-amber-500/20 px-1 rounded">owner_id</code>, or{" "}
            <code className="bg-amber-500/20 px-1 rounded">created_by</code>{" "}
            column. Add one to use owner-based policies.
          </div>
        )}

        <div className="space-y-3 mt-4">
          {/* Available templates */}
          {availableTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelectTemplate(template)}
              hasRequiredColumns={true}
            />
          ))}

          {/* Unavailable templates (greyed out) */}
          {unavailableTemplates.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground pt-4 pb-2 font-medium">
                Requires user_id column:
              </div>
              {unavailableTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => {}}
                  hasRequiredColumns={false}
                />
              ))}
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <p className="text-xs text-muted-foreground">
            Templates can be customized after selection in the policy wizard.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onSelect,
  hasRequiredColumns,
}: {
  template: PolicyTemplate;
  onSelect: () => void;
  hasRequiredColumns: boolean;
}) {
  const Icon = iconMap[template.icon] || Shield;

  return (
    <button
      onClick={onSelect}
      disabled={!hasRequiredColumns}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-all",
        hasRequiredColumns
          ? "hover:border-primary/40 hover:bg-accent/50 cursor-pointer"
          : "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            hasRequiredColumns
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{template.name}</h4>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono",
                template.command === "ALL" && "border-purple-500/30 text-purple-600",
                template.command === "SELECT" && "border-blue-500/30 text-blue-600",
                template.command === "INSERT" && "border-green-500/30 text-green-600",
                template.command === "UPDATE" && "border-amber-500/30 text-amber-600",
                template.command === "DELETE" && "border-red-500/30 text-red-600"
              )}
            >
              {template.command}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {template.description}
          </p>

          {/* Preview expressions */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-16">USING:</span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">
                {template.using_expression}
              </code>
            </div>
            {template.check_expression && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-16">CHECK:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">
                  {template.check_expression}
                </code>
              </div>
            )}
          </div>

          {/* Roles */}
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Roles:</span>
            {template.roles.map((role) => (
              <Badge
                key={role}
                variant="secondary"
                className="text-[10px] font-mono"
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {hasRequiredColumns && (
          <div className="shrink-0">
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary transition-colors">
              <Check className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// Export a simpler version for inline use
export function QuickTemplateButtons({
  columns,
  onSelectTemplate,
}: {
  columns: { column_name: string; data_type: string }[];
  onSelectTemplate: (template: PolicyTemplate) => void;
}) {
  const hasUserIdColumn = columns.some(
    (col) =>
      col.column_name === "user_id" ||
      col.column_name === "owner_id" ||
      col.column_name === "created_by"
  );

  const quickTemplates = POLICY_TEMPLATES.filter(
    (t) =>
      ["owner_only", "public_read", "authenticated_read", "admin_only"].includes(
        t.id
      ) &&
      (!t.requires_user_id_column || hasUserIdColumn)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {quickTemplates.map((template) => {
        const Icon = iconMap[template.icon] || Shield;
        return (
          <Button
            key={template.id}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onSelectTemplate(template)}
          >
            <Icon className="h-3 w-3 mr-1.5" />
            {template.name}
          </Button>
        );
      })}
    </div>
  );
}
