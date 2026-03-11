# Arquitetura Follow Up Universal (FUU) v1.0

> **Navegação**: [INDEX.md](../INDEX.md) | [CLAUDE.md](../CLAUDE.md) | [Integração v2.5](./INTEGRACAO_FOLLOW_UP_ETERNO.md)

## Contexto

- **Projeto**: ai-factory-agents
- **Path**: `/Users/marcosdaniels/Projects/mottivme/ai-factory-agents`
- **Relacionado**: Este doc descreve a arquitetura FUTURA. Para a versão atual, veja [INTEGRACAO_FOLLOW_UP_ETERNO.md](./INTEGRACAO_FOLLOW_UP_ETERNO.md)

---

## Visão Geral

Sistema escalável de follow-up multi-processo e multi-tenant que suporta diversos tipos de acompanhamento automatizado.

## Princípios de Design

1. **Multi-tenant** - Suporta múltiplos clientes (locations) isolados
2. **Multi-processo** - Um workflow, múltiplos tipos de follow-up
3. **Configurável** - Cadências e templates por tipo/cliente
4. **Fonte única de verdade** - Histórico de mensagens centralizado
5. **Extensível** - Fácil adicionar novos tipos

---

## Tipos de Follow-up

### VENDAS / SDR
| Código | Nome | Trigger | Objetivo |
|--------|------|---------|----------|
| `sdr_inbound` | SDR Inbound | Lead não responde | Reativar conversa |
| `sdr_proposal` | Proposta Enviada | Proposta sem resposta | Fechar venda |
| `sdr_demo` | Demo No-show | Demo não compareceu | Reagendar |
| `sdr_cold` | Reativação Base | Lead frio há X dias | Reativar |

### CLÍNICA / SAÚDE
| Código | Nome | Trigger | Objetivo |
|--------|------|---------|----------|
| `clinic_welcome` | Boas-vindas | Novo paciente | Orientações iniciais |
| `clinic_reminder_24h` | Lembrete 24h | 24h antes consulta | Confirmar |
| `clinic_reminder_2h` | Lembrete 2h | 2h antes consulta | Confirmar |
| `clinic_noshow` | No-show | Não compareceu | Reagendar |
| `clinic_post_procedure` | Pós-procedimento | Após procedimento | Acompanhar |
| `clinic_medication` | Lembrete Medicação | Horário remédio | Lembrar |
| `clinic_exam_pending` | Exame Pendente | Exame solicitado | Lembrar fazer |
| `clinic_return` | Retorno | X dias após consulta | Agendar retorno |

### FINANCEIRO
| Código | Nome | Trigger | Objetivo |
|--------|------|---------|----------|
| `finance_reminder` | Lembrete Pagamento | X dias antes vencimento | Lembrar |
| `finance_overdue` | Cobrança | Após vencimento | Cobrar |
| `finance_thanks` | Agradecimento | Após pagamento | Fidelizar |
| `finance_renewal` | Renovação | Assinatura expirando | Renovar |

### EXPERIÊNCIA / RELACIONAMENTO
| Código | Nome | Trigger | Objetivo |
|--------|------|---------|----------|
| `exp_birthday` | Aniversário Cliente | Data nascimento | Parabenizar |
| `exp_birthday_child` | Aniversário Filho | Data nasc. filho | Mensagem especial |
| `exp_birthday_spouse` | Aniversário Cônjuge | Data nasc. cônjuge | Mensagem especial |
| `exp_wedding_anniversary` | Aniv. Casamento | Data casamento | Parabenizar |
| `exp_client_anniversary` | Aniv. Cliente | X anos como cliente | Celebrar |
| `exp_christmas` | Natal | 25/12 | Mensagem festiva |
| `exp_newyear` | Ano Novo | 01/01 | Mensagem festiva |
| `exp_mothers_day` | Dia das Mães | 2º dom maio | Se for mãe |
| `exp_fathers_day` | Dia dos Pais | 2º dom agosto | Se for pai |

