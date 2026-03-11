# Pipeline de Integração: Análise de Calls → Segundo Cérebro (RAG)

## Visão Geral

Este documento descreve a implementação de um pipeline para enviar insights das transcrições de calls analisadas pelo Head de Vendas IA para o sistema RAG (Segundo Cérebro) da MOTTIVME.

**Objetivo:** Criar uma base de conhecimento consultável com padrões de vendas, red flags, highlights e insights de calls de alta qualidade.

---

## Arquitetura

```
┌─────────────────────────────┐
│ Workflow 02-AI-Agent-Head   │
│ Vendas-V2                   │
│                             │
│ ┌─────────────────────────┐ │
│ │ Code - Processar        │ │
│ │ Analise V2              │ │
│ └───────────┬─────────────┘ │
│             │               │
│             ▼               │
│ ┌─────────────────────────┐ │
│ │ Code - Preparar Payload │ │  ← NOVO NÓ
│ │ RAG (este documento)    │ │
│ └───────────┬─────────────┘ │
│             │               │
│             ▼               │
│ ┌─────────────────────────┐ │
│ │ IF - Score >= 60?       │ │  ← NOVO NÓ
│ └───────────┬─────────────┘ │
│             │ SIM           │
│             ▼               │
│ ┌─────────────────────────┐ │
│ │ HTTP Request - RAG      │ │  ← NOVO NÓ
│ │ Ingest                  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
                │
                ▼
    ┌─────────────────────────┐
    │ RAG/Segundo Cérebro     │
    │ (pgvector + embeddings) │
    └─────────────────────────┘
```

---

## Implementação

### Nó 1: Code - Preparar Payload RAG

**Tipo:** Code (JavaScript)
**Posição:** Após "Code - Processar Analise V2"
**Input:** Output do nó "Code - Processar Analise V2"

```javascript
// ============================================
// NÓ: Code - Preparar Payload RAG
// Workflow: 02-AI-Agent-Head-Vendas-V2
// Descrição: Formata dados da análise para envio ao RAG
// ============================================

// Buscar dados do nó anterior
const analiseData = $('Code - Processar Analise V2').first().json;

// Dados da análise
const scoreTotal = analiseData.analise_geral?.score_total || 0;
const tier = analiseData.metadata?.tier || 'N/A';
const status = analiseData.analise_geral?.status || 'N/A';
const resumoExecutivo = analiseData.analise_geral?.resumo_executivo || '';
const probabilidadeFechamento = analiseData.analise_geral?.probabilidade_fechamento || 0;

// Scores detalhados
const scoreBant = analiseData.scores_detalhados?.qualificacao_bant?.score || 0;
const scoreSpin = analiseData.scores_detalhados?.descoberta_spin?.score || 0;
const scoreConducao = analiseData.scores_detalhados?.conducao?.score || 0;
const scoreFechamento = analiseData.scores_detalhados?.fechamento?.score || 0;

// Highlights e Red Flags
const highlightsPositivos = analiseData.highlights_positivos || [];
const redFlags = analiseData.red_flags?.flags_identificados || [];
const proximosPassos = analiseData.veredicto_final?.proximos_passos || [];

// Metadados
const nomeLead = analiseData.nome_lead || 'Lead Desconhecido';
const tipoCall = analiseData.tipo_call || 'vendas';
const dataAnalise = new Date().toISOString().split('T')[0];

// ============================================
// REGRA: Só salvar se score >= 60
// ============================================
const deveEnviarRag = scoreTotal >= 60;

if (!deveEnviarRag) {
  return [{
    json: {
      skip_rag: true,
      reason: `Score ${scoreTotal} abaixo do threshold (60)`,
      score_total: scoreTotal
    }
  }];
}

// ============================================
// FORMATAR CONTEÚDO PARA BUSCA SEMÂNTICA
// ============================================

// Conteúdo formatado para ser facilmente encontrado por embeddings
const contentLines = [
  `# Análise de Call - ${nomeLead}`,
  ``,
  `## Resumo Executivo`,
  resumoExecutivo,
  ``,
  `## Métricas Principais`,
  `- Score Total: ${scoreTotal}/100 (${tier})`,
  `- Status: ${status}`,
  `- Probabilidade de Fechamento: ${probabilidadeFechamento}%`,
  `- Tipo de Call: ${tipoCall}`,
  ``,
  `## Scores por Categoria`,
  `- Qualificação BANT: ${scoreBant}/10`,
  `- Descoberta SPIN: ${scoreSpin}/10`,
  `- Condução da Call: ${scoreConducao}/10`,
  `- Técnicas de Fechamento: ${scoreFechamento}/10`,
  ``
];

