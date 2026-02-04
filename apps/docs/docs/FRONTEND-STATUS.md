# 📊 FRONTEND STATUS - AI Factory Dashboard

> **Última atualização:** Janeiro 2025
> **Projeto:** AI Factory MOTTIVME Sales
> **Total de Páginas:** 21

---

## 1. Dashboard (Control Tower) - `/`
**Arquivo:** `src/pages/Dashboard.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useDashboardMetrics` | `agent_versions`, `dashboard_ranking_clientes`, `socialfy_leads` | ✅ Real |
| `useAgents` | `agent_versions` | ✅ Real |
| `usePendingApprovals` | `agent_versions` (validation_status='pending_approval') | ✅ Real |
| `useTestResults` | `test_runs` | ✅ Real |
| `useAgentPerformance` | `agent_versions` | ✅ Real |
| `useFunnelMetrics` | `dashboard_ranking_clientes`, `socialfy_leads` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Métricas principais (agentes, leads, conversão) | ✅ | Dados reais do Supabase |
| Gráfico de evolução de score | ✅ | Via `test_runs` |
| Gráfico de conversão por agente | ✅ | Via `agent_versions` |
| Funil de conversão | ✅ | Via views do dashboard |
| Métricas de follow-up | ✅ | Via views do dashboard |
| Alertas urgentes | ✅ | Calculado dinamicamente |
| Radar de dimensões V4 | ✅ | Via `test_runs.score_dimensions` |
| Botão "Rodar Testes" | ⚠️ | Simula início (não integrado ao backend) |
| Pipeline de versões | ✅ | Via `agent_versions` |

### Pendências
- [ ] Integrar botão "Rodar Testes" com backend Python
- [ ] Real-time updates via Supabase subscriptions

---

## 2. Leads - `/leads`
**Arquivo:** `src/pages/Leads.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useLeads` | `socialfy_leads` | ✅ Real |
| `useLeadConversations` | `agent_conversation_messages` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Listagem de leads | ✅ | Paginação server-side |
| Filtros (Todos, Hoje, Amanhã, Agendados) | ✅ | Query dinâmica no Supabase |
| Busca por nome/email/telefone | ✅ | Debounced search |
| Exportar CSV | ✅ | Client-side export |
| Modal de chat | ✅ | Exibe mensagens reais |
| Detalhes do lead (ICP Score, Instagram) | ✅ | Campos da tabela `socialfy_leads` |

### Pendências
- [ ] Enviar mensagem manual (input existe mas não envia)
- [ ] Atualizar status do lead diretamente

---

