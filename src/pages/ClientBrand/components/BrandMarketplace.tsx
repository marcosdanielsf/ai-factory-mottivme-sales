"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers,
  ArrowLeft,
  Download,
  Loader2,
  AlertCircle,
  Search,
  Maximize2,
  Minimize2,
  ImageOff,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type {
  BrandTemplate,
  BrandRender,
  BrandConfig,
} from "../../../types/brand";
import templateMetadata from "../../../../public/brand-templates/metadata.json";

// ============ TYPES ============

type MarketplaceView = "catalog" | "editor" | "renders";

interface TemplateVariables {
  cor_primaria: string;
  cor_secundaria: string;
  cor_acento: string;
  titulo: string;
  subtitulo: string;
  corpo: string;
  expert_name: string;
  especialidade: string;
  cta: string;
  foto_url: string;
  logo_url: string;
  citacao: string;
  numero_slide: string;
  total_slides: string;
  fonte_titulo: string;
  [key: string]: string;
}

interface MetadataEntry {
  name: string;
  category: string;
  platform: string | null;
  description: string;
  width: number;
  height: number;
  variables: string[];
  tags: string[];
}

type MetadataMap = Record<string, MetadataEntry>;

// ============ CONSTANTS ============

const METADATA = templateMetadata as MetadataMap;

const DEFAULT_VARIABLES: TemplateVariables = {
  cor_primaria: "#6B0F1A",
  cor_secundaria: "#F4ECE0",
  cor_acento: "#D4A853",
  titulo: "Seu Titulo Aqui",
  subtitulo: "Subtitulo complementar",
  corpo: "Texto do corpo com informacoes relevantes para o seu publico.",
  expert_name: "Nome do Expert",
  especialidade: "Especialidade",
  cta: "Saiba mais",
  foto_url: "",
  logo_url: "",
  citacao: "Uma citacao impactante que representa sua autoridade.",
  numero_slide: "1",
  total_slides: "5",
  fonte_titulo: "Inter",
};

const CATEGORY_LABELS: Record<string, string> = {
  social_media: "Social Media",
  comunicacao: "Comunicacao",
  ads: "Ads & Banners",
  apresentacao: "Apresentacoes",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  email: "Email",
  meta: "Meta Ads",
};

// ============ HELPERS ============

function buildStaticTemplates(): BrandTemplate[] {
  return Object.entries(METADATA).map(([slug, meta], idx) => ({
    id: slug,
    slug,
    name: meta.name,
    template_type: "post",
    category: meta.category,
    platform: meta.platform,
    tags: meta.tags ?? [],
    default_variables: meta.variables.reduce<Record<string, string>>(
      (acc, v) => {
        acc[v] = DEFAULT_VARIABLES[v] ?? "";
        return acc;
      },
      {},
    ),
    thumbnail_url: null,
    width: meta.width,
    height: meta.height,
    is_active: true,
    is_marketplace: true,
    sort_order: idx,
  }));
}

function injectVariablesIntoHtml(
  html: string,
  vars: TemplateVariables,
): string {
  // Inject CSS variables into :root
  const cssVars = `
    --cor-primaria: ${vars.cor_primaria};
    --cor-secundaria: ${vars.cor_secundaria};
    --cor-acento: ${vars.cor_acento};
    --fonte-titulo: '${vars.fonte_titulo}', sans-serif;
  `;

  // Replace :root { ... } or inject before </style>
  let result = html;

  if (result.includes(":root {")) {
    result = result.replace(/:root\s*\{([^}]*)\}/s, `:root {\n${cssVars}\n$1}`);
  } else {
    result = result.replace(/(<style[^>]*>)/i, `$1\n:root {\n${cssVars}\n}\n`);
  }

  // Replace {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const val = vars[key];
    return val !== undefined && val !== "" ? val : `{{${key}}}`;
  });

  return result;
}

// ============ TOAST ============

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

// ============ TEMPLATE CARD ============

