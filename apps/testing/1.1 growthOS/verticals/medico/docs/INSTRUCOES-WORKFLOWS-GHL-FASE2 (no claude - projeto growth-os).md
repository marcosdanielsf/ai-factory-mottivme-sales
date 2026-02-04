# INSTRUÇÕES - Workflows GHL (FASE 2)

> **Para:** Equipe de implementação
> **Location:** Dr Thauan (ID: Rre0WqSlmAPmIrURgiMf)
> **Pré-requisito:** Ter concluído os 3 workflows da Fase 1
> **Data:** 2026-01-16

---

## COMO ACESSAR

1. Acesse: https://app.gohighlevel.com
2. Faça login com suas credenciais
3. No menu lateral, selecione a **Location: Dr Thauan**
4. Clique em **Automation** (ícone de raio) no menu lateral
5. Clique em **Workflows**
6. Clique no botão **+ Create Workflow** (canto superior direito)
7. Selecione **Start from Scratch**

---

## WORKFLOW 4: NOVO LEAD (BOAS-VINDAS)

### Objetivo
Quando um novo lead entra (formulário, landing page, etc.), enviar mensagem de boas-vindas e adicionar ao pipeline.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF01 - Novo Lead`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Form Submitted**
3. Configure:
   - **Workflow Trigger Name:** Formulário Preenchido
   - **Form:** Selecione TODOS os formulários (ou os específicos de captação)
4. Clique em **Save Trigger**

#### ETAPA 3 - Adicionar Tag de Origem
1. Clique no **+** abaixo do trigger
2. Selecione **Add Tag**
3. Configure:
   - **Tag:** `origem:site` (ou `origem:landing-page` dependendo do formulário)
4. Clique em **Save Action**

#### ETAPA 4 - Adicionar ao Pipeline
1. Clique no **+**
2. Selecione **Add to Pipeline**
3. Configure:
   - **Pipeline:** `Captação Marketing`
   - **Stage:** `Novo Lead`
4. Clique em **Save Action**

#### ETAPA 5 - Esperar 1 minuto
1. Clique no **+**
2. Selecione **Wait**
3. Configure:
   - **Wait for:** `1` minute
4. Clique em **Save Action**

#### ETAPA 6 - Mensagem de Boas-Vindas
1. Clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}! 👋

   Obrigado pelo seu interesse na clínica do Dr. Thauan!

   Recebemos sua solicitação e em breve nossa equipe entrará em contato para agendar sua consulta.

   Enquanto isso, posso ajudar com alguma dúvida?

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 7 - Notificar Equipe (Interno)
1. Clique no **+**
2. Selecione **Internal Notification**
3. Configure:
   - **Send To:** Selecione o usuário responsável pelo atendimento
   - **Message:** `🆕 Novo lead: {{contact.full_name}} - {{contact.phone}} - Origem: Formulário`
4. Clique em **Save Action**

#### ETAPA 8 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

---

## WORKFLOW 5: PÓS-CONSULTA (PESQUISA DE SATISFAÇÃO)

### Objetivo
Após a consulta, enviar agradecimento e pesquisa de satisfação.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF03 - Pós-Consulta`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Appointment Status**
3. Configure:
   - **Workflow Trigger Name:** Consulta Realizada
   - **Appointment Status:** `Showed` (Compareceu)
   - **In Calendar:** Selecione TODOS os calendários
4. Clique em **Save Trigger**

#### ETAPA 3 - Atualizar Status no Pipeline
1. Clique no **+**
2. Selecione **Update Opportunity** (ou **Move in Pipeline**)
3. Configure:
   - **Pipeline:** `Jornada do Paciente`
   - **Stage:** `Paciente Ativo`
4. Clique em **Save Action**

#### ETAPA 4 - Adicionar Tag
1. Clique no **+**
2. Selecione **Add Tag**
3. Configure:
   - **Tag:** `status:paciente-ativo`
4. Clique em **Save Action**

#### ETAPA 5 - Esperar 2 horas
1. Clique no **+**
2. Selecione **Wait**
3. Configure:
   - **Wait for:** `2` hours
4. Clique em **Save Action**

