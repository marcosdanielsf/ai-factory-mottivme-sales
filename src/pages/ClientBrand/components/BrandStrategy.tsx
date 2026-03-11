import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Loader2,
  Crown,
  Shield,
  Compass,
  Flame,
  Skull,
  Wand2,
  Users,
  Heart,
  Laugh,
  HandHeart,
  Paintbrush,
  Gem,
  Copy,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { BrandStrategy } from "../../../types/brand";

// ============ ARCHETYPE DATA ============

const ARCHETYPES = [
  {
    id: "innocent",
    name: "Inocente",
    icon: Heart,
    color: "#fbbf24",
    motto: "Ser feliz",
    desc: "Otimismo, simplicidade, pureza.",
    brands: "Dove, Coca-Cola",
  },
  {
    id: "explorer",
    name: "Explorador",
    icon: Compass,
    color: "#22c55e",
    motto: "Nao me limite",
    desc: "Liberdade, descoberta, autenticidade.",
    brands: "Jeep, Patagonia",
  },
  {
    id: "sage",
    name: "Sabio",
    icon: Gem,
    color: "#3b82f6",
    motto: "A verdade liberta",
    desc: "Conhecimento, expertise, verdade.",
    brands: "Google, TED",
  },
  {
    id: "hero",
    name: "Heroi",
    icon: Shield,
    color: "#ef4444",
    motto: "Onde ha vontade, ha caminho",
    desc: "Coragem, determinacao, maestria.",
    brands: "Nike, BMW",
  },
  {
    id: "outlaw",
    name: "Fora-da-Lei",
    icon: Skull,
    color: "#a855f7",
    motto: "Regras existem pra serem quebradas",
    desc: "Revolucao, ruptura, libertacao.",
    brands: "Harley, Virgin",
  },
  {
    id: "magician",
    name: "Mago",
    icon: Wand2,
    color: "#8b5cf6",
    motto: "Eu faco acontecer",
    desc: "Transformacao, visao, momentos magicos.",
    brands: "Apple, Tesla",
  },
  {
    id: "everyman",
    name: "Cara Comum",
    icon: Users,
    color: "#78716c",
    motto: "Todos sao iguais",
    desc: "Pertencimento, empatia, realismo.",
    brands: "IKEA, Havaianas",
  },
  {
    id: "lover",
    name: "Amante",
    icon: Flame,
    color: "#ec4899",
    motto: "Eu so tenho olhos pra voce",
    desc: "Paixao, intimidade, prazer.",
    brands: "Chanel, Godiva",
  },
  {
    id: "jester",
    name: "Bobo da Corte",
    icon: Laugh,
    color: "#f97316",
    motto: "Diversao e minha revolucao",
    desc: "Alegria, humor, leveza.",
    brands: "M&M's, Old Spice",
  },
  {
    id: "caregiver",
    name: "Cuidador",
    icon: HandHeart,
    color: "#14b8a6",
    motto: "Ama teu proximo",
    desc: "Protecao, generosidade, compaixao.",
    brands: "J&J, Volvo",
  },
  {
    id: "creator",
    name: "Criador",
    icon: Paintbrush,
    color: "#06b6d4",
    motto: "Se pode ser imaginado, pode ser criado",
    desc: "Inovacao, expressao, originalidade.",
    brands: "Lego, Adobe",
  },
  {
    id: "ruler",
    name: "Governante",
    icon: Crown,
    color: "#eab308",
    motto: "Poder e a unica coisa",
    desc: "Controle, lideranca, excelencia.",
    brands: "Mercedes, Rolex",
  },
] as const;

const PERSONALITY_DIMS = [
  {
    key: "sincerity" as const,
    label: "Sinceridade",
    low: "Reservada",
    high: "Calorosa",
    color: "#22c55e",
  },
  {
    key: "excitement" as const,
    label: "Empolgacao",
    low: "Contida",
    high: "Vibrante",
    color: "#f97316",
  },
  {
    key: "competence" as const,
    label: "Competencia",
    low: "Acessivel",
    high: "Tecnica",
    color: "#3b82f6",
  },
  {
    key: "sophistication" as const,
    label: "Sofisticacao",
    low: "Simples",
    high: "Requintada",
    color: "#a855f7",
  },
  {
    key: "ruggedness" as const,
    label: "Robustez",
    low: "Delicada",
    high: "Resistente",
    color: "#78716c",
  },
];

