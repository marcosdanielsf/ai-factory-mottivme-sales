# PROMPT PARA CLAUDE BROWSER - IMPLEMENTAR FIX ANTI-ALUCINAÇÃO

**Copie todo este documento e cole no Claude Browser para implementação**

---

## CONTEXTO DO PROBLEMA

Tenho um workflow n8n chamado "AI Factory v3" que processa transcrições de calls de kickoff e gera configurações de agentes de IA.

**PROBLEMA IDENTIFICADO:**
O nó "1.7 AI - Analisar Kickoff (GHL Architect V2)" usando Groq Llama 3.3 70B recebeu dados do cliente "Dr Luiz e Mariana Carvalho Giareta" mas **ALOCINOU** e gerou dados para "Dra. Eline Lobo" - um cliente que NÃO estava na transcrição.

**CAUSA:** Alucinação do LLM - o modelo "inventou" dados de outro cliente possivelmente visto em treinamento ou execuções anteriores.

---

## O QUE PRECISO QUE VOCÊ FAÇA

### TAREFA 1: Modificar o System Message do nó 1.7

No arquivo JSON do workflow, encontre o nó com nome "1.7 AI - Analisar Kickoff (GHL Architect V2)" e adicione este texto NO INÍCIO do campo `systemMessage`:

```
## ⚠️ REGRAS CRÍTICAS ANTI-ALUCINAÇÃO (LER PRIMEIRO!)

### CLIENTE ATUAL - DADOS OBRIGATÓRIOS
VOCÊ ESTÁ ANALISANDO EXCLUSIVAMENTE O CLIENTE: {{ $json.nome_lead }}
TELEFONE DO CLIENTE: {{ $json.telefone_lead }}

### REGRA ABSOLUTA #1: ANCORAGEM DO NOME
O campo "nome_negocio" no seu output JSON DEVE ser:
- EXATAMENTE "{{ $json.nome_lead }}" OU
- Um nome extraído DIRETAMENTE e LITERALMENTE da transcrição abaixo

### REGRA ABSOLUTA #2: PROIBIÇÕES
❌ NUNCA use nomes que você "conhece" de outros contextos
❌ NUNCA invente nomes como "Dra. Eline Lobo", "Dr. João Silva", "Clínica XYZ" que NÃO estão na transcrição
❌ NUNCA use dados de exemplos, few-shots ou treinamento para o nome_negocio
❌ NUNCA "adivinhe" o nome do negócio - extraia APENAS do texto

### REGRA ABSOLUTA #3: VERIFICAÇÃO ANTES DE RESPONDER
Antes de gerar seu JSON, faça esta verificação mental:
1. ✓ O nome_negocio que vou usar aparece na transcrição fornecida?
2. ✓ O nome_negocio corresponde ou deriva de "{{ $json.nome_lead }}"?
3. ✓ Eu NÃO estou usando informações de outros clientes/contextos?

SE QUALQUER VERIFICAÇÃO FALHAR → Use "{{ $json.nome_lead }}" como nome_negocio.

### REGRA ABSOLUTA #4: VALIDAÇÃO DO OUTPUT
Seu JSON de output será REJEITADO se:
- nome_negocio contiver "Eline Lobo" quando input for outro cliente
- nome_negocio não tiver NENHUMA relação com o nome_lead do input
- nome_negocio for um nome "famoso" que não está na transcrição

---

```

### TAREFA 2: Modificar o User Message (text/prompt) do nó 1.7

No mesmo nó, encontre o campo `text` (que contém o prompt do usuário) e adicione este texto NO INÍCIO:

```
## 🎯 DADOS OBRIGATÓRIOS DO CLIENTE ATUAL

| Campo | Valor (USE EXATAMENTE ESTE) |
|-------|----------------------------|
| **NOME DO CLIENTE** | {{ $json.nome_lead }} |
| **TELEFONE** | {{ $json.telefone_lead }} |
| **CONTACT ID** | {{ $json.contact_id }} |

⚠️ **ATENÇÃO CRÍTICA:**
O agente que você criar é para "{{ $json.nome_lead }}".
O nome_negocio no seu JSON DEVE ser "{{ $json.nome_lead }}" ou extraído da transcrição abaixo.
NUNCA use nomes de outros clientes como "Dra. Eline Lobo".

---

```

### TAREFA 3: Criar novo nó 1.8 - Validar Alucinação

Adicionar um novo nó do tipo "Code" (n8n-nodes-base.code) entre o nó 1.7 e o nó 2.1.

**Configuração do nó:**
- **Name:** "1.8 Validar Alucinação"
- **Type:** n8n-nodes-base.code
- **typeVersion:** 2

**Código JavaScript do nó:**