## 3. Sales Ops - `/sales-ops`
**Arquivo:** `src/pages/SalesOps/index.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `salesOpsDAO` | `vw_sales_ops_overview`, `vw_follow_up_funnel`, `vw_atividade_diaria`, `vw_conversao_por_etapa`, `vw_leads_prontos_follow_up` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Overview Cards | ✅ | Leads ativos/inativos, média follow-ups |
| Seletor de cliente | ✅ | Filtra por location_id |
| Gráfico de funil | ✅ | Via `vw_follow_up_funnel` |
| Gráfico de atividade | ✅ | Via `vw_atividade_diaria` |
| Tabela de conversão | ✅ | Via `vw_conversao_por_etapa` |

### Pendências
- [ ] Nenhuma pendência identificada

---

## 4. Prompt Studio - `/prompt-studio`
**Arquivo:** `src/pages/PromptEditor.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useAgents` | `agent_versions` | ✅ Real |
| `useAgentVersions` | `agent_versions` (por client_id) | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Seleção de agente | ✅ | Dropdown com agentes reais |
| Edição de System Prompt | ✅ | Salva no Supabase |
| Edição de Modos de Operação | ✅ | Campo `prompts_por_modo` |
| Hiperpersonalização (JSON) | ✅ | Campo `hyperpersonalization` |
| Histórico de versões | ✅ | Lista ordenada por data |
| Criar nova versão | ✅ | Incrementa version_number |
| Publicar versão | ✅ | Atualiza `is_active` e `validation_status` |
| Chat de Ajustes (CS) | ⚠️ | UI pronta, mas não integrado com LLM |
| Sandbox | ⚠️ | Botão presente, mas simula apenas |
| Carregar da Base de Conhecimento | ✅ | Busca em `factory_artifacts` |

### Pendências
- [ ] Integrar Chat CS com LLM real (Claude/GPT)
- [ ] Implementar Sandbox funcional com teste real
- [ ] Diff visual entre versões

---

## 5. Agent Detail - `/agents/:id`
**Arquivo:** `src/pages/AgentDetail.tsx`
**Status:** 🟡 Parcial

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| Direto via Supabase | `agent_versions`, `test_results` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Exibir dados do agente | ✅ | Nome, versão, status |
| Performance Radar | ✅ | Via `test_results` |
| Score por dimensão | ✅ | Barras de progresso |
| Evolução do score | ✅ | Chart histórico |
| Pontos fortes/fracos | ✅ | Via `test_results.strengths/weaknesses` |
| Histórico de testes | ✅ | Lista com status |
| Botão "Rodar Teste" | ⚠️ | Simula apenas (setTimeout) |
| Ver relatório HTML | ✅ | Link para `html_report_url` |

### Pendências
- [ ] Integrar "Rodar Teste" com backend Python
- [ ] Real-time update após teste

---

## 6. Validation - `/validacao`
**Arquivo:** `src/pages/Validation.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useTestResults` | `test_runs` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Listagem de execuções | ✅ | Paginado do Supabase |
| Filtros (agente, versão, data) | ✅ | Client-side filtering |
| Status cards (versão prod/staging) | ⚠️ | Valores fixos "v2.1", "v2.2-beta" |
| Modal de relatório HTML | ✅ | Via `TestReportModal` |
| Botão "Rodar Testes" | ⚠️ | Simula apenas |
| Deletar registro | ✅ | Remove do Supabase |

### Pendências
- [ ] Status cards devem vir do banco (não hardcoded)
- [ ] Integrar "Rodar Testes" com backend

---

## 7. Reflection Loop - `/reflection-loop`
**Arquivo:** `src/pages/ReflectionLoop.tsx`
**Status:** 🟡 Parcial

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| Direto via Supabase | `reflection_logs`, `agent_versions` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Stats cards | ✅ | Calculados dos logs |
| Aba Sugestões | ⚠️ | Extrai de `reflection_logs.recomendacoes_priorizadas` |
| Aba Histórico | ✅ | Lista de ciclos de reflexão |
| Aba Configurações | ❌ | UI presente, mas não salva no banco |
| Aceitar/Rejeitar/Aplicar sugestão | ⚠️ | Atualiza estado local apenas |
| Exportar logs | ✅ | CSV client-side |

### Pendências
- [ ] Persistir configurações no Supabase
- [ ] Implementar aplicação real de sugestões
- [ ] Integrar com sistema de Reflection automatizado

---

## 8. Logs - `/logs`
**Arquivo:** `src/pages/Logs.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useAgentConversations` | `agent_conversations` ou similar | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Listagem de conversas | ✅ | Com QA Score |
| Busca por ID/nome/telefone | ✅ | Client-side filter |
| Exibir última mensagem | ✅ | Truncada |
| Score visual (badge) | ✅ | Verde/amarelo/vermelho |

### Pendências
- [ ] Modal para ver conversa completa
- [ ] Filtros avançados (por agente, canal)

---

## 9. Knowledge Base - `/knowledge-base`
**Arquivo:** `src/pages/KnowledgeBase.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useAgents` | `agent_versions` | ✅ Real |
| `useArtifacts` | `factory_artifacts` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Visão geral (modos + tools) | ⚠️ | Dados de `agent-config.ts` (mock local) |
| System Prompt editor | ⚠️ | Template local (`SYSTEM_PROMPT_TEMPLATE`) |
| Documentos indexados | ✅ | Via `factory_artifacts` |
| Adicionar documento | ✅ | Upload para `factory_artifacts` |
| Deletar documento | ✅ | Remove do Supabase |
| Seletor de agente | ✅ | Filtra artefatos por client_id |

### Pendências
- [ ] Modos/Tools devem vir do banco, não de arquivo local
- [ ] Integração com embeddings/vector search

---

## 10. Team RPG - `/team-rpg`
**Arquivo:** `src/pages/TeamRPG.tsx`
**Status:** 🟡 Parcial

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `ClientService`, `AgentService` | `clients`, configs | ⚠️ Parcial |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Ranking de clientes | ✅ | Via `ClientService.getAll()` |
| Visualização de squads | ✅ | Avatar RPG-style |
| Skills dos membros | ⚠️ | Dados de `squads.ts` (parcialmente mock) |
| Editar prompt via skill | ⚠️ | Atualiza estado local apenas |

### Pendências
- [ ] Persistir edições de skills no Supabase
- [ ] Dados de squads devem vir 100% do banco

---

## 11. Super Agent RPG - `/super-agent`
**Arquivo:** `src/pages/SuperAgentRPG.tsx`
**Status:** 🔴 Mockado

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| Nenhum | Dados de `superAgent.ts` | ❌ Mock |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Visualização orbital | ✅ | UI funcional |
| Treinadores | ❌ | Dados mockados |
| Actions (Follow Up, Agendar, Contrato) | ❌ | Apenas console.log/alert |
| Modal de contrato | ❌ | Não integrado |

### Pendências
- [ ] Definir se feature será mantida
- [ ] Integrar com dados reais se mantida

---

## 12. Notifications - `/notificacoes`
**Arquivo:** `src/pages/Notifications.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useSystemAlerts` | `system_alerts` ou similar | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Listagem de alertas | ✅ | Com severity badge |
| Filtro por severidade | ✅ | all/critical/high/medium/low |
| Busca | ✅ | Por título/mensagem/cliente |
| Marcar todas como lidas | ✅ | Batch action |
| Deletar alerta | ✅ | Individual |

### Pendências
- [ ] Nenhuma pendência crítica

---

## 13. Calls Realizadas - `/calls`
**Arquivo:** `src/pages/CallsRealizadas.tsx`
**Status:** 🟡 Parcial

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useAgentConversations` | `agent_conversations` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Listagem de calls | ✅ | Tabela com filtros |
| Métricas (total, completadas, taxa, duração) | ✅ | Calculadas client-side |
| Filtros (busca, status, data) | ✅ | Client-side |
| Player de áudio | ⚠️ | Simula progresso (não há áudio real) |
| Exportar relatório | ⚠️ | Simula apenas (showToast) |

