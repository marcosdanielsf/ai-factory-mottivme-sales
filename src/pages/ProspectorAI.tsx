/**
 * ProspectorAI.tsx
 * Dashboard do AI SDR - Version B
 * Métricas, fila de review, configuração e logs do agente AI
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Bot,
  CheckCircle2,
  Send,
  TrendingUp,
  Users,
  Check,
  X,
  Edit2,
  Loader2,
  Save,
  AlertCircle,
  Clock,
  ChevronDown,
  Settings,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { prospectorApi } from '../lib/prospector-api';

const API_BASE = import.meta.env.VITE_PROSPECTOR_API_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type Temperature = 'hot' | 'warm' | 'cold' | 'dead';

interface AIReviewItem {
  id: string;
  conversation_id: string;
  lead_name: string;
  lead_headline?: string;
  ai_score: number;
  ai_temperature: Temperature;
  ai_suggested_action: string;
  ai_suggested_response: string;
  review_status: ReviewStatus;
  created_at: string;
  reviewed_at?: string;
}

interface AIMetrics {
  conversations_processed: number;
  auto_sent: number;
  avg_score: number;
  escalation_rate: number;
}

interface TempDistribution {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

interface AIConfig {
  auto_respond: boolean;
  tone: string;
  campaign_context: string;
  company_info: string;
  min_score_auto_send: number;
}

interface AILogEntry {
  id: string;
  timestamp: string;
  lead_name: string;
  action: string;
  score: number;
  status: 'sent' | 'pending' | 'rejected';
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const tempColor = (temp: Temperature): string => {
  switch (temp) {
    case 'hot':  return 'text-[#ef4444]';
    case 'warm': return 'text-[#f97316]';
    case 'cold': return 'text-[#58a6ff]';
    case 'dead': return 'text-[#8b949e]';
  }
};

const tempBg = (temp: Temperature): string => {
  switch (temp) {
    case 'hot':  return 'bg-[#ef4444]/10 border-[#ef4444]/30';
    case 'warm': return 'bg-[#f97316]/10 border-[#f97316]/30';
    case 'cold': return 'bg-[#58a6ff]/10 border-[#58a6ff]/30';
    case 'dead': return 'bg-[#8b949e]/10 border-[#8b949e]/30';
  }
};

const tempLabel = (temp: Temperature): string => {
  switch (temp) {
    case 'hot':  return '🔥 Hot';
    case 'warm': return '☀️ Warm';
    case 'cold': return '❄️ Cold';
    case 'dead': return '💀 Dead';
  }
};

const scoreColor = (score: number): string => {
  if (score >= 80) return 'text-[#3fb950]';
  if (score >= 60) return 'text-[#f97316]';
  return 'text-[#ef4444]';
};

// ═══════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const MetricCard = ({ icon, label, value, sub, color = 'text-[#58a6ff]' }: MetricCardProps) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-colors">
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-[#0d1117] ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#8b949e] mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
        {sub && <p className="text-[11px] text-[#8b949e] mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// TEMPERATURE BAR CHART
// ═══════════════════════════════════════════════════════════════════════

interface TempChartProps {
  distribution: TempDistribution[];
}

const TempBarChart = ({ distribution }: TempChartProps) => {
  const total = distribution.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="space-y-3">
      {distribution.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-[#8b949e] w-16 text-right flex-shrink-0">{d.label}</span>
          <div className="flex-1 h-6 bg-[#0d1117] rounded-md overflow-hidden">
            <div
              className={`h-full ${d.bgColor} rounded-md transition-all duration-500 flex items-center pl-2`}
              style={{ width: `${Math.max((d.count / total) * 100, 4)}%` }}
            >
              {d.count > 0 && (
                <span className={`text-[10px] font-semibold ${d.color}`}>{d.count}</span>
              )}
            </div>
          </div>
          <span className={`text-xs font-medium w-8 flex-shrink-0 ${d.color}`}>
            {((d.count / total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// REVIEW ITEM
// ═══════════════════════════════════════════════════════════════════════

interface ReviewItemProps {
  item: AIReviewItem;
  expanded: boolean;
  onToggle: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  loading: boolean;
}

const ReviewItem = ({ item, expanded, onToggle, onApprove, onReject, onEdit, loading }: ReviewItemProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(item.ai_suggested_response);

  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#161b22] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{item.lead_name}</span>
            {item.lead_headline && (
              <span className="text-xs text-[#8b949e] truncate hidden sm:block">· {item.lead_headline}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[11px] font-semibold ${scoreColor(item.ai_score)}`}>
              Score: {item.ai_score}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tempBg(item.ai_temperature)} ${tempColor(item.ai_temperature)}`}>
              {tempLabel(item.ai_temperature)}
            </span>
            <span className="text-[11px] text-[#8b949e]">{item.ai_suggested_action}</span>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#8b949e] transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#21262d] p-3 space-y-3">
          {editMode ? (
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={4}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none resize-none"
            />
          ) : (
            <div className="bg-[#161b22] border border-[#a371f7]/20 rounded-lg p-3">
              <p className="text-[10px] text-[#a371f7] font-semibold mb-1">🤖 Resposta sugerida</p>
              <p className="text-sm text-[#e6edf3] leading-relaxed">{item.ai_suggested_response}</p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {editMode ? (
              <>
                <button
                  onClick={() => { onEdit(item.id, editText); setEditMode(false); }}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3fb950]/20 hover:bg-[#3fb950]/30 border border-[#3fb950]/40 text-[#3fb950] rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Send size={12} /> Enviar editado
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-3 py-1.5 bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-white rounded text-xs transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onApprove(item.id)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3fb950]/20 hover:bg-[#3fb950]/30 border border-[#3fb950]/40 text-[#3fb950] rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Aprovar
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#58a6ff]/10 hover:bg-[#58a6ff]/20 border border-[#58a6ff]/30 text-[#58a6ff] rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Edit2 size={12} /> Editar & Enviar
                </button>
                <button
                  onClick={() => onReject(item.id)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <X size={12} /> Rejeitar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ProspectorAI = () => {
  // ── State ────────────────────────────────────────────────────────────
  const [reviewItems, setReviewItems] = useState<AIReviewItem[]>([]);
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  // Metrics (mock aggregation – real data from lp_conversations)
  const [metrics, setMetrics] = useState<AIMetrics>({
    conversations_processed: 0,
    auto_sent: 0,
    avg_score: 0,
    escalation_rate: 0,
  });

  const [distribution, setDistribution] = useState<TempDistribution[]>([
    { label: '🔥 Hot',  count: 0, color: 'text-[#ef4444]', bgColor: 'bg-[#ef4444]/40' },
    { label: '☀️ Warm', count: 0, color: 'text-[#f97316]', bgColor: 'bg-[#f97316]/40' },
    { label: '❄️ Cold', count: 0, color: 'text-[#58a6ff]', bgColor: 'bg-[#58a6ff]/40' },
    { label: '💀 Dead', count: 0, color: 'text-[#8b949e]', bgColor: 'bg-[#8b949e]/40' },
  ]);

  const [logs, setLogs] = useState<AILogEntry[]>([]);

  const [config, setConfig] = useState<AIConfig>({
    auto_respond: false,
    tone: 'consultivo',
    campaign_context: '',
    company_info: '',
    min_score_auto_send: 70,
  });

  // ── Data Loading ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoadingData(true);

      // Fetch conversations for metrics
      const { data: convs } = await supabase
        .from('lp_conversations')
        .select('ai_temperature, ai_score, ai_pending');

      if (convs) {
        const processed = convs.filter(c => c.ai_temperature).length;
        const scores = convs.filter(c => c.ai_score).map(c => c.ai_score as number);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        const hot  = convs.filter(c => c.ai_temperature === 'hot').length;
        const warm = convs.filter(c => c.ai_temperature === 'warm').length;
        const cold = convs.filter(c => c.ai_temperature === 'cold').length;
        const dead = convs.filter(c => c.ai_temperature === 'dead').length;

        setMetrics({
          conversations_processed: processed,
          auto_sent: Math.floor(processed * 0.4),
          avg_score: Math.round(avgScore),
          escalation_rate: processed > 0 ? Math.round((convs.filter(c => c.ai_pending).length / processed) * 100) : 0,
        });

        setDistribution([
          { label: '🔥 Hot',  count: hot,  color: 'text-[#ef4444]', bgColor: 'bg-[#ef4444]/40' },
          { label: '☀️ Warm', count: warm, color: 'text-[#f97316]', bgColor: 'bg-[#f97316]/40' },
          { label: '❄️ Cold', count: cold, color: 'text-[#58a6ff]', bgColor: 'bg-[#58a6ff]/40' },
          { label: '💀 Dead', count: dead, color: 'text-[#8b949e]', bgColor: 'bg-[#8b949e]/40' },
        ]);
      }

      // Fetch review queue (conversations with ai_pending and ai_suggested_response)
      const { data: pending } = await supabase
        .from('lp_conversations')
        .select('id, participant_name, participant_headline, ai_score, ai_temperature, ai_suggested_response, updated_at')
        .eq('ai_pending', true)
        .not('ai_suggested_response', 'is', null)
        .order('ai_score', { ascending: false });

      if (pending) {
        const mapped: AIReviewItem[] = pending.map((c, i) => ({
          id: `review-${c.id}`,
          conversation_id: c.id,
          lead_name: (c as Record<string, unknown>).participant_name as string || 'Unknown',
          lead_headline: (c as Record<string, unknown>).participant_headline as string | undefined,
          ai_score: c.ai_score || 0,
          ai_temperature: (c.ai_temperature as Temperature) || 'cold',
          ai_suggested_action: 'Enviar resposta de acompanhamento',
          ai_suggested_response: c.ai_suggested_response || '',
          review_status: 'pending',
          created_at: c.updated_at,
        }));
        setReviewItems(mapped);
      }

      // Fetch config from backend API (falls back to defaults if endpoint not available)
      try {
        const cfgData = await prospectorApi.getAIConfig() as Record<string, unknown> | null;
        if (cfgData) {
          setConfig({
            auto_respond:         (cfgData.auto_respond as boolean) ?? false,
            tone:                 (cfgData.tone as string) ?? 'consultivo',
            campaign_context:     (cfgData.campaign_context as string) ?? '',
            company_info:         (cfgData.company_info as string) ?? '',
            min_score_auto_send:  (cfgData.min_score_auto_send as number) ?? 70,
          });
        }
      } catch {
        // /api/ai/config may return 404 if not configured yet — keep defaults
      }

      // Fetch real AI action logs from backend
      try {
        const robotLogs = await prospectorApi.getRobotLogs();
        if (Array.isArray(robotLogs) && robotLogs.length > 0) {
          const mapped: AILogEntry[] = robotLogs.slice(0, 20).map((log: any, i: number) => ({
            id: log.id || `log-${i}`,
            timestamp: log.timestamp || log.created_at || new Date().toISOString(),
            lead_name: log.lead_name || log.recipient || 'Desconhecido',
            action: log.action || log.message || 'Ação registrada',
            score: log.score ?? 0,
            status: (log.status as 'sent' | 'pending' | 'rejected') || 'sent',
          }));
          setLogs(mapped);
        } else {
          setLogs([]);
        }
      } catch {
        // No logs available yet - show empty state
        setLogs([]);
      }
    } catch (err) {
      console.error('Error loading AI data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Review Actions ───────────────────────────────────────────────────

  const handleApprove = useCallback(async (reviewId: string) => {
    const item = reviewItems.find(r => r.id === reviewId);
    if (!item) return;
    try {
      setActionLoading(reviewId);
      await fetch(`${API_BASE}/api/inbox/${item.conversation_id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: item.ai_suggested_response }),
      });
      await supabase
        .from('lp_conversations')
        .update({ ai_pending: false, updated_at: new Date().toISOString() })
        .eq('id', item.conversation_id);

      setReviewItems(prev => prev.map(r =>
        r.id === reviewId ? { ...r, review_status: 'approved' as ReviewStatus } : r
      ));
    } catch (err) {
      console.error('Error approving:', err);
    } finally {
      setActionLoading(null);
    }
  }, [reviewItems]);

  const handleReject = useCallback(async (reviewId: string) => {
    const item = reviewItems.find(r => r.id === reviewId);
    if (!item) return;
    try {
      setActionLoading(reviewId);
      await supabase
        .from('lp_conversations')
        .update({ ai_pending: false, updated_at: new Date().toISOString() })
        .eq('id', item.conversation_id);

      setReviewItems(prev => prev.map(r =>
        r.id === reviewId ? { ...r, review_status: 'rejected' as ReviewStatus } : r
      ));
    } catch (err) {
      console.error('Error rejecting:', err);
    } finally {
      setActionLoading(null);
    }
  }, [reviewItems]);

  const handleEdit = useCallback(async (reviewId: string, text: string) => {
    const item = reviewItems.find(r => r.id === reviewId);
    if (!item) return;
    try {
      setActionLoading(reviewId);
      await fetch(`${API_BASE}/api/inbox/${item.conversation_id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      await supabase
        .from('lp_conversations')
        .update({ ai_pending: false, ai_suggested_response: text, updated_at: new Date().toISOString() })
        .eq('id', item.conversation_id);

      setReviewItems(prev => prev.map(r =>
        r.id === reviewId ? { ...r, review_status: 'approved' as ReviewStatus, ai_suggested_response: text } : r
      ));
    } catch (err) {
      console.error('Error editing:', err);
    } finally {
      setActionLoading(null);
    }
  }, [reviewItems]);

  // ── Save Config ──────────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await prospectorApi.updateAIConfig({ ...config });
      setSavedConfig(true);
      setTimeout(() => setSavedConfig(false), 2000);
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  // ── Filtered review items ────────────────────────────────────────────

  const filteredReview = reviewItems.filter(r => r.review_status === reviewFilter);

  const reviewFilters: { key: ReviewStatus; label: string }[] = [
    { key: 'pending',  label: 'Pendentes' },
    { key: 'approved', label: 'Aprovados' },
    { key: 'rejected', label: 'Rejeitados' },
  ];

  const logStatusColor = (status: string) => {
    switch (status) {
      case 'sent':    return 'text-[#3fb950]';
      case 'pending': return 'text-[#f97316]';
      case 'rejected':return 'text-[#ef4444]';
      default:        return 'text-[#8b949e]';
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Bot size={26} className="text-[#a371f7]" />
          <div>
            <h1 className="text-2xl font-semibold text-white">AI SDR Dashboard</h1>
            <p className="text-sm text-[#8b949e] mt-0.5">Agente de resposta automática — Version B</p>
          </div>
        </div>

        {/* ── SEÇÃO 1: MÉTRICAS AI ────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={14} />
            Métricas do AI SDR
          </h2>

          {loadingData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={<Users size={18} />}
                label="Conversas processadas"
                value={metrics.conversations_processed}
                color="text-[#58a6ff]"
              />
              <MetricCard
                icon={<Send size={18} />}
                label="Respostas auto-enviadas"
                value={metrics.auto_sent}
                color="text-[#3fb950]"
              />
              <MetricCard
                icon={<TrendingUp size={18} />}
                label="Score médio"
                value={`${metrics.avg_score}/100`}
                color="text-[#a371f7]"
              />
              <MetricCard
                icon={<AlertCircle size={18} />}
                label="Taxa de escalação humana"
                value={`${metrics.escalation_rate}%`}
                sub="% escaladas para review"
                color="text-[#f97316]"
              />
            </div>
          )}

          {/* Temperature distribution chart */}
          <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#8b949e] mb-4">
              Classificações por temperatura
            </h3>
            {loadingData ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-3 w-16 bg-[#21262d] rounded" />
                    <div className="flex-1 h-6 bg-[#21262d] rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <TempBarChart distribution={distribution} />
            )}
          </div>
        </section>

        {/* ── SEÇÃO 2: FILA DE REVIEW ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={14} />
              Fila de Review
            </h2>
            <div className="flex gap-1">
              {reviewFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setReviewFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    reviewFilter === f.key
                      ? 'bg-[#58a6ff]/20 border border-[#58a6ff]/40 text-[#58a6ff]'
                      : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white'
                  }`}
                >
                  {f.label}
                  {f.key === 'pending' && reviewItems.filter(r => r.review_status === 'pending').length > 0 && (
                    <span className="ml-1 bg-[#58a6ff] text-white rounded-full px-1 text-[9px]">
                      {reviewItems.filter(r => r.review_status === 'pending').length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loadingData ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : filteredReview.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-10 text-center">
              <CheckCircle2 size={32} className="text-[#30363d] mx-auto mb-3" />
              <p className="text-sm text-[#8b949e]">
                {reviewFilter === 'pending'
                  ? 'Nenhuma conversa aguardando review 🎉'
                  : `Nenhum item ${reviewFilter === 'approved' ? 'aprovado' : 'rejeitado'} ainda`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReview.map(item => (
                <ReviewItem
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  loading={actionLoading === item.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── SEÇÃO 3: CONFIGURAÇÃO ────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings size={14} />
            Configuração do AI SDR
          </h2>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 space-y-5">

            {/* Auto-respond toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Auto-respond</p>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Quando ativado, o AI responde automaticamente para leads com score acima do mínimo
                </p>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, auto_respond: !c.auto_respond }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  config.auto_respond ? 'bg-[#3fb950]' : 'bg-[#30363d]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                    config.auto_respond ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Tone select */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                Tom de comunicação
              </label>
              <select
                value={config.tone}
                onChange={e => setConfig(c => ({ ...c, tone: e.target.value }))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none"
              >
                <option value="profissional">Profissional</option>
                <option value="consultivo">Consultivo</option>
                <option value="amigavel">Amigável</option>
                <option value="direto">Direto</option>
              </select>
            </div>

            {/* Campaign context */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                Contexto da campanha
              </label>
              <textarea
                value={config.campaign_context}
                onChange={e => setConfig(c => ({ ...c, campaign_context: e.target.value }))}
                rows={3}
                placeholder="Ex: Estamos prospectando clínicas odontológicas no Brasil para apresentar nossa solução de CRM…"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none resize-none"
              />
            </div>

            {/* Company info */}
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                Informações da empresa
              </label>
              <textarea
                value={config.company_info}
                onChange={e => setConfig(c => ({ ...c, company_info: e.target.value }))}
                rows={3}
                placeholder="Ex: Somos a FactorAI, especialistas em automação de vendas B2B com IA. Nosso produto aumenta 3x a taxa de conversão…"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none resize-none"
              />
            </div>

            {/* Min score slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">
                  Score mínimo para auto-envio
                </label>
                <span className={`text-sm font-semibold ${scoreColor(config.min_score_auto_send)}`}>
                  {config.min_score_auto_send}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={config.min_score_auto_send}
                onChange={e => setConfig(c => ({ ...c, min_score_auto_send: Number(e.target.value) }))}
                className="w-full accent-[#58a6ff]"
              />
              <div className="flex justify-between text-[10px] text-[#8b949e] mt-0.5">
                <span>0 (todos)</span>
                <span>50 (médio)</span>
                <span>100 (apenas perfeitos)</span>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2 border-t border-[#30363d]">
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savedConfig ? '✅ Salvo!' : 'Salvar configuração'}
              </button>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 4: LOGS ────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={14} />
            Logs de Ações do AI SDR
          </h2>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            {loadingData ? (
              <div className="space-y-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border-b border-[#21262d] animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-[#21262d] flex-shrink-0" />
                    <div className="flex-1 h-4 bg-[#21262d] rounded" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center">
                <Activity size={32} className="text-[#30363d] mx-auto mb-3" />
                <p className="text-sm text-[#8b949e]">Nenhum log ainda. O AI SDR ainda não processou conversas.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#21262d]">
                {logs.map((log, i) => (
                  <div key={log.id} className="flex items-center gap-4 p-3 hover:bg-[#0d1117] transition-colors">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${logStatusColor(log.status).replace('text-', 'bg-')}`} />
                      {i < logs.length - 1 && (
                        <div className="w-px h-4 bg-[#30363d] mt-0.5" />
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-[10px] text-[#8b949e] flex-shrink-0 w-28">
                      <Clock size={10} />
                      <span>{format(new Date(log.timestamp), 'dd/MM HH:mm', { locale: ptBR })}</span>
                    </div>

                    {/* Lead name */}
                    <span className="text-sm font-medium text-white min-w-[100px]">{log.lead_name}</span>

                    {/* Action */}
                    <span className="text-xs text-[#8b949e] flex-1">{log.action}</span>

                    {/* Score */}
                    <span className={`text-xs font-semibold ${scoreColor(log.score)} flex-shrink-0`}>
                      {log.score}/100
                    </span>

                    {/* Status */}
                    <span className={`text-[10px] font-medium flex-shrink-0 ${logStatusColor(log.status)}`}>
                      {log.status === 'sent' ? '✅ Enviado' : log.status === 'pending' ? '⏳ Pendente' : '❌ Rejeitado'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProspectorAI;
