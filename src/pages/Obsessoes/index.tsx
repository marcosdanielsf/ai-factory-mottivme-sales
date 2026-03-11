import React, { useState, useMemo, useCallback, useEffect } from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import {
  DollarSign,
  Star,
  BarChart3,
  Wallet,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Zap,
  Clock,
  ArrowRight,
  Flame,
  Trophy,
  Target,
  Shield,
  RotateCcw,
  Plus,
  X,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

type CheckStatus = "done" | "partial" | "missing";
type ActionStatus = "pending" | "in_progress" | "done";
type Priority = "P0" | "P1" | "P2";
type Effort = "Baixo" | "Medio" | "Alto" | "Externo";

interface ChecklistItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  link?: string;
}

interface ActionItem {
  id: string;
  label: string;
  priority: Priority;
  effort: Effort;
  status: ActionStatus;
}

interface ObsessionConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  barColor: string;
  quote: string;
  checklist: ChecklistItem[];
  actions: ActionItem[];
}

// Persisted state shape
interface PersistedState {
  checkStatuses: Record<string, CheckStatus>;
  actionStatuses: Record<string, ActionStatus>;
  customItems: Record<string, ChecklistItem[]>;
  customActions: Record<string, ActionItem[]>;
}

const STORAGE_KEY = "mottivme_4obsessoes_v1";

// ============================================
// DEFAULT DATA
// ============================================

