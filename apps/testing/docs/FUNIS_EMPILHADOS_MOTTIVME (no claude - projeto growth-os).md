# FUNIS EMPILHADOS MOTTIVME - Arquitetura Completa

> **Versão:** 2.0
> **Data:** 2026-01-10
> **Autor:** Claude + Marcos Daniels
> **Referências:** Charlie Morgan, JP Middleton, Russell Brunson, Ryan Deiss

---

## ACTION TYPES - Sistema Modular

Cada etapa de cadência pode usar diferentes tipos de ação, configuráveis por cliente:

### Tipos Disponíveis

| Action Type | Descrição | Requer Config? | Fallback |
|-------------|-----------|----------------|----------|
| `ai_text` | IA gera mensagem personalizada | Não | - |
| `template` | Mensagem fixa (template) | Sim (template_id) | ai_text |
| `tag` | Adiciona tag no GHL → dispara automação externa | Sim (tag + automação GHL) | ai_text |
| `ai_call` | Ligação com IA | Sim (qualificação + config) | tag ou ai_text |
| `skip` | Pula etapa | Não | - |
| `manual` | Sinaliza para humano | Não | skip |
| `webhook` | Chama URL externa | Sim (webhook_url) | ai_text |

### Fluxo de Decisão (Graceful Degradation)

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA X: action_type = 'tag' (enviar_audio)                │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Cliente tem automação de áudio configurada no GHL?         │
│  (Verifica: tag existe? workflow ativo?)                    │
└─────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
         SIM                           NÃO
          │                             │
          ▼                             ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│  Adiciona tag GHL   │    │  Usa fallback_action            │
│  GHL dispara áudio  │    │  (default: ai_text)             │
└─────────────────────┘    │  IA gera mensagem equivalente   │
                           └─────────────────────────────────┘
```

### AI_CALL: Ligação com IA

**Quando usar:** Para leads qualificados que estão prestes a agendar mas não agendaram.

**Critérios de Qualificação:**

| Critério | Valor Mínimo | Descrição |
|----------|--------------|-----------|
| `engagement_score` | 70+ | Score baseado em interações |
| `allowed_stages` | pre_agendamento, reagendamento | Estágios onde ligação faz sentido |
| `last_message_intent` | positivo | Lead demonstrou interesse |
| `qualification_tags` | lead-qualificado, lead-quente | Tags que indicam qualidade |

**Custos:**
- Ligação IA é caro → só para leads com alta probabilidade
- Se não atender critérios → usa fallback (tag para ligação manual ou ai_text)

```
┌─────────────────────────────────────────────────────────────┐
│  ETAPA Y: action_type = 'ai_call'                           │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Lead atende critérios de qualificação?                     │
│  - engagement_score >= 70                                   │
│  - stage IN allowed_stages                                  │
│  - tem tag de qualificação                                  │
└─────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
         SIM                           NÃO
          │                             │
          ▼                             ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│  Dispara ai_call    │    │  Usa fallback_action            │
│  (Vapi/Bland/etc)   │    │  - tag: sinaliza para humano    │
└─────────────────────┘    │  - ai_text: manda mensagem      │
                           └─────────────────────────────────┘
