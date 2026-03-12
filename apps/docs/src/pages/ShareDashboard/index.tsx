import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { useClientFunnel } from "../../hooks/useClientFunnel";
import type { DateRange } from "../../components/DateRangePicker";
import { ShareHeader } from "./components/ShareHeader";
import { ClientKPIs } from "./components/ClientKPIs";
import { ClientFunnel } from "./components/ClientFunnel";
import { ClientDailyChart } from "./components/ClientDailyChart";
import { ClientDailyTable } from "./components/ClientDailyTable";
import { ClientAdTable } from "./components/ClientAdTable";

const getDefaultDateRange = (): DateRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { startDate: start, endDate: end };
};

const FullPageSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="space-y-3 text-center">
      <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mx-auto" />
      <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mx-auto" />
    </div>
  </div>
);

const InvalidTokenPage = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
    <div className="text-center space-y-4 max-w-sm">
      <div className="flex justify-center">
        <div className="p-4 bg-zinc-800/50 rounded-full">
          <Lock size={32} className="text-zinc-400" />
        </div>
      </div>
      <h1 className="text-xl font-semibold text-white">
        Link invalido ou expirado
      </h1>
      <p className="text-zinc-400 text-sm">
        Este link nao e mais valido ou expirou. Entre em contato com seu gestor
        de conta.
      </p>
    </div>
  </div>
);

export const ShareDashboard: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  const { funnelData, adsBreakdown, totals, kpis, isValidToken, loading } =
    useClientFunnel(token!, dateRange);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  if (isValidToken === null) {
    return <FullPageSkeleton />;
  }

  if (isValidToken === false) {
    return <InvalidTokenPage />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <ShareHeader dateRange={dateRange} onDateRangeChange={setDateRange} />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        <ClientKPIs kpis={kpis} loading={loading} />
        <ClientFunnel totals={totals} loading={loading} />
        <ClientDailyChart data={funnelData} loading={loading} />
        <ClientDailyTable data={funnelData} loading={loading} />
        <ClientAdTable data={adsBreakdown} loading={loading} />
      </main>
      <footer className="text-center py-8 text-zinc-500 text-sm border-t border-zinc-800">
        Powered by MOTTIVME AI
      </footer>
    </div>
  );
};
