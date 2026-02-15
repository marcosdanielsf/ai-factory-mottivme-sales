import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================================================
// HOOK: useSocialSellingFunnel
// Segmenta o funil de vendas por origem: Social Selling vs Trafego
// Usa campos: origem_lead, tipo_contato, tipo_servico (classificacao 3D)
// ============================================================================

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface FunnelSegment {
  leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
}

interface AgentBreakdown {
  agente: string;
  origem: string;
  leads: number;
  responderam: number;
  agendaram: number;
  fecharam: number;
  taxaConversao: number;
}

interface DailyTrend {
  date: string;
  socialSelling: number;
  trafego: number;
  organico: number;
  naoClassificado: number;
}

export interface SocialSellingFunnelData {
  socialSelling: FunnelSegment;
  trafego: FunnelSegment;
  organico: FunnelSegment;
  naoClassificado: FunnelSegment;
  porAgente: AgentBreakdown[];
  dailyTrend: DailyTrend[];
  totalLeads: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type OrigemBucket = 'social_selling' | 'trafego' | 'organico' | 'nao_classificado';

// Classifica origem_lead em 4 buckets mais granulares
function classifyOrigem(origemLead: string | null, sessionSource: string | null): OrigemBucket {
  const ol = (origemLead || '').toLowerCase().trim();
  const ss = (sessionSource || '').trim();

  // 1. origem_lead explicito (vindo do workflow 3D ou backfill)
  if (['ns', 'vs', 'gs', 'social_selling'].includes(ol)) return 'social_selling';
  if (ol === 'trafego') return 'trafego';
  if (['organico', 'direto', 'whatsapp_direto'].includes(ol)) return 'organico';

  // 2. Fallback: session_source
  if (ss === 'Paid Social') return 'trafego';
  if (ss === 'Social media') return 'social_selling'; // Instagram organico = social selling
  if (['Direct traffic'].includes(ss)) return 'organico';
  if (['Organic', 'Orgânico'].includes(ss)) return 'organico';

  // 3. Fallback: se tem UTMs = trafego
  // (checado no caller via lead.utm_source)

  return 'nao_classificado';
}

// Fallback extra: checar UTMs do lead
function classifyLeadOrigem(lead: any): OrigemBucket {
  const bucket = classifyOrigem(lead.origem_lead, lead.session_source);
  if (bucket === 'nao_classificado') {
    // Se tem utm_source preenchido, provavelmente e trafego
    const utmSource = (lead.utm_source || '').trim();
    if (utmSource && utmSource !== 'NULL') return 'trafego';
  }
  return bucket;
}

export const useSocialSellingFunnel = (
  dateRange?: DateRange | null,
  locationId?: string | null
): SocialSellingFunnelData => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = dateRange?.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

