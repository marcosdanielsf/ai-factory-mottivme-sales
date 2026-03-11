import React, { useState, useMemo } from 'react';
import { X, Clock, TrendingUp, Target, Phone, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useDailyCallDetails } from '../../hooks/useDailyCallDetails';
import { TranscriptModal } from './TranscriptModal';
import { CallStatusBadge } from './CallStatusBadge';
import type { ColdCallLog } from '../../hooks/useColdCalls';

interface DailyCallsDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null; // formato: "2026-02-08"
}

// Taxa de conversão USD → BRL (fixo)
const USD_TO_BRL = 5.50;

// ─── Análise de Qualidade IA ───────────────────────────────

interface QualityScore {
  total: number;
  breakdown: {
    duration: number;
    answered: number;
    goal: number;
    interested: number;
    hasTranscript: number;
    conversationDepth: number;
    hasNextAction: number;
  };
}

function calculateQualityScore(call: ColdCallLog): QualityScore {
  const breakdown = {
    duration: 0,
    answered: 0,
    goal: 0,
    interested: 0,
    hasTranscript: 0,
    conversationDepth: 0,
    hasNextAction: 0,
  };

  // +20pts: conversou tempo suficiente (>= 30s)
  if (call.duration_seconds && call.duration_seconds >= 30) {
    breakdown.duration = 20;
  }

  // +20pts: atendeu (outcome != 'nao_atendeu')
  if (call.outcome && call.outcome !== 'nao_atendeu') {
    breakdown.answered = 20;
  }

  // +30pts: goal reached (agendou)
  if (call.outcome === 'agendou') {
    breakdown.goal = 30;
  }

  // +15pts: interessado
  if (call.outcome === 'interessado') {
    breakdown.interested = 15;
  }

  // +10pts: transcript não vazio
  if (call.transcript && call.transcript.trim().length > 0) {
    breakdown.hasTranscript = 10;

    // +20pts: conversa real (mais de 4 turnos)
    const turnCount = countTranscriptTurns(call.transcript);
    if (turnCount > 4) {
      breakdown.conversationDepth = 20;
    }
  }

  // +10pts: next_action preenchido
  if (call.next_action && call.next_action.trim().length > 0) {
    breakdown.hasNextAction = 10;
  }

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { total, breakdown };
}

function countTranscriptTurns(transcript: string): number {
  if (!transcript) return 0;
  
  try {
    // Try parse JSON first
    const parsed = JSON.parse(transcript);
    if (Array.isArray(parsed)) return parsed.length;
  } catch {
    // Not JSON, count lines with role prefix
    const lines = transcript.split('\n').filter(line => 
      /^(agente?|lead|sistema?|agent|customer|user|bot|ai)\s*:/i.test(line)
    );
    return lines.length;
  }
  
  return 0;
}

function getScoreBadge(score: number) {
  if (score < 40) {
    return {
      emoji: '🔴',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      label: 'Baixo'
    };
  } else if (score < 70) {
    return {
      emoji: '🟡',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      label: 'Médio'
    };
  } else {
    return {
      emoji: '🟢',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      label: 'Alto'
    };
  }
}

// ─── Component ──────────────────────────────────────────────

