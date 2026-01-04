# GUIA COMPLETO DOS NÓS DATA TRANSFORM - FLUXO GHL MOTTIVME

## ÍNDICE
1. [Visão Geral](#1-visao-geral)
2. [Tipos de Transformação](#2-tipos-de-transformacao)
3. [Detalhamento por Categoria](#3-detalhamento-por-categoria)
   - 3.1 [Nós Code (JavaScript)](#31-nos-code-javascript)
   - 3.2 [Nós Set (Field Mapping)](#32-nos-set-field-mapping)
4. [Fluxo de Dados](#4-fluxo-de-dados)
5. [Referência Rápida](#5-referencia-rapida)

---

## 1. VISÃO GERAL

### Resumo Executivo
O fluxo GHL Mottivme Sales utiliza **23 nós de transformação** organizados em **2 categorias**:

| Categoria | Quantidade | Propósito |
|-----------|------------|-----------|
| **Code (JavaScript)** | 15 | Lógica complexa, detecção de padrões, cálculos |
| **Set (Field Mapping)** | 8 | Mapeamento simples de campos, formatação |

### Distribuição por TypeVersion
```
TypeVersion 2: 15 nós Code
TypeVersion 3.4: 8 nós Set
```

### Propósitos Principais
1. **Normalização de Dados**: Limpeza e padronização de inputs do GHL
2. **Detecção de Contexto**: Identificação de objetivo do lead (carreira/consultoria)
3. **Hiperpersonalização**: Adaptação dinâmica por DDD, setor, cargo
4. **Validação**: Prevenção de mensagens encavaladas
5. **Cálculo de Métricas**: Estimativa de custos de LLM
6. **Preparação para IA**: Formatação de mensagens e contexto

---

## 2. TIPOS DE TRANSFORMAÇÃO

### 2.1 Code Nodes (JavaScript)
| Subcategoria | Nós | Função |
|--------------|-----|--------|
| **Normalização** | 3 | Normalizar Nome, Normalizar Dados, Contexto UTM |
| **Detecção** | 4 | Classificar Tipo Mensagem, Extrair IDs, Detectar Objetivo, Mensagem Encavalada |
| **Preparação** | 3 | Preparar Mensagem, Deduplica Mensagens, Preparar Execução |
| **Cálculo** | 2 | Calcular Custo LLM, Code in JavaScript2 |
| **Utilitário** | 3 | Code1 (timestamp), Extrair Extensão, Code in JavaScript (conversation) |

### 2.2 Set Nodes (Field Mapping)
| Subcategoria | Nós | Função |
|--------------|-----|--------|
| **Input Processing** | 4 | GetInfo, Info, Form Mensagem, Imagem ou audio |
| **Enrichment** | 2 | Set mensagens, Edit Fields (conversation) |
| **Auxiliary** | 2 | Edit Fields1, Edit Fields2 |

---

## 3. DETALHAMENTO POR CATEGORIA

## 3.1 NÓS CODE (JAVASCRIPT)

### 3.1.1 Nó: "Contexto UTM"
**ID:** `8ec83b65-d1ee-44ed-9c6c-518767efaa96`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [-816, 400] |
| **Propósito** | Extrai contexto inicial do lead baseado em UTM Content |

**Código JavaScript:**
```javascript
// Contexto Inicial do Lead baseado em UTM
const input = $input.first().json.body;

const utmContent = input.contact?.attributionSource?.utmContent || '';
const messageBody = (input.message?.body || '').trim();
const isPrimeiraMensagem = !messageBody || messageBody === '' || messageBody === ' ';

const contextoPorUTM = {
  'CARREIRA': {
    contexto: 'Lead interessado em CARREIRA no mercado financeiro americano',
    interesse: 'Oportunidades de carreira como agente de seguros nos EUA',
    abordagem: 'Falar sobre licenciamento, ganhos, estrutura de trabalho'
  },
  'CONSULTORIA': {
    contexto: 'Lead interessado em CONSULTORIA financeira pessoal',
    interesse: 'Planejamento financeiro, proteção patrimonial, seguros',
    abordagem: 'Falar sobre benefícios, proteção familiar, investimentos'
  },
  'INVESTIMENTO': {
    contexto: 'Lead interessado em INVESTIMENTOS',
    interesse: 'Opções de investimento e crescimento patrimonial',
    abordagem: 'Falar sobre produtos financeiros, retornos, segurança'
  }
};

let tipoLead = '';
for (const tipo of Object.keys(contextoPorUTM)) {
  if (utmContent.toUpperCase().includes(tipo)) {
    tipoLead = tipo;
    break;
  }
}

let mensagemContexto = '';
let contextoObj = null;

if (isPrimeiraMensagem && tipoLead) {
  contextoObj = contextoPorUTM[tipoLead];
  mensagemContexto = `[CONTEXTO DO LEAD]\nTipo: ${tipoLead}\n${contextoObj.contexto}\nInteresse principal: ${contextoObj.interesse}\nAbordagem sugerida: ${contextoObj.abordagem}\n\nWork Permit: ${input['Work Permit'] || input.customData?.work_permit || 'Não informado'}\nEstado: ${input['Estado onde mora'] || 'Não informado'}\n`;
}

return {
  json: {
    body: input,
    is_primeira_mensagem: isPrimeiraMensagem,
    tem_contexto_utm: !!tipoLead,
    tipo_lead: tipoLead || 'NAO_IDENTIFICADO',
    utm_content: utmContent,
    mensagem_contexto: mensagemContexto,
    mensagem_original: messageBody,
    work_permit: input['Work Permit'] || input.customData?.work_permit || '',
    estado: input['Estado onde mora'] || '',
    contexto_para_ai: isPrimeiraMensagem && contextoObj ? contextoObj : null
  }
};
```

**Inputs Esperados:**
- `body.contact.attributionSource.utmContent`
- `body.message.body`
- `body['Work Permit']` ou `body.customData.work_permit`
- `body['Estado onde mora']`

**Outputs Gerados:**
- `is_primeira_mensagem` (boolean)
- `tem_contexto_utm` (boolean)
- `tipo_lead` (string: CARREIRA | CONSULTORIA | INVESTIMENTO | NAO_IDENTIFICADO)
- `mensagem_contexto` (string formatada para IA)
- `contexto_para_ai` (object ou null)

**Lógica:**
1. Detecta se é primeira mensagem (body vazio)
2. Identifica tipo de lead por palavra-chave no UTM Content
3. Se primeira mensagem + UTM identificado → gera contexto rico
4. Contexto inclui abordagem sugerida, work permit, estado

---

### 3.1.2 Nó: "Normalizar Nome1"
**ID:** `2613bf85-8e78-4ce2-8a5b-4824bd8f62a9`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [-592, 400] |
| **Propósito** | Limpa e padroniza nomes de leads vindos do GHL |

**Código JavaScript:**
```javascript
// Normalizar Nome do Lead
const inputData = $input.first().json;
const body = inputData.body || {};

let nome = body.full_name || ((body.first_name || '') + ' ' + (body.last_name || '')).trim() || body.customData?.name || '';
const nomeOriginal = nome;

nome = nome.replace(/\d+/g, '').trim();
nome = nome.replace(/[_\-.@]/g, ' ').trim();
nome = nome.replace(/([a-z])([A-Z])/g, '$1 $2');

const apelidosCurtos = ['lu', 'le', 'li', 'jo', 'ze', 'ma', 'mi', 'ju', 'du', 'bi', 'ca', 'ka', 'fe', 'be', 'ne', 're', 'ra', 'ro', 'vi', 'va', 'na', 'ni', 'ta', 'ti', 'la', 'lo', 'ed', 'el'];

function separarApelidoSobrenome(str) {
  if (str.includes(' ')) return str;
  if (str.length <= 10) return str;
  const lower = str.toLowerCase();
  for (let len = 2; len <= 3; len++) {
    const possivel = lower.slice(0, len);
    if (apelidosCurtos.includes(possivel)) {
      const resto = str.slice(len);
      if (resto.length >= 4) return str.slice(0, len) + ' ' + resto;
    }
  }
  return str;
}

nome = separarApelidoSobrenome(nome);
nome = nome.replace(/\s+/g, ' ').trim();

function capitalizar(str) {
  const preposicoes = ['de', 'da', 'do', 'das', 'dos', 'e'];
  return str.toLowerCase().split(' ').map((palavra, i) => {
    if (i > 0 && preposicoes.includes(palavra)) return palavra;
    return palavra.charAt(0).toUpperCase() + palavra.slice(1);
  }).join(' ');
}

let partes = nome.split(' ').filter(p => p.length > 0);
let firstName = partes[0] || nome || '';
let lastName = partes.slice(1).join(' ') || '';

firstName = capitalizar(firstName);
lastName = capitalizar(lastName);

const tinhaNumero = /\d/.test(nomeOriginal);
const qualidade = (firstName.length < 2 || tinhaNumero) ? 'revisar' : 'ok';

return {
  json: {
    ...inputData,
    nome_original: nomeOriginal,
    first_name: firstName,
    last_name: lastName,
    nome_completo: lastName ? `${firstName} ${lastName}` : firstName,
    qualidade_nome: qualidade
  }
};
```

**Lógica de Limpeza:**
1. **Remove números** (leads com nome tipo "João123")
2. **Remove caracteres especiais** (_, -, ., @)
3. **Separa CamelCase** (JoãoSilva → João Silva)
4. **Detecta apelidos grudados** (LuSilva → Lu Silva)
5. **Capitaliza corretamente** (preserva preposições: "da", "de")
6. **Separa first/last name**
7. **Marca qualidade** (revisar se < 2 chars ou tinha número)

**Inputs Esperados:**
- `body.full_name` OU
- `body.first_name` + `body.last_name` OU
- `body.customData.name`

**Outputs Gerados:**
- `nome_original` (preserva o input)
- `first_name` (capitalizado)
- `last_name` (capitalizado)
- `nome_completo` (formatado)
- `qualidade_nome` (ok | revisar)

---

### 3.1.3 Nó: "Normalizar Dados1"
**ID:** `13417ca6-d87d-4026-bc68-428b9d441a65`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [-368, 400] |
| **Propósito** | Normaliza campos de objetivo, agente e ativação da IA |

**Código JavaScript:**
```javascript
// Normalizar dados do lead
const inputData = $input.first().json;
const body = inputData.body || {};
const customData = body.customData || {};
const tags = (body.tags || '').toLowerCase();
const utmContent = body.contact?.attributionSource?.utmContent || '';

// === OBJETIVO DO LEAD ===
let objetivo_do_lead = customData.objetivodolead || '';

if (!objetivo_do_lead) {
  if (tags.includes('consultoria')) {
    objetivo_do_lead = 'consultoria';
  } else if (tags.includes('carreira')) {
    objetivo_do_lead = 'carreira';
  } else if (utmContent.toLowerCase().includes('consultoria')) {
    objetivo_do_lead = 'consultoria';
  } else if (utmContent.toLowerCase().includes('carreira')) {
    objetivo_do_lead = 'carreira';
  } else {
    objetivo_do_lead = 'indefinido'; // ✅ Não assume mais 'carreira' como padrão
  }
}

// === AGENTE IA ===
let agente_ia = customData.motive || '';

if (!agente_ia) {
  // Verifica tags específicas
  if (tags.includes('closer')) {
    agente_ia = 'closer';
  } else if (tags.includes('followuper')) {
    agente_ia = 'followuper';
  } else if (objetivo_do_lead === 'consultoria') {
    agente_ia = 'sdrconsultoria';
  } else if (objetivo_do_lead === 'carreira') {
    agente_ia = 'sdrcarreira';
  } else {
    agente_ia = 'indefinido'; // ✅ Leads sem classificação clara
  }
}
// ✅ Se customData.motive vier com 'assistente_admin' ou 'assistente_interno',
//    mantém o valor original

// === ATIVAR IA ===
let ativar_ia = customData.ativar_ia || '';

if (tags.includes('perdido')) {
  ativar_ia = 'nao';
} else if (utmContent) {
  ativar_ia = 'sim';
} else if (ativar_ia === 'sim' || tags.includes('ativar_ia')) {
  ativar_ia = 'sim';
} else {
  ativar_ia = 'nao';
}

return {
  json: {
    ...inputData,
    objetivo_do_lead,
    agente_ia,
    ativar_ia,
    utm_content: utmContent,
    tags_original: body.tags
  }
};
```

**Lógica de Prioridade (objetivo_do_lead):**
1. `customData.objetivodolead` (se existir)
2. Tags do GHL ('consultoria' ou 'carreira')
3. UTM Content (keyword matching)
4. Default: 'indefinido' (não assume mais carreira)

**Lógica de Prioridade (agente_ia):**
1. `customData.motive` (mantém se for assistente_admin/interno)
2. Tags específicas (closer, followuper)
3. Deriva do objetivo_do_lead
4. Default: 'indefinido'

**Lógica de Prioridade (ativar_ia):**
1. Tag 'perdido' → forçar 'nao'
2. Tem UTM Content → 'sim'
3. Já está ativo OU tag 'ativar_ia' → 'sim'
4. Default: 'nao'

---

### 3.1.4 Nó: "Code1"
**ID:** `f94f1796-7e0e-41a6-b5b9-dc9bdb08be95`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [48, 400] |
| **Propósito** | Gera timestamps ISO e milliseconds para tracking |

**Código JavaScript:**
```javascript
const start = new Date();
const starttimeISO = start.toISOString();
const starttimeMs = start.getTime();

const end = new Date(start);
end.setDate(end.getDate() + 7);
const endtimeISO = end.toISOString();
const endtimeMs = end.getTime();

const inputData = $input.first().json;

return [{
  json: {
    ...inputData,
    starttimeISO,
    starttimeMs,
    endtimeISO,
    endtimeMs
  }
}];
```

**Outputs Gerados:**
- `starttimeISO` (string ISO 8601)
- `starttimeMs` (number - timestamp Unix)
- `endtimeISO` (string ISO 8601 - +7 dias)
- `endtimeMs` (number - timestamp Unix +7 dias)

**Uso:** IDs únicos de mensagem, janelas de tempo para busca de histórico

---

### 3.1.5 Nó: "Classificar Tipo Mensagem"
**ID:** `9c3a06ca-329b-4b18-b4f8-01b69685e9fe`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [192, 400] |
| **Propósito** | Detecta tipo de anexo (imagem, áudio, PDF, planilha, etc) |

**Código JavaScript:**
```javascript
const customData = $input.first().json.body?.customData || $input.first().json.customData || {};
const body = $input.first().json.body || $input.first().json || {};

const anexo = (
  customData.attachments ||
  customData.photo_audio ||
  body.attachments ||
  body.photo_audio ||
  ''
).toLowerCase();

let tipo_mensagem_original = 'texto';

// Imagens
if (anexo.includes('.jpg') || anexo.includes('.jpeg') || anexo.includes('.png') || anexo.includes('.gif') || anexo.includes('.webp')) {
  tipo_mensagem_original = 'imagem';
}
// PDF
else if (anexo.includes('.pdf')) {
  tipo_mensagem_original = 'pdf';
}
// Planilhas e CSV
else if (anexo.includes('.csv') || anexo.includes('.xls') || anexo.includes('.xlsx')) {
  tipo_mensagem_original = 'planilha';
}
// Áudio - AGORA INCLUI .MP4
else if (anexo.includes('.mp3') || anexo.includes('.ogg') || anexo.includes('.wav') || anexo.includes('.m4a') || anexo.includes('.opus') || anexo.includes('.mp4')) {
  tipo_mensagem_original = 'audio';
}
// Documentos Word
else if (anexo.includes('.doc') || anexo.includes('.docx')) {
  tipo_mensagem_original = 'documento_word';
}

return {
  ...$input.first().json,
  tipo_mensagem_original,
  anexo_url: anexo
};
```

**Tipos Detectados:**
- `texto` (default)
- `imagem` (.jpg, .jpeg, .png, .gif, .webp)
- `audio` (.mp3, .ogg, .wav, .m4a, .opus, .mp4)
- `pdf` (.pdf)
- `planilha` (.csv, .xls, .xlsx)
- `documento_word` (.doc, .docx)

**NOTA IMPORTANTE:** `.mp4` é classificado como áudio (WhatsApp envia áudos em MP4)

---

### 3.1.6 Nó: "Code in JavaScript"
**ID:** `995b1e60-b25c-41fb-8d63-bcf7aab0ddc2`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [1456, -528] |
| **Propósito** | Extrai ID da conversa mais recente do GHL |

**Código JavaScript:**
```javascript
// Extrai o ID da conversa mais recente
const data = $input.first().json;

if (data.conversations && data.conversations.length > 0) {
  const conversationId = data.conversations[0].id;

  return [{
    json: {
      conversationId: conversationId,
      contactId: $input.first().json.body?.contact_id || data.conversations[0].contactId
    }
  }];
}

// Se não encontrar conversa, retorna vazio
return [];
```

**Lógica:**
1. Verifica se existe array `conversations`
2. Pega o primeiro item (mais recente)
3. Extrai `id` e `contactId`
4. Retorna vazio se não encontrar

**Uso:** Branch de reset de memória, limpeza de histórico

---

### 3.1.7 Nó: "2️⃣ Extrair IDs dos campos"
**ID:** `e3cf8233-fe3a-4edc-930a-874c2e44b4da`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [1520, -1152] |
| **Propósito** | Extrai IDs de custom fields do GHL para detecção de objetivo |

**Código JavaScript Completo:**
```javascript
const infoNode = $('Info').first().json;
const inputData = $input.first().json;

// ========== 1. EXTRAI CAMPOS CUSTOMIZADOS ==========
let customFields = [];

if (inputData.customFields) {
  customFields = inputData.customFields;
} else if (Array.isArray(inputData) && inputData[0]?.customFields) {
  customFields = inputData[0].customFields;
}

const ativarIAField = customFields.find(f => f.fieldKey === "contact.ativar_ia");
const especialistaMotiveField = customFields.find(f => f.fieldKey === "contact.contactmotive_responsavel");
const objetivoLeadField = customFields.find(f => f.fieldKey === "contact.objetivo_do_lead");

// Pega as opções válidas diretamente do picklist do GHL
const opcoesObjetivoValidas = (objetivoLeadField?.picklistOptions || []).filter(opt => opt !== 'x');
const opcoesEspecialistaValidas = especialistaMotiveField?.picklistOptions || [];

// ========== 2. EXTRAI CONVERSATION ID ==========
let conversationId = null;
let contactId = infoNode.lead_id || null;

if (inputData.conversations && inputData.conversations.length > 0) {
  conversationId = inputData.conversations[0].id;
  contactId = inputData.body?.contact_id || inputData.conversations[0].contactId || contactId;
}

// ========== 3. DETECTA OBJETIVO ==========
function getString(valor) {
  if (!valor) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'object') {
    return valor.text || valor.message || valor.content || '';
  }
  return String(valor);
}

const mensagem = getString(infoNode.message || infoNode.body).toLowerCase();
const objetivoDoLead = getString(infoNode.objetivo_do_lead).toLowerCase();
const especialistaMotive = getString(infoNode.contactmotive_responsavel).toLowerCase();
const informacoesIA = getString(infoNode.informaes_para_ai).toLowerCase();

const keywordsCarreira = ['carreira', 'recrutamento', 'recrutar', 'vaga', 'emprego', 'trabalho', 'sdrcarreira', 'socialsellercarreira'];
const keywordsConsultoria = ['consultoria', 'consultor', 'mentor', 'mentoria', 'sdrconsultoria', 'socialsellerconsultoria'];

function contemKeyword(texto, keywords) {
  return keywords.some(kw => texto.includes(kw));
}

function detectarObjetivo(texto) {
  if (contemKeyword(texto, keywordsCarreira)) return 'carreira';
  if (contemKeyword(texto, keywordsConsultoria)) return 'consultoria';
  return null;
}

// Mapeamento objetivo → especialista
function getEspecialista(objetivo) {
  if (objetivo === 'carreira') return 'sdrcarreira';
  if (objetivo === 'consultoria') return 'sdrconsultoria';
  return '';
}

const textoCompleto = `${mensagem} ${objetivoDoLead} ${especialistaMotive} ${informacoesIA}`;

const regexTeste = /\/teste\s+(carreira|recrutamento|consultoria|consultor|mentor)/i;
const matchTeste = mensagem.match(regexTeste);

let resultado = 'indefinido';
let especialistaDefinido = '';
let objetivoDefinido = '';
let fonteDeteccao = 'nenhuma';

// Prioridade 1: Comando /teste na mensagem
if (matchTeste) {
  const objetivoDetectado = detectarObjetivo(matchTeste[1].toLowerCase());
  if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {
    resultado = objetivoDetectado;
    especialistaDefinido = getEspecialista(objetivoDetectado);
    objetivoDefinido = objetivoDetectado;
    fonteDeteccao = 'comando_teste';
  }
}

// Prioridade 2: Campo objetivo_do_lead já preenchido COM VALOR VÁLIDO
if (resultado === 'indefinido' && objetivoDoLead && opcoesObjetivoValidas.includes(objetivoDoLead)) {
  resultado = objetivoDoLead;
  especialistaDefinido = getEspecialista(objetivoDoLead);
  objetivoDefinido = objetivoDoLead;
  fonteDeteccao = 'campo_objetivo';
}

// Prioridade 3: Especialista já definido
if (resultado === 'indefinido' && especialistaMotive) {
  const objetivoDetectado = detectarObjetivo(especialistaMotive);
  if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {
    resultado = objetivoDetectado;
    especialistaDefinido = getEspecialista(objetivoDetectado);
    objetivoDefinido = objetivoDetectado;
    fonteDeteccao = 'campo_especialista';
  }
}

// Prioridade 4: Análise do texto completo
if (resultado === 'indefinido') {
  const objetivoDetectado = detectarObjetivo(textoCompleto);
  if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {
    resultado = objetivoDetectado;
    especialistaDefinido = getEspecialista(objetivoDetectado);
    objetivoDefinido = objetivoDetectado;
    fonteDeteccao = 'analise_texto';
  }
}

// ========== RETORNA TUDO ==========
return [{
  json: {
    // IDs dos campos
    ativar_ia_id: ativarIAField?.id || null,
    especialista_motive_id: especialistaMotiveField?.id || null,
    objetivo_lead_id: objetivoLeadField?.id || null,

    // IDs da conversa
    conversationId: conversationId,
    contactId: contactId,

    // Resultado da detecção
    resultado: resultado,
    especialista_motive: especialistaDefinido,
    objetivo_lead: objetivoDefinido,
    fonte_deteccao: fonteDeteccao,
    precisa_perguntar: resultado === 'indefinido',
    mensagem_original: mensagem,

    // Debug - opções válidas do GHL
    opcoes_objetivo_validas: opcoesObjetivoValidas,
    opcoes_especialista_validas: opcoesEspecialistaValidas
  }
}];
```

**Lógica de Prioridade:**
1. **Comando /teste** na mensagem (ex: "/teste carreira")
2. **Campo objetivo_do_lead** já preenchido (valida contra picklist)
3. **Campo especialista** já definido (deriva objetivo)
4. **Análise de texto completo** (mensagem + campos)

**Keywords de Detecção:**
- **Carreira:** carreira, recrutamento, recrutar, vaga, emprego, trabalho, sdrcarreira
- **Consultoria:** consultoria, consultor, mentor, mentoria, sdrconsultoria

**Mapeamento Automático:**
- `carreira` → `sdrcarreira`
- `consultoria` → `sdrconsultoria`

---

### 3.1.8 Nó: "3️⃣ Detectar Objetivo"
**ID:** `eefbeadb-4058-4ffc-899b-ded0d5c7fabb`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [1744, -1152] |
| **Propósito** | Versão otimizada do 2️⃣ com validação de source |

**Diferenças do nó anterior:**
1. **Extrai `source`** do canal de mensagem (WhatsApp/Instagram)
2. **Valida opções do GHL** antes de processar
3. **Filtra 'x' das opções** do picklist
4. **Só executa detecção se houver opções válidas** no GHL

**Código JavaScript** (similar ao anterior, com adição de):
```javascript
// Extração de source
let source = (infoNode.source || infoNode.channel || '').toLowerCase();

// Validação de opções
const opcoesObjetivoValidas = (objetivoLeadField?.picklistOptions || [])
  .filter(opt => opt && opt.toLowerCase() !== 'x');
const temOpcoesValidas = opcoesObjetivoValidas.length > 0;

// SÓ DETECTA SE TIVER OPÇÕES VÁLIDAS NO GHL
if (temOpcoesValidas) {
  // ... resto da lógica
}
```

**Output adicional:**
- `source` (whatsapp | instagram)
- `tem_opcoes_validas` (boolean)
- `opcoes_ghl_validas` (array)

---

### 3.1.9 Nó: "Extrair a extensão"
**ID:** `d63d037f-80f8-439a-8e55-598ae916cb78`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [2160, 832] |
| **Propósito** | Detecta extensão de arquivo de áudio para conversão |

**Código JavaScript:**
```javascript
// Coloque isso em um Code node antes do Convert to File
const url = $('Download áudio').first().json.photo_audio || '';
let extension = 'ogg'; // default para WhatsApp

// Tenta extrair extensão da URL
const match = url.match(/\.(\w+)(?:\?|$)/);
if (match) {
  extension = match[1];
}

// Mapeia extensões comuns
const mimeTypes = {
  'ogg': 'audio/ogg',
  'opus': 'audio/ogg',
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'm4a': 'audio/mp4',
  'webm': 'audio/webm'
};

return {
  json: {
    ...$input.first().json,
    fileName: `audio.${extension}`,
    mimeType: mimeTypes[extension] || 'audio/ogg'
  },
  binary: $input.first().binary
};
```

**Lógica:**
1. Extrai extensão da URL por regex
2. Mapeia para MIME type correto
3. Gera nome de arquivo formatado
4. Preserva binary data

**Uso:** Antes de converter áudio para transcrição (Google Speech-to-Text)

---

### 3.1.10 Nó: "Mensagem encavalada?"
**ID:** `0c9429d0-203b-4d6f-9612-05a13060c3e8`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [2592, 400] |
| **Propósito** | **CRÍTICO** - Previne race condition de mensagens simultâneas |

**Código JavaScript:**
```javascript
const ultima_mensagem_da_fila = $('Buscar mensagens').last();
const mensagem_do_workflow = $('Info').first().json.mensagem_id;

// Parsear o JSON string
let last_db = null;
try {
  last_db = JSON.parse(ultima_mensagem_da_fila.json.last_db_message);
} catch(e) {
  last_db = null;
}

if (last_db && last_db.id_mensagem !== mensagem_do_workflow) {
  // Mensagem encavalada, para o workflow
  return [];
}

// Pass-through da fila de mensagens
return $('Buscar mensagens').all();
```

**Lógica:**
1. Compara última mensagem da fila (DB) com mensagem do workflow atual
2. Se IDs não batem → **PARA EXECUÇÃO** (return [])
3. Se batem → pass-through das mensagens

**Previne:** Processamento paralelo de mensagens do mesmo lead causando respostas duplicadas ou fora de ordem

**CRÍTICO:** Este nó é essencial para estabilidade do fluxo em produção

---

### 3.1.11 Nó: "Preparar Mensagem"
**ID:** `83d94181-776a-43e5-bb20-d54c65d8b7f5`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [4416, 384] |
| **Propósito** | Formata mensagem do lead para padrão Langchain (JSONB) |

**Código JavaScript:**
```javascript
// Sanitiza a mensagem e constrói o objeto corretamente
const info = $('Info').first().json;
const mensagem = info.mensagem || '';

// Sanitiza quebras de linha
const mensagemLimpa = mensagem
  .trim()
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n');

// Retorna o OBJETO diretamente
return [{
  json: {
    lead_id: info.lead_id,
    session_id: info.lead_id,
    message: {
      type: "human",
      content: mensagemLimpa,
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      invalid_tool_calls: []
    }
  }
}];
```

**Estrutura Langchain:**
```json
{
  "type": "human",
  "content": "texto da mensagem",
  "tool_calls": [],
  "additional_kwargs": {},
  "response_metadata": {},
  "invalid_tool_calls": []
}
```

**Uso:** Inserção na tabela `n8n_historico_mensagens` (coluna `message` JSONB)

---

### 3.1.12 Nó: "Deduplica Mensagens"
**ID:** `d274f5c1-94fb-4dbf-ba77-e83025bc6f0f`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [4848, 384] |
| **Propósito** | Remove duplicatas do histórico usando timestamp + conteúdo |

**Código JavaScript Completo:**
```javascript
// Pega o item de entrada
const inputItems = $input.all();

// Processa cada item
const outputItems = inputItems.map((inputItem, index) => {
  // Pega os dados do nó Info
  const infoData = $('Info').first().json;

  // ===== CRÍTICO: Com returnAll, Postgres retorna múltiplos items =====
  // Precisamos pegar TODOS os items, não só o último
  const allMessages = $('Mensagem anteriores').all();

  console.log(`Total de items do Postgres: ${allMessages.length}`);

  // Transforma todos os items em um array de mensagens
  const msgArray = allMessages
    .map(item => item.json)
    .filter(item => {
      return item && item.created_at && item.message && item.message.content;
    });

  console.log(`Total de mensagens válidas: ${msgArray.length}`);

  // Adiciona a mensagem ATUAL do lead ao histórico
  const mensagemAtual = infoData.mensagem;
  if (mensagemAtual && mensagemAtual.trim()) {
    msgArray.push({
      created_at: new Date().toISOString(),
      message: {
        type: "human",
        content: mensagemAtual
      }
    });
  }

  console.log(`Total com mensagem atual: ${msgArray.length}`);

  // Deduplica por timestamp + conteúdo
  const seen = new Map();
  const unique = msgArray.filter(item => {
    // Cria chave única baseada em timestamp e conteúdo
    const timestamp = new Date(item.created_at).getTime();
    const content = item.message?.content || '';
    const key = `${timestamp}_${content.substring(0, 100)}`;

    // Se já viu essa chave, ignora
    if (seen.has(key)) {
      console.log(`Duplicata encontrada: ${content.substring(0, 50)}...`);
      return false;
    }

    seen.set(key, true);
    return true;
  });

  console.log(`Mensagens após deduplicação: ${unique.length}`);

  // Formata as mensagens em ordem cronológica
  const mensagens_antigas = unique
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(item => {
      const prefix = item.message.type === "human" ? "Lead/Humano" : "Assistente/IA";
      const content = item.message.type === "human" && item.message.content.includes("Responda")
        ? "[ Lead não respondeu ainda... ]"
        : item.message.content;
      return `[${item.created_at}] ${prefix}: ${content}`;
    })
    .join("\n\n");

  console.log(`Histórico formatado com ${mensagens_antigas.split('\n\n').length} mensagens`);

  // Retorna mantendo o pairedItem
  return {
    json: {
      mensagens_antigas: mensagens_antigas,
      mensagens_count: unique.length,
      ...inputItem.json,
      ...infoData
    },
    pairedItem: inputItem.pairedItem
  };
});

return outputItems;
```

**Algoritmo de Deduplicação:**
1. Cria chave: `timestamp_primeiros100chars`
2. Usa Map para tracking (O(1) lookup)
3. Filtra duplicatas
4. Ordena cronologicamente
5. Formata para IA

**Formato de Saída:**
```
[2024-12-31T10:00:00Z] Lead/Humano: Olá, tenho interesse...

[2024-12-31T10:01:00Z] Assistente/IA: Olá! Como posso ajudar...
```

**CRÍTICO:** Este nó resolve problema de mensagens duplicadas que causava respostas repetitivas da IA

---

### 3.1.13 Nó: "Code in JavaScript2"
**ID:** `652cfa81-36ca-4a54-9752-b2a51205df53`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [7280, 368] |
| **Propósito** | Calcula custo estimado de Gemini 2.5 Pro |

**Código JavaScript:**
```javascript
const data = $input.first().json;
const outputText = data.output || '';

// ========================================
// ESTIMATIVA DE TOKENS - CALIBRADO v2
// ========================================

// Completion: 3.4 chars por token
const CHARS_POR_TOKEN_OUTPUT = 3.4;

// Prompt: calibrado com média dos seus dados reais
// 9922, 9962, 10042 -> média ~9975, arredondando pra 10050
const PROMPT_TOKENS_BASE = 10050;

// Calcular completion tokens
const completionTokens = Math.ceil(outputText.length / CHARS_POR_TOKEN_OUTPUT);

const promptTokens = PROMPT_TOKENS_BASE;
const totalTokens = promptTokens + completionTokens;

// ========================================
// CÁLCULO DE CUSTO - Gemini 2.5 Pro
// ========================================
const PRECO_INPUT = 1.25;
const PRECO_OUTPUT = 5.00;

const custoInput = (promptTokens / 1000000) * PRECO_INPUT;
const custoOutput = (completionTokens / 1000000) * PRECO_OUTPUT;
const custoTotal = custoInput + custoOutput;

return {
  json: {
    output: outputText,
    tokenUsage: {
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      totalTokens: totalTokens,
      metodo: 'estimativa'
    },
    custo_llm: {
      modelo: 'gemini-2.5-pro',
      tokens_input: promptTokens,
      tokens_output: completionTokens,
      tokens_total: totalTokens,
      custo_usd: parseFloat(custoTotal.toFixed(6)),
      custo_brl: parseFloat((custoTotal * 6).toFixed(4)),
      tipo: 'estimado'
    }
  }
};
```

**Parâmetros Calibrados:**
- **Prompt fixo:** 10050 tokens (média real: 9922, 9962, 10042)
- **Output:** 3.4 chars/token
- **Preço input:** $1.25 / 1M tokens
- **Preço output:** $5.00 / 1M tokens

**Fórmula:**
```
Custo = (10050/1M × 1.25) + (output_chars/3.4/1M × 5.00)
```

---

### 3.1.14 Nó: "Calcular Custo LLM"
**ID:** `984d5b6e-e8f2-48ab-b0c6-c1143f678507`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [9024, 320] |
| **Propósito** | Calcula custo COMBINADO de Gemini Pro + Flash |

**Código JavaScript (resumido):**
```javascript
const data = $input.first().json;

let outputText = '';
if (typeof data.output === 'string') {
  outputText = data.output;
} else if (data.output?.messages?.[0]) {
  outputText = data.output.messages[0];
} else if (data.output) {
  outputText = JSON.stringify(data.output);
}

// ========================================
// GEMINI 2.5 PRO (Agente principal)
// ========================================
const PRO_PROMPT_TOKENS = 10050;
const PRO_CHARS_POR_TOKEN = 3.4;
const PRO_PRECO_INPUT = 1.25;
const PRO_PRECO_OUTPUT = 5.00;

const proCompletionTokens = Math.ceil(outputText.length / PRO_CHARS_POR_TOKEN);
const proCustoInput = (PRO_PROMPT_TOKENS / 1000000) * PRO_PRECO_INPUT;
const proCustoOutput = (proCompletionTokens / 1000000) * PRO_PRECO_OUTPUT;
const proCustoTotal = proCustoInput + proCustoOutput;

// ========================================
// GEMINI 2.5 FLASH (Tool de chat)
// ========================================
const FLASH_PROMPT_TOKENS = 553;
const FLASH_CHARS_POR_TOKEN = 1.6;
const FLASH_PRECO_INPUT = 0.15;
const FLASH_PRECO_OUTPUT = 0.60;

const flashCompletionTokens = Math.ceil(outputText.length / FLASH_CHARS_POR_TOKEN);
const flashCustoInput = (FLASH_PROMPT_TOKENS / 1000000) * FLASH_PRECO_INPUT;
const flashCustoOutput = (flashCompletionTokens / 1000000) * FLASH_PRECO_OUTPUT;
const flashCustoTotal = flashCustoInput + flashCustoOutput;

// ========================================
// TOTAL COMBINADO
// ========================================
const custoTotalUSD = proCustoTotal + flashCustoTotal;
const custoTotalBRL = custoTotalUSD * 6;

return {
  json: {
    output: outputText,
    custo_pro: {
      modelo: 'gemini-2.5-pro',
      tokens_input: PRO_PROMPT_TOKENS,
      tokens_output: proCompletionTokens,
      custo_usd: parseFloat(proCustoTotal.toFixed(6))
    },
    custo_flash: {
      modelo: 'gemini-2.5-flash',
      tokens_input: FLASH_PROMPT_TOKENS,
      tokens_output: flashCompletionTokens,
      custo_usd: parseFloat(flashCustoTotal.toFixed(6))
    },
    custo_total: {
      custo_usd: parseFloat(custoTotalUSD.toFixed(6)),
      custo_brl: parseFloat(custoTotalBRL.toFixed(4)),
      tipo: 'estimado'
    }
  }
};
```

**Diferença do anterior:**
- Calcula **2 modelos** (Pro + Flash)
- Flash usado para tool `send_message_to_contact`
- Retorna breakdown detalhado por modelo

---

### 3.1.15 Nó: "Preparar Execução + Identificar Contexto"
**ID:** `a8c6ff15-2dbf-44d3-b217-ea8b38592efa`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.code |
| **TypeVersion** | 2 |
| **Posição** | [5520, 384] |
| **Propósito** | **MOTOR DE HIPERPERSONALIZAÇÃO** - Gera contexto dinâmico |

**Código JavaScript** (mais de 200 linhas - resumo):

**DATABASES INLINE:**
```javascript
const DDD_DATABASE = {
  '11': { cidade: 'São Paulo', cultura: 'objetiva', ritmo: 'acelerado' },
  '21': { cidade: 'Rio de Janeiro', cultura: 'descontraída', ritmo: 'moderado' },
  // ... 10 DDDs mapeados
};

const SETOR_DATABASE = {
  'saude': { analogias: ['diagnóstico', 'tratamento'], tom: 'consultivo e empático' },
  'tech': { analogias: ['deploy', 'sprint', 'escalar'], tom: 'técnico mas acessível' },
  // ... 10 setores mapeados
};

const PORTE_DATABASE = {
  'micro': { abordagem: 'direta ao ponto, foco em ROI imediato' },
  'grande': { abordagem: 'institucional, foco em case' },
  // ... 4 portes mapeados
};

const CARGO_DATABASE = {
  'ceo': { interesses: ['visão estratégica', 'ROI'], decisor: true },
  'gerente': { interesses: ['operação', 'equipe'], decisor: 'influenciador' },
  // ... 6 cargos mapeados
};
```

**Função Geradora:**
```javascript
function gerarContextoHiperpersonalizado(hp, businessCtx) {
  const ddd = hp.ddd || 'default';
  const setor = hp.setor || businessCtx?.setor || 'default';
  const porte = hp.porte || 'default';
  const cargo = hp.cargo_decisor || 'default';

  const dddInfo = DDD_DATABASE[ddd] || DDD_DATABASE['default'];
  const setorInfo = SETOR_DATABASE[setor] || SETOR_DATABASE['default'];
  const porteInfo = PORTE_DATABASE[porte] || PORTE_DATABASE['default'];
  const cargoInfo = CARGO_DATABASE[cargo] || CARGO_DATABASE['default'];

  let contextoHiper = `## HIPERPERSONALIZAÇÃO ATIVA\n\n`;

  // Contexto Geográfico
  if (ddd !== 'default') {
    contextoHiper += `### Contexto Regional (${dddInfo.cidade})\n`;
    contextoHiper += `- Cultura: ${dddInfo.cultura}\n`;
    contextoHiper += `- Ritmo: ${dddInfo.ritmo}\n\n`;
  }

  // Contexto de Negócio
  if (setor !== 'default') {
    contextoHiper += `### Contexto do Setor (${setor})\n`;
    contextoHiper += `- Use analogias: ${setorInfo.analogias.join(', ')}\n`;
    contextoHiper += `- Tom recomendado: ${setorInfo.tom}\n\n`;
  }

  // ... continua para porte e cargo

  return contextoHiper;
}
```

**Identificação de Contexto (Modo):**
```javascript
// Lê o campo agente_ia que vem do GHL
const agenteIaDoGHL = webhook.agente_ia || webhook.customFields?.agente_ia || '';

// Valida se existe prompt para este modo
let contexto = agenteIaDoGHL;
if (!contexto || !promptsPorModo[contexto]) {
  contexto = promptsPorModo['first_contact'] ? 'first_contact' : Object.keys(promptsPorModo)[0];
}

// Pega o prompt dinâmico do modo atual
const promptDinamico = promptsPorModo[contexto] || '';
```

**Output Exemplo:**
```markdown
## HIPERPERSONALIZAÇÃO ATIVA

### Contexto Regional (São Paulo/SP)
- Cultura: objetiva
- Ritmo: acelerado
- Formalidade: baixa
- Expressões regionais permitidas: mano, firmeza

### Contexto do Setor (tech)
- Use analogias: deploy, sprint, escalar, automatizar
- Linguagem do setor: usuário, plataforma, feature
- Tom recomendado: técnico mas acessível

### Contexto de Porte (pequena)
- Características: estrutura básica, crescimento
- Abordagem: consultiva, mostrar como escalar
- Gatilhos eficazes: crescimento, profissionalização

### Contexto do Decisor (ceo)
- Interesses: visão estratégica, ROI, crescimento
- Abordagem: objetiva, big picture, números de impacto
- É decisor: true
```

**Dados Retornados:**
- `contexto_hiperpersonalizado` (markdown)
- `prompt_dinamico` (do modo atual)
- `modo_atual` (first_contact | sdrcarreira | sdrconsultoria | etc)
- `modo_solicitado_ghl` (log do input)
- `business_context`, `compliance_rules`, `personality_config`

**CRÍTICO:** Este é o nó mais complexo do fluxo. Ele:
1. Parse configs do agente (JSON strings)
2. Valida modo solicitado pelo GHL
3. Gera contexto hiperpersonalizado dinâmico
4. Injeta no prompt da IA

---

## 3.2 NÓS SET (FIELD MAPPING)

### 3.2.1 Nó: "GetInfo"
**ID:** `14dc08c9-6f5e-4429-a868-ca28b454e0d2`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [1840, 0] |
| **Always Output Data** | true |
| **On Error** | continueRegularOutput |

**Mapeamento de Campos:**
| Nome do Campo | Valor | Tipo |
|---------------|-------|------|
| `dados` | `{{ $execution.id }},{{ $workflow.id }},{{ $workflow.name }},1,1.99,{{ $execution.mode }},running,cmcprclas0000syak01gtgj80` | string |
| `session` | `etapa,{{ $('Info').first().json.etapa_funil \|\| 'NULL' }},{{ $execution.id }},{{ $('Info').first().json.lead_id}},{{ !$('Info').first().json.n8n_ativo === false }},{{ $('Info').first().json.mensagem_id \|\| 'NULL' }},{{ $('Info').first().json.api_key \|\| 'NULL' }},{{ $json.contact.locationId \|\| NULL }},{{ $('Info').first().json.source \|\| 'whatsapp' }}` | string |

**Propósito:**
- Prepara dados para `Salvar registro de Atividade` (alan/marcos)
- Campo `dados`: métricas de execução (CSV)
- Campo `session`: tracking de etapas do funil (CSV)

**Formato CSV:**
```
dados: execution_id,workflow_id,workflow_name,versao,n8n_version,mode,status,owner_id
session: campo,etapa_funil,execution_id,lead_id,ativo,mensagem_id,api_key,location_id,source
```

---

### 3.2.2 Nó: "Form Mensagem"
**ID:** `61f04e47-7359-4fe8-9a9c-abb250585369`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [2368, 400] |

**Mapeamento de Campos:**
| Nome do Campo | Valor | Tipo |
|---------------|-------|------|
| `last_db_message` | `{{ $input.last().json }}` | string |
| `current_message` | `{{ $('Info').first().json.mensagem_id }}` | string |

**Propósito:**
- Formata dados para validação de "Mensagem encavalada?"
- Compara última mensagem do DB com mensagem atual

---

### 3.2.3 Nó: "Imagem ou audio"
**ID:** `5ebe40bf-dec2-4b59-898e-1320f7a3ac44`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [2832, 592] |

**Mapeamento de Campos:**
| Nome do Campo | Valor | Tipo |
|---------------|-------|------|
| `imagem` | `{{ $json.content[0].text ? "[Imagem Recebida]: "+ $json.content[0].text : ""}}` | string |
| `audio:` | `{{ $json.text ? "[Audio Recebido]: "+ $json.text : ""}}` | string |

**Propósito:**
- Extrai texto transcrito de imagem (OCR do Google Vision)
- Extrai texto transcrito de áudio (Google Speech-to-Text)
- Formata com prefixo identificador para IA

**Uso em Set mensagens:**
```javascript
// Se mensagem vazia ou genérica, substitui por transcrição
['arquivo de imagem', 'arquivo de áudio', 'mensagem de áudio'].includes($json.mensagem.toLowerCase())
  ? ($('Imagem ou audio').first().json['audio:'] || $('Imagem ou audio').first().json.imagem)
  : $json.mensagem
```

---

### 3.2.4 Nó: "Set mensagens"
**ID:** `1b77c714-71be-4b8d-ad31-055fcf1df9e4`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [5072, 384] |
| **Execute Once** | true |

**Mapeamento de Campos:**
| Nome do Campo | Valor (Expressão n8n) | Tipo |
|---------------|------------------------|------|
| `mensagem` | `{{ ['arquivo de imagem', 'arquivo de áudio', 'mensagem de áudio', ''].includes(($json.mensagem \|\| '').toLowerCase().trim()) ? ($('Imagem ou audio').first().json['audio:'] \|\| $('Imagem ou audio').first().json.imagem \|\| $('Info').first().json.mensagem \|\| '') : ($json.mensagem \|\| $('Info').first().json.mensagem \|\| '') }}` | string |
| `output_preview` | `{{ $json.output_preview }}` | string |
| `mensagens_antigas` | `{{ $('Mensagem anteriores').all().map(item => { const prefix = item.json.message.type === "human" ? "Lead/Humano" : "Assistente/IA"; const content = item.json.message.type === "human" && item.json.message.content.includes("Responda") ? "[ Lead não respondeu ainda... ]" : item.json.message.content; return \`[${item.json.created_at}] ${prefix}: ${content}\`; }).join("\\n\\n") }}` | string |
| `location_id` | `{{ $('Info').first().json.location_id }}` | string |

**Lógica Complexa do Campo `mensagem`:**
1. Se mensagem for genérica ("arquivo de imagem", "mensagem de áudio", vazio)
2. Substitui por transcrição de áudio OU imagem
3. Senão, usa mensagem original

**Lógica do Campo `mensagens_antigas`:**
1. Mapeia todos os items de `Mensagem anteriores`
2. Formata: `[timestamp] Lead/IA: conteúdo`
3. Se humano + contém "Responda" → `[ Lead não respondeu ainda... ]`
4. Join com `\n\n`

**NOTA:** Este nó foi **substituído** pelo Code "Deduplica Mensagens" para resolver problema de duplicatas

---

### 3.2.5 Nó: "Edit Fields1"
**ID:** `cef4e0d4-6b24-40e7-9d2d-9327d4d569a3`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [1424, -224] |

**Mapeamento de Campos:**
| Nome do Campo | Valor | Tipo |
|---------------|-------|------|
| `lead_id` | `{{ $('Info').first().json.lead_id }}` | string |
| `mensagem` | `{{ $('Info').first().json.mensagem }}` | string |
| `datetime` | `{{ $('Info').first().json.datetime }}` | string |
| `source` | `{{ $('Info').first().json.source }}` | string |
| `full_name` | `{{ $('Info').item.json.full_name }}` | string |
| `api_key` | `{{ $json.api_key }}` | string |
| `location.id` | `{{ $json.location.id }}` | string |

**Propósito:**
- Prepara dados para `historico_mensagens_leads` (Postgres)
- Seleciona apenas campos necessários do nó Info

---

### 3.2.6 Nó: "Edit Fields"
**ID:** `4e81f664-f606-4f1d-b5d2-19af31a16690`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [1680, -528] |

**Mapeamento de Campos:**
| Nome do Campo | Valor | Tipo |
|---------------|-------|------|
| `conversationId` | `{{ $json.conversationId }}` | string |
| `contactId` | `{{ $json.contactId }}` | string |
| `source` | `{{ $('Info').first().json.source }}` | string |

**Propósito:**
- Pass-through de IDs de conversa extraídos por "Code in JavaScript"
- Adiciona `source` do nó Info

---

### 3.2.7 Nó: "Edit Fields2"
**ID:** `a53eef4d-8a90-4ff4-9be3-107e122fd71c`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [1088, 672] |

**Mapeamento de Campos:**
| Nome do Campo | Valor | Tipo |
|---------------|-------|------|
| `mensagem` | `{{ $('In3fo').item.json.mensagem }}` | string |
| `api_key` | `{{ $('Info').item.json.api_key }}` | string |
| `location_id` | `{{ $('Info').item.json.location_id }}` | string |
| `location_name` | `{{ $('Info').item.json.location_name }}` | string |
| `lead_id` | `{{ $('Info').item.json.lead_id }}` | string |
| `photo_audio` | `{{ $('Info').item.json.photo_audio }}` | string |

**Propósito:**
- Prepara dados para branch de processamento de áudio
- **NOTA:** Referência a `$('In3fo')` parece ser typo (deveria ser `Info`)

---

### 3.2.8 Nó: "Info"
**ID:** `f1d208a5-f05b-45bb-ae27-8ceb310344a1`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.set |
| **TypeVersion** | 3.4 |
| **Posição** | [320, 400] |

**Mapeamento COMPLETO (67 campos!):**

**Campos Principais:**
| Nome | Expressão | Tipo |
|------|-----------|------|
| `mensagem` | `{{ ($json.body?.message?.body \|\| '').trim() \|\| $json.mensagem_contexto \|\| ($json.body?.customData?.message?.split("Instance Source:")[0] ?? $json.body?.message?.content?.text ?? '').trim() }}` | string |
| `source` | `{{ (() => { const messageType = $json.body?.message?.type; if (messageType === 2) return "whatsapp"; if (messageType === 15) return "instagram"; const origin = $json.body?.contact?.attributionSource?.medium; if (origin === "instagram" && messageType !== 2 && messageType !== 20) return "instagram"; return "whatsapp"; })().trim() }}` | string |
| `first_name` | `{{ $json.first_name }}` | string |
| `last_name` | `{{ $json.last_name }}` | string |
| `email` | `{{ $json.body?.email }}` | string |
| `telefone` | `{{ $json.body?.customData?.phone }}` | string |
| `datetime` | `{{ $json.body?.date_created }}` | string |
| `process_id` | `{{ $execution.id }}` | string |
| `owner_id` | `cmcprclas0000syak01gtgj80` | string |
| `lead_id` | `{{ $json.body?.contact_id }}` | string |
| `mensagem_id` | `{{ $json.starttimeMs }}` | string |
| `workflow_id` | `{{ $workflow.id }}` | string |
| `api_key` | `{{ $json.body?.customData?.ghl_api_key }}` | string |
| `location_id` | `{{ $json.body?.location?.id }}` | string |

**Lógica Complexa - Campo `source`:**
```javascript
const messageType = $json.body?.message?.type;
// Type 2 = SMS - responde por SMS (usa "whatsapp" que no workflow envia SMS)
if (messageType === 2) return "whatsapp";
// Type 15 = Instagram DM
if (messageType === 15) return "instagram";
// Fallback: verifica origin
const origin = $json.body?.contact?.attributionSource?.medium;
if (origin === "instagram" && messageType !== 2 && messageType !== 20) return "instagram";
return "whatsapp";
```

**Campos de Contexto:**
- `timezone_do_lead`, `etapa_funil`, `full_name`
- `work_permit`, `state`, `location_name`
- `objetivo_do_lead`, `ativar_ia`, `utm_content`, `agente_ia`

**Campos de Configuração:**
- `calendarID_carreira`, `calendarID_consultoria_financeira`
- `link_do_zoom`, `agendamento_duracao_minutos`
- `cobranca_valor`, `url_asaas`
- `id_conversa_alerta`

**Campos de Enriquecimento:**
- `area_de_atuacao`, `idade`, `instagram`, `modelo_de_atuacao`
- `faturamento_medio`, `investimento`
- `video_ads_url`, `historia_do_usuario`, `usuario_responsavel`

**Campos de Contexto GHL:**
- `event_chat`, `event_is_group`
- `fonte_do_lead_bposs`
- `quebra_de_objecoes_geral`, `quebra_de_objecoes_carreira`, `quebra_de_objecoes_consultoria`
- `tipos_work_permit_permitidos`

**Campos Adicionados Recentemente:**
- `mensagem_contexto` (do nó Contexto UTM)
- `is_primeira_mensagem` (boolean)
- `tipo_lead` (CARREIRA | CONSULTORIA | INVESTIMENTO)
- `tipo_mensagem_original` (texto | audio | imagem | pdf | planilha)

**CRÍTICO:** Este é o nó **CENTRAL** do fluxo. Ele:
1. Normaliza TODOS os dados do webhook GHL
2. Extrai campos de 4 níveis (`body.customData.field`)
3. Detecta canal automaticamente (SMS/Instagram)
4. Mapeia custom fields do GHL
5. Adiciona metadados de execução n8n

---

## 4. FLUXO DE DADOS

### 4.1 Pipeline de Transformação

```
WEBHOOK GHL
   |
   v
[Contexto UTM] ──> is_primeira_mensagem, tipo_lead, mensagem_contexto
   |
   v
[Normalizar Nome1] ──> first_name, last_name, nome_completo, qualidade_nome
   |
   v
[Normalizar Dados1] ──> objetivo_do_lead, agente_ia, ativar_ia
   |
   v
[Code1] ──> starttimeMs, endtimeMs (timestamps)
   |
   v
[Classificar Tipo Mensagem] ──> tipo_mensagem_original (texto|audio|imagem)
   |
   v
[Info] ──> 67 campos normalizados (NÓ CENTRAL)
   |
   +──> [GetInfo] ──> dados, session (para tracking)
   |
   +──> [Buscar mensagens] (Postgres)
   |      |
   |      v
   |    [Form Mensagem] ──> last_db_message, current_message
   |      |
   |      v
   |    [Mensagem encavalada?] ──> VALIDA race condition
   |      |
   |      v (se OK)
   |    [Imagem ou audio] ──> transcrições
   |      |
   |      v
   |    [Preparar Mensagem] ──> formato Langchain
   |      |
   |      v
   |    [Deduplica Mensagens] ──> histórico limpo
   |      |
   |      v
   |    [Buscar Agente Ativo] (Postgres)
   |      |
   |      v
   |    [Preparar Execução + Identificar Contexto] ──> contexto_hiperpersonalizado
   |      |
   |      v
   |    [AI AGENT] ──> executa com hiperpersonalização
   |      |
   |      v
   |    [Code in JavaScript2] ──> custo Gemini Pro
   |      |
   |      v
   |    [Calcular Custo LLM] ──> custo Pro + Flash
   |
   +──> [Branch de Reset]
   |      |
   |      v
   |    [Code in JavaScript] ──> extrai conversationId
   |      |
   |      v
   |    [Edit Fields] ──> prepara dados reset
   |
   +──> [Branch de Detecção de Objetivo]
          |
          v
        [2️⃣ Extrair IDs dos campos]
          |
          v
        [3️⃣ Detectar Objetivo] ──> resultado, especialista_motive
```

### 4.2 Nós com Dependências Críticas

| Nó | Depende de | Tipo de Dependência |
|----|-----------|---------------------|
| **Mensagem encavalada?** | Buscar mensagens | CRÍTICO - previne race condition |
| **Deduplica Mensagens** | Mensagem anteriores | CRÍTICO - remove duplicatas histórico |
| **Set mensagens** | Imagem ou audio | Condicional - transcrição se anexo |
| **Preparar Execução** | Buscar Agente Ativo | CRÍTICO - configs do agente |
| **Calcular Custo LLM** | AI Agent output | Observabilidade - métricas |
| **3️⃣ Detectar Objetivo** | 2️⃣ Extrair IDs | Sequencial - usa IDs extraídos |

### 4.3 Nós com executeOnce

| Nó | Razão |
|----|-------|
| **Set mensagens** | Evita processar múltiplas vezes o histórico |
| **Preparar Mensagem** | Uma mensagem por execução |

### 4.4 Nós com alwaysOutputData

| Nó | Razão |
|----|-------|
| **GetInfo** | Garante dados mesmo sem input |

### 4.5 Nós com onError: continueRegularOutput

| Nó | Razão |
|----|-------|
| **GetInfo** | Não bloquear tracking em caso de erro |

---

## 5. REFERÊNCIA RÁPIDA

### 5.1 Tabela de Nós por Tipo

| Tipo | Quantidade | Nós |
|------|------------|-----|
| **Code** | 15 | Contexto UTM, Normalizar Nome1, Normalizar Dados1, Code1, Classificar Tipo Mensagem, Code in JavaScript, 2️⃣ Extrair IDs, 3️⃣ Detectar Objetivo, Extrair extensão, Mensagem encavalada, Preparar Mensagem, Deduplica Mensagens, Code in JavaScript2, Calcular Custo LLM, Preparar Execução |
| **Set** | 8 | GetInfo, Form Mensagem, Imagem ou audio, Set mensagens, Edit Fields1, Edit Fields, Edit Fields2, Info |

### 5.2 Tabela de Nós por Função

| Função | Nós |
|--------|-----|
| **Normalização** | Contexto UTM, Normalizar Nome1, Normalizar Dados1, Info |
| **Detecção** | Classificar Tipo Mensagem, 2️⃣ Extrair IDs, 3️⃣ Detectar Objetivo, Mensagem encavalada |
| **Preparação** | Preparar Mensagem, Deduplica Mensagens, Preparar Execução |
| **Cálculo** | Code1, Code in JavaScript2, Calcular Custo LLM |
| **Field Mapping** | GetInfo, Form Mensagem, Imagem ou audio, Set mensagens, Edit Fields* |
| **Extração** | Code in JavaScript, Extrair extensão |

### 5.3 Posicionamento dos Nós (Grid)

| Nó | Posição X | Posição Y |
|----|-----------|-----------|
| Contexto UTM | -816 | 400 |
| Normalizar Nome1 | -592 | 400 |
| Normalizar Dados1 | -368 | 400 |
| Code1 | 48 | 400 |
| Classificar Tipo Mensagem | 192 | 400 |
| Info | 320 | 400 |
| Edit Fields2 | 1088 | 672 |
| Edit Fields1 | 1424 | -224 |
| Code in JavaScript | 1456 | -528 |
| 2️⃣ Extrair IDs | 1520 | -1152 |
| Edit Fields | 1680 | -528 |
| 3️⃣ Detectar Objetivo | 1744 | -1152 |
| GetInfo | 1840 | 0 |
| Extrair extensão | 2160 | 832 |
| Form Mensagem | 2368 | 400 |
| Mensagem encavalada | 2592 | 400 |
| Imagem ou audio | 2832 | 592 |
| Preparar Mensagem | 4416 | 384 |
| Deduplica Mensagens | 4848 | 384 |
| Set mensagens | 5072 | 384 |
| Preparar Execução | 5520 | 384 |
| Code in JavaScript2 | 7280 | 368 |
| Calcular Custo LLM | 9024 | 320 |

### 5.4 Nós Code por Complexidade

| Complexidade | Nós | Linhas de Código |
|--------------|-----|------------------|
| **Simples (< 30 linhas)** | Code1, Extrair extensão, Code in JavaScript, Form Mensagem | ~10-25 |
| **Média (30-100 linhas)** | Classificar Tipo Mensagem, Mensagem encavalada, Preparar Mensagem, Code in JavaScript2, Calcular Custo LLM | ~30-80 |
| **Complexa (100-200 linhas)** | Contexto UTM, Normalizar Nome1, Normalizar Dados1, Deduplica Mensagens, 2️⃣ Extrair IDs, 3️⃣ Detectar Objetivo | ~100-180 |
| **Muito Complexa (> 200 linhas)** | Preparar Execução + Identificar Contexto | ~250+ |

### 5.5 Nós Set por Número de Campos

| Nó | Campos Mapeados |
|----|-----------------|
| **Info** | 67 |
| **GetInfo** | 2 |
| **Set mensagens** | 4 |
| **Edit Fields1** | 7 |
| **Edit Fields** | 3 |
| **Edit Fields2** | 6 |
| **Form Mensagem** | 2 |
| **Imagem ou audio** | 2 |

### 5.6 Configurações Especiais

| Nó | Configuração | Valor |
|----|--------------|-------|
| Set mensagens | executeOnce | true |
| GetInfo | alwaysOutputData | true |
| GetInfo | onError | continueRegularOutput |
| Edit Fields2 | Referência | `$('In3fo')` (possível typo) |

### 5.7 Expressões n8n Complexas

**Campo `source` do Info:**
```javascript
{{
  (() => {
    const messageType = $json.body?.message?.type;
    if (messageType === 2) return "whatsapp";
    if (messageType === 15) return "instagram";
    const origin = $json.body?.contact?.attributionSource?.medium;
    if (origin === "instagram" && messageType !== 2 && messageType !== 20) return "instagram";
    return "whatsapp";
  })().trim()
}}
```

**Campo `mensagens_antigas` do Set mensagens:**
```javascript
{{
  $('Mensagem anteriores').all()
    .map(item => {
      const prefix = item.json.message.type === "human" ? "Lead/Humano" : "Assistente/IA";
      const content = item.json.message.type === "human" && item.json.message.content.includes("Responda")
        ? "[ Lead não respondeu ainda... ]"
        : item.json.message.content;
      return `[${item.json.created_at}] ${prefix}: ${content}`;
    })
    .join("\n\n")
}}
```

### 5.8 Databases Inline (Hiperpersonalização)

**DDD_DATABASE:**
- 11 (SP), 21 (RJ), 31 (MG), 41 (PR), 51 (RS), 61 (DF), 71 (BA), 81 (PE), 85 (CE)
- Campos: cidade, estado, cultura, expressoes, ritmo, formalidade

**SETOR_DATABASE:**
- saude, odontologia, juridico, imobiliario, tech, educacao, fitness, estetica, contabilidade, varejo
- Campos: analogias, linguagem, tom

**PORTE_DATABASE:**
- micro, pequena, media, grande
- Campos: caracteristicas, abordagem, gatilhos

**CARGO_DATABASE:**
- ceo, diretor, gerente, coordenador, socio, autonomo
- Campos: interesses, abordagem, decisor

### 5.9 Padrões de Código Comuns

**Normalização de String:**
```javascript
const valor = (campo || '').toLowerCase().trim();
```

**Safe Navigation:**
```javascript
const campo = $json.body?.customData?.field || '';
```

**Fallback em Cadeia:**
```javascript
const mensagem = body.full_name ||
                 ((body.first_name || '') + ' ' + (body.last_name || '')).trim() ||
                 body.customData?.name ||
                 '';
```

**Detecção por Keywords:**
```javascript
const keywords = ['palavra1', 'palavra2'];
const temKeyword = keywords.some(kw => texto.includes(kw));
```

**Formatação de Timestamp:**
```javascript
const timestamp = new Date().toISOString();
const timestampMs = new Date().getTime();
```

### 5.10 Valores Hardcoded Importantes

| Nó | Campo | Valor | Impacto |
|----|-------|-------|---------|
| Info | owner_id | `cmcprclas0000syak01gtgj80` | ID do owner Marcos |
| GetInfo | dados | workflow version `1`, n8n version `1.99` | Métricas |
| Preparar Execução | Conversão BRL | `× 6` | Taxa de câmbio fixa |
| Code in JavaScript2 | Prompt tokens | `10050` | Calibrado com dados reais |
| Calcular Custo LLM | Flash tokens | `553` | Prompt fixo do tool |
| Edit Fields2 | Referência | `In3fo` | Possível typo |

---

## CHANGELOG

| Data | Versão | Descrição |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentação completa dos 23 nós Data Transform do fluxo GHL Mottivme |

---

## RESUMO DE IDS DOS NÓS

### Code Nodes

| Nó | ID |
|----|----|
| Contexto UTM | 8ec83b65-d1ee-44ed-9c6c-518767efaa96 |
| Normalizar Nome1 | 2613bf85-8e78-4ce2-8a5b-4824bd8f62a9 |
| Normalizar Dados1 | 13417ca6-d87d-4026-bc68-428b9d441a65 |
| Code1 | f94f1796-7e0e-41a6-b5b9-dc9bdb08be95 |
| Classificar Tipo Mensagem | 9c3a06ca-329b-4b18-b4f8-01b69685e9fe |
| Code in JavaScript | 995b1e60-b25c-41fb-8d63-bcf7aab0ddc2 |
| 2️⃣ Extrair IDs dos campos | e3cf8233-fe3a-4edc-930a-874c2e44b4da |
| 3️⃣ Detectar Objetivo | eefbeadb-4058-4ffc-899b-ded0d5c7fabb |
| Extrair a extensão | d63d037f-80f8-439a-8e55-598ae916cb78 |
| Mensagem encavalada? | 0c9429d0-203b-4d6f-9612-05a13060c3e8 |
| Preparar Mensagem | 83d94181-776a-43e5-bb20-d54c65d8b7f5 |
| Deduplica Mensagens | d274f5c1-94fb-4dbf-ba77-e83025bc6f0f |
| Code in JavaScript2 | 652cfa81-36ca-4a54-9752-b2a51205df53 |
| Calcular Custo LLM | 984d5b6e-e8f2-48ab-b0c6-c1143f678507 |
| Preparar Execução + Identificar Contexto | a8c6ff15-2dbf-44d3-b217-ea8b38592efa |

### Set Nodes

| Nó | ID |
|----|----|
| GetInfo | 14dc08c9-6f5e-4429-a868-ca28b454e0d2 |
| Form Mensagem | 61f04e47-7359-4fe8-9a9c-abb250585369 |
| Imagem ou audio | 5ebe40bf-dec2-4b59-898e-1320f7a3ac44 |
| Set mensagens | 1b77c714-71be-4b8d-ad31-055fcf1df9e4 |
| Edit Fields1 | cef4e0d4-6b24-40e7-9d2d-9327d4d569a3 |
| Edit Fields | 4e81f664-f606-4f1d-b5d2-19af31a16690 |
| Edit Fields2 | a53eef4d-8a90-4ff4-9be3-107e122fd71c |
| Info | f1d208a5-f05b-45bb-ae27-8ceb310344a1 |

---

*Documento gerado para escalabilidade da operação BPO Mottivme Sales - AI Factory V3*
