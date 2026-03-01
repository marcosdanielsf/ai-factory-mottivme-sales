/**
 * Goal Decomposer — Decomposicao IA de metas de faturamento
 *
 * Usa Gemini 2.0 Flash para decompor meta anual em:
 * OKRs trimestrais → Key Results → Funis sugeridos → Acoes
 *
 * Pattern: chamada direta browser→Gemini (igual AISupportWidget)
 */

// =============================================================
// Types
// =============================================================

export interface DecomposeInput {
  annual_target: number;
  business_model: "clinica" | "imobiliaria" | "servicos" | "saas" | "outro";
  location_id: string;
  location_name?: string;
  products_summary?: string;
  current_funnel_data?: string;
  average_ticket?: number;
}

export interface DecomposeKeyResult {
  title: string;
  target: number;
  unit: string;
  data_source: "ghl_leads" | "ghl_appointments" | "supabase_revenue" | "manual";
  benchmark?: number;
  benchmark_label?: string;
}

export interface DecomposeFunnel {
  type: string;
  channel: string;
  budget: number | null;
  expected_leads: number;
  conversion_rate: number;
}

export interface DecomposeAction {
  title: string;
  description?: string;
  priority: "p1" | "p2" | "p3" | "p4";
}

export interface DecomposeOKR {
  title: string;
  description: string;
  quarter: 1 | 2 | 3 | 4;
  category: "growth" | "retention" | "efficiency" | "infrastructure";
  key_results: DecomposeKeyResult[];
  funnels: DecomposeFunnel[];
  actions: DecomposeAction[];
}

export interface DecomposeMonthlyTarget {
  month: number;
  target: number;
  reasoning: string;
}

export interface DecomposeResult {
  monthly_distribution: DecomposeMonthlyTarget[];
  okrs: DecomposeOKR[];
}

export interface Benchmark {
  business_model: string;
  metric_name: string;
  metric_value: number;
  sample_size: number;
}

// =============================================================
// Prompt Builder
// =============================================================

function buildBenchmarkContext(benchmarks: Benchmark[]): string {
  if (!benchmarks.length) return "Nenhum benchmark disponivel.";

  const grouped = benchmarks.reduce(
    (acc, b) => {
      if (!acc[b.business_model]) acc[b.business_model] = {};
      acc[b.business_model][b.metric_name] = {
        value: b.metric_value,
        sample: b.sample_size,
      };
      return acc;
    },
    {} as Record<string, Record<string, { value: number; sample: number }>>,
  );

  return Object.entries(grouped)
    .map(([model, metrics]) => {
      const lines = Object.entries(metrics)
        .map(
          ([name, { value, sample }]) =>
            `  - ${name}: ${value} (${sample} clientes)`,
        )
        .join("\n");
      return `${model}:\n${lines}`;
    })
    .join("\n");
}

function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

function buildSystemPrompt(benchmarkContext: string): string {
  const currentQ = getCurrentQuarter();
  const currentYear = new Date().getFullYear();

  return `Voce e um estrategista de negocios especializado em decomposicao de metas.

Dado uma meta de faturamento anual e o modelo de negocio, gere uma arvore completa:
Meta → OKRs trimestrais → Key Results mensuraveis → Funis sugeridos → Acoes

REGRAS:
1. Max 4 OKRs por trimestre, 3 KRs por OKR, 2 funis por OKR, 5 acoes por OKR
2. KRs DEVEM ter target numerico + unidade (ex: target: 500, unit: "leads")
3. KRs DEVEM ter data_source sugerido: "ghl_leads", "ghl_appointments", "supabase_revenue", "manual"
4. Distribuicao mensal: considerar ramp-up (meses 1-3: 70%, 4-6: 90%, 7-12: 110% da media)
5. Funis: sugerir baseado no modelo de negocio:
   - Clinica: trafego_pago (Meta Ads) + social_selling (Instagram DM) + referral
   - Imobiliaria: trafego_pago (Google+Meta) + outbound (portais) + social_selling
   - Servicos: social_selling + referral + outbound
   - SaaS: trafego_pago + content_marketing + outbound
6. OKRs devem cobrir 4 categorias: growth, retention, efficiency, infrastructure
7. Prioridades de acoes: p1 (critico), p2 (importante), p3 (desejavel), p4 (futuro)
8. Incluir benchmarks quando disponiveis
9. Estamos no Q${currentQ} de ${currentYear}. OKRs devem comecar no trimestre atual ou proximo.
10. Todos os valores monetarios em BRL (R$)

BENCHMARKS DISPONIVEIS:
${benchmarkContext}

Responda APENAS em JSON valido (sem markdown, sem code blocks):
{
  "monthly_distribution": [{"month": 1, "target": 120000, "reasoning": "ramp-up"}, ...],
  "okrs": [{
    "title": "...",
    "description": "...",
    "quarter": ${currentQ},
    "category": "growth",
    "key_results": [
      {"title": "...", "target": 500, "unit": "leads", "data_source": "ghl_leads", "benchmark": 450, "benchmark_label": "media clinicas"}
    ],
    "funnels": [
      {"type": "trafego_pago", "channel": "meta_ads", "budget": 5000, "expected_leads": 300, "conversion_rate": 0.14}
    ],
    "actions": [
      {"title": "...", "description": "...", "priority": "p1"}
    ]
  }]
}`;
}

