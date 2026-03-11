# Correções Workflow 02-AI-Agent-Head-Vendas-V2

**Data:** 2026-01-04
**Problema:** Campos chegando como N/A no POST para GHL
**Causa:** Dados do lead (contact_id, location_id, etc.) não estavam sendo passados entre os nós

---

## 🔧 Correção 1: Nó `2.1 Resolver Variáveis`

Substituir TODO o código do nó por:

```javascript
// =====================================================
// NÓ 2.1 - RESOLVER VARIÁVEIS NO PROMPT (CORRIGIDO)
// =====================================================

// Obter dados do prompt (do Postgres)
const promptRow = $input.first()?.json || {};
const promptContent = promptRow.prompt_content || '';
const promptKey = promptRow.prompt_key || 'unknown';
const version = promptRow.version || 1;

// CORREÇÃO: Buscar dados do lead do nó correto!
const dadosCall = $('Buscar Call no Supabase').first()?.json || {};

// Buscar transcrição
let transcricao = '';
try {
  const exportDoc = $('Export Google Doc como Texto').first()?.json || {};
  transcricao = exportDoc.data || exportDoc.texto || '';
} catch (e) {
  console.warn('Nó de transcrição não encontrado:', e.message);
}

// Mapeamento de variáveis
const variaveis = {
  // === DADOS DA TRANSCRIÇÃO ===
  'transcricao_processada': transcricao,
  'texto': transcricao,

  // === DADOS DO LEAD (AGORA VINDOS DO SUPABASE!) ===
  'nome_lead': dadosCall.nome_lead || dadosCall.contact_name || '',
  'tipo_call': dadosCall.tipo || 'diagnostico',
  'nome_empresa': dadosCall.nome_empresa || '',

  // === CONTEXTO DE NEGÓCIO ===
  'icp_segmento': '',
  'tickets': '[]',
  'red_flags_criticos': '',
  'objecoes': '[]',

  // === IDs ===
  'location_id': dadosCall.location_id || '',
  'contact_id': dadosCall.contact_id || '',

  // === METADATA ===
  'data_atual': new Date().toLocaleDateString('pt-BR'),
  'hora_atual': new Date().toLocaleTimeString('pt-BR'),
  'timestamp': new Date().toISOString()
};

// Resolver variáveis no prompt
let promptFinal = promptContent;

if (!promptContent) {
  console.error('ERRO: Prompt vazio!');
  promptFinal = 'ERRO: Prompt não encontrado no banco de dados.';
} else {
  for (const [key, value] of Object.entries(variaveis)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    const valorStr = value === null || value === undefined ? '' : String(value);
    promptFinal = promptFinal.replace(regex, valorStr);
  }
}

// Verificar placeholders não resolvidos
const placeholdersRestantes = promptFinal.match(/\{\{[^}]+\}\}/g) || [];

return [{
  json: {
    // PROMPT FINAL
    prompt_final: promptFinal,

    // TRANSCRIÇÃO PARA O AI AGENT
    transcricao_processada: transcricao,

    // DADOS DO LEAD (PARA PASSAR ADIANTE!)
    location_id: dadosCall.location_id || '',
    location_api_key: dadosCall.location_api_key || dadosCall.api_key || '',
    contact_id: dadosCall.contact_id || '',
    call_recording_id: dadosCall.id || '',
    tipo_call: dadosCall.tipo || 'diagnostico',
    gdrive_url: dadosCall.gdrive_url || '',
    association_id: dadosCall.association_id || '',
    nome_lead: dadosCall.nome_lead || dadosCall.contact_name || '',

    // Metadados
    prompt_metadata: {
      prompt_key: promptKey,
      version: version,
      original_length: promptContent.length,
      final_length: promptFinal.length
    },
    model_config: promptRow.model_config || {},

    // Debug
    variaveis_resolvidas: Object.fromEntries(
      Object.entries(variaveis).filter(([k, v]) => v !== '' && v !== '[]')
    ),
    placeholders_nao_resolvidos: placeholdersRestantes,
    success: promptContent.length > 0 && placeholdersRestantes.length === 0,
    resolved_at: new Date().toISOString()
  }
}];
```

---

## 🔧 Correção 2: Nó `Code - Processar Analise V2`

Substituir TODO o código do nó por:

```javascript
// =====================================================
// CODE - PROCESSAR ANALISE V2 (CORRIGIDO)
// =====================================================

const items = $input.all();

// CORREÇÃO: Buscar dados do lead DIRETAMENTE do Supabase
const dadosCall = $('Buscar Call no Supabase').first()?.json || {};

// CORREÇÃO: Também buscar do 2.1 Resolver Variáveis (que agora tem os dados)
const dadosResolverVariaveis = $('2.1 Resolver Variáveis').first()?.json || {};

function cleanFences(s) {
  if (typeof s !== 'string') s = String(s ?? '');
  let r = s.trim();
  r = r.replace(/^\s*```[a-z]*\s*/i, '');
  r = r.replace(/\s*```$/, '');
  return r;
}

function findBalancedEnd(s, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (ch === '\\') { esc = true; }
      else if (ch === '"') { inStr = false; }
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return i; }
    }
  }
  return -1;
}

function tryParse(str) {
  try { return JSON.parse(str); } catch {}
  const raw = cleanFences(str);
  try { return JSON.parse(raw); } catch {}
  const start = raw.indexOf('{');
  const end = start >= 0 ? findBalancedEnd(raw, start) : -1;
  if (start >= 0 && end >= 0) {
    const jsonStr = raw.slice(start, end + 1);
    try { return JSON.parse(jsonStr); } catch {}
  }
  return null;
}

function formatItem(analise) {
  let tier, cor, emoji;
  const scoreTotal = Number(analise?.analise_geral?.score_total ?? 0);
  if (scoreTotal >= 81) { tier = 'A+ EXCELENTE'; cor = '#10b981'; emoji = '🏆'; }
  else if (scoreTotal >= 61) { tier = 'B BOA'; cor = '#3b82f6'; emoji = '✅'; }
  else if (scoreTotal >= 41) { tier = 'C MEDIANA'; cor = '#f59e0b'; emoji = '⚠️'; }
  else { tier = 'D FRACA'; cor = '#ef4444'; emoji = '❌'; }

  const resumoFormatado = `
${emoji} CALL ${tier}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score Total: ${scoreTotal}/100
Probabilidade Fechamento: ${analise?.analise_geral?.probabilidade_fechamento ?? 0}%
Status: ${analise?.analise_geral?.status ?? ''}

${analise?.analise_geral?.resumo_executivo ?? ''}
`;

  const scores = `
📊 BREAKDOWN DE SCORES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Qualificacao (BANT): ${analise?.scores_detalhados?.qualificacao_bant?.score ?? 0}/10
• Descoberta (SPIN): ${analise?.scores_detalhados?.descoberta_spin?.score ?? 0}/10
• Conducao: ${analise?.scores_detalhados?.conducao?.score ?? 0}/10
• Fechamento: ${analise?.scores_detalhados?.fechamento?.score ?? 0}/10
`;

  return {
    json: {
      // === ANÁLISE DA IA ===
      ...analise,

      // === METADATA FORMATADA ===
      metadata: {
        tier,
        cor,
        emoji,
        resumo_formatado: resumoFormatado,
        scores_formatado: scores,
        timestamp: new Date().toISOString()
      },

      // === DADOS DO LEAD (DO SUPABASE - FONTE CONFIÁVEL!) ===
      location_id: dadosCall.location_id || dadosResolverVariaveis.location_id || null,
      location_api_key: dadosCall.location_api_key || dadosCall.api_key || dadosResolverVariaveis.location_api_key || null,
      contact_id: dadosCall.contact_id || dadosResolverVariaveis.contact_id || null,
      call_recording_id: dadosCall.id || dadosResolverVariaveis.call_recording_id || null,
      tipo_call: dadosCall.tipo || dadosResolverVariaveis.tipo_call || 'diagnostico',
      gdrive_url: dadosCall.gdrive_url || dadosResolverVariaveis.gdrive_url || null,
      association_id: dadosCall.association_id || dadosResolverVariaveis.association_id || null,
      nome_lead: dadosCall.nome_lead || dadosCall.contact_name || dadosResolverVariaveis.nome_lead || null
    }
  };
}

// CORREÇÃO: Buscar a resposta da IA do nó correto
// O input vem do "2.2 Registrar Uso" que é um INSERT, então precisamos buscar do AI Agent
let respostaIA = null;
try {
  const aiAgentOutput = $('AI Agent - Head de Vendas V2').first()?.json || {};
  respostaIA = aiAgentOutput.output || aiAgentOutput.text || aiAgentOutput;
} catch (e) {
  console.warn('Erro ao buscar resposta do AI Agent:', e.message);
}

const results = items.map(item => {
  // Primeiro tenta do input atual, depois do AI Agent
  const rawVal = item?.json?.output || item?.json?.text || respostaIA;
  const outputStr = typeof rawVal === 'string' ? rawVal : String(rawVal ?? '');
  const analise = typeof rawVal === 'object' && rawVal ? rawVal : tryParse(outputStr);

  if (!analise) {
    return {
      json: {
        metadata: {
          erro_parse: true,
          motivo: 'Resposta do agente incompleta ou com cercas Markdown. JSON invalido.',
          raw_snippet: cleanFences(outputStr).slice(0, 1000),
          timestamp: new Date().toISOString()
        },
        // AINDA ASSIM, PASSAR OS DADOS DO LEAD!
        location_id: dadosCall.location_id || dadosResolverVariaveis.location_id || null,
        location_api_key: dadosCall.location_api_key || dadosCall.api_key || dadosResolverVariaveis.location_api_key || null,
        contact_id: dadosCall.contact_id || dadosResolverVariaveis.contact_id || null,
        call_recording_id: dadosCall.id || dadosResolverVariaveis.call_recording_id || null,
        tipo_call: dadosCall.tipo || 'diagnostico',
        gdrive_url: dadosCall.gdrive_url || null,
        association_id: dadosCall.association_id || null,
        nome_lead: dadosCall.nome_lead || dadosCall.contact_name || null
      }
    };
  }
  return formatItem(analise);
});

return results;
```

---

## 📋 Checklist de Aplicação

- [ ] Abrir workflow `02-AI-Agent-Head-Vendas-V2` no n8n
- [ ] Substituir código do nó `2.1 Resolver Variáveis`
- [ ] Substituir código do nó `Code - Processar Analise V2`
- [ ] Salvar workflow
- [ ] Testar com um arquivo no Google Drive
- [ ] Verificar se os campos no GHL estão preenchidos corretamente

---

## 🔍 O Que Foi Corrigido

| Problema | Causa | Solução |
|----------|-------|---------|
| `contact_id` vazio | Nó 2.1 não buscava do Supabase | Adicionado `$('Buscar Call no Supabase')` |
| `location_id` vazio | Dados não passavam entre nós | Output do 2.1 agora inclui todos os dados |
| Análise da IA não chegava | Input vinha do INSERT | Busca direta do `AI Agent - Head de Vendas V2` |
| Campos N/A no GHL | Dados perdidos no fluxo | Fallback múltiplo em cada nó |
