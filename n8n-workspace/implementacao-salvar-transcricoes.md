# Implementacao: Salvar Transcricoes e Analises no Supabase

## Visao Geral

Este documento descreve como implementar a persistencia de transcricoes e analises de calls na tabela `call_recordings` do Supabase, no workflow `02-AI-Agent-Head-Vendas-V2`.

---

## Contexto Atual

### Fluxo do Workflow
```
Google Drive Trigger
    |
Buscar Call no Supabase (busca registro pelo gdrive_file_id)
    |
Call Existe?
    |
Export Google Doc como Texto (retorna transcricao em $json.data)
    |
2.0 Buscar Prompt -> 2.1 Resolver Variaveis -> Pre-Processador Transcricao
    |
AI Agent - Head de Vendas V2
    |
2.2 Registrar Uso
    |
Code - Processar Analise V2 (formata toda a analise)
    |
    +-- Listar Custom Fields -> Code - Encontrar IDs -> Atualizar Campos GHL
    |       |
    |       +-- Atualizar Status Supabase (ATUAL - so atualiza status)
    |
    +-- Salvar em Custom Object -> Tem Contact ID? -> Associar Call ao Contato
            |
            +-- Atualizar Status Supabase (ATUAL - so atualiza status)
```

### No Atual "Atualizar Status Supabase"
O no existente (ID: `739d2ae7-f78f-433c-ba89-af311d4ca164`) executa apenas:
```sql
UPDATE call_recordings
SET status = 'analisado', processed_at = NOW()
WHERE id = '{{ $('Code - Processar Analise V2').item.json.call_recording_id }}'
```

**Problema:** Nao salva a transcricao nem a analise completa.

---

## Solucao: Modificar o No Existente

### Opcao 1: Atualizar SQL do No Existente (RECOMENDADO)

Modificar o no "Atualizar Status Supabase" para incluir todos os campos.

#### Novo SQL para o No

```sql
UPDATE call_recordings
SET
  -- Status da call
  status = 'analisado',
  analise_status = 'analisado',
  processed_at = NOW(),
  analyzed_at = NOW(),

  -- Transcricao completa (vem do Export Google Doc)
  transcricao = {{ $json.transcricao_salvar ? "'" + $json.transcricao_salvar.replace(/'/g, "''") + "'" : 'NULL' }},

  -- Analise em JSON (todo o resultado do Code - Processar Analise V2)
  analise_json = '{{ JSON.stringify($('Code - Processar Analise V2').item.json).replace(/'/g, "''") }}'::jsonb

WHERE id = '{{ $('Code - Processar Analise V2').item.json.call_recording_id }}'
RETURNING id, status, analise_status, analyzed_at
```

**IMPORTANTE:** Este SQL usa expressoes n8n que podem ter problemas com escaping. Veja a Opcao 2 para uma solucao mais robusta.

---

### Opcao 2: Adicionar No Code Antes do Postgres (MAIS ROBUSTO)

Adicionar um no Code para preparar os dados antes de salvar no Postgres.

#### Passo 1: Criar No "Preparar Dados para Supabase"

**Tipo:** Code
**Posicao:** Depois do "Code - Processar Analise V2", antes do "Atualizar Status Supabase"
**Nome sugerido:** `Preparar Dados para Supabase`

```javascript
// Buscar transcricao do no Export Google Doc
let transcricao = '';
try {
  transcricao = $('Export Google Doc como Texto').first().json.data || '';
} catch (e) {
  console.warn('Transcricao nao encontrada:', e.message);
}

// Buscar analise do no Code - Processar Analise V2
const analise = $input.first().json;

// Limpar transcricao para SQL (escapar aspas simples)
const transcricaoLimpa = transcricao.replace(/'/g, "''");

// Converter analise para JSON string seguro
const analiseJson = JSON.stringify(analise).replace(/'/g, "''");

return [{
  json: {
    // Dados originais da analise
    ...analise,

    // Dados preparados para o SQL
    sql_data: {
      call_recording_id: analise.call_recording_id,
      transcricao: transcricaoLimpa,
      analise_json: analiseJson,
      transcricao_length: transcricao.length,
      analise_json_length: analiseJson.length
    }
  }
}];
```

#### Passo 2: Atualizar No Postgres

