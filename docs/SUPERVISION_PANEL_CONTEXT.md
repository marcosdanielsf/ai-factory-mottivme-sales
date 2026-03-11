# Painel de Supervisão da Gestora de IA - Contexto de Desenvolvimento

> Última atualização: 2026-01-20
> Commit: 46f03c4
> Status: MVP Implementado ✅

## Objetivo

Permitir que a gestora de IA monitore e gerencie conversas de múltiplos clientes Instagram integrados via GoHighLevel, substituindo o uso do Kommo.

## O que foi implementado

### 1. SQL (executar no Supabase)

Arquivo: `sql/010_supervision_panel.sql`

- **Tabela `supervision_states`**: Armazena estado de supervisão de cada conversa
- **View `vw_supervision_conversations`**: Une conversas, leads e estados
- **View `vw_supervision_messages`**: Mensagens de uma conversa
- **Função `fn_update_supervision_state`**: Upsert do estado

### 2. Types

Arquivo: `src/types/supervision.ts`

```typescript
SupervisionStatus = 'ai_active' | 'ai_paused' | 'manual_takeover' | 'scheduled' | 'converted' | 'archived'
SupervisionConversation - dados da conversa com lead e agente
SupervisionMessage - mensagem individual
SupervisionState - estado de supervisão
supervisionStatusConfig - cores e labels por status
```

### 3. Hooks

| Hook | Função |
|------|--------|
| `useSupervisionPanel` | Lista conversas com filtros, stats, polling 30s |
| `useConversationMessages` | Mensagens de uma conversa específica |
| `useSupervisionActions` | pauseAI, resumeAI, markAsScheduled, markAsConverted, addNote, archive |

### 4. Componentes

| Componente | Função |
|------------|--------|
| `SupervisionHeader` | Filtros por status (pills) e busca |
| `ConversationList` | Lista de conversas com badges e preview |
| `ConversationDetail` | Detalhe com ações, modais de nota e agendamento |
| `MessageBubble` | Bolha de mensagem estilo WhatsApp |

### 5. Página e Rotas

- **Página**: `src/pages/Supervision.tsx` - Layout split-view
- **Rota**: `/supervision`
- **Menu**: SALES OS > "Supervisão IA" (ícone Eye)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Supervision Page                          │
├──────────────────────┬──────────────────────────────────────┤
│   ConversationList   │         ConversationDetail           │
│   (400px width)      │         (flex-1)                     │
│                      │                                      │
│   - Header/Filtros   │   - Header com info do contato       │
│   - Lista scrollable │   - Botões de ação                   │
│   - Badges de status │   - Notas/Agendamentos               │
│                      │   - Chat messages                    │
└──────────────────────┴──────────────────────────────────────┘
```

## Status de Supervisão

| Status | Cor | Significado |
|--------|-----|-------------|
| `ai_active` | Verde | IA respondendo normalmente |
| `ai_paused` | Amarelo | IA pausada, aguardando intervenção |
| `manual_takeover` | Azul | Humano assumiu a conversa |
| `scheduled` | Roxo | Lead agendou reunião/call |
| `converted` | Esmeralda | Lead converteu |
| `archived` | Cinza | Conversa arquivada |

## Próximos Passos (Fase 2)

### Prioridade Alta
- [ ] Executar `sql/010_supervision_panel.sql` no Supabase produção
- [ ] Validar dados reais vindos do GHL
- [ ] Testar fluxo completo de pausar/retomar IA

### Prioridade Média
- [ ] Envio de mensagens manuais via GHL API
- [ ] Webhooks real-time (substituir polling de 30s)
- [ ] Filtro por cliente/location

### Prioridade Baixa
- [ ] Kanban de funil drag & drop
- [ ] Notificações push quando lead responde
- [ ] Dashboard de métricas da gestora
- [ ] Histórico de ações por conversa

## Observações Técnicas

1. **Mock Data**: Os hooks usam dados mock quando a view não existe, permitindo desenvolvimento sem DB
2. **Polling**: Atualização automática a cada 30s (MVP simples)
3. **Fallback**: Se `vw_supervision_conversations` não existir, busca direto de `agent_conversations`
4. **Build**: Passou sem erros, pronto para deploy

## Comandos Úteis

```bash
# Rodar localmente
cd front-factorai-mottivme-sales
npm run dev

# Acessar
http://localhost:3000/#/supervision

# Build
npm run build
```

## Arquivos Modificados (além dos criados)

- `src/App.tsx` - Adicionada rota /supervision
- `src/components/Sidebar.tsx` - Adicionado link no menu SALES OS
- `src/hooks/index.ts` - Exports dos novos hooks
