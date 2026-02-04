# Checklist de Ativacao - Snapshot Universal Mentores

> Guia passo-a-passo para ativar o snapshot em uma nova location
> Versao: 1.0.0 | Janeiro 2026

---

## Pre-Requisitos

Antes de comecar, certifique-se de ter:

- [ ] Acesso admin a Location no GHL
- [ ] Location ID da conta
- [ ] Node.js instalado (v18+)
- [ ] Acesso ao Supabase (se usar IA)
- [ ] Numero WhatsApp Business conectado
- [ ] API Key da agencia GHL

---

## Fase 1: Aplicar Snapshot (15 min)

### 1.1 Executar Script

```bash
# No terminal
cd ~/snapshots
node ghl-snapshot-mentores-v1.js <LOCATION_ID>

# Exemplo:
node ghl-snapshot-mentores-v1.js hHTtB7iZ4EUqQ3L2yQZK
```

### 1.2 Verificar Resultado

- [ ] 25 Custom Fields criados
- [ ] 3 Pipelines criados
- [ ] 57 Tags criadas
- [ ] 4 Calendarios criados (ou instrucoes para criar manual)

### 1.3 Salvar Output

```bash
# Output salvo automaticamente em:
/tmp/ghl-snapshot-mentores-<LOCATION_ID>.json
```

---

## Fase 2: Configurar Calendarios (30 min)

### 2.1 Discovery Call

- [ ] Acessar Calendars no GHL
- [ ] Criar/Editar "Discovery Call"
- [ ] Configurar:
  - Duracao: 30 min
  - Buffer: 10 min
  - Disponibilidade: Seg-Sex 9h-18h
- [ ] Conectar Zoom/Google Meet
- [ ] Copiar link do calendario

### 2.2 Sessao Estrategica

- [ ] Criar "Sessao Estrategica"
- [ ] Configurar:
  - Duracao: 60 min
  - Buffer: 15 min
  - Disponibilidade: Seg-Sex 9h-18h
- [ ] Conectar Zoom/Google Meet
- [ ] Copiar link do calendario

### 2.3 Proposta

- [ ] Criar "Proposta"
- [ ] Configurar:
  - Duracao: 45 min
  - Buffer: 15 min
  - Disponibilidade: Seg-Sex 10h-19h
- [ ] Copiar link do calendario

### 2.4 Onboarding

- [ ] Criar "Onboarding"
- [ ] Configurar:
  - Duracao: 60 min
  - Buffer: 30 min
  - Disponibilidade: Seg-Qui 10h-17h
- [ ] Copiar link do calendario

---

## Fase 3: Criar Workflows (2-3 horas)

Seguir instrucoes em `workflows/README.md`

### 3.1 WF01 - Novo Lead Inbound

- [ ] Criar workflow
- [ ] Configurar trigger: Form Submitted
- [ ] Adicionar acoes conforme documentacao
- [ ] Testar com contato de teste
- [ ] Ativar workflow

### 3.2 WF02 - Prospeccao Outbound

- [ ] Criar workflow
- [ ] Configurar trigger: Webhook
- [ ] Anotar URL do webhook
- [ ] Testar com request manual
- [ ] Ativar workflow

### 3.3 WF03 - Qualificacao BANT

- [ ] Criar workflow
- [ ] Configurar trigger: Contact Replied
- [ ] Configurar HTTP Request para IA (se usar)
- [ ] Testar fluxo completo
- [ ] Ativar workflow

### 3.4 WF04 - Concierge Protocol

- [ ] Criar workflow
- [ ] Configurar trigger: Appointment Created
- [ ] Configurar delays (24h, 3h, 30min)
- [ ] Testar com agendamento de teste
- [ ] Ativar workflow

### 3.5 WF05 - No-Show Recovery

- [ ] Criar workflow
- [ ] Configurar trigger: Appointment Status = No Show
- [ ] Configurar sequencia de 7 toques
- [ ] Testar fluxo
- [ ] Ativar workflow

### 3.6 WF06 - Pos-Call Fechamento

- [ ] Criar workflow
- [ ] Configurar trigger: Appointment Status = Showed
- [ ] Configurar follow-ups D+2 e D+5
- [ ] Testar fluxo
- [ ] Ativar workflow

### 3.7 WF07 - Reativacao Base

- [ ] Criar workflow
- [ ] Configurar trigger: Schedule (9h, dias uteis)
- [ ] Configurar filtros de contato
- [ ] Testar com lista pequena
- [ ] Ativar workflow

### 3.8 WF08 - Indicacao Pos-Venda

- [ ] Criar workflow
- [ ] Configurar trigger: Date Field (+30 dias)
- [ ] Configurar NPS e follow-up
- [ ] Testar fluxo
- [ ] Ativar workflow

---

## Fase 4: Configurar Supabase (30 min)

### 4.1 Executar Migration

```sql
-- No Supabase SQL Editor
-- Copiar conteudo de snapshot_client_configs.sql
-- Executar
```

- [ ] Tabela client_configs criada
- [ ] Tabela conversation_state criada
- [ ] Tabela message_log criada
- [ ] Funcoes auxiliares criadas

### 4.2 Inserir Config do Cliente