#### ETAPA 6 - Mensagem de Agradecimento + NPS
1. Clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}! 😊

   Obrigado por confiar no Dr. Thauan para cuidar da sua saúde!

   Sua opinião é muito importante para nós. Em uma escala de 0 a 10, qual a probabilidade de você recomendar nossa clínica para um amigo?

   Responda com o número de 0 a 10.

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 7 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

---

## WORKFLOW 6: LEMBRETE DE RETORNO

### Objetivo
Lembrar o paciente de agendar retorno quando estiver próximo da data recomendada.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF04 - Lembrete de Retorno`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Date/Time Trigger**
3. Configure:
   - **Workflow Trigger Name:** Data de Retorno Próxima
   - **Trigger Type:** `Custom Date Field`
   - **Custom Field:** `Próximo Retorno Sugerido`
   - **Trigger:** `7` days `before` (7 dias antes da data)
   - **Time:** `10:00`
4. Clique em **Save Trigger**

#### ETAPA 3 - Mensagem de Lembrete
1. Clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}! 👋

   Estamos passando para lembrar que está chegando a hora do seu retorno com o Dr. Thauan.

   Manter suas consultas em dia é essencial para cuidar da sua saúde! 💙

   Quer agendar agora? Responda com o melhor dia e horário para você.

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 4 - Adicionar Tag
1. Clique no **+**
2. Selecione **Add Tag**
3. Configure:
   - **Tag:** `comunicacao:lembrete-retorno-enviado`
4. Clique em **Save Action**

#### ETAPA 5 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

**IMPORTANTE:** Este workflow só funciona se o campo "Próximo Retorno Sugerido" for preenchido após cada consulta. Orientar a equipe a sempre preencher esse campo.

---

## WORKFLOW 7: REATIVAÇÃO DE PACIENTE INATIVO

### Objetivo
Reengajar pacientes que não aparecem há mais de 6 meses.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF06 - Reativação Paciente Inativo`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Date/Time Trigger**
3. Configure:
   - **Workflow Trigger Name:** Paciente Inativo 6 meses
   - **Trigger Type:** `Custom Date Field`
   - **Custom Field:** `Data Última Consulta`
   - **Trigger:** `180` days `after` (180 dias após)
   - **Time:** `10:00`
4. Clique em **Save Trigger**

#### ETAPA 3 - Adicionar Tag de Inativo
1. Clique no **+**
2. Selecione **Add Tag**
3. Configure:
   - **Tag:** `status:paciente-inativo`
4. Clique em **Save Action**

#### ETAPA 4 - Primeira Mensagem de Reativação
1. Clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}, tudo bem? 😊

   Faz tempo que não nos vemos por aqui! Sentimos sua falta.

   Está tudo bem com você? Lembre-se que manter os cuidados com a saúde em dia é muito importante.

   Se precisar agendar uma consulta, é só responder esta mensagem.

   Carinhosamente,
   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 5 - Esperar 7 dias
1. Clique no **+**
2. Selecione **Wait**
3. Configure:
   - **Wait for:** `7` days
4. Clique em **Save Action**

#### ETAPA 6 - Condição: Respondeu?
1. Clique no **+**
2. Selecione **If/Else**
3. Configure a condição:
   - **IF:** Contact > Last Reply > is within `7` days
   - (Se respondeu, não faz nada - fim do workflow)
   - **ELSE:** Continua para próxima mensagem

#### ETAPA 7 - Segunda Mensagem (no branch ELSE)
1. No branch ELSE, clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   {{contact.first_name}}, ainda estamos por aqui! 💙

   Separamos um horário especial para você esta semana. Que tal colocar sua saúde em dia?

   Responda SIM que entramos em contato para agendar.

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 8 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

**IMPORTANTE:** O campo "Data Última Consulta" precisa ser atualizado automaticamente. Isso pode ser feito no WF03 (Pós-Consulta) adicionando uma ação de "Update Contact Field".

---

## WORKFLOW 8: LISTA DE ESPERA