### Pendências
- [ ] Integrar com áudio real das calls
- [ ] Exportar relatório real (CSV/PDF)

---

## 14. Client Costs - `/custos`
**Arquivo:** `src/pages/ClientCosts.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useClientCosts` | `ai_cost_log`, views agregadas | ✅ Real |
| `useClientCostDetails` | `ai_cost_log` | ✅ Real |
| `useGlobalCostSummary` | Views agregadas | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Cards de resumo | ✅ | Total, clientes, requisições, média |
| Filtro de período | ✅ | today/7d/30d/month/all |
| Filtro por cliente | ✅ | Dropdown |
| Mostrar inativos | ✅ | Toggle |
| Tabela de custos por cliente | ✅ | Com progress bar |
| Modal de detalhes | ✅ | Custos por dia + atividade recente |

### Pendências
- [ ] Nenhuma pendência crítica

---

## 15. Performance - `/performance`
**Arquivo:** `src/pages/Performance.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useClientPerformance` | `dashboard_ranking_clientes`, `ai_cost_log` | ✅ Real |
| `useAllAgentVersions` | `agent_versions` | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Cards de totais | ✅ | Clientes, leads, taxas |
| Alertas de clientes | ✅ | Baixa resposta/conversão, custo alto |
| Top 3 performers | ✅ | Ranking |
| Tabela de clientes | ✅ | Com ordenação |
| Versões por cliente | ✅ | Expandível |
| Toggle ativo/inativo | ✅ | Atualiza `is_active` no banco |

