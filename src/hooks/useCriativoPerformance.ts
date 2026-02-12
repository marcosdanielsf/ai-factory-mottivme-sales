import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================================================
// HOOK: useCriativoPerformance
// Busca performance de leads por criativo (utm_content) do Meta Ads
// Permite rastrear ROI real: criativo → lead → agendamento → conversão
// ============================================================================

export interface CriativoLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  unique_id: string | null;
  contact_id: string | null;
  source: string | null;
  location_name: string | null;
  utm_content: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  ad_id: string | null;
  session_source: string | null;
  responded: boolean | null;
  status: string | null;
  etapa_funil: string | null;
  state: string | null;
  work_permit: string | null;
  created_at: string;
}

export interface CriativoMetrics {
  criativo: string;        // utm_content ou "Orgânico" / "Outros"
  adId: string | null;     // ad_id do Meta
  leads: number;           // Total de leads
  responderam: number;     // Leads que responderam
  agendaram: number;       // Leads que agendaram
  compareceram: number;    // Leads que compareceram (completed)
  fecharam: number;        // Leads convertidos (won)
  taxaResposta: number;    // % responderam
  taxaAgendamento: number; // % agendaram
  taxaConversao: number;   // % fecharam
}

export interface OrigemMetrics {
  origem: string;          // session_source (Paid Social, Social media, etc)
  leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
}

interface UseCriativoPerformanceReturn {
  criativos: CriativoMetrics[];
  origens: OrigemMetrics[];
  leads: CriativoLead[];
  totals: {
    totalLeads: number;
    totalResponderam: number;
    totalAgendaram: number;
    totalCompareceram: number;
    totalFecharam: number;
    totalPaidSocial: number;
    totalOrganic: number;
    comUtmContent: number;
    semUtmContent: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Normaliza utm_content para evitar "NULL" como string
function normalizeUtmContent(value: string | null): string | null {
  if (!value || value === 'NULL' || value === 'null' || value.trim() === '') {
    return null;
  }
  return value;
}

// Normaliza session_source
function normalizeSessionSource(value: string | null): string {
  if (!value || value === 'NULL' || value === 'null' || value.trim() === '') {
    return 'Desconhecido';
  }
  return value;
}

export const useCriativoPerformance = (
  dateRange?: DateRange | null,
  locationId?: string | null
): UseCriativoPerformanceReturn => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calcular datas do período
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

      // Query 1: Leads da n8n_schedule_tracking com dados UTM
      let leadsQuery = supabase
        .from('n8n_schedule_tracking')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10000);

      if (locationId) {
        leadsQuery = leadsQuery.eq('location_id', locationId);
      }

      // Query 2: Appointments do GHL para cross-reference
      // Range amplo: -30 dias antes do início até +60 dias após o fim
      // Assim pega appointments de leads criados no período mesmo se a data do agendamento é fora
      const apptStart = new Date(startDate);
      apptStart.setDate(apptStart.getDate() - 30);
      const apptEnd = new Date(endDate);
      apptEnd.setDate(apptEnd.getDate() + 60);

      let apptsQuery = supabase
        .from('appointments_log')
        .select('raw_payload, appointment_date, created_at, manual_status')
        .gte('appointment_date', apptStart.toISOString())
        .lte('appointment_date', apptEnd.toISOString())
        .limit(10000);

      if (locationId) {
        apptsQuery = apptsQuery.eq('location_id', locationId);
      }

      // Executar em paralelo
      const [leadsResult, apptsResult] = await Promise.all([leadsQuery, apptsQuery]);

      if (leadsResult.error) {
        throw new Error(leadsResult.error.message);
      }