```

### TAG como Trigger de Automação

O fluxo correto para ações que dependem do GHL (áudio, vídeo, etc):

1. **n8n** adiciona tag no contato GHL (ex: `enviar_audio_fup_3`)
2. **GHL** detecta a tag via Workflow Trigger
3. **GHL** dispara a automação (envia áudio, vídeo, etc)
4. **GHL** remove a tag após execução (opcional)

**Vantagens:**
- Áudio/vídeo fica configurado pelo cliente no GHL
- n8n não precisa saber COMO enviar, só QUANDO
- Cliente tem controle total sobre o conteúdo

---

## VISÃO GERAL

O sistema de **Funis Empilhados** transforma leads que não converteram em múltiplas oportunidades de conversão através de canais e estratégias complementares.

**Princípio Central:** Um lead que não converteu no Funil 1 não está perdido - ele entra no Funil 2, depois no 3, e assim por diante. O jogo é **empilhar múltiplas chances de conversão**.

---

## ARQUITETURA DE 8 FUNIS

```
                    LEAD ENTRA
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  FUNIL 1: SDR DIRETO (WhatsApp/Instagram)                   │
│  Objetivo: Agendar call/consulta                            │
│  Duração: 7 dias | Conversão esperada: 15-25%               │
└─────────────────────────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
       CONVERTEU                 NÃO CONVERTEU
            │                         │
            ▼                         ▼
      [CLIENTE]         ┌─────────────────────────────────────┐
                        │  FUNIL 2: GRUPO VIP (WhatsApp)       │
                        │  Objetivo: Nutrir + Lançamento       │
                        │  Duração: 30 dias | Conv: 10-20%     │
                        └─────────────────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    CONVERTEU               NÃO CONVERTEU
                         │                         │
                         ▼                         ▼
                   [CLIENTE]      ┌─────────────────────────────────────┐
                                  │  FUNIL 3: EMAIL NURTURING            │
                                  │  Objetivo: Educar + Confiar          │
                                  │  Duração: 45 dias | Conv: 8-12%      │
                                  └─────────────────────────────────────┘
                                               │
                                  ┌────────────┴────────────┐
                                  │                         │
                             CONVERTEU               NÃO CONVERTEU
                                  │                         │
                                  ▼                         ▼
                            [CLIENTE]      ┌─────────────────────────────────────┐
                                           │  FUNIL 4: VIDEO LOOM/VSL             │
                                           │  Objetivo: Conexão pessoal           │
                                           │  Duração: 14 dias | Conv: 15-25%     │
                                           └─────────────────────────────────────┘
                                                        │
                                           ┌────────────┴────────────┐
                                           │                         │
                                      CONVERTEU               NÃO CONVERTEU
                                           │                         │
                                           ▼                         ▼
                                     [CLIENTE]      ┌─────────────────────────────────────┐
                                                    │  FUNIL 5: WEBINAR CÍCLICO            │
                                                    │  Objetivo: Evento de conversão       │
                                                    │  Duração: Mensal | Conv: 20-30%      │
                                                    └─────────────────────────────────────┘
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    │                         │
                                               CONVERTEU               NÃO CONVERTEU
                                                    │                         │
                                                    ▼                         ▼
                                              [CLIENTE]      ┌─────────────────────────────────────┐
                                                             │  FUNIL 6: SALES FARMING (60-90d)    │
                                                             │  Objetivo: Cultivo longo prazo      │
                                                             │  Duração: 90 dias | Conv: 5-8%      │
                                                             └─────────────────────────────────────┘
                                                                          │
                                                             ┌────────────┴────────────┐
                                                             │                         │
                                                        CONVERTEU               NÃO CONVERTEU
                                                             │                         │
                                                             ▼                         ▼
                                                       [CLIENTE]      ┌─────────────────────────────────────┐
                                                                      │  FUNIL 7: REATIVAÇÃO CÍCLICA        │
                                                                      │  Objetivo: 2º/3º chance             │
                                                                      │  Duração: A cada 60 dias            │
                                                                      └─────────────────────────────────────┘
                                                                                   │
                                                                      ┌────────────┴────────────┐
                                                                      │                         │
                                                                 CONVERTEU              APÓS 3 CICLOS
                                                                      │                         │
                                                                      ▼                         ▼
                                                                [CLIENTE]              [ARQUIVO FRIO]
```

---

## FUNIL 1: SDR DIRETO (WhatsApp/Instagram)

### Objetivo
Qualificar e agendar call/consulta no primeiro contato.

### Gatilho de Entrada
- Lead entra via formulário (ads, landing page)
- Lead responde DM prospectada
- Lead comenta em post/story

### Cadência (7 dias)

| Dia | Canal | Ação | Tom |
|-----|-------|------|-----|
| D+0 | WhatsApp | Resposta imediata (<3min) | Empolgado |
| D+0 | WhatsApp | Qualificação NEPQ | Curioso |
| D+1 | WhatsApp | Follow-up 1 - Valor | Agregando |
| D+3 | WhatsApp | Follow-up 2 - Pattern Interrupt | Visual/Meme |
| D+5 | WhatsApp | Follow-up 3 - Takeaway | Escassez |
| D+7 | WhatsApp | Follow-up 4 - 9-Word | Direto |

### Critérios de Saída
- **Converteu:** Agendou → Sai do funil → Entra em fluxo de confirmação
- **Não converteu após D+7:** Move para Funil 2 (Grupo VIP)
- **Pediu para parar:** Tag `perdido_pediu_parar` → Arquivo

### Tags GHL
```
entrada: lead-sdr-ativo
saida_sucesso: agendou-call
saida_proximo: move-grupo-vip
saida_perdido: perdido_[motivo]
```

---

## FUNIL 2: GRUPO VIP (WhatsApp/Telegram)

### Objetivo
Nutrir leads em ambiente de comunidade + rodar mini-lançamentos mensais (estilo Meteórico).

### Gatilho de Entrada
- Não converteu no Funil 1 após 7 dias
- Lead demonstrou interesse mas não agendou
- Lead pediu "mais informações"

### Estrutura do Grupo

```
SEMANA 1: INDOCTRINATION
├── Dia 1: Boas-vindas + Regras do grupo
├── Dia 2: Conteúdo de valor #1 (problema comum)
├── Dia 3: Enquete de engajamento
├── Dia 4: Case study em áudio
├── Dia 5: Conteúdo de valor #2 (solução)
├── Dia 6: Q&A ao vivo (ou gravado)
└── Dia 7: Resumo da semana + teaser

SEMANA 2: ENGAGEMENT
├── Conteúdo daily (tips, stories)
├── Pesquisa: "Qual sua maior dificuldade?"
├── Depoimentos de clientes
└── Build social proof

