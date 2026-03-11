import React, { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Sparkles,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { BrandStrategy } from "../../../types/brand";

// ============ TYPES ============

interface ColorSwatch {
  name: string;
  hex: string;
}

interface FontPairing {
  display: string;
  body: string;
}

interface BrandConcept {
  id: string;
  strategy_id: string;
  location_id: string;
  name: string;
  description: string | null;
  mood_keywords: string[];
  color_palette: ColorSwatch[];
  font_pairing: FontPairing | null;
  visual_style: string | null;
  moodboard_urls: string[];
  score: number;
  is_selected: boolean;
  created_at: string;
}

interface GeminiConceptRaw {
  name: string;
  description: string;
  mood_keywords: string[];
  color_palette: ColorSwatch[];
  font_pairing: FontPairing;
  visual_style: string;
}

// ============ HELPERS ============

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function normalizeConceptFromDb(row: Record<string, unknown>): BrandConcept {
  return {
    id: String(row.id ?? ""),
    strategy_id: String(row.strategy_id ?? ""),
    location_id: String(row.location_id ?? ""),
    name: String(row.name ?? ""),
    description: row.description != null ? String(row.description) : null,
    mood_keywords: Array.isArray(row.mood_keywords)
      ? (row.mood_keywords as string[])
      : [],
    color_palette: Array.isArray(row.color_palette)
      ? (row.color_palette as ColorSwatch[])
      : [],
    font_pairing:
      row.font_pairing != null &&
      typeof row.font_pairing === "object" &&
      !Array.isArray(row.font_pairing)
        ? (row.font_pairing as FontPairing)
        : null,
    visual_style: row.visual_style != null ? String(row.visual_style) : null,
    moodboard_urls: Array.isArray(row.moodboard_urls)
      ? (row.moodboard_urls as string[])
      : [],
    score: typeof row.score === "number" ? row.score : 0,
    is_selected: Boolean(row.is_selected),
    created_at: String(row.created_at ?? ""),
  };
}

// ============ SUB-COMPONENTS ============

const ColorSwatchRow: React.FC<{ palette: ColorSwatch[] }> = ({ palette }) => {
  if (palette.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {palette.map((color, i) => (
        <div key={i} className="group relative">
          <div
            className="w-7 h-7 rounded-full border border-white/10 transition-transform group-hover:scale-110 cursor-default"
            style={{
              backgroundColor: isValidHex(color.hex) ? color.hex : "#888",
            }}
            title={`${color.name} — ${color.hex}`}
          />
        </div>
      ))}
    </div>
  );
};

const MoodTagList: React.FC<{ keywords: string[] }> = ({ keywords }) => {
  if (keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.slice(0, 8).map((kw, i) => (
        <span
          key={i}
          className="px-2 py-0.5 text-[11px] rounded-full"
          style={{
            backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
            color: "var(--color-text-muted, #9ca3af)",
            border: "1px solid var(--color-border-default, #2d2d44)",
          }}
        >
          {kw}
        </span>
      ))}
    </div>
  );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 60
        ? "#f59e0b"
        : "var(--color-text-muted, #9ca3af)";

  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold shrink-0"
      style={{
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
        color,
      }}
    >
      {score}
    </div>
  );
};

interface ConceptCardProps {
  concept: BrandConcept;
  onSelect: (id: string) => void;
  selecting: string | null;
}

