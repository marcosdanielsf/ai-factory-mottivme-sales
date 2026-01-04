# ARQUITETURA E INTEGRAÇÃO - FLUXO GHL MOTTIVME EUA

## ÍNDICE
1. [Visão Geral da Arquitetura](#visão-geral)
2. [Componentes Principais](#componentes-principais)
3. [Integrações Externas](#integrações-externas)
4. [Fluxo de Dados End-to-End](#fluxo-de-dados)
5. [Padrões Arquiteturais](#padrões-arquiteturais)
6. [Segurança e Credenciais](#segurança)
7. [Escalabilidade](#escalabilidade)

---

## 1. VISÃO GERAL DA ARQUITETURA

### Resumo Executivo
O fluxo GHL Mottivme EUA é um sistema complexo de automação de vendas com IA que integra:
- **115 nós** organizados em 8 categorias funcionais
- **91 conexões** orquestrando o fluxo de dados
- **Múltiplos agentes IA** (Anthropic Claude, Google Gemini, OpenAI)
- **Integração GoHighLevel** para CRM
- **Banco PostgreSQL** para persistência
- **LangChain** para orquestração de IA

### Diagrama de Arquitetura High-Level

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE ENTRADA                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Webhook (GHL) → Info Node → Validação → Roteamento                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  CAMADA DATA    │ │  CAMADA HTTP    │ │  CAMADA DB      │
│                 │ │                 │ │                 │
│  • Transform    │ │  • GHL API      │ │  • Postgres     │
│  • Code (15)    │ │  • External     │ │  • 20 nós       │
│  • Set (8)      │ │  • Webhooks     │ │  • Transações   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                  ┌─────────────────────┐
                  │   CAMADA DE IA      │
                  ├─────────────────────┤
                  │  LangChain Agent    │
                  │  • Claude Opus 4.5  │
                  │  • Gemini Flash     │
                  │  • GPT-4            │
                  │  • Tools (8)        │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │  CAMADA CONTROLE    │
                  ├─────────────────────┤
                  │  • Switch (7)       │
                  │  • If (4)           │
                  │  • Filter (3)       │
                  │  • Wait (3)         │
                  └──────────┬──────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE SAÍDA                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Formatação → Envio GHL → Persistência → Métricas                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENTES PRINCIPAIS

### 2.1 Módulo de Entrada e Validação
**Responsabilidade:** Receber webhooks e validar dados

**Nós envolvidos:**
- Webhook (1 nó)
- Info nodes (validação)
- Set nodes (normalização)

### 2.2 Módulo de Persistência
**Responsabilidade:** Gerenciar estado e histórico

**Tabelas principais:**
- `n8n_fila_mensagens` - Buffer temporário
- `n8n_active_conversation` - Estado de conversas
- `n8n_historico_mensagens` - Memória de longo prazo
- `crm_historico_mensagens` - Log permanente
- `execution_metrics` - Métricas de execução

### 2.3 Módulo de Orquestração de IA
**Responsabilidade:** Coordenar agentes e ferramentas

**Componentes:**
- Agent LangChain (coordenador principal)
- Chain LLM (pipeline de processamento)
- Tools (8 ferramentas especializadas)
- Output Parser (estruturação de respostas)

### 2.4 Módulo de Integração
**Responsabilidade:** Comunicação com sistemas externos

**Integrações:**
- GoHighLevel CRM (API REST)
- Modelos de IA (Anthropic, Google, OpenAI)
- Banco de dados Postgres
- Webhooks externos

---

## 3. INTEGRAÇÕES EXTERNAS

### 3.1 GoHighLevel (GHL)

**Tipo:** REST API
**Autenticação:** Bearer Token (API Key)
**Endpoints utilizados:**

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/conversations/{id}/messages` | POST | Enviar mensagens |
| `/contacts/{id}` | GET | Buscar dados do contato |
| `/contacts/{id}` | PUT | Atualizar contato |
| `/opportunities` | POST | Criar oportunidade |
| `/tasks` | POST | Criar tarefa |

**Rate Limits:**
- 120 req/min por location
- Retry com backoff exponencial

### 3.2 Anthropic Claude

**Modelo:** claude-opus-4-20250514
**Uso:** Agente principal de conversação
**Configuração:**
- Temperature: 0.7
- Max tokens: 4096
- System prompt: [Ver guia AI/LLM]

### 3.3 Google Gemini

**Modelo:** gemini-2.0-flash-exp
**Uso:** Processamento rápido, classificação
**Configuração:**
- Temperature: 0.3
- Max tokens: 2048

### 3.4 OpenAI GPT

**Modelo:** gpt-4-turbo
**Uso:** Fallback e tarefas específicas
**Configuração:**
- Temperature: 0.5
- Max tokens: 3000

### 3.5 PostgreSQL

**Versão:** 14+
**Host:** [configurado via credencial]
**Schema:** public
**Tabelas:** 8 principais
**Conexões:** Pool gerenciado pelo n8n

---

## 4. FLUXO DE DADOS END-TO-END

### 4.1 Ciclo Completo: Mensagem → Resposta

```
1. ENTRADA
   Webhook GHL recebe mensagem
   ↓
2. VALIDAÇÃO
   Info node extrai dados
   Set node normaliza campos
   ↓
3. PERSISTÊNCIA ENTRADA
   INSERT em crm_historico_mensagens (log)
   INSERT em n8n_fila_mensagens (buffer)
   ↓
4. VERIFICAÇÃO ESTADO
   SELECT em n8n_active_conversation
   Switch: conversa ativa?
   ↓
5. PREPARAÇÃO CONTEXTO
   SELECT em n8n_historico_mensagens (memória)
   Concatenar mensagens da fila
   Code node: formatar contexto
   ↓
6. ORQUESTRAÇÃO IA
   Agent LangChain recebe contexto
   Decide quais tools usar
   Executa tools (workflow, HTTP, etc)
   Gera resposta estruturada
   ↓
7. PÓS-PROCESSAMENTO
   Output Parser extrai campos
   Code node formata para GHL
   Switch: tipo de ação?
   ↓
8. AÇÕES
   HTTP Request → GHL (enviar mensagem)
   HTTP Request → GHL (criar tarefa/opp)
   Postgres → salvar na memória
   ↓
9. FINALIZAÇÃO
   UPDATE n8n_active_conversation (status)
   INSERT em execution_metrics
   DELETE de n8n_fila_mensagens
```

### 4.2 Padrões de Fluxo de Dados

#### Pattern 1: Buffer & Batch
```
Mensagem → Fila → Acumular → Processar em lote → Limpar fila
```
**Propósito:** Evitar processamentos múltiplos de mensagens rápidas

#### Pattern 2: State Management
```
Check estado → Update estado → Processar → Update estado → Limpar estado
```
**Propósito:** Prevenir race conditions e processamento duplicado

#### Pattern 3: Multi-Model Orchestration
```
Classificador (Gemini) → Roteamento → Modelo especializado → Output
```
**Propósito:** Otimizar custo usando modelo certo para cada tarefa

---

## 5. PADRÕES ARQUITETURAIS

### 5.1 Event-Driven Architecture
- Webhook como trigger
- Processamento assíncrono
- Wait nodes para coordenação

### 5.2 Pipeline Pattern
- Transformações sequenciais
- Code → Set → Transform → Output
- Cada estágio tem responsabilidade única

### 5.3 Repository Pattern
- Nós Postgres encapsulam acesso a dados
- Operações CRUD bem definidas
- Separação de concerns

### 5.4 Strategy Pattern
- Switch nodes para roteamento
- Diferentes estratégias por tipo de mensagem
- Configuração dinâmica via agent_versions

### 5.5 Circuit Breaker
- Retry logic nos nós HTTP
- Fallback para modelos alternativos
- Timeout e error handling

---

## 6. SEGURANÇA E CREDENCIAIS

### 6.1 Credenciais Utilizadas

| Nome | Tipo | Uso |
|------|------|-----|
| Postgres Marcos Daniels | PostgreSQL | 19 nós DB |
| Postgres account | PostgreSQL | 1 nó DB |
| GHL API Key | HTTP Header Auth | Chamadas GHL |
| Anthropic API Key | Bearer Token | Claude |
| Google AI API Key | API Key | Gemini |
| OpenAI API Key | Bearer Token | GPT |

### 6.2 Boas Práticas

✅ **Implementadas:**
- Credenciais armazenadas no n8n credential manager
- Não hardcoded em código
- Uso de variáveis de ambiente

⚠️ **Melhorias Recomendadas:**
- Rotação automática de API keys
- Secrets manager externo (Vault, AWS Secrets)
- Audit log de uso de credenciais
- Rate limiting por credencial

### 6.3 Validação de Input

- Sanitização de dados do webhook
- Validação de tipos
- Escape de SQL injection
- XSS prevention em mensagens

---

## 7. ESCALABILIDADE

### 7.1 Limitações Atuais

| Componente | Limite | Impacto |
|------------|--------|---------|
| Conexões DB | Pool limitado | Gargalo em alta concorrência |
| GHL API | 120 req/min | Throttling em picos |
| Execuções n8n | Sequenciais | Latência aumenta com volume |
| Memória histórico | Crescimento ilimitado | Performance degrada |

### 7.2 Estratégias de Escala

#### Horizontal Scaling
```
Load Balancer
    ├─► n8n Instance 1
    ├─► n8n Instance 2
    └─► n8n Instance 3
         ↓
    PostgreSQL Cluster
    (Primary + Replicas)
```

#### Database Optimization
- Índices nas queries frequentes
- Particionamento de tabelas históricas
- Archival de dados antigos
- Read replicas para consultas

#### API Rate Limiting
- Queue system para GHL requests
- Batch operations onde possível
- Caching de dados frequentes
- Retry com backoff exponencial

#### Cost Optimization
- Usar Gemini Flash para classificação (mais barato)
- Claude Opus apenas para conversação complexa
- Caching de respostas similares
- Compressão de histórico

### 7.3 Monitoramento

**Métricas Críticas:**
- Latência end-to-end
- Taxa de erro por nó
- Throughput de mensagens
- Uso de tokens IA
- Tamanho das filas
- Connection pool utilization

**Alertas:**
- Fila > 100 mensagens
- Latência > 30s
- Taxa erro > 5%
- Pool connections > 80%

---

## PRÓXIMOS PASSOS

1. Implementar caching Redis
2. Adicionar circuit breaker pattern
3. Criar dashboard de monitoramento
4. Implementar auto-scaling
5. Adicionar disaster recovery

---

**Versão:** 1.0
**Data:** 2025-12-31
**Responsável:** Equipe de Arquitetura - AI Factory
