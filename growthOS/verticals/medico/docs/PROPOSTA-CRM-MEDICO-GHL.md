# CRM Médico - Proposta de Funcionalidades
## MOTTIVME + GoHighLevel + AI Factory

> **Posicionamento:** Sistema de captação, agendamento e relacionamento para clínicas e consultórios médicos.
>
> **Não compete com:** Prontuário eletrônico, telemedicina regulamentada, gestão financeira/estoque.

---

## 1. VISÃO GERAL DO PRODUTO

### Nome sugerido: **MedFlow** ou **ClinicaPro**

### Proposta de valor:
> "Pare de perder pacientes. Capture, agende e fidelize com automação inteligente - enquanto você foca no atendimento."

### Problema que resolve:
- Clínicas perdem 30-40% dos leads por falta de follow-up
- Agendamentos manuais consomem tempo da recepção
- Pacientes esquecem consultas (no-show de 15-25%)
- Sem relacionamento pós-consulta = sem retorno

---

## 2. MÓDULOS E FUNCIONALIDADES

### 📅 MÓDULO 1: AGENDAMENTO INTELIGENTE

#### Funcionalidades:
| Feature | Descrição | Benefício |
|---------|-----------|-----------|
| **Calendário online** | Booking page por médico/especialidade | Paciente agenda sozinho 24/7 |
| **Multi-agenda** | Vários médicos, salas, equipamentos | Gestão centralizada |
| **Bloqueio de horários** | Almoço, reuniões, procedimentos | Evita conflitos |
| **Tipos de consulta** | Primeira vez, retorno, procedimento | Duração diferente por tipo |
| **Buffer time** | Intervalo entre consultas | Evita atrasos em cascata |
| **Lista de espera** | Pacientes aguardando vaga | Preenche cancelamentos |

#### Integrações:
- Google Calendar sync
- Outlook sync
- iCal export

#### Automações incluídas:
- Confirmação automática ao agendar
- Lembrete 24h antes (WhatsApp + SMS)
- Lembrete 2h antes (WhatsApp)
- Solicitação de confirmação
- Reagendamento automático se não confirmar

---

### 💬 MÓDULO 2: COMUNICAÇÃO OMNICHANNEL

#### Canais integrados:
| Canal | Uso principal |
|-------|---------------|
| **WhatsApp Business API** | Comunicação principal, confirmações |
| **SMS** | Backup, lembretes urgentes |
| **Email** | Comunicação formal, resultados |
| **Instagram DM** | Captação, dúvidas iniciais |
| **Facebook Messenger** | Captação |
| **Webchat** | Site da clínica |

#### Funcionalidades:
- **Caixa de entrada unificada** - Todas conversas em um lugar
- **Templates pré-aprovados** - Mensagens padronizadas
- **Respostas rápidas** - Atalhos para recepção
- **Chatbot 24/7** - Atendimento fora do horário
- **Transferência humana** - Escala quando necessário
- **Histórico completo** - Toda comunicação registrada

#### Chatbot de atendimento:
```
Fluxo principal:
1. Saudação personalizada
2. Menu de opções:
   - Agendar consulta
   - Remarcar consulta
   - Cancelar consulta
   - Falar com atendente
   - Horário de funcionamento
   - Localização/Como chegar
3. Coleta de dados se novo paciente
4. Apresenta horários disponíveis
5. Confirma agendamento
6. Envia confirmação
```

---

### 🎯 MÓDULO 3: CAPTAÇÃO DE PACIENTES

#### Landing Pages:
- **Página de especialidade** - Ex: "Dermatologia em São Paulo"
- **Página de procedimento** - Ex: "Botox - Agende sua avaliação"
- **Página de convênio** - "Aceitamos Unimed"
- **Página de urgência** - "Consulta no mesmo dia"

#### Formulários inteligentes:
| Formulário | Campos | Uso |
|------------|--------|-----|
| **Captação rápida** | Nome, WhatsApp, especialidade | Ads, tráfego pago |
| **Pré-consulta** | Dados completos, queixa principal | Pré-agendamento |
| **Anamnese digital** | Histórico, alergias, medicamentos | Antes da consulta |
| **Pesquisa satisfação** | NPS, feedback | Pós-consulta |

#### Fontes de captação rastreadas:
- Google Ads
- Meta Ads (Facebook/Instagram)
- Indicação de paciente
- Convênio
- Orgânico (SEO)
- Redes sociais

---

### 📊 MÓDULO 4: CRM E PIPELINE

#### Pipeline de pacientes:
```
[Novo Lead] → [Contato Feito] → [Agendado] → [Confirmado] → [Atendido] → [Retorno]
                    ↓                              ↓
              [Não respondeu]              [No-show]
                    ↓                              ↓
              [Remarketing]               [Reativação]
```

#### Segmentação por tags:
| Categoria | Tags exemplo |
|-----------|--------------|
| **Especialidade** | dermatologia, cardiologia, ortopedia |
| **Tipo paciente** | primeira-vez, retorno, fidelizado |
| **Convênio** | particular, unimed, bradesco, sulamerica |
| **Procedimento interesse** | botox, preenchimento, check-up |
| **Status** | vip, inadimplente, inativo-6m |
| **Origem** | google-ads, instagram, indicacao |