const TemplateCard: React.FC<{
  template: BrandTemplate;
  onCustomize: (template: BrandTemplate) => void;
}> = ({ template, onCustomize }) => {
  const meta = METADATA[template.slug];
  const aspectRatio = template.width / template.height;
  const isVertical = aspectRatio < 1;
  const isWide = aspectRatio > 1.5;

  return (
    <div
      className="group rounded-xl border overflow-hidden transition-all duration-200 hover:border-accent-primary/40 hover:-translate-y-0.5"
      style={{
        background: "var(--color-bg-secondary, #111827)",
        borderColor: "var(--color-border-default, #2d2d44)",
      }}
    >
      {/* Preview area */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          background: "var(--color-bg-tertiary, #1a1a2e)",
          height: isVertical ? 200 : isWide ? 120 : 160,
        }}
      >
        <div
          className="flex items-center justify-center rounded"
          style={{
            background: "var(--color-bg-primary, #0d0d1a)",
            width: isVertical ? 80 : isWide ? 160 : 120,
            height: isVertical ? 140 : isWide ? 84 : 120,
            border: "1px solid var(--color-border-default, #2d2d44)",
          }}
        >
          <Layers
            size={24}
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          />
        </div>
        {/* Category badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            background: "var(--color-bg-primary, #0d0d1a)cc",
            color: "var(--color-text-muted, #9ca3af)",
            border: "1px solid var(--color-border-default, #2d2d44)",
          }}
        >
          {CATEGORY_LABELS[template.category] ?? template.category}
        </div>
        {/* Platform badge */}
        {template.platform && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: "var(--color-accent-primary, #6366f1)20",
              color: "var(--color-accent-primary, #6366f1)",
              border: "1px solid var(--color-accent-primary, #6366f1)30",
            }}
          >
            {PLATFORM_LABELS[template.platform] ?? template.platform}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--color-text-primary, #f9fafb)" }}
          >
            {template.name}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            {template.width}x{template.height}px
          </p>
        </div>

        {meta?.description && (
          <p
            className="text-[11px] leading-relaxed line-clamp-2"
            style={{ color: "var(--color-text-secondary, #9ca3af)" }}
          >
            {meta.description}
          </p>
        )}

        <button
          onClick={() => onCustomize(template)}
          className="w-full h-8 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: "var(--color-accent-primary, #6366f1)",
            color: "#fff",
          }}
        >
          Personalizar
        </button>
      </div>
    </div>
  );
};

// ============ VARIABLES PANEL ============

