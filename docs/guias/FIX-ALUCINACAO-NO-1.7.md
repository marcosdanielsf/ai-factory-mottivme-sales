# FIX: ALUCINAÇÃO NO NÓ 1.7 - AI ARCHITECT

**Data:** 2026-01-01
**Problema:** Groq Llama 3.3 70B gerou dados da "Dra. Eline Lobo" quando deveria gerar para "Dr Luiz e Mariana Carvalho Giareta"
**Causa:** Alucinação da IA - modelo inventou dados que não estavam na transcrição

---

## DIAGNÓSTICO

### Input Correto (do nó 1.6):
```json
{
  "nome_lead": "Dr Luiz e Mariana Carvalho Giareta",
  "texto_transcricao": "Onboarding - Dr Luiz e Mariana Carvalho Giareta..."
}
```

### Output Errado (do nó 1.7):
```
Nome do agente: Isabela
Cargo: Assistente da Dra. Eline Lobo  ← ALUCINAÇÃO!
```

### Causas Prováveis:
1. **Contaminação de treinamento**: Modelo viu "Dra. Eline Lobo" em dados anteriores
2. **Associação por setor**: "Saúde feminina" → padrão memorizado
3. **Falta de ancoragem**: Prompt não força extração do nome do INPUT

---

## SOLUÇÃO 1: GUARDRAILS ANTI-ALUCINAÇÃO NO PROMPT

Adicionar no **System Message** do nó 1.7:

```
## REGRAS CRÍTICAS ANTI-ALUCINAÇÃO

### REGRA 1: ANCORAGEM OBRIGATÓRIA
O campo "nome_negocio" DEVE ser extraído APENAS da transcrição fornecida.
- Se a transcrição menciona "Dr Luiz", o nome_negocio DEVE conter "Dr Luiz"
- Se a transcrição menciona "Clínica XYZ", o nome_negocio DEVE ser "Clínica XYZ"
- NUNCA invente nomes que não aparecem no texto

### REGRA 2: VERIFICAÇÃO CRUZADA
Antes de gerar o output, verifique:
- O nome_negocio aparece na transcrição? SE NÃO → Use o nome_lead do input
- O nome_agente faz sentido para este cliente? SE NÃO → Gere novo nome

### REGRA 3: DADOS DO CLIENTE ATUAL
ESTES SÃO OS DADOS DO CLIENTE QUE VOCÊ DEVE USAR:
- Nome do Lead: {{ $json.nome_lead }}
- Telefone: {{ $json.telefone_lead }}

SE seu output mencionar QUALQUER nome que não seja "{{ $json.nome_lead }}" ou derivado dele, você está ERRADO.

### REGRA 4: PROIBIÇÃO DE DADOS EXTERNOS
NUNCA use informações de:
- Clientes anteriores
- Dados de treinamento
- Exemplos do few-shot que não correspondem ao cliente atual
- Nomes como "Dra. Eline Lobo", "Dra. Maria", etc. que não estão na transcrição
```

---

## SOLUÇÃO 2: INJETAR NOME NO PROMPT (User Message)

Modificar o **User Message** do nó 1.7:

```
## DADOS OBRIGATÓRIOS DO CLIENTE (USE EXATAMENTE ESTES)

- **NOME DO CLIENTE:** {{ $json.nome_lead }}
- **TELEFONE:** {{ $json.telefone_lead }}
- **ID DO CONTATO:** {{ $json.contact_id }}

⚠️ IMPORTANTE: O agente que você criar DEVE ser para "{{ $json.nome_lead }}", NÃO para outro cliente.

---

## TRANSCRIÇÃO DA CALL DE KICKOFF

{{ $json.texto_transcricao }}

---

## INSTRUÇÕES

Analise a transcrição acima e gere a configuração do agente para o cliente "{{ $json.nome_lead }}".

VALIDAÇÃO: Seu output JSON DEVE ter:
- "nome_negocio" contendo "{{ $json.nome_lead }}" ou nome extraído da transcrição
- NUNCA use nomes de outros clientes como "Dra. Eline Lobo"
```

---

## SOLUÇÃO 3: VALIDAÇÃO PÓS-IA NO NÓ 2.1