SEMANA 3: PRE-LAUNCH
├── Anúncio: "Algo especial vindo..."
├── Contagem regressiva
├── Bônus exclusivo para quem está no grupo
└── Lista de espera interna

SEMANA 4: LAUNCH (METEÓRICO)
├── Dia 1: Abertura do carrinho
├── Dia 2: Objeções mais comuns
├── Dia 3: Últimas vagas
├── Dia 4: Fechamento
└── Dia 5: Resultados + próximo ciclo
```

### Cadência de Mensagens

| Horário | Tipo | Objetivo |
|---------|------|----------|
| 09h | Conteúdo de valor | Educar |
| 14h | Enquete/Pergunta | Engajar |
| 19h | Story/Case | Inspirar |

### Classificação por Engajamento

| Reação | Score | Ação |
|--------|-------|------|
| 🔥 (fogo) | +3 | Alta intenção → DM privado |
| ❓ (dúvida) | +1 | Esclarecer no grupo |
| 👍 (like) | +0.5 | Interesse baixo |
| Sem reação | 0 | Nurturing |
| Saiu do grupo | -10 | Move para Funil 3 |

### Critérios de Saída
- **Converteu:** Comprou no lançamento → Cliente
- **Alta intenção (score >10):** DM privada → Call
- **Após 30 dias sem engajamento:** Move para Funil 3 (Email)

### Tags GHL
```
entrada: grupo-vip-ativo
status: grupo-vip-engajado / grupo-vip-frio
saida_sucesso: converteu-grupo
saida_proximo: move-email-nurturing
```

---

## FUNIL 3: EMAIL NURTURING

### Objetivo
Educar e construir confiança através de sequência de emails automatizada.

### Gatilho de Entrada
- Não converteu no Grupo VIP após 30 dias
- Lead tem email válido mas não engajou em outros canais
- Lead prefere comunicação por email

### Sequência de Emails (45 dias)

#### FASE 1: INDOCTRINATION (Dias 1-10)

| Email | Dia | Subject | Objetivo |
|-------|-----|---------|----------|
| 1 | D+0 | "Bem-vindo! Aqui está o que você pediu" | Entregar lead magnet |
| 2 | D+2 | "Por que [problema] acontece com você" | Agitar dor |
| 3 | D+4 | "O erro #1 que [público] comete" | Educar |
| 4 | D+6 | "Como [cliente] resolveu isso" | Social proof |
| 5 | D+8 | "Você está pronto para mudar?" | Transição |

#### FASE 2: ENGAGEMENT (Dias 11-30)

| Email | Dia | Subject | Objetivo |
|-------|-----|---------|----------|
| 6 | D+11 | "3 mitos sobre [solução]" | Quebrar crenças |
| 7 | D+14 | "O que ninguém te conta sobre [tema]" | Curiosidade |
| 8 | D+17 | "Pergunta rápida..." | Engajamento |
| 9 | D+20 | "[Nome], você viu isso?" | Re-engajamento |
| 10 | D+23 | "Última chance de ver [conteúdo]" | Urgência |
| 11 | D+26 | "O que acontece quando você ignora [problema]" | PAS |
| 12 | D+30 | "Convite especial para você" | Oferta |

#### FASE 3: CONVERSION (Dias 31-45)

| Email | Dia | Subject | Objetivo |
|-------|-----|---------|----------|
| 13 | D+33 | "Isso é para você?" | Qualificação |
| 14 | D+36 | "Re: sua situação" | Personalização |
| 15 | D+40 | "Última mensagem sobre isso" | Fechamento |
| 16 | D+45 | "Ainda com interesse em [benefício]?" | 9-word |

### Métricas de Sucesso

| Métrica | Meta | Excelente |
|---------|------|-----------|
| Open Rate | 25%+ | 40%+ |
| Click Rate | 3%+ | 8%+ |
| Reply Rate | 1%+ | 5%+ |
| Conversion | 5%+ | 12%+ |

### Critérios de Saída
- **Converteu:** Clicou em CTA + Agendou → Cliente
- **Engajou (open rate >50%):** Move para Funil 4 (Loom)
- **Não abriu nenhum email (45 dias):** Move para Funil 6 (Farming)

### Tags GHL
```
entrada: email-nurturing-ativo
status: email-engajado / email-frio
saida_sucesso: converteu-email
saida_proximo: move-video-loom
```

---

## FUNIL 4: VIDEO LOOM/VSL

### Objetivo
Criar conexão pessoal através de vídeos curtos e personalizados.

### Gatilho de Entrada
- Engajou com emails (abriu >50%) mas não converteu
- Lead demonstrou interesse mas precisa de "rosto humano"
- Lead respondeu email com dúvidas

### Sequência de Vídeos (14 dias)

| Dia | Tipo | Duração | Conteúdo |
|-----|------|---------|----------|
| D+0 | Loom personalizado | 45-60s | "Oi [Nome], vi que você [contexto]..." |
| D+3 | VSL problema | 3-5min | Apresentação do problema + solução |
| D+7 | Loom follow-up | 30s | "Vi que você assistiu, alguma dúvida?" |
| D+10 | Case study vídeo | 2-3min | Cliente real contando história |
| D+14 | Loom final | 45s | "Última mensagem sobre isso" |

### Script do Loom Personalizado (Template)

```
[0-5s] CURIOSIDADE
"Oi [Nome], gravei esse vídeo especialmente pra você..."

