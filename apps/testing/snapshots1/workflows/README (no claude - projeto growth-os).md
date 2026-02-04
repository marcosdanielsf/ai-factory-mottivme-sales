# Workflows GHL - Snapshot Universal Mentores

> Instrucoes detalhadas para criar os 8 workflows manualmente no GoHighLevel
> Versao: 1.0.0 | Janeiro 2026

---

## Visao Geral

Este documento contem instrucoes passo-a-passo para criar os workflows do snapshot universal. Os workflows devem ser criados **manualmente** no GHL pois a API nao suporta criacao automatizada de workflows.

### Workflows a Criar:
1. WF01 - Novo Lead Inbound
2. WF02 - Prospeccao Outbound (Social Selling)
3. WF03 - Qualificacao BANT
4. WF04 - Concierge Protocol
5. WF05 - No-Show Recovery
6. WF06 - Pos-Call Fechamento
7. WF07 - Reativacao Base (Dean Jackson)
8. WF08 - Indicacao Pos-Venda

---

## WF01 - Novo Lead Inbound

**Trigger:** Form Submitted / Contact Created
**Objetivo:** Processar novos leads vindos de formularios ou API

### Passos:

```
1. [TRIGGER] Form Submitted
   - Qualquer formulario da location

2. [ACTION] Create/Update Contact
   - Merge se existir

3. [ACTION] Add Tag
   - Tag baseada no formulario:
     - Form Webinar → origem:webinario-ao-vivo
     - Form Aplicacao → origem:aplicacao-high-ticket
     - Form Lead Magnet → origem:lead-magnet

4. [ACTION] Move to Pipeline Stage
   - Pipeline: AQUISICAO
   - Stage: Novo Lead

5. [ACTION] Update Custom Field
   - Ativar_IA = Sim
   - FUP_Counter = 0

6. [ACTION] Send WhatsApp
   - Template: 01 - Primeiro Contato

7. [WAIT] 4 hours

8. [IF/ELSE] Contact Replied?
   - IF YES: Go to End
   - IF NO: Continue

9. [ACTION] Send WhatsApp
   - Template: Follow-up 1 (criar)
   - "Oi {{name}}, conseguiu ver minha mensagem?"

10. [ACTION] Add Tag
    - auto:follow-up-1

11. [ACTION] Increment Field
    - FUP_Counter +1

12. [WAIT] 24 hours

13. [IF/ELSE] Contact Replied?
    - IF YES: Go to End
    - IF NO: Continue

14. [ACTION] Send SMS
    - "{{name}}, tentei contato no WhatsApp. Pode responder la?"

15. [ACTION] Add Tag
    - auto:follow-up-2

16. [WAIT] 48 hours

17. [IF/ELSE] Contact Replied?
    - IF YES: Go to End
    - IF NO: Continue

18. [ACTION] Add Tag
    - status:cold-lead

19. [ACTION] Send Internal Notification
    - "Lead frio: {{name}} - sem resposta apos 3 tentativas"

20. [END]
```

---

## WF02 - Prospeccao Outbound (Social Selling)

**Trigger:** Webhook
**Webhook URL:** /webhook/ghl-new-lead
**Objetivo:** Processar leads vindos do n8n via Social Selling

### Passos:

```
1. [TRIGGER] Webhook Received
   - URL: Configurar no GHL

2. [ACTION] Add Tag
   - origem:social-selling-instagram

3. [ACTION] Move to Pipeline Stage
   - Pipeline: AQUISICAO
   - Stage: Prospect

4. [ACTION] Update Custom Field
   - Funil_Origem = Social Selling
   - Ativar_IA = Sim

5. [WAIT] Until Contact Replies
   - Max wait: 30 days

6. [IF/ELSE] Contact Replied?
   - IF YES: Continue
   - IF NO: End (lead frio)

7. [ACTION] Move to Pipeline Stage
   - Stage: Engajado

8. [ACTION] Add Tag
   - funil:engaged

9. [END]
```