### PÓS-VENDA / SUCESSO
| Código | Nome | Trigger | Objetivo |
|--------|------|---------|----------|
| `success_day1` | Onboarding D1 | 1 dia após compra | Boas-vindas |
| `success_day7` | Onboarding D7 | 7 dias após compra | Verificar uso |
| `success_day30` | Onboarding D30 | 30 dias após compra | Feedback |
| `success_nps` | NPS | X dias após interação | Coletar NPS |
| `success_review` | Pedir Avaliação | Experiência positiva | Avaliação Google/FB |
| `success_upsell` | Upsell | Comportamento indica | Oferecer upgrade |
| `success_churn_risk` | Risco Churn | Sinais abandono | Retenção |

### OPERACIONAL
| Código | Nome | Trigger | Objetivo |
|--------|------|---------|----------|
| `ops_document_pending` | Doc Pendente | Doc solicitado | Lembrar envio |
| `ops_form_incomplete` | Form Incompleto | Cadastro parcial | Completar |
| `ops_contract_expiring` | Contrato Expirando | Fim próximo | Renovar |
| `ops_warranty_expiring` | Garantia Expirando | Garantia acabando | Extensão |

---

## Schema de Tabelas

### 1. `fuu_follow_up_types` - Tipos de Follow-up

```sql
CREATE TABLE fuu_follow_up_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- 'sdr_inbound', 'clinic_reminder_24h'
  category VARCHAR(30) NOT NULL,              -- 'sdr', 'clinic', 'finance', 'experience', 'success', 'ops'
  name VARCHAR(100) NOT NULL,                 -- 'Lembrete 24h antes consulta'
  description TEXT,
  trigger_type VARCHAR(30) NOT NULL,          -- 'no_response', 'date_based', 'event_based', 'manual'
  default_channel VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'instagram', 'sms', 'email'
  requires_agent BOOLEAN DEFAULT true,        -- Se precisa de IA ou só template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados iniciais
INSERT INTO fuu_follow_up_types (code, category, name, trigger_type) VALUES
('sdr_inbound', 'sdr', 'SDR Inbound - Sem resposta', 'no_response'),
('clinic_reminder_24h', 'clinic', 'Lembrete 24h antes consulta', 'date_based'),
('exp_birthday', 'experience', 'Aniversário do Cliente', 'date_based'),
('finance_overdue', 'finance', 'Cobrança - Pagamento atrasado', 'date_based');
```

### 2. `fuu_cadences` - Cadências por Tipo e Cliente

```sql
CREATE TABLE fuu_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id VARCHAR(100) NOT NULL,          -- Multi-tenant
  follow_up_type_code VARCHAR(50) NOT NULL REFERENCES fuu_follow_up_types(code),
  attempt_number INTEGER NOT NULL,            -- 1, 2, 3...
  interval_minutes INTEGER NOT NULL,          -- Intervalo desde última tentativa
  channel VARCHAR(20) DEFAULT 'whatsapp',     -- Canal desta tentativa
  max_attempts INTEGER DEFAULT 5,             -- Máximo de tentativas
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, follow_up_type_code, attempt_number)
);

-- Exemplo: Cadência SDR para location X
INSERT INTO fuu_cadences (location_id, follow_up_type_code, attempt_number, interval_minutes) VALUES
('loc_123', 'sdr_inbound', 1, 30),
('loc_123', 'sdr_inbound', 2, 120),
('loc_123', 'sdr_inbound', 3, 360),
('loc_123', 'sdr_inbound', 4, 1440),
('loc_123', 'sdr_inbound', 5, 2880);
```

### 3. `fuu_templates` - Templates de Mensagem

```sql
CREATE TABLE fuu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id VARCHAR(100) NOT NULL,
  follow_up_type_code VARCHAR(50) NOT NULL REFERENCES fuu_follow_up_types(code),
  attempt_number INTEGER,                     -- NULL = todos, ou específico
  template_text TEXT NOT NULL,                -- Suporta variáveis {{nome}}, {{data}}
  channel VARCHAR(20) DEFAULT 'whatsapp',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemplo
INSERT INTO fuu_templates (location_id, follow_up_type_code, attempt_number, template_text) VALUES
('loc_123', 'exp_birthday', NULL, 'Feliz aniversário, {{nome}}! 🎂 Que seu dia seja incrível! A equipe {{empresa}} deseja muitas felicidades!'),
('loc_123', 'clinic_reminder_24h', NULL, 'Oi {{nome}}! Lembrete: sua consulta é amanhã às {{horario}}. Confirma presença? 😊');
```

