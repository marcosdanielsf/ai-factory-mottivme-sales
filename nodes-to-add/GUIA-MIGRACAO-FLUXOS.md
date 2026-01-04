# Guia de Migração: Prompts Hardcoded -> Supabase

## Visão Geral

Este guia explica como migrar fluxos n8n existentes para usar o sistema de prompts versionados do Supabase **sem reescrever todo o fluxo**.

## Arquitetura

```
ANTES (Hardcoded):
┌─────────────┐     ┌─────────────────────────────────────┐
│ Preparar    │────▶│ AI Agent (prompt fixo no SystemMsg) │
│ Dados       │     └─────────────────────────────────────┘
└─────────────┘

DEPOIS (Dinâmico):
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────────────────┐     ┌──────────────┐
│ Preparar    │────▶│ 2.0 Buscar   │────▶│ 2.1 Resolver  │────▶│ AI Agent (placeholder) │────▶│ 2.2 Registrar│
│ Dados       │     │ Prompt       │     │ Variáveis     │     │ (usa prompt_final)     │     │ Uso          │
└─────────────┘     └──────────────┘     └───────────────┘     └────────────────────────┘     └──────────────┘
```

---

## Passo a Passo da Migração

### 1. Preparar o Supabase

```bash
# Executar migrations (se ainda não executou)
psql $DATABASE_URL -f migrations/008_workflow_versioning_and_separation.sql
psql $DATABASE_URL -f migrations/010_prompt_catalog_system.sql
```

### 2. Extrair o Prompt Atual

1. Abra o fluxo no n8n
2. Encontre o nó AI Agent
3. Copie o System Message atual
4. Salve em um arquivo `.txt` temporário

### 3. Registrar o Prompt no Supabase

```sql
-- 1. Criar entrada no prompt_registry
INSERT INTO prompt_registry (
  prompt_key,
  prompt_name,
  scope,
  prompt_type,
  category,
  description,
  variables_used,
  tags
) VALUES (
  'head-vendas-bposs',  -- Chave única
  'Head de Vendas BPOSS V2',
  'internal',
  'system',
  'analysis',
  'Prompt principal para análise de calls BPOSS',
  ARRAY['{{transcricao_processada}}', '{{nome_lead}}', '{{tipo_call}}'],
  ARRAY['vendas', 'bposs', 'analise']
);

-- 2. Criar a primeira versão (ativa)
INSERT INTO prompt_versions (
  prompt_id,
  version,
  prompt_content,
  is_current,
  status,
  change_summary,
  change_reason,
  changed_by
) VALUES (
  (SELECT id FROM prompt_registry WHERE prompt_key = 'head-vendas-bposs'),
  1,
  'COLE SEU PROMPT AQUI...',  -- O texto completo do prompt
  true,
  'active',
  'Versão inicial migrada do fluxo n8n',
  'initial',
  'migration-script'
);
```

### 4. Adicionar os 3 Novos Nós ao Fluxo

#### 4.1 Importar Template

1. Abra o arquivo `TEMPLATE-PROMPT-DINAMICO.json`
2. No n8n, use Ctrl+V ou Import para colar os nós
3. Posicione os 3 nós no fluxo

#### 4.2 Conectar os Nós

1. **Entrada do "2.0 Buscar Prompt"**: Conecte a saída do seu nó "Preparar Dados"
2. **Saída do "2.1 Resolver Variáveis"**: Conecte ao AI Agent
3. **Saída do "AI Agent"**: Conecte ao "2.2 Registrar Uso"

### 5. Configurar o AI Agent

Altere o System Message do AI Agent de:

```
Voce e um HEAD DE VENDAS...
[prompt fixo completo]
```

Para:

```
={{ $('2.1 Resolver Variáveis').item.json.prompt_final }}
```

### 6. Ajustar Variáveis (se necessário)

No nó "2.1 Resolver Variáveis", verifique se as variáveis mapeadas correspondem aos seus dados:

```javascript
const variaveis = {
  'transcricao_processada': dadosContexto.texto_transcricao, // Ajuste o nome do campo
  'nome_lead': dadosContexto.nome_lead,
  // ... adicione mais conforme necessário
};
```

### 7. Configurar Variáveis de Ambiente no n8n

1. Vá em Settings > Environment Variables
2. Adicione:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_ANON_KEY`: Chave anon/public do Supabase

### 8. Testar

1. Execute o fluxo manualmente
2. Verifique se o prompt foi buscado corretamente
3. Verifique se as variáveis foram substituídas
4. Verifique se a execução foi registrada no Supabase

---

## Checklist de Migração por Fluxo

| Fluxo | Prompt Key | Migrado | Testado |
|-------|------------|---------|---------|
| 02-AI-Agent-Head-Vendas | `head-vendas-bposs` | ⬜ | ⬜ |
| 03-Call-Analyzer-Onboarding | `analyzer-onboarding` | ⬜ | ⬜ |
| 05-AI-Agent-Conversacional | `sdr-conversacional` | ⬜ | ⬜ |
| 06-Call-Analyzer-Revisao | `analyzer-revisao` | ⬜ | ⬜ |
| 09-QA-Analyst | `qa-analyst` | ⬜ | ⬜ |
| 11-Reflection-Loop | `reflection-evaluator` | ⬜ | ⬜ |
| 12-AI-as-Judge | `ai-judge-rubric` | ⬜ | ⬜ |
| 12-Prompt-Improver | `prompt-improver` | ⬜ | ⬜ |
| 14-Multi-Tenant-Inbox | `inbox-classifier` | ⬜ | ⬜ |

---

## Troubleshooting

### Erro: "Prompt not found"

```javascript
// Verifique se o prompt existe e está ativo
SELECT * FROM prompt_registry WHERE prompt_key = 'sua-chave';
SELECT * FROM prompt_versions WHERE prompt_id = 'id-do-prompt' AND is_current = true;
```

### Erro: "Placeholders não resolvidos"

Os placeholders `{{nome_variavel}}` não estão sendo substituídos:

1. Verifique se a variável está mapeada no nó 2.1
2. Verifique se o dado existe no nó de origem
3. Adicione o mapeamento se necessário

### Erro: "HTTP 401 Unauthorized"

Verifique as variáveis de ambiente:
- `SUPABASE_URL` está correto?
- `SUPABASE_ANON_KEY` está correto?
- A chave tem permissão para chamar RPCs?

### Prompt não atualiza

O n8n pode estar cacheando:
1. Desative cache no nó HTTP (se usar)
2. Adicione timestamp à URL como query param (hack)
3. Reinicie o workflow

---

## Benefícios Após Migração

| Antes | Depois |
|-------|--------|
| Editar prompt = reimport no n8n | Editar prompt = SQL/Dashboard |
| Sem histórico | Histórico completo |
| Sem métricas | Analytics por execução |
| Rollback manual | Rollback com 1 clique |
| Self-improving limitado | Self-improving integrado |

---

## Próximos Passos

1. ⬜ Migrar primeiro fluxo piloto (02-Head-Vendas)
2. ⬜ Validar funcionamento completo
3. ⬜ Migrar demais fluxos
4. ⬜ Criar dashboard de prompts
5. ⬜ Integrar com Self-Improving System

---

*Documento criado: 2026-01-01*
*Última atualização: 2026-01-01*
