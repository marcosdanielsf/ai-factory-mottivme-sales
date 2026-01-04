# PLANO DE DISSECAÇÃO - FLUXO GHL MOTTIVME EUA VERSIONADO

## 🎯 OBJETIVO
Criar documentação técnica completa e estruturada do fluxo n8n, categorizando todos os 115 nós por tipo, função e relacionamento, seguindo o padrão de excelência do GUIA_COMPLETO_POSTGRES.md

---

## 📊 ANÁLISE INICIAL

### Estatísticas do Fluxo
- **Total de nós:** 115
- **Total de conexões:** 91
- **Tipos únicos:** 27
- **Complexidade:** Alta (múltiplos agentes IA, integrações HTTP, controle de fluxo complexo)

### Distribuição por Categoria

| Categoria | Nós | % |
|-----------|-----|---|
| Database (Postgres) | 20 | 17.4% |
| HTTP/API | 17 | 14.8% |
| Data Transform | 23 | 20.0% |
| Control Flow | 11 | 9.6% |
| AI/LLM | 8 | 7.0% |
| Tools (LangChain) | 7 | 6.1% |
| Utilities | 16 | 13.9% |
| Outros | 13 | 11.3% |

---

## 🤖 ESTRATÉGIA DE AGENTES ESPECIALIZADOS

### Agente 1: Database Specialist
**Responsabilidade:** Analisar os 20 nós Postgres
- Operações (SELECT, INSERT, UPDATE, DELETE, UPSERT)
- Tabelas utilizadas
- Relacionamentos entre queries
- Fluxo de dados entre nós
- Índices e otimizações

**Modelo:** claude-opus-4.5 (máxima precisão para SQL)

### Agente 2: HTTP/API Specialist
**Responsabilidade:** Analisar os 17 nós HTTP/API
- Endpoints chamados
- Métodos (GET, POST, PUT, DELETE)
- Headers e autenticação
- Payloads de request/response
- Rate limiting e retry logic
- Integrações externas (GHL, etc)

**Modelo:** claude-opus-4.5

### Agente 3: Data Transformation Specialist
**Responsabilidade:** Analisar os 23 nós de transformação
- Nós Code (15 unidades)
- Nós Set (8 unidades)
- Lógica de transformação
- Mapeamento de campos
- Formatação de dados
- Validações

**Modelo:** claude-opus-4.5

### Agente 4: AI/LLM Orchestration Specialist
**Responsabilidade:** Analisar os 8 nós de IA
- Agent LangChain
- Chain LLM
- Google Gemini (2 nós)
- Anthropic Claude
- OpenAI
- Prompt engineering
- Context management
- Tool calling

**Modelo:** claude-opus-4.5 (expert em IA)

### Agente 5: Control Flow Specialist
**Responsabilidade:** Analisar os 11 nós de controle
- Switch (7 unidades)
- If (4 unidades)
- Filter (3 unidades)
- Wait (3 unidades)
- Lógica condicional
- Roteamento de dados
- Error handling

**Modelo:** claude-sonnet-4.5 (eficiente para lógica)

### Agente 6: LangChain Tools Specialist
**Responsabilidade:** Analisar os 7 nós de ferramentas
- Tool Workflow (5 unidades)
- Tool HTTP Request
- Tool Think
- MCP Client Tool
- Integração com agentes
- Capability mapping

**Modelo:** claude-opus-4.5

### Agente 7: Integration Coordinator
**Responsabilidade:** Consolidar análises
- Mapear fluxo end-to-end
- Identificar padrões de integração
- Criar diagrama de arquitetura
- Documentar dependências
- Gerar guia de troubleshooting

**Modelo:** claude-opus-4.5 (visão sistêmica)

---

## 📋 ESTRUTURA DA DOCUMENTAÇÃO FINAL

Seguindo o padrão do GUIA_COMPLETO_POSTGRES.md:

```
/Analise dos nós do fluxo GHL principal por tipo/
├── 00_INDICE_MASTER.md
├── 01_GUIA_COMPLETO_POSTGRES.md (20 nós)
├── 02_GUIA_COMPLETO_HTTP_API.md (17 nós)
├── 03_GUIA_COMPLETO_DATA_TRANSFORM.md (23 nós)
├── 04_GUIA_COMPLETO_AI_LLM.md (8 nós)
├── 05_GUIA_COMPLETO_CONTROL_FLOW.md (11 nós)
├── 06_GUIA_COMPLETO_LANGCHAIN_TOOLS.md (7 nós)
├── 07_GUIA_COMPLETO_UTILITIES.md (16 nós)
├── 08_ARQUITETURA_INTEGRACAO.md
├── 09_FLUXO_DE_DADOS_COMPLETO.md
└── 10_TROUBLESHOOTING_GUIDE.md
```

