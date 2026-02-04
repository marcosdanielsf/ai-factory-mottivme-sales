# Manual de Onboarding - MedFlow

> Guia completo para configurar e usar o MedFlow na sua clínica
> Tempo estimado de setup: 2-3 horas

---

## Sumário

1. [Bem-vindo ao MedFlow](#1-bem-vindo-ao-medflow)
2. [Antes de Começar](#2-antes-de-começar)
3. [Acesso ao Sistema](#3-acesso-ao-sistema)
4. [Configuração Inicial](#4-configuração-inicial)
5. [Cadastro de Pacientes](#5-cadastro-de-pacientes)
6. [Agendamento Online](#6-agendamento-online)
7. [WhatsApp e Comunicação](#7-whatsapp-e-comunicação)
8. [Automações](#8-automações)
9. [Relatórios e Métricas](#9-relatórios-e-métricas)
10. [Perguntas Frequentes](#10-perguntas-frequentes)
11. [Suporte](#11-suporte)

---

## 1. Bem-vindo ao MedFlow

### O que é o MedFlow?

O MedFlow é um sistema de gestão de relacionamento com pacientes (CRM) desenvolvido especialmente para clínicas médicas. Ele ajuda você a:

- **Captar mais pacientes** com landing pages e formulários
- **Reduzir faltas** com confirmações automáticas por WhatsApp
- **Fidelizar pacientes** com lembretes de retorno e aniversário
- **Ter visibilidade** de todo o funil de pacientes

### O que o MedFlow NÃO faz

O MedFlow é focado em **relacionamento e comunicação**. Ele **não substitui**:

- Prontuário eletrônico (continue usando iClinic, MEDX, etc.)
- Sistema financeiro/faturamento
- Telemedicina
- Prescrição digital

### Nossos Planos

| Plano | Valor | Indicado para |
|-------|-------|---------------|
| **Essencial** | R$ 197/mês | Consultórios individuais |
| **Profissional** | R$ 397/mês | Clínicas pequenas/médias |
| **Premium** | R$ 697/mês | Clínicas com múltiplos médicos |

---

## 2. Antes de Começar

### Checklist de Informações

Antes do setup, reúna as seguintes informações:

#### Dados da Clínica
- [ ] Nome fantasia da clínica
- [ ] CNPJ
- [ ] Endereço completo (CEP, rua, número, bairro, cidade, UF)
- [ ] Telefone fixo (se houver)
- [ ] E-mail principal
- [ ] Logo em alta resolução (PNG, fundo transparente)
- [ ] Cores da marca (código hexadecimal se tiver)

#### Dados do(s) Médico(s)
- [ ] Nome completo
- [ ] CRM e UF
- [ ] Especialidade(s)
- [ ] Foto profissional (opcional, para landing page)
- [ ] Mini currículo (formação, experiência)

#### Informações de Atendimento
- [ ] Dias e horários de funcionamento
- [ ] Duração padrão das consultas (primeira vez e retorno)
- [ ] Lista de procedimentos/serviços oferecidos
- [ ] Convênios aceitos
- [ ] Valor da consulta particular (se divulgar)

#### Redes e Comunicação
- [ ] Número do WhatsApp Business (ou número que será usado)
- [ ] Link do Instagram
- [ ] Link do Facebook
- [ ] Site atual (se houver)

---

## 3. Acesso ao Sistema

### Primeiro Acesso

1. Você receberá um e-mail com o assunto **"Bem-vindo ao MedFlow"**
2. Clique no link **"Criar minha senha"**
3. Defina uma senha forte (mínimo 8 caracteres, com números e letras)
4. Faça login em: **app.gohighlevel.com**

### Salvando o Acesso

Recomendamos salvar nos favoritos:
- **Desktop:** Ctrl+D (Windows) ou Cmd+D (Mac)
- **Mobile:** Baixe o app **"HighLevel"** na App Store ou Play Store

### Usuários Adicionais

Para adicionar secretárias ou outros usuários:

1. Vá em **Settings > Team**
2. Clique em **"Add Employee"**
3. Preencha nome e e-mail
4. Selecione o perfil de acesso:
   - **Admin:** Acesso total
   - **User:** Acesso limitado (recomendado para secretárias)

---

## 4. Configuração Inicial

### 4.1 Informações da Clínica

1. Acesse **Settings > Business Profile**
2. Preencha:
   - Nome da clínica
   - Endereço completo
   - Telefone
   - E-mail
   - Fuso horário: **America/Sao_Paulo**
3. Faça upload da logo
4. Clique **Save**

### 4.2 Horário de Funcionamento

1. Vá em **Settings > Business Profile > Business Hours**
2. Configure os dias e horários de atendimento
3. Marque os dias que a clínica NÃO funciona

### 4.3 Calendários de Agendamento

Você encontrará calendários pré-configurados:

| Calendário | Duração | Uso |
|------------|---------|-----|
| Consulta Primeira Vez | 45 min | Pacientes novos |
| Consulta Retorno | 30 min | Pacientes em acompanhamento |
| Procedimento | 60 min | Exames, pequenos procedimentos |

**Para personalizar:**

1. Vá em **Calendars**
2. Clique no calendário desejado
3. Ajuste:
   - Disponibilidade (dias/horários)
   - Duração
   - Intervalo entre consultas
   - Antecedência mínima para agendar
4. Salve

### 4.4 Convênios

Os convênios aceitos aparecem no formulário de agendamento.

**Para editar a lista:**

1. Vá em **Settings > Custom Fields**
2. Encontre o campo **"Convênio"**
3. Clique para editar
4. Adicione ou remova opções
5. Salve

---

## 5. Cadastro de Pacientes

### 5.1 Cadastrar Paciente Manualmente

1. Vá em **Contacts**
2. Clique **"Add Contact"**
3. Preencha os campos:
   - **Nome completo** (obrigatório)
   - **Telefone** (obrigatório, com DDD)
   - **E-mail**
   - **Data de nascimento**
   - **Convênio**
   - **Observações**
4. Clique **Save**

### 5.2 Importar Pacientes de Planilha

Se você tem pacientes em Excel/Google Sheets:

1. Vá em **Contacts > Import**
2. Baixe o template CSV
3. Preencha com seus dados
4. Faça upload do arquivo
5. Mapeie os campos (nome → nome, telefone → telefone, etc.)
6. Confirme a importação

**Dica:** Limpe os dados antes de importar (remova duplicatas, padronize telefones).

### 5.3 Visualizar Paciente

Ao clicar em um contato, você verá:

- **Informações básicas** (nome, telefone, etc.)
- **Timeline** (todas as interações)
- **Oportunidades** (em qual etapa do pipeline está)
- **Agendamentos** (consultas passadas e futuras)
- **Tags** (categorias do paciente)

### 5.4 Tags Úteis

O sistema usa tags para organizar pacientes. Algumas automáticas:

| Tag | Significado |
|-----|-------------|
| `novo-lead` | Acabou de se cadastrar |
| `agendado` | Tem consulta marcada |
| `compareceu` | Veio à consulta |
| `no-show` | Faltou sem avisar |
| `retorno-pendente` | Precisa marcar retorno |
| `inativo-180d` | Sem contato há 6 meses |

---

## 6. Agendamento Online

### 6.1 Link de Agendamento

Cada calendário tem um link público para agendamento:

1. Vá em **Calendars**
2. Clique no calendário
3. Copie o **Booking Link**

**Onde usar:**
- Bio do Instagram
- WhatsApp (mensagem fixada)
- Assinatura de e-mail
- QR Code na recepção
- Google Meu Negócio

### 6.2 Agendar pelo Sistema

Para a secretária agendar:

1. Vá em **Calendars**
2. Clique na data/hora desejada
3. Selecione o paciente (ou cadastre novo)
4. Escolha o tipo de consulta
5. Adicione observações se necessário
6. Clique **Create Appointment**

### 6.3 Reagendar ou Cancelar

1. Encontre o agendamento no calendário
2. Clique sobre ele
3. Escolha:
   - **Reschedule** para mudar data/hora
   - **Cancel** para cancelar
4. O paciente será notificado automaticamente

### 6.4 Visualização do Calendário

Opções de visualização:
- **Dia:** Ver todos os horários do dia
- **Semana:** Visão geral da semana
- **Mês:** Planejamento mensal
- **Agenda:** Lista de compromissos

---

## 7. WhatsApp e Comunicação

### 7.1 Conectar WhatsApp

O WhatsApp é o principal canal de comunicação.

**Pré-requisitos:**
- Número de celular dedicado (não use pessoal)
- Chip ativo no aparelho
- WhatsApp Business instalado

**Para conectar:**

1. Vá em **Settings > Phone Numbers**
2. Clique em **"Connect WhatsApp"**
3. Escaneie o QR Code com o celular
4. Aguarde a confirmação

**Importante:** Mantenha o celular conectado à internet e carregado.

### 7.2 Enviar Mensagem Manual

1. Vá em **Conversations**
2. Encontre o paciente (ou busque pelo nome/telefone)
3. Digite a mensagem
4. Clique no ícone de enviar (ou Enter)

**Dica:** Use **/templates** para acessar mensagens prontas.

### 7.3 Mensagens em Massa

Para enviar para múltiplos pacientes:

1. Vá em **Contacts**
2. Filtre os contatos desejados (por tag, data, etc.)
3. Selecione os contatos
4. Clique **"Bulk Actions" > "Send SMS/WhatsApp"**
5. Escreva a mensagem
6. Envie

**Atenção:** Use com moderação para não parecer spam.

### 7.4 Templates de Mensagem

Mensagens pré-aprovadas para usar rapidamente:

| Template | Quando usar |
|----------|-------------|
| Confirmação de consulta | Lembrar do agendamento |
| Reagendamento | Oferecer nova data |
| Pós-consulta | Agradecer e pedir feedback |
| Aniversário | Parabenizar paciente |
| Reativação | Paciente sumido |

---

## 8. Automações

### 8.1 Automações Ativas

O MedFlow vem com automações pré-configuradas:

#### Confirmação de Consulta
- **Gatilho:** Consulta agendada
- **Ações:**
  - WhatsApp imediato com dados da consulta
  - Lembrete 24h antes
  - Lembrete 2h antes
- **Benefício:** Reduz no-show em até 40%

#### Recuperação de No-Show
- **Gatilho:** Paciente marcado como faltou
- **Ações:**
  - WhatsApp 1h após o horário
  - Segundo contato 24h depois
- **Benefício:** Recupera pacientes perdidos

#### Aniversário
- **Gatilho:** Data de nascimento do paciente
- **Ações:**
  - WhatsApp às 8h da manhã
  - Cupom de desconto (opcional)
- **Benefício:** Fidelização e relacionamento

#### Pós-Consulta
- **Gatilho:** Status mudou para "compareceu"
- **Ações:**
  - WhatsApp 2h depois agradecendo
  - Link para avaliação (NPS)
- **Benefício:** Feedback e reputação

#### Lembrete de Retorno
- **Gatilho:** Campo "Data Sugerida Retorno" preenchido
- **Ações:**
  - WhatsApp 7 dias antes
  - Segundo lembrete 3 dias antes
- **Benefício:** Continuidade do tratamento

#### Reativação de Inativos
- **Gatilho:** Sem consulta há 180 dias
- **Ações:**
  - WhatsApp perguntando como está
  - Oferta para retorno
- **Benefício:** Resgata pacientes perdidos

### 8.2 Personalizar Automações

Para ajustar uma automação:

1. Vá em **Automation > Workflows**
2. Encontre o workflow desejado
3. Clique para editar
4. Modifique:
   - Tempo de espera
   - Texto das mensagens
   - Condições
5. Salve e ative

### 8.3 Pausar Automação para um Paciente

Se precisar pausar as mensagens automáticas para alguém:

1. Abra o contato
2. Vá na aba **"Automations"**
3. Clique **"Remove from all workflows"**

---

## 9. Relatórios e Métricas

### 9.1 Dashboard Principal

Ao fazer login, você verá:

- **Agendamentos do dia**
- **Novos leads da semana**
- **Taxa de comparecimento**
- **Conversas pendentes**

### 9.2 Relatórios Disponíveis

#### Pipeline de Pacientes
**Onde:** Opportunities > Pipeline View

Visualize quantos pacientes em cada etapa:
- Novo Lead
- Agendado
- Confirmado
- Compareceu
- Em Tratamento
- Fidelizado

#### Relatório de Agendamentos
**Onde:** Calendars > Reports

- Total de consultas no período
- Taxa de comparecimento vs no-show
- Horários mais procurados
- Tipos de consulta mais agendados

#### Relatório de Comunicação
**Onde:** Conversations > Analytics

- Mensagens enviadas/recebidas
- Tempo médio de resposta
- Canais mais usados

### 9.3 Exportar Dados

Para exportar qualquer relatório:

1. Acesse o relatório desejado
2. Clique no ícone de download (geralmente canto superior direito)
3. Escolha o formato (CSV ou PDF)
4. Salve o arquivo

---

## 10. Perguntas Frequentes

### Geral

**P: Posso usar o MedFlow junto com meu prontuário atual?**
R: Sim! O MedFlow é complementar. Use-o para comunicação e agendamento, e mantenha seu prontuário para registros médicos.

**P: Quantos usuários posso ter?**
R: Depende do plano. Essencial: 2 usuários. Profissional: 5 usuários. Premium: ilimitado.

**P: Funciona no celular?**
R: Sim! Baixe o app "HighLevel" na loja de aplicativos.

### WhatsApp

**P: Preciso de um número novo?**
R: Recomendamos usar um número dedicado para a clínica, não pessoal.

**P: Posso usar meu WhatsApp pessoal?**
R: Tecnicamente sim, mas não recomendamos. Mistura vida pessoal com profissional.

**P: E se o WhatsApp desconectar?**
R: Reconecte em Settings > Phone Numbers. Mantenha o celular carregado e com internet.

**P: Tem limite de mensagens?**
R: Não! WhatsApp ilimitado é um diferencial do MedFlow.

### Agendamento

**P: Paciente pode agendar sozinho?**
R: Sim! Compartilhe o link de agendamento e ele escolhe data/hora disponível.

**P: Como bloqueio um horário para compromisso pessoal?**
R: No calendário, clique no horário e selecione "Block Time".

**P: Posso ter múltiplos médicos?**
R: Sim, no plano Premium. Cada médico terá seu calendário próprio.

### Automações

**P: As mensagens são enviadas automaticamente mesmo?**
R: Sim! Uma vez configurado, funciona 24/7 sem intervenção.

**P: Posso desativar uma automação?**
R: Sim, em Automation > Workflows, clique no toggle para desativar.

**P: E se eu quiser mudar o texto das mensagens?**
R: Edite o workflow e altere o conteúdo. Peça ajuda ao suporte se precisar.

### Problemas Comuns

**P: Não estou recebendo notificações no celular.**
R: Verifique se as notificações do app estão ativadas nas configurações do celular.

**P: Um paciente não recebeu a mensagem.**
R: Verifique se o número está correto (com DDD) e se o WhatsApp dele está ativo.

**P: O calendário não está sincronizando.**
R: Atualize a página (F5) ou faça logout e login novamente.

---

## 11. Suporte

### Canais de Atendimento

| Canal | Horário | Tempo de Resposta |
|-------|---------|-------------------|
| WhatsApp Suporte | Seg-Sex 9h-18h | Até 2 horas |
| E-mail | 24h | Até 24 horas |
| Base de Conhecimento | 24h | Imediato |

### WhatsApp do Suporte

**Número:** [NÚMERO_SUPORTE]

**O que informar ao abrir chamado:**
1. Nome da clínica
2. Descrição do problema
3. Print da tela (se aplicável)
4. O que você já tentou fazer

### Base de Conhecimento

Acesse tutoriais em vídeo e artigos:
**[URL_BASE_CONHECIMENTO]**

### Atualizações do Sistema

Novidades e melhorias são comunicadas por:
- E-mail mensal
- Notificação no sistema
- Grupo de clientes no WhatsApp (opcional)

---

## Checklist de Onboarding

Use este checklist para garantir que tudo foi configurado:

### Semana 1 - Setup Básico
- [ ] Primeiro acesso realizado
- [ ] Dados da clínica preenchidos
- [ ] Logo enviada
- [ ] Horários de funcionamento configurados
- [ ] WhatsApp conectado
- [ ] Calendários ajustados

### Semana 2 - Operação
- [ ] Secretária treinada no sistema
- [ ] Primeiros pacientes cadastrados
- [ ] Link de agendamento divulgado
- [ ] Primeira consulta agendada pelo sistema
- [ ] Mensagens automáticas funcionando

### Semana 3 - Otimização
- [ ] Importação de pacientes antigos (se houver)
- [ ] Templates de mensagem personalizados
- [ ] Relatórios revisados
- [ ] Ajustes finos nas automações

### Semana 4 - Validação
- [ ] Taxa de no-show medida
- [ ] Feedback da equipe coletado
- [ ] Dúvidas esclarecidas com suporte
- [ ] Sistema funcionando de forma autônoma

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Lead** | Potencial paciente que demonstrou interesse |
| **Pipeline** | Funil visual das etapas do paciente |
| **Workflow** | Sequência automática de ações |
| **Tag** | Etiqueta para categorizar pacientes |
| **No-show** | Paciente que faltou sem avisar |
| **NPS** | Pesquisa de satisfação (0-10) |
| **CRM** | Sistema de gestão de relacionamento |

---

## Próximos Passos

Após completar o onboarding:

1. **Acompanhe as métricas** semanalmente
2. **Colete feedback** dos pacientes
3. **Otimize as mensagens** baseado nos resultados
4. **Explore recursos avançados** (landing pages, campanhas)

---

*Versão: 1.0*
*Última atualização: Janeiro 2026*
*MedFlow - Relacionamento que cura*
