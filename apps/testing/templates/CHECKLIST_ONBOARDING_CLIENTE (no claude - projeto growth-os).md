# Checklist de Onboarding - Novo Cliente

> Informações necessárias para criar um agente

---

## 1. Identificação GHL

| Campo | Valor | Onde encontrar |
|-------|-------|----------------|
| Location ID | | GHL → Settings → Business Info → Location ID |
| Calendar ID | | GHL → Calendars → Settings do calendário |
| API Key | | GHL → Settings → API Keys (se precisar) |

---

## 2. Dados do Negócio

| Campo | Valor |
|-------|-------|
| Nome do Negócio | |
| Nome do Expert/Médico | |
| Especialidade | |
| Nome do Método (se houver) | |
| Produto/Serviço principal | |
| Público-alvo | |

---

## 3. Equipe de Vendas

| Campo | Valor |
|-------|-------|
| Quem é a persona do chat? | (Ex: Isabella, Larissa, o próprio Expert) |
| Quem fecha a venda? | (Mesmo do chat ou closer separado?) |
| Nome do closer | |
| Calendar do closer | |

---

## 4. Modelo de Venda

### Escolha o tipo:

- [ ] **Tipo A: Pagamento Antecipado**
  - Lead paga ANTES de agendar
  - Gera link de cobrança no chat
  - Exemplo: Instituto Amare (Dr. Luiz)

- [ ] **Tipo B: Closer Separado**
  - Lead agenda call com closer
  - Closer apresenta e fecha
  - NÃO gera cobrança no chat
  - Exemplo: Dr. Alberto (Jean Pierre fecha)

- [ ] **Tipo C: Agendamento Direto**
  - Lead agenda direto
  - Pagamento na clínica/consultório

---

## 5. Valores (se Tipo A)

| Campo | Valor |
|-------|-------|
| Valor à vista | R$ |
| Valor parcelado | R$ |
| Parcelamento | x de R$ |

---

## 6. Endereços/Unidades

| Unidade | Endereço | Calendar ID |
|---------|----------|-------------|
| | | |
| | | |
| Online (se houver) | Telemedicina | |

---

## 7. Horário de Funcionamento

| Dia | Horário |
|-----|---------|
| Segunda a Sexta | |
| Sábado | |
| Domingo | |

---

## 8. Tom e Personalidade

| Pergunta | Resposta |
|----------|----------|
| Como o expert fala? (formal/casual/técnico) | |
| Expressões típicas que usa | |
| O que NUNCA pode falar? | |
| Usa emoji? Qual estilo? | |

---

## 9. Fluxo de Vendas

### Perguntas-chave do Discovery:

1.
2.
3.

### Objeções mais comuns:

| Objeção | Como responder |
|---------|----------------|
| "Quanto custa?" | |
| "Vou pensar" | |
| "Já tentei antes" | |
| | |

### Diferenciais para mencionar:

1.
2.
3.

---

## 10. Conteúdos (se houver)

| Tipo | Link/Descrição |
|------|----------------|
| Vídeo explicativo | |
| Prova social | |
| Depoimentos | |

---

## 11. Regras Específicas

### Escalação para humano quando:

- [ ] Pedido explícito
- [ ] Frustração (3+ msgs)
- [ ] Negociação de preço
- [ ] Dúvidas médicas específicas
- [ ] Outro: _______________

### Proibições específicas:

- [ ] Não dar diagnóstico
- [ ] Não revelar valor de tratamentos
- [ ] Não usar apelidos
- [ ] Outro: _______________

---

## 12. Modos Necessários

Quais modos o agente precisa?

- [ ] `sdr_inbound` - Lead de anúncio/formulário
- [ ] `social_seller_instagram` - Prospecção Instagram
- [ ] `followuper` - Reengajamento
- [ ] `objection_handler` - Objeções
- [ ] `scheduler` - Agendamento (após pagamento)
- [ ] `concierge` - Pós-agendamento

---

## 13. Integrações

| Sistema | Usa? | Configuração |
|---------|------|--------------|
| Asaas (cobrança) | [ ] Sim [ ] Não | |
| WhatsApp | [ ] Sim [ ] Não | |
| Instagram | [ ] Sim [ ] Não | |

---

## Resumo para Criar o Agente

```
LOCATION_ID:
AGENT_NAME:
VERSION: 1.0
CLOSER:
CALENDAR_ID:
TIPO: [ ] A (pagamento) [ ] B (closer) [ ] C (direto)
PERSONA:
MODOS:
```

---

## Próximos Passos

1. [ ] Preencher este checklist
2. [ ] Coletar kickoff/call de onboarding (se disponível)
3. [ ] Copiar `TEMPLATE_AGENT_VERSION.sql`
4. [ ] Substituir placeholders
5. [ ] Criar prompts por modo
6. [ ] Executar SQL no Supabase
7. [ ] Testar no n8n
