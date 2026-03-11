---
---

::: v-pre

# 🎯 PLANO ESTRATÉGICO: VERSIONAMENTO DE PROMPTS NO SUPABASE

## 📋 Visão Geral

**Objetivo:** Migrar todos os prompts hardcoded nos fluxos n8n para o Supabase, permitindo:
1. ✅ Versionamento completo de prompts
2. ✅ Edição sem necessidade de deploy/reimport no n8n
3. ✅ Histórico de mudanças com diff
4. ✅ Rollback fácil para versões anteriores
5. ✅ Dashboard/Catálogo de prompts no frontend
6. ✅ Self-improving system integrado

---

## 🏗️ ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  SUPABASE   │───▶│  NÓ PLACEHOLDER │───▶│  AI AGENT / LANGCHAIN   │ │
│  │  (prompts)  │    │   (HTTP/RPC)    │    │  (recebe prompt_content)│ │
│  └─────────────┘    └─────────────────┘    └─────────────────────────┘ │
│        │                                                                │
│        ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     DASHBOARD / TERMINAL                         │   │
│  │  • Catálogo de prompts                                          │   │
│  │  • Editor com diff                                              │   │
│  │  • Histórico de versões                                         │   │
│  │  • Métricas de performance                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ ARQUITETURA DE BANCO DE DADOS (Supabase)

### Tabelas Existentes (migration 008):
- `prompt_registry` - Registro central de prompts
- `prompt_versions` - Histórico de versões

### Novas Tabelas Necessárias (migration 010):

#### 1. `prompt_catalog` - Catálogo expandido para frontend
```sql
CREATE TABLE prompt_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompt_registry(id),

  -- Display no frontend
  display_name VARCHAR(255) NOT NULL,
  short_description VARCHAR(500),
  long_description TEXT,

  -- Categorização visual
  icon VARCHAR(50), -- emoji ou nome do ícone
  color VARCHAR(20), -- hex color para cards
  badge VARCHAR(50), -- 'new', 'updated', 'deprecated'

  -- Relacionamentos
  workflow_ids UUID[], -- Workflows que usam este prompt
  agent_types TEXT[], -- Tipos de agent: 'head-vendas', 'sdr', etc

  -- Controle de acesso
  visibility VARCHAR(20) DEFAULT 'internal', -- 'internal', 'client', 'public'
  editable_by TEXT[], -- roles que podem editar

  -- Ordenação no catálogo
  category_order INTEGER DEFAULT 100,
  featured BOOLEAN DEFAULT false,

  -- Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `prompt_variables` - Variáveis/Placeholders do prompt
```sql
CREATE TABLE prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompt_registry(id) ON DELETE CASCADE,

  -- Identificação
  variable_key VARCHAR(100) NOT NULL, -- ex: 'icp_segmento'
  variable_placeholder VARCHAR(200) NOT NULL, -- ex: '{{icp_segmento}}'

  -- Configuração
  variable_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'json', 'select', 'boolean'
  default_value TEXT,
  required BOOLEAN DEFAULT false,

  -- Opções (para tipo 'select')
  options JSONB DEFAULT '[]', -- [{"value": "clinica", "label": "Clínica"}]

  -- Validação
  validation_regex VARCHAR(500),
  min_length INTEGER,
  max_length INTEGER,

  -- Descrição para UI
  label VARCHAR(255),
  description TEXT,
  help_text TEXT,

  -- Ordenação
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `prompt_edit_history` - Log de edições para audit trail
```sql
CREATE TABLE prompt_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID REFERENCES prompt_versions(id),

  -- Editor
  edited_by VARCHAR(255) NOT NULL,
  edited_via VARCHAR(50) NOT NULL, -- 'dashboard', 'terminal', 'api', 'self-improving'

  -- Mudança
  old_content TEXT,
  new_content TEXT,
  diff_summary TEXT,
  change_type VARCHAR(50), -- 'minor', 'major', 'rollback', 'auto_improvement'

  -- Contexto
  reason TEXT,
  related_reflection_id UUID REFERENCES reflection_logs(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📦 NÓS N8N NECESSÁRIOS

### 1. Nó: `Buscar Prompt Ativo`
**Tipo:** HTTP Request ou Code
**Função:** Busca o prompt ativo do Supabase via RPC

```javascript
// nodes-to-add/buscar-prompt-ativo.js
// =====================================================
// NÓ: BUSCAR PROMPT ATIVO DO SUPABASE
// Inserir ANTES de qualquer AI Agent que usa prompt
// =====================================================

// Configuração
const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_KEY = $env.SUPABASE_ANON_KEY;