// Adicionar highlights se existirem
if (highlightsPositivos.length > 0) {
  contentLines.push(`## Highlights Positivos (Boas Práticas)`);
  highlightsPositivos.forEach((h, i) => {
    contentLines.push(`${i + 1}. ${h}`);
  });
  contentLines.push(``);
}

// Adicionar red flags se existirem
if (redFlags.length > 0) {
  contentLines.push(`## Red Flags Identificados`);
  redFlags.forEach((f, i) => {
    contentLines.push(`${i + 1}. ${f}`);
  });
  contentLines.push(``);
}

// Adicionar próximos passos
if (proximosPassos.length > 0) {
  contentLines.push(`## Próximos Passos Recomendados`);
  proximosPassos.forEach((p, i) => {
    contentLines.push(`${i + 1}. ${p}`);
  });
  contentLines.push(``);
}

// Adicionar insights de performance
contentLines.push(`## Insights de Performance`);
if (scoreBant >= 8) {
  contentLines.push(`- Excelente qualificação BANT - lead bem investigado`);
}
if (scoreSpin >= 8) {
  contentLines.push(`- Forte descoberta SPIN - dores e impactos bem explorados`);
}
if (scoreConducao >= 8) {
  contentLines.push(`- Boa condução - rapport e controle da conversa`);
}
if (scoreFechamento >= 8) {
  contentLines.push(`- Técnicas de fechamento bem aplicadas`);
}
if (scoreBant < 5) {
  contentLines.push(`- Oportunidade de melhoria: qualificação BANT mais profunda`);
}
if (scoreSpin < 5) {
  contentLines.push(`- Oportunidade de melhoria: explorar mais dores com SPIN`);
}

const content = contentLines.join('\n');

// ============================================
// GERAR TAGS INTELIGENTES
// ============================================
const tags = ['call-analysis', tipoCall.toLowerCase()];

// Tags baseadas no tier
if (tier.includes('A+') || tier.includes('EXCELENTE')) {
  tags.push('best-practice', 'excelente');
}
if (tier.includes('B') && tier.includes('BOA')) {
  tags.push('boa-performance');
}
if (tier.includes('C') || tier.includes('MEDIANA')) {
  tags.push('pode-melhorar');
}

// Tags baseadas em scores altos (padrões a replicar)
if (scoreBant >= 8) tags.push('bant-forte');
if (scoreSpin >= 8) tags.push('spin-forte');
if (scoreConducao >= 8) tags.push('conducao-forte');
if (scoreFechamento >= 8) tags.push('fechamento-forte');

// Tags baseadas no status
if (status === 'QUALIFICADO') tags.push('qualificado');
if (status === 'NUTRIR') tags.push('nutrir');
if (probabilidadeFechamento >= 70) tags.push('high-probability');

// Tags de red flags (para aprendizado)
if (redFlags.length > 0) tags.push('tem-red-flags');

// ============================================
// MONTAR PAYLOAD FINAL PARA RAG
// ============================================
const ragPayload = {
  category: 'call_analysis',
  title: `Call ${tier} - ${nomeLead} (Score: ${scoreTotal}) - ${dataAnalise}`,
  content: content,
  project_key: 'socialfy',
  tags: tags
};

