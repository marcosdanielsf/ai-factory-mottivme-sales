import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Image, Layout, Share2, BookOpen, FileText, Palette, Loader2 } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useBrandConfig } from '../../hooks/useBrandConfig';
import { useBrandAssets } from '../../hooks/useBrandAssets';
import { BrandOverview } from './components/BrandOverview';
import { BrandGallery } from './components/BrandGallery';
import { BrandManual } from './components/BrandManual';
import { BrandDocs } from './components/BrandDocs';
import { BrandColors } from './components/BrandColors';
import { DownloadAllButton } from './components/DownloadAllButton';

const TAB_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  overview: { label: 'Visao Geral', icon: Crown },
  logos: { label: 'Logotipos', icon: Image },
  icons: { label: 'Icones', icon: Layout },
  'social-kit': { label: 'Social Kit', icon: Share2 },
  manual: { label: 'Manual', icon: BookOpen },
  docs: { label: 'Documentos', icon: FileText },
  colors: { label: 'Paleta', icon: Palette },
};

const LOGO_SUB_SECTIONS = ['logos', 'signatures', 'symbols'];
const LOGO_TAB_LABELS: Record<string, string> = {
  logos: 'Logos',
  signatures: 'Assinaturas',
  symbols: 'Simbolos',
};

const ICON_SUB_SECTIONS = ['icons', 'avatars'];
const ICON_TAB_LABELS: Record<string, string> = {
  icons: 'Icones',
  avatars: 'Avatares',
};

const ClientBrand: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id;
  const { brandConfig, loading } = useBrandConfig(locationId);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all assets for counts (overview)
  const { assets: allAssets } = useBrandAssets(brandConfig?.id);

  const assetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of allAssets) {
      counts[a.section] = (counts[a.section] || 0) + 1;
    }
    return counts;
  }, [allAssets]);

  // Redirect if no brand config
  useEffect(() => {
    if (!loading && !brandConfig) {
      navigate('/agendamentos', { replace: true });
    }
  }, [loading, brandConfig, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  if (!brandConfig) return null;

  const availableTabs = ['overview', ...brandConfig.sections.filter((s) => TAB_CONFIG[s])];

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <BrandOverview
            brand={brandConfig}
            assetCounts={assetCounts}
            onTabChange={setActiveTab}
          />
        );
      case 'logos':
        return (
          <BrandGallery
            brandId={brandConfig.id}
            sections={LOGO_SUB_SECTIONS}
            tabLabels={LOGO_TAB_LABELS}
            primaryColor={brandConfig.primary_color}
          />
        );
      case 'icons':
        return (
          <BrandGallery
            brandId={brandConfig.id}
            sections={ICON_SUB_SECTIONS}
            tabLabels={ICON_TAB_LABELS}
            primaryColor={brandConfig.primary_color}
          />
        );
      case 'social-kit':
        return (
          <BrandGallery
            brandId={brandConfig.id}
            sections={['social-kit']}
            tabLabels={{ 'social-kit': 'Social Kit' }}
            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            primaryColor={brandConfig.primary_color}
          />
        );
      case 'manual':
        return <BrandManual brandId={brandConfig.id} />;
      case 'docs':
        return <BrandDocs brandId={brandConfig.id} />;
      case 'colors':
        return <BrandColors colors={brandConfig.colors} primaryColor={brandConfig.primary_color} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Meu Brand</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Identidade visual de {brandConfig.client_name}
          </p>
        </div>
        <DownloadAllButton brand={brandConfig} />
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
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
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
