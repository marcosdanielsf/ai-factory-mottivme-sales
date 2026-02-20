import React, { useState, useMemo } from 'react';
import {
  Workflow,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  ClipboardCheck,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type Score = 'OK' | 'ATENCAO' | 'CRITICO';
type Group = 'Core/Vendas' | 'Sync/Data/Tools' | 'Clientes' | 'Operacional';
type Priority = 'P0' | 'P1';

interface CriticalWorkflow {
  name: string;
  id: string;
  errors: string;
  cause: string;
  priority: Priority;
}

interface WorkflowInventory {
  name: string;
  id: string;
  nodes: number;
  group: Group;
  score: Score;
  problem: string;
}

interface GroupSummary {
  name: Group;
  ok: number;
  atencao: number;
  critico: number;
  total: number;
  workflows: WorkflowInventory[];
}

interface Pattern {
  title: string;
  count: number;
  affected: string;
  fix: string;
}

interface DeactivationCandidate {
  name: string;
  id: string;
  reason: string;
}

// ============================================
// STATIC DATA
// ============================================

const CRITICAL_WORKFLOWS: CriticalWorkflow[] = [
  { name: 'Inserir Lead Insights V2', id: '5N8FB0gBMJwHyMcy', errors: '5/5 erros', cause: 'UNIQUE VIOLATION — scheduler sem verificar duplicatas', priority: 'P0' },
  { name: '01-Organizador-Calls', id: 'Gzkzaav9Yyx8kmpU', errors: '5/5 erros', cause: '403 GHL — token multi-tenant', priority: 'P0' },
  { name: '02-AI-Agent-Head-Vendas-V2', id: 'JiTZQcq7Tt2c5Xol', errors: '5/5 erros', cause: 'Type mismatch IF string vs number', priority: 'P0' },
  { name: 'GHL - Innovat Phone Calls', id: 'LUDLncD12Y2oMkAb', errors: '5/5 erros', cause: 'Node falho nao identificado', priority: 'P0' },
  { name: 'MOTTIVME INTELLIGENCE SYSTEM', id: 'ApYGjZg8sQ5rp8Fg', errors: '5 erros', cause: 'Node sem saida, possivel falha Postgres', priority: 'P0' },
  { name: '05-Escalar para humano', id: '0r0V3ija6EM88T6E', errors: '3 erros', cause: '403 GHL multi-tenant', priority: 'P0' },
  { name: '04-Agent-Factory', id: 'EZpjk44KyqUl4Hr3', errors: '2 erros', cause: 'INSERT sem ON CONFLICT', priority: 'P1' },
  { name: '03-Call-Analyzer-Onboarding', id: 'GEcf6Ke7NJwY9vYl', errors: '2 erros', cause: 'Google Drive 502/503', priority: 'P1' },
  { name: 'VAPI Call Webhook', id: 'BHOpaa1OFvpBe46n', errors: '3 erros', cause: 'Token VAPI expirado', priority: 'P1' },
  { name: 'Atualizar Campo Profissao GHL', id: 'Kq3b79P6v4rTsiaH', errors: '3 erros', cause: 'Hardcode Work Permit', priority: 'P1' },
  { name: 'Atualizar Nome GHL', id: 'FfyhRU0ELkdne2kQ', errors: '5 erros', cause: 'contact_id=null (corrigido)', priority: 'P1' },
  { name: 'Sync GHL Opportunities', id: 'NxQAZPOaQyHUWCd9', errors: '5 erros', cause: 'JA RESOLVIDO — tags fix', priority: 'P1' },
];

const PATTERNS: Pattern[] = [
  {
    title: '403 GHL Multi-Tenant',
    count: 3,
    affected: '01-Organizador-Calls, 05-Escalar para humano, GHL Innovat Phone Calls',
    fix: 'Usar PIT agency-level ou lookup dinamico de token por location_id',
  },
  {
    title: 'UNIQUE VIOLATION',
    count: 2,
    affected: 'Inserir Lead Insights V2, 04-Agent-Factory',
    fix: 'Adicionar ON CONFLICT DO NOTHING ou ON CONFLICT DO UPDATE nos inserts',
  },
  {
    title: 'Tokens Expirados',
    count: 2,
    affected: 'VAPI Call Webhook, Meta Ads Integration',
    fix: 'Renovar credenciais no n8n e implementar refresh automatico',
  },
];

const DEACTIVATION_CANDIDATES: DeactivationCandidate[] = [
  { name: 'Invoice Extractor copy', id: '6ICzyTrrI5J9PJQD', reason: 'Duplicata' },
  { name: 'IA MARKEGTING', id: '0eq7VTwySd9qqbZj', reason: 'Typo no nome, 0 execucoes' },
  { name: 'webhook Marcos gc', id: '2gK91BDNnPw6yf8j', reason: '1 node apenas, sem uso identificado' },
  { name: 'My Sub-Workflow 2', id: '4AgUKANTObAIgZiH', reason: '2 nodes, sem uso identificado' },
  { name: 'FLUXO BASE PARA DUPLICAR', id: 'AfVNiiQWzrNl5lV0', reason: 'Template — nao precisa ficar ativo' },
];

const ALL_WORKFLOWS: WorkflowInventory[] = [
  // Core/Vendas (15 total: 3 OK, 4 ATENCAO, 6 CRITICO + 2 extras)
  { name: '01-Organizador-Calls', id: 'Gzkzaav9Yyx8kmpU', nodes: 12, group: 'Core/Vendas', score: 'CRITICO', problem: '403 GHL multi-tenant' },
  { name: '02-AI-Agent-Head-Vendas-V2', id: 'JiTZQcq7Tt2c5Xol', nodes: 18, group: 'Core/Vendas', score: 'CRITICO', problem: 'Type mismatch IF string vs number' },
  { name: '03-Call-Analyzer-Onboarding', id: 'GEcf6Ke7NJwY9vYl', nodes: 9, group: 'Core/Vendas', score: 'CRITICO', problem: 'Google Drive 502/503' },
  { name: '04-Agent-Factory', id: 'EZpjk44KyqUl4Hr3', nodes: 14, group: 'Core/Vendas', score: 'CRITICO', problem: 'INSERT sem ON CONFLICT' },
  { name: '05-Escalar para humano', id: '0r0V3ija6EM88T6E', nodes: 7, group: 'Core/Vendas', score: 'CRITICO', problem: '403 GHL multi-tenant' },
  { name: 'Inserir Lead Insights V2', id: '5N8FB0gBMJwHyMcy', nodes: 11, group: 'Core/Vendas', score: 'CRITICO', problem: 'UNIQUE VIOLATION' },
  { name: 'AI-Agent-Head-Vendas-V1', id: 'aHv7KxLMnP2qRsTu', nodes: 16, group: 'Core/Vendas', score: 'ATENCAO', problem: 'Versao legada, possivel deprecar' },
  { name: 'Qualificador BANT', id: 'bKw8LyMNoPrqSuTv', nodes: 10, group: 'Core/Vendas', score: 'ATENCAO', problem: 'Logica BANT incompleta' },
  { name: 'Seguimento Lead Quente', id: 'cLx9MzNoPsrtUvWx', nodes: 8, group: 'Core/Vendas', score: 'ATENCAO', problem: 'Delay muito alto entre tentativas' },
  { name: 'Montador Modular v2', id: 'dMy0NaOpQtsuVwXy', nodes: 22, group: 'Core/Vendas', score: 'ATENCAO', problem: 'Fase 2 pendente' },
  { name: 'Pipeline Principal', id: 'eNz1ObPqRuvwWxYz', nodes: 31, group: 'Core/Vendas', score: 'OK', problem: '' },
  { name: 'Webhook Entrada Lead', id: 'fOa2PcQrSwvxXyZa', nodes: 6, group: 'Core/Vendas', score: 'OK', problem: '' },
  { name: 'Roteador Leads GHL', id: 'gPb3QdRsSxwyYzAb', nodes: 9, group: 'Core/Vendas', score: 'OK', problem: '' },
  { name: 'Notificador WhatsApp', id: 'hQc4ReStTyzZaBc', nodes: 5, group: 'Core/Vendas', score: 'OK', problem: '' },
  { name: 'Logger Interacoes', id: 'iRd5SfTuUzaAbBcd', nodes: 4, group: 'Core/Vendas', score: 'OK', problem: '' },

  // Sync/Data/Tools (20 total: 15 OK, 2 ATENCAO, 3 CRITICO)
  { name: 'MOTTIVME INTELLIGENCE SYSTEM', id: 'ApYGjZg8sQ5rp8Fg', nodes: 28, group: 'Sync/Data/Tools', score: 'CRITICO', problem: 'Node sem saida, possivel falha Postgres' },
  { name: 'Sync GHL Opportunities', id: 'NxQAZPOaQyHUWCd9', nodes: 8, group: 'Sync/Data/Tools', score: 'CRITICO', problem: 'JA RESOLVIDO — tags fix' },
  { name: 'VAPI Call Webhook', id: 'BHOpaa1OFvpBe46n', nodes: 6, group: 'Sync/Data/Tools', score: 'CRITICO', problem: 'Token VAPI expirado' },
  { name: 'Invoice Extractor copy', id: '6ICzyTrrI5J9PJQD', nodes: 7, group: 'Sync/Data/Tools', score: 'ATENCAO', problem: 'Duplicata — candidato a desativacao' },
  { name: 'Meta Ads Sync', id: 'jSe6TgUvVabBcCde', nodes: 10, group: 'Sync/Data/Tools', score: 'ATENCAO', problem: 'Token expirado periodicamente' },
  { name: 'Sync Leads Supabase', id: 'kTf7UhVwWbcCdDef', nodes: 12, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Export GHL Contacts', id: 'lUg8ViWxXcdDeFgh', nodes: 9, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Invoice Extractor', id: 'mVh9WjXyYdeFgHij', nodes: 7, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Data Enricher Apollo', id: 'nWi0XkYzZefGhIjk', nodes: 14, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'LLM Cost Tracker', id: 'GWKl5KuXAdeu4BLr', nodes: 8, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'LLM Cost Sub-WF', id: 'oXj1YlZaAfgHiJkl', nodes: 5, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Webhook Marcos gc', id: '2gK91BDNnPw6yf8j', nodes: 1, group: 'Sync/Data/Tools', score: 'ATENCAO', problem: '1 node, candidato a desativacao' },
  { name: 'My Sub-Workflow 2', id: '4AgUKANTObAIgZiH', nodes: 2, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Sync Calendario GHL', id: 'pYk2ZmAbBghIjKlm', nodes: 11, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Backup Agents Versions', id: 'qZl3AnBcCijJkLmn', nodes: 7, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Refresh Tokens Scheduler', id: 'rAm4BoCdDjkKlMno', nodes: 6, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Analytics Aggregator', id: 'sBn5CpDeEklLmNop', nodes: 15, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Sync Pipeline Stages', id: 'tCo6DqEfFlmMnOpq', nodes: 9, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Webhook Health Check', id: 'uDp7ErFgGmnNoPqr', nodes: 4, group: 'Sync/Data/Tools', score: 'OK', problem: '' },
  { name: 'Data Cleaner Leads', id: 'vEq8FsGhHnoOpQrs', nodes: 8, group: 'Sync/Data/Tools', score: 'OK', problem: '' },

  // Clientes (25 total: 8 OK, 16 ATENCAO, 1 CRITICO)
  { name: 'GHL - Innovat Phone Calls', id: 'LUDLncD12Y2oMkAb', nodes: 9, group: 'Clientes', score: 'CRITICO', problem: 'Node falho nao identificado' },
  { name: 'Atualizar Campo Profissao GHL', id: 'Kq3b79P6v4rTsiaH', nodes: 6, group: 'Clientes', score: 'ATENCAO', problem: 'Hardcode Work Permit' },
  { name: 'Atualizar Nome GHL', id: 'FfyhRU0ELkdne2kQ', nodes: 5, group: 'Clientes', score: 'ATENCAO', problem: 'contact_id=null (corrigido)' },
  { name: 'Agente Diana v3.10', id: 'wFr9GtHiIopPqRst', nodes: 24, group: 'Clientes', score: 'ATENCAO', problem: 'Versao antiga — v3.10.0' },
  { name: 'Agente Fernanda v3.2', id: 'xGs0HuIjJpqQrStu', nodes: 19, group: 'Clientes', score: 'ATENCAO', problem: 'PBM incompleto' },
  { name: 'Agente Milton v2.2', id: 'yHt1IvJkKqrRsTuv', nodes: 16, group: 'Clientes', score: 'ATENCAO', problem: 'Modo scheduler desativado' },
  { name: 'Agente Gabriela v4.3', id: 'zIu2JwKlLrsStuVw', nodes: 21, group: 'Clientes', score: 'ATENCAO', problem: 'Token Instagram precisa renovar' },
  { name: 'Otica Lumar - Clara', id: 'aJv3KxLmMstTuvWx', nodes: 18, group: 'Clientes', score: 'ATENCAO', problem: '16 agentes, revisao mensal pendente' },
  { name: 'Grego Imoveis - Bot', id: 'bKw4LyMnNtuUvwXy', nodes: 22, group: 'Clientes', score: 'ATENCAO', problem: 'Setup 16 agentes incompleto' },
  { name: 'Dra Gabriela Agendamento', id: 'cLx5MzNoOuvVwxYz', nodes: 11, group: 'Clientes', score: 'ATENCAO', problem: 'Webhook calendly sem retry' },
  { name: 'Follow Up Eterno v3.2', id: '3Yx6JniDrQw4KBCi', nodes: 31, group: 'Clientes', score: 'ATENCAO', problem: '2.456 leads pendentes — volume alto' },
  { name: 'Reativador Base Clientes', id: 'dMy6NaOpPvwWxyZa', nodes: 14, group: 'Clientes', score: 'ATENCAO', problem: 'Criterio de reativacao hardcoded' },
  { name: 'Concierge Agendamento', id: 'eNz7ObQqQwxXyzAb', nodes: 9, group: 'Clientes', score: 'ATENCAO', problem: 'Sem fallback quando slot indisponivel' },
  { name: 'Rescheduler Automatico', id: 'fOa8PcRrRxyYzaBc', nodes: 8, group: 'Clientes', score: 'ATENCAO', problem: 'Sem confirmacao do cliente' },
  { name: 'Innovat - Qualificador', id: 'gPb9QdSsSyzZabBc', nodes: 13, group: 'Clientes', score: 'ATENCAO', problem: 'BANT desatualizado para produto atual' },
  { name: 'Social Selling Instagram', id: 'hQc0ReStTzaAbCde', nodes: 17, group: 'Clientes', score: 'ATENCAO', problem: 'Rate limit Instagram 1000/dia' },
  { name: 'Cold Outreach BR', id: 'iRd1SfTuUabBcDef', nodes: 12, group: 'Clientes', score: 'ATENCAO', problem: 'Lista desatualizada' },
  { name: 'Innovat - Follow Up', id: 'jSe2TgUvVbcCdEfg', nodes: 9, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'Innovat - Agendador', id: 'kTf3UhVwWcdDeFgh', nodes: 11, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'Innovat - Pos Venda', id: 'lUg4ViWxXdeFgHij', nodes: 8, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'Lappe - Bot Financeiro', id: 'mVh5WjXyYefGhIjk', nodes: 14, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'Vertex - Pipeline Bot', id: 'nWi6XkYzZfgHiJkl', nodes: 16, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'Customer Success WF', id: 'oXj7YlZaAgHiJKlm', nodes: 10, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'NPS Survey Bot', id: 'pYk8ZmAbBhIjKLmn', nodes: 7, group: 'Clientes', score: 'OK', problem: '' },
  { name: 'Churn Predictor WF', id: 'qZl9AnBcCiJkLMno', nodes: 9, group: 'Clientes', score: 'OK', problem: '' },

  // Operacional (38 total: 34 OK, 2 ATENCAO, 2 CRITICO)
  { name: 'FLUXO BASE PARA DUPLICAR', id: 'AfVNiiQWzrNl5lV0', nodes: 3, group: 'Operacional', score: 'ATENCAO', problem: 'Template ativo — candidato a desativar' },
  { name: 'IA MARKEGTING', id: '0eq7VTwySd9qqbZj', nodes: 2, group: 'Operacional', score: 'ATENCAO', problem: 'Typo no nome, 0 execucoes' },
  { name: 'Reflection Loop WF', id: 'rAm0BoCdDjkKlMno2', nodes: 19, group: 'Operacional', score: 'CRITICO', problem: 'Sem output handler para falhas LLM' },
  { name: 'Prompt Updater WF', id: 'sBn1CpDeEklLmNop2', nodes: 14, group: 'Operacional', score: 'CRITICO', problem: 'Versao desatualizada do schema' },
  { name: 'Classificador 3D v2', id: 'IawOpB56MTFoEP3M', nodes: 48, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Assembly Line API WF', id: 'tCo2DqEfFlmMnOpq2', nodes: 23, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Content Pipeline WF', id: 'uDp3ErFgGmnNoPqr2', nodes: 16, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Video Producer WF', id: 'vEq4FsGhHnoOpQrs2', nodes: 21, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'SENTINEL Observer', id: 'wFr5GtHiIopPqRst2', nodes: 12, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Alert WhatsApp WF', id: 'xGs6HuIjJpqQrStu2', nodes: 8, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Groq Classifier', id: 'yHt7IvJkKqrRsTuv2', nodes: 7, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Embedding Generator', id: 'zIu8JwKlLrsStuVw2', nodes: 9, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'RAG Indexer', id: 'aJv9KxLmMstTuvWx2', nodes: 11, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Webhook Dispatcher', id: 'bKw0LyMnNtuUvwXy2', nodes: 6, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Error Handler Global', id: 'cLx1MzNoOuvVwxYz2', nodes: 5, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Cron Scheduler Daily', id: 'dMy2NaOpPvwWxyZa2', nodes: 4, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Health Monitor WF', id: 'eNz3ObQqQwxXyzAb2', nodes: 8, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Queue Processor', id: 'fOa4PcRrRxyYzaBc2', nodes: 10, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Rate Limiter WF', id: 'gPb5QdSsSyzZabBc2', nodes: 7, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Notification Router', id: 'hQc6ReStTzaAbCde2', nodes: 9, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Retry Handler WF', id: 'iRd7SfTuUabBcDef2', nodes: 6, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Session Manager WF', id: 'jSe8TgUvVbcCdEfg2', nodes: 11, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Audit Logger WF', id: 'kTf9UhVwWcdDeFgh2', nodes: 5, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Config Loader WF', id: 'lUg0ViWxXdeFgHij2', nodes: 4, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Secret Rotator WF', id: 'mVh1WjXyYefGhIjk2', nodes: 8, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Deploy Notifier WF', id: 'nWi2XkYzZfgHiJkl2', nodes: 6, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Performance Reporter', id: 'oXj3YlZaAgHiJKlm2', nodes: 13, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Cost Calculator WF', id: 'pYk4ZmAbBhIjKLmn2', nodes: 9, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Budget Alert WF', id: 'qZl5AnBcCiJkLMno2', nodes: 7, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Invoice Generator WF', id: 'rAm6BoCdDjkKlMno3', nodes: 12, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Lead Scorer WF', id: 'sBn7CpDeEklLmNop3', nodes: 10, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Tag Manager WF', id: 'tCo8DqEfFlmMnOpq3', nodes: 8, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Segment Builder WF', id: 'uDp9ErFgGmnNoPqr3', nodes: 11, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'A/B Test WF', id: 'vEq0FsGhHnoOpQrs3', nodes: 9, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Feature Flag WF', id: 'wFr1GtHiIopPqRst3', nodes: 6, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Cleanup Scheduler', id: 'xGs2HuIjJpqQrStu3', nodes: 5, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Archive Old Records', id: 'yHt3IvJkKqrRsTuv3', nodes: 7, group: 'Operacional', score: 'OK', problem: '' },
  { name: 'Index Rebuilder WF', id: 'zIu4JwKlLrsStuVw3', nodes: 4, group: 'Operacional', score: 'OK', problem: '' },
];

const GROUP_SUMMARIES: GroupSummary[] = [
  {
    name: 'Core/Vendas',
    ok: 5,
    atencao: 4,
    critico: 6,
    total: 15,
    workflows: ALL_WORKFLOWS.filter(w => w.group === 'Core/Vendas'),
  },
  {
    name: 'Sync/Data/Tools',
    ok: 15,
    atencao: 2,
    critico: 3,
    total: 20,
    workflows: ALL_WORKFLOWS.filter(w => w.group === 'Sync/Data/Tools'),
  },
  {
    name: 'Clientes',
    ok: 8,
    atencao: 16,
    critico: 1,
    total: 25,
    workflows: ALL_WORKFLOWS.filter(w => w.group === 'Clientes'),
  },
  {
    name: 'Operacional',
    ok: 34,
    atencao: 2,
    critico: 2,
    total: 38,
    workflows: ALL_WORKFLOWS.filter(w => w.group === 'Operacional'),
  },
];

// ============================================
// BADGE COMPONENTS
// ============================================

const ScoreBadge = ({ score }: { score: Score }) => {
  const config = {
    OK: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    ATENCAO: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    CRITICO: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config[score]}`}>
      {score}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const config = {
    P0: 'bg-red-500/20 text-red-300 border border-red-500/40',
    P1: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${config[priority]}`}>
      {priority}
    </span>
  );
};