### Objetivo
Quando uma consulta é cancelada, notificar pacientes na lista de espera.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF08 - Lista de Espera`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Appointment Status**
3. Configure:
   - **Workflow Trigger Name:** Consulta Cancelada
   - **Appointment Status:** `Cancelled`
   - **In Calendar:** Selecione TODOS os calendários
4. Clique em **Save Trigger**

#### ETAPA 3 - Notificar Equipe
1. Clique no **+**
2. Selecione **Internal Notification**
3. Configure:
   - **Send To:** Usuário responsável pelo agendamento
   - **Message:**
   ```
   ⚠️ CANCELAMENTO

   Paciente: {{contact.full_name}}
   Data: {{appointment.start_date}}
   Horário: {{appointment.start_time}}
   Calendário: {{appointment.calendar_name}}

   Verificar lista de espera para preencher o horário!
   ```
4. Clique em **Save Action**

#### ETAPA 4 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

**NOTA SOBRE LISTA DE ESPERA:**
O GHL não tem uma funcionalidade nativa de "lista de espera" automatizada. Para implementar completamente:

1. **Opção Manual:** A equipe recebe a notificação e liga para pacientes na espera
2. **Opção Semi-Automática:** Criar um pipeline "Lista de Espera" onde pacientes interessados em encaixes ficam aguardando. Quando houver cancelamento, a equipe move manualmente o primeiro da fila

---

## CHECKLIST FINAL - FASE 2

Após criar os 5 workflows, confirme:

- [ ] **WF01 - Novo Lead**
  - [ ] Trigger: Form Submitted
  - [ ] Tag de origem adicionada
  - [ ] Adicionado ao pipeline
  - [ ] Mensagem de boas-vindas
  - [ ] Notificação interna
  - [ ] Workflow PUBLICADO

- [ ] **WF03 - Pós-Consulta**
  - [ ] Trigger: Appointment Status = Showed
  - [ ] Status atualizado no pipeline
  - [ ] Mensagem NPS após 2h
  - [ ] Workflow PUBLICADO

- [ ] **WF04 - Lembrete de Retorno**
  - [ ] Trigger: Custom Date Field (7 dias antes)
  - [ ] Mensagem de lembrete
  - [ ] Workflow PUBLICADO

- [ ] **WF06 - Reativação Paciente Inativo**
  - [ ] Trigger: Custom Date Field (180 dias após)
  - [ ] 2 mensagens de reativação
  - [ ] Condição If/Else funcionando
  - [ ] Workflow PUBLICADO

- [ ] **WF08 - Lista de Espera**
  - [ ] Trigger: Appointment Status = Cancelled
  - [ ] Notificação interna configurada
  - [ ] Workflow PUBLICADO

---

## CAMPOS QUE PRECISAM SER PREENCHIDOS

Para os workflows funcionarem corretamente, a equipe precisa manter estes campos atualizados:

| Campo | Quando preencher | Quem preenche |
|-------|------------------|---------------|
| Data de Nascimento | No cadastro do paciente | Recepção |
| Próximo Retorno Sugerido | Após cada consulta | Médico/Recepção |
| Data Última Consulta | Automático (WF03) ou manual | Sistema/Recepção |
| Convênio | No cadastro | Recepção |

---

## RESUMO DOS 8 WORKFLOWS

| # | Nome | Trigger | Função |
|---|------|---------|--------|
| 01 | Novo Lead | Form Submitted | Boas-vindas + Pipeline |
| 02 | Confirmação Consulta | Appointment Booked | Lembretes (24h, 2h) |
| 03 | Pós-Consulta | Appointment Showed | NPS + Status |
| 04 | Lembrete Retorno | Date Field (7d antes) | Lembrar retorno |
| 05 | Aniversário | Date Field (no dia) | Parabéns + Desconto |
| 06 | Reativação Inativo | Date Field (180d após) | Reengajar paciente |
| 07 | No-Show Recovery | Appointment No Show | Recuperar falta |
| 08 | Lista de Espera | Appointment Cancelled | Notificar equipe |

---

## ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

**Fase 1 (Essenciais):**
1. WF02 - Confirmação de Consulta
2. WF07 - No-Show Recovery
3. WF05 - Aniversário

**Fase 2 (Completos):**
4. WF01 - Novo Lead
5. WF03 - Pós-Consulta
6. WF04 - Lembrete de Retorno
7. WF06 - Reativação Paciente Inativo
8. WF08 - Lista de Espera

---

*Documento criado em 2026-01-16*
*Versão: 1.0*