// Parâmetros do nó (configuráveis no n8n)
const promptKey = $json.prompt_key || '{{ $parameter.promptKey }}';

// Chamar RPC do Supabase
const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_active_prompt`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  },
  body: JSON.stringify({ p_prompt_key: promptKey })
});

const promptData = await response.json();

if (promptData.error) {
  throw new Error(`Prompt não encontrado: ${promptKey}`);
}

return [{
  json: {
    prompt_key: promptData.prompt_key,
    prompt_content: promptData.prompt_content,
    model_config: promptData.model_config,
    version: promptData.version,
    performance_score: promptData.performance_score,
    variables: promptData.variables_used || []
  }
}];
```

### 2. Nó: `Resolver Variáveis do Prompt`
**Tipo:** Code
**Função:** Substitui placeholders {{var}} pelos valores reais

```javascript
// nodes-to-add/resolver-variaveis-prompt.js
// =====================================================
// NÓ: RESOLVER VARIÁVEIS NO PROMPT
// Inserir APÓS buscar prompt, ANTES do AI Agent
// =====================================================

const promptTemplate = $('Buscar Prompt Ativo').item.json.prompt_content;
const dadosContexto = $('Preparar Dados').item.json; // Nó que prepara dados

// Mapeamento de variáveis
const variaveis = {
  'transcricao_processada': dadosContexto.texto_transcricao || '',
  'nome_lead': dadosContexto.nome_lead || '',
  'nome_empresa': dadosContexto.empresa || '',
  'tipo_call': dadosContexto.tipo_call || 'diagnostico',
  'icp_segmento': dadosContexto.icp?.segmento || '',
  'tickets': JSON.stringify(dadosContexto.tickets || []),
  'red_flags_criticos': (dadosContexto.red_flags_criticos || []).join(', '),
  'objecoes': JSON.stringify(dadosContexto.objecoes || [])
};

// Substituir placeholders
let promptFinal = promptTemplate;
for (const [key, value] of Object.entries(variaveis)) {
  const regex = new RegExp(`\{\{\s*${key}\s*\}\}`, 'gi');
  promptFinal = promptFinal.replace(regex, value);
}

// Verificar se sobraram placeholders não resolvidos
const placeholdersRestantes = promptFinal.match(/\{\{[^}]+\}\}/g) || [];
if (placeholdersRestantes.length > 0) {
  console.warn('Placeholders não resolvidos:', placeholdersRestantes);
}

return [{
  json: {
    prompt_final: promptFinal,
    variaveis_usadas: Object.keys(variaveis),
    placeholders_nao_resolvidos: placeholdersRestantes
  }
}];
```

### 3. Nó: `Registrar Uso de Prompt`
**Tipo:** HTTP Request ou Postgres
**Função:** Incrementa contador de uso e registra execução

```javascript
// nodes-to-add/registrar-uso-prompt.js
// =====================================================
// NÓ: REGISTRAR USO DE PROMPT (ANALYTICS)
// Inserir APÓS execução do AI Agent
// =====================================================

const promptData = $('Buscar Prompt Ativo').item.json;
const resultado = $('AI Agent').item.json;

// Calcular métricas básicas
const execucao = {
  prompt_version_id: promptData.version_id,
  execution_success: !resultado.error,
  execution_time_ms: Date.now() - $('Buscar Prompt Ativo').item.json._start_time,
  output_tokens: resultado.usage?.output_tokens || 0,
  context_tokens: resultado.usage?.input_tokens || 0
};

// Atualizar contador
await $('Supabase').runQuery(`
  UPDATE prompt_catalog
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE prompt_id = '${promptData.prompt_id}'
`);

// Registrar execução para analytics
await $('Supabase').runQuery(`
  INSERT INTO prompt_executions (
    prompt_version_id, success, execution_time_ms,
    output_tokens, context_tokens, workflow_execution_id
  ) VALUES (
    '${execucao.prompt_version_id}',
    ${execucao.execution_success},
    ${execucao.execution_time_ms},
    ${execucao.output_tokens},
    ${execucao.context_tokens},
    '{{ $execution.id }}'
  )
`);

return [{ json: { logged: true, ...execucao } }];
```

---

## 🔄 MODIFICAÇÕES NOS FLUXOS EXISTENTES

### Padrão de Migração (para cada fluxo):

```
ANTES (hardcoded):
┌─────────────────┐    ┌─────────────────┐
│  Preparar Dados │───▶│  AI Agent       │
│                 │    │  (prompt fixo)  │
└─────────────────┘    └─────────────────┘

DEPOIS (dinâmico):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Preparar Dados │───▶│  Buscar Prompt  │───▶│  Resolver Vars  │───▶│  AI Agent       │
│                 │    │  Ativo          │    │                 │    │  (placeholder)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                              │
                                                                              ▼
                                                                     ┌─────────────────┐
                                                                     │ Registrar Uso   │
                                                                     └─────────────────┘
```