const TONE_PAIRS = [
  {
    key: "formal_casual" as const,
    left: "Formal",
    right: "Casual",
    colors: ["#6366f1", "#f59e0b"],
  },
  {
    key: "serious_playful" as const,
    left: "Serio",
    right: "Divertido",
    colors: ["#64748b", "#ec4899"],
  },
  {
    key: "respectful_irreverent" as const,
    left: "Respeitoso",
    right: "Irreverente",
    colors: ["#14b8a6", "#ef4444"],
  },
  {
    key: "enthusiastic_matter_of_fact" as const,
    left: "Entusiasmado",
    right: "Pragmatico",
    colors: ["#f97316", "#3b82f6"],
  },
];

const POSITIONING_FIELDS = [
  {
    key: "target" as const,
    prefix: "Para",
    placeholder: "profissionais de saude que querem atrair pacientes",
    color: "#22c55e",
  },
  {
    key: "category" as const,
    prefix: "a [marca] e",
    placeholder: "a plataforma de marketing digital com IA",
    color: "#3b82f6",
  },
  {
    key: "differentiator" as const,
    prefix: "que",
    placeholder:
      "automatiza todo o conteudo com a voz autentica do especialista",
    color: "#8b5cf6",
  },
  {
    key: "reason" as const,
    prefix: "porque",
    placeholder:
      "usa clones de IA treinados no DNA comunicacional de cada profissional",
    color: "#f97316",
  },
];

const STEPS = [
  { id: "archetype", label: "Arquetipo" },
  { id: "personality", label: "Personalidade" },
  { id: "tone", label: "Tom de Voz" },
  { id: "positioning", label: "Posicionamento" },
  { id: "tagline", label: "Tagline" },
];

// ============ MAIN COMPONENT ============

interface BrandStrategyProps {
  locationId: string;
}