```sql
INSERT INTO client_configs (
  location_id,
  client_name,
  nome_empresa,
  tipo_negocio,
  -- ... outros campos
) VALUES (
  '<LOCATION_ID>',
  'Nome do Cliente',
  'Nome da Empresa',
  'mentor',
  -- ...
);
```

- [ ] Config inserida com sucesso
- [ ] Verificar dados no Supabase

---

## Fase 5: Configurar Integracao n8n (1 hora)

### 5.1 Criar Webhook Receivers

- [ ] `/webhook/ghl-new-lead` - Receber novos leads
- [ ] `/webhook/ghl-message` - Receber mensagens
- [ ] `/webhook/ghl-appointment` - Receber agendamentos

### 5.2 Criar Fluxo de Classificacao

- [ ] Fluxo: Receive Message → Classify with AI → Update GHL
- [ ] Conectar ao OpenAI/Claude para classificacao
- [ ] Testar com mensagens reais

### 5.3 Criar Fluxo de Resposta IA

- [ ] Fluxo: Message → Context → Generate Response → Send
- [ ] Configurar prompts personalizados
- [ ] Testar respostas

### 5.4 Anotar URLs dos Webhooks

| Webhook | URL |
|---------|-----|
| New Lead | |
| Message | |
| Appointment | |
| Classify | |

---

## Fase 6: Configurar WhatsApp (30 min)

### 6.1 Conectar Numero

- [ ] Acessar Settings > Integrations > WhatsApp
- [ ] Conectar numero via QR Code ou API
- [ ] Verificar status: Connected

### 6.2 Templates no Meta Business

Templates que precisam aprovacao:

- [ ] Template de Confirmacao (com botoes)
- [ ] Template de Lembrete 24h (com botoes)

### 6.3 Testar Envio

- [ ] Enviar mensagem de teste
- [ ] Verificar recebimento
- [ ] Verificar logs no GHL

---

## Fase 7: Teste End-to-End (1 hora)

### 7.1 Cenario: Novo Lead Inbound

1. [ ] Preencher formulario de teste
2. [ ] Verificar criacao do contato
3. [ ] Verificar tag de origem
4. [ ] Verificar mensagem de boas-vindas
5. [ ] Responder mensagem
6. [ ] Verificar qualificacao BANT
7. [ ] Verificar calculo de score

### 7.2 Cenario: Agendamento

1. [ ] Agendar call de teste
2. [ ] Verificar confirmacao imediata
3. [ ] Verificar lembrete 24h (avanco manual)
4. [ ] Verificar lembrete 3h
5. [ ] Verificar lembrete 30min
6. [ ] Marcar como Showed
7. [ ] Verificar mensagem pos-call

### 7.3 Cenario: No-Show

1. [ ] Criar agendamento de teste
2. [ ] Marcar como No-Show
3. [ ] Verificar sequencia de recovery
4. [ ] Testar reagendamento

### 7.4 Cenario: Proposta

1. [ ] Marcar contato como "proposta enviada"
2. [ ] Verificar follow-up D+2
3. [ ] Verificar follow-up D+5

---

## Fase 8: Documentacao Final (15 min)

### 8.1 Criar Documento do Cliente

- [ ] Location ID:
- [ ] Nome do Cliente:
- [ ] Data de Ativacao:
- [ ] Workflows Ativos:
- [ ] URLs dos Calendarios:
- [ ] Webhooks n8n:

### 8.2 Treinamento

- [ ] Gravar video de overview
- [ ] Enviar documentacao ao cliente
- [ ] Agendar call de treinamento

---

## Troubleshooting

### Problema: Custom Fields nao criados
**Solucao:** Verificar API Key e permissoes da agencia

### Problema: Workflows nao disparam
**Solucao:** Verificar trigger e condicoes

### Problema: WhatsApp nao envia
**Solucao:** Verificar conexao e limite de mensagens

### Problema: IA nao responde
**Solucao:** Verificar webhooks n8n e logs

### Problema: Calendarios sem slots
**Solucao:** Verificar disponibilidade e timezone

---

## Contatos de Suporte

| Tipo | Contato |
|------|---------|
| Suporte Tecnico | suporte@mottivme.com |
| WhatsApp | (11) 99999-9999 |
| Documentacao | docs.mottivme.com |

---

## Checklist Resumido

```
[ ] Fase 1: Aplicar Snapshot (15 min)
[ ] Fase 2: Configurar Calendarios (30 min)
[ ] Fase 3: Criar Workflows (2-3 horas)
[ ] Fase 4: Configurar Supabase (30 min)
[ ] Fase 5: Configurar n8n (1 hora)
[ ] Fase 6: Configurar WhatsApp (30 min)
[ ] Fase 7: Teste End-to-End (1 hora)
[ ] Fase 8: Documentacao Final (15 min)

Tempo Total Estimado: 5-6 horas
```

---

## Proximos Passos Apos Ativacao

1. **Semana 1:** Monitorar metricas diariamente
2. **Semana 2:** Ajustar templates baseado em respostas
3. **Semana 3:** Otimizar delays e sequencias
4. **Mes 1:** Review completo com cliente

---

*Snapshot Universal Mentores v1.0.0 - MOTTIVME*
