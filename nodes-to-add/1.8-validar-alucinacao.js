// =====================================================
// NÓ 1.8 - VALIDAR OUTPUT E CORRIGIR ALUCINAÇÕES
// Inserir ENTRE nó 1.7 (AI Analisar Kickoff) e 2.1 (Processar Análise)
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
// Adicione aqui nomes de clientes que a IA NÃO deveria inventar
const CLIENTES_OUTROS = [
  'Dra. Eline Lobo',
  'Eline Lobo',
  'Dra Eline',
  'Clínica da Dra. Eline',
  'Dr. João Silva',
  'Clínica Premium',
  // Adicionar mais conforme necessário - estes são exemplos
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
  for (const clienteOutro of CLIENTES_OUTROS) {
    if (normalizarNome(nomeNegocioIA).includes(normalizarNome(clienteOutro))) {
      // Verificar se não é realmente o cliente atual
      if (!normalizarNome(nomeLeadEsperado).includes(normalizarNome(clienteOutro))) {
        validacao.alucinacao_detectada = true;
        validacao.passou = false;
        validacao.alertas.push({
          tipo: 'ALUCINACAO_CRITICA',
          mensagem: `IA gerou "${nomeNegocioIA}" mas cliente real é "${nomeLeadEsperado}"`,
          cliente_inventado: nomeNegocioIA,
          cliente_real: nomeLeadEsperado
        });

        // CORRIGIR automaticamente
        outputText = substituirCampoJSON(outputText, 'nome_negocio', nomeLeadEsperado);
        validacao.correcoes.push({
          campo: 'nome_negocio',
          de: nomeNegocioIA,
          para: nomeLeadEsperado
        });

        break;
      }
    }
  }

  // 3. Verificar similaridade entre nome da IA e nome esperado
  if (!validacao.alucinacao_detectada) {
    validacao.similaridade = calcularSimilaridade(nomeNegocioIA, nomeLeadEsperado);

    if (validacao.similaridade < 0.2) {
      // Nomes muito diferentes - possível alucinação
      validacao.alertas.push({
        tipo: 'BAIXA_SIMILARIDADE',
        mensagem: `Nome da IA "${nomeNegocioIA}" tem baixa similaridade com "${nomeLeadEsperado}"`,
        similaridade: validacao.similaridade
      });

      // Verificar se nome da IA aparece na transcrição
      const nomeNaTranscricao = normalizarNome(textoTranscricao).includes(
        normalizarNome(nomeNegocioIA).substring(0, 15)
      );

      if (!nomeNaTranscricao) {
        validacao.alucinacao_detectada = true;
        validacao.passou = false;
        validacao.alertas.push({
          tipo: 'NOME_NAO_NA_TRANSCRICAO',
          mensagem: `"${nomeNegocioIA}" não aparece na transcrição - provável alucinação`
        });

        // CORRIGIR automaticamente
        outputText = substituirCampoJSON(outputText, 'nome_negocio', nomeLeadEsperado);
        validacao.correcoes.push({
          campo: 'nome_negocio',
          de: nomeNegocioIA,
          para: nomeLeadEsperado
        });
      }
    }
  }
}

// 4. Verificar nome_agente e outras referências
const nomeAgente = extrairCampoJSON(outputText, 'nome_agente');
if (nomeAgente && validacao.alucinacao_detectada) {
  // Se teve alucinação no nome_negocio, verificar se nome_agente faz referência errada
  // (Não corrigir automaticamente, apenas alertar)
  validacao.alertas.push({
    tipo: 'VERIFICAR_MANUALMENTE',
    mensagem: `Verificar se nome_agente "${nomeAgente}" ainda faz sentido após correção`,
    campo: 'nome_agente',
    valor: nomeAgente
  });
}

// ========== LOG PARA DEBUG ==========
console.log('========== VALIDAÇÃO ANTI-ALUCINAÇÃO ==========');
console.log(`Cliente esperado: ${nomeLeadEsperado}`);
console.log(`Nome da IA: ${nomeNegocioIA}`);
console.log(`Similaridade: ${validacao.similaridade}`);
console.log(`Alucinação detectada: ${validacao.alucinacao_detectada}`);
console.log(`Correções aplicadas: ${validacao.correcoes.length}`);
if (validacao.alertas.length > 0) {
  console.log('Alertas:', JSON.stringify(validacao.alertas, null, 2));
}
console.log('==============================================');

// ========== RETORNO ==========
return [{
  json: {
    ...respostaIA,
    output: outputText,
    _validacao_alucinacao: validacao,
    _dados_input: {
      nome_lead: nomeLeadEsperado,
      telefone: telefoneEsperado
    }
  }
}];
