"use client";

import { BackupManager } from "@/components/backup/backup-manager";
import { HardDrive } from "lucide-react";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HardDrive className="h-6 w-6" />
          Database Backup
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate SQL backups of your database schema and data
        </p>
      </div>

      <BackupManager />
    </div>
  );
}