### 4. `fuu_queue` - Fila de Follow-ups Pendentes

```sql
CREATE TABLE fuu_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,           -- ID do contato no GHL
  follow_up_type_code VARCHAR(50) NOT NULL REFERENCES fuu_follow_up_types(code),

  -- Controle de execução
  status VARCHAR(20) DEFAULT 'pending',       -- 'pending', 'processing', 'sent', 'failed', 'cancelled', 'completed'
  attempt_count INTEGER DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,

  -- Contexto
  trigger_data JSONB,                         -- Dados do trigger (ex: data consulta, valor fatura)
  context_data JSONB,                         -- Dados adicionais para template/IA

  -- Resultado
  messages_sent INTEGER DEFAULT 0,
  last_response_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_fuu_queue_pending ON fuu_queue (location_id, status, next_attempt_at)
WHERE status = 'pending';

CREATE INDEX idx_fuu_queue_contact ON fuu_queue (contact_id, follow_up_type_code);
```

### 5. `fuu_contact_dates` - Datas Especiais do Contato

```sql
CREATE TABLE fuu_contact_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  date_type VARCHAR(30) NOT NULL,             -- 'birthday', 'birthday_child', 'wedding_anniversary'
  date_value DATE NOT NULL,                   -- A data (ex: 1990-05-15)
  label VARCHAR(100),                         -- 'Filho João', 'Esposa Maria'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, contact_id, date_type, label)
);

-- Exemplo
INSERT INTO fuu_contact_dates (location_id, contact_id, date_type, date_value, label) VALUES
('loc_123', 'contact_abc', 'birthday', '1985-03-20', NULL),
('loc_123', 'contact_abc', 'birthday_child', '2015-07-10', 'João'),
('loc_123', 'contact_abc', 'birthday_child', '2018-11-25', 'Maria'),
('loc_123', 'contact_abc', 'wedding_anniversary', '2010-06-15', NULL);
```

### 6. `fuu_execution_log` - Log de Execuções

