# Upgrade Workflow 02 - Fallback Contact + Salvar Transcrições

**Data:** 2026-01-04
**Problema:** `contact_id` vindo null mesmo existindo no Supabase
**Solução:** Adicionar busca de contato como fallback + salvar transcrições

---

## Problema Identificado

O `contact_id` existe no Supabase mas chega `null` no workflow 02. Possíveis causas:
1. Timing: workflow 02 dispara antes do 01 terminar de inserir
2. Query busca registro antigo sem contact_id
3. Dados não propagam corretamente entre nós

---

## Solução 1: Adicionar Nó de Busca de Contato (Fallback)

Adicionar um nó **depois** do `Buscar Call no Supabase` para buscar o contato no GHL se `contact_id` estiver vazio.

### Novo Nó: `Buscar Contato GHL (Fallback)`

**Tipo:** HTTP Request
**Posição:** Entre `Buscar Call no Supabase` e `Call Existe?`

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://services.leadconnectorhq.com/contacts/search",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ $json.location_api_key || $json.api_key || 'pit-fe627027-b9cb-4ea3-aaa4-149459e66a03' }}"
        },
        {
          "name": "Version",
          "value": "2021-07-28"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"locationId\": \"{{ $json.location_id }}\",\n  \"query\": \"{{ $json.contact_phone || $json.telefone }}\",\n  \"limit\": 1\n}"
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "name": "Buscar Contato GHL (Fallback)",
  "executeOnce": false,
  "continueOnFail": true
}
```

### Novo Nó: `Merge Contact Data`

**Tipo:** Code
**Posição:** Depois do `Buscar Contato GHL (Fallback)`

```javascript
// Merge dados do Supabase com fallback do GHL
const dadosSupabase = $('Buscar Call no Supabase').first()?.json || {};
const buscaGHL = $input.first()?.json || {};

// Tentar pegar contact_id do GHL se não veio do Supabase
let contactId = dadosSupabase.contact_id;

if (!contactId && buscaGHL.contacts && buscaGHL.contacts.length > 0) {
  contactId = buscaGHL.contacts[0].id;
  console.log('Contact ID recuperado do GHL:', contactId);
}

return [{
  json: {
    ...dadosSupabase,
    contact_id: contactId,
    contact_id_source: contactId === dadosSupabase.contact_id ? 'supabase' : 'ghl_fallback'
  }
}];
```

---

## Solução 2: Salvar Transcrições no Supabase

### Estrutura da Tabela (se não existir)

```sql
-- Verificar se a coluna transcricao existe
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS transcricao TEXT;

-- Adicionar coluna de análise completa
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS analise_json JSONB DEFAULT '{}';

-- Adicionar timestamp de análise
ALTER TABLE call_recordings
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP;
```

### Novo Nó: `Salvar Transcrição no Supabase`

**Tipo:** Postgres
**Posição:** Depois do `Code - Processar Analise V2`, em paralelo com outros nós

```sql
UPDATE call_recordings
SET
  transcricao = '{{ $('Export Google Doc como Texto').item.json.data.replace(/'/g, "''") }}',
  analise_json = '{{ JSON.stringify($json).replace(/'/g, "''") }}'::jsonb,
  analise_status = 'analisado',
  analyzed_at = NOW()
WHERE id = '{{ $json.call_recording_id }}'
RETURNING id, titulo, analise_status
```

---

## Solução 3: Pipeline RAG para Transcrições (Futuro)

### Ideia do Fluxo

```
Transcrição Salva no Supabase
        ↓
Trigger: Nova transcrição analisada
        ↓
Extrair insights chave:
  - Objeções comuns
  - Perguntas frequentes
  - Pontos de dor
  - Gatilhos de compra
        ↓
Salvar no RAG com tags:
  - tipo_call
  - resultado (ganho/perdido)
  - segmento_cliente
  - objecoes_encontradas
        ↓
Agente "Oportunidades" pode consultar:
  - "Quais objeções mais comuns em calls perdidas?"
  - "O que leads quentes têm em comum?"
  - "Qual script funciona melhor para [segmento]?"
```

### Webhook para RAG (adicionar no final do workflow)

```javascript
// Extrair insights para RAG
const analise = $json;
const transcricao = $('Export Google Doc como Texto').item.json.data || '';

// Só salvar no RAG se for call qualificada (score > 50)
const scoreTotal = analise.analise_geral?.score_total || 0;
if (scoreTotal < 50) {
  return [{ json: { rag_saved: false, reason: 'score_baixo' } }];
}

const ragPayload = {
  category: 'call_analysis',
  title: `Call ${analise.metadata?.tier || 'N/A'} - ${analise.nome_lead || 'Lead'} - Score ${scoreTotal}`,
  content: `
RESUMO: ${analise.analise_geral?.resumo_executivo || 'N/A'}

SCORES:
- BANT: ${analise.scores_detalhados?.qualificacao_bant?.score || 0}/10
- SPIN: ${analise.scores_detalhados?.descoberta_spin?.score || 0}/10
- Condução: ${analise.scores_detalhados?.conducao?.score || 0}/10
- Fechamento: ${analise.scores_detalhados?.fechamento?.score || 0}/10

STATUS: ${analise.analise_geral?.status || 'N/A'}
PROBABILIDADE: ${analise.analise_geral?.probabilidade_fechamento || 0}%

HIGHLIGHTS:
${(analise.highlights_positivos || []).map(h => '+ ' + h.momento).join('\n')}

RED FLAGS:
${(analise.red_flags?.flags_identificados || []).map(f => '- ' + f.flag).join('\n')}

PRÓXIMOS PASSOS:
${(analise.veredicto_final?.proximos_passos || []).join('\n')}
  `.trim(),
  project_key: 'socialfy',
  tags: [
    'call',
    analise.tipo_call || 'diagnostico',
    analise.metadata?.tier?.toLowerCase().replace(' ', '_') || 'sem_tier',
    scoreTotal >= 80 ? 'high_performer' : scoreTotal >= 60 ? 'medium' : 'needs_improvement'
  ]
};

// Fazer POST para RAG
const response = await fetch('https://agenticoskevsacademy-production.up.railway.app/webhook/rag-ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(ragPayload)
});

return [{ json: { rag_saved: true, payload: ragPayload } }];
```

---

## Implementação Passo a Passo

### Fase 1: Fix Imediato (contact_id)
- [ ] Adicionar nó `Buscar Contato GHL (Fallback)` após `Buscar Call no Supabase`
- [ ] Adicionar nó `Merge Contact Data` para combinar dados
- [ ] Atualizar referências de contact_id nos nós seguintes

### Fase 2: Salvar Transcrições
- [ ] Verificar/criar coluna `transcricao` no Supabase
- [ ] Adicionar nó `Salvar Transcrição no Supabase`
- [ ] Testar com uma call

### Fase 3: Pipeline RAG (Futuro)
- [ ] Criar trigger para novas transcrições
- [ ] Implementar extração de insights
- [ ] Criar agente de oportunidades

---

## Arquitetura Final

```
Workflow 01 (Monitor)          Workflow 02 (Análise)
        ↓                              ↓
Detecta arquivo         →    Busca no Supabase
        ↓                              ↓
Busca contato GHL              Fallback: busca GHL
        ↓                              ↓
Registra no Supabase           Analisa com IA
        ↓                              ↓
Move arquivo                   Salva transcrição
                                       ↓
                               Atualiza GHL
                                       ↓
                               Salva no RAG (se score > 50)
```