### Pendências
- [ ] Nenhuma pendência crítica

---

## 16. Supervision - `/supervision`
**Arquivo:** `src/pages/Supervision.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useSupervisionPanel` | `supervision_conversations` ou view | ✅ Real |
| `useConversationMessages` | `agent_conversation_messages` | ✅ Real |
| `useSupervisionActions` | RPCs/mutations no Supabase | ✅ Real |
| `useSendMessage` | Webhook n8n + Supabase | ✅ Real |
| `useSupervisionRealtime` | Supabase Realtime | ✅ Real |
| `useFilterOptions` | Tabelas de referência | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Lista de conversas | ✅ | Com filtros avançados |
| Detalhe da conversa | ✅ | Mensagens em tempo real |
| Pausar/Retomar IA | ✅ | Atualiza `ai_enabled` |
| Marcar como agendado | ✅ | Persiste no banco |
| Marcar como convertido | ✅ | Persiste no banco |
| Adicionar nota | ✅ | Persiste no banco |
| Arquivar conversa | ✅ | Persiste no banco |
| Enviar mensagem manual | ✅ | Via webhook n8n |
| Layout responsivo (mobile) | ✅ | Implementado |
| Real-time updates | ✅ | Via Supabase subscriptions |

### Pendências
- [ ] Nenhuma pendência crítica

---

## 17. Configurações - `/configuracoes`
**Arquivo:** `src/pages/Configuracoes.tsx`
**Status:** 🟡 Parcial

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| Nenhum | localStorage | ⚠️ Local apenas |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Configurações gerais | ⚠️ | Salva em localStorage |
| Notificações | ⚠️ | Salva em localStorage |
| Integração (Supabase, Gemini, Webhooks) | ⚠️ | Salva em localStorage |
| Usuários | ⚠️ | Info apenas (gerenciado no Supabase) |
| Testar webhook | ⚠️ | Simula apenas |
| Busca de configurações | ✅ | Client-side filter |

### Pendências
- [ ] Persistir configurações no Supabase (tabela `app_settings`)
- [ ] Testar webhook real
- [ ] Integrar gestão de usuários com Supabase Auth

---

## 18. Client Detail - `/clientes/:id`
**Arquivo:** `src/pages/ClientDetail.tsx`
**Status:** 🔴 Mockado

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| Nenhum | `MOCK_CLIENTS`, `MOCK_AGENT_VERSION`, `MOCK_CALLS` (constants.ts) | ❌ Mock |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Dados do cliente | ❌ | Mock de `constants.ts` |
| Agente ativo | ❌ | Mock |
| Métricas do agente | ❌ | Mock |
| Calls processadas | ❌ | Mock |

### Pendências
- [ ] Buscar cliente real do Supabase
- [ ] Vincular com `clients` ou `locations`
- [ ] Buscar agente vinculado ao cliente

---

