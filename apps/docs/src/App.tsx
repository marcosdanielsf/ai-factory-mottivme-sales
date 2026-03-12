import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ClientDetail } from "./pages/ClientDetail";
import { PromptEditor } from "./pages/PromptEditor";
import { Approvals } from "./pages/Approvals";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { TeamRPG } from "./pages/TeamRPG";
import { SuperAgentRPG } from "./pages/SuperAgentRPG";
import { Validation } from "./pages/Validation";
import { Configuracoes } from "./pages/Configuracoes";
import { AgentDetail } from "./pages/AgentDetail";
import { ReflectionLoop } from "./pages/ReflectionLoop";
import { Evolution } from "./pages/Evolution";
import OnboardingWizard from "./pages/OnboardingWizard";
import { ClientCosts } from "./pages/ClientCosts";
import { Performance } from "./pages/Performance";
import { Supervision } from "./pages/Supervision";
import { SalesOps } from "./pages/SalesOps";
import { Agendamentos } from "./pages/Agendamentos";
import { Login } from "./pages/Login";
import { ToastProvider } from "./hooks/useToast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// MindFlow - lazy loaded
const MindflowHome = React.lazy(() => import("./pages/mindflow/index"));
const BoardPage = React.lazy(() => import("./pages/mindflow/BoardPage"));

// Customer Journey Map - lazy loaded
const CustomerJourney = React.lazy(() => import("./pages/CustomerJourney"));

// Share Dashboard (link publico cliente-facing, sem login)
const ShareDashboard = React.lazy(() =>
  import("./pages/ShareDashboard").then((m) => ({ default: m.ShareDashboard })),
);

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
            <Route
              path="/share/:token"
              element={
                <React.Suspense
                  fallback={
                    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                      <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
                    </div>
                  }
                >
                  <ShareDashboard />
                </React.Suspense>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Sales OS */}
            <Route
              path="/sales-ops"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalesOps />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agendamentos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Agendamentos />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Customer Journey Map */}
            <Route
              path="/customer-journey"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense
                      fallback={
                        <div className="p-8 text-text-muted">Carregando...</div>
                      }
                    >
                      <CustomerJourney />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* AI Factory */}
            <Route
              path="/prompt-studio"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PromptEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AgentDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/validacao"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Validation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reflection-loop"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReflectionLoop />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evolution"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Evolution />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <ProtectedRoute>
                  <Layout>
                    <KnowledgeBase />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-rpg"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamRPG />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-agent"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SuperAgentRPG />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Monitoring */}
            <Route
              path="/custos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientCosts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Performance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/supervision"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Supervision />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Configuracoes />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Legacy/Client Specific */}
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Navigate to="/" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes/:id/agente"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PromptEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/aprovacoes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Approvals />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* MindFlow */}
            <Route
              path="/mindflow"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense
                      fallback={
                        <div className="p-8 text-text-muted">Loading...</div>
                      }
                    >
                      <MindflowHome />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mindflow/:boardId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <React.Suspense
                      fallback={
                        <div className="p-8 text-text-muted">Loading...</div>
                      }
                    >
                      <BoardPage />
                    </React.Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="p-8 text-text-muted">
                      Página em construção...
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