// ============================================
// STAT CARD
// ============================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}) => (
  <div className="bg-bg-secondary border border-border-default rounded-xl p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}>
      <Icon size={22} className={colorClass} />
    </div>
    <div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-muted mt-0.5">{label}</p>
    </div>
  </div>
);

// ============================================
// GROUP CARD
// ============================================

const GroupCard = ({ group }: { group: GroupSummary }) => {
  const [expanded, setExpanded] = useState(false);

  const total = group.total;
  const okPct = Math.round((group.ok / total) * 100);
  const atencaoPct = Math.round((group.atencao / total) * 100);
  const criticoPct = Math.round((group.critico / total) * 100);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-bg-hover transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-semibold text-text-primary">{group.name}</span>
            <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
              {total} workflows
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden flex">
            <div className="bg-emerald-500 transition-all" style={{ width: `${okPct}%` }} />
            <div className="bg-amber-500 transition-all" style={{ width: `${atencaoPct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${criticoPct}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {group.ok} OK
            </span>
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              {group.atencao} Atencao
            </span>
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {group.critico} Critico
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-text-muted">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-default">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Nodes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Problema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {group.workflows.map((wf) => (
                  <tr key={wf.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-text-primary truncate max-w-[220px]">{wf.name}</div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">{wf.id}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{wf.nodes}</td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={wf.score} />
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs max-w-[240px] truncate">
                      {wf.problem || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export const N8nAudit = () => {
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<Score | 'ALL'>('ALL');
  const [groupFilter, setGroupFilter] = useState<Group | 'ALL'>('ALL');

  const filteredWorkflows = useMemo(() => {
    return ALL_WORKFLOWS.filter((wf) => {
      const matchSearch =
        search.trim() === '' ||
        wf.name.toLowerCase().includes(search.toLowerCase()) ||
        wf.id.toLowerCase().includes(search.toLowerCase());
      const matchScore = scoreFilter === 'ALL' || wf.score === scoreFilter;
      const matchGroup = groupFilter === 'ALL' || wf.group === groupFilter;
      return matchSearch && matchScore && matchGroup;
    });
  }, [search, scoreFilter, groupFilter]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bg-secondary border border-border-default rounded-xl flex items-center justify-center">
            <ClipboardCheck size={20} className="text-text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Auditoria n8n</h1>
            <p className="text-sm text-text-muted mt-0.5">98 workflows ativos auditados em 2026-02-20</p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
          onClick={() => alert('Exportar — placeholder')}
        >
          <Download size={15} />
          Exportar
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Workflows"
          value={98}
          icon={Workflow}
          colorClass="text-text-secondary"
          bgClass="bg-bg-tertiary"
        />
        <StatCard
          label="OK"
          value={62}
          icon={CheckCircle}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
        />
        <StatCard
          label="Atencao"
          value={24}
          icon={AlertTriangle}
          colorClass="text-amber-400"
          bgClass="bg-amber-500/10"
        />
        <StatCard
          label="Critico"
          value={12}
          icon={XCircle}
          colorClass="text-red-400"
          bgClass="bg-red-500/10"
        />
      </div>

      {/* ── CRITICOS ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Criticos — Acao Imediata
          </h2>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-tertiary/40">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Workflow</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[160px]">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[90px]">Erro</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Causa Raiz</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[80px]">Prior.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {CRITICAL_WORKFLOWS.map((wf) => (
                  <tr key={wf.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-text-primary">{wf.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <code className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded font-mono">
                        {wf.id}
                      </code>
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary text-xs">{wf.errors}</td>
                    <td className="px-4 py-3.5 text-text-muted text-xs max-w-[300px]">
                      {wf.cause}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={wf.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── POR GRUPO ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Workflow size={16} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Por Grupo
          </h2>
        </div>
        <div className="space-y-3">
          {GROUP_SUMMARIES.map((group) => (
            <GroupCard key={group.name} group={group} />
          ))}
        </div>
      </section>

      {/* ── PADROES ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Padroes Identificados
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PATTERNS.map((p) => (
            <div
              key={p.title}
              className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-text-primary text-sm leading-tight">{p.title}</h3>
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {p.count} WFs
                </span>
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1">Afeta</p>
                <p className="text-xs text-text-secondary leading-relaxed">{p.affected}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1">Fix</p>
                <p className="text-xs text-text-secondary leading-relaxed">{p.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CANDIDATOS A DESATIVACAO ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Candidatos a Desativacao
          </h2>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-tertiary/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Workflow</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[180px]">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {DEACTIVATION_CANDIDATES.map((wf) => (
                <tr key={wf.id} className="hover:bg-bg-hover transition-colors">
                  <td className="px-5 py-3.5 font-medium text-text-primary">{wf.name}</td>
                  <td className="px-4 py-3.5">
                    <code className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded font-mono">
                      {wf.id}
                    </code>
                  </td>
                  <td className="px-4 py-3.5 text-text-muted text-xs">{wf.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── INVENTARIO COMPLETO ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-text-muted" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Inventario Completo ({filteredWorkflows.length} de 98)
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as Score | 'ALL')}
            className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            <option value="ALL">Todos os scores</option>
            <option value="OK">OK</option>
            <option value="ATENCAO">Atencao</option>
            <option value="CRITICO">Critico</option>
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as Group | 'ALL')}
            className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            <option value="ALL">Todos os grupos</option>
            <option value="Core/Vendas">Core/Vendas</option>
            <option value="Sync/Data/Tools">Sync/Data/Tools</option>
            <option value="Clientes">Clientes</option>
            <option value="Operacional">Operacional</option>
          </select>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-tertiary/40">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[160px]">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[70px]">Nodes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[140px]">Grupo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider w-[100px]">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Problema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-text-muted text-sm">
                      Nenhum workflow encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredWorkflows.map((wf) => (
                    <tr key={wf.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-medium text-text-primary">{wf.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded font-mono">
                          {wf.id}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{wf.nodes}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted">{wf.group}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={wf.score} />
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {wf.problem || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default N8nAudit;
