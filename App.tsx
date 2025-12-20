import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ClientDetail } from './pages/ClientDetail';
import { PromptEditor } from './pages/PromptEditor';
import { Approvals } from './pages/Approvals';
import { Leads } from './pages/Leads';
import { KnowledgeBase } from './pages/KnowledgeBase';

const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          
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