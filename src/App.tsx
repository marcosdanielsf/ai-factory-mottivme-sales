import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ClientDetail } from './pages/ClientDetail';
import { PromptEditor } from './pages/PromptEditor';
import { Approvals } from './pages/Approvals';
import { Leads } from './pages/Leads';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { TeamRPG } from './pages/TeamRPG';
import { SuperAgentRPG } from './pages/SuperAgentRPG';
import { Notifications } from './pages/Notifications';
import { Validation } from './pages/Validation';
import { Logs } from './pages/Logs';
import { FollowUps } from './pages/FollowUps';
import { CallsRealizadas } from './pages/CallsRealizadas';
import { Configuracoes } from './pages/Configuracoes';
import { AgentDetail } from './pages/AgentDetail';
import { ReflectionLoop } from './pages/ReflectionLoop';
import { Evolution } from './pages/Evolution';
import OnboardingWizard from './pages/OnboardingWizard';
import { ClientCosts } from './pages/ClientCosts';
import { Performance } from './pages/Performance';
import { Supervision } from './pages/Supervision';
import { SalesOps } from './pages/SalesOps';
import { Agendamentos } from './pages/Agendamentos';
import { Login } from './pages/Login';
import { ClientPortal } from './pages/ClientPortal';
import { StatusCenter } from './pages/StatusCenter';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/welcome" element={<OnboardingWizard skipIntro />} />

            {/* Portal do Cliente - View simplificada de resultados */}
            <Route path="/portal" element={
              <ProtectedRoute>
                <ClientPortal />
              </ProtectedRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Sales OS */}
            <Route path="/leads" element={
              <ProtectedRoute>
                <Layout>
                  <Leads />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/sales-ops" element={
              <ProtectedRoute>
                <Layout>
                  <SalesOps />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/agendamentos" element={
              <ProtectedRoute>
                <Layout>
                  <Agendamentos />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/status" element={
              <ProtectedRoute>
                <Layout>
                  <StatusCenter />
                </Layout>
              </ProtectedRoute>
            } />

            {/* AI Factory */}
            <Route path="/prompt-studio" element={
              <ProtectedRoute>
                <Layout>
                  <PromptEditor />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/agents/:id" element={
              <ProtectedRoute>
                <Layout>
                  <AgentDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/validacao" element={
              <ProtectedRoute>
                <Layout>
                  <Validation />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reflection-loop" element={
              <ProtectedRoute>
                <Layout>
                  <ReflectionLoop />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/evolution" element={
              <ProtectedRoute>
                <Layout>
                  <Evolution />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute>
                <Layout>
                  <Logs />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/follow-ups" element={
              <ProtectedRoute>
                <Layout>
                  <FollowUps />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/knowledge-base" element={
              <ProtectedRoute>
                <Layout>
                  <KnowledgeBase />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/team-rpg" element={
              <ProtectedRoute>
                <Layout>
                  <TeamRPG />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/super-agent" element={
              <ProtectedRoute>
                <Layout>
                  <SuperAgentRPG />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Monitoring */}
            <Route path="/notificacoes" element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/calls" element={
              <ProtectedRoute>
                <Layout>
                  <CallsRealizadas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/custos" element={
              <ProtectedRoute>
                <Layout>
                  <ClientCosts />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/performance" element={
              <ProtectedRoute>
                <Layout>
                  <Performance />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/supervision" element={
              <ProtectedRoute>
                <Layout>
                  <Supervision />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Layout>
                  <Configuracoes />
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
                  <ClientDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clientes/:id/agente" element={
              <ProtectedRoute>
                <Layout>
                  <PromptEditor />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/aprovacoes" element={
              <ProtectedRoute>
                <Layout>
                  <Approvals />
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
    </AuthProvider>
  );
};

export default App;
