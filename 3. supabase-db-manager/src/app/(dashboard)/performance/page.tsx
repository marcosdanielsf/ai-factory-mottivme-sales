"use client";

import { PerfDashboard } from "@/components/performance/perf-dashboard";
import { Activity } from "lucide-react";

export default function PerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Performance Monitor
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor database performance, analyze slow queries, and optimize indexes
        </p>
      </div>

      <PerfDashboard />
    </div>
  );
}