---

## WF03 - Qualificacao BANT

**Trigger:** Contact Replied (primeiro reply)
**Objetivo:** Qualificar leads via BANT

### Passos:

```
1. [TRIGGER] Contact Replied
   - First reply only

2. [IF/ELSE] Custom Field Funil_Origem exists?
   - IF NO: Skip workflow
   - IF YES: Continue

3. [WAIT] 2 minutes
   - Dar tempo para processar

4. [ACTION] Send WhatsApp
   - Template: 02 - Qualificacao BANT

5. [ACTION] Add Tag
   - funil:engaged

6. [WAIT] Until Contact Replies
   - Max: 48 hours

7. [ACTION] HTTP Request (Webhook)
   - Method: POST
   - URL: {{webhook_classify_lead}}
   - Body: { contact_id, last_message }

8. [WAIT] 10 seconds
   - Aguardar processamento IA

9. [IF/ELSE] Lead_Score >= 70?
   - IF YES: Go to Hot Lead
   - IF NO: Check Warm

10. [BRANCH: Hot Lead]
    - [ACTION] Add Tag: status:hot-lead
    - [ACTION] Move to Stage: Qualificado
    - [ACTION] Send WhatsApp: Template Agendamento
    - [ACTION] Send Internal Notification: "HOT LEAD: {{name}}"
    - Go to End

11. [IF/ELSE] Lead_Score >= 40?
    - IF YES: Go to Warm Lead
    - IF NO: Go to Cold Lead

12. [BRANCH: Warm Lead]
    - [ACTION] Add Tag: status:warm-lead
    - [ACTION] Continue nurturing sequence
    - Go to End

13. [BRANCH: Cold Lead]
    - [ACTION] Add Tag: status:cold-lead
    - [ACTION] Add to remarketing list
    - Go to End

14. [END]
```

---

## WF04 - Concierge Protocol

**Trigger:** Appointment Created
**Objetivo:** Confirmar presenca e reduzir no-shows

### Passos:

```
1. [TRIGGER] Appointment Created
   - Qualquer calendario

2. [ACTION] Send WhatsApp (Imediato)
   - Template: 04 - Confirmacao de Call

3. [ACTION] Add Tag
   - auto:concierge-enviado
   - funil:scheduled

4. [ACTION] Move to Pipeline Stage
   - Pipeline: AQUISICAO
   - Stage: Agendado

5. [ACTION] Update Custom Field
   - Show_Status = Pendente

6. [WAIT] Until 24 hours before appointment

7. [ACTION] Send WhatsApp
   - Template: 05 - Lembrete 24h

8. [ACTION] Add Tag
   - auto:lembrete-24h

9. [WAIT] 4 hours for reply

10. [IF/ELSE] Reply contains "SIM"?
    - IF YES: Update Show_Status = Confirmado, Add Tag evento:confirmou-call
    - IF NO: Continue

11. [WAIT] Until 3 hours before appointment

12. [ACTION] Send WhatsApp
    - Template: 06 - Lembrete 3h

13. [ACTION] Add Tag
    - auto:lembrete-3h

14. [WAIT] Until 30 minutes before appointment

15. [ACTION] Send WhatsApp
    - Template: 07 - Lembrete 30min

16. [ACTION] Add Tag
    - auto:lembrete-30min

17. [END]
```

---

## WF05 - No-Show Recovery (7 toques / 15 dias)

**Trigger:** Appointment Status = No Show
**Objetivo:** Recuperar leads que faltaram

### Passos:

```
1. [TRIGGER] Appointment Status Changed
   - Status: No Show

2. [ACTION] Add Tag
   - evento:no-show-1
   - funil:no-show

3. [ACTION] Update Custom Field
   - Show_Status = No-Show

4. [ACTION] Increment Field
   - noshow_count +1 (se usar conversation_state)

5. [ACTION] Send WhatsApp (Imediato)
   - Template: 08 - No-Show Toque 1

6. [WAIT] 24 hours

7. [IF/ELSE] Contact Replied or Rescheduled?
   - IF YES: End
   - IF NO: Continue

8. [ACTION] Send WhatsApp
   - Template: 09 - No-Show Toque 2

9. [ACTION] Add Tag
   - evento:no-show-2

10. [WAIT] 48 hours

11. [IF/ELSE] Contact Replied?
    - IF YES: End
    - IF NO: Continue

12. [ACTION] Send WhatsApp
    - Template: 10 - No-Show Toque 3

13. [ACTION] Add Tag
    - evento:no-show-3

14. [WAIT] 24 hours

15. [IF/ELSE] Contact Replied?
    - IF YES: End
    - IF NO: Continue

16. [ACTION] Create Task
    - Title: "Ligar para no-show: {{name}}"
    - Assign to: Sales Team

17. [WAIT] 3 days

18. [IF/ELSE] Contact Replied or Rescheduled?
    - IF YES: End
    - IF NO: Continue

19. [ACTION] Send Email
    - Subject: "Ultima tentativa de contato"
    - Body: Template ultima tentativa

20. [WAIT] 7 days

21. [IF/ELSE] Contact Replied?
    - IF YES: End
    - IF NO: Continue

22. [ACTION] Add Tag
    - status:cold-lead

23. [ACTION] Move to Pipeline Stage
    - Stage: Perdido

24. [END]
```

---

## WF06 - Pos-Call Fechamento

**Trigger:** Appointment Status = Showed / Completed
**Objetivo:** Follow-up apos call realizada

### Passos:

```
1. [TRIGGER] Appointment Status Changed
   - Status: Showed / Completed

2. [ACTION] Update Custom Field
   - Show_Status = Compareceu

3. [ACTION] Add Tag
   - funil:showed

4. [ACTION] Move to Pipeline Stage
   - Stage: Compareceu

5. [WAIT] 2 hours

6. [ACTION] Send WhatsApp
   - Template: 12 - Pos-Call Agradecimento

7. [IF/ELSE] Tag "evento:proposta-enviada" exists?
   - IF NO: End (call de discovery apenas)
   - IF YES: Continue follow-up

8. [WAIT] 48 hours

9. [IF/ELSE] Tag "evento:contrato-assinado" exists?
   - IF YES: Go to Won Flow
   - IF NO: Continue

10. [ACTION] Send WhatsApp
    - Template: 13 - Follow-up Proposta D+2

11. [WAIT] 72 hours

12. [IF/ELSE] Tag "evento:contrato-assinado" exists?
    - IF YES: Go to Won Flow
    - IF NO: Continue

13. [ACTION] Send WhatsApp
    - Template: 14 - Follow-up Proposta D+5

14. [ACTION] Create Task
    - "Ligar para {{name}} - proposta pendente ha 5 dias"

15. [ACTION] Send Internal Notification
    - "Proposta pendente: {{name}} - agendar call de fechamento"

16. [BRANCH: Won Flow]
    - [ACTION] Add Tag: funil:won, evento:contrato-assinado
    - [ACTION] Move to Stage: Ganho
    - [ACTION] Send Internal Notification: "VENDA FECHADA: {{name}}"
    - [ACTION] Trigger WF Onboarding (se existir)

17. [END]
```

---

## WF07 - Reativacao Base (Dean Jackson 9-Word)

**Trigger:** Scheduled (Cron)
**Schedule:** 0 9 * * 1-5 (9h, dias uteis)
**Objetivo:** Reativar leads inativos

### Passos:

