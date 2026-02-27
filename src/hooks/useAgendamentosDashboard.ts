import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// =============================================================================
// TYPES — consolidated from useAgendamentosStats + useCriativoPerformance + useLeadSegmentation
// =============================================================================

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
  criativo: string;
  adId: string | null;
  leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  taxaResposta: number;
  taxaAgendamento: number;
  taxaConversao: number;
}

export interface OrigemMetrics {
  origem: string;
  leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
}

export interface EstadoMetrics {
  estado: string;
  totalLeads: number;
  convertidos: number;
  perdidos: number;
  taxaConversao: number;
}

export interface WorkPermitMetrics {
  status: string;
  totalLeads: number;
  convertidos: number;
  perdidos: number;
  taxaConversao: number;
}

export interface SegmentationTotals {
  totalLeads: number;
  comEstado: number;
  comWorkPermit: number;
  convertidos: number;
  perdidos: number;
}

export interface AgendamentosPorDia {
  data: string;
  quantidade: number;
  leads?: number;
}

export interface ResponsavelInfo {
  name: string;
  count: number;
}

export interface FunnelMetrics {
  totalLeads: number;
  totalResponderam: number;
  totalAgendaram: number;
  totalCompareceram: number;
  totalFecharam: number;
}

export interface AgendaMetrics {
  hoje: number;
  semana: number;
  mes: number;
  totalCompleted: number;
  totalNoShow: number;
  totalBooked: number;
  totalPendingFeedback: number;
  taxaComparecimento: number;
  taxaNoShow: number;
  porDia: AgendamentosPorDia[];
}

// =============================================================================
// HELPERS
// =============================================================================

function mapGhlStatus(rawPayload: any): string {
  const ghlStatus = (rawPayload?.calendar?.appointmentStatus || rawPayload?.calendar?.appoinmentStatus || '').toLowerCase();
  if (ghlStatus === 'showed') return 'completed';
  if (ghlStatus === 'noshow' || ghlStatus === 'no_show') return 'no_show';
  if (ghlStatus === 'cancelled') return 'cancelled';
  return 'booked';
}

function normalizeUtmContent(value: string | null): string | null {
  if (!value || value === 'NULL' || value === 'null' || value.trim() === '') return null;
  return value;
}

function normalizeSessionSource(value: string | null): string {
  if (!value || value === 'NULL' || value === 'null' || value.trim() === '') return 'Desconhecido';
  return value;
}

function normalizeState(rawState: string | null): string {
  if (!rawState || rawState.trim() === '' || rawState.toLowerCase() === 'null') return 'Não informado';
  const state = rawState.trim().toUpperCase();
  const stateMap: Record<string, string> = {
    'FL': 'Florida', 'FLORIDA': 'Florida', 'FLÓRIDA': 'Florida', 'FLA': 'Florida',
    'MA': 'Massachusetts', 'MASSACHUSETTS': 'Massachusetts', 'MASS': 'Massachusetts',
    'NJ': 'New Jersey', 'NEW JERSEY': 'New Jersey',
    'NY': 'New York', 'NEW YORK': 'New York',
    'CA': 'California', 'CALIFORNIA': 'California',
    'TX': 'Texas', 'TEXAS': 'Texas',
    'CT': 'Connecticut', 'CONNECTICUT': 'Connecticut',
    'GA': 'Georgia', 'GEORGIA': 'Georgia',
    'UT': 'Utah', 'UTAH': 'Utah',
    'SC': 'South Carolina', 'SOUTH CAROLINA': 'South Carolina', 'CAROLINA DO SUL': 'South Carolina',
    'NV': 'Nevada', 'NEVADA': 'Nevada',
    'IL': 'Illinois', 'ILLINOIS': 'Illinois',
  };
  return stateMap[state] || state.charAt(0) + state.slice(1).toLowerCase();
}