Adicionar este código no início do nó **2.1 Processar Análise**:

```javascript
// =====================================================
// VALIDAÇÃO ANTI-ALUCINAÇÃO
// Verifica se a IA não inventou dados
// =====================================================

const dadosAnteriores = $('1.6 Preparar Dados').item.json;
const respostaIA = $input.first().json;

// Extrair nome do output da IA
const outputStr = respostaIA.output ?? respostaIA.text ?? '';
const analise = tryParse(outputStr);

if (analise && analise.business_context) {
  const nomeNegocioIA = analise.business_context.nome_negocio || '';
  const nomeLeadInput = dadosAnteriores.nome_lead || '';

  // ========== VERIFICAÇÃO DE ALUCINAÇÃO ==========

  // Lista de nomes conhecidos que NÃO deveriam aparecer para outros clientes
  const NOMES_ALERTA = [
    'Dra. Eline Lobo',
    'Eline Lobo',
    'Dra Eline',
    'Clínica da Dra. Eline',
    // Adicionar outros nomes de clientes conhecidos aqui
  ];

  // Verificar se a IA usou um nome de outro cliente
  for (const nomeAlerta of NOMES_ALERTA) {
    if (nomeNegocioIA.toLowerCase().includes(nomeAlerta.toLowerCase())) {
      // ALUCINAÇÃO DETECTADA!
      console.log(`⚠️ ALUCINAÇÃO DETECTADA!`);
      console.log(`   Input: ${nomeLeadInput}`);
      console.log(`   Output IA: ${nomeNegocioIA}`);

      // Corrigir automaticamente
      analise.business_context.nome_negocio = nomeLeadInput;
      analise._alucinacao_corrigida = true;
      analise._nome_original_ia = nomeNegocioIA;

      // Também corrigir outros campos que possam estar contaminados
      if (analise.personality_config && analise.personality_config.nome_agente) {
        // Manter o nome do agente mas registrar o problema
        analise._aviso = `ATENÇÃO: IA gerou dados para "${nomeNegocioIA}" mas o cliente é "${nomeLeadInput}"`;
      }

      break;
    }
  }

  // Verificação de similaridade (se nome_negocio não tem NADA a ver com nome_lead)
  const similaridade = calcularSimilaridade(nomeNegocioIA, nomeLeadInput);
  if (similaridade < 0.2 && !analise._alucinacao_corrigida) {
    // Nomes muito diferentes - possível alucinação
    console.log(`⚠️ POSSÍVEL ALUCINAÇÃO - Baixa similaridade`);
    console.log(`   Input: ${nomeLeadInput} | Output: ${nomeNegocioIA} | Similaridade: ${similaridade}`);

    // Forçar uso do nome do input
    analise.business_context.nome_negocio = nomeLeadInput;
    analise._baixa_similaridade = true;
    analise._similaridade = similaridade;
  }
}

// Função de similaridade simples
function calcularSimilaridade(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!s1 || !s2) return 0;

  // Verificar se um contém o outro
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Contar palavras em comum
  const palavras1 = s1.split(/\s+/);
  const palavras2 = s2.split(/\s+/);
  let comuns = 0;
  for (const p1 of palavras1) {
    if (palavras2.some(p2 => p2.includes(p1) || p1.includes(p2))) {
      comuns++;
    }
  }

  return comuns / Math.max(palavras1.length, palavras2.length);
}

// ... resto do código existente ...
```

---

## SOLUÇÃO 4: ADICIONAR NÓ DE VALIDAÇÃO EXPLÍCITA

Criar um novo nó **1.8 Validar Output** entre 1.7 e 2.1:

```javascript
// NÓ 1.8 - VALIDAR OUTPUT DA IA
// Objetivo: Detectar e corrigir alucinações antes de prosseguir

const input = $('1.6 Preparar Dados').item.json;
const iaOutput = $input.first().json;

const nomeLeadEsperado = input.nome_lead;
const textoTranscricao = input.texto_transcricao;

// Extrair nome do negócio do output da IA
let outputText = iaOutput.output || iaOutput.text || '';
let nomeExtraido = '';

// Tentar extrair nome_negocio do JSON
try {
  const jsonMatch = outputText.match(/"nome_negocio"\s*:\s*"([^"]+)"/);
  if (jsonMatch) {
    nomeExtraido = jsonMatch[1];
  }
} catch (e) {}

// VALIDAÇÕES
const validacoes = {
  nomeCorreto: false,
  nomeNaTranscricao: false,
  alucinacaoDetectada: false,
  correcaoNecessaria: false
};

// 1. Nome extraído contém parte do nome esperado?
if (nomeExtraido && nomeLeadEsperado) {
  const palavrasEsperadas = nomeLeadEsperado.toLowerCase().split(/\s+/);
  const palavrasExtraidas = nomeExtraido.toLowerCase().split(/\s+/);

  const intersecao = palavrasEsperadas.filter(p =>
    palavrasExtraidas.some(pe => pe.includes(p) || p.includes(pe))
  );

  validacoes.nomeCorreto = intersecao.length >= 1;
}

// 2. Nome aparece na transcrição?
if (nomeExtraido && textoTranscricao) {
  validacoes.nomeNaTranscricao = textoTranscricao.toLowerCase().includes(
    nomeExtraido.toLowerCase().substring(0, 10)
  );
}

// 3. Detectar nomes de outros clientes (alucinação)
const CLIENTES_CONHECIDOS = [
  'eline lobo', 'dra eline', 'clinica eline',
  // Adicionar mais conforme necessário
];

for (const cliente of CLIENTES_CONHECIDOS) {
  if (nomeExtraido.toLowerCase().includes(cliente)) {
    if (!nomeLeadEsperado.toLowerCase().includes(cliente)) {
      validacoes.alucinacaoDetectada = true;
      validacoes.nomeAlucinado = nomeExtraido;
      break;
    }
  }
}

// DECISÃO
if (validacoes.alucinacaoDetectada || (!validacoes.nomeCorreto && !validacoes.nomeNaTranscricao)) {
  validacoes.correcaoNecessaria = true;

  // Substituir nome no output
  if (nomeExtraido) {
    outputText = outputText.replace(
      `"nome_negocio": "${nomeExtraido}"`,
      `"nome_negocio": "${nomeLeadEsperado}"`
    );
  }
}

return [{
  json: {
    ...iaOutput,
    output: outputText,
    _validacao: validacoes,
    _nome_esperado: nomeLeadEsperado,
    _nome_extraido: nomeExtraido,
    _corrigido: validacoes.correcaoNecessaria
  }
}];
```

---

## SOLUÇÃO 5: TROCAR MODELO OU REDUZIR TEMPERATURA

### Opção A: Reduzir Temperature
```json
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.1  // Era 0.3, reduzir para menos alucinação
}
```

### Opção B: Usar Claude ao invés de Groq
- Claude tende a ter menos alucinações
- Mais caro, mas mais confiável para dados críticos

### Opção C: Duas passadas
1. Primeira passada: Groq extrai dados (rápido, barato)
2. Segunda passada: Claude valida e corrige (mais lento, preciso)

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Imediato (Hoje)
- [ ] Adicionar guardrails no System Message do nó 1.7
- [ ] Injetar `{{ $json.nome_lead }}` no User Message
- [ ] Reduzir temperature para 0.1

### Curto Prazo (Esta Semana)
- [ ] Adicionar código de validação no nó 2.1
- [ ] Criar nó 1.8 de validação explícita
- [ ] Testar com 5 transcrições diferentes

### Médio Prazo
- [ ] Criar lista de `CLIENTES_CONHECIDOS` dinâmica do banco
- [ ] Implementar logging de alucinações para análise
- [ ] Considerar migração para Claude em casos críticos

---

## COMO TESTAR A CORREÇÃO

1. Re-executar o workflow com a transcrição do "Dr Luiz e Mariana"
2. Verificar se o output contém "Dr Luiz" e NÃO "Dra. Eline"
3. Executar com outras 3-5 transcrições para validar

---

**IMPORTANTE**: Após implementar, re-analisar o agente com o Comitê de Especialistas para ter feedback sobre dados CORRETOS.