function buildUserPrompt(input: DecomposeInput): string {
  const parts = [
    `Meta anual: R$ ${input.annual_target.toLocaleString("pt-BR")}`,
    `Modelo de negocio: ${input.business_model}`,
  ];

  if (input.location_name) parts.push(`Empresa: ${input.location_name}`);
  if (input.products_summary)
    parts.push(`Produtos/Servicos: ${input.products_summary}`);
  if (input.average_ticket)
    parts.push(
      `Ticket medio atual: R$ ${input.average_ticket.toLocaleString("pt-BR")}`,
    );
  if (input.current_funnel_data)
    parts.push(`Dados atuais do funil: ${input.current_funnel_data}`);

  parts.push(
    "\nDecomponha esta meta em OKRs trimestrais, Key Results mensuraveis, funis de aquisicao e acoes concretas.",
  );
  parts.push(
    "IMPORTANTE: Key Results precisam de target (numero), unit (texto) e data_source.",
  );
  parts.push("Gere a distribuicao mensal considerando sazonalidade e ramp-up.");

  return parts.join("\n");
}

// =============================================================
// Gemini API Call
// =============================================================

const MAX_RETRIES = 4;
const RETRY_DELAYS = [2000, 5000, 10000, 20000];

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY nao configurada");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          {
            role: "model",
            parts: [
              { text: "Entendido. Aguardando a meta para decompor em JSON." },
            ],
          },
          { role: "user", parts: [{ text: userPrompt }] },
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      const text = result.text;
      if (!text) throw new Error("Gemini retornou resposta vazia");
      return text;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
      const isRetryable = isRateLimit || errMsg.includes("503");

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS[attempt]),
        );
        continue;
      }

      if (isRateLimit) {
        throw new Error(
          "API Gemini com limite de requisicoes excedido (429). Aguarde 1 minuto e tente novamente.",
        );
      }
      throw error;
    }
  }

  throw new Error("Gemini: max retries atingido");
}

// =============================================================
// Validation
// =============================================================

function validateDecomposeResult(raw: unknown): DecomposeResult {
  const data = raw as DecomposeResult;

  if (!data.monthly_distribution || !Array.isArray(data.monthly_distribution)) {
    throw new Error("Campo monthly_distribution ausente ou invalido");
  }
  if (data.monthly_distribution.length !== 12) {
    throw new Error(
      `monthly_distribution deve ter 12 meses, recebeu ${data.monthly_distribution.length}`,
    );
  }

  if (!data.okrs || !Array.isArray(data.okrs) || data.okrs.length === 0) {
    throw new Error("Campo okrs ausente ou vazio");
  }

  for (const okr of data.okrs) {
    if (!okr.title || !okr.quarter || !okr.category) {
      throw new Error(`OKR invalido: faltando title, quarter ou category`);
    }
    if (!okr.key_results || okr.key_results.length === 0) {
      throw new Error(`OKR "${okr.title}" sem key_results`);
    }
    for (const kr of okr.key_results) {
      if (kr.target === undefined || kr.target === null) {
        throw new Error(`KR "${kr.title}" sem target numerico`);
      }
      if (!kr.unit) {
        throw new Error(`KR "${kr.title}" sem unit`);
      }
    }
  }

  return data;
}

// =============================================================
// Public API
// =============================================================

export async function decomposeGoal(
  input: DecomposeInput,
  benchmarks: Benchmark[],
): Promise<DecomposeResult> {
  const benchmarkContext = buildBenchmarkContext(benchmarks);
  const systemPrompt = buildSystemPrompt(benchmarkContext);
  const userPrompt = buildUserPrompt(input);

  const responseText = await callGemini(systemPrompt, userPrompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Gemini pode retornar com markdown wrapper
    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  }

  return validateDecomposeResult(parsed);
}