**No:** `Atualizar Status Supabase`
**Operation:** Execute Query

```sql
UPDATE call_recordings
SET
  status = 'analisado',
  analise_status = 'analisado',
  processed_at = NOW(),
  analyzed_at = NOW(),
  transcricao = '{{ $json.sql_data.transcricao }}',
  analise_json = '{{ $json.sql_data.analise_json }}'::jsonb
WHERE id = '{{ $json.sql_data.call_recording_id }}'
RETURNING id, status, analise_status, analyzed_at,
          length(transcricao) as transcricao_length
```

---

### Opcao 3: Usar Parametros Prepared Statement (MAIS SEGURO)

Se o no Postgres suportar modo "Insert/Update" com mapeamento de campos:

**Operation:** Update
**Schema:** public
**Table:** call_recordings
**Columns to Match On:** id

**Columns to Update:**
| Column | Value |
|--------|-------|
| status | `analisado` |
| analise_status | `analisado` |
| processed_at | `={{ $now }}` |
| analyzed_at | `={{ $now }}` |
| transcricao | `={{ $('Export Google Doc como Texto').first().json.data }}` |
| analise_json | `={{ $('Code - Processar Analise V2').item.json }}` |

**Where Conditions:**
| Column | Value |
|--------|-------|
| id | `={{ $('Code - Processar Analise V2').item.json.call_recording_id }}` |

---

## Configuracao Detalhada do No Postgres

### Configuracao Completa (JSON)

```json
{
  "parameters": {
    "operation": "executeQuery",
    "query": "UPDATE call_recordings SET status = 'analisado', analise_status = 'analisado', processed_at = NOW(), analyzed_at = NOW(), transcricao = $1, analise_json = $2::jsonb WHERE id = $3 RETURNING id, status, analise_status",
    "options": {
      "queryReplacement": "={{ [$('Export Google Doc como Texto').first().json.data || '', JSON.stringify($('Code - Processar Analise V2').item.json), $('Code - Processar Analise V2').item.json.call_recording_id] }}"
    }
  },
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2.5,
  "position": [3792, 368],
  "id": "739d2ae7-f78f-433c-ba89-af311d4ca164",
  "name": "Atualizar Status Supabase",
  "credentials": {
    "postgres": {
      "id": "w2mBaRwhZ3tM4FUw",
      "name": "Postgres Marcos Daniels."
    }
  }
}
```

---

## Onde Adicionar no Workflow

### Diagrama de Conexoes Atualizadas

```
Code - Processar Analise V2
    |
    +--[output 0]-- Listar Custom Fields
    |                   |
    |              Code - Encontrar IDs
    |                   |
    |              Atualizar Campos GHL
    |                   |
    |              [NOVO: Preparar Dados para Supabase] <-- ADICIONAR AQUI
    |                   |
    |              Atualizar Status Supabase (MODIFICADO)
    |
    +--[output 0]-- Salvar em Custom Object
                        |
                   Tem Contact ID?
                        |
                   +--[true]-- Associar Call ao Contato
                   |               |
                   |          [Conectar ao mesmo no Preparar Dados]
                   |
                   +--[false]-- [Conectar ao mesmo no Preparar Dados]
```

### Posicionamento no Canvas

**No "Preparar Dados para Supabase":**
- Position X: 3680
- Position Y: 368

**No "Atualizar Status Supabase" (movido):**
- Position X: 3904
- Position Y: 368

---

## Estrutura da Tabela call_recordings

### Colunas Relevantes

```sql
-- Campos existentes que serao atualizados
transcricao       TEXT,          -- Transcricao completa do Google Doc
analise_json      JSONB,         -- JSON completo da analise
analise_status    VARCHAR(50),   -- Status: 'pendente', 'processando', 'analisado', 'erro'
analyzed_at       TIMESTAMP,     -- Data/hora da analise
status            VARCHAR(50),   -- Status geral: 'movido', 'analisado', etc
processed_at      TIMESTAMP      -- Data/hora do processamento
```

### Verificar se Colunas Existem

```sql
-- Executar no Supabase SQL Editor para verificar
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'call_recordings'
AND column_name IN ('transcricao', 'analise_json', 'analise_status', 'analyzed_at');
```

### Criar Colunas se Nao Existirem