// Retornar payload e dados originais
return [{
  json: {
    skip_rag: false,
    rag_payload: ragPayload,
    metadata: {
      score_total: scoreTotal,
      tier: tier,
      status: status,
      nome_lead: nomeLead,
      data_analise: dataAnalise,
      tags_geradas: tags
    }
  }
}];
```

---

### Nó 2: IF - Score >= 60?

**Tipo:** IF
**Posição:** Após "Code - Preparar Payload RAG"

**Configuração:**
- **Condition:** `{{ $json.skip_rag }}` equals `false`
- **True branch:** Continua para HTTP Request
- **False branch:** Para (não envia para RAG)

```json
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "id": "condition-rag",
        "leftValue": "={{ $json.skip_rag }}",
        "rightValue": false,
        "operator": {
          "type": "boolean",
          "operation": "equals"
        }
      }
    ],
    "combinator": "and"
  }
}
```

---

### Nó 3: HTTP Request - RAG Ingest

**Tipo:** HTTP Request
**Posição:** Após "IF - Score >= 60?" (branch TRUE)

**Configuração:**

| Campo | Valor |
|-------|-------|
| Method | POST |
| URL | `https://agenticoskevsacademy-production.up.railway.app/webhook/rag-ingest` |
| Authentication | None |
| Send Headers | On |
| Header Name | Content-Type |
| Header Value | application/json |
| Send Body | On |
| Body Content Type | JSON |
| Specify Body | Using Fields Below |

**Body Parameters (JSON):**

```json
{
  "category": "={{ $json.rag_payload.category }}",
  "title": "={{ $json.rag_payload.title }}",
  "content": "={{ $json.rag_payload.content }}",
  "project_key": "={{ $json.rag_payload.project_key }}",
  "tags": "={{ $json.rag_payload.tags }}"
}
```

**Configuração Alternativa (Raw JSON):**

Se preferir usar JSON raw:

```javascript
// No campo "JSON/RAW Parameters" ou "Body"
{
  "category": "{{ $json.rag_payload.category }}",
  "title": "{{ $json.rag_payload.title }}",
  "content": "{{ $json.rag_payload.content }}",
  "project_key": "{{ $json.rag_payload.project_key }}",
  "tags": {{ JSON.stringify($json.rag_payload.tags) }}
}
```

---

## Onde Adicionar no Workflow

### Fluxo Atual:
```
... → Code - Processar Analise V2 → Salvar em Custom Object GHL → ...
```

### Fluxo Atualizado:
```
... → Code - Processar Analise V2
          ├──→ Salvar em Custom Object GHL → ... (fluxo existente)
          │
          └──→ Code - Preparar Payload RAG → IF Score >= 60?
                                                ├── TRUE → HTTP Request - RAG Ingest
                                                └── FALSE → (nada)
```

**Importante:** Use uma conexão paralela (branch) a partir do "Code - Processar Analise V2", assim o pipeline RAG não bloqueia o fluxo principal do GHL.

---

## Exemplos de Consulta pelo Agente de Oportunidades

Após os dados estarem no RAG, o agente de oportunidades pode consultar:

### 1. Buscar Calls de Alta Performance para Referência

```bash
curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "calls excelentes com score alto best practice vendas",
    "project_key": "socialfy",
    "threshold": 0.5,
    "limit": 5
  }'
```

**Uso:** Encontrar padrões de calls bem-sucedidas para treinar SDRs.

---

### 2. Buscar Red Flags Comuns

```bash
curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "red flags problemas objecoes nao respondidas",
    "project_key": "socialfy",
    "threshold": 0.5,
    "limit": 10
  }'
```

**Uso:** Identificar erros recorrentes para criar treinamento.

---

### 3. Buscar Técnicas de BANT Eficazes

```bash
curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "qualificacao BANT score alto orcamento autoridade necessidade",
    "project_key": "socialfy",
    "threshold": 0.4,
    "limit": 5
  }'
```

**Uso:** Encontrar exemplos de boa qualificação para replicar.

---

### 4. Buscar Calls por Status/Probabilidade

```bash
curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "qualificado alta probabilidade fechamento proximos passos",
    "project_key": "socialfy",
    "threshold": 0.5,
    "limit": 10
  }'
```

**Uso:** Ver padrões de calls que fecham bem.

