import React, { useState } from 'react';
import {
  Trophy,
  Phone,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import { MetricCard } from '../../../../components/MetricCard';
import type { CallAnalysis, AggregatedStats } from '../../../../hooks/useCallAnalytics';

// ═══════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════

interface TecnicaVendasTabProps {
  calls: CallAnalysis[];
  stats: AggregatedStats;
  loading: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const notaColor = (nota: string): string => {
  if (nota === 'A') return 'text-emerald-400';
  if (nota === 'B') return 'text-blue-400';
  if (nota === 'C') return 'text-amber-400';
  if (nota === 'D') return 'text-orange-400';
  return 'text-red-400';
};

const notaBg = (nota: string): string => {
  if (nota === 'A') return 'bg-emerald-500/10';
  if (nota === 'B') return 'bg-blue-500/10';
  if (nota === 'C') return 'bg-amber-500/10';
  if (nota === 'D') return 'bg-orange-500/10';
  return 'bg-red-500/10';
};

const scoreBarColor = (score: number): string => {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-blue-500';
  if (score >= 4) return 'bg-amber-500';
  return 'bg-red-500';
};

const formatDate = (iso: string): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// ═══════════════════════════════════════════════════════════════════════
// SCORE BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ScoreBar = ({ label, score, max = 10 }: { label: string; score: number; max?: number }) => {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted w-24 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-text-primary w-12 text-right">{score}/10</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// CALL ROW (EXPANDABLE)
// ═══════════════════════════════════════════════════════════════════════

const CallRow = ({ call }: { call: CallAnalysis }) => {
  const [expanded, setExpanded] = useState(false);
  const a = call.analise;
  const score = a.analise_geral?.score_total ?? 0;
  const nota = a.veredicto_final?.nota_geral || '-';
  const status = a.analise_geral?.status || '-';
  const leadName = call.nome_lead || call.contact_name || 'Lead sem nome';

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-bg-tertiary transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-text-muted shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-text-muted shrink-0" />
        )}

        <span className="text-sm text-text-primary font-medium flex-1 truncate">{leadName}</span>

        <span className="text-xs text-text-muted hidden sm:inline">{formatDate(call.created_at)}</span>

        <span className="text-xs text-text-muted capitalize hidden sm:inline">{call.tipo}</span>

        <span className="text-sm font-bold text-text-primary w-14 text-right">{score}/100</span>

        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${notaColor(nota)} ${notaBg(nota)}`}>
          {nota}
        </span>

        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
          status.toLowerCase().includes('quente') ? 'bg-emerald-500/10 text-emerald-400' :
          status.toLowerCase().includes('morno') ? 'bg-amber-500/10 text-amber-400' :
          status.toLowerCase().includes('frio') ? 'bg-blue-500/10 text-blue-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {status}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border-default p-4 space-y-4 bg-bg-tertiary/50">
          {/* Resumo executivo */}
          {a.analise_geral?.resumo_executivo && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase mb-1 flex items-center gap-1">
                <MessageSquare size={12} /> Resumo
              </h4>
              <p className="text-sm text-text-secondary">{a.analise_geral.resumo_executivo}</p>
            </div>
          )}

          {/* Scores detalhados */}
          {a.scores_detalhados && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1">
                <Target size={12} /> Scores por Tecnica
              </h4>
              <div className="space-y-2">
                <ScoreBar label="BANT" score={a.scores_detalhados.qualificacao_bant?.score ?? 0} />
                <ScoreBar label="SPIN" score={a.scores_detalhados.descoberta_spin?.score ?? 0} />
                <ScoreBar label="Conducao" score={a.scores_detalhados.conducao?.score ?? 0} />
                <ScoreBar label="Fechamento" score={a.scores_detalhados.fechamento?.score ?? 0} />
              </div>
            </div>
          )}

          {/* Red Flags */}
          {a.red_flags?.flags_identificados && a.red_flags.flags_identificados.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase mb-2 flex items-center gap-1">
                <XCircle size={12} /> Red Flags ({a.red_flags.flags_identificados.length})
              </h4>
              <ul className="space-y-1">
                {a.red_flags.flags_identificados.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-400 mt-0.5 shrink-0">&#8226;</span>
                    <div>
                      <span className="text-text-secondary">{f.flag}</span>
                      {f.evidencia && <p className="text-xs text-text-muted italic mt-0.5">{f.evidencia}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Oportunidades Perdidas */}
          {a.oportunidades_perdidas && a.oportunidades_perdidas.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-amber-400 uppercase mb-2 flex items-center gap-1">
                <Lightbulb size={12} /> Oportunidades Perdidas ({a.oportunidades_perdidas.length})
              </h4>
              <ul className="space-y-2">
                {a.oportunidades_perdidas.map((op, i) => (
                  <li key={i} className="text-sm bg-bg-secondary rounded-lg p-2">
                    <p className="text-text-secondary">{op.oportunidade}</p>
                    {op.pergunta_sugerida && (
                      <p className="text-xs text-accent-primary mt-1">Sugestao: "{op.pergunta_sugerida}"</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Highlights */}
          {a.highlights_positivos && a.highlights_positivos.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 uppercase mb-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Pontos Positivos ({a.highlights_positivos.length})
              </h4>
              <ul className="space-y-1">
                {a.highlights_positivos.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-400 mt-0.5 shrink-0">&#8226;</span>
                    <span className="text-text-secondary">{h.por_que_foi_bom || h.citacao || h.momento}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Citacoes Criticas */}
          {a.citacoes_criticas && a.citacoes_criticas.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-1">
                <MessageSquare size={12} /> Citacoes Criticas
              </h4>
              <div className="space-y-2">
                {a.citacoes_criticas.map((c, i) => (
                  <div key={i} className="text-sm bg-bg-secondary rounded-lg p-2 border-l-2 border-accent-primary/30">
                    <p className="text-text-secondary italic">"{c.texto}"</p>
                    <p className="text-xs text-text-muted mt-1">— {c.quem} {c.tipo ? `(${c.tipo})` : ''}</p>
                    {c.analise && <p className="text-xs text-text-muted mt-0.5">{c.analise}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plano de Acao */}
          {a.plano_acao?.para_vendedor?.imediato && a.plano_acao.para_vendedor.imediato.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-accent-primary uppercase mb-2 flex items-center gap-1">
                <ClipboardList size={12} /> Plano de Acao
              </h4>
              <ol className="space-y-1 list-decimal list-inside">
                {a.plano_acao.para_vendedor.imediato.map((item, i) => (
                  <li key={i} className="text-sm text-text-secondary">{item}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Veredicto Final */}
          {a.veredicto_final && (
            <div className="bg-bg-secondary rounded-lg p-3 border border-border-default">
              <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Veredicto Final</h4>
              {a.veredicto_final.resumo_uma_frase && (
                <p className="text-sm text-text-primary font-medium mb-2">{a.veredicto_final.resumo_uma_frase}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {a.veredicto_final.principal_acerto && (
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-text-secondary"><strong>Acerto:</strong> {a.veredicto_final.principal_acerto}</span>
                  </div>
                )}
                {a.veredicto_final.principal_erro && (
                  <div className="flex items-start gap-1.5">
                    <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                    <span className="text-text-secondary"><strong>Erro:</strong> {a.veredicto_final.principal_erro}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN TAB COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export function TecnicaVendasTab({ calls, stats, loading }: TecnicaVendasTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-bg-tertiary rounded w-1/2 mb-2" />
              <div className="h-8 bg-bg-tertiary rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6 animate-pulse">
          <div className="h-32 bg-bg-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-16">
        <Phone size={40} className="mx-auto text-text-muted/30 mb-4" />
        <h3 className="text-sm font-semibold text-text-primary mb-1">Nenhuma call analisada ainda</h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Quando as calls forem analisadas pelo Head de Vendas AI, os scores de tecnica aparecerao aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Score Medio"
          value={`${stats.avgScore}/100`}
          icon={Trophy}
          subtext={`${stats.totalCalls} calls analisadas`}
        />
        <MetricCard
          title="Calls Analisadas"
          value={stats.totalCalls}
          icon={Phone}
          subtext="No periodo selecionado"
        />
        <MetricCard
          title="Red Flags"
          value={stats.totalRedFlags}
          icon={AlertTriangle}
          subtext={stats.totalRedFlags === 0 ? 'Nenhum problema' : 'Problemas detectados'}
        />
        <MetricCard
          title="Nota Media"
          value={stats.avgNota}
          icon={Award}
          subtext={
            stats.avgNota === 'A' ? 'Excelente' :
            stats.avgNota === 'B' ? 'Boa' :
            stats.avgNota === 'C' ? 'Mediana' :
            stats.avgNota === 'D' ? 'Fraca' :
            stats.avgNota === 'F' ? 'Critica' : '-'
          }
        />
      </div>

      {/* Scores por Tecnica (aggregated) */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Scores por Tecnica</h3>
        <p className="text-[10px] text-text-muted mb-4">Media de todas as calls analisadas</p>
        <div className="space-y-3">
          <ScoreBar label="Qualificacao (BANT)" score={stats.scores.bant} />
          <ScoreBar label="Descoberta (SPIN)" score={stats.scores.spin} />
          <ScoreBar label="Conducao" score={stats.scores.conducao} />
          <ScoreBar label="Fechamento" score={stats.scores.fechamento} />
        </div>
      </div>

      {/* Red Flags + Highlights side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Red Flags */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Red Flags Frequentes
          </h3>
          {stats.topRedFlags.length === 0 ? (
            <p className="text-xs text-text-muted">Nenhum red flag detectado</p>
          ) : (
            <ul className="space-y-2">
              {stats.topRedFlags.map((rf, i) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-text-secondary flex-1">{rf.flag}</span>
                  <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">{rf.count}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Highlights */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Pontos Fortes
          </h3>
          {stats.topHighlights.length === 0 ? (
            <p className="text-xs text-text-muted">Nenhum destaque positivo ainda</p>
          ) : (
            <ul className="space-y-2">
              {stats.topHighlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-text-secondary flex-1">{h.text}</span>
                  <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">{h.count}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Calls Analisadas */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Calls Analisadas</h3>
        <div className="space-y-2">
          {calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
      </div>
    </div>
  );
}