export const BrandStrategyWizard: React.FC<BrandStrategyProps> = ({
  locationId,
}) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [data, setData] = useState({
    archetype: "" as string,
    personality_sincerity: 50,
    personality_excitement: 50,
    personality_competence: 50,
    personality_sophistication: 50,
    personality_ruggedness: 50,
    tone_formal_casual: 0,
    tone_serious_playful: 0,
    tone_respectful_irreverent: 0,
    tone_enthusiastic_matter_of_fact: 0,
    positioning_target: "",
    positioning_category: "",
    positioning_differentiator: "",
    positioning_reason: "",
    tagline: "",
    tagline_alternatives: [] as string[],
  });

  // Load existing strategy
  useEffect(() => {
    if (!locationId) return;
    supabase
      .from("brand_strategies")
      .select("*")
      .eq("location_id", locationId)
      .single()
      .then(({ data: existing }) => {
        if (existing) {
          setData((prev) => ({
            ...prev,
            ...existing,
            tagline_alternatives: existing.tagline_alternatives || [],
          }));
          setStrategyId(existing.id);
          setStep(existing.wizard_step ?? 0);
        }
      });
  }, [locationId]);

  const update = useCallback((updates: Partial<typeof data>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const save = useCallback(async () => {
    if (!locationId) return;
    setSaving(true);
    try {
      const payload = {
        ...data,
        location_id: locationId,
        wizard_step: step,
        status: step >= STEPS.length - 1 ? "complete" : "draft",
      };
      if (strategyId) {
        await supabase
          .from("brand_strategies")
          .update(payload)
          .eq("id", strategyId);
      } else {
        const { data: created } = await supabase
          .from("brand_strategies")
          .insert(payload)
          .select("id")
          .single();
        if (created) setStrategyId(created.id);
      }
    } catch {
      /* silent */
    }
    setSaving(false);
  }, [locationId, data, step, strategyId]);

  const next = async () => {
    await save();
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const canProceed =
    step === 0
      ? !!data.archetype
      : step === 3
        ? !!(data.positioning_target && data.positioning_category)
        : step === 4
          ? !!data.tagline
          : true;

  const generateTaglines = async () => {
    setGenerating(true);
    try {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        setGenerating(false);
        return;
      }

      const prompt = `Gere 5 taglines curtas e memoraveis para uma marca com arquetipo ${data.archetype}. Posicionamento: Para ${data.positioning_target || "..."}, ${data.positioning_category || "..."} que ${data.positioning_differentiator || "..."} porque ${data.positioning_reason || "..."}. Max 8 palavras cada, em PT-BR. Responda APENAS com JSON array de 5 strings.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 300,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      const result = await res.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const taglines = JSON.parse(text);
      if (Array.isArray(taglines) && taglines.length > 0) {
        update({ tagline: taglines[0], tagline_alternatives: taglines });
      }
    } catch {
      /* silent */
    }
    setGenerating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm flex-1 ${
                i === step
                  ? "bg-accent-primary/10 border border-accent-primary/25 text-text-primary"
                  : i < step
                    ? "bg-bg-tertiary text-text-secondary cursor-pointer hover:bg-bg-hover"
                    : "opacity-40 cursor-default text-text-muted"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  i === step
                    ? "bg-accent-primary text-white"
                    : i < step
                      ? "bg-accent-primary/30 text-accent-primary"
                      : "bg-bg-tertiary text-text-muted"
                }`}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span className="hidden md:block font-medium">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 h-px shrink-0 ${i < step ? "bg-accent-primary/40" : "bg-border-default"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="transition-opacity duration-200">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Qual arquetipo define esta marca?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Os 12 arquetipos de Jung representam padroes universais de
              personalidade.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ARCHETYPES.map((arch) => {
                const Icon = arch.icon;
                const selected = data.archetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => update({ archetype: arch.id })}
                    className={`group relative text-left p-4 rounded-xl border transition-all duration-200 ${
                      selected
                        ? "border-accent-primary/50 bg-accent-primary/[0.06] ring-1 ring-accent-primary/20"
                        : "border-border-default bg-bg-secondary hover:bg-bg-tertiary hover:border-border-hover"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${arch.color}15`,
                          border: `1px solid ${arch.color}30`,
                        }}
                      >
                        <Icon size={16} style={{ color: arch.color }} />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">
                        {arch.name}
                      </span>
                    </div>
                    <p
                      className="text-[11px] font-medium italic mb-1.5"
                      style={{ color: `${arch.color}cc` }}
                    >
                      &ldquo;{arch.motto}&rdquo;
                    </p>
                    <p className="text-[11px] text-text-muted leading-relaxed mb-2">
                      {arch.desc}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {arch.brands.split(", ").map((b) => (
                        <span
                          key={b}
                          className="text-[9px] px-1.5 py-0.5 rounded-full bg-bg-tertiary text-text-muted"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Personalidade da Marca
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Modelo de Aaker — ajuste os 5 eixos que definem como a marca e
              percebida.
            </p>
            <div className="space-y-6">
              {PERSONALITY_DIMS.map((dim) => {
                const key = `personality_${dim.key}` as keyof typeof data;
                const value = data[key] as number;
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">
                        {dim.label}
                      </span>
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: dim.color }}
                      >
                        {value}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-muted w-16 text-right shrink-0">
                        {dim.low}
                      </span>
                      <div className="flex-1 relative h-2">
                        <div className="absolute inset-0 rounded-full bg-bg-tertiary" />
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all"
                          style={{
                            width: `${value}%`,
                            backgroundColor: `${dim.color}40`,
                          }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) =>
                            update({
                              [key]: parseInt(e.target.value),
                            } as Partial<typeof data>)
                          }
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          style={{ height: 32, marginTop: -12 }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 pointer-events-none transition-all"
                          style={{
                            left: `calc(${value}% - 8px)`,
                            backgroundColor: dim.color,
                            borderColor: `${dim.color}80`,
                            boxShadow: `0 0 10px ${dim.color}40`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-text-muted w-16 shrink-0">
                        {dim.high}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-bg-secondary border border-border-default">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                Resumo
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {PERSONALITY_DIMS.map((dim) => {
                  const v = data[
                    `personality_${dim.key}` as keyof typeof data
                  ] as number;
                  const label =
                    v > 70 ? dim.high : v < 30 ? dim.low : "Equilibrada";
                  return (
                    <span
                      key={dim.key}
                      className="text-[11px] px-2.5 py-1 rounded-full border"
                      style={{
                        color: `${dim.color}cc`,
                        backgroundColor: `${dim.color}10`,
                        borderColor: `${dim.color}20`,
                      }}
                    >
                      {dim.label}: {label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Tom de Voz
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Posicione cada eixo onde a marca se sente mais autentica.
            </p>
            <div className="space-y-8">
              {TONE_PAIRS.map((pair) => {
                const key = `tone_${pair.key}` as keyof typeof data;
                const value = data[key] as number;
                const pct = (value + 100) / 2;
                const isLeft = value < -20;
                const isRight = value > 20;
                return (
                  <div key={pair.key}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span
                          className={`text-sm font-semibold ${isLeft ? "text-text-primary" : "text-text-muted"}`}
                        >
                          {pair.left}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-semibold ${isRight ? "text-text-primary" : "text-text-muted"}`}
                        >
                          {pair.right}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-3">
                      <div className="absolute inset-0 rounded-full bg-bg-tertiary overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-20 rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${pair.colors[0]}, transparent 45%, transparent 55%, ${pair.colors[1]})`,
                          }}
                        />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border-default" />
                      </div>
                      <input
                        type="range"
                        min={-100}
                        max={100}
                        value={value}
                        onChange={(e) =>
                          update({ [key]: parseInt(e.target.value) } as Partial<
                            typeof data
                          >)
                        }
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        style={{ height: 36, marginTop: -12 }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white/40 pointer-events-none transition-all"
                        style={{
                          left: `calc(${pct}% - 10px)`,
                          background: `linear-gradient(135deg, ${pair.colors[0]}, ${pair.colors[1]})`,
                          boxShadow: `0 0 14px ${isLeft ? pair.colors[0] : pair.colors[1]}40`,
                        }}
                      />
                    </div>
                    <div className="text-center mt-1.5">
                      <span className="text-[10px] text-text-muted">
                        {!isLeft && !isRight
                          ? "Equilibrado"
                          : isLeft
                            ? `${pair.left} (${Math.abs(value)}%)`
                            : `${pair.right} (${Math.abs(value)}%)`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Positioning Statement
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Preencha cada campo e veja o statement se formar em tempo real.
            </p>
            <div className="space-y-5">
              {POSITIONING_FIELDS.map((field) => {
                const key = `positioning_${field.key}` as keyof typeof data;
                return (
                  <div key={field.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          color: field.color,
                          backgroundColor: `${field.color}15`,
                        }}
                      >
                        {field.prefix}
                      </span>
                    </div>
                    <input
                      value={data[key] as string}
                      onChange={(e) =>
                        update({ [key]: e.target.value } as Partial<
                          typeof data
                        >)
                      }
                      placeholder={field.placeholder}
                      className="w-full h-11 px-3 rounded-lg bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-primary/40 transition-colors text-sm"
                    />
                  </div>
                );
              })}
            </div>
            {data.positioning_target && (
              <div className="mt-6 p-5 rounded-xl bg-accent-primary/[0.04] border border-accent-primary/15">
                <p className="text-[10px] uppercase tracking-widest text-accent-primary/60 mb-3">
                  Seu Positioning Statement
                </p>
                <p className="text-base text-text-primary/80 leading-relaxed italic">
                  &ldquo;Para {data.positioning_target}
                  {data.positioning_category
                    ? `, ${data.positioning_category}`
                    : ""}
                  {data.positioning_differentiator
                    ? ` que ${data.positioning_differentiator}`
                    : ""}
                  {data.positioning_reason
                    ? ` porque ${data.positioning_reason}`
                    : ""}
                  .&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              Tagline da Marca
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              Gere opcoes com IA ou escreva a sua.
            </p>
            <button
              onClick={generateTaglines}
              disabled={generating}
              className="flex items-center gap-2 px-5 h-10 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-50 mb-6"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Gerando...
                </>
              ) : data.tagline_alternatives.length > 0 ? (
                <>
                  <RefreshCw size={16} /> Gerar Novas
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Gerar Taglines com IA
                </>
              )}
            </button>
            {data.tagline_alternatives.length > 0 && (
              <div className="space-y-2 mb-6">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">
                  Opcoes Geradas
                </p>
                {data.tagline_alternatives.map((alt, i) => {
                  const selected = data.tagline === alt;
                  return (
                    <button
                      key={`${alt}-${i}`}
                      onClick={() => update({ tagline: alt })}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-accent-primary/40 bg-accent-primary/[0.06]"
                          : "border-border-default bg-bg-secondary hover:bg-bg-tertiary hover:border-border-hover"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${selected ? "bg-accent-primary text-white" : "bg-bg-tertiary text-text-muted"}`}
                      >
                        {selected ? <Check size={12} /> : i + 1}
                      </span>
                      <span
                        className={`flex-1 text-sm ${selected ? "text-text-primary font-medium" : "text-text-secondary"}`}
                      >
                        {alt}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(alt);
                        }}
                        className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
                      >
                        <Copy size={14} className="text-text-muted" />
                      </button>
                    </button>
                  );
                })}
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                Ou escreva manualmente
              </p>
              <input
                value={data.tagline}
                onChange={(e) => update({ tagline: e.target.value })}
                placeholder="Sua tagline aqui..."
                className="w-full h-11 px-3 rounded-lg bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-primary/40 transition-colors text-base"
              />
            </div>
            {data.tagline && (
              <div className="mt-8 text-center py-10 px-6 rounded-xl bg-bg-secondary border border-border-default">
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-4">
                  Preview
                </p>
                <p className="text-2xl font-bold text-text-primary tracking-tight">
                  &ldquo;{data.tagline}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border-default">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {saving && <span className="text-accent-primary">Salvando...</span>}
          <span>
            {step + 1} de {STEPS.length}
          </span>
        </div>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={!canProceed}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            Proximo <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={async () => {
              await save();
            }}
            disabled={!canProceed || saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-accent-primary to-accent-success text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles size={16} /> Finalizar
          </button>
        )}
      </div>
    </div>
  );
};