const defaultObsessions: ObsessionConfig[] = [
  {
    id: "lucro",
    title: "Lucro Extraordinario",
    subtitle: "Lucro Primeiro — 5% do faturamento diario separado",
    icon: DollarSign,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    barColor: "bg-emerald-400",
    quote: "Nao ter lucro na sua empresa e uma abominacao.",
    checklist: [
      {
        id: "l1",
        label: "Dashboard Financeiro (DRE mensal)",
        status: "done",
        detail: "bpofinanceiro.mottivme.com.br",
        link: "https://bpofinanceiro.mottivme.com.br",
      },
      {
        id: "l2",
        label: "Faturamento por cliente/periodo",
        status: "done",
        detail: "KPIs de receita bruta, deducoes, margem",
      },
      {
        id: "l3",
        label: "Despesas categorizadas por centro de custo",
        status: "done",
        detail: "Categorizacao PIX/CNPJ, centro de custo",
      },
      {
        id: "l4",
        label: "Fluxo de caixa projecao 12 meses",
        status: "done",
        detail: "Projecao com parcelamento",
      },
      {
        id: "l5",
        label: "Contratos recorrentes com valores",
        status: "done",
        detail: "Gestao recorrencia, valores, periodos",
      },
      {
        id: "l6",
        label: "Julia (assistente financeira IA)",
        status: "done",
        detail: "Gemini + OpenAI, 14 tools financeiras",
      },
      {
        id: "l7",
        label: "Regra dos 5% automatica (conta de lucro separada)",
        status: "missing",
        detail: "Paulo Vieira faz todo dia. Nao temos conta separada",
      },
      {
        id: "l8",
        label: "Meta de LUCRO (nao so faturamento)",
        status: "missing",
        detail: "Temos meta de faturamento mas nao de lucro liquido",
      },
      {
        id: "l9",
        label: "DRE semanal rapido",
        status: "missing",
        detail: "Paulo faz reuniao SEMANAL com CFO. Nosso DRE e so mensal",
      },
      {
        id: "l10",
        label: "Alertas de margem (custo subiu)",
        status: "missing",
        detail: "Sem alertas proativos",
      },
      {
        id: "l11",
        label: "Unit Economics por cliente (LTV/CAC real)",
        status: "missing",
        detail: "Sabemos ticket mas nao custo real de servir",
      },
      {
        id: "l12",
        label: "Pricing conectado com lucro real",
        status: "partial",
        detail: "Wizard calcula preco ideal mas nao compara com lucro",
      },
    ],
    actions: [
      {
        id: "la1",
        label: "Criar pipeline de vendas proprio da MOTTIVME no GHL",
        priority: "P0",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la2",
        label: "Implementar regra 5% — conta separada + processo",
        priority: "P0",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "la3",
        label: "Adicionar meta de lucro liquido no dashboard",
        priority: "P0",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la4",
        label: "Upsell Assembly Line para clientes atuais",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la5",
        label: "Pricing review — ticket vs valor entregue",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la6",
        label: "Audit de ferramentas — custos n8n/Vercel/Supabase/APIs",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la7",
        label: "Otimizar API costs — Gemini free vs OpenAI pago",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la8",
        label: "DRE semanal automatizado",
        priority: "P1",
        effort: "Alto",
        status: "pending",
      },
      {
        id: "la9",
        label: "Alertas proativos de margem",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "la10",
        label: "Consolidar infra (2 Supabase, Railway, Vercel)",
        priority: "P2",
        effort: "Alto",
        status: "pending",
      },
    ],
  },
  {
    id: "entrega",
    title: "Entrega Extraordinaria",
    subtitle: "Fazer o cliente dizer UAU — Jeff Bezos e a cadeira vazia",
    icon: Star,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/20",
    barColor: "bg-amber-400",
    quote: "O sentimento que a sua empresa provocou no cliente e eterno.",
    checklist: [
      {
        id: "e1",
        label: "19 agentes SDR personalizados por cliente",
        status: "done",
        detail: "Cada um com persona, tom, 7-11 modos",
      },
      {
        id: "e2",
        label: "Assembly Line — pipeline branding 7 fases",
        status: "done",
        detail:
          "Discovery > Strategy > Concept > Design > Export > Docs > Register",
      },
      {
        id: "e3",
        label: "Brandpack completo por cliente",
        status: "done",
        detail: "163 arquivos, 164 brand_assets por cliente",
      },
      {
        id: "e4",
        label: "Reflection Loop — auto-melhoria dos agentes",
        status: "done",
        detail: "Ciclo 1h, captura + avaliacao + prompt update",
      },
      {
        id: "e5",
        label: "FUU — follow-up eterno (nunca perde lead)",
        status: "done",
        detail: "5 templates por objecao, cadencia inteligente",
      },
      {
        id: "e6",
        label: "Relatorio Diario IA automatizado",
        status: "done",
        detail: "KPIs consolidados enviados automaticamente",
      },
      {
        id: "e7",
        label: "SDR 7 fases (acolhimento ate objecao)",
        status: "done",
        detail: "Fluxo completo de qualificacao e agendamento",
      },
      {
        id: "e8",
        label: "NPS automatico pos-servico",
        status: "missing",
        detail: "Nao mensuramos satisfacao. Sem NPS",
      },
      {
        id: "e9",
        label: "Portal do Cliente — metricas self-service",
        status: "partial",
        detail: "Existe /portal mas limitado",
        link: "#/portal",
      },
      {
        id: "e10",
        label: "Onboarding WOW — experiencia memoravel",
        status: "missing",
        detail: "Hoje onboarding e manual/informal",
      },
      {
        id: "e11",
        label: "Case Studies automatizados com dados reais",
        status: "missing",
        detail: "Temos dados mas nao empacotamos",
      },
      {
        id: "e12",
        label: "SLA com tracking visivel",
        status: "missing",
        detail: "Sem SLA formal",
      },
      {
        id: "e13",
        label: "Milestone celebrations automaticas",
        status: "missing",
        detail: "Sem automacao de parabens ao bater X",
      },
    ],
    actions: [
      {
        id: "ea1",
        label: "NPS automatico — survey WhatsApp pos-entrega",
        priority: "P0",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ea2",
        label: "Portal do Cliente completo — dashboard self-service",
        priority: "P0",
        effort: "Alto",
        status: "pending",
      },
      {
        id: "ea3",
        label: "Onboarding Kit — email + video + brandpack D0",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ea4",
        label: "Weekly Report automatico no WhatsApp do cliente",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ea5",
        label: "Milestone bot — celebrar resultados",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ea6",
        label: "SLA visivel — tempo resposta, uptime, resolucao",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ea7",
        label: "Video case studies com Remotion",
        priority: "P2",
        effort: "Alto",
        status: "pending",
      },
      {
        id: "ea8",
        label: "Surprise & Delight — insights competitivos",
        priority: "P2",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ea9",
        label: "Cadeira vazia — 'cliente diria UAU?' em toda decisao",
        priority: "P1",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ea10",
        label: "Client Advisory Board — reuniao mensal top 3",
        priority: "P1",
        effort: "Baixo",
        status: "pending",
      },
    ],
  },
  {
    id: "gestao",
    title: "Gestao de Classe Mundial",
    subtitle: "Numeros toda segunda — 5 gestoes metrificadas",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/20",
    barColor: "bg-blue-400",
    quote: "Voce nao gerencia o que nao mede. O que nao gerencia nao melhora.",
    checklist: [
      {
        id: "g1",
        label: "Gestao Comercial — tracking leads, agendamentos, conversao",
        status: "done",
        detail: "Por agente, responded_rate, scheduling_rate",
      },
      {
        id: "g2",
        label: "Gestao Marketing — Ads 8 KPIs, ROAS, IG scraping",
        status: "done",
        detail: "Impressoes, CPC, CTR, conversao, attribution",
      },
      {
        id: "g3",
        label: "Gestao Financeira — DRE, fluxo, inadimplencia",
        status: "done",
        detail: "Dashboard completo mas sem ritual semanal",
      },
      {
        id: "g4",
        label: "Gestao Qualidade — Agent scoring 11D, reflection, audit",
        status: "done",
        detail: "Pipeline de auditoria, 19 agentes monitorados",
      },
      {
        id: "g5",
        label: "Metricas por agente individuais",
        status: "done",
        detail: "responded_rate, scheduling_rate, quality_score",
      },
      {
        id: "g6",
        label: "Pipeline de vendas DA MOTTIVME (nao dos clientes)",
        status: "missing",
        detail: "Vendemos por indicacao sem funil estruturado",
      },
      {
        id: "g7",
        label: "Marketing DA MOTTIVME — IG, conteudo, ads proprios",
        status: "missing",
        detail: "Temos ferramentas pros clientes mas nao fazemos mkt proprio",
      },
      {
        id: "g8",
        label: "Gestao de Pessoas — equipe, OKRs, clima",
        status: "missing",
        detail: "CRITICO: Sem gestao de equipe. Marcos faz tudo",
      },
      {
        id: "g9",
        label: "Monday Meeting — ritual semanal de numeros",
        status: "missing",
        detail: "Paulo faz toda segunda 7h. Nos NAO temos ritual",
      },
      {
        id: "g10",
        label: "Dashboard Executivo unificado (1 tela, 5 KPIs)",
        status: "missing",
        detail: "Dashboards separados, sem visao consolidada",
      },
      {
        id: "g11",
        label: "OKRs trimestrais",
        status: "missing",
        detail: "Sem metas trimestrais formais",
      },
      {
        id: "g12",
        label: "Scorecard semanal (10 KPIs semaforo)",
        status: "missing",
        detail: "Sem semaforo executivo rapido",
      },
      {
        id: "g13",
        label: "Churn prevention — alertas cliente inativo 7d",
        status: "missing",
        detail: "Sem deteccao proativa",
      },
      {
        id: "g14",
        label: "Playbook operacional — SOPs documentados",
        status: "partial",
        detail: "Temos skills mas sem SOP formal",
      },
    ],
    actions: [
      {
        id: "ga1",
        label: "Monday Meeting — ritual semanal 30min, 5 dashboards",
        priority: "P0",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ga2",
        label: "Dashboard Executivo unificado — 1 tela, 5 KPIs",
        priority: "P0",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ga3",
        label: "Pipeline de vendas MOTTIVME no GHL",
        priority: "P0",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ga4",
        label: "OKRs trimestrais — lucro, NPS, caixa, clientes",
        priority: "P1",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ga5",
        label: "Marketing proprio — IG + conteudo automacao",
        priority: "P1",
        effort: "Alto",
        status: "pending",
      },
      {
        id: "ga6",
        label: "Gestao de pessoas — papeis, departamentos",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ga7",
        label: "Scorecard semanal — 10 KPIs semaforo",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ga8",
        label: "Forecast de receita — pipeline + recorrencia + churn",
        priority: "P1",
        effort: "Alto",
        status: "pending",
      },
      {
        id: "ga9",
        label: "Churn prevention — alertas inatividade 7d",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ga10",
        label: "Playbook operacional — SOP por processo",
        priority: "P2",
        effort: "Alto",
        status: "pending",
      },
    ],
  },
  {
    id: "caixa",
    title: "Caixa Extraordinario",
    subtitle: "Faturamento e vaidade, lucro e sanidade, caixa e rei",
    icon: Wallet,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    barColor: "bg-purple-400",
    quote: "Quem nao faz caixa, jamais sera bilionario.",
    checklist: [
      {
        id: "c1",
        label: "Fluxo de caixa projetado 12 meses",
        status: "done",
        detail: "Projecao com parcelamento no BPO Financeiro",
      },
      {
        id: "c2",
        label: "Inadimplencia tracking com alertas",
        status: "done",
        detail: "Status leads, dias vencido",
      },
      {
        id: "c3",
        label: "Contratos recorrentes com valores",
        status: "done",
        detail: "Gestao recorrencia, valores, periodos",
      },
      {
        id: "c4",
        label: "BTG integracao (em homologacao)",
        status: "partial",
        detail: "App prod criado, OAuth integrado, NAO em producao",
      },
      {
        id: "c5",
        label: "Belvo Open Finance (sandbox)",
        status: "partial",
        detail: "Basic Auth + widget. Sandbox ativo, prod solicitada",
      },
      {
        id: "c6",
        label: "Saldo em tempo real automatico",
        status: "missing",
        detail: "Nao temos BTG prod",
      },
      {
        id: "c7",
        label: "Reserva de lucro automatica (conta 5%)",
        status: "missing",
        detail: "Paulo separa 5% todo dia. Nos nao temos",
      },
      {
        id: "c8",
        label: "Burn rate + runway (meses de sobrevivencia)",
        status: "missing",
        detail: "Sem visibilidade de quantos meses de caixa",
      },
      {
        id: "c9",
        label: "Recebiveis vs Pagaveis — calendario visual",
        status: "missing",
        detail: "Nao esta visual/automatico",
      },
      {
        id: "c10",
        label: "Indice de liquidez no dashboard",
        status: "missing",
        detail: "Ativo/passivo circulante = nao calculamos",
      },
      {
        id: "c11",
        label: "Cobranca automatizada (Stripe/Pix recorrente)",
        status: "missing",
        detail: "Boleto manual em alguns casos",
      },
      {
        id: "c12",
        label: "NFS-e em producao (Focus NFe)",
        status: "partial",
        detail: "Integrado mas em sandbox",
      },
    ],
    actions: [
      {
        id: "ca1",
        label: "BTG producao — finalizar homologacao",
        priority: "P0",
        effort: "Externo",
        status: "pending",
      },
      {
        id: "ca2",
        label: "Conta de lucro separada — 5% automatico",
        priority: "P0",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ca3",
        label: "Burn rate + runway no dashboard",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ca4",
        label: "Cobranca automatizada — Stripe/Pix recorrente",
        priority: "P1",
        effort: "Alto",
        status: "pending",
      },
      {
        id: "ca5",
        label: "Antecipacao zero — regra + alerta",
        priority: "P1",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ca6",
        label: "Reserva de emergencia — 3 meses despesa fixa",
        priority: "P1",
        effort: "Baixo",
        status: "pending",
      },
      {
        id: "ca7",
        label: "NFS-e Focus NFe em producao + envio automatico",
        priority: "P1",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ca8",
        label: "Cash conversion cycle — dias entre vender e receber",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ca9",
        label: "Indice de liquidez no dashboard financeiro",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
      {
        id: "ca10",
        label: "Cenarios otimista/realista/pessimista",
        priority: "P2",
        effort: "Medio",
        status: "pending",
      },
    ],
  },
];

// ============================================
// PERSISTENCE HOOK
// ============================================

const DEFAULT_STATE: PersistedState = {
  checkStatuses: {},
  actionStatuses: {},
  customItems: {},
  customActions: {},
};

function isValidPersistedState(v: unknown): v is PersistedState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.checkStatuses === "object" &&
    s.checkStatuses !== null &&
    typeof s.actionStatuses === "object" &&
    s.actionStatuses !== null &&
    typeof s.customItems === "object" &&
    s.customItems !== null &&
    typeof s.customActions === "object" &&
    s.customActions !== null
  );
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidPersistedState(parsed)) return parsed;
    }
  } catch {
    /* ignore — covers SecurityError in Safari private mode */
  }
  return { ...DEFAULT_STATE };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore — Safari private mode */
  }
}

