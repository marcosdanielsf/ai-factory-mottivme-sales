# INSTRUÇÕES - Criação de Workflows no GoHighLevel

> **Para:** Equipe de implementação
> **Location:** Dr Thauan (ID: Rre0WqSlmAPmIrURgiMf)
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

## WORKFLOW 1: CONFIRMAÇÃO DE CONSULTA

### Objetivo
Enviar mensagens automáticas quando uma consulta é agendada: confirmação imediata, lembrete 24h antes e lembrete 2h antes.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF02 - Confirmação de Consulta`

#### ETAPA 2 - Configurar o Trigger (Gatilho)
1. Clique no bloco **Add New Trigger**
2. Selecione **Appointment Status**
3. Configure:
   - **Workflow Trigger Name:** Consulta Agendada
   - **Appointment Status:** `Booked` (ou "Confirmed" dependendo da versão)
   - **In Calendar:** Selecione TODOS os calendários (Consulta Primeira Vez, Consulta Retorno, Procedimento)
4. Clique em **Save Trigger**

#### ETAPA 3 - Adicionar Ação: Esperar 1 minuto
1. Clique no **+** abaixo do trigger
2. Selecione **Wait**
3. Configure:
   - **Wait for:** `1` minute
4. Clique em **Save Action**

#### ETAPA 4 - Adicionar Ação: Mensagem de Confirmação
1. Clique no **+** abaixo do Wait
2. Selecione **Send SMS** (ou **WhatsApp** se configurado)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}! ✅

   Sua consulta foi confirmada:
   📅 Data: {{appointment.start_date}}
   ⏰ Horário: {{appointment.start_time}}
   👨‍⚕️ Profissional: {{appointment.calendar_name}}

   Para remarcar ou cancelar, responda esta mensagem.

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 5 - Adicionar Ação: Esperar até 24h antes
1. Clique no **+** abaixo da mensagem
2. Selecione **Wait**
3. Configure:
   - **Event Type:** `Appointment Start Time`
   - **Wait Until:** `24` hours `before`
4. Clique em **Save Action**

#### ETAPA 6 - Adicionar Ação: Lembrete 24h
1. Clique no **+** abaixo do Wait
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}! 👋

   Lembrete: Sua consulta é AMANHÃ às {{appointment.start_time}}.

   ✅ Confirma presença? Responda SIM
   🔄 Precisa remarcar? Responda REMARCAR

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 7 - Adicionar Ação: Esperar até 2h antes
1. Clique no **+**
2. Selecione **Wait**
3. Configure:
   - **Event Type:** `Appointment Start Time`
   - **Wait Until:** `2` hours `before`
4. Clique em **Save Action**

#### ETAPA 8 - Adicionar Ação: Lembrete 2h
1. Clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   {{contact.first_name}}, sua consulta é em 2 horas! ⏰

   📍 Endereço: [INSERIR ENDEREÇO DA CLÍNICA]

   Até já! 😊
   ```
4. Clique em **Save Action**

#### ETAPA 9 - Salvar e Ativar
1. Clique em **Save** (canto superior direito)
2. Clique no toggle **Publish** para ativar o workflow
3. Confirme que está **ON** (verde)

---

## WORKFLOW 2: RECUPERAÇÃO DE NO-SHOW (FALTA)

### Objetivo
Quando um paciente falta à consulta, enviar mensagens para tentar reagendar.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF07 - No-Show Recovery`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Appointment Status**
3. Configure:
   - **Workflow Trigger Name:** Paciente Faltou
   - **Appointment Status:** `No Show`
   - **In Calendar:** Selecione TODOS os calendários
4. Clique em **Save Trigger**

#### ETAPA 3 - Adicionar Tag de No-Show
1. Clique no **+** abaixo do trigger
2. Selecione **Add Tag**
3. Configure:
   - **Tag:** `comportamento:no-show`
4. Clique em **Save Action**

#### ETAPA 4 - Esperar 1 hora
1. Clique no **+**
2. Selecione **Wait**
3. Configure:
   - **Wait for:** `1` hour
4. Clique em **Save Action**

#### ETAPA 5 - Primeira Mensagem de Recuperação
1. Clique no **+**
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Olá {{contact.first_name}}, sentimos sua falta hoje! 😔

   Aconteceu algum imprevisto?

   Podemos reagendar para quando ficar melhor para você. É só responder esta mensagem.

   Equipe Dr. Thauan
   ```
4. Clique em **Save Action**

#### ETAPA 6 - Esperar 24 horas
1. Clique no **+**
2. Selecione **Wait**
3. Configure:
   - **Wait for:** `24` hours
4. Clique em **Save Action**