[5-35s] CONTEXTO + VALOR
"Vi que você [ação que fez]. Deixa eu te mostrar uma coisa..."
[Mostrar tela com algo relevante para o lead]

[35-45s] CTA
"Se fizer sentido, clica no link abaixo pra gente conversar.
Sem compromisso, só pra entender se faz sentido pra você."

[45-60s] FECHAMENTO
"Valeu, [Nome]! Espero que ajude."
```

### Métricas de Sucesso

| Métrica | Meta | Excelente |
|---------|------|-----------|
| Play Rate | 40%+ | 60%+ |
| Watch Time | 70%+ | 90%+ |
| CTA Click | 15%+ | 30%+ |
| Reply Rate | 10%+ | 25%+ |

### Critérios de Saída
- **Converteu:** Clicou no CTA + Agendou → Cliente
- **Assistiu mas não converteu:** Move para Funil 5 (Webinar)
- **Não assistiu nenhum vídeo:** Move para Funil 6 (Farming)

### Tags GHL
```
entrada: video-loom-ativo
status: video-assistiu / video-ignorou
saida_sucesso: converteu-video
saida_proximo: move-webinar
```

---

## FUNIL 5: WEBINAR CÍCLICO

### Objetivo
Evento de conversão mensal com oferta especial.

### Gatilho de Entrada
- Passou pelos funis 1-4 sem converter
- Lead frio que precisa de "evento" para tomar decisão
- Reativação de base antiga

### Estrutura do Webinar (Russell Brunson - Perfect Webinar)

```
ESTRUTURA (45-60 min):

[0-5 min] HOOK
├── Promessa forte
├── Credenciais rápidas
└── "Fique até o final para..."

[5-15 min] HISTÓRIA
├── De onde vim
├── Descoberta da solução
└── Resultados obtidos