#### Campos customizados médicos:
- Data de nascimento
- Convênio + número carteira
- Médico preferencial
- Última consulta
- Próximo retorno previsto
- Observações especiais (alergias, preferências)

---

### 🤖 MÓDULO 5: AUTOMAÇÕES (WORKFLOWS)

#### Automação 1: Novo Lead
```
Trigger: Formulário preenchido
↓
Ação 1: Criar contato no CRM
Ação 2: Tag "novo-lead" + origem
Ação 3: WhatsApp imediato (boas-vindas + menu)
Ação 4: Se não responder em 1h → SMS
Ação 5: Se não responder em 24h → Email
Ação 6: Se não responder em 72h → Tag "frio" + campanha reativação
```

#### Automação 2: Confirmação de Consulta
```
Trigger: Consulta agendada
↓
Imediato: WhatsApp de confirmação com detalhes
24h antes: Lembrete + pedido de confirmação
2h antes: Lembrete final + localização
Se não confirmar: Alerta para recepção
Se confirmar: Tag "confirmado"
```

#### Automação 3: Pós-Consulta
```
Trigger: Status mudou para "Atendido"
↓
2h depois: WhatsApp agradecimento
24h depois: Email com orientações (se configurado)
7 dias depois: Pesquisa de satisfação (NPS)
Se NPS < 7: Alerta para gestão
Se NPS > 8: Pedido de avaliação Google
```

#### Automação 4: Retorno
```
Trigger: Campo "próximo retorno" = hoje - 7 dias
↓
WhatsApp: "Dr. X indicou retorno. Quer agendar?"
Se sim: Mostra horários disponíveis
Se não responder em 3 dias: SMS
Se não responder em 7 dias: Email
Após 30 dias: Tag "retorno-pendente"
```

#### Automação 5: Aniversário
```
Trigger: Data nascimento = hoje
↓
9h: WhatsApp de parabéns personalizado
Opcional: Cupom de desconto em procedimento estético
```

#### Automação 6: Paciente Inativo
```
Trigger: Última consulta > 6 meses
↓
WhatsApp: "Faz tempo! Que tal agendar um check-up?"
Se não responder: Email com conteúdo educativo
Após 30 dias: Campanha de reativação
Após 12 meses: Tag "inativo" + arquivar
```

#### Automação 7: No-Show
```
Trigger: Status = "Não compareceu"
↓
1h depois: WhatsApp "Sentimos sua falta, tudo bem?"
Oferece reagendamento
Se 3 no-shows: Tag "no-show-recorrente" + alerta
```

#### Automação 8: Lista de Espera
```
Trigger: Cancelamento de consulta
↓
Busca pacientes na lista de espera (mesma especialidade)
WhatsApp: "Surgiu uma vaga para [data]. Quer?"
Primeiro que responder: Agenda
Timeout 2h: Próximo da lista
```

---

### 📈 MÓDULO 6: RELATÓRIOS E MÉTRICAS

#### Dashboard principal:
- Consultas do dia/semana/mês
- Taxa de confirmação
- Taxa de no-show
- Novos pacientes vs retornos
- Origem dos leads
- Tempo médio de resposta

#### Relatórios disponíveis:
| Relatório | Métricas |
|-----------|----------|
| **Captação** | Leads por canal, custo por lead, conversão |
| **Agendamentos** | Por médico, por especialidade, horários mais buscados |
| **Confirmação** | Taxa confirmação, no-show por dia da semana |
| **Satisfação** | NPS médio, evolução, por médico |
| **Financeiro** | Consultas realizadas, ticket médio, projeção |
| **Equipe** | Tempo resposta, atendimentos por pessoa |

---

### 📱 MÓDULO 7: APP E ACESSO

#### Para a clínica:
- **Web app** - Acesso completo pelo navegador
- **App mobile** - iOS e Android (app GHL white-label)
- **Notificações push** - Novos leads, confirmações

#### Para o paciente:
- **Link de agendamento** - Sem precisar baixar app
- **WhatsApp** - Canal principal de comunicação
- **Portal do paciente** (opcional) - Ver agendamentos, histórico

---

## 3. DIFERENCIAIS vs MEDX

| Aspecto | MEDX | Nossa solução |
|---------|------|---------------|
| **WhatsApp** | Limitado (50-100 msg/mês) | Ilimitado via API |
| **Automações** | Básicas | Workflows completos |
| **Multi-canal** | Só WhatsApp | Omnichannel |
| **Chatbot** | Não tem | IA conversacional |
| **CRM** | Básico | Pipeline completo |
| **Landing pages** | Não tem | Incluído |
| **Integrações** | Fechado | APIs abertas |
| **Personalização** | Limitada | Total |

---

## 4. ESTRUTURA DE PREÇOS SUGERIDA

### Modelo SaaS (mensalidade)

