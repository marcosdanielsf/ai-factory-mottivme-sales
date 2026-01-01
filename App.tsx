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
import { CallsRealizadas } from './pages/CallsRealizadas';
import { Configuracoes } from './pages/Configuracoes';

const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* Sales OS */}
          <Route path="/leads" element={<Leads />} />
          
          {/* AI Factory */}
          <Route path="/prompt-studio" element={<PromptEditor />} />
          <Route path="/validacao" element={<Validation />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/team-rpg" element={<TeamRPG />} />
          <Route path="/super-agent" element={<SuperAgentRPG />} />
          
          {/* Monitoring */}
          <Route path="/notificacoes" element={<Notifications />} />
          <Route path="/calls" element={<CallsRealizadas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />

          {/* Legacy/Client Specific */}
          <Route path="/clientes" element={<Navigate to="/" />} />
          <Route path="/clientes/:id" element={<ClientDetail />} />
          <Route path="/clientes/:id/agente" element={<PromptEditor />} />

          <Route path="/aprovacoes" element={<Approvals />} />
          <Route path="*" element={<div className="p-8 text-text-muted">Página em construção...</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
