/**
 * KanbanProspect — Framework de prospecção com 6 dimensões geradas por IA
 *
 * Etapa 1: Wizard de 5 campos
 * Etapa 2: Loading com mensagens animadas
 * Etapa 3: Dashboard com grid 3x2, abas Cadência e Qualificação
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  AlertTriangle,
  Sparkles,
  Shield,
  Trophy,
  Calendar,
  RotateCcw,
  Save,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  X,
  Edit2,
  Check,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// =============================================================
// Types
// =============================================================

interface KanbanProduto {
  titulo: string;
  descricao: string;
  diferenciais: string[];
  objecoes_comuns: { objecao: string; resposta: string }[];
}

interface KanbanDor {
  titulo: string;
  descricao: string;
  tipo: "latente" | "ativa";
  impacto: string;
}

interface KanbanSonho {
  titulo: string;
  descricao: string;
  tipo: "pratico" | "identitario";
}

interface KanbanCase {
  cliente: string;
  situacao?: string;
  baseline?: string;
  problema?: string;
  conquista?: string;
  acao?: string;
  tempo?: string;
  resultado?: string;
  fator_chave?: string;
}

interface KanbanPasso {
  dia: number;
  canal: string;
  tipo: string;
  objetivo: string;
  template: string;
  dica: string;
}

interface KanbanAtividades {
  cadencia_recomendada: string;
  justificativa: string;
  passos: KanbanPasso[];
}

interface KanbanQualificacaoItem {
  tipo: "must_have" | "nice_to_have";
  descricao: string;
}

interface KanbanRedFlag {
  descricao: string;
  consequencia: string;
}

interface KanbanData {
  produto: KanbanProduto;
  dores: KanbanDor[];
  sonhos: KanbanSonho[];
  case_dor: KanbanCase;
  case_sonho: KanbanCase;
  atividades: KanbanAtividades;
  qualificacao: {
    criterios: KanbanQualificacaoItem[];
    red_flags: KanbanRedFlag[];
  };
}

interface FormData {
  produto: string;
  icp: string;
  ticket: string;
  tipo: "inbound" | "outbound" | "misto";
  canais: string[];
}

// =============================================================
// Constants
// =============================================================

const LOADING_MESSAGES = [
  "Analisando seu produto e ICP...",
  "Mapeando dores do cliente ideal...",
  "Identificando sonhos e aspirações...",
  "Construindo cases de sucesso...",
  "Montando cadência personalizada...",
  "Definindo critérios de qualificação...",
  "Finalizando seu Kanban Prospect...",
];

const TICKET_OPTIONS = [
  { value: "", label: "Selecione o ticket médio" },
  { value: "< R$500", label: "< R$500" },
  { value: "R$500-2k", label: "R$500 – R$2k" },
  { value: "R$2k-10k", label: "R$2k – R$10k" },
  { value: "R$10k+", label: "R$10k+" },
  { value: "Recorrente R$1-5k", label: "Recorrente R$1–5k/mês" },
  { value: "Recorrente R$5k+", label: "Recorrente R$5k+/mês" },
];

const CANAIS_OPTIONS = [
  "WhatsApp",
  "Email",
  "LinkedIn",
  "Telefone",
  "SMS",
  "Instagram",
];

const CANAL_ICON: Record<string, string> = {
  linkedin: "💼",
  whatsapp: "💬",
  email: "📧",
  telefone: "📞",
  sms: "📱",
  instagram: "📸",
};

// =============================================================
// JSON Sanitization
// =============================================================

function safeJsonParse(text: string): KanbanData | null {
  // Attempt 1: direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Attempt 2: sanitize
  try {
    const sanitized = text
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?:/g, '"$2":')
      .trim();
    return JSON.parse(sanitized);
  } catch {}

  // Attempt 3: extract JSON block
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}

  return null;
}

// =============================================================
// Gemini call
// =============================================================

async function callGemini(form: FormData): Promise<KanbanData> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const prompt = `Você é um especialista em vendas B2B brasileiro com 15 anos de experiência em prospecção outbound.

DADOS DA EMPRESA:
- Produto/Serviço: ${form.produto}
- ICP declarado: ${form.icp}
- Ticket médio: ${form.ticket}
- Tipo de venda: ${form.tipo}
- Canais disponíveis: ${form.canais.join(", ")}

Gere um Kanban de Prospecção completo. Retorne SOMENTE JSON válido com esta estrutura EXATA:

{
  "produto": {
    "titulo": "nome comercial do produto/serviço",
    "descricao": "2 parágrafos descrevendo o produto e seu valor",
    "diferenciais": ["diferencial 1", "diferencial 2", "diferencial 3"],
    "objecoes_comuns": [{"objecao": "texto", "resposta": "como rebater"}]
  },
  "dores": [
    {
      "titulo": "titulo curto",
      "descricao": "descrição de 2 linhas com contexto real",
      "tipo": "latente",
      "impacto": "impacto mensurável ou emocional"
    }
  ],
  "sonhos": [
    {
      "titulo": "titulo do sonho",
      "descricao": "o que o cliente quer sentir/conquistar",
      "tipo": "pratico"
    }
  ],
  "case_dor": {
    "cliente": "empresa do setor X (anônimo)",
    "situacao": "contexto inicial da empresa",
    "problema": "problema específico que tinha",
    "acao": "o que foi implementado",
    "resultado": "resultado mensurável em prazo X"
  },
  "case_sonho": {
    "cliente": "empresa do setor X (anônimo)",
    "baseline": "de onde partiram",
    "conquista": "o que foi alcançado",
    "tempo": "em quanto tempo",
    "fator_chave": "o que fez a diferença"
  },
  "atividades": {
    "cadencia_recomendada": "relacional_3x4x4",
    "justificativa": "por que esta cadência",
    "passos": [
      {
        "dia": 1,
        "canal": "linkedin",
        "tipo": "social_point",
        "objetivo": "criar familiaridade",
        "template": "mensagem com {{nome}} e {{empresa}} como variáveis",
        "dica": "dica prática para o SDR"
      }
    ]
  },
  "qualificacao": {
    "criterios": [
      { "tipo": "must_have", "descricao": "critério obrigatório" }
    ],
    "red_flags": [
      { "descricao": "red flag específico", "consequencia": "o que acontece se ignorar" }
    ]
  }
}

REGRAS:
- Gere exatamente: 6-8 dores, 4-6 sonhos, 5-6 criterios (mix must_have e nice_to_have), 4-5 red_flags
- Para atividades.passos: gere 6-9 touchpoints para a cadência recomendada
- Use linguagem brasileira do setor, vocabulário que o cliente usaria
- Seja ESPECÍFICO para o produto/ICP informado — nada genérico
- NUNCA use "Espero que este email te encontre bem" nos templates
- Cadência recomendada: use "fundamental_3x3x3" para ticket baixo/ciclo rápido, "transacional_5x3x1" para ticket médio, "relacional_3x4x4" para ticket alto/ciclo longo
- Retorne SOMENTE o JSON, sem markdown, sem explicações`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 65536,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const parsed = safeJsonParse(text);
  if (!parsed) {
    throw new Error("Falha ao interpretar resposta da IA. Tente novamente.");
  }

  return parsed;
}

// =============================================================
// Supabase save
// =============================================================

async function saveKanban(formData: FormData, kanbanData: KanbanData) {
  const name = formData.produto.split(" ").slice(0, 4).join(" ") + " — Kanban";

  const { data: kanban, error: kanbanError } = await supabase
    .from("prospect_kanbans")
    .insert({
      name,
      prospecting_type: formData.tipo,
      avg_ticket: formData.ticket,
      target_icp: formData.icp,
      ai_seed_input: formData.produto,
      location_id: null,
    })
    .select()
    .single();

  if (kanbanError) {
    if (kanbanError.code === "42P01") {
      throw new Error(
        "Tabela prospect_kanbans não existe. Solicite ao DBA a criação das tabelas do módulo Kanban Prospect.",
      );
    }
    throw kanbanError;
  }

  const dimensoes = [
    {
      dimension_type: "produto",
      title: "Produto/Serviço",
      content: JSON.stringify(kanbanData.produto),
    },
    {
      dimension_type: "dores",
      title: "Dores",
      content: JSON.stringify(kanbanData.dores),
      examples: kanbanData.dores.map((d) => d.titulo),
    },
    {
      dimension_type: "sonhos",
      title: "Sonhos",
      content: JSON.stringify(kanbanData.sonhos),
      examples: kanbanData.sonhos.map((s) => s.titulo),
    },
    {
      dimension_type: "case_dor",
      title: "Case de Resolução",
      content: JSON.stringify(kanbanData.case_dor),
    },
    {
      dimension_type: "case_sonho",
      title: "Case de Conquista",
      content: JSON.stringify(kanbanData.case_sonho),
    },
    {
      dimension_type: "atividades",
      title: "Atividades",
      content: JSON.stringify(kanbanData.atividades),
    },
  ];

  const { error: dimError } = await supabase
    .from("kanban_dimensions")
    .insert(dimensoes.map((d) => ({ ...d, kanban_id: kanban.id })));

  if (dimError && dimError.code !== "42P01") {
    throw dimError;
  }

  return kanban.id;
}

// =============================================================
// Sub-components
// =============================================================

function Badge({
  children,
  color = "zinc",
}: {
  children: React.ReactNode;
  color?: "zinc" | "green" | "red" | "amber" | "blue" | "purple";
}) {
  const colorMap: Record<string, string> = {
    zinc: "bg-zinc-700 text-zinc-300",
    green: "bg-emerald-500/20 text-emerald-400",
    red: "bg-red-500/20 text-red-400",
    amber: "bg-amber-500/20 text-amber-400",
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  const colorMap = {
    success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
    error: "bg-red-500/20 border-red-500/30 text-red-300",
    info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  };
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 border rounded-xl text-sm max-w-sm shadow-xl ${colorMap[type]}`}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Inline editable title
function EditableTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    if (draft.trim()) onChange(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="bg-transparent border-b border-amber-500 text-zinc-100 text-lg font-semibold outline-none px-1"
        style={{ minWidth: 200 }}
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="text-zinc-100 text-lg font-semibold hover:text-amber-400 transition-colors group flex items-center gap-1.5"
    >
      {value}
      <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

// Edit modal
function EditModal({
  title,
  content,
  onSave,
  onClose,
}: {
  title: string;
  content: string;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none resize-none font-mono leading-relaxed focus:border-amber-500/50"
          />
        </div>
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium rounded-lg transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Dimension card
function DimensionCard({
  icon: Icon,
  iconColor,
  title,
  itemCount,
  children,
  onEdit,
  editContent,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  itemCount?: string;
  children: React.ReactNode;
  onEdit?: (content: string) => void;
  editContent?: string;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        className="bg-zinc-800/50 border border-zinc-700 rounded-xl flex flex-col overflow-hidden hover:border-zinc-600 transition-colors"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-sm font-semibold text-zinc-200">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {itemCount && (
              <span className="text-[11px] text-zinc-500">{itemCount}</span>
            )}
            <Badge color="zinc">IA</Badge>
            {onEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className={`text-zinc-500 hover:text-zinc-300 transition-all text-xs flex items-center gap-1 ${hovered ? "opacity-100" : "opacity-0"}`}
              >
                <Edit2 className="w-3 h-3" />
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Card content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-72">
          {children}
        </div>
      </div>

      {showEdit && editContent !== undefined && onEdit && (
        <EditModal
          title={`Editar — ${title}`}
          content={editContent}
          onSave={onEdit}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

// =============================================================
// Step 1 — Wizard
// =============================================================

function WizardStep({
  form,
  setForm,
  onGenerate,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onGenerate: () => void;
}) {
  const canSubmit =
    form.produto.trim().length > 0 && form.icp.trim().length > 0;

  const toggleCanal = (canal: string) => {
    setForm((prev) => ({
      ...prev,
      canais: prev.canais.includes(canal)
        ? prev.canais.filter((c) => c !== canal)
        : [...prev.canais, canal],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 rounded-2xl mb-2">
          <Sparkles className="w-7 h-7 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Kanban Prospect AI</h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Preencha os dados abaixo e a IA vai gerar um framework completo de
          prospecção com dores, sonhos, cases e cadência personalizada.
        </p>
      </div>

      {/* Form */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-5">
        {/* Campo 1 — Produto */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            1. O que você vende? <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.produto}
            onChange={(e) =>
              setForm((p) => ({ ...p, produto: e.target.value }))
            }
            placeholder="Ex: Agentes de IA e automação n8n para PMEs"
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Campo 2 — ICP */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            2. Para quem você vende? <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.icp}
            onChange={(e) => setForm((p) => ({ ...p, icp: e.target.value }))}
            placeholder="Ex: Donos de empresa com time comercial de 2-10 pessoas"
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Campo 3 — Ticket */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            3. Ticket médio
          </label>
          <select
            value={form.ticket}
            onChange={(e) => setForm((p) => ({ ...p, ticket: e.target.value }))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50 transition-colors"
          >
            {TICKET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campo 4 — Tipo */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            4. Tipo de prospecção
          </label>
          <div className="flex gap-3">
            {(["inbound", "outbound", "misto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm((p) => ({ ...p, tipo: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                  form.tipo === t
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Campo 5 — Canais */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-300">
            5. Canal principal
          </label>
          <div className="flex flex-wrap gap-2">
            {CANAIS_OPTIONS.map((canal) => {
              const selected = form.canais.includes(canal);
              return (
                <button
                  key={canal}
                  onClick={() => toggleCanal(canal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selected
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {canal}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onGenerate}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold rounded-xl text-sm transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Gerar Kanban com IA ✨
      </button>
    </div>
  );
}

// =============================================================
// Step 2 — Loading
// =============================================================

function LoadingStep() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-zinc-700 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-zinc-200 transition-all duration-500">
          {LOADING_MESSAGES[msgIdx]}
        </p>
        <p className="text-xs text-zinc-500">
          A IA está analisando seu produto e mercado...
        </p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-1.5">
        {LOADING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i <= msgIdx ? "bg-amber-500" : "bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================
// Step 3 — Dashboard
// =============================================================

function DashboardStep({
  kanban,
  form,
  onRegenerate,
  onSave,
}: {
  kanban: KanbanData;
  form: FormData;
  onRegenerate: () => void;
  onSave: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"cadencia" | "qualificacao">(
    "cadencia",
  );
  const [kanbanName, setKanbanName] = useState(
    `${form.produto.split(" ").slice(0, 4).join(" ")} — Kanban`,
  );
  const [expandedRedFlags, setExpandedRedFlags] = useState<Set<number>>(
    new Set(),
  );
  const [expandedObjecoes, setExpandedObjecoes] = useState<Set<number>>(
    new Set(),
  );

  const toggleRedFlag = (i: number) => {
    setExpandedRedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleObjecao = (i: number) => {
    setExpandedObjecoes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Dashboard Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <EditableTitle value={kanbanName} onChange={setKanbanName} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge color="blue">{form.tipo}</Badge>
            {form.ticket && <Badge color="amber">{form.ticket}</Badge>}
            <Badge color="purple">
              {kanban.atividades?.cadencia_recomendada?.replace(/_/g, " ") ||
                "cadência IA"}
            </Badge>
            {form.canais.map((c) => (
              <Badge key={c} color="zinc">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Regenerar
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      {/* 6 Dimension Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1 — Produto */}
        <DimensionCard
          icon={Package}
          iconColor="text-zinc-400"
          title="Produto / Serviço"
          onEdit={() => {}}
          editContent={JSON.stringify(kanban.produto, null, 2)}
        >
          <p className="text-xs font-semibold text-amber-400">
            {kanban.produto?.titulo}
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">
            {kanban.produto?.descricao}
          </p>
          {kanban.produto?.diferenciais?.length > 0 && (
            <div className="pt-1 space-y-1">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                Diferenciais
              </p>
              {kanban.produto.diferenciais.map((d, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-zinc-300"
                >
                  <span className="text-amber-500 mt-0.5">•</span>
                  {d}
                </div>
              ))}
            </div>
          )}
          {kanban.produto?.objecoes_comuns?.length > 0 && (
            <div className="pt-1 space-y-1">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                Objeções
              </p>
              {kanban.produto.objecoes_comuns.map((o, i) => (
                <div
                  key={i}
                  className="border border-zinc-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleObjecao(i)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs text-zinc-400 hover:bg-zinc-700/50 transition-colors"
                  >
                    <span className="line-clamp-1">{o.objecao}</span>
                    {expandedObjecoes.has(i) ? (
                      <ChevronDown className="w-3 h-3 shrink-0 ml-1" />
                    ) : (
                      <ChevronRight className="w-3 h-3 shrink-0 ml-1" />
                    )}
                  </button>
                  {expandedObjecoes.has(i) && (
                    <div className="px-2.5 py-2 bg-zinc-900/50 text-xs text-zinc-300 leading-relaxed border-t border-zinc-700">
                      {o.resposta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DimensionCard>

        {/* Card 2 — Dores */}
        <DimensionCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          title="Dores"
          itemCount={`${kanban.dores?.length || 0} dores identificadas`}
          onEdit={() => {}}
          editContent={JSON.stringify(kanban.dores, null, 2)}
        >
          {kanban.dores?.map((dor, i) => (
            <div
              key={i}
              className="border border-zinc-700/50 rounded-lg p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-200">
                  {dor.titulo}
                </p>
                <Badge color={dor.tipo === "ativa" ? "red" : "amber"}>
                  {dor.tipo}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {dor.descricao}
              </p>
              {dor.impacto && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {dor.impacto}
                </p>
              )}
            </div>
          ))}
        </DimensionCard>

        {/* Card 3 — Sonhos */}
        <DimensionCard
          icon={Sparkles}
          iconColor="text-amber-400"
          title="Sonhos"
          itemCount={`${kanban.sonhos?.length || 0} aspirações`}
          onEdit={() => {}}
          editContent={JSON.stringify(kanban.sonhos, null, 2)}
        >
          {kanban.sonhos?.map((sonho, i) => (
            <div
              key={i}
              className="border border-zinc-700/50 rounded-lg p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-200">
                  {sonho.titulo}
                </p>
                <Badge color={sonho.tipo === "identitario" ? "purple" : "blue"}>
                  {sonho.tipo}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {sonho.descricao}
              </p>
            </div>
          ))}
        </DimensionCard>

        {/* Card 4 — Case Dor */}
        <DimensionCard
          icon={Shield}
          iconColor="text-blue-400"
          title="Case — Resolução de Dor"
          onEdit={() => {}}
          editContent={JSON.stringify(kanban.case_dor, null, 2)}
        >
          {kanban.case_dor && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-blue-400">
                {kanban.case_dor.cliente}
              </p>
              <div className="space-y-2">
                {kanban.case_dor.situacao && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                      Situação
                    </p>
                    <p className="text-xs text-zinc-400">
                      {kanban.case_dor.situacao}
                    </p>
                  </div>
                )}
                {kanban.case_dor.problema && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                      Problema
                    </p>
                    <p className="text-xs text-zinc-400">
                      {kanban.case_dor.problema}
                    </p>
                  </div>
                )}
                {kanban.case_dor.acao && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                      Ação
                    </p>
                    <p className="text-xs text-zinc-400">
                      {kanban.case_dor.acao}
                    </p>
                  </div>
                )}
                {kanban.case_dor.resultado && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-2">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-0.5">
                      Resultado
                    </p>
                    <p className="text-xs text-emerald-300 font-medium">
                      {kanban.case_dor.resultado}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DimensionCard>

        {/* Card 5 — Case Sonho */}
        <DimensionCard
          icon={Trophy}
          iconColor="text-emerald-400"
          title="Case — Conquista de Sonho"
          onEdit={() => {}}
          editContent={JSON.stringify(kanban.case_sonho, null, 2)}
        >
          {kanban.case_sonho && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-emerald-400">
                {kanban.case_sonho.cliente}
              </p>
              <div className="space-y-2">
                {kanban.case_sonho.baseline && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                      Ponto de partida
                    </p>
                    <p className="text-xs text-zinc-400">
                      {kanban.case_sonho.baseline}
                    </p>
                  </div>
                )}
                {kanban.case_sonho.conquista && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                      Conquista
                    </p>
                    <p className="text-xs text-zinc-400">
                      {kanban.case_sonho.conquista}
                    </p>
                  </div>
                )}
                {kanban.case_sonho.tempo && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-2">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-0.5">
                      Tempo
                    </p>
                    <p className="text-xs text-emerald-300 font-medium">
                      {kanban.case_sonho.tempo}
                    </p>
                  </div>
                )}
                {kanban.case_sonho.fator_chave && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">
                      Fator-chave
                    </p>
                    <p className="text-xs text-amber-300">
                      {kanban.case_sonho.fator_chave}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DimensionCard>

        {/* Card 6 — Atividades Preview */}
        <DimensionCard
          icon={Calendar}
          iconColor="text-purple-400"
          title="Cadência"
          itemCount={`${kanban.atividades?.passos?.length || 0} touchpoints`}
          onEdit={() => {}}
          editContent={JSON.stringify(kanban.atividades, null, 2)}
        >
          {kanban.atividades && (
            <div className="space-y-2">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-2.5 py-2">
                <p className="text-xs font-semibold text-purple-300">
                  {kanban.atividades.cadencia_recomendada?.replace(/_/g, " ")}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {kanban.atividades.justificativa}
                </p>
              </div>
              {kanban.atividades.passos?.slice(0, 3).map((passo, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-zinc-400"
                >
                  <span className="shrink-0 w-7 h-5 flex items-center justify-center bg-zinc-700 rounded text-[10px] font-bold text-zinc-300">
                    D{passo.dia}
                  </span>
                  <div>
                    <span className="text-zinc-300">
                      {CANAL_ICON[passo.canal.toLowerCase()] || "📌"}{" "}
                      {passo.objetivo}
                    </span>
                  </div>
                </div>
              ))}
              {(kanban.atividades.passos?.length || 0) > 3 && (
                <p className="text-[10px] text-zinc-600">
                  +{(kanban.atividades.passos?.length || 0) - 3} touchpoints na
                  aba Cadência
                </p>
              )}
            </div>
          )}
        </DimensionCard>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
        <div className="flex border-b border-zinc-700">
          {(
            [
              {
                key: "cadencia",
                label: "Cadência de Prospecção",
                icon: Calendar,
              },
              {
                key: "qualificacao",
                label: "Qualificação",
                icon: CheckCircle2,
              },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === key
                  ? "border-amber-500 text-amber-400 bg-amber-500/5"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Tab: Cadência */}
          {activeTab === "cadencia" && kanban.atividades && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {kanban.atividades.cadencia_recomendada?.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {kanban.atividades.justificativa}
                  </p>
                </div>
                <Badge color="purple">
                  {kanban.atividades.passos?.length || 0} touchpoints
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                {kanban.atividades.passos?.map((passo, i) => (
                  <div
                    key={i}
                    className="flex gap-3 border border-zinc-700/50 rounded-xl p-3 hover:border-zinc-600 transition-colors"
                  >
                    {/* Day badge */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-zinc-300">
                          D{passo.dia}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-600 capitalize">
                        {CANAL_ICON[passo.canal?.toLowerCase()] || "📌"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge color="purple">{passo.canal}</Badge>
                        <Badge color="zinc">
                          {passo.tipo?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-zinc-400">
                          {passo.objetivo}
                        </span>
                      </div>

                      {/* Template */}
                      <div className="bg-zinc-900/70 border border-zinc-700 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                          Template
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                          {passo.template}
                        </p>
                      </div>

                      {/* Dica */}
                      {passo.dica && (
                        <p className="text-[11px] text-amber-400 flex items-start gap-1">
                          <span>💡</span>
                          <span>{passo.dica}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Qualificação */}
          {activeTab === "qualificacao" && kanban.qualificacao && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Critérios */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Critérios de Qualificação
                </h3>
                <div className="space-y-2">
                  {kanban.qualificacao.criterios?.map((c, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                        c.tipo === "must_have"
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-blue-500/5 border-blue-500/20"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          c.tipo === "must_have"
                            ? "text-emerald-400"
                            : "text-blue-400"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-xs text-zinc-300">{c.descricao}</p>
                        <Badge
                          color={c.tipo === "must_have" ? "green" : "blue"}
                        >
                          {c.tipo === "must_have" ? "Obrigatório" : "Desejável"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Red Flags
                </h3>
                <div className="space-y-2">
                  {kanban.qualificacao.red_flags?.map((rf, i) => (
                    <div
                      key={i}
                      className="border border-red-500/20 bg-red-500/5 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleRedFlag(i)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span>🚩</span>
                          {rf.descricao}
                        </span>
                        {expandedRedFlags.has(i) ? (
                          <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-2" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-2" />
                        )}
                      </button>
                      {expandedRedFlags.has(i) && (
                        <div className="px-3 py-2 border-t border-red-500/20 bg-zinc-900/50">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                            Consequência se ignorar
                          </p>
                          <p className="text-xs text-zinc-400">
                            {rf.consequencia}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================
// Main Page
// =============================================================

export function KanbanProspect() {
  const [step, setStep] = useState<"wizard" | "loading" | "dashboard">(
    "wizard",
  );
  const [form, setForm] = useState<FormData>({
    produto: "",
    icp: "",
    ticket: "",
    tipo: "outbound",
    canais: [],
  });
  const [kanban, setKanban] = useState<KanbanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    setStep("loading");
    setError(null);
    try {
      const data = await callGemini(form);
      setKanban(data);
      setStep("dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
      setStep("wizard");
      showToast(`Erro ao gerar kanban: ${msg}`, "error");
    }
  }, [form, showToast]);

  const handleSave = useCallback(async () => {
    if (!kanban) return;
    setSaving(true);
    try {
      await saveKanban(form, kanban);
      showToast("Kanban salvo com sucesso!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }, [kanban, form, showToast]);

  const handleRegenerate = useCallback(() => {
    setStep("wizard");
    setKanban(null);
  }, []);

  return (
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Kanban Prospect AI
        </h1>
        {step === "dashboard" && (
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Novo Kanban
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && step === "wizard" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Steps */}
      {step === "wizard" && (
        <WizardStep form={form} setForm={setForm} onGenerate={handleGenerate} />
      )}

      {step === "loading" && <LoadingStep />}

      {step === "dashboard" && kanban && (
        <DashboardStep
          kanban={kanban}
          form={form}
          onRegenerate={handleRegenerate}
          onSave={handleSave}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-sm text-zinc-200">Salvando kanban...</span>
          </div>
        </div>
      )}
    </div>
  );
}