### Fluxos a Migrar:

| # | Fluxo | Prompt Key | Status |
|---|-------|------------|--------|
| 1 | 02-AI-Agent-Head-Vendas | `head-vendas-bposs` | 🔴 Pendente |
| 2 | 03-Call-Analyzer-Onboarding | `analyzer-onboarding` | 🔴 Pendente |
| 3 | 05-AI-Agent-Conversacional | `sdr-conversacional` | 🔴 Pendente |
| 4 | 06-Call-Analyzer-Revisao | `analyzer-revisao` | 🔴 Pendente |
| 5 | 09-QA-Analyst | `qa-analyst` | 🔴 Pendente |
| 6 | 11-Reflection-Loop | `reflection-evaluator` | 🔴 Pendente |
| 7 | 12-AI-as-Judge | `ai-judge-rubric` | 🔴 Pendente |
| 8 | 12-Prompt-Improver | `prompt-improver` | 🔴 Pendente |
| 9 | 14-Multi-Tenant-Inbox-Classifier | `inbox-classifier` | 🔴 Pendente |

---

## 🎨 ESTRUTURA DO FRONTEND (Catálogo de Prompts)

### Páginas Necessárias:

#### 1. `/prompts` - Lista/Catálogo
```typescript
// Componentes:
- PromptCatalogGrid - Cards com prompts organizados
- PromptFilters - Filtros por categoria, scope, status
- PromptSearch - Busca por nome/conteúdo
- PromptStats - Resumo de métricas

// Features:
- Visualização em cards ou lista
- Filtros por workflow, categoria, performance
- Busca full-text
- Ações rápidas (editar, duplicar, ativar)
```

#### 2. `/prompts/[id]` - Detalhe/Editor
```typescript
// Componentes:
- PromptEditor - Monaco Editor com syntax highlight
- PromptVersionHistory - Timeline de versões
- PromptDiff - Comparação side-by-side
- PromptVariables - Lista de variáveis usadas
- PromptMetrics - Gráficos de performance

// Features:
- Editor com syntax highlight para Markdown/JSON
- Preview do prompt renderizado
- Diff entre versões
- Rollback com um clique
- Test playground (simular execução)
```

#### 3. `/prompts/[id]/versions` - Histórico
```typescript
// Componentes:
- VersionTimeline - Linha do tempo visual
- VersionCard - Info de cada versão
- VersionCompare - Comparar duas versões
- VersionRestore - Restaurar versão antiga

// Features:
- Timeline visual de evolução
- Diff entre qualquer duas versões
- Métricas por versão
- Restore/Rollback
```

---

## 🚀 SUB-AGENTES ESPECIALIZADOS

### 1. `n8n-workflow-expert` - Engenheiro de Fluxos
**Responsabilidades:**
- Criar os nós JavaScript para busca/resolução de prompts
- Modificar fluxos existentes para usar sistema dinâmico
- Garantir compatibilidade com estrutura atual
- Não reescrever fluxos, apenas ADICIONAR nós necessários

### 2. `n8n-prompt-engineer` - Engenheiro de Prompts
**Responsabilidades:**
- Extrair prompts hardcoded dos fluxos atuais
- Documentar variáveis usadas em cada prompt
- Criar registros no `prompt_registry`
- Definir valores default e validações

### 3. `database-engineer` - Engenheiro de Backend
**Responsabilidades:**
- Criar migration 010 com tabelas adicionais
- Implementar RPCs para busca otimizada
- Criar índices para performance
- Implementar RLS para segurança

### 4. `frontend-developer` - Desenvolvedor Frontend
**Responsabilidades:**
- Criar páginas do catálogo de prompts
- Implementar editor com Monaco
- Criar componentes de diff/histórico
- Integrar com API do Supabase

---

## 📊 FUNÇÕES RPC DO SUPABASE

### 1. `get_active_prompt(prompt_key)`
Já existe na migration 008.

