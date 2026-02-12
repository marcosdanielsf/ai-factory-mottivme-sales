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
const ProspectorQueue = lazy(() => import('./pages/ProspectorQueue'));
const ProspectorTemplates = lazy(() => import('./pages/ProspectorTemplates'));
const ProspectorAnalytics = lazy(() => import('./pages/ProspectorAnalytics'));
const ProspectorCampaignDetail = lazy(() => import('./pages/ProspectorCampaignDetail'));

// Video Producer pages (lazy loaded)
const VideoProducerDashboard = lazy(() => import('./pages/VideoProducerDashboard'));
const VideoProducerNew = lazy(() => import('./pages/VideoProducerNew'));
const VideoProducerDetail = lazy(() => import('./pages/VideoProducerDetail'));

const App = () => {
  return (
    <AuthProvider>
      <AccountProvider>
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
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-text-muted">Página em construção...</div>
                </Layout>
              </ProtectedRoute>
            } />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </AccountProvider>
    </AuthProvider>
  );
};

export default App;
