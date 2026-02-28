import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './contexts/AuthContext';
import { AccountProvider } from './contexts/AccountContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LayoutCliente } from './components/LayoutCliente';
import { ConditionalLayout } from './components/ConditionalLayout';
import { JarvisProvider, JarvisPanel } from './components/Jarvis';
import { ThemeProvider } from './contexts/ThemeContext';

// Suspense fallback component
const LoadingFallback = () => (
  <div className="p-8 text-text-muted">Carregando...</div>
);

// All pages lazy loaded (except Login which needs to be eager)
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ClientDetail = lazy(() => import('./pages/ClientDetail').then(m => ({ default: m.ClientDetail })));
const PromptEditor = lazy(() => import('./pages/PromptEditor').then(m => ({ default: m.PromptEditor })));
const Approvals = lazy(() => import('./pages/Approvals').then(m => ({ default: m.Approvals })));
const Leads = lazy(() => import('./pages/Leads').then(m => ({ default: m.Leads })));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const TeamRPG = lazy(() => import('./pages/TeamRPG').then(m => ({ default: m.TeamRPG })));
const SuperAgentRPG = lazy(() => import('./pages/SuperAgentRPG').then(m => ({ default: m.SuperAgentRPG })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Validation = lazy(() => import('./pages/Validation').then(m => ({ default: m.Validation })));
const Logs = lazy(() => import('./pages/Logs').then(m => ({ default: m.Logs })));
const FollowUps = lazy(() => import('./pages/FollowUps').then(m => ({ default: m.FollowUps })));
const CallsRealizadas = lazy(() => import('./pages/CallsRealizadas').then(m => ({ default: m.CallsRealizadas })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then(m => ({ default: m.Configuracoes })));
const AgentDetail = lazy(() => import('./pages/AgentDetail').then(m => ({ default: m.AgentDetail })));
const ReflectionLoop = lazy(() => import('./pages/ReflectionLoop').then(m => ({ default: m.ReflectionLoop })));
const Evolution = lazy(() => import('./pages/Evolution').then(m => ({ default: m.Evolution })));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const ClientCosts = lazy(() => import('./pages/ClientCosts').then(m => ({ default: m.ClientCosts })));
const Performance = lazy(() => import('./pages/Performance').then(m => ({ default: m.Performance })));
const Supervision = lazy(() => import('./pages/Supervision').then(m => ({ default: m.Supervision })));
const SalesOps = lazy(() => import('./pages/SalesOps').then(m => ({ default: m.SalesOps })));
const Agendamentos = lazy(() => import('./pages/Agendamentos').then(m => ({ default: m.Agendamentos })));
const ClientPortal = lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const StatusCenter = lazy(() => import('./pages/StatusCenter').then(m => ({ default: m.StatusCenter })));
const Invite = lazy(() => import('./pages/Invite').then(m => ({ default: m.Invite })));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// Cold Call pages (lazy loaded)
const ColdCallDashboard = lazy(() => import('./pages/ColdCallDashboard'));
const ColdCallCampaigns = lazy(() => import('./pages/ColdCallCampaigns'));
const ColdCallPrompts = lazy(() => import('./pages/ColdCallPrompts'));
const ColdCallNewCall = lazy(() => import('./pages/ColdCallNewCall'));

// Prospector pages (lazy loaded)
const ProspectorDashboard = lazy(() => import('./pages/ProspectorDashboard'));
const ProspectorQueue = lazy(() => import('./pages/GrowthLeads').then(m => ({ default: m.GrowthLeads })));
const ProspectorTemplates = lazy(() => import('./pages/ProspectorTemplates'));
const ProspectorAnalytics = lazy(() => import('./pages/ProspectorAnalytics'));
const ProspectorCampaignDetail = lazy(() => import('./pages/ProspectorCampaignDetail'));

// Prospector - LinkedIn Inbox & AI
const ProspectorInbox = lazy(() => import('./pages/ProspectorInbox'));
const ProspectorAI = lazy(() => import('./pages/ProspectorAI'));
const ProspectorAccounts = lazy(() => import('./pages/ProspectorAccounts'));

// Video Producer pages (lazy loaded)
const VideoProducerDashboard = lazy(() => import('./pages/VideoProducerDashboard'));
const VideoProducerNew = lazy(() => import('./pages/VideoProducerNew'));
const VideoProducerDetail = lazy(() => import('./pages/VideoProducerDetail'));

// Social Selling Dashboard
const SocialSellingDashboard = lazy(() => import('./pages/SocialSellingDashboard'));

// Ads Performance Dashboard
const AdsPerformance = lazy(() => import('./pages/AdsPerformance').then(m => ({ default: m.AdsPerformance })));

// Metrics Lab
const MetricsLab = lazy(() => import('./pages/MetricsLab').then(m => ({ default: m.MetricsLab })));

// CRM Insights
const CrmInsights = lazy(() => import('./pages/CrmInsights').then(m => ({ default: m.CrmInsights })));


// AIOS Dashboard pages (lazy loaded)
const AiosAgentsPage = lazy(() => import('./pages/AiosAgents').then(m => ({ default: m.AiosAgents })));
const AiosAgentDetailPage = lazy(() => import('./pages/AiosAgents/AgentDetail').then(m => ({ default: m.AiosAgentDetail })));
const AiosStoriesPage = lazy(() => import('./pages/AiosStories').then(m => ({ default: m.AiosStories })));
const AiosStoryDetailPage = lazy(() => import('./pages/AiosStories/StoryDetail').then(m => ({ default: m.AiosStoryDetail })));
const AiosCostsPage = lazy(() => import('./pages/AiosCosts').then(m => ({ default: m.AiosCosts })));
const AiosSquadsPage = lazy(() => import('./pages/AiosSquads').then(m => ({ default: m.AiosSquads })));
const AiosSquadDetailPage = lazy(() => import('./pages/AiosSquads/SquadDetail').then(m => ({ default: m.AiosSquadDetail })));
const AiosTasksPage = lazy(() => import('./pages/AiosTasks').then(m => ({ default: m.AiosTasks })));
const AiosExpertsPage = lazy(() => import('./pages/AiosExperts').then(m => ({ default: m.AiosExperts })));
const AiosExpertDetailPage = lazy(() => import('./pages/AiosExperts/ExpertDetail').then(m => ({ default: m.ExpertDetail })));
const AiosSynapsePage = lazy(() => import('./pages/AiosSynapse').then(m => ({ default: m.AiosSynapse })));
const AiosArenaPage = lazy(() => import('./pages/AiosArena').then(m => ({ default: m.AiosArena })));

// Content Studio
const ContentStudio = lazy(() => import('./pages/ContentStudio').then(m => ({ default: m.ContentStudio })));

// Content Pipeline (Ideas + Videos)
const ContentPipeline = lazy(() => import('./pages/ContentPipeline').then(m => ({ default: m.ContentPipeline })));

// Agent Tools Registry
const AgentTools = lazy(() => import('./pages/AgentTools').then(m => ({ default: m.AgentTools })));

// Catálogo de Produtos
const Products = lazy(() => import('./pages/Products'));

// Agent Audit
const AgentAuditPage = lazy(() => import('./pages/AgentAudit').then(m => ({ default: m.AgentAudit })));
const AgentAuditDetailPage = lazy(() => import('./pages/AgentAudit/AgentAuditDetail').then(m => ({ default: m.AgentAuditDetail })));

// Client Brand
const ClientBrand = lazy(() => import('./pages/ClientBrand'));

// Planejamento de Vendas
const Planejamento = lazy(() => import('./pages/Planejamento'));

// Planejamento Publico (link unico para clientes)
const PlanejamentoPublico = lazy(() => import('./pages/PlanejamentoPublico'));

// JARVIS Command Center + sub-pages
const JarvisCommand = lazy(() => import('./pages/JarvisCommand'));
const JarvisMemory = lazy(() => import('./pages/JarvisMemory'));
const JarvisProjects = lazy(() => import('./pages/JarvisProjects'));
const JarvisProjectDetail = lazy(() => import('./pages/JarvisProjects/JarvisProjectDetail'));
const JarvisConfig = lazy(() => import('./pages/JarvisConfig'));

// Projetos (Kanban + Project Board)
const Projetos = lazy(() => import('./pages/Projetos'));

// Hub Operacional (Workflows por setor)
const Workflows = lazy(() => import('./pages/Workflows'));

// Auditoria n8n
const N8nAudit = lazy(() => import('./pages/N8nAudit').then(m => ({ default: m.N8nAudit })));

// Attendants (cadastro de atendentes humanos para handoff)
const AttendantsPage = lazy(() => import('./pages/Attendants').then(m => ({ default: m.Attendants })));

// Squad AI (Pipeline de agentes com execucoes n8n)
const SquadAI = lazy(() => import('./pages/SquadAI'));

// System v4.0 Dashboard
const SystemV4 = lazy(() => import('./pages/SystemV4'));

// Clone do Marcos (coleta de mensagens + personalidade)
const CloneDashboard = lazy(() => import('./pages/CloneDashboard'));

// WhatsApp Manager (instancias, QR, conexao)
const WhatsAppManager = lazy(() => import('./pages/WhatsAppManager'));

// GHL Direct Pages
const GHLPipeline = lazy(() => import('./pages/ghl/GHLPipeline'));
const GHLAgenda = lazy(() => import('./pages/ghl/GHLAgenda'));
const GHLLeads = lazy(() => import('./pages/ghl/GHLLeads'));

// Lead Gen Portal
const LinkedinPostScraper = lazy(() => import('./pages/LeadGen/LinkedinPostScraper'));
const LinkedinSearch = lazy(() => import('./pages/LeadGen/LinkedinSearch'));
const ApolloScraper = lazy(() => import('./pages/LeadGen/ApolloScraper'));
const GMapsScraper = lazy(() => import('./pages/LeadGen/GMapsScraper'));
const LeadsListPeople = lazy(() => import('./pages/LeadGen/LeadsListPeople'));
const LeadsListCompany = lazy(() => import('./pages/LeadGen/LeadsListCompany'));

const App = () => {
  return (
    <JarvisProvider>
      <AuthProvider>
        <AccountProvider>
          <ThemeProvider>
            <ToastProvider>
            <HashRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={
                <Suspense fallback={<LoadingFallback />}>
                  <OnboardingWizard />
                </Suspense>
              } />
              <Route path="/welcome" element={
                <Suspense fallback={<LoadingFallback />}>
                  <OnboardingWizard skipIntro />
                </Suspense>
              } />
              <Route path="/invite/:token" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Invite />
                </Suspense>
              } />
              <Route path="/p/:token" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PlanejamentoPublico />
                </Suspense>
              } />

              {/* Portal do Cliente - View simplificada de resultados */}
              <Route path="/portal" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ClientPortal />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Protected Routes - Conditional Layout (Admin vs Client) */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              {/* Sales OS - Uses ConditionalLayout (accessible by clients) */}
              <Route path="/leads" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Leads />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/sales-ops" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <SalesOps />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/agendamentos" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Agendamentos />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/status" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <StatusCenter />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/social-selling" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <SocialSellingDashboard />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/ads-performance" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AdsPerformance />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/metrics-lab" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <MetricsLab />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/crm-insights" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <CrmInsights />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              {/* Growth Leads agora vive em /prospector/queue */}
              <Route path="/planejamento" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Planejamento />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/brand" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ClientBrand />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              {/* AI Factory */}
              <Route path="/prompt-studio" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <PromptEditor />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/agents/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AgentDetail />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/validacao" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Validation />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reflection-loop" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ReflectionLoop />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/evolution" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Evolution />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Logs />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/follow-ups" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <FollowUps />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/knowledge-base" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <KnowledgeBase />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/team-rpg" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <TeamRPG />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/super-agent" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <SuperAgentRPG />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Monitoring */}
              <Route path="/notificacoes" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Notifications />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              {/* Cold Calls */}
              <Route path="/cold-calls" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ColdCallDashboard />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/cold-calls/campaigns" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ColdCallCampaigns />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/cold-calls/new" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ColdCallNewCall />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/cold-calls/prompts" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ColdCallPrompts />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              {/* Prospector */}
              <Route path="/prospector" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorDashboard />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/queue" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorQueue />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/templates" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorTemplates />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/analytics" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorAnalytics />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/campaign/:id" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorCampaignDetail />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/inbox" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorInbox />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/ai" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorAI />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/prospector/accounts" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ProspectorAccounts />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              {/* Video Producer */}
              <Route path="/video-producer" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <VideoProducerDashboard />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/video-producer/new" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <VideoProducerNew />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/video-producer/:id" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <VideoProducerDetail />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              <Route path="/calls" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <CallsRealizadas />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/custos" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ClientCosts />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/performance" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Performance />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/supervision" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Supervision />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/atendentes" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AttendantsPage />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Configuracoes />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/usuarios" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <UserManagement />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Legacy/Client Specific */}
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <Navigate to="/" />
                </ProtectedRoute>
              } />
              <Route path="/clientes/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ClientDetail />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/clientes/:id/agente" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <PromptEditor />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/aprovacoes" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Approvals />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              {/* AIOS Dashboard */}
              <Route path="/aios/agents" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosAgentsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/agents/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosAgentDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/stories" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosStoriesPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/stories/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosStoryDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/costs" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosCostsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/squads" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosSquadsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/squads/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosSquadDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/tasks" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosTasksPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/experts" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosExpertsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/experts/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosExpertDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/synapse" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosSynapsePage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/aios/arena" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AiosArenaPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Content Studio */}
              <Route path="/content-studio" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ContentStudio />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Content Pipeline (Ideas + Videos) */}
              <Route path="/content-pipeline" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ContentPipeline />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Agent Tools Registry */}
              <Route path="/agent-tools" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AgentTools />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Catálogo de Produtos */}
              <Route path="/produtos" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Products />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Agent Audit */}
              <Route path="/agent-audit" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AgentAuditPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/agent-audit/:agentVersionId" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <AgentAuditDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Lead Gen Portal */}
              <Route path="/leadgen/linkedin-posts" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <LinkedinPostScraper />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leadgen/linkedin-search" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <LinkedinSearch />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leadgen/apollo" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <ApolloScraper />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leadgen/gmaps" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <GMapsScraper />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leadgen/leads-people" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <LeadsListPeople />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/leadgen/leads-company" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <LeadsListCompany />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* GHL Direct Dashboard */}
              <Route path="/ghl/pipeline" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <GHLPipeline />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/ghl/agenda" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <GHLAgenda />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/ghl/leads" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <GHLLeads />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              {/* Projetos Board */}
              <Route path="/projetos" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Projetos />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/workflows" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Workflows />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />
              <Route path="/n8n-audit" element={
                <ProtectedRoute>
                  <ConditionalLayout>
                    <Suspense fallback={<LoadingFallback />}>
                      <N8nAudit />
                    </Suspense>
                  </ConditionalLayout>
                </ProtectedRoute>
              } />

              {/* Squad AI */}
              <Route path="/squad-ai" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <SquadAI />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* System v4.0 Dashboard */}
              <Route path="/system-v4" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <SystemV4 />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              {/* JARVIS Command Center */}
              <Route path="/jarvis" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <JarvisCommand />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/jarvis/memory" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <JarvisMemory />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jarvis/projects" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <JarvisProjects />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jarvis/projects/:slug" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <JarvisProjectDetail />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jarvis/config" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <JarvisConfig />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jarvis/clone" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <CloneDashboard />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/jarvis/whatsapp" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <WhatsAppManager />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="*" element={
                <ProtectedRoute>
                  <Layout>
                    <div className="p-8 text-text-muted">Página em construção...</div>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
            </HashRouter>
            <JarvisPanel />
            </ToastProvider>
          </ThemeProvider>
        </AccountProvider>
      </AuthProvider>
    </JarvisProvider>
  );
};

export default App;
