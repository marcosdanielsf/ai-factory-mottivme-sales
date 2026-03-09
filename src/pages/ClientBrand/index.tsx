import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Image,
  Layout,
  Share2,
  BookOpen,
  FileText,
  Palette,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Megaphone,
  Target,
  Globe,
  Workflow,
  Building2,
  Fingerprint,
  Lightbulb,
} from "lucide-react";
import { useAccount } from "../../contexts/AccountContext";
import { usePermissions } from "../../hooks/usePermissions";
import { useBrandConfig } from "../../hooks/useBrandConfig";
import { useBrandAssets } from "../../hooks/useBrandAssets";
import { BrandOverview } from "./components/BrandOverview";
import { BrandGallery } from "./components/BrandGallery";
import { BrandManual } from "./components/BrandManual";
import { BrandDocs } from "./components/BrandDocs";
import { BrandColors } from "./components/BrandColors";
import { BrandDeliverables } from "./components/BrandDeliverables";
import { BrandSites } from "./components/BrandSites";
import { BrandKnowledgeBase } from "./components/BrandKnowledgeBase";
import { DownloadAllButton } from "./components/DownloadAllButton";
import { BrandStrategyWizard } from "./components/BrandStrategy";
import { BrandConcepts } from "./components/BrandConcepts";
import { supabase } from "../../lib/supabase";
import type { BrandConfig } from "../../types/brand";

const TAB_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  overview: { label: "Visao Geral", icon: Crown },
  logos: { label: "Logotipos", icon: Image },
  icons: { label: "Icones", icon: Layout },
  "social-kit": { label: "Social Kit", icon: Share2 },
  manual: { label: "Manual", icon: BookOpen },
  docs: { label: "Documentos", icon: FileText },
  colors: { label: "Paleta", icon: Palette },
  "meu-negocio": { label: "Meu Negocio", icon: Building2 },
  marketing: { label: "Marketing", icon: Megaphone },
  vendas: { label: "Vendas", icon: Target },
  sites: { label: "Sites", icon: Globe },
  workflows: { label: "Workflows", icon: Workflow },
  strategy: { label: "Estrategia", icon: Fingerprint },
  concepts: { label: "Conceitos", icon: Lightbulb },
};

const LOGO_SUB_SECTIONS = ["logos", "signatures", "symbols"];
const LOGO_TAB_LABELS: Record<string, string> = {
  logos: "Logos",
  signatures: "Assinaturas",
  symbols: "Simbolos",
};

const ICON_SUB_SECTIONS = ["icons", "avatars"];
const ICON_TAB_LABELS: Record<string, string> = {
  icons: "Icones",
  avatars: "Avatares",
};

// ============================================
// ADMIN: All brands grid
// ============================================