[15-35 min] CONTEÚDO (3 Segredos)
├── Segredo 1: [Quebrar crença limitante #1]
├── Segredo 2: [Quebrar crença limitante #2]
└── Segredo 3: [Quebrar crença limitante #3]

[35-45 min] OFERTA
├── Stack de valor
├── Bônus exclusivos
├── Garantia
└── Preço e condições

[45-60 min] Q&A + FECHAMENTO
├── Responder objeções
├── Depoimentos
├── Urgência (vagas/prazo)
└── CTA final
```

### Sequência de Emails (Webinar)

| Email | Timing | Subject |
|-------|--------|---------|
| 1 | Inscrição | "✅ Seu spot está reservado" |
| 2 | D-2 | "3 erros que você vai aprender a evitar" |
| 3 | D-1 | "Amanhã às [hora] - não perca!" |
| 4 | D0 -1h | "Começamos em 1 hora!" |
| 5 | D0 +2h | "Replay disponível (por tempo limitado)" |
| 6 | D+1 | "Você assistiu? Aqui está o resumo" |
| 7 | D+2 | "Últimas 24h para [oferta]" |
| 8 | D+3 | "Encerramento - última chance" |

### Métricas de Sucesso

| Métrica | Meta | Excelente |
|---------|------|-----------|
| Inscrição | 30%+ | 50%+ |
| Show-up Rate | 35%+ | 50%+ |
| Watch Time | 60%+ | 80%+ |
| Conversion | 10%+ | 25%+ |

### Frequência
- **Webinar ao vivo:** 1x por mês
- **Webinar gravado:** Evergreen (sempre disponível)
- **Mini-webinar (30min):** 2x por mês

### Critérios de Saída
- **Converteu:** Comprou → Cliente
- **Assistiu mas não comprou:** Move para Funil 6 (Farming)
- **Não assistiu:** Convida para próximo webinar (máx 3x)

### Tags GHL
```
entrada: webinar-inscrito
status: webinar-assistiu / webinar-noshow
saida_sucesso: converteu-webinar
saida_proximo: move-farming
```

---

## FUNIL 6: SALES FARMING (60-90 dias)

### Objetivo
Cultivo de longo prazo para leads que precisam de mais tempo.

### Gatilho de Entrada
- Passou por todos os funis sem converter
- Lead disse "agora não" mas demonstrou interesse futuro
- Lead com potencial alto mas timing ruim

### Cadência (90 dias)

| Período | Frequência | Tipo de Contato |
|---------|------------|-----------------|
| D1-D30 | 1x semana | Email de valor |
| D31-D60 | 1x a cada 2 semanas | Email + ocasional WhatsApp |
| D61-D90 | 1x por mês | Check-in leve |

### Tipos de Mensagem (Farming)

| Semana | Tipo | Exemplo |
|--------|------|---------|
| 1 | Conteúdo educacional | "3 tendências de [área] para 2026" |
| 3 | Case study | "Como [cliente] conseguiu [resultado]" |
| 5 | Pergunta de engajamento | "Qual seu maior desafio com [tema]?" |
| 7 | Novidade/atualização | "Lançamos [feature/serviço]" |
| 9 | Convite para evento | "Webinar especial sobre [tema]" |
| 11 | Check-in pessoal | "Oi [Nome], tudo bem por aí?" |

### Gatilhos de Reativação

Se o lead fizer qualquer ação durante o farming:
- **Abriu 3+ emails seguidos:** Ligar/WhatsApp
- **Clicou em link:** Email personalizado
- **Respondeu email:** Iniciar conversa
- **Visitou site (se tiver tracking):** Retargeting + email

### Critérios de Saída
- **Converteu:** Qualquer ação → Reinicia em Funil 1
- **Após 90 dias sem engajamento:** Move para Funil 7 (Reativação)

### Tags GHL
```
entrada: farming-ativo
status: farming-engajou / farming-frio
saida_sucesso: farming-reativou
saida_proximo: move-reativacao
```

---

## FUNIL 7: REATIVAÇÃO CÍCLICA

### Objetivo
Dar 2ª, 3ª, 4ª chances para leads que passaram por tudo.

### Gatilho de Entrada
- Completou Funil 6 (Farming) sem converter
- Lead está na base há mais de 120 dias
- Lead "morto" que nunca mais respondeu

### Estratégia: 9-Word Email (Dean Jackson)

O email mais simples e eficaz para reativação:

```
Subject: [Nome], você ainda está interessado em [benefício]?

Corpo: (vazio ou apenas assinatura)
```

**Por que funciona:**
- Simples demais para ser spam
- Parece pessoal
- Fácil de responder (sim/não)

### Cadência de Reativação (A cada 60 dias)

| Ciclo | Abordagem | Canal |
|-------|-----------|-------|
| Ciclo 1 | 9-word email | Email |
| Ciclo 2 | "Sumiu! Tudo bem?" | WhatsApp |
| Ciclo 3 | Convite webinar | Email + WhatsApp |
| Ciclo 4 | Oferta especial | Email |
| Ciclo 5 | Última tentativa | WhatsApp |

### Após 3 Ciclos Sem Resposta
- Move para **Arquivo Frio**
- Tag: `arquivo-frio-[data]`
- Reativação anual (1x por ano com oferta especial)

### Tags GHL
```
entrada: reativacao-ciclo-[N]
saida_sucesso: reativou-ciclo-[N]
saida_final: arquivo-frio
```

---

## FUNIL 8: NO-SHOW RESCUE (Paralelo)

### Objetivo
Recuperar leads que agendaram mas não compareceram.

### Gatilho de Entrada
- Lead agendou call/consulta mas não apareceu
- Lead cancelou em cima da hora

### Cadência (5 dias)

| Timing | Canal | Mensagem |
|--------|-------|----------|
| +30min | WhatsApp | "Oi [Nome]! Vi que não conseguiu entrar na call. Tudo bem?" |
| +2h | WhatsApp | "Aconteceu alguma coisa? Posso reagendar pra você" |
| +24h | Email | "Guardei sua vaga - reagendar é fácil" |
| +48h | WhatsApp | Loom de 30s: "Oi [Nome], gravei esse vídeo pra você..." |
| +5d | WhatsApp | "Última tentativa - ainda faz sentido conversar?" |

### Regra de 3 No-Shows
- 1º no-show: Reagenda normalmente
- 2º no-show: Reagenda com confirmação 1h antes
- 3º no-show: Tag `perdido_noshow_recorrente` → Move para Funil 2 (Grupo)

### Tags GHL
```
entrada: noshow-[N]
saida_sucesso: reagendou-noshow
saida_proximo: move-grupo-vip (após 3x)
```

---

## VISÃO CONSOLIDADA: TAXA DE CONVERSÃO EMPILHADA

Considerando 1.000 leads entrando no sistema:

| Funil | Leads Entram | Taxa Conv. | Clientes | Leads Restantes |
|-------|--------------|------------|----------|-----------------|
| 1. SDR Direto | 1.000 | 20% | 200 | 800 |
| 2. Grupo VIP | 800 | 15% | 120 | 680 |
| 3. Email Nurturing | 680 | 10% | 68 | 612 |
| 4. Video Loom | 612 | 18% | 110 | 502 |
| 5. Webinar | 502 | 22% | 110 | 392 |
| 6. Farming | 392 | 6% | 24 | 368 |
| 7. Reativação | 368 | 4% | 15 | 353 |
| **TOTAL** | 1.000 | - | **647** | 353 |

**Conversão Total: 64.7%** (vs 20% com funil único)

---

## SCHEMA SQL: SUPORTE A MÚLTIPLOS FUNIS

### Atualização da Tabela `fuu_cadences` (Action Types)

```sql
-- Adicionar colunas de action_type na tabela existente
ALTER TABLE fuu_cadences
ADD COLUMN IF NOT EXISTS action_type VARCHAR(20) DEFAULT 'ai_text',
-- Valores: 'ai_text', 'template', 'tag', 'ai_call', 'skip', 'manual', 'webhook'
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fallback_action VARCHAR(20) DEFAULT 'ai_text',
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
-- Configurações para ai_call
ADD COLUMN IF NOT EXISTS requires_qualification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_engagement_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowed_stages VARCHAR[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS qualification_tags VARCHAR[] DEFAULT '{}';

-- Comentários explicativos
COMMENT ON COLUMN fuu_cadences.action_type IS 'Tipo de ação: ai_text, template, tag, ai_call, skip, manual, webhook';
COMMENT ON COLUMN fuu_cadences.is_enabled IS 'Se false, etapa é pulada';
COMMENT ON COLUMN fuu_cadences.fallback_action IS 'Ação alternativa se action_type não puder ser executado';
COMMENT ON COLUMN fuu_cadences.requires_qualification IS 'Se true, verifica qualificação antes de executar (usado em ai_call)';
COMMENT ON COLUMN fuu_cadences.min_engagement_score IS 'Score mínimo para executar ação (0-100)';
COMMENT ON COLUMN fuu_cadences.allowed_stages IS 'Estágios onde esta ação pode ser executada';
COMMENT ON COLUMN fuu_cadences.qualification_tags IS 'Tags que o lead precisa ter para executar ação';
```

### Exemplo de Cadência com Action Types

```sql
-- Cadência padrão com múltiplos action_types
INSERT INTO fuu_cadences (
  location_id, channel, attempt_number, delay_hours,
  action_type, is_enabled, fallback_action,
  requires_qualification, min_engagement_score, allowed_stages
) VALUES
-- Tentativa 1: Mensagem IA
('default', 'whatsapp', 1, 0.5, 'ai_text', true, NULL, false, 0, '{}'),
-- Tentativa 2: Mensagem IA
('default', 'whatsapp', 2, 2, 'ai_text', true, NULL, false, 0, '{}'),
-- Tentativa 3: Áudio via tag (se cliente configurou)
('default', 'whatsapp', 3, 6, 'tag', true, 'ai_text', false, 0, '{}'),
-- Tentativa 4: Mensagem IA
('default', 'whatsapp', 4, 24, 'ai_text', true, NULL, false, 0, '{}'),
-- Tentativa 5: Ligação IA (só para qualificados)
('default', 'whatsapp', 5, 48, 'ai_call', true, 'tag', true, 70, '{pre_agendamento,reagendamento}'),
-- Tentativa 6: Breakup message
('default', 'whatsapp', 6, 72, 'ai_text', true, NULL, false, 0, '{}');
```

---

### Nova Tabela: `fuu_funnel_tracking`

```sql
CREATE TABLE fuu_funnel_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,

  -- Funil atual
  current_funnel VARCHAR(50) NOT NULL,  -- 'sdr_direto', 'grupo_vip', 'email_nurturing', etc
  funnel_stage INTEGER DEFAULT 1,        -- Estágio dentro do funil

  -- Histórico
  previous_funnels JSONB DEFAULT '[]',   -- Array de funis anteriores
  funnel_started_at TIMESTAMPTZ DEFAULT NOW(),

  -- Métricas do funil atual
  messages_sent INTEGER DEFAULT 0,
  messages_opened INTEGER DEFAULT 0,
  links_clicked INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,

  -- Controle
  status VARCHAR(20) DEFAULT 'active',   -- 'active', 'converted', 'moved', 'archived'
  next_action_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id)
);

-- Índices
CREATE INDEX idx_fuu_funnel_location_status ON fuu_funnel_tracking(location_id, status);
CREATE INDEX idx_fuu_funnel_current ON fuu_funnel_tracking(current_funnel, funnel_stage);
CREATE INDEX idx_fuu_funnel_next_action ON fuu_funnel_tracking(next_action_at) WHERE status = 'active';
```

### Nova Tabela: `fuu_funnel_definitions`

```sql
CREATE TABLE fuu_funnel_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  funnel_code VARCHAR(50) UNIQUE NOT NULL,
  funnel_name VARCHAR(100) NOT NULL,
  funnel_order INTEGER NOT NULL,          -- Ordem no empilhamento

  -- Configuração
  duration_days INTEGER NOT NULL,
  max_stages INTEGER NOT NULL,
  channels JSONB NOT NULL,                -- ['whatsapp', 'email', 'sms']

  -- Próximo funil
  next_funnel_code VARCHAR(50),           -- Para onde vai se não converter

  -- Métricas esperadas
  expected_conversion_rate DECIMAL(5,2),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados iniciais
INSERT INTO fuu_funnel_definitions (funnel_code, funnel_name, funnel_order, duration_days, max_stages, channels, next_funnel_code, expected_conversion_rate)
VALUES
  ('sdr_direto', 'SDR Direto', 1, 7, 6, '["whatsapp", "instagram"]', 'grupo_vip', 0.20),
  ('grupo_vip', 'Grupo VIP', 2, 30, 4, '["whatsapp_group"]', 'email_nurturing', 0.15),
  ('email_nurturing', 'Email Nurturing', 3, 45, 16, '["email"]', 'video_loom', 0.10),
  ('video_loom', 'Video Loom/VSL', 4, 14, 5, '["email", "whatsapp"]', 'webinar', 0.18),
  ('webinar', 'Webinar Cíclico', 5, 30, 8, '["email", "whatsapp"]', 'farming', 0.22),
  ('farming', 'Sales Farming', 6, 90, 12, '["email"]', 'reativacao', 0.06),
  ('reativacao', 'Reativação Cíclica', 7, 60, 5, '["email", "whatsapp"]', NULL, 0.04);
```

### Nova Tabela: `fuu_group_members`

```sql
CREATE TABLE fuu_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  group_id VARCHAR(100) NOT NULL,         -- ID do grupo WhatsApp/Telegram

  -- Status
  status VARCHAR(20) DEFAULT 'active',    -- 'active', 'left', 'removed', 'converted'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  -- Engajamento
  reactions_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  last_engagement_at TIMESTAMPTZ,

  -- Lançamento
  launch_participated BOOLEAN DEFAULT false,
  launch_converted BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, group_id)
);
```

### Nova Tabela: `fuu_email_tracking`

```sql
CREATE TABLE fuu_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  email_sequence_id VARCHAR(50) NOT NULL,
  email_number INTEGER NOT NULL,

  -- Status
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,

  -- Métricas
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, email_sequence_id, email_number)
);
```

### Nova Tabela: `fuu_video_tracking`

```sql
CREATE TABLE fuu_video_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  video_id VARCHAR(100) NOT NULL,         -- ID do Loom/VSL
  video_type VARCHAR(20) NOT NULL,        -- 'loom_personalizado', 'vsl', 'case_study'

  -- Visualização
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,
  watch_percentage DECIMAL(5,2) DEFAULT 0,

  -- Ação
  cta_clicked BOOLEAN DEFAULT false,
  cta_clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, video_id)
);
```

### Nova Tabela: `fuu_webinar_tracking`

```sql
CREATE TABLE fuu_webinar_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  webinar_id VARCHAR(100) NOT NULL,
  webinar_date DATE NOT NULL,

  -- Funil do webinar
  registered_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  watch_time_minutes INTEGER DEFAULT 0,

  -- Conversão
  offer_viewed BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,

  -- Replay
  replay_sent BOOLEAN DEFAULT false,
  replay_viewed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, webinar_id)
);
```

---

## FUNÇÃO: Mover Lead Entre Funis

```sql
CREATE OR REPLACE FUNCTION move_lead_to_next_funnel(
  p_location_id VARCHAR,
  p_contact_id VARCHAR,
  p_reason VARCHAR DEFAULT 'timeout'
)
RETURNS JSONB AS $$
DECLARE
  v_current_funnel VARCHAR;
  v_next_funnel VARCHAR;
  v_history JSONB;
