import React, { useState, createContext, useContext } from 'react';
import { NavItem } from './types';
import { useAuth } from './contexts/AuthContext';
import { useSupabaseData, UIMetric, UICampaign, UILead, UIPipelineCard, UIAccount, UIAgent } from './hooks/useSupabaseData';
import { useMetrics } from './hooks/useMetrics';
import { useAgenticOSStats, AgenticOSStats } from './hooks/useAgenticOSStats';
import { useAgenticOSAccounts, AgenticOSAccount } from './hooks/useAgenticOSAccounts';
import { useSystemHealth, SystemHealth } from './hooks/useSystemHealth';
import { METRICS, RECENT_CAMPAIGNS, MOCK_LEADS, PIPELINE_DATA, MOCK_ACCOUNTS, MOCK_AGENTS } from './constants';

// Auth Components
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// View Components
import { DashboardView } from './components/views/DashboardView';
import { LeadsView } from './components/views/LeadsView';
import { CampaignsView } from './components/views/CampaignsView';
import { PipelineView } from './components/views/PipelineView';
import { InboxView } from './components/views/InboxView';
import { AgentsView } from './components/views/AgentsView';
import { SettingsView } from './components/views/SettingsView';
import { AccountsView } from './components/views/AccountsView';
import {
  LinkedInSearchView,
  InstagramSearchView,
  CNPJSearchView,
  ActiveCadencesView,
  ShowRateGuardView,
  ContentStudioView,
  CadenceBuilderView,
  ICPAnalyzerView,
  AnalyticsView,
  IntegrationsView
} from './components/views/OtherViews';
import { GrowthDashboardView } from './components/views/GrowthDashboardView';
import { NewFollowersView } from './components/views/NewFollowersView';

// Common Components
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Context for Supabase data + AgenticOS
interface DataContextType {
  leads: UILead[];
  campaigns: UICampaign[];
  pipeline: UIPipelineCard[];
  accounts: UIAccount[];
  agents: UIAgent[];
  metrics: UIMetric[];
  loading: boolean;
  error: string | null;
  // AgenticOS integration
  agenticStats: AgenticOSStats | null;
  agenticAccounts: AgenticOSAccount[];
  systemHealth: SystemHealth;
  refetchAgenticData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    // Fallback to mock data if context not available
    return {
      leads: MOCK_LEADS as any,
      campaigns: RECENT_CAMPAIGNS as any,
      pipeline: PIPELINE_DATA as any,
      accounts: MOCK_ACCOUNTS as any,
      agents: MOCK_AGENTS as any,
      metrics: METRICS as any,
      loading: false,
      error: null,
      // AgenticOS fallbacks
      agenticStats: null,
      agenticAccounts: [],
      systemHealth: { status: 'unknown' as const, latency: 0, lastChecked: new Date() },
      refetchAgenticData: () => {},
    };
  }
  return context;
};

// DataProvider component that wraps the authenticated app
const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // Get organization_id from user metadata or use demo org ID
  // Demo org ID matches the seed data
  const DEMO_ORG_ID = '11111111-1111-1111-1111-111111111111';
  const organizationId = user?.user_metadata?.organization_id || DEMO_ORG_ID;

  // Fetch data from Supabase
  const { leads, campaigns, pipeline, accounts, agents, loading, error } = useSupabaseData(organizationId);

  // Calculate metrics from data
  const metrics = useMetrics(leads, campaigns, pipeline);

  // AgenticOS integrations - LAZY LOAD (não bloqueia o carregamento inicial)
  const { stats: agenticStats, refetch: refetchStats } = useAgenticOSStats(false); // autoFetch=false
  const { accounts: agenticAccounts, refetch: refetchAccounts } = useAgenticOSAccounts(false); // autoFetch=false
  const { health: systemHealth } = useSystemHealth(60000, false); // 60s polling, autoStart=false

  // Combined refetch function
  const refetchAgenticData = () => {
    refetchStats();
    refetchAccounts();
  };

  const value: DataContextType = {
    leads,
    campaigns,
    pipeline,
    accounts,
    agents,
    metrics,
    loading,
    error,
    // AgenticOS data
    agenticStats,
    agenticAccounts,
    systemHealth,
    refetchAgenticData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Main authenticated app component
const AuthenticatedApp = () => {
  const [activeView, setActiveView] = useState<NavItem>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DataProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Sidebar
          active={activeView}
          onNavigate={setActiveView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="lg:ml-64 p-4 md:p-6 lg:p-8">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Render active view */}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'growth-dashboard' && <GrowthDashboardView />}
          {activeView === 'leads' && <LeadsView />}
          {activeView === 'campaigns' && <CampaignsView />}
          {activeView === 'pipeline' && <PipelineView />}
          {activeView === 'inbox' && <InboxView />}
          {activeView === 'agents' && <AgentsView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'accounts' && <AccountsView />}

          {/* Other views */}
          {activeView === 'linkedin-search' && <LinkedInSearchView />}
          {activeView === 'instagram-search' && <InstagramSearchView />}
          {activeView === 'cnpj-search' && <CNPJSearchView />}
          {activeView === 'new-followers' && <NewFollowersView />}
          {activeView === 'active-cadences' && <ActiveCadencesView />}
          {activeView === 'show-rate' && <ShowRateGuardView />}
          {activeView === 'content' && <ContentStudioView />}
          {activeView === 'cadence-builder' && <CadenceBuilderView />}
          {activeView === 'icp' && <ICPAnalyzerView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'integrations' && <IntegrationsView />}
        </main>
      </div>
    </DataProvider>
  );
};

// Authentication flow component
const AuthFlow = () => {
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      {authView === 'login' && (
        <LoginPage
          onNavigateToSignup={() => setAuthView('signup')}
          onNavigateToForgotPassword={() => setAuthView('forgot')}
        />
      )}
      {authView === 'signup' && (
        <SignupPage onNavigateToLogin={() => setAuthView('login')} />
      )}
      {authView === 'forgot' && (
        <ForgotPasswordPage onNavigateToLogin={() => setAuthView('login')} />
      )}
    </div>
  );
};

// Main App component
export default function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show auth flow if no user, otherwise show authenticated app
  return user ? <AuthenticatedApp /> : <AuthFlow />;
}
