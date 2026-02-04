# Follow-Up Universal (FUU) v3.0

> Sistema de follow-up multi-tenant com configuração dinâmica por location.

## Visão Geral

O FUU v3.0 permite que múltiplas locations (clientes) usem o mesmo workflow de follow-up, cada uma com sua própria persona, tom e configurações.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOLLOW-UP UNIVERSAL v3.0                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Location A   │    │ Location B   │    │ Location C   │       │
│  │ (Isabella)   │    │ (Julia)      │    │ (Carla)      │       │
│  │ Instituto    │    │ Five Rings   │    │ Clínica X    │       │
│  │ Amar         │    │ Financial    │    │              │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │                                    │
│                             ▼                                    │
│              ┌──────────────────────────┐                        │
│              │   WORKFLOW UNIVERSAL     │                        │
│              │   (Único para todos)     │                        │
│              └──────────────────────────┘                        │
│                             │                                    │
│                             ▼                                    │
│              ┌──────────────────────────┐                        │
│              │   fuu_agent_configs      │                        │
│              │   (Config por location)  │                        │
│              └──────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Arquivos do Sistema

| Arquivo | Descrição |
|---------|-----------|
| `[ GHL ] Follow Up Eterno - UNIVERSAL v3.0.json` | Workflow n8n |
| `migrations/007_fuu_agent_configs.sql` | Migration config de agentes |
| `migrations/008_fuu_cadences.sql` | Migration cadências e regras de canal |
| `prompts/PROMPT_FUP_UNIVERSAL_N8N.txt` | Prompt do agente |
| `n8n_nodes/node_config_agente_fup.json` | Nós config agente |
| `n8n_nodes/node_buscar_cadencia.json` | Nós cadência e tag |
| `scripts/test_fup_universal.py` | Testes config agente |
| `scripts/test_fuu_cadences.py` | Testes cadências |

## Tabelas Supabase

### `fuu_follow_up_types`

10 tipos de follow-up suportados:

| code | name | Descrição |
|------|------|-----------|
| `sdr_inbound` | SDR Inbound | Lead não respondeu após contato inicial |
| `sdr_proposal` | Proposta Enviada | Follow-up após envio de proposta |
| `closer` | Closer | Fechamento de venda |
| `concierge` | Concierge | Pós-venda e suporte |
| `clinic_reminder` | Lembrete Consulta | Confirmar presença |
| `clinic_noshow` | No Show | Lead faltou à consulta |
| `clinic_reschedule` | Reagendamento | Oferecer novos horários |
| `finance_reminder` | Lembrete Financeiro | Pagamento pendente |
| `finance_overdue` | Cobrança | Pagamento atrasado |
| `reactivation` | Reativação | Lead frio há muito tempo |

### `fuu_agent_configs`

Configuração do agente por location:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `location_id` | VARCHAR | ID da location no GHL |
| `follow_up_type` | VARCHAR | Tipo de follow-up (default: sdr_inbound) |
| `agent_name` | VARCHAR | Nome do agente (ex: Isabella) |
| `company_name` | VARCHAR | Nome da empresa |
| `company_description` | TEXT | Descrição da empresa |
| `agent_role` | VARCHAR | Função do agente (ex: Atendente) |
| `language` | VARCHAR | Idioma (default: pt-BR) |
| `tone` | VARCHAR | Tom: casual, friendly, formal, professional |
| `use_slang` | BOOLEAN | Usar gírias (vc, ta, pra) |
| `use_emoji` | BOOLEAN | Usar emojis |
| `max_emoji_per_message` | INTEGER | Máximo de emojis por mensagem |
| `max_message_lines` | INTEGER | Máximo de linhas por mensagem |
| `offer_value_attempt` | INTEGER | Tentativa para oferta de valor |
| `breakup_attempt` | INTEGER | Tentativa para encerramento |
| `custom_prompts` | JSONB | Prompts customizados |
| `message_examples` | JSONB | Exemplos de mensagens |

### `fuu_cadences`