BEGIN
  -- Buscar funil atual
  SELECT current_funnel, previous_funnels
  INTO v_current_funnel, v_history
  FROM fuu_funnel_tracking
  WHERE location_id = p_location_id AND contact_id = p_contact_id;

  -- Buscar próximo funil
  SELECT next_funnel_code INTO v_next_funnel
  FROM fuu_funnel_definitions
  WHERE funnel_code = v_current_funnel;

  -- Se não tem próximo funil, arquivar
  IF v_next_funnel IS NULL THEN
    UPDATE fuu_funnel_tracking
    SET status = 'archived', updated_at = NOW()
    WHERE location_id = p_location_id AND contact_id = p_contact_id;

    RETURN jsonb_build_object('status', 'archived', 'reason', 'no_next_funnel');
  END IF;

  -- Atualizar histórico
  v_history = v_history || jsonb_build_object(
    'funnel', v_current_funnel,
    'moved_at', NOW(),
    'reason', p_reason
  );

  -- Mover para próximo funil
  UPDATE fuu_funnel_tracking
  SET
    current_funnel = v_next_funnel,
    funnel_stage = 1,
    previous_funnels = v_history,
    funnel_started_at = NOW(),
    messages_sent = 0,
    messages_opened = 0,
    links_clicked = 0,
    engagement_score = 0,
    status = 'active',
    updated_at = NOW()
  WHERE location_id = p_location_id AND contact_id = p_contact_id;

  RETURN jsonb_build_object(
    'status', 'moved',
    'from_funnel', v_current_funnel,
    'to_funnel', v_next_funnel
  );