```javascript
// =====================================================
// NÓ 1.8 - VALIDAR OUTPUT E CORRIGIR ALUCINAÇÕES
// Detecta quando a IA "inventou" dados de outro cliente
// =====================================================

const dadosInput = $('1.6 Preparar Dados').item.json;
const respostaIA = $input.first().json;

// Dados esperados do cliente real
const nomeLeadEsperado = dadosInput.nome_lead || '';
const telefoneEsperado = dadosInput.telefone_lead || '';
const textoTranscricao = dadosInput.texto_transcricao || '';

// Output da IA
let outputText = respostaIA.output || respostaIA.text || '';

// ========== LISTA DE CLIENTES CONHECIDOS (ANTI-ALUCINAÇÃO) ==========
// Nomes que a IA NÃO deveria inventar para outros clientes
const CLIENTES_CONHECIDOS = [
  'Dra. Eline Lobo',
  'Eline Lobo',
  'Dra Eline',
  'Clínica da Dra. Eline',
  'Clínica Eline Lobo',
  'Dr. João Silva',
  'Clínica Premium',
  'Dra. Maria',
  'Dr. Carlos',
  // Adicionar mais conforme detectar alucinações
];

// ========== FUNÇÕES AUXILIARES ==========

function extrairCampoJSON(texto, campo) {
  try {
    const regex = new RegExp(`"${campo}"\\s*:\\s*"([^"]+)"`, 'i');
    const match = texto.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

function substituirCampoJSON(texto, campo, novoValor) {
  try {
    const regex = new RegExp(`("${campo}"\\s*:\\s*)"([^"]+)"`, 'gi');
    return texto.replace(regex, `$1"${novoValor}"`);
  } catch (e) {
    return texto;
  }
}

function normalizarNome(nome) {
  return (nome || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function calcularSimilaridade(str1, str2) {
  const s1 = normalizarNome(str1);
  const s2 = normalizarNome(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const palavras1 = s1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = s2.split(/\s+/).filter(p => p.length > 2);

  if (palavras1.length === 0 || palavras2.length === 0) return 0;

  let comuns = 0;
  for (const p1 of palavras1) {
    if (palavras2.some(p2 => p2.includes(p1) || p1.includes(p2))) {
      comuns++;
    }
  }

  return comuns / Math.max(palavras1.length, palavras2.length);
}

// ========== VALIDAÇÃO PRINCIPAL ==========

const validacao = {
  passou: true,
  alertas: [],
  correcoes: [],
  alucinacao_detectada: false,
  nome_ia: null,
  nome_esperado: nomeLeadEsperado,
  similaridade: 0
};

// 1. Extrair nome_negocio do output da IA
const nomeNegocioIA = extrairCampoJSON(outputText, 'nome_negocio');
validacao.nome_ia = nomeNegocioIA;

if (nomeNegocioIA) {

  // 2. Verificar se é um nome de OUTRO cliente (alucinação clara)
  for (const clienteConhecido of CLIENTES_CONHECIDOS) {
    const nomeNormalizado = normalizarNome(nomeNegocioIA);
    const clienteNormalizado = normalizarNome(clienteConhecido);

    if (nomeNormalizado.includes(clienteNormalizado) || clienteNormalizado.includes(nomeNormalizado)) {
      // Verificar se não é realmente o cliente atual
      const leadNormalizado = normalizarNome(nomeLeadEsperado);
      if (!leadNormalizado.includes(clienteNormalizado) && !clienteNormalizado.includes(leadNormalizado)) {
        validacao.alucinacao_detectada = true;
        validacao.passou = false;
        validacao.alertas.push({
          tipo: 'ALUCINACAO_CRITICA',
          mensagem: `IA gerou "${nomeNegocioIA}" mas cliente real é "${nomeLeadEsperado}"`,
          cliente_inventado: nomeNegocioIA,
          cliente_real: nomeLeadEsperado,
          timestamp: new Date().toISOString()
        });

        // CORRIGIR automaticamente
        outputText = substituirCampoJSON(outputText, 'nome_negocio', nomeLeadEsperado);
        validacao.correcoes.push({
          campo: 'nome_negocio',
          valor_errado: nomeNegocioIA,
          valor_corrigido: nomeLeadEsperado,
          motivo: 'Alucinação detectada - nome de outro cliente'
        });

        break;
      }
    }
  }

  // 3. Verificar similaridade entre nome da IA e nome esperado
  if (!validacao.alucinacao_detectada) {
    validacao.similaridade = calcularSimilaridade(nomeNegocioIA, nomeLeadEsperado);

    if (validacao.similaridade < 0.15) {
      // Nomes muito diferentes - possível alucinação
      validacao.alertas.push({
        tipo: 'BAIXA_SIMILARIDADE',
        mensagem: `Nome da IA "${nomeNegocioIA}" tem similaridade ${(validacao.similaridade * 100).toFixed(1)}% com "${nomeLeadEsperado}"`,
        similaridade: validacao.similaridade
      });

      // Verificar se nome da IA aparece na transcrição
      const transcricaoNormalizada = normalizarNome(textoTranscricao);
      const nomeParcial = normalizarNome(nomeNegocioIA).substring(0, 15);
      const nomeNaTranscricao = transcricaoNormalizada.includes(nomeParcial);

      if (!nomeNaTranscricao) {
        validacao.alucinacao_detectada = true;
        validacao.passou = false;
        validacao.alertas.push({
          tipo: 'NOME_NAO_NA_TRANSCRICAO',
          mensagem: `"${nomeNegocioIA}" não aparece na transcrição - provável alucinação`,
          acao: 'Corrigido automaticamente para nome do input'
        });

        // CORRIGIR automaticamente
        outputText = substituirCampoJSON(outputText, 'nome_negocio', nomeLeadEsperado);
        validacao.correcoes.push({
          campo: 'nome_negocio',
          valor_errado: nomeNegocioIA,
          valor_corrigido: nomeLeadEsperado,
          motivo: 'Nome não encontrado na transcrição'
        });
      }
    }
  }
}

// 4. Se houve alucinação, alertar sobre outros campos que podem estar contaminados
if (validacao.alucinacao_detectada) {
  const nomeAgente = extrairCampoJSON(outputText, 'nome_agente');
  if (nomeAgente) {
    validacao.alertas.push({
      tipo: 'VERIFICAR_MANUALMENTE',
      mensagem: `Após correção, verificar se nome_agente "${nomeAgente}" ainda faz sentido`,
      campo: 'nome_agente',
      valor: nomeAgente,
      sugestao: 'Pode manter ou gerar novo nome apropriado'
    });
  }
}

// ========== LOG PARA MONITORAMENTO ==========
console.log('\n========== VALIDAÇÃO ANTI-ALUCINAÇÃO ==========');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Cliente esperado: "${nomeLeadEsperado}"`);
console.log(`Nome gerado pela IA: "${nomeNegocioIA}"`);
console.log(`Similaridade: ${(validacao.similaridade * 100).toFixed(1)}%`);
console.log(`Alucinação detectada: ${validacao.alucinacao_detectada ? '⚠️ SIM' : '✅ NÃO'}`);
console.log(`Correções aplicadas: ${validacao.correcoes.length}`);

if (validacao.alertas.length > 0) {
  console.log('\n📋 Alertas:');
  validacao.alertas.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.tipo}] ${a.mensagem}`);
  });
}