function useObsessionState() {
  const [persisted, setPersisted] = useState<PersistedState>(loadState);

  useEffect(() => {
    saveState(persisted);
  }, [persisted]);

  const getCheckStatus = useCallback(
    (itemId: string, defaultStatus: CheckStatus): CheckStatus =>
      persisted.checkStatuses[itemId] ?? defaultStatus,
    [persisted.checkStatuses],
  );

  const getActionStatus = useCallback(
    (actionId: string, defaultStatus: ActionStatus): ActionStatus =>
      persisted.actionStatuses[actionId] ?? defaultStatus,
    [persisted.actionStatuses],
  );

  const cycleCheckStatus = useCallback(
    (itemId: string, current: CheckStatus) => {
      const next: Record<CheckStatus, CheckStatus> = {
        missing: "partial",
        partial: "done",
        done: "missing",
      };
      setPersisted((prev) => ({
        ...prev,
        checkStatuses: { ...prev.checkStatuses, [itemId]: next[current] },
      }));
    },
    [],
  );

  const cycleActionStatus = useCallback(
    (actionId: string, current: ActionStatus) => {
      const next: Record<ActionStatus, ActionStatus> = {
        pending: "in_progress",
        in_progress: "done",
        done: "pending",
      };
      setPersisted((prev) => ({
        ...prev,
        actionStatuses: { ...prev.actionStatuses, [actionId]: next[current] },
      }));
    },
    [],
  );

  const addCheckItem = useCallback((obsId: string, label: string) => {
    const id = `${obsId}_custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: ChecklistItem = { id, label, status: "missing" };
    setPersisted((prev) => ({
      ...prev,
      customItems: {
        ...prev.customItems,
        [obsId]: [...(prev.customItems[obsId] || []), item],
      },
    }));
  }, []);

  const addAction = useCallback(
    (obsId: string, label: string, priority: Priority) => {
      const id = `${obsId}_acustom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const action: ActionItem = {
        id,
        label,
        priority,
        effort: "Medio",
        status: "pending",
      };
      setPersisted((prev) => ({
        ...prev,
        customActions: {
          ...prev.customActions,
          [obsId]: [...(prev.customActions[obsId] || []), action],
        },
      }));
    },
    [],
  );

  const removeCustomItem = useCallback((obsId: string, itemId: string) => {
    setPersisted((prev) => ({
      ...prev,
      customItems: {
        ...prev.customItems,
        [obsId]: (prev.customItems[obsId] || []).filter((i) => i.id !== itemId),
      },
    }));
  }, []);

  const removeCustomAction = useCallback((obsId: string, actionId: string) => {
    setPersisted((prev) => ({
      ...prev,
      customActions: {
        ...prev.customActions,
        [obsId]: (prev.customActions[obsId] || []).filter(
          (a) => a.id !== actionId,
        ),
      },
    }));
  }, []);

  const reset = useCallback(() => {
    setPersisted({
      checkStatuses: {},
      actionStatuses: {},
      customItems: {},
      customActions: {},
    });
  }, []);

  return {
    getCheckStatus,
    getActionStatus,
    cycleCheckStatus,
    cycleActionStatus,
    addCheckItem,
    addAction,
    removeCustomItem,
    removeCustomAction,
    customItems: persisted.customItems,
    customActions: persisted.customActions,
    reset,
  };
}