      setRawData(leadsResult.data || []);
      setAppointmentsData(apptsResult.data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de criativos');
      console.error('[CriativoPerformance Error]', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime(), locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Processar dados para métricas
  const { criativos, origens, totals } = useMemo(() => {
    // ================================================================
    // STEP 1: Build appointment lookup from appointments_log
    // Key: contactId (= unique_id in n8n_schedule_tracking)
    // Dedup by appointmentId, keep most recent
    // ================================================================
    const contactApptMap = new Map<string, {
      appointmentDate: string;
      calendarStatus: string; // confirmed, new, cancelled
      confirmedPresence: boolean; // Status Appointment = "confirmation-presence"
      converted: boolean; // manual_status = "converted"
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
      // Keep the most recent appointment per contact
      if (!existing || (apptDate && apptDate > existing.appointmentDate)) {
        contactApptMap.set(contactId, {
          appointmentDate: apptDate,
          calendarStatus: calStatus,
          confirmedPresence: statusAppt === 'confirmation-presence',
          converted: manualStatus === 'converted',
        });
      }
    }

    // ================================================================
    // STEP 2: Process leads with appointment cross-reference
    // ================================================================
    const criativoMap: Record<string, {
      adId: string | null;
      leads: number;
      responderam: number;
      agendaram: number;
      compareceram: number;
      fecharam: number;
    }> = {};

    const origemMap: Record<string, {
      leads: number;
      responderam: number;
      agendaram: number;
      compareceram: number;
      fecharam: number;
    }> = {};

    let totalLeads = 0;
    let totalResponderam = 0;
    let totalAgendaram = 0;
    let totalCompareceram = 0;
    let totalFecharam = 0;
    let totalPaidSocial = 0;
    let totalOrganic = 0;
    let comUtmContent = 0;
    let semUtmContent = 0;

    const now = new Date();

    rawData.forEach((lead) => {
      totalLeads++;

      const utmContent = normalizeUtmContent(lead.utm_content);
      const sessionSource = normalizeSessionSource(lead.session_source);
      const adId = lead.ad_id && lead.ad_id !== 'NULL' ? lead.ad_id : null;
      const etapaVal = (lead.etapa_funil || '').toLowerCase();

      // Cross-reference with appointments_log
      const apptData = lead.unique_id ? contactApptMap.get(lead.unique_id) : null;
      const hasAppointment = apptData != null;
      const appointmentPassed = apptData ? new Date(apptData.appointmentDate) < now : false;
      const isNoShow = etapaVal.includes('no-show') || etapaVal.includes('no_show');

      // AGENDOU: etapa_funil indica agendamento OU tem appointment real no GHL
      const agendou = ['agendou', 'agendado', 'no-show', 'no_show'].some(s => etapaVal.includes(s))
        || hasAppointment;

      // COMPARECEU: confirmação explícita OU appointment passou e não é no-show
      const compareceu = apptData?.confirmedPresence === true
        || (agendou && appointmentPassed && !isNoShow);

      // FECHOU: etapa_funil indica fechamento OU manual_status = converted
      const fechou = ['fechou', 'won', 'fechado'].some(s => etapaVal.includes(s))
        || apptData?.converted === true;

      // responded: campo explícito OU implícito (se avançou no funil, respondeu)
      const responded = lead.responded === true || lead.responded === 'true' || agendou;

      // Totais globais de funil
      if (responded) totalResponderam++;
      if (agendou) totalAgendaram++;
      if (compareceu) totalCompareceram++;
      if (fechou) totalFecharam++;

      // Contagem por origem
      if (sessionSource === 'Paid Social') {
        totalPaidSocial++;
      } else if (['Social media', 'Organic', 'Orgânico'].includes(sessionSource)) {
        totalOrganic++;
      }

      // Contagem UTM
      if (utmContent) {
        comUtmContent++;
      } else {
        semUtmContent++;
      }

      // Agregar por criativo (utm_content)
      const criativoKey = utmContent || 'Sem Criativo (UTM vazio)';
      if (!criativoMap[criativoKey]) {
        criativoMap[criativoKey] = {
          adId: adId,
          leads: 0,
          responderam: 0,
          agendaram: 0,
          compareceram: 0,
          fecharam: 0,
        };
      }
      criativoMap[criativoKey].leads++;
      if (responded) criativoMap[criativoKey].responderam++;
      if (agendou) criativoMap[criativoKey].agendaram++;
      if (compareceu) criativoMap[criativoKey].compareceram++;
      if (fechou) criativoMap[criativoKey].fecharam++;
      // Atualizar adId se disponível
      if (adId && !criativoMap[criativoKey].adId) {
        criativoMap[criativoKey].adId = adId;
      }

      // Agregar por origem (session_source)
      if (!origemMap[sessionSource]) {
        origemMap[sessionSource] = {
          leads: 0,
          responderam: 0,
          agendaram: 0,
          compareceram: 0,
          fecharam: 0,
        };
      }
      origemMap[sessionSource].leads++;
      if (responded) origemMap[sessionSource].responderam++;
      if (agendou) origemMap[sessionSource].agendaram++;
      if (compareceu) origemMap[sessionSource].compareceram++;
      if (fechou) origemMap[sessionSource].fecharam++;
    });

    // Converter para arrays com taxas calculadas
    const criativosArr: CriativoMetrics[] = Object.entries(criativoMap)
      .map(([criativo, metrics]) => ({
        criativo,
        adId: metrics.adId,
        leads: metrics.leads,
        responderam: metrics.responderam,
        agendaram: metrics.agendaram,
        compareceram: metrics.compareceram,
        fecharam: metrics.fecharam,
        taxaResposta: metrics.leads > 0 ? Math.round((metrics.responderam / metrics.leads) * 100) : 0,
        taxaAgendamento: metrics.leads > 0 ? Math.round((metrics.agendaram / metrics.leads) * 100) : 0,
        taxaConversao: metrics.leads > 0 ? Math.round((metrics.fecharam / metrics.leads) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads); // Ordenar por volume

    const origensArr: OrigemMetrics[] = Object.entries(origemMap)
      .map(([origem, metrics]) => ({
        origem,
        leads: metrics.leads,
        responderam: metrics.responderam,
        agendaram: metrics.agendaram,
        compareceram: metrics.compareceram,
        fecharam: metrics.fecharam,
      }))
      .sort((a, b) => b.leads - a.leads);

    return {
      criativos: criativosArr,
      origens: origensArr,
      totals: {
        totalLeads,
        totalResponderam,
        totalAgendaram,
        totalCompareceram,
        totalFecharam,
        totalPaidSocial,
        totalOrganic,
        comUtmContent,
        semUtmContent,
      },
    };
  }, [rawData, appointmentsData]);

  return { criativos, origens, leads: rawData as CriativoLead[], totals, loading, error, refetch: fetchData };
};

export default useCriativoPerformance;
