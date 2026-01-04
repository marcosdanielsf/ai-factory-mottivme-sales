# GUIA COMPLETO DOS NOS OUTROS (STICKY NOTES) - FLUXO PRINCIPAL GHL MOTTIVME

## INDICE
1. [Visao Geral](#visao-geral)
2. [Tipos Identificados](#tipos-identificados)
3. [Mapa de Relacionamentos](#mapa-de-relacionamentos)
4. [Detalhamento Individual](#detalhamento-individual)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Referencia Rapida](#referencia-rapida)

---

## 1. VISAO GERAL

### Resumo Executivo
O fluxo principal do GHL Mottivme utiliza **13 nos Sticky Notes** que servem como documentacao visual inline do workflow. Estes nos estao organizados em **5 categorias funcionais** que demarcam as principais secoes do fluxo:

| Categoria | Quantidade | Proposito |
|-----------|------------|-----------|
| Secoes Principais | 4 | Demarcam areas macro do workflow |
| Processamento de Mensagens | 3 | Documentam logica de mensagens |
| Controle de Envio | 2 | Explicam validacoes de envio |
| Configuracao/Desenvolvimento | 2 | Areas de testes e reset |
| Instrucoes Tecnicas | 2 | Documentam integracao e ferramentas |

### Sistema de Cores dos Sticky Notes

O n8n utiliza um sistema numerico para cores:

| Codigo | Cor | Uso no Workflow |
|--------|-----|-----------------|
| 2 | Verde | Testes/Desenvolvimento |
| 4 | Amarelo | Processamento de mensagens |
| 5 | Azul Claro | Headers de secao |
| 6 | Roxo/Lilas | Validacoes e verificacoes |
| 7 | Rosa | Envio de respostas |
| (default) | Cinza | Notas gerais |

---

## 2. TIPOS IDENTIFICADOS

### 2.1 Classificacao por Funcao

```
STICKY NOTES DO WORKFLOW
        |
        +-- SECOES PRINCIPAIS (Demarcacao de Areas)
        |       |-- "1. Assistencia" (Entrada do fluxo)
        |       |-- "Tratando input" (Processamento inicial)
        |       |-- "Rastreio de consumo" (Metricas)
        |       +-- "Ultima mensagem e Fluxo" (Contexto)
        |
        +-- PROCESSAMENTO DE MENSAGENS
        |       |-- "Processando mensagens encavaladas"
        |       |-- "Processando audio"
        |       +-- "Verifica se o cliente mandou mensagem"
        |
        +-- CONTROLE DE ENVIO
        |       |-- "Enviando resposta"
        |       +-- "Enviar mensagem"
        |
        +-- CONFIGURACAO/DESENVOLVIMENTO
        |       |-- "Habilitar testes" (DESABILITADO)
        |       +-- "Resetar conversa" (DESABILITADO)
        |
        +-- INSTRUCOES TECNICAS
                |-- "Importante" (Tool Socialfy)
                +-- "Inserir automacao para disparar..."
```

### 2.2 Distribuicao por Estado

| Estado | Quantidade | Descricao |
|--------|------------|-----------|
| Ativos | 11 | Visiveis e funcionais no workflow |
| Desabilitados | 2 | Ocultos (secoes de teste/reset) |

---

## 3. MAPA DE RELACIONAMENTOS

### 3.1 Layout Espacial do Workflow

```
                    EIXO X (Horizontal - Fluxo de Execucao)
    -400        0        400       800      1200     1600     2000     2400     2800     3200     ...     4800     ...     6800
      |         |         |         |         |         |         |         |         |         |         |         |         |

-1456 +-----------------------------[Habilitar testes (DISABLED)]----------------------------+
      |                                   (1920 x 784)                                        |
 -624 +                    +---[Resetar conversa (DISABLED)]---+  +---[Enviar mensagem]---+
      |                    |         (1200 x 288)              |  |      (724 x 372)      |
 -272 +--[Importante]--+   |                                   |  |                       |
      |   (320 x 320)  |   |                                   |  |                       |
  -80 |                |   |   +--[Rastreio]--+ +--[Ultima]--+ |  |                       |
      |                |   |   |   consumo    | |  mensagem  | |  |                       |
   32 |                |   |   |  (416x240)   | |  e Fluxo   | |  |                       |
      |                |   |   |              | |  (416x240) | |  |                       |
   80 +--[1.Assistencia]-+ |   |              | |            | |  |                       |
      |    (540 x 80)    | |   +--------------+ +------------+ |  |                       |
  224 +---[Tratando input]--+  +---[Processando mensagens encavaladas]---+
      |    (1060 x 540)     |  |              (1216 x 540)               |
      |                     |  |                                         |
  784 +                     |  +--[Processando audio]--+
      |                     |  |     (880 x 276)       |
  816 +--[Inserir autom.]---|  |                       |
      |                     |  |                       |
      +---------------------+  +-----------------------+

                            ...CONTINUACAO DO FLUXO...

 4824 +                                +---[Verifica se cliente mandou mensagem]---+
      |                                |              (1200 x 544)                 |
      |                                |                                           |
      +                                +-------------------------------------------+

 6832 +                                                    +---[Enviando resposta]---+
      |                                                    |      (2236 x 668)       |
      |                                                    |                         |
      +                                                    +-------------------------+
```

### 3.2 Fluxo Logico das Secoes

```
+-------------------+     +------------------+     +----------------------+
| 1. ASSISTENCIA    |---->| TRATANDO INPUT   |---->| PROCESSANDO          |
| (Entrada webhook) |     | (Parse/validacao)|     | MENSAGENS ENCAVALADAS|
+-------------------+     +------------------+     +----------------------+
                                   |                        |
                          +--------+--------+               |
                          |                 |               |
                   +------v------+   +------v------+        |
                   | RASTREIO DE |   | ULTIMA MSG  |        |
                   | CONSUMO     |   | E FLUXO     |        |
                   +-------------+   +-------------+        |
                                                            |
                   +----------------------------------------+
                   |
                   v
         +---------+---------+     +---------------------------+
         | PROCESSANDO AUDIO |---->| VERIFICA SE CLIENTE       |
         | (Transcricao)     |     | MANDOU MENSAGEM           |
         +-------------------+     | (Durante pensamento IA)   |
                                   +-------------+-------------+
                                                 |
                                                 v
                                   +-------------+-------------+
                                   | ENVIANDO RESPOSTA         |
                                   | (Validacao final + envio) |
                                   +---------------------------+
```

---

## 4. DETALHAMENTO INDIVIDUAL

### 4.1 CATEGORIA: SECOES PRINCIPAIS

#### 4.1.1 No: "Sticky Note30" - 1. Assistencia
**ID:** `9e987e0f-f56a-4b34-92d3-078c31f81381`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## 1. Assistencia` |
| **Posicao (X, Y)** | (-368, 80) |
| **Dimensoes** | 540 x 80 |
| **Cor** | 5 (Azul Claro) |
| **Status** | Ativo |

**Proposito:** Header principal que marca o ponto de entrada do workflow. Esta e a primeira secao onde as mensagens do webhook GHL sao recebidas.

**Area Coberta:** Nos de entrada do webhook, validacao inicial e roteamento.

**Contexto no Fluxo:**
- Posicionado no extremo esquerdo (-368 no eixo X)
- Indica onde o fluxo comeca a processar mensagens vindas do GoHighLevel
- Secao 1 de uma sequencia numerada de etapas

---

#### 4.1.2 No: "Sticky Note5" - Tratando input
**ID:** `f089e8e5-627d-4b74-ac52-df7d9edbe802`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `# Tratando input` |
| **Posicao (X, Y)** | (-336, 224) |
| **Dimensoes** | 1060 x 540 |
| **Cor** | (default/cinza) |
| **Status** | Ativo |

**Proposito:** Demarca a area de tratamento inicial dos dados de entrada. Aqui os dados brutos do webhook sao parseados e preparados para processamento.

**Area Coberta:**
- Parse de JSON do webhook
- Extracao de campos (lead_id, mensagem, etc.)
- Validacao de dados obrigatorios
- Formatacao para etapas seguintes

**Contexto no Fluxo:**
- Grande area (1060x540) indicando multiplas operacoes
- Posicionada logo apos a secao de Assistencia
- Prepara dados para enfileiramento

---

#### 4.1.3 No: "Sticky Note7" - Rastreio de consumo
**ID:** `0d9fc349-deb9-4328-a5eb-b6fab8bb0b36`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Rastreio de consumo` |
| **Posicao (X, Y)** | (944, -80) |
| **Dimensoes** | 416 x 240 |
| **Cor** | (default/cinza) |
| **Status** | Ativo |

**Proposito:** Marca a area onde metricas de consumo sao registradas. Inclui tracking de execucoes, tokens consumidos e outros KPIs.

**Area Coberta:**
- Registro em `execution_metrics`
- Contagem de tokens (se aplicavel)
- Metricas de latencia
- Logs de auditoria

**Contexto no Fluxo:**
- Posicionada no topo (Y: -80) - area de metricas/observabilidade
- Paralela ao fluxo principal, nao bloqueia execucao
- Dados usados para monitoramento e billing

---

#### 4.1.4 No: "Sticky Note28" - Ultima mensagem e Fluxo
**ID:** `0a7aa3a1-a539-4c14-9406-b30e8af7da2e`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Ultima mensagem e Fluxo` |
| **Posicao (X, Y)** | (1392, -80) |
| **Dimensoes** | 416 x 240 |
| **Cor** | (default/cinza) |
| **Status** | Ativo |

**Proposito:** Demarca a area onde o contexto da ultima mensagem e o estado do fluxo sao recuperados.

**Area Coberta:**
- Query em `n8n_historico_mensagens`
- Recuperacao de `n8n_active_conversation`
- Determinacao do estado atual do lead
- Contexto para a IA

**Contexto no Fluxo:**
- Adjacente a "Rastreio de consumo" (mesmo nivel Y)
- Essencial para continuidade de conversas
- Alimenta o agente de IA com historico

---

### 4.2 CATEGORIA: PROCESSAMENTO DE MENSAGENS

#### 4.2.1 No: "Sticky Note2" - Processando mensagens encavaladas
**ID:** `760274a3-66fe-4cfa-852e-deb5f0e618c1`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `# Processando mensagens encavaladas`<br><br>`Essa etapa trata a situacao em que o usuario envia multiplas mensagens seguidas. O ponto negativo e o aumento no tempo de resposta do agente. Logica dispensa uso de solucoes mais complexas, como RabbitMQ.`<br><br>`Tempo de espera recomendado de ~16s. Quando estiver testando, recomendamos reduzir um pouco para ficar mais rapido de testar.` |
| **Posicao (X, Y)** | (768, 224) |
| **Dimensoes** | 1216 x 540 |
| **Cor** | 4 (Amarelo) |
| **Status** | Ativo |

**Proposito:** Documenta a logica de "debounce" para mensagens multiplas. Quando o usuario envia varias mensagens seguidas, o sistema aguarda um tempo antes de processar para acumular todas.

**Informacoes Tecnicas Importantes:**
- **Tempo de espera recomendado:** ~16 segundos em producao
- **Alternativa evitada:** RabbitMQ (mais complexo)
- **Trade-off:** Aumento de latencia vs simplicidade
- **Dica de teste:** Reduzir tempo para acelerar testes

**Area Coberta:**
- Nos de `Wait` (aguardar novas mensagens)
- Enfileiramento em `n8n_fila_mensagens`
- Concatenacao de mensagens
- Timer de debounce

**Contexto no Fluxo:**
- Area grande (1216x540) com cor amarela destacando importancia
- Posicionada apos tratamento de input
- Critica para UX - evita respostas fragmentadas

---

#### 4.2.2 No: "Sticky Note8" - Processando audio
**ID:** `da2a2aed-2612-472c-b2f1-408314968614`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `# Processando audio` |
| **Posicao (X, Y)** | (944, 784) |
| **Dimensoes** | 880 x 276 |
| **Cor** | 6 (Roxo/Lilas) |
| **Status** | Ativo |

**Proposito:** Demarca a area de processamento de mensagens de audio. Inclui transcricao via Whisper ou similar.

**Area Coberta:**
- Download do arquivo de audio
- Envio para API de transcricao (OpenAI Whisper)
- Conversao audio -> texto
- Tratamento de erros de transcricao

**Contexto no Fluxo:**
- Posicionada abaixo do fluxo principal (Y: 784)
- Branch condicional - apenas quando mensagem e audio
- Cor roxa indica processamento especial/validacao
- Resultado retorna ao fluxo principal como texto

---

#### 4.2.3 No: "Sticky Note3" - Verifica se o cliente mandou mensagem
**ID:** `bb6a7639-ec04-422c-b735-fe36eb312848`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Verifica se o cliente mandou mensagem`<br>`Verificamos se enquanto a IA esta pensando, se o cliente mandou mensagem. Se sim, temos que salvar nossa mensagem para pensar novamente.` |
| **Posicao (X, Y)** | (4824, -56) |
| **Dimensoes** | 1200 x 544 |
| **Cor** | 6 (Roxo/Lilas) |
| **Status** | Ativo |

**Proposito:** Documenta a logica de verificacao de novas mensagens durante o processamento da IA. Evita enviar respostas desatualizadas.

**Logica Explicada:**
1. IA comeca a processar mensagem do cliente
2. Enquanto IA "pensa", cliente pode enviar nova mensagem
3. Antes de enviar resposta, verifica se houve nova mensagem
4. Se sim: salva resposta pendente e reprocessa com contexto atualizado
5. Se nao: envia resposta normalmente

**Area Coberta:**
- Query para verificar novas mensagens na fila
- Comparacao de timestamps
- Salvamento de resposta pendente (se necessario)
- Decisao de reprocessar ou enviar

**Contexto no Fluxo:**
- Posicionada apos processamento da IA (X: 4824)
- Cor roxa indica validacao critica
- Ponto de decisao importante para qualidade da resposta

---

### 4.3 CATEGORIA: CONTROLE DE ENVIO

#### 4.3.1 No: "Sticky Note4" - Enviando resposta
**ID:** `dca72747-29ca-4991-a86c-90270f93b514`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `# Enviando resposta`<br>`Vamos verificar se nossa resposta deve ser enviada ou nao caso o usuario tenha enviado alguma mensagem durante o pensamento da IA, significa que precisamos considerar a ultima mensagem antes de responder, e o processo seguinte ira receber nossa mensagem que iriamos mandar.` |
| **Posicao (X, Y)** | (6832, 32) |
| **Dimensoes** | 2236 x 668 |
| **Cor** | 7 (Rosa) |
| **Status** | Ativo |

**Proposito:** Area final do workflow onde a resposta e efetivamente enviada ao cliente. Maior Sticky Note do fluxo, indicando a importancia desta etapa.

**Logica Explicada:**
1. Recebe resposta gerada pela IA
2. Verifica novamente se cliente enviou mensagem enquanto IA processava
3. Se cliente enviou:
   - NAO envia a resposta atual
   - Passa resposta para proximo ciclo considerar
   - Reprocessa com nova mensagem do cliente
4. Se cliente NAO enviou:
   - Envia resposta via API GHL
   - Atualiza status da conversa
   - Registra no historico

**Area Coberta:**
- Validacao final de envio
- Chamada API GHL para enviar mensagem
- Atualizacao de `n8n_active_conversation`
- Registro em `crm_historico_mensagens`
- Limpeza de estado

**Contexto no Fluxo:**
- Extremo direito do workflow (X: 6832)
- Maior area (2236x668) - muitos nos de finalizacao
- Cor rosa destaca como etapa de saida/conclusao

---

#### 4.3.2 No: "Sticky Note22" - Enviar mensagem
**ID:** `8f1a29fa-ae14-4339-916c-e889b462df53`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Enviar mensagem` |
| **Posicao (X, Y)** | (2864, -640) |
| **Dimensoes** | 724 x 372 |
| **Cor** | (default/cinza) |
| **Status** | Ativo |

**Proposito:** Demarca uma area secundaria de envio de mensagem, possivelmente para casos especificos ou testes.

**Area Coberta:**
- Envio direto de mensagens (bypass do fluxo principal?)
- Possivelmente usado para notificacoes internas
- Ou branch alternativo de resposta

**Contexto no Fluxo:**
- Posicionada na area superior (Y: -640)
- Proximo a areas de reset/testes
- Pode ser rota alternativa ou de desenvolvimento

---

### 4.4 CATEGORIA: CONFIGURACAO/DESENVOLVIMENTO

#### 4.4.1 No: "Sticky Note21" - Habilitar testes (DESABILITADO)
**ID:** `1cc3eeca-d2c5-438b-af52-1e9ee4af2d41`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Habilitar testes` |
| **Posicao (X, Y)** | (1248, -1456) |
| **Dimensoes** | 1920 x 784 |
| **Cor** | 2 (Verde) |
| **Status** | **DESABILITADO** |

**Proposito:** Area reservada para testes do workflow. Desabilitada em producao para evitar execucoes acidentais.

**Caracteristicas:**
- **MAIOR AREA** de todos os Sticky Notes (1920x784)
- Posicionada bem acima do fluxo principal (Y: -1456)
- Cor verde indica ambiente de desenvolvimento
- Status disabled oculta nos de teste

**Area Coberta (quando habilitada):**
- Triggers manuais de teste
- Dados mockados
- Bypass de validacoes
- Logs de debug extras

**Contexto no Fluxo:**
- Separada visualmente do fluxo de producao
- Pode ser habilitada temporariamente para debug
- NAO afeta fluxo normal quando desabilitada

---

#### 4.4.2 No: "Sticky Note10" - Resetar conversa (DESABILITADO)
**ID:** `98eceb9a-ff83-47eb-a284-e3276cb4085e`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Resetar conversa` |
| **Posicao (X, Y)** | (1792, -624) |
| **Dimensoes** | 1200 x 288 |
| **Cor** | 4 (Amarelo) |
| **Status** | **DESABILITADO** |

**Proposito:** Area para reset manual de conversas. Desabilitada para evitar limpeza acidental de dados.

**Area Coberta (quando habilitada):**
- Trigger manual de reset
- Limpeza de `n8n_active_conversation`
- Limpeza de `n8n_historico_mensagens`
- Reset de estado do lead

**Contexto no Fluxo:**
- Posicionada na area de desenvolvimento (Y negativo)
- Adjacente a area de testes
- Cor amarela indica atencao/cuidado
- Util para debug mas perigosa em producao

---

### 4.5 CATEGORIA: INSTRUCOES TECNICAS

#### 4.5.1 No: "Sticky Note" - Importante (Tool Socialfy)
**ID:** `b7cff738-c088-4865-aec0-7a5767a2b2a7`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `## Importante`<br><br>`Essa tool cria campo no Socialfy, basta solicitar ao Claude o campo que quer criar e copiar o campo a baixo e colar no claude para dar como referencia` |
| **Posicao (X, Y)** | (-368, -272) |
| **Dimensoes** | 320 x 320 |
| **Cor** | 6 (Roxo/Lilas) |
| **Status** | Ativo |

**Proposito:** Instrucoes para desenvolvedores sobre como usar a ferramenta de criacao de campos no Socialfy (CRM interno).

**Instrucoes Contidas:**
1. A tool do agente pode criar campos no Socialfy
2. Para criar um campo, solicitar ao Claude (agente IA)
3. Copiar exemplo de campo abaixo da nota
4. Colar como referencia para o Claude

**Contexto no Fluxo:**
- Posicionada no canto superior esquerdo (-368, -272)
- Proxima a secao de Assistencia
- Referencia para manutencao do workflow
- Documentacao inline para desenvolvedores

**Implicacao Tecnica:**
- O agente tem capacidade de criar/modificar campos no CRM
- Requer referencia de formato para novos campos
- Integracao Socialfy <- n8n <- Claude

---

#### 4.5.2 No: "Sticky Note17" - Inserir automacao para disparar...
**ID:** `5b8c6cd6-cd5b-4a64-a81d-1dc9cb09964c`

| Atributo | Valor |
|----------|-------|
| **Conteudo** | `Inserir automacao para disparar quando acionar a tag` |
| **Posicao (X, Y)** | (-352, 816) |
| **Dimensoes** | (default) |
| **Cor** | (default/cinza) |
| **Status** | Ativo |

**Proposito:** Lembrete/TODO para implementar automacao baseada em tags no GHL.

**Instrucao Contida:**
- Criar automacao que dispara quando tag e acionada
- Integracao com sistema de tags do GoHighLevel
- Provavelmente para follow-ups ou nurturing

**Contexto no Fluxo:**
- Posicionada abaixo da area de input (Y: 816)
- Nota pequena de lembrete
- Indica funcionalidade a ser implementada
- Relacionada a automacoes de tag do GHL

---

## 5. FLUXO DE DADOS

### 5.1 Mapa de Secoes no Workflow

```
EIXO X (Progressao do Fluxo) --->

[-400]                    [0]          [800]        [1400]       [4800]        [6800]
   |                       |             |             |            |             |
   v                       v             v             v            v             v

+--[IMPORTANTE]--+
|   (Instrucoes  |
|    Socialfy)   |
+----------------+
        |
+--[1.ASSISTENCIA]--+    +--[RASTREIO]--+  +--[ULTIMA]--+
|  (Entrada         |    |   CONSUMO    |  |  MENSAGEM  |
|   Webhook)        |    +---(Metricas)--+  +---(Contexto)--+
+-------------------+
        |
+--[TRATANDO INPUT]-----+  +--[PROCESSANDO MENSAGENS ENCAVALADAS]--+
|  (Parse dados)        |  |  (Debounce ~16s, concatenacao)        |
+-----------------------+  +---------------------------------------+
                                         |
+--[INSERIR AUTOMACAO]--+  +--[PROCESSANDO AUDIO]--+
|  (TODO: tags)         |  |  (Whisper transcricao)|
+-----------------------+  +-----------------------+
                                         |
                                         v
        +--[RESETAR CONVERSA]--+ (DISABLED)
        |                      |
        +--[ENVIAR MENSAGEM]---+
        |  (Branch secundario) |
        +----------------------+
                                                      |
                                          +-----------v-----------+
                                          | VERIFICA SE CLIENTE   |
                                          | MANDOU MENSAGEM       |
                                          | (Check novas msgs)    |
                                          +-----------+-----------+
                                                      |
                                                      v
                                          +-----------+-----------+
                                          | ENVIANDO RESPOSTA     |
                                          | (Validacao + Envio    |
                                          |  API GHL)             |
                                          +-----------------------+

AREA SEPARADA (DESENVOLVIMENTO):
+--[HABILITAR TESTES]--+ (DISABLED)
|  (Ambiente de teste) |
+----------------------+
```

### 5.2 Relacionamento entre Secoes e Nos Postgres

| Secao (Sticky Note) | Nos Postgres Relacionados |
|---------------------|---------------------------|
| 1. Assistencia | Webhook trigger, Info |
| Tratando input | Parse JSON, Extracao de campos |
| Rastreio de consumo | `Postgres` (execution_metrics) |
| Ultima mensagem e Fluxo | `Mensagem anteriores`, `Conversa Ativa` |
| Processando mensagens encavaladas | `Enfileirar mensagem`, `Buscar mensagens`, `Limpar fila` |
| Processando audio | Nos OpenAI Whisper (nao Postgres) |
| Verifica se cliente mandou | Query em `n8n_fila_mensagens` |
| Enviando resposta | `Atualizar resposta IA`, `Termino de resposta`, `Memoria Lead` |
| Resetar conversa | `Resetar status atendimento`, `Limpar memoria` |

### 5.3 Dependencias entre Secoes

```
1. Assistencia
       |
       v
Tratando input ----+---> Rastreio de consumo (paralelo)
       |           |
       |           +---> Ultima mensagem e Fluxo (paralelo)
       v
Processando mensagens encavaladas
       |
       +---> Processando audio (condicional - se audio)
       |
       v
   [PROCESSAMENTO IA]
       |
       v
Verifica se cliente mandou mensagem
       |
       +---> [Loop] Se nova mensagem -> volta para processamento
       |
       v
Enviando resposta
       |
       v
   [FIM DO FLUXO]
```

---

## 6. REFERENCIA RAPIDA

### 6.1 Tabela de Todos os Sticky Notes

| Nome | ID (curto) | Posicao | Dimensoes | Cor | Status |
|------|------------|---------|-----------|-----|--------|
| 1. Assistencia | 9e987e0f | (-368, 80) | 540x80 | Azul | Ativo |
| Tratando input | f089e8e5 | (-336, 224) | 1060x540 | Cinza | Ativo |
| Rastreio de consumo | 0d9fc349 | (944, -80) | 416x240 | Cinza | Ativo |
| Ultima mensagem e Fluxo | 0a7aa3a1 | (1392, -80) | 416x240 | Cinza | Ativo |
| Processando mensagens encavaladas | 760274a3 | (768, 224) | 1216x540 | Amarelo | Ativo |
| Processando audio | da2a2aed | (944, 784) | 880x276 | Roxo | Ativo |
| Verifica se cliente mandou mensagem | bb6a7639 | (4824, -56) | 1200x544 | Roxo | Ativo |
| Enviando resposta | dca72747 | (6832, 32) | 2236x668 | Rosa | Ativo |
| Enviar mensagem | 8f1a29fa | (2864, -640) | 724x372 | Cinza | Ativo |
| Habilitar testes | 1cc3eeca | (1248, -1456) | 1920x784 | Verde | **DESAB.** |
| Resetar conversa | 98eceb9a | (1792, -624) | 1200x288 | Amarelo | **DESAB.** |
| Importante (Tool Socialfy) | b7cff738 | (-368, -272) | 320x320 | Roxo | Ativo |
| Inserir automacao... | 5b8c6cd6 | (-352, 816) | default | Cinza | Ativo |

### 6.2 Sticky Notes por Categoria

| Categoria | Nomes |
|-----------|-------|
| **Secoes Principais** | 1. Assistencia, Tratando input, Rastreio de consumo, Ultima mensagem e Fluxo |
| **Processamento de Mensagens** | Processando mensagens encavaladas, Processando audio, Verifica se cliente mandou mensagem |
| **Controle de Envio** | Enviando resposta, Enviar mensagem |
| **Configuracao/Desenvolvimento** | Habilitar testes, Resetar conversa |
| **Instrucoes Tecnicas** | Importante (Tool Socialfy), Inserir automacao... |

### 6.3 Sticky Notes por Tamanho (Importancia)

| Ranking | Nome | Area (px) | Significado |
|---------|------|-----------|-------------|
| 1 | Enviando resposta | 1,493,648 | Area final critica |
| 2 | Habilitar testes | 1,505,280 | Grande area de dev |
| 3 | Processando mensagens encavaladas | 656,640 | Logica complexa |
| 4 | Verifica se cliente mandou | 652,800 | Validacao critica |
| 5 | Tratando input | 572,400 | Parse extensivo |
| 6 | Resetar conversa | 345,600 | Area de reset |
| 7 | Enviar mensagem | 269,328 | Branch secundario |
| 8 | Processando audio | 242,880 | Transcricao |
| 9 | Rastreio de consumo | 99,840 | Metricas |
| 10 | Ultima mensagem e Fluxo | 99,840 | Contexto |
| 11 | Importante (Socialfy) | 102,400 | Instrucoes |
| 12 | 1. Assistencia | 43,200 | Header simples |
| 13 | Inserir automacao... | (pequeno) | Lembrete |

### 6.4 Sticky Notes Desabilitados

| Nome | Motivo | Quando Habilitar |
|------|--------|------------------|
| Habilitar testes | Evitar execucoes de teste em producao | Debug local, desenvolvimento |
| Resetar conversa | Evitar limpeza acidental de dados | Manutencao planejada |

### 6.5 Informacoes Tecnicas Importantes nas Notas

| Nota | Informacao Critica |
|------|--------------------|
| Processando mensagens encavaladas | Tempo de espera: ~16s (reduzir em testes) |
| Verifica se cliente mandou mensagem | Logica de reprocessamento se nova msg durante IA |
| Enviando resposta | Verifica novamente antes de enviar |
| Importante (Socialfy) | Claude pode criar campos no CRM |
| Inserir automacao... | TODO: automacao baseada em tags |

---

## 7. CONSIDERACOES PARA MANUTENCAO

### 7.1 Boas Praticas para Sticky Notes

1. **Cores Consistentes:**
   - Verde (2): Desenvolvimento/Testes
   - Amarelo (4): Atencao/Processamento importante
   - Azul (5): Headers de secao
   - Roxo (6): Validacoes criticas
   - Rosa (7): Saidas/Finalizacao

2. **Posicionamento:**
   - Notas de secao no topo das areas (Y menor)
   - Notas de desenvolvimento bem separadas (Y muito negativo)
   - Instrucoes tecnicas no canto superior esquerdo

3. **Dimensionamento:**
   - Maior area = maior importancia/complexidade
   - Notas pequenas = lembretes simples

### 7.2 Recomendacoes de Atualizacao

1. **Nota "Inserir automacao para disparar..."**
   - Transformar em tarefa no sistema de tarefas
   - Ou implementar a automacao e remover nota

2. **Notas Desabilitadas**
   - Manter desabilitadas em producao
   - Documentar processo de habilitacao para debug

3. **Nota "Importante (Tool Socialfy)"**
   - Adicionar exemplo de formato de campo
   - Ou linkar para documentacao externa

### 7.3 Checklist de Revisao

- [ ] Todas as secoes principais estao demarcadas?
- [ ] Informacoes tecnicas estao atualizadas (ex: tempo de 16s)?
- [ ] Notas desabilitadas continuam desabilitadas?
- [ ] Cores seguem padrao consistente?
- [ ] TODOs foram implementados ou documentados?

---

## CHANGELOG

| Data | Versao | Descricao |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentacao inicial completa dos 13 Sticky Notes |

---

*Documento gerado para documentacao do workflow GHL Mottivme Sales*
