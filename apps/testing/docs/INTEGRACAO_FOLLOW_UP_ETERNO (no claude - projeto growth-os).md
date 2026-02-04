# Integração Follow Up Eterno + SDR Julia Amare (v2.5)

> **Navegação**: [INDEX.md](../INDEX.md) | [CLAUDE.md](../CLAUDE.md) | [Arquitetura FUU](./ARQUITETURA_FOLLOW_UP_UNIVERSAL.md)

## Contexto

- **Projeto**: ai-factory-agents
- **Path**: `/Users/marcosdaniels/Projects/mottivme/ai-factory-agents`
- **Fluxos relacionados**:
  - `SDR Julia Amare - Corrigido.json`
  - `[ GHL ] Follow Up Eterno - CORRIGIDO.json`
- **Migration**: `migrations/add_followup_columns_n8n_schedule_tracking.sql`

---

## Arquitetura v2.5 - Subquery no Histórico

A versão 2.5 usa a tabela `n8n_historico_mensagens` como **fonte da verdade** para saber:
- Quem enviou a última mensagem (human/ai)
- Conteúdo da última mensagem (para contexto)
- Quando foi enviada

**Vantagens:**
- Elimina redundância (não precisa de `last_message_from` na schedule_tracking)
- Não precisa de node extra para atualizar após IA responder
- Dados sempre precisos (vem direto do histórico)
- Follow-up mais inteligente com contexto da última mensagem

## 1. Migração SQL (RODAR PRIMEIRO)

Arquivo: `migrations/add_followup_columns_n8n_schedule_tracking.sql`

```sql
-- Adicionar colunas na n8n_schedule_tracking (sem last_message_from!)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS location_id VARCHAR(100);

-- Índice para performance da subquery
CREATE INDEX IF NOT EXISTS idx_n8n_historico_mensagens_session_created
ON n8n_historico_mensagens (session_id, created_at DESC);
```

## 2. Alterações no SDR Julia Amare

### Node: "Salvar registro de Atividade - alan"
O INSERT foi simplificado:
- `api_key`, `location_id`, `source`
- `follow_up_count = 0` (reset quando lead responde)
- **REMOVIDO:** `last_message_at`, `last_message_from` (não precisa mais!)

### Node REMOVIDO: "Atualizar Last Message IA"
Não é mais necessário! A informação vem do histórico de mensagens.

## 3. Alterações no Follow Up Eterno (v2.5)

### Query Principal com Subquery

```sql
WITH ultima_msg AS (
  SELECT DISTINCT ON (session_id)
    session_id,
    message->>'type' as last_sender,
    message->>'content' as last_content,
    created_at as last_message_at
  FROM n8n_historico_mensagens
  ORDER BY session_id, created_at DESC
)
SELECT
  t.unique_id,
  t.source,
  t.follow_up_count,
  t.api_key,
  t.location_id,
  c.tentativa,
  c.intervalo_minutos,
  um.last_sender,
  um.last_content,  -- CONTEXTO DA ÚLTIMA MENSAGEM!
  um.last_message_at as ultima_msg
FROM n8n_schedule_tracking t
JOIN follow_up_cadencias c
  ON LOWER(COALESCE(t.source, 'whatsapp')) = c.canal
  AND COALESCE(t.follow_up_count, 0) + 1 = c.tentativa
LEFT JOIN ultima_msg um ON um.session_id = t.unique_id
WHERE t.ativo = true
  AND um.last_sender = 'ai'
  AND um.last_message_at < NOW() - (c.intervalo_minutos || ' minutes')::INTERVAL;
```

### Novos Campos Disponíveis
- `ultima_mensagem_lead` - Conteúdo da última mensagem (para contexto)
- `ultimo_remetente` - Quem enviou (ai/human)

## Fluxo de Dados (Simplificado)

```
LEAD ENVIA MENSAGEM
       │
       ▼
┌──────────────────────────────────┐
│ SDR Julia Amare                  │
│ Node: Salvar registro Atividade  │
│                                  │
│ follow_up_count = 0              │
│ (reset contador de follow-ups)   │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ IA processa e responde           │
│ (Mensagem salva no histórico     │
│  automaticamente com type='ai')  │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Enviar mensagem (Whatsapp/IG)    │
│                                  │
│ NÃO PRECISA DE NODE EXTRA!       │
│ Histórico já tem a informação    │
└──────────────────────────────────┘


LEAD NÃO RESPONDE (Trigger a cada 15 min)
       │
       ▼
┌──────────────────────────────────┐
│ Follow Up Eterno                 │
│                                  │
│ SUBQUERY na historico_mensagens: │
│ - Quem enviou última msg?        │
│ - Qual foi o conteúdo?           │
│ - Quando foi?                    │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Gerar follow-up COM CONTEXTO     │
│                                  │
│ IA sabe o que mandou antes       │
│ e pode continuar a conversa      │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ UPDATE n8n_schedule_tracking     │
│                                  │
│ follow_up_count += 1             │
│ last_execution = NOW()           │
└──────────────────────────────────┘
```

## Cadência de Follow-up (tabela follow_up_cadencias)

| Canal | Tentativa | Intervalo |
|-------|-----------|-----------|
| WhatsApp | 1 | 30 min |
| WhatsApp | 2 | 2h |
| WhatsApp | 3 | 6h |
| WhatsApp | 4 | 24h |
| WhatsApp | 5 | 48h |
| WhatsApp | 6 | 72h |
| Instagram | 1 | 1h |
| Instagram | 2 | 4h |
| Instagram | 3 | 12h |
| Instagram | 4 | 24h |
| Instagram | 5 | 48h |

## Checklist de Implementação

- [ ] Rodar migração SQL no Supabase
- [ ] Importar SDR Julia Amare atualizado no n8n
- [ ] Importar Follow Up Eterno v2.5 no n8n
- [ ] Testar com um lead de teste
- [ ] Ativar trigger do Follow Up Eterno

## Melhorias na v2.5

1. **Contexto da Última Mensagem** - O agente de follow-up agora recebe o conteúdo da última mensagem enviada, permitindo continuidade mais natural

2. **Sem Node Extra** - Removido o node "Atualizar Last Message IA" que era necessário antes

3. **Dados Sempre Precisos** - Usando histórico como fonte da verdade, elimina risco de dessincronização

4. **Performance Otimizada** - Índice específico para a subquery no histórico