      const endDate = dateRange?.endDate || (() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
      })();

      // Query leads — so colunas necessarias (evita 500 por payload grande)
      let leadsQuery = supabase
        .from('n8n_schedule_tracking')
        .select('unique_id,created_at,location_id,location_name,origem_lead,session_source,utm_source,etapa_funil,responded')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50000);

      if (locationId) {
        leadsQuery = leadsQuery.eq('location_id', locationId);
      }

      // Query appointments para cross-reference
      const apptStart = new Date(startDate);
      apptStart.setDate(apptStart.getDate() - 30);
      const apptEnd = new Date(endDate);
      apptEnd.setDate(apptEnd.getDate() + 60);

      let apptsQuery = supabase
        .from('appointments_log')
        .select('raw_payload, appointment_date, created_at, manual_status')
        .gte('appointment_date', apptStart.toISOString())
        .lte('appointment_date', apptEnd.toISOString())
        .limit(50000);

      if (locationId) {
        apptsQuery = apptsQuery.eq('location_id', locationId);
      }

      const [leadsResult, apptsResult] = await Promise.all([leadsQuery, apptsQuery]);

      if (leadsResult.error) throw new Error(leadsResult.error.message);

      setRawData(leadsResult.data || []);
      setAppointmentsData(apptsResult.data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      console.error('[SocialSellingFunnel Error]', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime(), locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const result = useMemo(() => {
    // Build appointment lookup (mesma logica de useCriativoPerformance)
    const contactApptMap = new Map<string, {
      appointmentDate: string;
      calendarStatus: string;
      confirmedPresence: boolean;
      converted: boolean;
    }>();

    const apptDedup = new Map<string, any>();
    for (const appt of appointmentsData) {
      const appointmentId = appt.raw_payload?.calendar?.appointmentId;
      if (!appointmentId) continue;
      const existing = apptDedup.get(appointmentId);
      if (!existing || (appt.created_at && (!existing.created_at || appt.created_at > existing.created_at))) {
        apptDedup.set(appointmentId, appt);
      }
    }

    for (const appt of apptDedup.values()) {
      const contactId = appt.raw_payload?.contact_id;
      if (!contactId) continue;
      const calStatus = (appt.raw_payload?.calendar?.appoinmentStatus || '').toLowerCase();
      if (calStatus === 'cancelled') continue;
      const apptDate = appt.appointment_date || appt.raw_payload?.calendar?.startTime;
      const statusAppt = (appt.raw_payload?.['Status Appointment'] || '').toLowerCase();
      const manualStatus = (appt.manual_status || '').toLowerCase();
      const existing = contactApptMap.get(contactId);
      if (!existing || (apptDate && apptDate > existing.appointmentDate)) {
        contactApptMap.set(contactId, {
          appointmentDate: apptDate,
          calendarStatus: calStatus,
          confirmedPresence: statusAppt === 'confirmation-presence',
          converted: manualStatus === 'converted',
        });
      }
    }

    // Segmentos
    const emptySegment = (): FunnelSegment => ({ leads: 0, responderam: 0, agendaram: 0, compareceram: 0, fecharam: 0 });
    const segments: Record<OrigemBucket, FunnelSegment> = {
      social_selling: emptySegment(),
      trafego: emptySegment(),
      organico: emptySegment(),
      nao_classificado: emptySegment(),
    };

    // Agente breakdown
    const agenteMap: Record<string, {
      agente: string;
      origem: string;
      leads: number;
      responderam: number;
      agendaram: number;
      fecharam: number;
    }> = {};

    // Daily trend
    const dailyMap: Record<string, { socialSelling: number; trafego: number; organico: number; naoClassificado: number }> = {};

    const now = new Date();

    rawData.forEach((lead) => {
      const bucket = classifyLeadOrigem(lead);
      const etapaVal = (lead.etapa_funil || '').toLowerCase();

      // Cross-reference appointments
      const apptData = lead.unique_id ? contactApptMap.get(lead.unique_id) : null;
      const isNoShow = etapaVal.includes('no-show') || etapaVal.includes('no_show');

      // Agendou = etapa_funil indica agendamento (bot classificou)
      const agendou = ['agendou', 'agendado', 'no-show', 'no_show'].some(s => etapaVal.includes(s));
      // Compareceu = confirmation-presence no appointments_log (status manual)
      const compareceu = apptData?.confirmedPresence === true;
      // Fechou = etapa_funil fechou OU manual_status converted
      const fechou = ['fechou', 'won', 'fechado'].some(s => etapaVal.includes(s))
        || apptData?.converted === true;
      // Responderam = qualquer etapa alem de "novo" (em contato, agendou, fechou, etc.)
      const responded = lead.responded === true || lead.responded === 'true'
        || agendou
        || (etapaVal && !['novo', ''].includes(etapaVal));

      // Segmento
      const seg = segments[bucket];
      seg.leads++;
      if (responded) seg.responderam++;
      if (agendou) seg.agendaram++;
      if (compareceu) seg.compareceram++;
      if (fechou) seg.fecharam++;

      // Agente breakdown — agrupar por location_id (evita duplicatas de nome)
      const locId = lead.location_id || '_sem_location';
      const locLabel = lead.location_name || (locId === '_sem_location' ? 'Leads Antigos (sem location)' : locId);
      const agenteKey = `${locId}__${bucket}`;
      if (!agenteMap[agenteKey]) {
        agenteMap[agenteKey] = { agente: locLabel, origem: bucket, leads: 0, responderam: 0, agendaram: 0, fecharam: 0 };
      }
      // Atualizar label caso tenha vindo null antes e agora tem nome
      if (lead.location_name && agenteMap[agenteKey].agente !== lead.location_name) {
        agenteMap[agenteKey].agente = lead.location_name;
      }
      agenteMap[agenteKey].leads++;
      if (responded) agenteMap[agenteKey].responderam++;
      if (agendou) agenteMap[agenteKey].agendaram++;
      if (fechou) agenteMap[agenteKey].fecharam++;

      // Daily trend
      const dateKey = lead.created_at?.slice(0, 10) || 'unknown';
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { socialSelling: 0, trafego: 0, organico: 0, naoClassificado: 0 };
      }
      const trendKey = bucket === 'social_selling' ? 'socialSelling'
        : bucket === 'nao_classificado' ? 'naoClassificado'
        : bucket;
      dailyMap[dateKey][trendKey as keyof typeof dailyMap[string]]++;
    });

    // Converter agentes para array
    const porAgente: AgentBreakdown[] = Object.values(agenteMap)
      .map(a => ({
        ...a,
        taxaConversao: a.leads > 0 ? Math.round((a.fecharam / a.leads) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    // Converter daily trend
    const dailyTrend: DailyTrend[] = Object.entries(dailyMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      socialSelling: segments.social_selling,
      trafego: segments.trafego,
      organico: segments.organico,
      naoClassificado: segments.nao_classificado,
      porAgente,
      dailyTrend,
      totalLeads: rawData.length,
    };
  }, [rawData, appointmentsData]);

  return { ...result, loading, error, refetch: fetchData };
};

export default useSocialSellingFunnel;