```
1. [TRIGGER] Schedule
   - Time: 09:00
   - Days: Monday-Friday

2. [ACTION] Find Contacts
   - Conditions:
     - Last activity > 7 days ago
     - NOT tag: cliente-ativo
     - NOT tag: funil:won
     - NOT tag: funil:lost
     - Pipeline Stage: NOT Ganho, NOT Perdido
     - FUP_Counter < 5

3. [FOR EACH] Contact in list

4. [ACTION] Send WhatsApp
   - Template: 11 - Reativacao 9-Word
   - Personalizar {{dor_principal}}

5. [ACTION] Add Tag
   - auto:reativacao

6. [ACTION] Increment Field
   - FUP_Counter +1

7. [IF/ELSE] FUP_Counter >= 5?
   - IF YES:
     - Add Tag: status:cold-lead
     - Move to Stage: Perdido
   - IF NO: Continue

8. [END FOR EACH]

9. [END]
```

**Nota:** Este workflow requer uso da funcao "Loop" ou criacao via API externa que busca contatos e dispara mensagens individualmente.

---

## WF08 - Indicacao Pos-Venda

**Trigger:** Date-based (30 dias apos virar cliente)
**Objetivo:** Pedir indicacoes de clientes satisfeitos

### Passos:

```
1. [TRIGGER] Date Field
   - Field: Date Won (ou data de criacao do deal ganho)
   - Offset: +30 days

2. [IF/ELSE] Contact is in Pipeline ENTREGA?
   - IF NO: End
   - IF YES: Continue

3. [ACTION] Send WhatsApp
   - "Oi {{name}}! Ja faz 1 mes que estamos trabalhando juntos.
     De 0 a 10, quanto voce indicaria nosso trabalho?"

4. [WAIT] Until Reply
   - Max: 7 days

5. [IF/ELSE] Reply is number >= 8?
   - IF YES: Go to Promoter Flow
   - IF NO: Check Detractor

6. [IF/ELSE] Reply is number <= 6?
   - IF YES: Go to Detractor Flow
   - IF NO: End (neutro)

7. [BRANCH: Promoter Flow]
   - [ACTION] Add Tag: status:nps-promotor
   - [ACTION] Send WhatsApp:
     "Fico muito feliz! Voce conhece alguem que poderia se beneficiar tambem?
      Se indicar, tenho uma surpresa especial pra voce!"
   - [ACTION] Create Opportunity in Pipeline INDICACAO
     - Stage: Pedido Feito
   - [ACTION] Create Task: "Acompanhar indicacao de {{name}}"

8. [BRANCH: Detractor Flow]
   - [ACTION] Add Tag: status:nps-detrator
   - [ACTION] Send Internal Notification:
     "ALERTA: Cliente insatisfeito - {{name}} deu nota {{nota}}"
   - [ACTION] Create Task: "URGENTE: Ligar para {{name}} - NPS baixo"

9. [END]
```

---

## Webhooks para Integracao n8n

Configure os seguintes webhooks no GHL para receber dados do n8n:

| Webhook | URL | Uso |
|---------|-----|-----|
| Novo Lead | `/webhook/ghl-new-lead` | Receber leads do Social Selling |
| Mensagem | `/webhook/ghl-message` | Notificar nova mensagem |
| Appointment | `/webhook/ghl-appointment` | Notificar agendamento |
| Classify | `/webhook/classify-lead` | Enviar para classificacao IA |

### Exemplo de Configuracao HTTP Request:

```
Method: POST
URL: https://seu-n8n.com/webhook/ghl-message
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {{sua_api_key}}
Body:
{
  "location_id": "{{location.id}}",
  "contact_id": "{{contact.id}}",
  "contact_name": "{{contact.first_name}}",
  "contact_phone": "{{contact.phone}}",
  "message": "{{last_message}}",
  "timestamp": "{{current_time}}"
}
```

---

## Dicas de Implementacao

1. **Teste cada workflow individualmente** antes de ativar todos
2. **Use um contato de teste** com seu proprio numero
3. **Configure notificacoes internas** para monitorar funcionamento
4. **Ajuste os delays** conforme seu volume de leads
5. **Revise templates** semanalmente baseado em respostas
6. **Monitore metricas** de abertura, resposta e conversao

---

## Suporte

Duvidas sobre implementacao? Entre em contato:
- Email: suporte@mottivme.com
- WhatsApp: (11) 99999-9999