Cadências de follow-up por canal (intervalos, regras, tags):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `location_id` | VARCHAR | ID da location |
| `follow_up_type` | VARCHAR | Tipo de follow-up |
| `channel` | VARCHAR | Canal: whatsapp, instagram, sms, email |
| `attempt_number` | INTEGER | Número da tentativa (1, 2, 3...) |
| `interval_minutes` | INTEGER | Minutos desde última tentativa |
| `channel_max_hours` | INTEGER | Limite do canal (Instagram: 24h) |
| `message_type` | VARCHAR | **ai_text**, **tag**, template |
| `tag_to_add` | VARCHAR | Tag GHL para disparar áudio |
| `allowed_hours_start` | TIME | Horário início permitido |
| `allowed_hours_end` | TIME | Horário fim permitido |

### `fuu_channel_rules`

Regras globais por canal:

| Canal | Limite Horas | Min Intervalo | Descrição |
|-------|--------------|---------------|-----------|
| instagram | **24h** | 30min | DM limitada após 24h |
| whatsapp | - | 30min | Sem limite |
| sms | - | 60min | Horário comercial |
| email | - | 120min | Pode ir pra spam |

## Integração com Áudio via Tag GHL

Na tentativa configurada, ao invés de gerar mensagem com IA, o sistema adiciona uma **tag no contato GHL**, que dispara um workflow interno do GHL para enviar áudio pré-gravado.