#### ETAPA 7 - Segunda Mensagem (Se não respondeu)
1. Clique no **+**
2. Selecione **If/Else** (Condição)
3. Na condição, configure:
   - **Branch 1 (IF):** Contact > Last Reply > is within `24` hours
   - (Se respondeu, não faz nada)
   - **Branch 2 (ELSE):** Continua com a mensagem abaixo

4. No branch ELSE, clique no **+**
5. Selecione **Send SMS** (ou WhatsApp)
6. Configure:
   - **Message:**
   ```
   {{contact.first_name}}, ainda temos alguns horários disponíveis esta semana! 📅

   Quer que eu reserve um para você? Responda com o melhor dia/horário.

   Equipe Dr. Thauan
   ```
7. Clique em **Save Action**

#### ETAPA 8 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

---

## WORKFLOW 3: ANIVERSÁRIO DO PACIENTE

### Objetivo
Enviar mensagem de parabéns no aniversário do paciente.

### Passo a Passo

#### ETAPA 1 - Criar o Workflow
1. Clique em **+ Create Workflow**
2. Selecione **Start from Scratch**
3. Nomeie como: `WF05 - Aniversário`

#### ETAPA 2 - Configurar o Trigger
1. Clique em **Add New Trigger**
2. Selecione **Date/Time Trigger** (ou **Birthday Reminder**)
3. Configure:
   - **Workflow Trigger Name:** Aniversário do Paciente
   - **Trigger Type:** `Custom Date Field`
   - **Custom Field:** `Data de Nascimento` (ou o nome exato do campo)
   - **Trigger On:** `On the date` (no dia exato)
   - **Time:** `09:00` (para enviar de manhã)
4. Clique em **Save Trigger**

#### ETAPA 3 - Adicionar Mensagem de Parabéns
1. Clique no **+** abaixo do trigger
2. Selecione **Send SMS** (ou WhatsApp)
3. Configure:
   - **Message:**
   ```
   Feliz aniversário, {{contact.first_name}}! 🎂🎉

   A equipe do Dr. Thauan deseja um dia muito especial para você!

   Como presente, você tem 10% de desconto no seu próximo procedimento. Válido por 30 dias.

   Parabéns! 🥳
   ```
4. Clique em **Save Action**

#### ETAPA 4 - Adicionar Tag de Controle
1. Clique no **+**
2. Selecione **Add Tag**
3. Configure:
   - **Tag:** `comunicacao:aniversario-2026`
4. Clique em **Save Action**

#### ETAPA 5 - Salvar e Ativar
1. Clique em **Save**
2. Ative com o toggle **Publish**

---

## CHECKLIST FINAL

Após criar os 3 workflows, confirme:

- [ ] **WF02 - Confirmação de Consulta**
  - [ ] Trigger: Appointment Status = Booked
  - [ ] 3 mensagens configuradas (confirmação, 24h, 2h)
  - [ ] Workflow PUBLICADO (verde)

- [ ] **WF07 - No-Show Recovery**
  - [ ] Trigger: Appointment Status = No Show
  - [ ] Tag sendo adicionada
  - [ ] 2 mensagens de recuperação
  - [ ] Workflow PUBLICADO (verde)

- [ ] **WF05 - Aniversário**
  - [ ] Trigger: Custom Date Field = Data de Nascimento
  - [ ] Mensagem de parabéns configurada
  - [ ] Horário de envio: 09:00
  - [ ] Workflow PUBLICADO (verde)

---

## TESTE OBRIGATÓRIO

Após criar cada workflow:

1. Crie um contato de teste com seus dados
2. Agende uma consulta para testar WF02
3. Marque como No-Show para testar WF07
4. Coloque data de nascimento = hoje para testar WF05
5. Verifique se as mensagens chegam corretamente

---

## DÚVIDAS FREQUENTES

**P: Onde encontro o campo "Data de Nascimento"?**
R: Já foi criado automaticamente. Está em Settings > Custom Fields > Contact Fields

**P: O WhatsApp está configurado?**
R: Verificar em Settings > Phone Numbers > WhatsApp se há número conectado

**P: Como sei se o workflow está funcionando?**
R: Em Automation > Workflows, clique no workflow. Na aba "Executions" você vê o histórico

**P: Posso editar as mensagens depois?**
R: Sim! Clique no workflow > Clique na ação > Edite > Save

---

## PRÓXIMOS WORKFLOWS (FASE 2)

Depois de validar os 3 primeiros, criar:

4. WF01 - Novo Lead (boas-vindas)
5. WF03 - Pós-Consulta (pesquisa de satisfação)
6. WF04 - Lembrete de Retorno
7. WF06 - Reativação de Paciente Inativo
8. WF08 - Lista de Espera

---

*Documento criado em 2026-01-16*
*Versão: 1.0*