// ============================================
// HELPERS
// ============================================

const checkLabel: Record<CheckStatus, string> = {
  missing: "Faltando",
  partial: "Parcial",
  done: "Feito",
};

function StatusIcon({
  status,
  onClick,
}: {
  status: CheckStatus;
  onClick?: () => void;
}) {
  const iconClass = "flex-shrink-0";
  const Icon =
    status === "done"
      ? CheckCircle2
      : status === "partial"
        ? AlertTriangle
        : Circle;
  const color =
    status === "done"
      ? "text-emerald-400"
      : status === "partial"
        ? "text-amber-400"
        : "text-red-400/60";

  if (!onClick) return <Icon size={16} className={`${color} ${iconClass}`} />;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 cursor-pointer transition-transform hover:scale-125 active:scale-95 bg-transparent border-0 p-0"
      aria-label={`Status: ${checkLabel[status]}. Clique para alterar.`}
    >
      <Icon size={16} className={color} />
    </button>
  );
}

function ActionCheckbox({
  status,
  onClick,
}: {
  status: ActionStatus;
  onClick: () => void;
}) {
  const base =
    "w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95";
  return (
    <button
      onClick={onClick}
      className={`${base} ${
        status === "done"
          ? "bg-emerald-500/20 border-emerald-500/50"
          : status === "in_progress"
            ? "bg-amber-500/20 border-amber-500/50 animate-pulse"
            : "border-white/20 hover:border-white/40"
      }`}
      title={
        status === "pending"
          ? "Clique: Em progresso"
          : status === "in_progress"
            ? "Clique: Concluir"
            : "Clique: Reabrir"
      }
    >
      {status === "done" && (
        <CheckCircle2 size={12} className="text-emerald-400" />
      )}
      {status === "in_progress" && (
        <Clock size={12} className="text-amber-400" />
      )}
    </button>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const colors = {
    P0: "bg-red-500/20 text-red-300 border-red-500/30",
    P1: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    P2: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colors[priority]}`}
    >
      {priority}
    </span>
  );
}

function EffortBadge({ effort }: { effort: Effort }) {
  const colors: Record<Effort, string> = {
    Baixo: "text-emerald-400",
    Medio: "text-amber-400",
    Alto: "text-red-400",
    Externo: "text-purple-400",
  };
  return (
    <span className={`text-[10px] ${colors[effort] || "text-text-muted"}`}>
      {effort}
    </span>
  );
}

function ProgressRing({
  progress,
  color,
  size = 80,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-text-primary">{progress}%</span>
      </div>
    </div>
  );
}

// ============================================
// ADD ITEM INLINE
// ============================================

function AddItemInline({
  onAdd,
  placeholder,
}: {
  onAdd: (text: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors w-full"
      >
        <Plus size={12} /> Adicionar item
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-5 py-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) {
            onAdd(text.trim());
            setText("");
            setOpen(false);
          }
          if (e.key === "Escape") {
            setText("");
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="flex-1 text-sm bg-transparent border-b border-white/10 focus:border-accent-primary outline-none text-text-primary py-1 px-1"
      />
      <button
        onClick={() => {
          if (text.trim()) {
            onAdd(text.trim());
            setText("");
            setOpen(false);
          }
        }}
        className="text-emerald-400 hover:text-emerald-300"
      >
        <CheckCircle2 size={16} />
      </button>
      <button
        onClick={() => {
          setText("");
          setOpen(false);
        }}
        className="text-text-muted hover:text-text-secondary"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ============================================
// OBSESSION CARD
// ============================================

function ObsessionCard({
  config,
  state,
}: {
  config: ObsessionConfig;
  state: ReturnType<typeof useObsessionState>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const allChecklist = useMemo(
    () => [...config.checklist, ...(state.customItems[config.id] || [])],
    [config.checklist, config.id, state.customItems],
  );

  const allActions = useMemo(
    () => [...config.actions, ...(state.customActions[config.id] || [])],
    [config.actions, config.id, state.customActions],
  );

  const resolvedChecklist = useMemo(
    () =>
      allChecklist.map((item) => ({
        ...item,
        status: state.getCheckStatus(item.id, item.status),
      })),
    [allChecklist, state.getCheckStatus],
  );

  const resolvedActions = useMemo(
    () =>
      allActions.map((a) => ({
        ...a,
        status: state.getActionStatus(a.id, a.status),
      })),
    [allActions, state.getActionStatus],
  );

  const stats = useMemo(() => {
    const done = resolvedChecklist.filter((i) => i.status === "done").length;
    const partial = resolvedChecklist.filter(
      (i) => i.status === "partial",
    ).length;
    const missing = resolvedChecklist.filter(
      (i) => i.status === "missing",
    ).length;
    const total = resolvedChecklist.length;
    return { done, partial, missing, total };
  }, [resolvedChecklist]);

  const progress = useMemo(() => {
    if (stats.total === 0) return 0;
    const score = stats.done * 1 + stats.partial * 0.5;
    return Math.round((score / stats.total) * 100);
  }, [stats]);

  const actionsDone = resolvedActions.filter((a) => a.status === "done").length;
  const Icon = config.icon;
  const isCustom = (id: string) =>
    id.includes("_custom_") || id.includes("_acustom_");

  return (
    <div
      className={`bg-bg-secondary border ${config.borderColor} rounded-xl overflow-hidden transition-all hover:shadow-lg ${config.glowColor}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
              <Icon size={22} className={config.color} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {config.title}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {config.subtitle}
              </p>
            </div>
          </div>
          <ProgressRing progress={progress} color={config.color} />
        </div>

        <p className="text-xs italic text-text-muted/70 mt-3 border-l-2 border-white/10 pl-3">
          "{config.quote}"
        </p>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-xs text-text-muted">{stats.done} feito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="text-xs text-text-muted">
              {stats.partial} parcial
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle size={12} className="text-red-400/60" />
            <span className="text-xs text-text-muted">
              {stats.missing} faltando
            </span>
          </div>
        </div>

        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-text-secondary">
          Checklist ({stats.done}/{stats.total})
        </span>
        {expanded ? (
          <ChevronDown size={16} className="text-text-muted" />
        ) : (
          <ChevronRight size={16} className="text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/5">
          {resolvedChecklist.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-5 py-2.5 group ${
                i < resolvedChecklist.length - 1
                  ? "border-b border-white/[0.03]"
                  : ""
              } ${item.status === "missing" ? "bg-red-500/[0.03]" : ""}`}
            >
              <StatusIcon
                status={item.status}
                onClick={() => state.cycleCheckStatus(item.id, item.status)}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm ${
                    item.status === "done"
                      ? "text-text-secondary line-through opacity-60"
                      : item.status === "partial"
                        ? "text-amber-200/90"
                        : "text-red-200/90"
                  }`}
                >
                  {item.label}
                </span>
                {item.detail && (
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {item.detail}
                  </p>
                )}
              </div>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary text-xs hover:underline flex-shrink-0"
                >
                  Abrir
                </a>
              )}
              {isCustom(item.id) && (
                <button
                  onClick={() => state.removeCustomItem(config.id, item.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-opacity"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <AddItemInline
            placeholder="Novo item no checklist..."
            onAdd={(text) => state.addCheckItem(config.id, text)}
          />
        </div>
      )}

      {/* Actions */}
      <button
        onClick={() => setShowActions(!showActions)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-white/5 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Zap size={14} className={config.color} />
          Acoes ({actionsDone}/{resolvedActions.length})
        </span>
        {showActions ? (
          <ChevronDown size={16} className="text-text-muted" />
        ) : (
          <ChevronRight size={16} className="text-text-muted" />
        )}
      </button>

      {showActions && (
        <div className="border-t border-white/5">
          {resolvedActions.map((action, i) => (
            <div
              key={action.id}
              className={`flex items-center gap-3 px-5 py-2.5 group ${
                i < resolvedActions.length - 1
                  ? "border-b border-white/[0.03]"
                  : ""
              } ${action.status === "done" ? "opacity-50" : ""}`}
            >
              <ActionCheckbox
                status={action.status}
                onClick={() =>
                  state.cycleActionStatus(action.id, action.status)
                }
              />
              <span
                className={`text-sm flex-1 min-w-0 truncate ${action.status === "done" ? "line-through text-text-muted" : "text-text-secondary"}`}
              >
                {action.label}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <EffortBadge effort={action.effort} />
                <PriorityBadge priority={action.priority} />
              </div>
              {isCustom(action.id) && (
                <button
                  onClick={() => state.removeCustomAction(config.id, action.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-opacity"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <AddItemInline
            placeholder="Nova acao..."
            onAdd={(text) => state.addAction(config.id, text, "P1")}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// SUMMARY + TOP PRIORITIES (now dynamic)
// ============================================

function SummaryBar({
  obsData,
}: {
  obsData: {
    progress: number;
    checklist: { status: CheckStatus }[];
    actions: { status: ActionStatus; priority: Priority }[];
  }[];
}) {
  const overall = useMemo(() => {
    const avg = Math.round(
      obsData.reduce((s, o) => s + o.progress, 0) / obsData.length,
    );
    const allC = obsData.flatMap((o) => o.checklist);
    const done = allC.filter((i) => i.status === "done").length;
    const total = allC.length;
    const allA = obsData.flatMap((o) => o.actions);
    const p0 = allA.filter(
      (a) => a.priority === "P0" && a.status !== "done",
    ).length;
    const actionsDone = allA.filter((a) => a.status === "done").length;
    return { avg, done, total, p0, actionsTotal: allA.length, actionsDone };
  }, [obsData]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <Target size={14} className="text-accent-primary" />
          <span className="text-xs text-text-muted">Progresso Geral</span>
        </div>
        <span className="text-2xl font-bold text-text-primary">
          {overall.avg}%
        </span>
        <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary rounded-full"
            style={{ width: `${overall.avg}%` }}
          />
        </div>
      </div>
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-xs text-text-muted">Itens Completos</span>
        </div>
        <span className="text-2xl font-bold text-text-primary">
          {overall.done}
          <span className="text-sm text-text-muted font-normal">
            /{overall.total}
          </span>
        </span>
      </div>
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={14} className="text-red-400" />
          <span className="text-xs text-text-muted">Acoes P0 Pendentes</span>
        </div>
        <span className="text-2xl font-bold text-red-400">{overall.p0}</span>
        <p className="text-[10px] text-text-muted mt-1">Prioridade maxima</p>
      </div>
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={14} className="text-amber-400" />
          <span className="text-xs text-text-muted">Acoes Concluidas</span>
        </div>
        <span className="text-2xl font-bold text-text-primary">
          {overall.actionsDone}
          <span className="text-sm text-text-muted font-normal">
            /{overall.actionsTotal}
          </span>
        </span>
      </div>
    </div>
  );
}

function TopPriorities({
  obsData,
}: {
  obsData: {
    title: string;
    color: string;
    actions: {
      label: string;
      status: ActionStatus;
      priority: Priority;
      effort: string;
    }[];
  }[];
}) {
  const p0 = useMemo(
    () =>
      obsData.flatMap((o) =>
        o.actions
          .filter((a) => a.priority === "P0" && a.status !== "done")
          .map((a) => ({ ...a, obsTitle: o.title, obsColor: o.color })),
      ),
    [obsData],
  );

  if (p0.length === 0)
    return (
      <div className="mb-6 bg-bg-secondary border border-emerald-500/20 rounded-xl p-5 text-center">
        <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
        <p className="text-sm text-emerald-400 font-medium">
          Todas as acoes P0 concluidas!
        </p>
      </div>
    );

  return (
    <div className="mb-6 bg-bg-secondary border border-red-500/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-red-400" />
        <h3 className="text-base font-semibold text-text-primary">
          Proximos 30 Dias — Prioridade Maxima (P0)
        </h3>
      </div>
      <div className="space-y-2">
        {p0.map((a) => (
          <div
            key={`${a.obsTitle}-${a.id}`}
            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <ArrowRight size={14} className={a.obsColor} />
            <span className="text-sm text-text-secondary flex-1">
              {a.label}
            </span>
            <span className="text-[10px] text-text-muted">{a.obsTitle}</span>
            <EffortBadge effort={a.effort} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export const Obsessoes = () => {
  const state = useObsessionState();

  // Build resolved data for summary/priorities
  const obsData = useMemo(
    () =>
      defaultObsessions.map((config) => {
        const allC = [
          ...config.checklist,
          ...(state.customItems[config.id] || []),
        ];
        const allA = [
          ...config.actions,
          ...(state.customActions[config.id] || []),
        ];
        const resolvedC = allC.map((c) => ({
          ...c,
          status: state.getCheckStatus(c.id, c.status),
        }));
        const resolvedA = allA.map((a) => ({
          ...a,
          status: state.getActionStatus(a.id, a.status),
        }));
        const total = resolvedC.length || 1;
        const score =
          resolvedC.filter((i) => i.status === "done").length +
          resolvedC.filter((i) => i.status === "partial").length * 0.5;
        return {
          title: config.title,
          color: config.color,
          progress: Math.round((score / total) * 100),
          checklist: resolvedC,
          actions: resolvedA,
        };
      }),
    [
      state.customItems,
      state.customActions,
      state.getCheckStatus,
      state.getActionStatus,
    ],
  );

  return (
    <PageContainer
      title="4 Obsessoes"
      description="As 4 obsessoes dos bilionarios aplicadas a MOTTIVME — Lucro, Entrega, Gestao, Caixa"
      maxWidth="7xl"
      actions={
        <button
          onClick={() => {
            if (confirm("Resetar todos os status para o padrao?"))
              state.reset();
          }}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          title="Resetar para padrao"
        >
          <RotateCcw size={12} /> Resetar
        </button>
      }
    >
      <SummaryBar obsData={obsData} />
      <TopPriorities obsData={obsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {defaultObsessions.map((config) => (
          <ObsessionCard key={config.id} config={config} state={state} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-text-muted/50">
          Inspirado em Paulo Vieira — "As 4 Obsessoes dos Empresarios
          Bilionarios"
        </p>
        <p className="text-[10px] text-text-muted/30 mt-1">
          Clique nos icones para mudar status. Dados salvos no navegador.
        </p>
      </div>
    </PageContainer>
  );
};