const BrandAdminList: React.FC<{
  onSelectBrand: (brand: BrandConfig) => void;
}> = ({ onSelectBrand }) => {
  const [brands, setBrands] = useState<BrandConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("brand_configs")
      .select("*")
      .order("client_name")
      .then(({ data }) => {
        setBrands((data as BrandConfig[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="text-center py-20 text-text-muted text-sm">
        Nenhum brand configurado ainda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {brands.map((brand) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const logoUrl = brand.logo_url
          ? brand.logo_url.startsWith("http")
            ? brand.logo_url
            : `${supabaseUrl}/storage/v1/object/public/brandpacks/${brand.logo_url}`
          : null;

        return (
          <button
            key={brand.id}
            onClick={() => onSelectBrand(brand)}
            className="group text-left rounded-xl border border-border-default bg-bg-secondary hover:border-accent-primary/30 transition-all overflow-hidden"
          >
            {/* Color bar */}
            <div
              className="h-2"
              style={{ backgroundColor: brand.primary_color }}
            />

            <div className="p-5 space-y-3">
              {/* Logo + Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Palette size={18} className="text-text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {brand.client_name}
                  </p>
                  {brand.client_tagline && (
                    <p className="text-xs text-text-muted truncate">
                      {brand.client_tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* Sections pills */}
              <div className="flex flex-wrap gap-1">
                {brand.sections.slice(0, 5).map((sec) => (
                  <span
                    key={sec}
                    className="px-2 py-0.5 text-[10px] font-medium bg-bg-tertiary text-text-muted rounded-full"
                  >
                    {TAB_CONFIG[sec]?.label || sec}
                  </span>
                ))}
                {brand.sections.length > 5 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-bg-tertiary text-text-muted rounded-full">
                    +{brand.sections.length - 5}
                  </span>
                )}
              </div>

              {/* Color swatches */}
              {brand.colors && brand.colors.length > 0 && (
                <div className="flex gap-1">
                  {brand.colors.slice(0, 6).map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-border-default"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="flex items-center gap-1 text-xs text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                <ExternalLink size={12} />
                <span>Ver brand</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ClientBrand: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAccount } = useAccount();
  const { isAdmin } = usePermissions();
  const locationId = selectedAccount?.location_id;
  const { brandConfig, loading } = useBrandConfig(locationId);
  const [activeTab, setActiveTab] = useState("overview");

  // Admin mode: selected brand from the admin list (when no subconta)
  const [adminSelectedBrand, setAdminSelectedBrand] =
    useState<BrandConfig | null>(null);

  // Determine which brand to display
  const activeBrand = brandConfig || adminSelectedBrand;

  // Fetch all assets for counts (overview)
  const { assets: allAssets } = useBrandAssets(activeBrand?.id);

  const assetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of allAssets) {
      counts[a.section] = (counts[a.section] || 0) + 1;
    }
    return counts;
  }, [allAssets]);

  // Redirect if non-admin and no brand config
  useEffect(() => {
    if (!loading && !brandConfig && !isAdmin) {
      navigate("/agendamentos", { replace: true });
    }
  }, [loading, brandConfig, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  // Admin mode without subconta: show all brands or selected brand
  if (!brandConfig && isAdmin) {
    if (!adminSelectedBrand) {
      return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Brand Assets
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Identidade visual de todos os clientes
            </p>
          </div>
          <BrandAdminList
            onSelectBrand={(brand) => {
              setAdminSelectedBrand(brand);
              setActiveTab("overview");
            }}
          />
        </div>
      );
    }
    // Admin selected a brand — show it with back button (fall through to normal render)
  }

  if (!activeBrand) return null;

  const sectionTabs = activeBrand.sections.filter((s) => TAB_CONFIG[s]);
  // "meu-negocio" always available (reads from client_knowledge_base, not brand_assets)
  if (!sectionTabs.includes("meu-negocio")) {
    const colorsIdx = sectionTabs.indexOf("colors");
    sectionTabs.splice(
      colorsIdx >= 0 ? colorsIdx + 1 : sectionTabs.length,
      0,
      "meu-negocio",
    );
  }
  if (!sectionTabs.includes("strategy")) {
    sectionTabs.push("strategy");
  }
  if (!sectionTabs.includes("concepts")) {
    sectionTabs.push("concepts");
  }
  const availableTabs = ["overview", ...sectionTabs];

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <BrandOverview
            brand={activeBrand}
            assetCounts={assetCounts}
            onTabChange={setActiveTab}
          />
        );
      case "logos":
        return (
          <BrandGallery
            brandId={activeBrand.id}
            sections={LOGO_SUB_SECTIONS}
            tabLabels={LOGO_TAB_LABELS}
            primaryColor={activeBrand.primary_color}
          />
        );
      case "icons":
        return (
          <BrandGallery
            brandId={activeBrand.id}
            sections={ICON_SUB_SECTIONS}
            tabLabels={ICON_TAB_LABELS}
            primaryColor={activeBrand.primary_color}
          />
        );
      case "social-kit":
        return (
          <BrandGallery
            brandId={activeBrand.id}
            sections={["social-kit"]}
            tabLabels={{ "social-kit": "Social Kit" }}
            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            primaryColor={activeBrand.primary_color}
          />
        );
      case "manual":
        return <BrandManual brandId={activeBrand.id} />;
      case "docs":
        return <BrandDocs brandId={activeBrand.id} />;
      case "colors":
        return (
          <BrandColors
            colors={activeBrand.colors}
            primaryColor={activeBrand.primary_color}
          />
        );
      case "meu-negocio":
        return (
          <BrandKnowledgeBase locationId={activeBrand.location_id || ""} />
        );
      case "marketing":
      case "vendas":
      case "workflows":
        return (
          <BrandDeliverables
            brandId={activeBrand.id}
            section={activeTab}
            primaryColor={activeBrand.primary_color}
          />
        );
      case "sites":
        return (
          <BrandSites
            brandId={activeBrand.id}
            primaryColor={activeBrand.primary_color}
          />
        );
      case "strategy":
        return (
          <BrandStrategyWizard locationId={activeBrand.location_id || ""} />
        );
      case "concepts":
        return <BrandConcepts locationId={activeBrand.location_id || ""} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button (admin mode with selected brand) */}
          {adminSelectedBrand && !brandConfig && (
            <button
              onClick={() => {
                setAdminSelectedBrand(null);
                setActiveTab("overview");
              }}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
              title="Voltar para lista"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {adminSelectedBrand && !brandConfig
                ? "Brand Assets"
                : "Meu Brand"}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Identidade visual de {activeBrand.client_name}
            </p>
          </div>
        </div>
        <DownloadAllButton brand={activeBrand} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border-default">
        {availableTabs.map((tab) => {
          const config = TAB_CONFIG[tab];
          if (!config) return null;
          const Icon = config.icon;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
              }`}
            >
              <Icon size={16} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
};

export default ClientBrand;