export function DailyCallsDrilldown({ isOpen, onClose, date }: DailyCallsDrilldownProps) {
  const { calls, loading } = useDailyCallDetails(date);
  const [selectedCall, setSelectedCall] = useState<ColdCallLog | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Calcular estatísticas do dia
  const dayStats = useMemo(() => {
    if (calls.length === 0) {
      return {
        totalCalls: 0,
        avgScore: 0,
        successRate: 0,
        totalCost: 0,
      };
    }

    const scores = calls.map(call => calculateQualityScore(call).total);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    const successCount = calls.filter(c => c.outcome === 'agendou').length;
    const successRate = (successCount / calls.length) * 100;

    const totalCost = calls.reduce((sum, c) => sum + (c.cost_usd || 0), 0);

    return {
      totalCalls: calls.length,
      avgScore: Math.round(avgScore),
      successRate: Math.round(successRate),
      totalCost,
    };
  }, [calls]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatCost = (usd: number | null) => {
    if (!usd) return '$0.00';
    return `$${usd.toFixed(4)}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-6xl max-h-[90vh] flex flex-col bg-white/5 border border-white/10 rounded-xl shadow-2xl pointer-events-auto overflow-hidden">
          
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10 shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                Detalhes do Dia
              </h2>
              <p className="text-sm text-gray-400">
                {date ? formatDate(date) : '—'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Phone size={14} />
                Total Leads
              </div>
              <p className="text-2xl font-bold text-white">{dayStats.totalCalls}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <TrendingUp size={14} />
                Score Médio IA
              </div>
              <p className="text-2xl font-bold text-white">{dayStats.avgScore}%</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Target size={14} />
                Taxa Sucesso
              </div>
              <p className="text-2xl font-bold text-emerald-400">{dayStats.successRate}%</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Clock size={14} />
                Custo Total
              </div>
              <p className="text-2xl font-bold text-white">{formatCost(dayStats.totalCost)}</p>
              <p className="text-xs text-emerald-400 mt-0.5">
                R${(dayStats.totalCost * USD_TO_BRL).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Calls List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
              </div>
            ) : calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Phone size={48} className="opacity-20 mb-3" />
                <p className="text-sm font-medium">Nenhuma chamada neste dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => {
                  const score = calculateQualityScore(call);
                  const badge = getScoreBadge(score.total);
                  const isExpanded = expandedCallId === call.id;

                  return (
                    <div
                      key={call.id}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-400/30 transition-all duration-200"
                    >
                      {/* Main Row */}
                      <div className="grid grid-cols-12 gap-4 p-4 items-center">
                        {/* Horário */}
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-sm font-medium text-white">
                            {formatTime(call.started_at)}
                          </p>
                        </div>

                        {/* Lead */}
                        <div className="col-span-4 md:col-span-2">
                          <p className="text-sm font-medium text-white truncate">
                            {call.lead_name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {call.phone || '—'}
                          </p>
                        </div>

                        {/* Duração */}
                        <div className="col-span-2 md:col-span-1 text-center">
                          <p className="text-sm text-gray-400">
                            {formatDuration(call.duration_seconds)}
                          </p>
                        </div>

                        {/* Outcome */}
                        <div className="col-span-4 md:col-span-2">
                          <CallStatusBadge status={call.status} outcome={call.outcome} />
                        </div>

                        {/* Custo */}
                        <div className="col-span-3 md:col-span-2 text-right">
                          <p className="text-sm font-semibold text-white">
                            {formatCost(call.cost_usd)}
                          </p>
                          <p className="text-xs text-emerald-400">
                            R${((call.cost_usd || 0) * USD_TO_BRL).toFixed(2)}
                          </p>
                        </div>

                        {/* Score IA */}
                        <div className="col-span-3 md:col-span-2">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${badge.color}`}>
                            <span>{badge.emoji}</span>
                            <span>{score.total}%</span>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="col-span-6 md:col-span-2 flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setSelectedCall(call)}
                            className="px-3 py-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all"
                          >
                            <MessageSquare size={12} className="inline mr-1" />
                            Transcript
                          </button>
                          <button
                            onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-white/10 bg-white/[0.02] p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Duração</p>
                              <p className="text-white font-medium">
                                {score.breakdown.duration > 0 ? '✅' : '❌'} {formatDuration(call.duration_seconds)}
                                <span className="text-xs text-gray-400 ml-1">({score.breakdown.duration}pts)</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Atendeu</p>
                              <p className="text-white font-medium">
                                {score.breakdown.answered > 0 ? '✅' : '❌'}
                                <span className="text-xs text-gray-400 ml-1">({score.breakdown.answered}pts)</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Resultado</p>
                              <p className="text-white font-medium">
                                {score.breakdown.goal > 0 ? '🎯' : score.breakdown.interested > 0 ? '👍' : '—'}
                                <span className="text-xs text-gray-400 ml-1">
                                  ({score.breakdown.goal + score.breakdown.interested}pts)
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Conversa</p>
                              <p className="text-white font-medium">
                                {score.breakdown.conversationDepth > 0 ? '💬' : score.breakdown.hasTranscript > 0 ? '📝' : '—'}
                                <span className="text-xs text-gray-400 ml-1">
                                  ({score.breakdown.conversationDepth + score.breakdown.hasTranscript}pts)
                                </span>
                              </p>
                            </div>
                          </div>
                          {call.next_action && (
                            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <p className="text-xs text-purple-400 font-semibold mb-1">Próxima Ação:</p>
                              <p className="text-sm text-white">{call.next_action}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Modal */}
      <TranscriptModal
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
        call={selectedCall}
      />
    </>
  );
}