const ConceptCard: React.FC<ConceptCardProps> = ({
  concept,
  onSelect,
  selecting,
}) => {
  const isSelecting = selecting === concept.id;

  return (
    <div
      className="relative rounded-2xl border p-5 transition-all duration-200"
      style={{
        background: "var(--color-bg-secondary, #111827)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: concept.is_selected
          ? "var(--color-accent-primary, #6366f1)"
          : "var(--color-border-default, #2d2d44)",
        boxShadow: concept.is_selected
          ? "0 0 0 1px var(--color-accent-primary, #6366f1), 0 0 24px var(--color-accent-primary, #6366f1)18"
          : "none",
      }}
    >
      {/* Selected badge */}
      {concept.is_selected && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: "var(--color-accent-primary, #6366f1)20",
            color: "var(--color-accent-primary, #6366f1)",
            border: "1px solid var(--color-accent-primary, #6366f1)40",
          }}
        >
          <Check size={10} /> Selecionado
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <ScoreBadge score={concept.score} />
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold leading-tight truncate"
            style={{ color: "var(--color-text-primary, #f9fafb)" }}
          >
            {concept.name}
          </h3>
          {concept.visual_style && (
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            >
              {concept.visual_style}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {concept.description && (
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "var(--color-text-secondary, #d1d5db)" }}
        >
          {concept.description}
        </p>
      )}

      {/* Color palette */}
      {concept.color_palette.length > 0 && (
        <div className="mb-4">
          <p
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            Paleta
          </p>
          <ColorSwatchRow palette={concept.color_palette} />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {concept.color_palette.map((c, i) => (
              <span
                key={i}
                className="text-[10px]"
                style={{ color: "var(--color-text-muted, #9ca3af)" }}
              >
                {c.name}
                {i < concept.color_palette.length - 1 ? " ·" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Font pairing */}
      {concept.font_pairing && (
        <div className="mb-4">
          <p
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            Tipografia
          </p>
          <div className="flex gap-3 text-sm">
            <span
              className="px-2.5 py-1 rounded-lg text-[12px]"
              style={{
                backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                color: "var(--color-text-secondary, #d1d5db)",
                border: "1px solid var(--color-border-default, #2d2d44)",
              }}
            >
              <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>
                Display:{" "}
              </span>
              {concept.font_pairing.display}
            </span>
            <span
              className="px-2.5 py-1 rounded-lg text-[12px]"
              style={{
                backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                color: "var(--color-text-secondary, #d1d5db)",
                border: "1px solid var(--color-border-default, #2d2d44)",
              }}
            >
              <span style={{ color: "var(--color-text-muted, #9ca3af)" }}>
                Body:{" "}
              </span>
              {concept.font_pairing.body}
            </span>
          </div>
        </div>
      )}

      {/* Mood keywords */}
      {concept.mood_keywords.length > 0 && (
        <div className="mb-5">
          <p
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            Mood
          </p>
          <MoodTagList keywords={concept.mood_keywords} />
        </div>
      )}

      {/* Select button */}
      <button
        onClick={() => onSelect(concept.id)}
        disabled={concept.is_selected || isSelecting}
        className="w-full h-9 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-default"
        style={
          concept.is_selected
            ? {
                backgroundColor: "var(--color-accent-primary, #6366f1)15",
                color: "var(--color-accent-primary, #6366f1)",
                border: "1px solid var(--color-accent-primary, #6366f1)30",
              }
            : {
                backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                color: "var(--color-text-secondary, #d1d5db)",
                border: "1px solid var(--color-border-default, #2d2d44)",
              }
        }
      >
        {isSelecting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : concept.is_selected ? (
          <>
            <Check size={14} /> Selecionado
          </>
        ) : (
          "Selecionar este conceito"
        )}
      </button>
    </div>
  );
};

// ============ MAIN COMPONENT ============

interface BrandConceptsProps {
  locationId: string;
}

export const BrandConcepts: React.FC<BrandConceptsProps> = ({ locationId }) => {
  const [strategy, setStrategy] = useState<BrandStrategy | null>(null);
  const [concepts, setConcepts] = useState<BrandConcept[]>([]);
  const [loadingStrategy, setLoadingStrategy] = useState(true);
  const [loadingConcepts, setLoadingConcepts] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load strategy
  useEffect(() => {
    if (!locationId) return;
    setLoadingStrategy(true);
    supabase
      .from("brand_strategies")
      .select("*")
      .eq("location_id", locationId)
      .single()
      .then(({ data }) => {
        setStrategy((data as BrandStrategy) ?? null);
        setLoadingStrategy(false);
      });
  }, [locationId]);

  // Load concepts
  const loadConcepts = useCallback(async () => {
    if (!locationId) return;
    setLoadingConcepts(true);
    const { data } = await supabase
      .from("brand_concepts")
      .select("*")
      .eq("location_id", locationId)
      .order("score", { ascending: false });
    setConcepts(
      ((data ?? []) as Record<string, unknown>[]).map(normalizeConceptFromDb),
    );
    setLoadingConcepts(false);
  }, [locationId]);

  useEffect(() => {
    loadConcepts();
  }, [loadConcepts]);

  // Generate concepts via Gemini
  const generateConcepts = async () => {
    if (!strategy) return;
    setGenerating(true);
    setError(null);

    try {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        setError("VITE_GEMINI_API_KEY nao configurada.");
        setGenerating(false);
        return;
      }

      const archetypeMap: Record<string, string> = {
        innocent: "Inocente",
        explorer: "Explorador",
        sage: "Sabio",
        hero: "Heroi",
        outlaw: "Fora-da-Lei",
        magician: "Mago",
        everyman: "Cara Comum",
        lover: "Amante",
        jester: "Bobo da Corte",
        caregiver: "Cuidador",
        creator: "Criador",
        ruler: "Governante",
      };

      const archetypeLabel =
        archetypeMap[strategy.archetype] ?? strategy.archetype;

      const prompt = `Voce e um diretor de arte especialista em branding.

Com base na seguinte estrategia de marca, gere 3 conceitos visuais distintos e complementares.

ESTRATEGIA DA MARCA:
- Arquetipo: ${archetypeLabel}
- Personalidade: Sinceridade ${strategy.personality_sincerity}/100, Empolgacao ${strategy.personality_excitement}/100, Competencia ${strategy.personality_competence}/100, Sofisticacao ${strategy.personality_sophistication}/100, Robustez ${strategy.personality_ruggedness}/100
- Tom de Voz: Formal-Casual ${strategy.tone_formal_casual}, Serio-Divertido ${strategy.tone_serious_playful}, Respeitoso-Irreverente ${strategy.tone_respectful_irreverent}, Entusiasmado-Pragmatico ${strategy.tone_enthusiastic_matter_of_fact}
- Posicionamento: Para ${strategy.positioning_target || "publico-alvo"}, ${strategy.positioning_category || "a marca"} que ${strategy.positioning_differentiator || "se diferencia"} porque ${strategy.positioning_reason || "entrega valor unico"}.
- Tagline: ${strategy.tagline || "(sem tagline definida)"}

INSTRUCOES:
- Cada conceito deve ter nome unico e evocativo
- Color palette com 4-5 cores nomeadas em PT-BR (formato HEX valido #RRGGBB)
- Font pairing: display para titulos + body para corpo de texto (fontes do Google Fonts)
- Mood keywords: 5-7 palavras que capturam a essencia visual
- Visual style: 1 frase descrevendo o estilo (ex: "Minimalismo editorial com toques organicos")
- Score de 0-100 avaliando alinhamento com a estrategia
- Os 3 conceitos devem ser claramente diferentes entre si

Responda APENAS com JSON valido neste formato exato:
[
  {
    "name": "Nome do Conceito",
    "description": "Descricao do conceito em 2-3 frases.",
    "mood_keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
    "color_palette": [
      {"name": "Nome da Cor", "hex": "#RRGGBB"},
      {"name": "Nome da Cor", "hex": "#RRGGBB"},
      {"name": "Nome da Cor", "hex": "#RRGGBB"},
      {"name": "Nome da Cor", "hex": "#RRGGBB"}
    ],
    "font_pairing": {"display": "Nome Fonte Display", "body": "Nome Fonte Body"},
    "visual_style": "Descricao do estilo visual"
  }
]`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const result = await res.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

      let parsed: GeminiConceptRaw[];
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Try to extract JSON array from text
        const match = rawText.match(/\[[\s\S]*\]/);
        if (!match)
          throw new Error("Nao foi possivel parsear resposta do Gemini.");
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Gemini retornou lista vazia.");
      }

      // Score: use from AI, clamp 0-100
      const scoreBases = [85, 72, 61];

      const inserts = parsed.slice(0, 3).map((c, i) => ({
        strategy_id: strategy.id,
        location_id: locationId,
        name: String(c.name ?? `Conceito ${i + 1}`),
        description: String(c.description ?? ""),
        mood_keywords: Array.isArray(c.mood_keywords) ? c.mood_keywords : [],
        color_palette: Array.isArray(c.color_palette) ? c.color_palette : [],
        font_pairing:
          c.font_pairing && c.font_pairing.display && c.font_pairing.body
            ? c.font_pairing
            : null,
        visual_style: c.visual_style ? String(c.visual_style) : null,
        moodboard_urls: [],
        score: Math.min(100, Math.max(0, scoreBases[i] ?? 70)),
        is_selected: false,
      }));

      const { error: insertError } = await supabase
        .from("brand_concepts")
        .insert(inserts);

      if (insertError) throw new Error(insertError.message);

      await loadConcepts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      setError(msg);
    }

    setGenerating(false);
  };

  // Select a concept (deselect others)
  const selectConcept = async (conceptId: string) => {
    setSelecting(conceptId);
    try {
      // Deselect all from this location
      await supabase
        .from("brand_concepts")
        .update({ is_selected: false })
        .eq("location_id", locationId);

      // Select the chosen one
      await supabase
        .from("brand_concepts")
        .update({ is_selected: true })
        .eq("id", conceptId);

      setConcepts((prev) =>
        prev.map((c) => ({ ...c, is_selected: c.id === conceptId })),
      );
    } catch {
      /* silent */
    }
    setSelecting(null);
  };

  // ============ RENDER ============

  const isLoading = loadingStrategy || loadingConcepts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: "var(--color-text-muted, #9ca3af)" }}
        />
      </div>
    );
  }

  const strategyComplete = strategy?.status === "complete";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-primary, #f9fafb)" }}
          >
            Conceitos Visuais
          </h2>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-secondary, #d1d5db)" }}
          >
            {concepts.length === 0
              ? "Gere conceitos visuais baseados na sua estrategia de marca."
              : `${concepts.length} conceito${concepts.length > 1 ? "s" : ""} gerado${concepts.length > 1 ? "s" : ""}.`}
          </p>
        </div>

        {/* Generate / Regenerate button */}
        {strategyComplete ? (
          <button
            onClick={generateConcepts}
            disabled={generating}
            className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: generating
                ? "var(--color-accent-primary, #6366f1)60"
                : "var(--color-accent-primary, #6366f1)",
              color: "#fff",
            }}
          >
            {generating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Gerando...
              </>
            ) : concepts.length > 0 ? (
              <>
                <RefreshCw size={15} />
                Regenerar
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Gerar Conceitos
              </>
            )}
          </button>
        ) : null}
      </div>

      {/* Strategy incomplete warning */}
      {!strategyComplete && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            backgroundColor: "#f59e0b10",
            border: "1px solid #f59e0b30",
          }}
        >
          <AlertCircle
            size={18}
            style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}
          />
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary, #f9fafb)" }}
            >
              Estrategia incompleta
            </p>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-text-secondary, #d1d5db)" }}
            >
              Complete o wizard de estrategia (aba &ldquo;Estrategia&rdquo;)
              para gerar conceitos visuais.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            backgroundColor: "#ef444410",
            border: "1px solid #ef444430",
          }}
        >
          <AlertCircle
            size={18}
            style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
          />
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary, #d1d5db)" }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Empty state */}
      {concepts.length === 0 && strategyComplete && !generating && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl border"
          style={{
            borderStyle: "dashed",
            borderColor: "var(--color-border-default, #2d2d44)",
            backgroundColor: "var(--color-bg-secondary, #111827)",
          }}
        >
          <Lightbulb
            size={40}
            style={{
              color: "var(--color-text-muted, #9ca3af)",
              marginBottom: 12,
            }}
          />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--color-text-secondary, #d1d5db)" }}
          >
            Nenhum conceito gerado ainda
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            Clique em &ldquo;Gerar Conceitos&rdquo; para comecar
          </p>
        </div>
      )}

      {/* Generating skeleton */}
      {generating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 space-y-4 animate-pulse"
              style={{
                borderColor: "var(--color-border-default, #2d2d44)",
                backgroundColor: "var(--color-bg-secondary, #111827)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full"
                  style={{
                    backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                  }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 rounded-lg"
                    style={{
                      width: "60%",
                      backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                    }}
                  />
                  <div
                    className="h-3 rounded-lg"
                    style={{
                      width: "40%",
                      backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {[80, 100, 70].map((w, j) => (
                  <div
                    key={j}
                    className="h-3 rounded-lg"
                    style={{
                      width: `${w}%`,
                      backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="w-7 h-7 rounded-full"
                    style={{
                      backgroundColor: "var(--color-bg-tertiary, #1a1a2e)",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Concepts grid */}
      {!generating && concepts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {concepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              onSelect={selectConcept}
              selecting={selecting}
            />
          ))}
        </div>
      )}

      {/* Selected concept callout */}
      {concepts.some((c) => c.is_selected) && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            backgroundColor: "var(--color-accent-primary, #6366f1)08",
            border: "1px solid var(--color-accent-primary, #6366f1)20",
          }}
        >
          <Check
            size={16}
            style={{
              color: "var(--color-accent-primary, #6366f1)",
              flexShrink: 0,
            }}
          />
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary, #d1d5db)" }}
          >
            Conceito{" "}
            <strong style={{ color: "var(--color-text-primary, #f9fafb)" }}>
              {concepts.find((c) => c.is_selected)?.name}
            </strong>{" "}
            selecionado como direcao visual da marca.
          </p>
        </div>
      )}
    </div>
  );
};