#### Plano Starter - R$ 197/mês
- 1 usuário
- 1 calendário
- 500 contatos
- WhatsApp Business
- Automações básicas (5)
- Suporte por email

#### Plano Professional - R$ 397/mês
- 5 usuários
- 5 calendários
- 2.500 contatos
- WhatsApp + SMS (500)
- Automações ilimitadas
- Chatbot básico
- Relatórios
- Suporte WhatsApp

#### Plano Clinic - R$ 697/mês
- 15 usuários
- Calendários ilimitados
- 10.000 contatos
- WhatsApp + SMS (2.000)
- Chatbot com IA
- Multi-unidade
- API access
- Suporte prioritário
- Gerente de conta

### Adicionais:
- SMS extra: R$ 0,15/msg
- Contatos extras: R$ 50/1.000
- Usuário extra: R$ 47/mês
- Setup/migração: R$ 500-2.000 (único)

### Comparativo de economia:
```
MEDX Starter: R$ 250/mês (R$ 3.000/ano)
Nossa solução: R$ 197/mês = economia de 21%
+ mais funcionalidades
+ WhatsApp ilimitado
```

---

## 5. IMPLEMENTAÇÃO

### Fase 1: Setup (Semana 1)
- [ ] Criar sub-conta GHL
- [ ] Configurar domínio e branding
- [ ] Importar base de pacientes
- [ ] Configurar calendários
- [ ] Integrar WhatsApp Business API

### Fase 2: Automações (Semana 2)
- [ ] Configurar workflows principais
- [ ] Criar templates de mensagem
- [ ] Configurar chatbot
- [ ] Testar fluxos completos

### Fase 3: Treinamento (Semana 3)
- [ ] Treinamento recepção (2h)
- [ ] Treinamento gestão (1h)
- [ ] Documentação de processos
- [ ] Go-live assistido

### Fase 4: Otimização (Semana 4+)
- [ ] Ajustes baseados em uso real
- [ ] Criação de landing pages
- [ ] Integração com ads
- [ ] Relatórios customizados

---

## 6. INTEGRAÇÕES POSSÍVEIS

### Prontuários eletrônicos:
- MEDX (via Zapier/webhook)
- iClinic
- Doctoralia
- Shosp

### Pagamentos:
- Stripe
- PagSeguro
- Mercado Pago

### Ads:
- Google Ads (conversões)
- Meta Ads (CAPI)
- TikTok Ads

### Outros:
- Google Analytics
- Google Business Profile
- Calendly (migração)

---

## 7. ROADMAP FUTURO

### V2 (3-6 meses):
- [ ] Integração nativa com principais prontuários
- [ ] Módulo de indicações (programa de referral)
- [ ] Assinatura digital de documentos
- [ ] Teleconsulta simples (não regulamentada)

### V3 (6-12 meses):
- [ ] IA para triagem inicial
- [ ] Predição de no-show
- [ ] Sugestão de horários otimizada
- [ ] Marketplace de especialistas

---

## 8. CASOS DE USO POR ESPECIALIDADE

### Dermatologia/Estética:
- Foco em procedimentos
- Fotos antes/depois (com consentimento)
- Pacotes e promoções
- Alto ticket, menos volume

### Clínica Geral/Família:
- Alto volume, ticket menor
- Convênios múltiplos
- Retornos frequentes
- Vacinas e preventivo

### Odontologia:
- Orçamentos complexos
- Tratamentos em fases
- Urgências
- Planos odontológicos

### Psicologia/Psiquiatria:
- Sigilo reforçado
- Sessões recorrentes
- Teleconsulta importante
- Lembretes sutis

---

## 9. MATERIAL DE VENDAS

### Pitch de 30 segundos:
> "Sua clínica perde pacientes por falta de follow-up? Nosso sistema captura leads de todos os canais, agenda automaticamente, confirma por WhatsApp e reativa pacientes inativos. Tudo integrado, sem você precisar fazer nada. Quer ver uma demo?"

### Objeções comuns:

**"Já tenho sistema de prontuário"**
> "Perfeito, não substituímos o prontuário. Complementamos com a parte que ele não faz: captar e fidelizar pacientes."

**"É caro"**
> "Quanto você perde por mês com no-show e pacientes que não voltam? Uma consulta recuperada já paga o sistema."

**"Não tenho tempo de aprender"**
> "A recepção aprende em 2 horas. E as automações trabalham sozinhas."

**"Já uso WhatsApp"**
> "WhatsApp manual não escala. Quantos leads você deixou de responder essa semana?"

---

## 10. MÉTRICAS DE SUCESSO

### Para a clínica cliente:
- Redução de no-show em 40-60%
- Aumento de retornos em 25-35%
- Tempo de resposta < 5 minutos
- NPS > 50

### Para nós (MOTTIVME):
- Churn < 5% mês
- LTV > 12 meses
- NPS > 60
- Margem > 60%

---

*Documento criado em: Janeiro 2026*
*Versão: 1.0*
*Autor: MOTTIVME*