END;
$$ LANGUAGE plpgsql;
```

---

## INTEGRAÇÃO GHL + N8N

### Tags por Funil

```yaml
FUNIL 1 - SDR Direto:
  entrada: funil-1-sdr-ativo
  progresso: funil-1-tentativa-[N]
  saida_sucesso: funil-1-converteu
  saida_proximo: funil-1-move-grupo

FUNIL 2 - Grupo VIP:
  entrada: funil-2-grupo-ativo
  progresso: funil-2-semana-[N]
  engajamento: funil-2-engajado-[alto/medio/baixo]
  saida_sucesso: funil-2-converteu
  saida_proximo: funil-2-move-email

FUNIL 3 - Email Nurturing:
  entrada: funil-3-email-ativo
  progresso: funil-3-email-[N]
  engajamento: funil-3-abriu / funil-3-clicou
  saida_sucesso: funil-3-converteu
  saida_proximo: funil-3-move-video

FUNIL 4 - Video Loom:
  entrada: funil-4-video-ativo
  progresso: funil-4-video-[N]
  engajamento: funil-4-assistiu-[%]
  saida_sucesso: funil-4-converteu
  saida_proximo: funil-4-move-webinar

FUNIL 5 - Webinar:
  entrada: funil-5-webinar-inscrito
  progresso: funil-5-lembrete-[N]
  engajamento: funil-5-assistiu / funil-5-noshow
  saida_sucesso: funil-5-converteu
  saida_proximo: funil-5-move-farming