```
┌─────────────────────────────────────────────────────────────┐
│  FLUXO DE ÁUDIO VIA TAG                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  n8n (Follow Up)              GHL                            │
│  ─────────────────────────────────────────────────────       │
│                                                              │
│  Tentativa 3                  Workflow interno               │
│       │                            │                         │
│       ▼                            │                         │
│  Adiciona tag ──────────────► Detecta tag                    │
│  "enviar-audio-fup"               │                         │
│                                    ▼                         │
│                              Envia áudio                     │
│                              pré-gravado                     │
│                                    │                         │
│                                    ▼                         │
│                              Remove tag                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Configuração de Cadência com Áudio

```sql
-- WhatsApp: Áudio na tentativa 3
INSERT INTO fuu_cadences
(location_id, follow_up_type, channel, attempt_number, interval_minutes, message_type, tag_to_add)
VALUES
('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'whatsapp', 3, 360, 'tag', 'enviar-audio-fup');
```

## Como Funciona

### 1. Lead entra no fluxo de follow-up

O n8n busca a config do agente baseado na `location_id`:

```sql
SELECT * FROM fuu_agent_configs
WHERE location_id = 'cd1uyzpJox6XPt4Vct8Y'
  AND follow_up_type = 'sdr_inbound'
  AND is_active = true
LIMIT 1
```

### 2. Config Agente (Set node com fallback)

Se encontrar config, usa os valores. Se não, usa fallback:

```javascript
{
  "agent_name": {{ $('Buscar Config Agente')?.item?.json?.agent_name || 'Assistente' }},
  "company_name": {{ $('Buscar Config Agente')?.item?.json?.company_name || 'Empresa' }},
  "tone": {{ $('Buscar Config Agente')?.item?.json?.tone || 'casual' }},
  // ...
}
```

### 3. Prompt Universal

O prompt usa variáveis dinâmicas:

```
Voce e {{ $('Config Agente').item.json.agent_name }},
{{ $('Config Agente').item.json.agent_role }} da
{{ $('Config Agente').item.json.company_name }}.
```

## Adicionar Nova Location

### 1. Inserir config no Supabase

```sql
INSERT INTO fuu_agent_configs (
  location_id,
  follow_up_type,
  agent_name,
  company_name,
  company_description,
  agent_role,
  tone,
  use_slang,
  use_emoji,
  max_emoji_per_message,
  max_message_lines
) VALUES (
  'NOVA_LOCATION_ID',
  'sdr_inbound',
  'Nome do Agente',
  'Nome da Empresa',
  'Descrição da empresa para contexto',
  'SDR',
  'casual',
  true,
  true,
  1,
  3
);
```

### 2. Verificar com teste

```bash
python3 scripts/test_fup_universal.py
```

## Configuração Atual

### Instituto Amar (cd1uyzpJox6XPt4Vct8Y)

| Campo | Valor |
|-------|-------|
| agent_name | Isabella |
| company_name | Instituto Amar |
| agent_role | Atendente |
| tone | friendly |
| use_slang | true |
| use_emoji | true |
| max_emoji | 1 |
| max_lines | 3 |

## Testes

### Rodar todos os testes

```bash
python3 scripts/test_fup_universal.py
```

### O que é testado

1. **Tabelas FUU** - Existência das tabelas
2. **Config Instituto Amar** - Valores corretos
3. **Tipos de Follow-up** - 10 tipos cadastrados
4. **Fallback** - Valores default quando não há config
5. **Lead Tracking** - Lead de teste existe
6. **Histórico** - Estrutura de mensagens
7. **RPC** - Função `get_fuu_agent_config`
8. **Workflow JSON** - Nós e conexões corretos
9. **Simulação** - Fluxo completo funciona

### Resultado esperado

```
Total: 9/9 testes passaram
🎉 TODOS OS TESTES PASSARAM!
```

## Workflow n8n

### Nós adicionados

1. **Buscar Config Agente** (Postgres)
   - Query na tabela `fuu_agent_configs`
   - Filtra por `location_id` e `follow_up_type`

2. **Config Agente** (Set)
   - Extrai valores da query
   - Aplica fallback se necessário

3. **Buscar Cadencia** (Postgres)
   - Query na tabela `fuu_cadences`
   - Filtra por `location_id`, `follow_up_type`, `channel`, `attempt_number`

4. **Config Cadencia** (Set)
   - Extrai: `message_type`, `tag_to_add`, `channel_max_hours`
   - Aplica fallback se necessário

5. **Verificar Limite Canal** (If)
   - Se Instagram E passou de 24h → Skip (não envia)
   - Senão → continua

6. **Tipo de Mensagem** (Switch)
   - `tag` → Adicionar Tag GHL
   - `template` → (futuro)
   - `ai_text` → Gerar com IA

7. **Adicionar Tag GHL** (HTTP Request)
   - PUT para API do GHL adicionando tag
   - Workflow GHL interno dispara áudio

### Fluxo Atualizado

```
Trigger → Busca Rastreio → Buscar Config Agente → Config Agente
                                                       ↓
                                              Buscar Cadencia
                                                       ↓
                                              Config Cadencia
                                                       ↓
                                           Verificar Limite Canal
                                                  ↓         ↓
                                        [passou 24h]   [dentro do limite]
                                              ↓              ↓
                                           Skip      Tipo de Mensagem
                                                       ↓    ↓    ↓
                                                    [tag] [tpl] [ai]
                                                      ↓         ↓
                                               Add Tag GHL    IA
                                                      ↓         ↓
                                               Update Count  Enviar
```

## Migração do v2.5 para v3.0

O v3.0 é compatível com o v2.5. Para migrar:

1. Importar o workflow `[ GHL ] Follow Up Eterno - UNIVERSAL v3.0.json`
2. Configurar a location na tabela `fuu_agent_configs`
3. Desativar o workflow antigo
4. Ativar o novo

## Troubleshooting

### Agente não encontra config

**Causa**: Location não cadastrada na `fuu_agent_configs`

**Solução**: O sistema usa fallback automático. Para personalizar, insira a config.

### Mensagem genérica (sem nome da empresa)

**Causa**: Config não encontrada ou campo vazio

**Solução**: Verificar se `company_name` está preenchido na config.

### Tipo de follow-up incorreto

**Causa**: `follow_up_type` não corresponde ao cadastrado

**Solução**: Verificar se o tipo existe em `fuu_follow_up_types`.

---

## Referências

- [ARQUITETURA_FOLLOW_UP_UNIVERSAL.md](./ARQUITETURA_FOLLOW_UP_UNIVERSAL.md) - Arquitetura completa
- [INTEGRACAO_FOLLOW_UP_ETERNO.md](./INTEGRACAO_FOLLOW_UP_ETERNO.md) - Versão v2.5 (legado)
- [prompts/PROMPT_FUP_UNIVERSAL_N8N.txt](../prompts/PROMPT_FUP_UNIVERSAL_N8N.txt) - Prompt completo

---

*Última atualização: 2026-01-09*