### 2. `get_prompt_with_variables(prompt_key)` - NOVA
```sql
CREATE OR REPLACE FUNCTION get_prompt_with_variables(p_prompt_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'prompt', (SELECT get_active_prompt(p_prompt_key)),
    'variables', (
      SELECT jsonb_agg(jsonb_build_object(
        'key', pv.variable_key,
        'placeholder', pv.variable_placeholder,
        'type', pv.variable_type,
        'default', pv.default_value,
        'required', pv.required,
        'label', pv.label,
        'description', pv.description
      ) ORDER BY pv.display_order)
      FROM prompt_variables pv
      JOIN prompt_registry pr ON pr.id = pv.prompt_id
      WHERE pr.prompt_key = p_prompt_key
    ),
    'catalog', (
      SELECT jsonb_build_object(
        'display_name', pc.display_name,
        'description', pc.short_description,
        'icon', pc.icon,
        'color', pc.color,
        'usage_count', pc.usage_count
      )
      FROM prompt_catalog pc
      JOIN prompt_registry pr ON pr.id = pc.prompt_id
      WHERE pr.prompt_key = p_prompt_key
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 3. `list_prompts_for_catalog(filters)` - NOVA
```sql
CREATE OR REPLACE FUNCTION list_prompts_for_catalog(
  p_scope VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'prompts', (
      SELECT jsonb_agg(row_to_json(prompts_with_info))
      FROM (
        SELECT
          pr.id,
          pr.prompt_key,
          pr.prompt_name,
          pr.scope,
          pr.category,
          pr.status,
          pr.current_version,
          pc.display_name,
          pc.short_description,
          pc.icon,
          pc.color,
          pc.badge,
          pc.usage_count,
          pc.last_used_at,
          pv.performance_score,
          pv.total_evaluations
        FROM prompt_registry pr
        LEFT JOIN prompt_catalog pc ON pc.prompt_id = pr.id
        LEFT JOIN prompt_versions pv ON pv.prompt_id = pr.id AND pv.is_current = true
        WHERE
          (p_scope IS NULL OR pr.scope = p_scope)
          AND (p_category IS NULL OR pr.category = p_category)
          AND (p_search IS NULL OR
               pr.prompt_name ILIKE '%' || p_search || '%' OR
               pr.prompt_key ILIKE '%' || p_search || '%')
          AND pr.status = 'active'
        ORDER BY pc.category_order, pc.featured DESC, pr.prompt_name
        LIMIT p_limit OFFSET p_offset
      ) prompts_with_info
    ),
    'total', (
      SELECT COUNT(*)
      FROM prompt_registry pr
      WHERE
        (p_scope IS NULL OR pr.scope = p_scope)
        AND (p_category IS NULL OR pr.category = p_category)
        AND pr.status = 'active'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 PRÓXIMOS PASSOS (ORDEM DE EXECUÇÃO)

### Fase 1: Backend (Supabase)
1. [ ] Criar migration 010 com tabelas adicionais
2. [ ] Implementar RPCs necessárias
3. [ ] Extrair prompts existentes e popular tabelas
4. [ ] Testar funções via Supabase Studio

### Fase 2: N8N (Nós Dinâmicos)
5. [ ] Criar nó `buscar-prompt-ativo.js`
6. [ ] Criar nó `resolver-variaveis-prompt.js`
7. [ ] Criar nó `registrar-uso-prompt.js`
8. [ ] Testar em um fluxo piloto (02-Head-Vendas)

### Fase 3: Migração de Fluxos
9. [ ] Migrar 02-AI-Agent-Head-Vendas
10. [ ] Migrar demais fluxos um a um
11. [ ] Validar funcionamento sem quebrar

### Fase 4: Frontend (Dashboard)
12. [ ] Criar página de catálogo `/prompts`
13. [ ] Criar página de edição `/prompts/[id]`
14. [ ] Criar página de histórico `/prompts/[id]/versions`
15. [ ] Integrar com sistema de autenticação

---

## 🔐 CONSIDERAÇÕES DE SEGURANÇA

1. **RLS (Row Level Security)**
   - Prompts `internal` só visíveis para admins
   - Prompts `client` só visíveis para o location_id do cliente
   - Prompts `template` visíveis para todos autenticados

2. **Audit Trail**
   - Toda edição registrada em `prompt_edit_history`
   - IP e user_agent salvos
   - Impossível editar sem deixar rastro

3. **Rollback Seguro**
   - Sempre manter pelo menos 10 versões anteriores
   - Auto-rollback se performance cair X%

---

## 📈 MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo para editar prompt | 5-10 min (n8n) | <1 min (dashboard) |
| Risco de quebrar fluxo | Alto | Baixo (versionado) |
| Rollback | Manual/difícil | 1 clique |
| Visibilidade de prompts | Nenhuma | Dashboard completo |
| Histórico de mudanças | Nenhum | 100% auditável |
| Self-improving integrado | Parcial | 100% |

---

*Documento criado em: 2026-01-01*
*Última atualização: 2026-01-01*
*Responsável: AI Factory V4 - MOTTIVME*

:::