FUNIL 6 - Farming:
  entrada: funil-6-farming-ativo
  progresso: funil-6-semana-[N]
  engajamento: funil-6-engajou
  saida_sucesso: funil-6-reativou
  saida_proximo: funil-6-move-reativacao

FUNIL 7 - Reativação:
  entrada: funil-7-reativacao-ciclo-[N]
  saida_sucesso: funil-7-reativou
  saida_final: funil-7-arquivo-frio
```

### Workflow n8n: Orquestrador de Funis

```
┌─────────────────────────────────────────────────────────┐
│  TRIGGER: A cada 15 minutos                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  QUERY: Buscar leads com ação pendente                  │
│                                                         │
│  SELECT * FROM fuu_funnel_tracking                      │
│  WHERE status = 'active'                                │
│    AND next_action_at <= NOW()                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  SWITCH: Por tipo de funil                              │
├─────────────────────────────────────────────────────────┤
│  ├── sdr_direto → Workflow SDR                          │
│  ├── grupo_vip → Workflow Grupo                         │
│  ├── email_nurturing → Workflow Email                   │
│  ├── video_loom → Workflow Video                        │
│  ├── webinar → Workflow Webinar                         │
│  ├── farming → Workflow Farming                         │
│  └── reativacao → Workflow Reativação                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CADA WORKFLOW:                                         │
│  1. Executa ação do estágio atual                       │
│  2. Verifica se deve mover de estágio/funil             │
│  3. Atualiza tracking no Supabase                       │
│  4. Adiciona/remove tags no GHL                         │
└─────────────────────────────────────────────────────────┘
```

---

## PRÓXIMOS PASSOS

### Implementação Fase 1 (Semana 1-2)
- [ ] Rodar migrations SQL
- [ ] Criar Funil 1 (SDR Direto) completo
- [ ] Criar Funil 2 (Grupo VIP) básico
- [ ] Configurar tags no GHL

### Implementação Fase 2 (Semana 3-4)
- [ ] Criar Funil 3 (Email Nurturing)
- [ ] Integrar ferramenta de email (GHL ou externa)
- [ ] Configurar tracking de opens/clicks

### Implementação Fase 3 (Semana 5-6)
- [ ] Criar Funil 4 (Video Loom)
- [ ] Integrar Loom API
- [ ] Configurar tracking de visualização

### Implementação Fase 4 (Semana 7-8)
- [ ] Criar Funil 5 (Webinar)
- [ ] Configurar webinar evergreen
- [ ] Criar sequência de emails

### Implementação Fase 5 (Semana 9-10)
- [ ] Criar Funil 6 (Farming)
- [ ] Criar Funil 7 (Reativação)
- [ ] Criar Funil 8 (No-Show Rescue)

### Implementação Fase 6 (Semana 11-12)
- [ ] Dashboard de métricas
- [ ] Alertas automáticos
- [ ] Otimização baseada em dados

---

## CONCLUSÃO

O sistema de **Funis Empilhados** transforma a MOTTIVME de uma operação de funil único (20% conversão) em uma máquina de conversão multi-camada (65%+ conversão potencial).

**Princípios-chave:**
1. Todo lead merece múltiplas chances
2. Cada funil tem objetivo e cadência específicos
3. Engajamento determina velocidade de progressão
4. Dados direcionam otimização contínua
5. Automação permite escala sem equipe grande

---

*Documento criado em 2026-01-10 | MOTTIVME AI Factory*
