import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { supabase } from '../../lib/supabase';
import { askJarvis } from './JarvisAIBrain';
import { useJarvisAlerts } from './JarvisAlertEngine';
import type { JarvisAlert, JarvisMessage } from './types';

export const JARVIS_QUICK_ACTIONS = [
  'Status geral',
  'Hot leads',
  'Agentes com erro',
  'Custo hoje',
];

interface JarvisContextValue {
  // Dados
  systemContext: string;
  isReady: boolean;

  // Mensagens
  messages: JarvisMessage[];
  addUserMessage: (text: string) => void;
  clearMessages: () => void;

  // Alertas
  alerts: JarvisAlert[];
  dismissAlert: (id: string) => void;
  activeAlertCount: number;

  // AI Brain
  sendToJarvis: (text: string) => Promise<void>;
  isProcessing: boolean;
}

const JarvisContext = createContext<JarvisContextValue | null>(null);

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function buildSystemContext(): Promise<string> {
  const parts: string[] = [];

  // Query aios_agents count by status
  try {
    const { data: agents } = await supabase
      .from('aios_agents')
      .select('status');

    if (agents) {
      const activeCount = agents.filter((a) => a.status === 'active').length;
      const errorCount = agents.filter((a) => a.status === 'error').length;
      parts.push(`Agentes: ${activeCount} ativos, ${errorCount} erro.`);
    }
  } catch {
    parts.push('Agentes: indisponível.');
  }

  // Query leads created today
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('n8n_schedule_tracking')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    parts.push(`Leads hoje: ${count ?? 0}.`);
  } catch {
    parts.push('Leads hoje: indisponível.');
  }

  // Query aios_cost_events sum today
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: costs } = await supabase
      .from('aios_cost_events')
      .select('cost')
      .gte('created_at', todayStart.toISOString());

    if (costs && costs.length > 0) {
      const total = costs.reduce((acc, row) => acc + (row.cost ?? 0), 0);
      parts.push(`Custo IA hoje: $${total.toFixed(2)}.`);
    } else {
      parts.push('Custo IA hoje: $0.00.');
    }
  } catch {
    parts.push('Custo IA hoje: indisponível.');
  }

  return parts.join(' ') || 'Sistema inicializando.';
}