---

### 5. Exemplo de Integração no Agente de Oportunidades (n8n)

```javascript
// No nó Code do agente de oportunidades
// Buscar insights de calls similares antes de recomendar

const situacaoLead = $json.situacao; // ex: "lead com objeção de preço"

// Fazer busca no RAG
const ragSearch = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search',
  body: {
    query: `como lidar com ${situacaoLead} exemplos calls sucesso`,
    project_key: 'socialfy',
    threshold: 0.4,
    limit: 3
  },
  json: true
});

// Usar resultados no contexto da IA
const contextoCalls = ragSearch.results?.map(r => r.content).join('\n\n') || '';

return [{
  json: {
    contexto_rag: contextoCalls,
    quantidade_exemplos: ragSearch.count || 0
  }
}];
```

---

## Dados Salvos no RAG

### Exemplo de Documento Armazenado

```json
{
  "category": "call_analysis",
  "title": "Call A+ EXCELENTE - João Silva (Score: 85) - 2026-01-04",
  "content": "# Análise de Call - João Silva\n\n## Resumo Executivo\nCall de descoberta extremamente bem conduzida...\n\n## Métricas Principais\n- Score Total: 85/100 (A+ EXCELENTE)\n- Status: QUALIFICADO\n- Probabilidade de Fechamento: 75%\n...",
  "project_key": "socialfy",
  "tags": ["call-analysis", "vendas", "best-practice", "excelente", "bant-forte", "spin-forte", "qualificado", "high-probability"]
}
```

---

## Thresholds e Regras

| Score Total | Ação | Motivo |
|-------------|------|--------|
| 0-59 | Não salva no RAG | Calls fracas poluiriam a base de conhecimento |
| 60-74 | Salva (pode melhorar) | Útil para aprendizado |
| 75-89 | Salva (boa performance) | Bons padrões para replicar |
| 90-100 | Salva (best practice) | Exemplos de excelência |

---

## Validação e Testes

### Testar o Payload Manualmente

```bash
curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "call_analysis",
    "title": "TESTE - Call A+ EXCELENTE - Lead Teste (Score: 92) - 2026-01-04",
    "content": "# Análise de Call - Lead Teste\n\n## Resumo Executivo\nEsta é uma call de teste para validar o pipeline RAG.\n\n## Métricas Principais\n- Score Total: 92/100 (A+ EXCELENTE)\n- Status: QUALIFICADO\n\n## Highlights Positivos\n1. Excelente rapport inicial\n2. BANT completo em 5 minutos\n3. Fechamento natural com trial",
    "project_key": "socialfy",
    "tags": ["call-analysis", "vendas", "best-practice", "excelente", "teste"]
  }'
```

### Verificar se Foi Salvo

```bash
curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "TESTE call Lead Teste score 92",
    "project_key": "socialfy",
    "threshold": 0.3,
    "limit": 1
  }'
```

---

## Considerações Finais

### Vantagens desta Implementação

1. **Filtro de Qualidade:** Só calls relevantes (score >= 60) são salvas
2. **Conteúdo Formatado:** Estrutura otimizada para busca semântica
3. **Tags Inteligentes:** Classificação automática por performance
4. **Não-Bloqueante:** Pipeline paralelo não afeta fluxo principal
5. **Consultável:** Fácil de buscar por padrões e situações

### Possíveis Melhorias Futuras

1. Adicionar transcrição completa em campo separado
2. Incluir timestamps de momentos-chave
3. Criar endpoint de busca específico para calls
4. Dashboard de métricas agregadas de calls
5. Comparação automática com médias históricas

---

## Arquivos Relacionados

- `/Users/marcosdaniels/Projects/mottivme/n8n-workspace/correcoes-workflow-head-vendas.md`
- `/Users/marcosdaniels/Projects/mottivme/n8n-workspace/upgrade-workflow-02-transcricoes.md`

---

**Criado em:** 2026-01-04
**Projeto:** Socialfy - AI Factory
**Autor:** Claude Code (assistente de Marcos Daniels)