if (validacao.correcoes.length > 0) {
  console.log('\n🔧 Correções:');
  validacao.correcoes.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.campo}: "${c.valor_errado}" → "${c.valor_corrigido}"`);
  });
}
console.log('================================================\n');

// ========== RETORNO ==========
return [{
  json: {
    ...respostaIA,
    output: outputText,
    _validacao_alucinacao: validacao,
    _dados_input: {
      nome_lead: nomeLeadEsperado,
      telefone: telefoneEsperado
    },
    _processado_em: new Date().toISOString()
  }
}];
```

### TAREFA 4: Ajustar conexões do workflow

1. Desconectar a saída do nó 1.7 do nó 2.1
2. Conectar saída do nó 1.7 → entrada do novo nó 1.8
3. Conectar saída do nó 1.8 → entrada do nó 2.1

### TAREFA 5: Reduzir temperature do modelo

No nó "Groq Llama 3.3 70B" (que está conectado ao nó 1.7), alterar:
- `temperature`: de `0.3` para `0.1`

Isso reduz a "criatividade" do modelo e diminui alucinações.

---

## ESTRUTURA DO WORKFLOW APÓS CORREÇÃO

```
1.6 Preparar Dados
      ↓
1.7 AI - Analisar Kickoff (COM PATCHES anti-alucinação no prompt)
      ↓
[NOVO] 1.8 Validar Alucinação (detecta e corrige automaticamente)
      ↓
2.1 Processar Análise + Hiperpersonalização
      ↓
... (resto do workflow)
```

---

## ARQUIVO JSON DO WORKFLOW

O arquivo do workflow está em:
`10-AI-Factory-V3-Unified.json`

---

## TESTE APÓS IMPLEMENTAÇÃO

1. Executar o workflow com uma transcrição do "Dr Luiz e Mariana"
2. Verificar se o output contém "Dr Luiz" e NÃO "Dra. Eline"
3. Ver os logs do nó 1.8 para confirmar que validação está funcionando

**Resultado esperado:**
```json
{
  "business_context": {
    "nome_negocio": "Dr Luiz e Mariana Carvalho Giareta"  // ✅ CORRETO
  }
}
```

**Resultado que NÃO deve acontecer:**
```json
{
  "business_context": {
    "nome_negocio": "Clínica da Dra. Eline Lobo"  // ❌ ALUCINAÇÃO
  }
}
```

---

## INFORMAÇÕES ADICIONAIS

### Por que isso aconteceu?
O modelo Groq Llama 3.3 70B "memorizou" dados de outros clientes (possivelmente da Dra. Eline Lobo que foi processada anteriormente) e quando viu palavras-chave como "saúde feminina", "clínica", "tratamento", ele associou erroneamente a esse cliente anterior.

### Por que a solução funciona?
1. **Ancoragem no prompt**: Forçamos a IA a usar `{{ $json.nome_lead }}` explicitamente
2. **Validação pós-IA**: O nó 1.8 detecta se a IA usou um nome errado e corrige automaticamente
3. **Redução de temperature**: Menos "criatividade" = menos alucinações

---

**FIM DO PROMPT PARA CLAUDE BROWSER**
