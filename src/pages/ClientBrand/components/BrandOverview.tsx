import React, { useState, useEffect } from "react";
import {
  Image,
  FileText,
  Palette,
  BookOpen,
  Layout,
  Share2,
  Crown,
  Megaphone,
  Target,
  Globe,
  Workflow,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { BrandConfig } from "../../../types/brand";
import { supabase } from "../../../lib/supabase";

interface BrandOverviewProps {
  brand: BrandConfig;
  assetCounts: Record<string, number>;
  onTabChange: (tab: string) => void;
}

interface LogoApproval {
  id: string;
  brand_id: string;
  logo_id: string;
  logo_name: string;
  comment: string | null;
  approved_at: string;
  metadata: {
    concept?: string;
    imageUrl?: string;
  } | null;
}

function useLogoApproval(brandId: string) {
  const [approval, setApproval] = useState<LogoApproval | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("brand_logo_approvals")
      .select("*")
      .eq("brand_id", brandId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setApproval(data && data.length > 0 ? (data[0] as LogoApproval) : null);
        setLoading(false);
      });
  }, [brandId]);

  return { approval, loading };
}

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const LogoApprovedSection: React.FC<{
  brandId: string;
  primaryColor: string;
}> = ({ brandId, primaryColor }) => {
  const { approval, loading } = useLogoApproval(brandId);

  if (loading) return null;

  if (!approval) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-bg-secondary p-5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Logo Aprovada
          </p>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">
            Aguardando aprovacao do cliente
          </p>
        </div>
      </div>
    );
  }

  const imageUrl = approval.metadata?.imageUrl;
  const concept = approval.metadata?.concept;

  return (
    <div className="rounded-xl border border-zinc-800 bg-bg-secondary p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={14} style={{ color: primaryColor }} />
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Logo Aprovada
        </p>
      </div>

      <div className="flex items-start gap-4">
        {imageUrl ? (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt={approval.logo_name}
              className="w-full h-full object-contain p-2"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Image size={24} className="text-zinc-600" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white truncate">
            {approval.logo_name}
          </p>
          {concept && <p className="text-xs text-zinc-400">{concept}</p>}
          {approval.comment && (
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              "{approval.comment}"
            </p>
          )}
          <p className="text-xs text-zinc-500 pt-1">
            Aprovada em {formatDateBR(approval.approved_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

const SECTION_META: Record<
  string,
  { label: string; icon: React.ElementType; description: string }
> = {
  logos: {
    label: "Logotipos",
    icon: Crown,
    description: "Logos, assinaturas e simbolos",
  },
  icons: { label: "Icones", icon: Layout, description: "Icones e avatares" },
  "social-kit": {
    label: "Social Kit",
    icon: Share2,
    description: "Posts, stories e capas",
  },
  manual: { label: "Manual", icon: BookOpen, description: "Manual de marca" },
  docs: {
    label: "Documentos",
    icon: FileText,
    description: "Briefings e guias",
  },
  colors: { label: "Paleta", icon: Palette, description: "Cores da marca" },
  marketing: {
    label: "Marketing",
    icon: Megaphone,
    description: "Estrategia, conteudo e campanhas",
  },
  vendas: {
    label: "Vendas",
    icon: Target,
    description: "Scripts, decks e playbooks",
  },
  sites: { label: "Sites", icon: Globe, description: "Sites e landing pages" },
  workflows: {
    label: "Workflows",
    icon: Workflow,
    description: "Automacoes e fluxos n8n",
  },
};

export const BrandOverview: React.FC<BrandOverviewProps> = ({
  brand,
  assetCounts,
  onTabChange,
}) => {
  const sections = brand.sections || [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color}40 0%, transparent 60%)`,
          }}
        />
        <div className="relative flex items-center gap-6">
          {(() => {
            const heroImage = brand.theme_overrides?.["hero-image"];
            const imgSrc = heroImage || brand.logo_url;
            if (imgSrc) {
              return (
                <img
                  src={imgSrc}
                  alt={brand.client_name}
                  className="h-20 w-20 object-cover rounded-xl"
                />
              );
            }
            return (
              <div
                className="h-20 w-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: brand.primary_color }}
              >
                {brand.client_name.charAt(0)}
              </div>
            );
          })()}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {brand.client_name}
            </h1>
            {brand.client_tagline && (
              <p className="text-text-secondary mt-1">{brand.client_tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Logo Aprovada */}
      <LogoApprovedSection
        brandId={brand.id}
        primaryColor={brand.primary_color}
      />

      {/* Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const meta = SECTION_META[section];
          if (!meta) return null;
          const count = assetCounts[section] || 0;
          const Icon = meta.icon;

          return (
            <button
              key={section}
              onClick={() => onTabChange(section)}
              className="group text-left p-5 rounded-xl border border-border-default bg-bg-secondary hover:border-accent-primary/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${brand.primary_color}15` }}
                >
                  <Icon size={20} style={{ color: brand.primary_color }} />
                </div>
                {section !== "colors" && (
                  <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-full">
                    {count} {count === 1 ? "arquivo" : "arquivos"}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                {meta.label}
              </h3>
              <p className="text-xs text-text-muted mt-1">{meta.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
