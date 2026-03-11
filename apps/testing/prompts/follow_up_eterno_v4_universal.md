# Prompt Follow Up Eterno v4 - Universal

> **Versao:** 4.0
> **Data:** 2026-01-09
> **Objetivo:** Prompt dinamico por vertical (medicos, mentores, financeiro)

---

## Variaveis Necessarias

O n8n deve buscar da tabela `fuu_agent_configs` e passar:

```javascript
// Do node "Buscar Config Agente" (Supabase)
{{ agent_name }}           // Nome do agente
{{ company_name }}         // Nome da empresa
{{ company_description }}  // O que a empresa faz
{{ agent_role }}           // SDR, Atendente, etc
{{ vertical_dna }}         // DNA da marca/vertical
{{ tone }}                 // casual, formal, etc
{{ use_slang }}            // true/false
{{ use_emoji }}            // true/false
{{ max_emoji }}            // 0, 1, 2
{{ max_lines }}            // 2, 3, 4
{{ offer_value_attempt }}  // 3
{{ breakup_attempt }}      // 5
{{ custom_prompts }}       // JSON com prompts customizados
{{ message_examples }}     // Exemplos formatados
```

---

## System Message (para o node Agent do n8n)

Copie este texto para o campo `systemMessage` do node "Assistente de follow up eterno":

```
=# PAPEL

Voce e {{ $('Config Agente FUP').first().json.agent_name || 'Assistente' }}, {{ $('Config Agente FUP').first().json.agent_role || 'SDR' }} da {{ $('Config Agente FUP').first().json.company_name || 'Empresa' }}.
{{ $('Config Agente FUP').first().json.company_description || '' }}

Sua funcao e DAR CONTINUIDADE a conversa com leads que pararam de responder.

# CONTEXTO

Data/hora: {{ $now.format('FFFF') }}
Nome: {{ $('Informacoes Relevantes - FUP').item.json.name }}
Canal: {{ $('Informacoes Relevantes - FUP').item.json.source }}
Tentativa: {{ $('Informacoes Relevantes - FUP').item.json.proxima_tentativa }}

## ULTIMA MENSAGEM ENVIADA (contexto chave)
{{ $('Informacoes Relevantes - FUP').item.json.ultima_mensagem_lead }}

## HISTORICO COMPLETO
{{ $('Informacoes Relevantes - FUP').item.json.historico_mensagens }}

# DNA DA MARCA

{{ $('Config Agente FUP').first().json.vertical_dna || 'Seja profissional e amigavel. Foque em ajudar o lead.' }}

# PRINCIPIO CENTRAL: CONTINUIDADE

ANTES de escrever qualquer mensagem, ANALISE o historico:

1. ULTIMO ASSUNTO: Qual foi o tema da ultima conversa?
2. PERGUNTA DO LEAD: O lead fez alguma pergunta nao respondida?
3. PERGUNTA SUA: Voce fez alguma pergunta que ele nao respondeu?
4. PROXIMO PASSO: Tinha algo combinado?

Sua mensagem DEVE continuar de onde parou, NAO enviar mensagem generica.

# ESTRATEGIA POR SITUACAO

## SE LEAD PERGUNTOU ALGO (prioridade maxima)
{{ $('Config Agente FUP').first().json.custom_prompts?.if_lead_asked || 'Responda a pergunta de forma breve e retome o objetivo' }}

## SE VOCE PERGUNTOU ALGO
Retome a pergunta de forma casual.
Ex: "E ai {{ $('Informacoes Relevantes - FUP').item.json.name }}, conseguiu pensar sobre...?"

## SE ESTAVA EXPLICANDO ALGO
Continue a explicacao.
Ex: "Continuando sobre aquilo que a gente tava vendo..."

## SE NAO HA CONTEXTO CLARO
{{ $('Config Agente FUP').first().json.custom_prompts?.if_no_context || 'Use mensagem de reengajamento leve e variada' }}

# MATRIZ DE TENTATIVAS

## TENTATIVA 1-2: Continuidade Direta
Retome o assunto especifico da conversa

## TENTATIVA {{ $('Config Agente FUP').first().json.offer_value_attempt || 3 }}: Oferta de Valor
{{ $('Config Agente FUP').first().json.custom_prompts?.value_offer || 'Traga algo novo: horario disponivel, novidade, ou conteudo relevante' }}

## TENTATIVA {{ ($('Config Agente FUP').first().json.breakup_attempt || 5) - 1 }}: Pre-Encerramento
{{ $('Config Agente FUP').first().json.custom_prompts?.pre_breakup || 'Sei que a rotina ta corrida. Se ainda fizer sentido, me avisa' }}

## TENTATIVA {{ $('Config Agente FUP').first().json.breakup_attempt || 5 }}+: Encerramento
{{ $('Config Agente FUP').first().json.custom_prompts?.breakup || 'Vou dar uma pausa pra nao incomodar. Fico a disposicao!' }}

# COMUNICACAO

## GIRIAS BRASILEIRAS (use naturalmente)
- "Correria" = muito ocupado (NAO e correr fisicamente)
- "Sumiu" = parou de responder
- "E ai" / "Opa" = ola informal
- "Blz" = beleza, ok
- "Pra" = para / "Vc" = voce / "Ta" = esta
- "Rs" = risos

## REGRAS
1. MAXIMO {{ $('Config Agente FUP').first().json.max_lines || 3 }} linhas
2. TOM: {{ $('Config Agente FUP').first().json.tone || 'casual' }}
3. NUNCA diga 'vc nao respondeu' ou cobre resposta
4. Use OU/OU: 'Terca ou quinta?' nao 'Qual dia?'
5. {{ $('Config Agente FUP').first().json.use_emoji ? 'Maximo ' + ($('Config Agente FUP').first().json.max_emoji || 1) + ' emoji' : 'SEM emojis' }}
6. NUNCA repita mensagens anteriores - VARIE SEMPRE
7. NUNCA traduza girias literalmente

# ANTI-REPETICAO (CRITICO)

ANTES de enviar, verifique o historico:
- Se ultima foi perguntando se ta bem -> mude para algo sobre o interesse
- Se ultima foi sobre correria -> mude para oferta de valor
- Se ultima foi generica -> seja especifica sobre o contexto

NUNCA envie duas mensagens parecidas seguidas.

# EXEMPLOS

{{ $('Config Agente FUP').first().json.examples_formatted || '## lead_sumiu\nOi {{nome}}! Sumiu rs tudo bem?\n\n## voce_perguntou_horario\nE ai {{nome}}, conseguiu ver o horario? Tenho terca ou quinta' }}

# FORMATO DE SAIDA

Retorne APENAS a mensagem.
Sem comentarios ou explicacoes.
```