### Template de Cada Guia (baseado no padrão Postgres)

```markdown
# GUIA COMPLETO DOS NÓS [CATEGORIA] - FLUXO PRINCIPAL GHL MOTTIVME

## ÍNDICE
1. Visão Geral
2. [Recursos/Tabelas/Endpoints] Utilizados
3. Mapa de Relacionamentos
4. Detalhamento por Subcategoria
5. Fluxo de Dados
6. Referência Rápida
7. Considerações para Escalar
8. Changelog

## 1. VISÃO GERAL

### Resumo Executivo
- Quantidade de nós
- Propósito principal
- Integrações principais
- Criticidade

### [Configurações/Credenciais] Utilizadas

## 2. [RECURSOS] UTILIZADOS

### 2.1 [Recurso 1]
| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|

## 3. MAPA DE RELACIONAMENTOS

```
[Diagrama ASCII detalhado do fluxo]
```

## 4. DETALHAMENTO POR SUBCATEGORIA

### 4.1 CATEGORIA: [Nome]

#### 4.1.1 Nó: "[Nome do Nó]"
**ID:** `uuid`

| Atributo | Valor |
|----------|-------|
| **Tipo** | ... |
| **Operação** | ... |

**Configurações:**
```json
{
  "detalhes": "completos"
}
```

**Propósito:** Explicação detalhada

**Dependências:**
- Input: [Nós anteriores]
- Output: [Nós posteriores]

**Lógica de Transformação:**
```javascript
// Código completo
```

## 5. FLUXO DE DADOS

### 5.1 Ciclo Completo [Descrição]

```
1. PASSO 1
   └─► Detalhamento
2. PASSO 2
   └─► Detalhamento
```

## 6. REFERÊNCIA RÁPIDA

### 6.1 Tabela de Nós por [Critério]

| [Critério] | Nós |
|------------|-----|

## 7. CONSIDERAÇÕES PARA ESCALAR

### 7.1 Pontos de Atenção
### 7.2 Recomendações
### 7.3 Otimizações

## 8. CHANGELOG
```

---

## 🎬 PLANO DE EXECUÇÃO

### Fase 1: Análise Paralela (Agentes 1-6)
**Duração estimada:** Execução simultânea

```bash
# Todos os agentes executam em paralelo
Agent 1 → 01_GUIA_COMPLETO_POSTGRES.md
Agent 2 → 02_GUIA_COMPLETO_HTTP_API.md
Agent 3 → 03_GUIA_COMPLETO_DATA_TRANSFORM.md
Agent 4 → 04_GUIA_COMPLETO_AI_LLM.md
Agent 5 → 05_GUIA_COMPLETO_CONTROL_FLOW.md
Agent 6 → 06_GUIA_COMPLETO_LANGCHAIN_TOOLS.md
```

### Fase 2: Análise de Utilities (Agente dedicado)
```bash
Agent 7 → 07_GUIA_COMPLETO_UTILITIES.md
```

### Fase 3: Integração (Agente Coordenador)
```bash
Coordinator → 08_ARQUITETURA_INTEGRACAO.md
Coordinator → 09_FLUXO_DE_DADOS_COMPLETO.md
Coordinator → 10_TROUBLESHOOTING_GUIDE.md
Coordinator → 00_INDICE_MASTER.md
```

---

## 🔍 CRITÉRIOS DE QUALIDADE

Cada guia deve incluir:

✅ **Completude**
- Todos os nós categorizados
- Todas as configurações documentadas
- Todos os relacionamentos mapeados

✅ **Profundidade**
- Código/queries completos (não trechos)
- Explicação do "porquê", não só do "o quê"
- Casos de uso e exemplos

✅ **Clareza**
- Diagramas ASCII visuais
- Tabelas organizadas
- Seções bem estruturadas

✅ **Acionabilidade**
- Troubleshooting específico
- Recomendações de otimização
- Pontos de atenção para escala

✅ **Navegabilidade**
- Índice completo
- Links internos
- Referência cruzada entre guias

---

## 📊 MÉTRICAS DE SUCESSO

1. ✅ 100% dos nós documentados
2. ✅ Fluxo de dados end-to-end mapeado
3. ✅ Todas as integrações externas identificadas
4. ✅ Todas as queries SQL documentadas
5. ✅ Todos os códigos JS/Python extraídos
6. ✅ Diagrama de arquitetura completo
7. ✅ Guia de troubleshooting acionável

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar estrutura de diretórios
2. ✅ Extrair dados do JSON para cada categoria
3. ✅ Spawnar agentes especializados em paralelo
4. ✅ Revisar e consolidar documentação
5. ✅ Gerar índice master navegável

---

**Versão:** 1.0
**Data:** 2025-12-31
**Responsável:** Claude Code + Agentes Especializados Opus 4.5
