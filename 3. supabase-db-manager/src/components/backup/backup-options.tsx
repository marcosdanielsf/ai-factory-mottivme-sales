"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BackupType } from "@/types/schema";

interface BackupOptionsProps {
  backupType: BackupType;
  onBackupTypeChange: (type: BackupType) => void;
  includeDropStatements: boolean;
  onIncludeDropChange: (value: boolean) => void;
  includeConstraints: boolean;
  onIncludeConstraintsChange: (value: boolean) => void;
}

export function BackupOptions({
  backupType,
  onBackupTypeChange,
  includeDropStatements,
  onIncludeDropChange,
  includeConstraints,
  onIncludeConstraintsChange,
}: BackupOptionsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="backup-type">Backup Type</Label>
        <Select value={backupType} onValueChange={(v) => onBackupTypeChange(v as BackupType)}>
          <SelectTrigger id="backup-type" className="w-full">
            <SelectValue placeholder="Select backup type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="schema">
              <div className="flex flex-col">
                <span>Schema Only</span>
                <span className="text-xs text-muted-foreground">
                  CREATE TABLE statements, indexes, constraints
                </span>
              </div>
            </SelectItem>
            <SelectItem value="data">
              <div className="flex flex-col">
                <span>Data Only</span>
                <span className="text-xs text-muted-foreground">
                  INSERT statements for all rows
                </span>
              </div>
            </SelectItem>
            <SelectItem value="full">
              <div className="flex flex-col">
                <span>Full Backup</span>
                <span className="text-xs text-muted-foreground">
                  Schema + Data combined
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(backupType === "schema" || backupType === "full") && (
        <>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="drop-statements">Include DROP Statements</Label>
              <p className="text-xs text-muted-foreground">
                Add DROP TABLE IF EXISTS before CREATE
              </p>
            </div>
            <Switch
              id="drop-statements"
              checked={includeDropStatements}
              onCheckedChange={onIncludeDropChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="constraints">Include Indexes & Constraints</Label>
              <p className="text-xs text-muted-foreground">
                Include index and constraint definitions
              </p>
            </div>
            <Switch
              id="constraints"
              checked={includeConstraints}
              onCheckedChange={onIncludeConstraintsChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