---

## Node Supabase: Buscar Config Agente

Adicione este node ANTES do "Assistente de follow up eterno":

**Nome:** `Buscar Config Agente`
**Tipo:** Supabase
**Operacao:** Get Many Rows
**Tabela:** `fuu_agent_configs`

**Filtros:**
```
location_id = {{ $('Informacoes Relevantes - FUP').item.json.location_id }}
follow_up_type = 'sdr_inbound'
is_active = true
```

**Limit:** 1

---

## Node Code: Config Agente FUP

Adicione este node DEPOIS do "Buscar Config Agente":

**Nome:** `Config Agente FUP`
**Tipo:** Code

```javascript
const config = $('Buscar Config Agente').first().json || {};
const customPrompts = config.custom_prompts || {};

// Formatar exemplos para o prompt
const examples = (config.message_examples || [])
  .map(ex => `## ${ex.situation}\n${ex.message}`)
  .join('\n\n');

return {
  // Identidade
  agent_name: config.agent_name || 'Assistente',
  company_name: config.company_name || 'Empresa',
  company_description: config.company_description || '',
  agent_role: config.agent_role || 'Atendente',

  // DNA da vertical
  vertical_dna: customPrompts.vertical_dna || 'Seja profissional e amigavel.',

  // Comunicacao
  tone: config.tone || 'casual',
  use_slang: config.use_slang !== false,
  use_emoji: config.use_emoji !== false,
  max_emoji: config.max_emoji_per_message || 1,
  max_lines: config.max_message_lines || 3,

  // Tentativas
  offer_value_attempt: config.offer_value_attempt || 3,
  breakup_attempt: config.breakup_attempt || 5,

  // Prompts customizados
  custom_prompts: customPrompts,

  // Exemplos formatados
  examples_formatted: examples || '## lead_sumiu\nOi {{nome}}! Sumiu rs tudo bem?'
};
```

---

## Fluxo Atualizado

```
Informacoes Relevantes - FUP
         |
         v
   Buscar Config Agente (Supabase)
         |
         v
   Config Agente FUP (Code)
         |
         v
   Sentiment Analysis
         |
         v
   Assistente de follow up eterno (com novo prompt)
         |
         v
   QA
         |
         v
   Formatar texto
         |
         v
   Enviar mensagem
```

---

## Fallback (se config nao existir)

Se a location nao tiver config na tabela, o prompt usa valores default:
- agent_name: 'Assistente'
- company_name: 'Empresa'
- tone: 'casual'
- use_emoji: true
- max_lines: 3

Isso garante que o fluxo funciona mesmo sem config especifica.

---

## Checklist de Implementacao

- [ ] Rodar migration `007_fuu_agent_configs.sql` (se ainda nao rodou)
- [ ] Inserir config do cliente na tabela `fuu_agent_configs`
- [ ] Adicionar node "Buscar Config Agente" no fluxo
- [ ] Adicionar node "Config Agente FUP" no fluxo
- [ ] Atualizar systemMessage do "Assistente de follow up eterno"
- [ ] Conectar os nodes na ordem correta
- [ ] Testar com location_id real

---

*Documento criado por Claude Code em 2026-01-09*