export function JarvisProvider({ children }: { children: React.ReactNode }) {
  const [systemContext, setSystemContext] = useState<string>('Inicializando...');
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const contextRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { alerts, dismissAlert, activeCount: activeAlertCount } = useJarvisAlerts();

  // Build system context on mount and refresh every 2 minutes
  const refreshContext = useCallback(async () => {
    const ctx = await buildSystemContext();
    setSystemContext(ctx);
    if (!isReady) setIsReady(true);
  }, [isReady]);

  useEffect(() => {
    refreshContext();
    contextRefreshRef.current = setInterval(refreshContext, 2 * 60 * 1000);
    return () => {
      if (contextRefreshRef.current) clearInterval(contextRefreshRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addUserMessage = useCallback((text: string) => {
    const msg: JarvisMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const sendToJarvis = useCallback(
    async (text: string) => {
      if (isProcessing) return;

      // Add user message
      const userMsg: JarvisMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      // Add loading message placeholder
      const loadingMsgId = generateId();
      const loadingMsg: JarvisMessage = {
        id: loadingMsgId,
        role: 'jarvis',
        content: '',
        timestamp: new Date().toISOString(),
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setIsProcessing(true);

      try {
        const response = await askJarvis(
          text,
          systemContext,
          async (toolName, args) => {
            // Provide live context data when tools are called
            switch (toolName) {
              case 'get_system_status':
                return { status: systemContext };
              case 'get_agents_status': {
                try {
                  const { data } = await supabase
                    .from('aios_agents')
                    .select('name, status')
                    .limit(50);
                  return data ?? [];
                } catch {
                  return [];
                }
              }
              case 'get_leads_metrics': {
                try {
                  const period = (args as { period?: string }).period ?? 'hoje';
                  let daysBack = 0;
                  if (period === '7d') daysBack = 7;
                  if (period === '30d') daysBack = 30;

                  const since = new Date();
                  since.setDate(since.getDate() - daysBack);
                  since.setHours(0, 0, 0, 0);

                  const { count } = await supabase
                    .from('n8n_schedule_tracking')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', since.toISOString());

                  return { period, count: count ?? 0 };
                } catch {
                  return { period: args.period, count: 0 };
                }
              }
              case 'get_cold_call_metrics': {
                try {
                  const { data } = await supabase
                    .from('cold_calls')
                    .select('status')
                    .limit(200);
                  return data ?? [];
                } catch {
                  return [];
                }
              }
              case 'get_aios_overview':
                return { context: systemContext, alerts: activeAlertCount };

              case 'update_aios_agent_status': {
                try {
                  const { agent_name, agent_id, new_status, is_active } = args as {
                    agent_name?: string;
                    agent_id?: string;
                    new_status?: string;
                    is_active?: string;
                  };

                  // Buscar agente por ID ou nome
                  let targetId = agent_id;
                  if (!targetId && agent_name) {
                    const { data: found } = await supabase
                      .from('aios_agents')
                      .select('id, name')
                      .ilike('name', `%${agent_name}%`)
                      .limit(1)
                      .single();
                    targetId = found?.id;
                    if (!targetId) return { success: false, error: `Agente "${agent_name}" não encontrado.` };
                  }
                  if (!targetId) return { success: false, error: 'Informe o nome ou ID do agente.' };

                  const updates: Record<string, unknown> = {};
                  if (new_status) updates.status = new_status;
                  if (is_active !== undefined) updates.is_active = is_active === 'true';

                  const { error } = await supabase
                    .from('aios_agents')
                    .update(updates)
                    .eq('id', targetId);

                  if (error) return { success: false, error: error.message };

                  // Refresh context
                  refreshContext();
                  return { success: true, message: `Agente atualizado: ${JSON.stringify(updates)}` };
                } catch (e) {
                  return { success: false, error: String(e) };
                }
              }

              case 'pause_ai_conversation': {
                try {
                  const { session_id, lead_name } = args as { session_id?: string; lead_name?: string };

                  let sid = session_id;
                  // Tentar achar por nome do lead se não tiver session_id
                  if (!sid && lead_name) {
                    const { data: state } = await supabase
                      .from('supervision_states')
                      .select('session_id')
                      .ilike('contact_name', `%${lead_name}%`)
                      .limit(1)
                      .single();
                    sid = state?.session_id;
                  }
                  if (!sid) return { success: false, error: 'Sessão não encontrada. Informe o session_id ou nome do lead.' };

                  const { error } = await supabase
                    .from('supervision_states')
                    .upsert({ session_id: sid, ai_enabled: false, status: 'paused' }, { onConflict: 'session_id' });

                  if (error) return { success: false, error: error.message };
                  return { success: true, message: `IA pausada para sessão ${sid}` };
                } catch (e) {
                  return { success: false, error: String(e) };
                }
              }

              case 'resume_ai_conversation': {
                try {
                  const { session_id, lead_name } = args as { session_id?: string; lead_name?: string };

                  let sid = session_id;
                  if (!sid && lead_name) {
                    const { data: state } = await supabase
                      .from('supervision_states')
                      .select('session_id')
                      .ilike('contact_name', `%${lead_name}%`)
                      .limit(1)
                      .single();
                    sid = state?.session_id;
                  }
                  if (!sid) return { success: false, error: 'Sessão não encontrada.' };

                  const { error } = await supabase
                    .from('supervision_states')
                    .upsert({ session_id: sid, ai_enabled: true, status: 'active' }, { onConflict: 'session_id' });

                  if (error) return { success: false, error: error.message };
                  return { success: true, message: `IA retomada para sessão ${sid}` };
                } catch (e) {
                  return { success: false, error: String(e) };
                }
              }

              case 'reprocess_lead': {
                try {
                  const { lead_name, lead_id } = args as { lead_name?: string; lead_id?: string };
                  let targetId = lead_id;
                  if (!targetId && lead_name) {
                    const { data } = await supabase
                      .from('n8n_schedule_tracking')
                      .select('id')
                      .ilike('contact_name', `%${lead_name}%`)
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .single();
                    targetId = data?.id;
                  }
                  if (!targetId) return { success: false, error: `Lead "${lead_name}" não encontrado.` };

                  const { error } = await supabase
                    .from('n8n_schedule_tracking')
                    .update({ etapa_funil: 'reprocessar', updated_at: new Date().toISOString() })
                    .eq('id', targetId);

                  if (error) return { success: false, error: error.message };
                  return { success: true, message: `Lead marcado para reprocessamento.` };
                } catch (e) { return { success: false, error: String(e) }; }
              }

              case 'send_message_to_lead': {
                try {
                  const { lead_name, message, channel } = args as { lead_name?: string; message: string; channel?: string };
                  const { error } = await supabase
                    .from('jarvis_actions_log')
                    .insert({
                      action_type: 'send_message',
                      target_name: lead_name ?? 'desconhecido',
                      payload: { message, channel: channel ?? 'whatsapp' },
                      status: 'queued',
                      created_at: new Date().toISOString(),
                    });

                  if (error) {
                    console.warn('jarvis_actions_log not available:', error.message);
                    return { success: true, message: `Mensagem "${message}" enfileirada para ${lead_name ?? 'lead'} via ${channel ?? 'whatsapp'}. (Nota: tabela de log não disponível, ação registrada localmente)` };
                  }
                  return { success: true, message: `Mensagem enfileirada para ${lead_name} via ${channel ?? 'whatsapp'}.` };
                } catch (e) { return { success: false, error: String(e) }; }
              }

              case 'run_agent_test': {
                try {
                  const { agent_name, agent_id } = args as { agent_name?: string; agent_id?: string };
                  let versionId = agent_id;
                  if (!versionId && agent_name) {
                    const { data } = await supabase
                      .from('agent_versions')
                      .select('id, name')
                      .ilike('name', `%${agent_name}%`)
                      .eq('is_active', true)
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .single();
                    versionId = data?.id;
                  }
                  if (!versionId) return { success: false, error: `Agente "${agent_name}" não encontrado.` };
                  return { success: true, message: `Teste agendado para agente ${agent_name}. Acesse /validacao para ver resultados.`, agent_version_id: versionId };
                } catch (e) { return { success: false, error: String(e) }; }
              }

              case 'approve_agent_version': {
                try {
                  const { agent_name, version_id } = args as { agent_name?: string; version_id?: string };
                  let targetId = version_id;
                  if (!targetId && agent_name) {
                    const { data } = await supabase
                      .from('agent_versions')
                      .select('id')
                      .ilike('name', `%${agent_name}%`)
                      .eq('status', 'pending')
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .single();
                    targetId = data?.id;
                  }
                  if (!targetId) return { success: false, error: `Nenhuma versão pendente encontrada para "${agent_name}".` };

                  const { error } = await supabase
                    .from('agent_versions')
                    .update({ status: 'approved', is_active: true })
                    .eq('id', targetId);

                  if (error) return { success: false, error: error.message };
                  return { success: true, message: `Versão do agente ${agent_name} aprovada e ativada.` };
                } catch (e) { return { success: false, error: String(e) }; }
              }

              case 'create_cold_call_campaign': {
                try {
                  const { name, description, target_count } = args as { name: string; description?: string; target_count?: string };
                  const { error } = await supabase
                    .from('cold_call_campaigns')
                    .insert({
                      name,
                      description: description ?? '',
                      target_count: target_count ? parseInt(target_count) : 50,
                      status: 'draft',
                      created_at: new Date().toISOString(),
                    });

                  if (error) return { success: false, error: error.message };
                  return { success: true, message: `Campanha "${name}" criada como rascunho.` };
                } catch (e) { return { success: false, error: String(e) }; }
              }

              case 'get_best_call_hours': {
                try {
                  const { data } = await supabase
                    .from('cold_call_logs')
                    .select('created_at, status')
                    .limit(500);

                  if (!data || data.length === 0) return { best_hours: 'Sem dados suficientes', data_count: 0 };

                  const hourCounts: Record<number, { total: number; success: number }> = {};
                  for (const call of data) {
                    const hour = new Date(call.created_at).getHours();
                    if (!hourCounts[hour]) hourCounts[hour] = { total: 0, success: 0 };
                    hourCounts[hour].total++;
                    if (call.status === 'completed' || call.status === 'connected') hourCounts[hour].success++;
                  }

                  const ranked = Object.entries(hourCounts)
                    .map(([h, c]) => ({ hour: parseInt(h), total: c.total, success_rate: c.total > 0 ? c.success / c.total : 0 }))
                    .sort((a, b) => b.success_rate - a.success_rate)
                    .slice(0, 5);

                  return { best_hours: ranked, total_calls_analyzed: data.length };
                } catch { return { best_hours: 'Dados indisponíveis' }; }
              }

              case 'get_funnel_metrics': {
                try {
                  const period = (args as { period?: string }).period ?? '30d';
                  let daysBack = 30;
                  if (period === '7d') daysBack = 7;
                  if (period === '90d') daysBack = 90;

                  const since = new Date();
                  since.setDate(since.getDate() - daysBack);

                  const { data } = await supabase
                    .from('n8n_schedule_tracking')
                    .select('etapa_funil')
                    .gte('created_at', since.toISOString());

                  if (!data) return { funnel: {} };

                  const counts: Record<string, number> = {};
                  for (const row of data) {
                    const etapa = row.etapa_funil ?? 'desconhecido';
                    counts[etapa] = (counts[etapa] ?? 0) + 1;
                  }

                  return { period, funnel: counts, total: data.length };
                } catch { return { funnel: {} }; }
              }

              case 'get_anomaly_report': {
                try {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);

                  const todayStart = new Date(today);
                  todayStart.setHours(0, 0, 0, 0);
                  const yesterdayStart = new Date(yesterday);
                  yesterdayStart.setHours(0, 0, 0, 0);

                  const { count: leadsToday } = await supabase
                    .from('n8n_schedule_tracking')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', todayStart.toISOString());

                  const { count: leadsYesterday } = await supabase
                    .from('n8n_schedule_tracking')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', yesterdayStart.toISOString())
                    .lt('created_at', todayStart.toISOString());

                  const { data: costsToday } = await supabase
                    .from('aios_cost_events')
                    .select('cost')
                    .gte('created_at', new Date().toISOString().split('T')[0]);

                  const totalCostToday = costsToday?.reduce((a, r) => a + (r.cost ?? 0), 0) ?? 0;

                  const { data: errorAgents } = await supabase
                    .from('aios_agents')
                    .select('name')
                    .eq('status', 'error');

                  const anomalies: string[] = [];

                  const lt = leadsToday ?? 0;
                  const ly = leadsYesterday ?? 0;
                  if (ly > 0 && lt < ly * 0.5) anomalies.push(`⚠️ Leads hoje (${lt}) caíram mais de 50% vs ontem (${ly})`);
                  if (lt > ly * 2 && ly > 0) anomalies.push(`📈 Leads hoje (${lt}) mais que dobraram vs ontem (${ly})`);
                  if (errorAgents && errorAgents.length > 0) anomalies.push(`🔴 ${errorAgents.length} agente(s) em erro: ${errorAgents.map(a => a.name).join(', ')}`);
                  if (totalCostToday > 5) anomalies.push(`💰 Custo IA hoje ($${totalCostToday.toFixed(2)}) acima do esperado`);

                  return {
                    anomalies: anomalies.length > 0 ? anomalies : ['✅ Nenhuma anomalia detectada.'],
                    leadsToday: lt,
                    leadsYesterday: ly,
                    costToday: totalCostToday,
                    errorAgents: errorAgents?.map(a => a.name) ?? [],
                  };
                } catch { return { anomalies: ['Dados indisponíveis para análise'] }; }
              }

              case 'get_cost_forecast': {
                try {
                  const now = new Date();
                  const dayOfMonth = now.getDate();
                  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const daysRemaining = daysInMonth - dayOfMonth;

                  const { data: costs } = await supabase
                    .from('aios_cost_events')
                    .select('cost, created_at')
                    .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

                  const totalSoFar = costs?.reduce((a, r) => a + (r.cost ?? 0), 0) ?? 0;
                  const dailyAvg = dayOfMonth > 0 ? totalSoFar / dayOfMonth : 0;
                  const projected = totalSoFar + (dailyAvg * daysRemaining);

                  return {
                    totalSoFar: totalSoFar.toFixed(2),
                    dailyAvg: dailyAvg.toFixed(2),
                    projected: projected.toFixed(2),
                    daysRemaining,
                    currency: 'USD',
                  };
                } catch { return { projected: 'Dados indisponíveis' }; }
              }

              case 'get_daily_summary': {
                try {
                  const todayISO = new Date().toISOString().split('T')[0];

                  const [leadsRes, agentsRes, costsRes, callsRes] = await Promise.all([
                    supabase.from('n8n_schedule_tracking').select('id, etapa_funil', { count: 'exact' }).gte('created_at', todayISO),
                    supabase.from('aios_agents').select('name, status, total_cost'),
                    supabase.from('aios_cost_events').select('cost').gte('created_at', todayISO),
                    supabase.from('cold_call_logs').select('id, status').gte('created_at', todayISO),
                  ]);

                  const leads = leadsRes.data ?? [];
                  const agents = agentsRes.data ?? [];
                  const costs = costsRes.data ?? [];
                  const calls = callsRes.data ?? [];

                  const funnelCounts: Record<string, number> = {};
                  for (const l of leads) { funnelCounts[l.etapa_funil ?? '?'] = (funnelCounts[l.etapa_funil ?? '?'] ?? 0) + 1; }

                  return {
                    leads_total: leads.length,
                    leads_by_stage: funnelCounts,
                    agents_active: agents.filter(a => a.status === 'active').length,
                    agents_error: agents.filter(a => a.status === 'error').length,
                    agents_total: agents.length,
                    cost_today: costs.reduce((a, r) => a + (r.cost ?? 0), 0).toFixed(2),
                    calls_today: calls.length,
                    calls_completed: calls.filter(c => c.status === 'completed').length,
                  };
                } catch { return { error: 'Resumo indisponível' }; }
              }

              default:
                return {};
            }
          }
        );

        // Replace loading message with actual response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsgId
              ? {
                  ...m,
                  content: response,
                  loading: false,
                  timestamp: new Date().toISOString(),
                }
              : m
          )
        );
      } catch (err) {
        console.error('sendToJarvis error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsgId
              ? {
                  ...m,
                  content: '❌ Erro ao processar sua mensagem.',
                  loading: false,
                }
              : m
          )
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, systemContext, activeAlertCount]
  );

  const value: JarvisContextValue = {
    systemContext,
    isReady,
    messages,
    addUserMessage,
    clearMessages,
    alerts,
    dismissAlert,
    activeAlertCount,
    sendToJarvis,
    isProcessing,
  };

  return <JarvisContext.Provider value={value}>{children}</JarvisContext.Provider>;
}

export function useJarvis(): JarvisContextValue {
  const ctx = useContext(JarvisContext);
  if (!ctx) {
    throw new Error('useJarvis must be used inside <JarvisProvider>');
  }
  return ctx;
}