## 19. Approvals - `/aprovacoes`
**Arquivo:** `src/pages/Approvals.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `usePendingApprovals` | `agent_versions` (validation_status='pending_approval') | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Listagem de pendentes | ✅ | Com changelog |
| Aprovar versão | ✅ | Atualiza `validation_status='active'` |
| Rejeitar versão | ✅ | Atualiza `validation_status='rejected'` |
| Busca | ✅ | Client-side filter |

### Pendências
- [ ] "Ver Diff Completo" não implementado

---

## 20. Onboarding Wizard - `/onboarding`
**Arquivo:** `src/pages/OnboardingWizard.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useOnboarding` | Tabela de onboarding (presumido) | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Wizard de 7 perguntas | ✅ | UI completa |
| Input texto | ✅ | Com contador de caracteres |
| Input áudio | ✅ | Via MediaRecorder API |
| Progress bar | ✅ | Visual |
| Salvar no Supabase | ✅ | Via `useOnboarding.saveOnboarding()` |
| Tela de sucesso | ✅ | Redireciona para dashboard |

### Pendências
- [ ] Transcrição de áudio (Whisper API)
- [ ] Gerar agentes automaticamente após onboarding

---

## 21. Login - `/login`
**Arquivo:** `src/pages/Login.tsx`
**Status:** 🟢 Funcionando

### Fonte de Dados
| Hook | Tabela/View | Status |
|------|-------------|--------|
| `useAuth` | Supabase Auth | ✅ Real |

### Funcionalidades
| Feature | Status | Observação |
|---------|--------|------------|
| Login com email/senha | ✅ | Via Supabase Auth |
| Validação de formulário | ✅ | Client-side |
| Tratamento de erros | ✅ | Mensagens específicas |
| Redirect após login | ✅ | Via `returnTo` param |
| Link "Esqueceu senha" | ⚠️ | Link presente, página não encontrada |
| Link "Criar conta" | ⚠️ | Link presente, página não encontrada |

### Pendências
- [ ] Implementar página de "Esqueceu senha"
- [ ] Implementar página de "Signup"

---

---

# 📊 Resumo Geral

| Status | Qtd | Páginas |
|--------|-----|---------|
| 🟢 Funcionando | 14 | Dashboard, Leads, Sales Ops, Prompt Studio, Validation, Logs, Knowledge Base, Notifications, Client Costs, Performance, Supervision, Approvals, Onboarding, Login |
| 🟡 Parcial | 5 | Agent Detail, Reflection Loop, Team RPG, Calls Realizadas, Configurações |
| 🔴 Mockado | 2 | Super Agent RPG, Client Detail |
| ⚫ Não implementado | 0 | - |

---

# 🎯 Prioridades Sugeridas

## Alta Prioridade
1. **Client Detail** (`/clientes/:id`) - Página totalmente mockada, precisa integrar com dados reais
2. **Configurações** - Persistir no Supabase em vez de localStorage
3. **Páginas de Auth** - Implementar Forgot Password e Signup

## Média Prioridade
4. **Agent Detail / Validation** - Integrar "Rodar Testes" com backend Python
5. **Reflection Loop** - Persistir configurações e aplicação de sugestões
6. **Calls Realizadas** - Integrar com áudio real
7. **Prompt Studio** - Implementar Chat CS com LLM real

## Baixa Prioridade
8. **Super Agent RPG** - Decidir se feature será mantida
9. **Team RPG** - Completar integração com dados do banco
10. **Knowledge Base** - Modos/Tools devem vir do banco

---

# 📌 Observações Técnicas

## Padrão de Integração
- **Hooks customizados:** Todas as páginas funcionais usam hooks em `src/hooks/`
- **Supabase:** Client configurado em `src/lib/supabase.ts`
- **Real-time:** Implementado na Supervision via `useSupervisionRealtime`

## Views do Banco Utilizadas
- `dashboard_ranking_clientes` - Performance e funil
- `vw_sales_ops_overview` - Sales Ops totais
- `vw_follow_up_funnel` - Funil de follow-up
- `vw_atividade_diaria` - Atividade diária
- `vw_conversao_por_etapa` - Conversão por etapa
- `vw_leads_prontos_follow_up` - Leads prontos para follow-up

## Tabelas Principais
- `agent_versions` - Versões de agentes e prompts
- `socialfy_leads` - Leads do sistema
- `test_runs` - Execuções de testes
- `reflection_logs` - Logs de reflexão
- `factory_artifacts` - Base de conhecimento
- `ai_cost_log` - Custos de IA
- `agent_conversation_messages` - Mensagens das conversas
- `system_alerts` - Alertas do sistema

---

# 🔧 Próximos Passos Recomendados

1. **Criar tabela `app_settings`** para persistir configurações
2. **Criar tabela/view para `clients`** com dados unificados
3. **Implementar endpoint de teste** no backend Python
4. **Adicionar Whisper API** para transcrição no onboarding
5. **Documentar todas as views SQL** usadas pelo frontend