```sql
-- Adicionar colunas se nao existirem
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS transcricao TEXT,
ADD COLUMN IF NOT EXISTS analise_json JSONB,
ADD COLUMN IF NOT EXISTS analise_status VARCHAR(50) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP;

-- Criar indice para buscas por status
CREATE INDEX IF NOT EXISTS idx_call_recordings_analise_status
ON call_recordings(analise_status);
```

---

## Dados que Serao Salvos

### Campo: transcricao (TEXT)
Conteudo completo da transcricao do Google Doc, incluindo:
- Texto da conversa
- Timestamps (se presentes)
- Identificacao de speakers

### Campo: analise_json (JSONB)
Estrutura completa da analise retornada pelo "Code - Processar Analise V2":

```json
{
  "analise_geral": {
    "score_total": 75,
    "probabilidade_fechamento": 60,
    "status": "nutrir",
    "resumo_executivo": "..."
  },
  "scores_detalhados": {
    "qualificacao_bant": { "score": 7, "... ": "..." },
    "descoberta_spin": { "score": 8, "... ": "..." },
    "conducao": { "score": 6, "... ": "..." },
    "fechamento": { "score": 7, "... ": "..." }
  },
  "highlights_positivos": [...],
  "red_flags": {...},
  "plano_acao": {...},
  "veredicto_final": {...},
  "metadata": {
    "tier": "B BOA",
    "cor": "#3b82f6",
    "emoji": "check",
    "resumo_formatado": "...",
    "scores_formatado": "...",
    "timestamp": "2025-01-04T...",
    "reducao_tokens": "N/A"
  },
  "location_id": "...",
  "location_api_key": "...",
  "contact_id": "...",
  "call_recording_id": "...",
  "tipo_call": "diagnostico",
  "gdrive_url": "...",
  "association_id": "...",
  "nome_lead": "..."
}
```

---

## Teste e Validacao

### Query para Verificar Dados Salvos

```sql
SELECT
  id,
  nome_lead,
  status,
  analise_status,
  analyzed_at,
  length(transcricao) as transcricao_chars,
  analise_json->'analise_geral'->>'score_total' as score,
  analise_json->'metadata'->>'tier' as tier
FROM call_recordings
WHERE analyzed_at IS NOT NULL
ORDER BY analyzed_at DESC
LIMIT 10;
```

### Query para Debug

```sql
SELECT
  id,
  nome_lead,
  CASE
    WHEN transcricao IS NULL THEN 'NULL'
    WHEN transcricao = '' THEN 'VAZIO'
    ELSE 'OK (' || length(transcricao) || ' chars)'
  END as transcricao_status,
  CASE
    WHEN analise_json IS NULL THEN 'NULL'
    ELSE 'OK'
  END as analise_status,
  analyzed_at
FROM call_recordings
WHERE status = 'analisado'
ORDER BY processed_at DESC
LIMIT 5;
```

---

## Checklist de Implementacao

- [ ] Verificar se colunas existem na tabela `call_recordings`
- [ ] Criar colunas faltantes (se necessario)
- [ ] Adicionar no "Preparar Dados para Supabase" (Opcao 2)
- [ ] Modificar SQL do no "Atualizar Status Supabase"
- [ ] Reconectar nos do workflow
- [ ] Testar com uma call de exemplo
- [ ] Verificar dados salvos no Supabase
- [ ] Validar que transcricao e analise_json estao corretos

---

## Notas Importantes

1. **Tamanho da Transcricao:** Transcricoes podem ter varios KB. O tipo TEXT do Postgres suporta ate 1GB.

2. **Performance:** O campo JSONB permite queries eficientes como:
   ```sql
   SELECT * FROM call_recordings
   WHERE analise_json->'analise_geral'->>'score_total'::int > 70;
   ```

3. **Backup:** Considere fazer backup antes de modificar o workflow em producao.

4. **Erro Handling:** O no Postgres pode falhar se os dados tiverem caracteres especiais nao tratados. A Opcao 2 (com no Code) e mais robusta para isso.

---

## Autor
Documentacao gerada por Claude Code
Data: 2025-01-04
Workflow: 02-AI-Agent-Head-Vendas-V2 (ID: JiTZQcq7Tt2c5Xol)