interface VariablesPanelProps {
  template: BrandTemplate;
  variables: TemplateVariables;
  onChange: (key: string, value: string) => void;
  onExport: () => void;
  onBack: () => void;
  exporting: boolean;
  brandConfig: BrandConfig | null;
}

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  template,
  variables,
  onChange,
  onExport,
  onBack,
  exporting,
  brandConfig: _brandConfig,
}) => {
  const meta = METADATA[template.slug];
  const activeVars = meta?.variables ?? Object.keys(DEFAULT_VARIABLES);

  const colorVars = activeVars.filter((v) =>
    ["cor_primaria", "cor_secundaria", "cor_acento"].includes(v),
  );
  const textVars = activeVars.filter(
    (v) => !colorVars.includes(v) && !["foto_url", "logo_url"].includes(v),
  );
  const urlVars = activeVars.filter((v) =>
    ["foto_url", "logo_url"].includes(v),
  );

  return (
    <div
      className="flex flex-col h-full overflow-hidden rounded-xl border"
      style={{
        background: "var(--color-bg-secondary, #111827)",
        borderColor: "var(--color-border-default, #2d2d44)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b shrink-0"
        style={{ borderColor: "var(--color-border-default, #2d2d44)" }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            color: "var(--color-text-muted, #9ca3af)",
          }}
          title="Voltar ao catalogo"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--color-text-primary, #f9fafb)" }}
          >
            {template.name}
          </p>
          <p
            className="text-[11px]"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            {template.width}x{template.height}px
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Colors */}
        {colorVars.length > 0 && (
          <section className="space-y-3">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            >
              Cores
            </p>
            {colorVars.map((v) => (
              <div key={v} className="flex items-center gap-3">
                <input
                  type="color"
                  value={variables[v] || "#6B0F1A"}
                  onChange={(e) => onChange(v, e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0.5"
                  style={{
                    outline: "1px solid var(--color-border-default, #2d2d44)",
                  }}
                />
                <div className="flex-1">
                  <p
                    className="text-xs font-medium capitalize"
                    style={{ color: "var(--color-text-secondary, #d1d5db)" }}
                  >
                    {v.replace(/_/g, " ")}
                  </p>
                  <p
                    className="text-[10px] font-mono"
                    style={{ color: "var(--color-text-muted, #9ca3af)" }}
                  >
                    {variables[v] || "#6B0F1A"}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Text fields */}
        {textVars.length > 0 && (
          <section className="space-y-3">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            >
              Textos
            </p>
            {textVars.map((v) => {
              const isLong = ["corpo", "citacao", "subtitulo"].includes(v);
              const label = v.replace(/_/g, " ");
              return (
                <div key={v} className="space-y-1">
                  <label
                    className="text-[11px] capitalize"
                    style={{ color: "var(--color-text-muted, #9ca3af)" }}
                  >
                    {label}
                  </label>
                  {isLong ? (
                    <textarea
                      value={variables[v] ?? ""}
                      onChange={(e) => onChange(v, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-xs resize-none transition-colors"
                      style={{
                        background: "var(--color-bg-tertiary, #1a1a2e)",
                        color: "var(--color-text-primary, #f9fafb)",
                        border:
                          "1px solid var(--color-border-default, #2d2d44)",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor =
                          "var(--color-accent-primary, #6366f1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          "var(--color-border-default, #2d2d44)";
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={variables[v] ?? ""}
                      onChange={(e) => onChange(v, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs transition-colors"
                      style={{
                        background: "var(--color-bg-tertiary, #1a1a2e)",
                        color: "var(--color-text-primary, #f9fafb)",
                        border:
                          "1px solid var(--color-border-default, #2d2d44)",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor =
                          "var(--color-accent-primary, #6366f1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          "var(--color-border-default, #2d2d44)";
                      }}
                    />
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* URL fields */}
        {urlVars.length > 0 && (
          <section className="space-y-3">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            >
              Imagens (URL)
            </p>
            {urlVars.map((v) => (
              <div key={v} className="space-y-1">
                <label
                  className="text-[11px] capitalize"
                  style={{ color: "var(--color-text-muted, #9ca3af)" }}
                >
                  {v.replace(/_/g, " ")}
                </label>
                <input
                  type="url"
                  value={variables[v] ?? ""}
                  onChange={(e) => onChange(v, e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{
                    background: "var(--color-bg-tertiary, #1a1a2e)",
                    color: "var(--color-text-primary, #f9fafb)",
                    border: "1px solid var(--color-border-default, #2d2d44)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor =
                      "var(--color-accent-primary, #6366f1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      "var(--color-border-default, #2d2d44)";
                  }}
                />
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Export button */}
      <div
        className="p-4 border-t shrink-0"
        style={{ borderColor: "var(--color-border-default, #2d2d44)" }}
      >
        <button
          onClick={onExport}
          disabled={exporting}
          className="w-full h-10 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: exporting
              ? "var(--color-accent-primary, #6366f1)80"
              : "var(--color-accent-primary, #6366f1)",
            color: "#fff",
          }}
        >
          {exporting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download size={15} />
              Exportar PNG
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============ LIVE PREVIEW ============

interface LivePreviewProps {
  template: BrandTemplate;
  htmlContent: string | null;
  loadingHtml: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({
  template,
  htmlContent,
  loadingHtml,
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspectRatio = template.width / template.height;

  return (
    <div
      className={`flex flex-col rounded-xl border overflow-hidden transition-all duration-200 ${fullscreen ? "fixed inset-4 z-50" : "h-full"}`}
      style={{
        background: "var(--color-bg-secondary, #111827)",
        borderColor: "var(--color-border-default, #2d2d44)",
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{
          background: "var(--color-bg-tertiary, #1a1a2e)",
          borderColor: "var(--color-border-default, #2d2d44)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <p
          className="text-[11px] font-mono"
          style={{ color: "var(--color-text-muted, #9ca3af)" }}
        >
          {template.width} x {template.height}
        </p>
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="p-1 rounded transition-colors"
          style={{ color: "var(--color-text-muted, #9ca3af)" }}
          title={fullscreen ? "Sair do fullscreen" : "Fullscreen"}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 overflow-hidden"
        style={{ background: "var(--color-bg-primary, #0d0d1a)" }}
      >
        {loadingHtml ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={28}
              className="animate-spin"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            >
              Carregando template...
            </p>
          </div>
        ) : !htmlContent ? (
          <div className="flex flex-col items-center gap-3">
            <ImageOff
              size={32}
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted, #9ca3af)" }}
            >
              Template nao encontrado
            </p>
          </div>
        ) : (
          <div
            className="relative shadow-2xl overflow-hidden"
            style={{
              width: "100%",
              maxWidth: aspectRatio >= 1 ? "100%" : "60%",
              aspectRatio: `${template.width} / ${template.height}`,
            }}
          >
            <iframe
              srcDoc={htmlContent}
              title={template.name}
              sandbox="allow-same-origin allow-scripts"
              className="absolute inset-0 w-full h-full border-0"
              style={{
                transformOrigin: "top left",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============ RENDERS GALLERY ============

const RendersGallery: React.FC<{
  brandId: string;
  renders: BrandRender[];
  loading: boolean;
}> = ({ renders, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--color-text-muted, #9ca3af)" }}
        />
      </div>
    );
  }

  if (renders.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-2xl border"
        style={{
          borderStyle: "dashed",
          borderColor: "var(--color-border-default, #2d2d44)",
          background: "var(--color-bg-secondary, #111827)",
        }}
      >
        <ImageOff
          size={40}
          style={{
            color: "var(--color-text-muted, #9ca3af)",
            marginBottom: 12,
          }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary, #d1d5db)" }}
        >
          Nenhum render ainda
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-text-muted, #9ca3af)" }}
        >
          Personalize um template e exporte para ver aqui
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {renders.map((render) => {
        const StatusIcon =
          render.status === "done"
            ? CheckCircle
            : render.status === "pending"
              ? Clock
              : XCircle;
        const statusColor =
          render.status === "done"
            ? "#22c55e"
            : render.status === "pending"
              ? "#f59e0b"
              : "#ef4444";

        return (
          <div
            key={render.id}
            className="rounded-xl border overflow-hidden"
            style={{
              background: "var(--color-bg-secondary, #111827)",
              borderColor: "var(--color-border-default, #2d2d44)",
            }}
          >
            {/* Thumbnail */}
            <div
              className="relative flex items-center justify-center"
              style={{
                background: "var(--color-bg-tertiary, #1a1a2e)",
                height: 140,
              }}
            >
              {render.render_url ? (
                <img
                  src={render.render_url}
                  alt={render.template_slug}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <ImageOff
                  size={32}
                  style={{ color: "var(--color-text-muted, #9ca3af)" }}
                />
              )}
            </div>

            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: "var(--color-text-primary, #f9fafb)" }}
                >
                  {METADATA[render.template_slug]?.name ?? render.template_slug}
                </p>
                <StatusIcon
                  size={14}
                  style={{ color: statusColor, flexShrink: 0 }}
                />
              </div>

              <p
                className="text-[10px]"
                style={{ color: "var(--color-text-muted, #9ca3af)" }}
              >
                {new Date(render.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {render.render_url && render.status === "done" && (
                <a
                  href={render.render_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center justify-center gap-1.5 w-full h-7 rounded-lg text-[11px] font-medium transition-colors"
                  style={{
                    background: "var(--color-bg-tertiary, #1a1a2e)",
                    color: "var(--color-text-secondary, #d1d5db)",
                    border: "1px solid var(--color-border-default, #2d2d44)",
                  }}
                >
                  <Download size={11} />
                  Download
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============ MAIN COMPONENT ============

interface BrandMarketplaceProps {
  brandId: string;
  locationId: string;
}

export const BrandMarketplace: React.FC<BrandMarketplaceProps> = ({
  brandId,
  locationId,
}) => {
  const [view, setView] = useState<MarketplaceView>("catalog");
  const [selectedTemplate, setSelectedTemplate] =
    useState<BrandTemplate | null>(null);
  const [variables, setVariables] = useState<TemplateVariables>({
    ...DEFAULT_VARIABLES,
  });
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [renders, setRenders] = useState<BrandRender[]>([]);
  const [loadingRenders, setLoadingRenders] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);

  // Catalog filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const templates = buildStaticTemplates();

  // Load brand config for auto-fill colors
  useEffect(() => {
    if (!brandId) return;
    supabase
      .from("brand_configs")
      .select("*")
      .eq("id", brandId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBrandConfig(data as BrandConfig);
        }
      });
  }, [brandId]);

  // Load renders
  const loadRenders = useCallback(async () => {
    if (!brandId) return;
    setLoadingRenders(true);
    const { data } = await supabase
      .from("brand_renders")
      .select("*")
      .eq("brand_config_id", brandId)
      .order("created_at", { ascending: false })
      .limit(50);
    setRenders((data ?? []) as BrandRender[]);
    setLoadingRenders(false);
  }, [brandId]);

  // Show toast
  const showToast = (message: string, type: ToastState["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Select template and open editor
  const handleCustomize = useCallback(
    async (template: BrandTemplate) => {
      setSelectedTemplate(template);

      // Reset variables to defaults for this template
      const meta = METADATA[template.slug];
      const templateDefaults: TemplateVariables = { ...DEFAULT_VARIABLES };
      if (meta?.variables) {
        // Keep only relevant vars
      }

      // Auto-fill from brand config
      if (brandConfig) {
        if (brandConfig.primary_color) {
          templateDefaults.cor_primaria = brandConfig.primary_color;
        }
        if (brandConfig.colors?.[1]) {
          templateDefaults.cor_secundaria = brandConfig.colors[1].hex;
        }
        if (brandConfig.colors?.[2]) {
          templateDefaults.cor_acento = brandConfig.colors[2].hex;
        }
        if (brandConfig.client_name) {
          templateDefaults.expert_name = brandConfig.client_name;
        }
        if (brandConfig.client_tagline) {
          templateDefaults.subtitulo = brandConfig.client_tagline;
        }
      }

      setVariables(templateDefaults);
      setHtmlContent(null);
      setView("editor");

      // Load HTML
      setLoadingHtml(true);
      try {
        const res = await fetch(`/brand-templates/${template.slug}.html`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawHtml = await res.text();
        setHtmlContent(rawHtml);
      } catch {
        setHtmlContent(null);
      }
      setLoadingHtml(false);
    },
    [brandConfig],
  );

  // Update variable and re-inject into HTML
  const handleVariableChange = useCallback((key: string, value: string) => {
    setVariables((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  }, []);

  // Compute injected HTML reactively
  const injectedHtml =
    htmlContent && selectedTemplate
      ? injectVariablesIntoHtml(htmlContent, variables)
      : null;

  // Export PNG
  const handleExport = async () => {
    if (!selectedTemplate) return;

    const apiKey = import.meta.env.VITE_INTERNAL_API_KEY;
    if (!apiKey) {
      showToast(
        "Configure a env var VITE_INTERNAL_API_KEY para exportar PNG.",
        "error",
      );
      return;
    }

    setExporting(true);

    try {
      // 1. Call Railway render service
      const railwayUrl =
        "https://brand-template-engine-production.up.railway.app/render";

      const renderBody = {
        template_id: selectedTemplate.slug,
        variables: variables,
        width: selectedTemplate.width,
        height: selectedTemplate.height,
        format: "png",
        return_base64: true,
      };

      const renderRes = await fetch(railwayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(renderBody),
      });

      if (!renderRes.ok) {
        const errText = await renderRes.text();
        throw new Error(`Render service error ${renderRes.status}: ${errText}`);
      }

      const renderData = (await renderRes.json()) as {
        success?: boolean;
        image_base64?: string;
        png_base64?: string;
        error?: string;
      };

      const base64 = renderData.image_base64 ?? renderData.png_base64 ?? null;
      if (!base64) {
        throw new Error(
          renderData.error ?? "Render retornou sem imagem base64.",
        );
      }

      // 2. Convert base64 to Blob
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: "image/png" });

      // 3. Upload to Supabase Storage
      const fileName = `${brandId}/${selectedTemplate.slug}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("visual-assets")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("visual-assets")
        .getPublicUrl(uploadData.path);

      const renderUrl = publicUrlData.publicUrl;

      // 4. Insert brand_render record
      await supabase.from("brand_renders").insert({
        brand_config_id: brandId,
        template_slug: selectedTemplate.slug,
        variables: variables,
        render_url: renderUrl,
        render_format: "png",
        source: "marketplace",
        status: "done",
      });

      showToast("PNG exportado com sucesso!", "success");

      // Refresh renders if on renders view
      if (view === "renders") {
        await loadRenders();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      showToast(msg, "error");
    }

    setExporting(false);
  };

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchCategory =
      filterCategory === "all" || t.category === filterCategory;
    const matchPlatform =
      filterPlatform === "all" || t.platform === filterPlatform;
    return matchSearch && matchCategory && matchPlatform;
  });

  const categories = [
    "all",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];
  const platforms = [
    "all",
    ...Array.from(
      new Set(templates.map((t) => t.platform).filter(Boolean) as string[]),
    ),
  ];

  // Handle renders tab
  useEffect(() => {
    if (view === "renders") {
      loadRenders();
    }
  }, [view, loadRenders]);

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium"
          style={{
            background:
              toast.type === "success"
                ? "#22c55e15"
                : toast.type === "error"
                  ? "#ef444415"
                  : "var(--color-bg-secondary, #111827)",
            border: `1px solid ${toast.type === "success" ? "#22c55e40" : toast.type === "error" ? "#ef444440" : "var(--color-border-default, #2d2d44)"}`,
            color:
              toast.type === "success"
                ? "#22c55e"
                : toast.type === "error"
                  ? "#ef4444"
                  : "var(--color-text-primary, #f9fafb)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} />
          ) : toast.type === "error" ? (
            <AlertCircle size={16} />
          ) : null}
          {toast.message}
        </div>
      )}

      {/* View toggles */}
      <div className="flex gap-1">
        {(
          [
            { key: "catalog", label: "Catalogo" },
            { key: "editor", label: "Editor", disabled: !selectedTemplate },
            { key: "renders", label: "Meus Renders" },
          ] as { key: MarketplaceView; label: string; disabled?: boolean }[]
        ).map(({ key, label, disabled }) => (
          <button
            key={key}
            onClick={() => {
              if (!disabled) setView(key);
            }}
            disabled={disabled}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              view === key
                ? {
                    background: "var(--color-accent-primary, #6366f1)",
                    color: "#fff",
                  }
                : {
                    background: "var(--color-bg-tertiary, #1a1a2e)",
                    color: "var(--color-text-secondary, #d1d5db)",
                    border: "1px solid var(--color-border-default, #2d2d44)",
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- VIEW: CATALOG ---- */}
      {view === "catalog" && (
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted, #9ca3af)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full pl-9 pr-4 h-9 rounded-lg text-xs transition-colors"
                style={{
                  background: "var(--color-bg-tertiary, #1a1a2e)",
                  color: "var(--color-text-primary, #f9fafb)",
                  border: "1px solid var(--color-border-default, #2d2d44)",
                  outline: "none",
                }}
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs"
              style={{
                background: "var(--color-bg-tertiary, #1a1a2e)",
                color: "var(--color-text-secondary, #d1d5db)",
                border: "1px solid var(--color-border-default, #2d2d44)",
                outline: "none",
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "Todas categorias" : (CATEGORY_LABELS[c] ?? c)}
                </option>
              ))}
            </select>

            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="h-9 px-3 rounded-lg text-xs"
              style={{
                background: "var(--color-bg-tertiary, #1a1a2e)",
                color: "var(--color-text-secondary, #d1d5db)",
                border: "1px solid var(--color-border-default, #2d2d44)",
                outline: "none",
              }}
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p === "all"
                    ? "Todas plataformas"
                    : (PLATFORM_LABELS[p] ?? p)}
                </option>
              ))}
            </select>
          </div>

          {/* Count */}
          <p
            className="text-[11px]"
            style={{ color: "var(--color-text-muted, #9ca3af)" }}
          >
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""} encontrado
            {filteredTemplates.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          {filteredTemplates.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl border"
              style={{
                borderStyle: "dashed",
                borderColor: "var(--color-border-default, #2d2d44)",
                background: "var(--color-bg-secondary, #111827)",
              }}
            >
              <Search
                size={32}
                style={{
                  color: "var(--color-text-muted, #9ca3af)",
                  marginBottom: 12,
                }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted, #9ca3af)" }}
              >
                Nenhum template encontrado
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((t) => (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  onCustomize={handleCustomize}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- VIEW: EDITOR ---- */}
      {view === "editor" && selectedTemplate && (
        <div
          className="flex flex-col lg:flex-row gap-4"
          style={{ minHeight: 600 }}
        >
          {/* Left: Variables panel (40%) */}
          <div className="lg:w-2/5 min-h-[500px] lg:min-h-0">
            <VariablesPanel
              template={selectedTemplate}
              variables={variables}
              onChange={handleVariableChange}
              onExport={handleExport}
              onBack={() => setView("catalog")}
              exporting={exporting}
              brandConfig={brandConfig}
            />
          </div>

          {/* Right: Live preview (60%) */}
          <div className="lg:w-3/5 min-h-[400px] lg:min-h-0">
            <LivePreview
              template={selectedTemplate}
              htmlContent={injectedHtml}
              loadingHtml={loadingHtml}
            />
          </div>
        </div>
      )}

      {/* ---- VIEW: RENDERS ---- */}
      {view === "renders" && (
        <RendersGallery
          brandId={brandId}
          renders={renders}
          loading={loadingRenders}
        />
      )}

      {/* Auto-fill notice */}
      {view === "catalog" && brandConfig && (
        <p
          className="text-[11px]"
          style={{ color: "var(--color-text-muted, #9ca3af)" }}
        >
          Cores de{" "}
          <strong style={{ color: "var(--color-text-secondary, #d1d5db)" }}>
            {brandConfig.client_name}
          </strong>{" "}
          serao pre-aplicadas ao personalizar um template.
        </p>
      )}
    </div>
  );
};