function normalizeWorkPermit(rawPermit: string | null): string {
  if (!rawPermit || rawPermit.trim() === '' || rawPermit.toLowerCase() === 'null') return 'Não informado';
  const permit = rawPermit.toLowerCase().trim();
  if (permit.includes('possui') && !permit.includes('não')) return 'Com Work Permit';
  if (permit.includes('não') || permit.includes('nao')) return 'Sem Work Permit';
  if (['sim', 'yes', 'true', '1'].includes(permit)) return 'Com Work Permit';
  if (['não', 'nao', 'no', 'false', '0'].includes(permit)) return 'Sem Work Permit';
  return 'Não informado';
}

function getDefaultStartDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDefaultEndDate(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// =============================================================================
// HOOK
// =============================================================================

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface UseAgendamentosDashboardReturn {
  funnel: FunnelMetrics;
  agenda: AgendaMetrics;
  criativos: CriativoMetrics[];
  origens: OrigemMetrics[];
  estados: EstadoMetrics[];
  workPermit: WorkPermitMetrics[];
  segmentationTotals: SegmentationTotals;
  porDiaCriacao: AgendamentosPorDia[];
  porOrigem: { origem: string; quantidade: number }[];
  leads: CriativoLead[];
  responsaveis: ResponsavelInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_FUNNEL: FunnelMetrics = {
  totalLeads: 0, totalResponderam: 0, totalAgendaram: 0, totalCompareceram: 0, totalFecharam: 0,
};

const EMPTY_AGENDA: AgendaMetrics = {
  hoje: 0, semana: 0, mes: 0,
  totalCompleted: 0, totalNoShow: 0, totalBooked: 0, totalPendingFeedback: 0,
  taxaComparecimento: 0, taxaNoShow: 0, porDia: [],
};

const EMPTY_SEGMENTATION: SegmentationTotals = {
  totalLeads: 0, comEstado: 0, comWorkPermit: 0, convertidos: 0, perdidos: 0,
};

export const useAgendamentosDashboard = (
  dateRange?: DateRange | null,
  locationId?: string | null,
  responsavel?: string | null,
): UseAgendamentosDashboardReturn => {
  const [rawLeads, setRawLeads] = useState<any[]>([]);
  const [rawAppointments, setRawAppointments] = useState<any[]>([]);
  const [wonContactIds, setWonContactIds] = useState<Set<string>>(new Set());
  const [wonCount, setWonCount] = useState(0);
  const [exactLeadsCount, setExactLeadsCount] = useState(0);
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

      const startDate = dateRange?.startDate || getDefaultStartDate();
      const endDate = dateRange?.endDate || getDefaultEndDate();

      // Q1: All leads in the period (n8n_schedule_tracking)
      let leadsQuery = supabase
        .from('n8n_schedule_tracking')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50000);

      if (locationId) leadsQuery = leadsQuery.eq('location_id', locationId);
      if (responsavel) leadsQuery = leadsQuery.eq('location_name', responsavel);

      // Q2: Appointments with expanded range (-30d / +60d) for cross-reference + agenda
      const apptStart = new Date(startDate);
      apptStart.setDate(apptStart.getDate() - 30);
      const apptEnd = new Date(endDate);
      apptEnd.setDate(apptEnd.getDate() + 60);

      let apptsQuery = supabase
        .from('appointments_log')
        .select('appointment_date, location_name, location_id, raw_payload, created_at, manual_status, contact_name, contact_phone')
        .gte('appointment_date', apptStart.toISOString())
        .lte('appointment_date', apptEnd.toISOString())
        .limit(50000);

      if (locationId) apptsQuery = apptsQuery.eq('location_id', locationId);
      if (responsavel) apptsQuery = apptsQuery.eq('location_name', responsavel);

      // Q3: Exact leads count (no limit)
      let countQuery = supabase
        .from('n8n_schedule_tracking')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (locationId) countQuery = countQuery.eq('location_id', locationId);
      if (responsavel) countQuery = countQuery.eq('location_name', responsavel);

      // Q4: Won opportunities from ghl_opportunities
      let wonQuery = supabase
        .from('ghl_opportunities')
        .select('contact_id')
        .eq('status', 'won');

      if (locationId) wonQuery = wonQuery.eq('location_id', locationId);

      const [leadsResult, apptsResult, countResult, wonResult] = await Promise.all([
        leadsQuery, apptsQuery, countQuery, wonQuery,
      ]);

      if (leadsResult.error) throw new Error(leadsResult.error.message);
      if (apptsResult.error) console.warn('[AgendamentosDashboard] Appointments error:', apptsResult.error.message);
      if (countResult.error) console.warn('[AgendamentosDashboard] Count error:', countResult.error.message);
      if (wonResult.error) console.warn('[AgendamentosDashboard] Won opps error:', wonResult.error.message);

      const wonData = wonResult.data || [];
      setRawLeads(leadsResult.data || []);
      setRawAppointments(apptsResult.data || []);
      setWonContactIds(new Set(wonData.map((o: any) => o.contact_id)));
      setWonCount(wonData.length);
      setExactLeadsCount(countResult.count ?? leadsResult.data?.length ?? 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      console.error('[AgendamentosDashboard Error]', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime(), locationId, responsavel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===========================================================================
  // SINGLE MEMO — all metrics computed together, single source of truth
  // ===========================================================================
  const computed = useMemo(() => {
    const startDate = dateRange?.startDate || getDefaultStartDate();
    const endDate = dateRange?.endDate || getDefaultEndDate();
    const now = new Date();

    // -----------------------------------------------------------------------
    // STEP 1: Dedup appointments by appointmentId (single pass)
    // -----------------------------------------------------------------------
    const apptDedup = new Map<string, any>();
    for (const appt of rawAppointments) {
      const appointmentId = appt.raw_payload?.calendar?.appointmentId;
      if (!appointmentId) continue;
      const existing = apptDedup.get(appointmentId);
      if (!existing || (appt.created_at && (!existing.created_at || appt.created_at > existing.created_at))) {
        apptDedup.set(appointmentId, appt);
      }
    }
    const dedupedAppts = Array.from(apptDedup.values()).filter(appt => {
      const status = (appt.raw_payload?.calendar?.appointmentStatus || appt.raw_payload?.calendar?.appoinmentStatus || '').toLowerCase();
      return status !== 'cancelled';
    });

    // -----------------------------------------------------------------------
    // STEP 2: Build contactApptMap + direct appointment counts (independent of lead cross-reference)
    // -----------------------------------------------------------------------
    const contactApptMap = new Map<string, {
      appointmentDate: string;
      calendarStatus: string;
      confirmedPresence: boolean;
      converted: boolean;
    }>();

    // Direct counts from appointments_log (not dependent on schedule_tracking cross-reference)
    const uniqueApptContacts = new Set<string>();
    let directCompleted = 0;
    let directConverted = 0;

    for (const appt of dedupedAppts) {
      const contactId = appt.raw_payload?.contact_id || appt.raw_payload?.lead_id;
      if (!contactId) continue;
      const apptDate = appt.appointment_date || appt.raw_payload?.calendar?.startTime;
      const statusAppt = (appt.raw_payload?.['Status Appointment'] || '').toLowerCase();
      const manualStatus = (appt.manual_status || '').toLowerCase();
      const calStatus = (appt.raw_payload?.calendar?.appointmentStatus || appt.raw_payload?.calendar?.appoinmentStatus || '').toLowerCase();

      // Track unique contacts with appointments (= agendaram)
      uniqueApptContacts.add(contactId);

      // Track showed/completed directly from appointment status
      if (manualStatus === 'completed' || manualStatus === 'converted' || statusAppt === 'confirmation-presence') {
        directCompleted++;
      }
      if (manualStatus === 'converted') {
        directConverted++;
      }

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

    const directAgendaram = uniqueApptContacts.size;

    // -----------------------------------------------------------------------
    // STEP 3: Process leads → funnel + criativos + origens + segmentation
    // -----------------------------------------------------------------------
    const criativoMap: Record<string, { adId: string | null; leads: number; responderam: number; agendaram: number; compareceram: number; fecharam: number }> = {};
    const origemMap: Record<string, { leads: number; responderam: number; agendaram: number; compareceram: number; fecharam: number }> = {};
    const estadoMap: Record<string, { total: number; convertidos: number; perdidos: number }> = {};
    const wpMap: Record<string, { total: number; convertidos: number; perdidos: number }> = {};

    let fResponderam = 0, fAgendaram = 0, fCompareceram = 0, fFecharam = 0;
    let sComEstado = 0, sComWorkPermit = 0, sConvertidos = 0, sPerdidos = 0;
    const leadsPorDiaMap: Record<string, number> = {};

    for (const lead of rawLeads) {
      const utmContent = normalizeUtmContent(lead.utm_content);
      const sessionSource = normalizeSessionSource(lead.session_source);
      const adId = lead.ad_id && lead.ad_id !== 'NULL' ? lead.ad_id : null;
      const etapaVal = (lead.etapa_funil || '').toLowerCase();

      // Segmentation
      const estado = normalizeState(lead.state);
      const wp = normalizeWorkPermit(lead.work_permit);
      const isConvertido = etapaVal === 'fechou' || etapaVal === 'won' || (lead.unique_id && wonContactIds.has(lead.unique_id));
      const isPerdido = etapaVal === 'perdido' || etapaVal === 'lost';

      if (isConvertido) sConvertidos++;
      if (isPerdido) sPerdidos++;

      if (estado !== 'Não informado') sComEstado++;
      if (!estadoMap[estado]) estadoMap[estado] = { total: 0, convertidos: 0, perdidos: 0 };
      estadoMap[estado].total++;
      if (isConvertido) estadoMap[estado].convertidos++;
      if (isPerdido) estadoMap[estado].perdidos++;

      if (wp !== 'Não informado') sComWorkPermit++;
      if (!wpMap[wp]) wpMap[wp] = { total: 0, convertidos: 0, perdidos: 0 };
      wpMap[wp].total++;
      if (isConvertido) wpMap[wp].convertidos++;
      if (isPerdido) wpMap[wp].perdidos++;

      // Cross-reference with appointments
      const apptData = lead.unique_id ? contactApptMap.get(lead.unique_id) : null;
      const hasAppointment = apptData != null;
      const appointmentPassed = apptData ? new Date(apptData.appointmentDate) < now : false;
      const isNoShow = etapaVal.includes('no-show') || etapaVal.includes('no_show');

      // Unified funnel definitions
      const agendou = ['agendou', 'agendado', 'no-show', 'no_show'].some(s => etapaVal.includes(s)) || hasAppointment;
      const compareceu = apptData?.confirmedPresence === true || (agendou && appointmentPassed && !isNoShow);
      const fechou = ['fechou', 'won', 'fechado'].some(s => etapaVal.includes(s)) || apptData?.converted === true || (lead.unique_id && wonContactIds.has(lead.unique_id));
      const responded = lead.responded === true || lead.responded === 'true' || agendou;

      if (responded) fResponderam++;
      if (agendou) fAgendaram++;
      if (compareceu) fCompareceram++;
      if (fechou) fFecharam++;

      // Criativo aggregation
      const criativoKey = utmContent || 'Sem Criativo (UTM vazio)';
      if (!criativoMap[criativoKey]) criativoMap[criativoKey] = { adId, leads: 0, responderam: 0, agendaram: 0, compareceram: 0, fecharam: 0 };
      criativoMap[criativoKey].leads++;
      if (responded) criativoMap[criativoKey].responderam++;
      if (agendou) criativoMap[criativoKey].agendaram++;
      if (compareceu) criativoMap[criativoKey].compareceram++;
      if (fechou) criativoMap[criativoKey].fecharam++;
      if (adId && !criativoMap[criativoKey].adId) criativoMap[criativoKey].adId = adId;

      // Origem aggregation (session_source)
      if (!origemMap[sessionSource]) origemMap[sessionSource] = { leads: 0, responderam: 0, agendaram: 0, compareceram: 0, fecharam: 0 };
      origemMap[sessionSource].leads++;
      if (responded) origemMap[sessionSource].responderam++;
      if (agendou) origemMap[sessionSource].agendaram++;
      if (compareceu) origemMap[sessionSource].compareceram++;
      if (fechou) origemMap[sessionSource].fecharam++;

      // Leads per day
      if (lead.created_at) {
        const dateKey = new Date(lead.created_at).toISOString().split('T')[0];
        leadsPorDiaMap[dateKey] = (leadsPorDiaMap[dateKey] || 0) + 1;
      }
    }

    const totalLeads = exactLeadsCount || rawLeads.length;

    // Direct counts from appointments_log and ghl_opportunities as floors.
    // n8n_schedule_tracking.unique_id ≠ GHL contact_id — cross-reference only matches ~8% of records.
    // Use direct counts to ensure funnel reflects real appointment and won data.
    const totalFecharam = Math.max(fFecharam, wonCount);
    const totalCompareceram = Math.max(fCompareceram, directCompleted, totalFecharam);
    const totalAgendaram = Math.max(fAgendaram, directAgendaram, totalCompareceram);
    const totalResponderam = Math.max(fResponderam, totalAgendaram);

    const funnel: FunnelMetrics = {
      totalLeads,
      totalResponderam,
      totalAgendaram,
      totalCompareceram,
      totalFecharam,
    };

    // -----------------------------------------------------------------------
    // STEP 4: Agenda metrics (appointment-centric, relative to date range)
    // -----------------------------------------------------------------------
    // Reference dates: "hoje" = last day of range, "semana" = last 7d of range, "mes" = entire range
    const refEndDayStart = new Date(endDate);
    refEndDayStart.setHours(0, 0, 0, 0);
    const refEndDayEnd = new Date(endDate);
    refEndDayEnd.setHours(23, 59, 59, 999);
    const ref7dStart = new Date(endDate);
    ref7dStart.setDate(endDate.getDate() - 7);
    ref7dStart.setHours(0, 0, 0, 0);

    let aHoje = 0, aSemana = 0, aMes = 0;
    let aTotalCompleted = 0, aTotalNoShow = 0, aTotalBooked = 0, aTotalPendingFeedback = 0;

    const porDiaMap: Record<string, number> = {};
    const porDiaCriacaoMap: Record<string, number> = {};

    // Initialize all days in the user's selected range
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      porDiaMap[dateKey] = 0;
      porDiaCriacaoMap[dateKey] = 0;
    }

    for (const appt of dedupedAppts) {
      const apptDate = appt.appointment_date;
      if (!apptDate) continue;
      const scheduledAt = new Date(apptDate);
      const status = mapGhlStatus(appt.raw_payload);
      const isPast = scheduledAt < now;
      const apptDateKey = scheduledAt.toISOString().split('T')[0];

      // porDia: appointments scheduled FOR each day
      if (porDiaMap[apptDateKey] !== undefined) {
        porDiaMap[apptDateKey]++;
      }

      // Agenda metrics: only appointments within [startDate, endDate]
      if (scheduledAt >= startDate && scheduledAt <= endDate) {
        if (scheduledAt >= refEndDayStart && scheduledAt <= refEndDayEnd) aHoje++;
        if (scheduledAt >= ref7dStart && scheduledAt <= refEndDayEnd) aSemana++;
        aMes++;

        if (status === 'completed' || status === 'won') {
          aTotalCompleted++;
        } else if (status === 'no_show' || status === 'lost') {
          aTotalNoShow++;
        } else if (status === 'booked') {
          if (isPast) {
            aTotalPendingFeedback++;
          } else {
            aTotalBooked++;
          }
        }
      }

      // porDiaCriacao: appointments CREATED on each day (within the user's range)
      if (appt.created_at) {
        const createdKey = new Date(appt.created_at).toISOString().split('T')[0];
        if (porDiaCriacaoMap[createdKey] !== undefined) {
          porDiaCriacaoMap[createdKey]++;
        }
      }
    }

    const totalWithStatus = aTotalCompleted + aTotalNoShow;
    const agenda: AgendaMetrics = {
      hoje: aHoje,
      semana: aSemana,
      mes: aMes,
      totalCompleted: aTotalCompleted,
      totalNoShow: aTotalNoShow,
      totalBooked: aTotalBooked,
      totalPendingFeedback: aTotalPendingFeedback,
      taxaComparecimento: totalWithStatus > 0 ? Math.round((aTotalCompleted / totalWithStatus) * 100) : 0,
      taxaNoShow: totalWithStatus > 0 ? Math.round((aTotalNoShow / totalWithStatus) * 100) : 0,
      porDia: Object.entries(porDiaMap)
        .map(([data, quantidade]) => ({ data, quantidade }))
        .sort((a, b) => a.data.localeCompare(b.data)),
    };

    // -----------------------------------------------------------------------
    // STEP 5: Build output arrays
    // -----------------------------------------------------------------------
    const criativos: CriativoMetrics[] = Object.entries(criativoMap)
      .map(([criativo, m]) => ({
        criativo,
        adId: m.adId,
        leads: m.leads,
        responderam: m.responderam,
        agendaram: m.agendaram,
        compareceram: m.compareceram,
        fecharam: m.fecharam,
        taxaResposta: m.leads > 0 ? Math.round((m.responderam / m.leads) * 100) : 0,
        taxaAgendamento: m.leads > 0 ? Math.round((m.agendaram / m.leads) * 100) : 0,
        taxaConversao: m.leads > 0 ? Math.round((m.fecharam / m.leads) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    const origens: OrigemMetrics[] = Object.entries(origemMap)
      .map(([origem, m]) => ({ origem, ...m }))
      .sort((a, b) => b.leads - a.leads);

    const porOrigem = origens.map(o => ({ origem: o.origem, quantidade: o.leads }));

    const estados: EstadoMetrics[] = Object.entries(estadoMap)
      .filter(([estado]) => estado !== 'Não informado')
      .map(([estado, m]) => ({
        estado,
        totalLeads: m.total,
        convertidos: m.convertidos,
        perdidos: m.perdidos,
        taxaConversao: m.total > 0 ? Math.round((m.convertidos / m.total) * 100) : 0,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 10);

    const workPermitArr: WorkPermitMetrics[] = Object.entries(wpMap)
      .map(([status, m]) => ({
        status,
        totalLeads: m.total,
        convertidos: m.convertidos,
        perdidos: m.perdidos,
        taxaConversao: m.total > 0 ? Math.round((m.convertidos / m.total) * 100) : 0,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);

    const segmentationTotals: SegmentationTotals = {
      totalLeads: rawLeads.length,
      comEstado: sComEstado,
      comWorkPermit: sComWorkPermit,
      convertidos: sConvertidos,
      perdidos: sPerdidos,
    };

    const porDiaCriacao: AgendamentosPorDia[] = Object.entries(porDiaCriacaoMap)
      .map(([data, quantidade]) => ({
        data,
        quantidade,
        leads: leadsPorDiaMap[data] || 0,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // Responsaveis extracted from already-fetched appointments (no extra query)
    const respCountMap: Record<string, number> = {};
    for (const appt of dedupedAppts) {
      const name = appt.location_name;
      if (name && name !== 'unknown') {
        respCountMap[name] = (respCountMap[name] || 0) + 1;
      }
    }
    const responsaveis: ResponsavelInfo[] = Object.entries(respCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      funnel, agenda, criativos, origens, estados,
      workPermit: workPermitArr, segmentationTotals,
      porDiaCriacao, porOrigem, responsaveis,
    };
  }, [rawLeads, rawAppointments, wonContactIds, wonCount, exactLeadsCount, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  return {
    ...computed,
    leads: rawLeads as CriativoLead[],
    loading,
    error,
    refetch: fetchData,
  };
};

export default useAgendamentosDashboard;