```sql
CREATE TABLE fuu_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES fuu_queue(id),
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  follow_up_type_code VARCHAR(50) NOT NULL,
  attempt_number INTEGER NOT NULL,

  -- Detalhes
  channel VARCHAR(20),
  message_sent TEXT,
  message_id VARCHAR(100),                    -- ID da mensagem no canal

  -- Resultado
  status VARCHAR(20),                         -- 'sent', 'failed', 'blocked'
  error_message TEXT,

  -- Custos (se usar IA)
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd DECIMAL(10, 6),
  model_used VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRIGGERS (Entrada)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ No Response  │  │ Date Based   │  │ Event Based          │  │
│  │ (SDR, etc)   │  │ (Aniversário)│  │ (Pagamento, Consulta)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └────────────────┬┴──────────────────────┘              │
│                          │                                      │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   INSERT fuu_queue    │                          │
│              │   status = 'pending'  │                          │
│              │   next_attempt_at     │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WORKFLOW UNIFICADO                            │
│                   (Executa a cada 5 min)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SELECT * FROM fuu_queue                                     │
│     WHERE status = 'pending'                                    │
│       AND next_attempt_at <= NOW()                              │
│                                                                 │
│  2. Para cada item:                                             │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ a) Buscar cadência (fuu_cadences)                   │     │
│     │ b) Buscar template (fuu_templates)                  │     │
│     │ c) Buscar contexto (histórico, dados contato)       │     │
│     │ d) Verificar se precisa IA ou só template           │     │
│     └─────────────────────────────────────────────────────┘     │
│                          │                                      │
│     ┌────────────────────┼────────────────────┐                 │
│     │                    │                    │                 │
│     ▼                    ▼                    ▼                 │
│  ┌──────────┐      ┌──────────┐        ┌──────────┐             │
│  │ Template │      │ IA Agent │        │  Híbrido │             │
│  │  Apenas  │      │ (Gemini) │        │(IA+Templ)│             │
│  └────┬─────┘      └────┬─────┘        └────┬─────┘             │
│       │                 │                   │                   │
│       └─────────────────┼───────────────────┘                   │
│                         │                                       │
│                         ▼                                       │
│              ┌───────────────────────┐                          │
│              │   ENVIAR MENSAGEM     │                          │
│              │   (WhatsApp/IG/SMS)   │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │   UPDATE fuu_queue    │                          │
│              │   attempt_count += 1  │                          │
│              │   next_attempt_at     │                          │
│              │   (ou status=complete)│                          │
│              └───────────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                   TRIGGERS ESPECIAIS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRIGGER: Verificar Datas Especiais (Diário às 8h)              │
│  ─────────────────────────────────────────────────              │
│  SELECT * FROM fuu_contact_dates                                │
│  WHERE EXTRACT(MONTH FROM date_value) = CURRENT_MONTH           │
│    AND EXTRACT(DAY FROM date_value) = CURRENT_DAY               │
│                                                                 │
│  → INSERT fuu_queue com follow_up_type_code = 'exp_birthday'    │
│                                                                 │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  TRIGGER: Lembretes de Consulta (A cada hora)                   │
│  ─────────────────────────────────────────────                  │
│  SELECT appointments WHERE start_time BETWEEN NOW() AND +24h    │
│  → INSERT fuu_queue com follow_up_type_code = 'clinic_reminder' │
│                                                                 │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  TRIGGER: Faturas Vencendo (Diário)                             │
│  ─────────────────────────────────                              │
│  SELECT invoices WHERE due_date = TODAY + 3 days                │
│  → INSERT fuu_queue com follow_up_type_code = 'finance_reminder'│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Vantagens da Arquitetura

### 1. Escalabilidade
- **Horizontal**: Adicionar novos tipos de follow-up = INSERT na tabela
- **Multi-tenant**: location_id em todas as tabelas
- **Configurável**: Cada cliente pode ter cadências e templates diferentes

### 2. Manutenibilidade
- **Um workflow só**: Não precisa de N workflows para N tipos
- **Configuração no banco**: Alterar comportamento sem editar código
- **Logs centralizados**: Fácil debug e auditoria

### 3. Flexibilidade
- **IA opcional**: Alguns tipos usam só template, outros IA
- **Multi-canal**: Mesmo follow-up pode ter tentativas em canais diferentes
- **Contexto rico**: trigger_data e context_data em JSONB

### 4. Performance
- **Fila desacoplada**: Triggers inserem, workflow processa
- **Índices otimizados**: Queries rápidas
- **Batch processing**: Processa múltiplos por execução

---

## Migração do Sistema Atual

### Passo 1: Criar tabelas FUU
Rodar migration com todas as tabelas acima

### Passo 2: Migrar follow_up_cadencias
```sql
INSERT INTO fuu_cadences (location_id, follow_up_type_code, attempt_number, interval_minutes, channel)
SELECT
  'default' as location_id,
  'sdr_inbound' as follow_up_type_code,
  tentativa as attempt_number,
  intervalo_minutos as interval_minutes,
  canal as channel
FROM follow_up_cadencias;
```

### Passo 3: Migrar n8n_schedule_tracking para fuu_queue
```sql
INSERT INTO fuu_queue (location_id, contact_id, follow_up_type_code, attempt_count, status)
SELECT
  location_id,
  unique_id as contact_id,
  'sdr_inbound' as follow_up_type_code,
  follow_up_count as attempt_count,
  CASE WHEN ativo THEN 'pending' ELSE 'completed' END as status
FROM n8n_schedule_tracking
WHERE ativo = true;
```

### Passo 4: Atualizar workflow Follow Up Eterno
Substituir queries antigas pelas novas usando fuu_queue

---

## Próximos Passos

1. [ ] Criar migration SQL com todas as tabelas
2. [ ] Popular fuu_follow_up_types com tipos iniciais
3. [ ] Migrar dados existentes
4. [ ] Criar workflow unificado no n8n
5. [ ] Criar triggers para cada tipo de follow-up
6. [ ] Testar com um cliente piloto
7. [ ] Documentar configuração por cliente

---

## Considerações Técnicas

### Rate Limiting
- Implementar limite de mensagens por minuto por location
- Evitar bloqueio por spam em WhatsApp

### Horário Comercial
- Respeitar horário de envio (8h-20h por padrão)
- Configurável por location

### Opt-out
- Respeitar DND (Do Not Disturb) do contato
- Marcar como cancelled se contato pedir para parar

### Priorização
- Follow-ups financeiros têm prioridade sobre experiência
- Lembretes de consulta têm prioridade sobre SDR
