// =====================================================
// NÓ 2.3 - PROCESSAR ANÁLISE (FIX MARKDOWN)
// =====================================================
// Este nó processa a resposta do AI Agent removendo
// markdown e extraindo o JSON corretamente
// =====================================================

const items = $input.all();

// Função para remover markdown e extrair JSON
function cleanAndParse(rawOutput) {
  if (!rawOutput) return null;

  let text = typeof rawOutput === 'string' ? rawOutput : String(rawOutput);

  // 1. Remover ```json e ``` (markdown code blocks)
  text = text.replace(/^```json\s*/i, '');
  text = text.replace(/^```\s*/i, '');
  text = text.replace(/\s*```$/i, '');
  text = text.trim();

  // 2. Tentar parsear
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Erro ao parsear JSON:', e.message);

    // 3. Tentar encontrar JSON dentro do texto
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error('Erro ao parsear JSON extraído:', e2.message);
      }
    }

    return null;
  }
}

// Função para extrair score de forma flexível
function getScore(obj) {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'object' && obj.score !== undefined) return obj.score;
  return 0;
}

// Função para extrair status de forma flexível
function getStatus(obj, field) {
  if (obj === null || obj === undefined) return 'nao';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    return obj.status || obj[field] || 'nao';
  }
  return 'nao';
}

// Processar cada item
const results = items.map(item => {
  const rawOutput = item.json?.output || item.json?.text || item.json?.message || '';

  const analise = cleanAndParse(rawOutput);

  if (!analise) {
    return {
      json: {
        erro_parse: true,
        motivo: 'Não foi possível extrair JSON da resposta',
        raw_snippet: rawOutput.substring(0, 500),
        analise_geral: {
          score_total: 0,
          probabilidade_fechamento: 0,
          status: 'ERRO',
          resumo_executivo: 'Erro ao processar resposta da IA'
        },
        scores_detalhados: {
          qualificacao_bant: { score: 0 },
          descoberta_spin: { score: 0 },
          conducao: { score: 0 },
          fechamento: { score: 0 }
        },
        metadata: {
          tier: 'ERRO',
          cor: '#ef4444',
          emoji: '❌',
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  // Extrair dados de forma flexível (suporta ambos formatos)
  const analiseGeral = analise.analise_geral || {};
  const scoresDetalhados = analise.scores_detalhados || {};

  // Calcular tier baseado no score
  const scoreTotal = analiseGeral.score_total || 0;
  let tier, cor, emoji;

  if (scoreTotal >= 81) { tier = 'A+ EXCELENTE'; cor = '#10b981'; emoji = '🏆'; }
  else if (scoreTotal >= 61) { tier = 'B BOA'; cor = '#3b82f6'; emoji = '✅'; }
  else if (scoreTotal >= 41) { tier = 'C MEDIANA'; cor = '#f59e0b'; emoji = '⚠️'; }
  else if (scoreTotal >= 21) { tier = 'D FRACA'; cor = '#ef4444'; emoji = '❌'; }
  else { tier = 'F CRÍTICA'; cor = '#7f1d1d'; emoji = '🚨'; }

  // Formatar resumo
  const resumoFormatado = `
${emoji} CALL ${tier}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score Total: ${scoreTotal}/100
Probabilidade Fechamento: ${analiseGeral.probabilidade_fechamento || 0}%
Status: ${analiseGeral.status || 'N/A'}

${analiseGeral.resumo_executivo || 'Sem resumo disponível'}
`;

  // Extrair scores individuais (suporta formato antigo e novo)
  const qBant = scoresDetalhados.qualificacao_bant || {};
  const dSpin = scoresDetalhados.descoberta_spin || {};
  const cond = scoresDetalhados.conducao || {};
  const fech = scoresDetalhados.fechamento || {};

  const scoresFormatado = `
📊 BREAKDOWN DE SCORES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Qualificação (BANT): ${getScore(qBant.score || qBant)}/10
• Descoberta (SPIN): ${getScore(dSpin.score || dSpin)}/10
• Condução: ${getScore(cond.score || cond)}/10
• Fechamento: ${getScore(fech.score || fech)}/10
`;

  return {
    json: {
      // Dados principais (formato compatível com nó Atualizar GHL)
      analise_geral: {
        score_total: scoreTotal,
        probabilidade_fechamento: analiseGeral.probabilidade_fechamento || 0,
        status: analiseGeral.status || 'N/A',
        resumo_executivo: analiseGeral.resumo_executivo || ''
      },

      // Scores detalhados (formato simplificado)
      scores_detalhados: {
        qualificacao_bant: {
          score: getScore(qBant.score || qBant),
          budget: getStatus(qBant.budget, 'status'),
          authority: getStatus(qBant.authority, 'status'),
          need: getStatus(qBant.need, 'status'),
          timeline: getStatus(qBant.timeline, 'status'),
          feedback: qBant.feedback || ''
        },
        descoberta_spin: {
          score: getScore(dSpin.score || dSpin),
          situation: getStatus(dSpin.situation, 'nivel'),
          problem: getStatus(dSpin.problem, 'nivel'),
          implication: getStatus(dSpin.implication, 'nivel'),
          need_payoff: getStatus(dSpin.need_payoff, 'nivel'),
          feedback: dSpin.feedback || ''
        },
        conducao: {
          score: getScore(cond.score || cond),
          rapport: getStatus(cond.rapport, 'nivel'),
          escuta_ativa: getStatus(cond.escuta_ativa, 'percentual'),
          controle: getStatus(cond.controle, 'nivel'),
          objecoes: getStatus(cond.objecoes, 'tratamento'),
          feedback: cond.feedback || ''
        },
        fechamento: {
          score: getScore(fech.score || fech),
          call_to_action: fech.call_to_action?.definido ? 'sim' : 'nao',
          compromisso: fech.compromisso?.obtido ? 'sim' : 'nao',
          urgencia: fech.urgencia?.criada ? 'sim' : 'nao',
          entusiasmo_cliente: getStatus(fech.entusiasmo_cliente, 'nivel'),
          feedback: fech.feedback || ''
        }
      },

      // Red flags
      red_flags: analise.red_flags || {},

      // Oportunidades perdidas
      oportunidades_perdidas: analise.oportunidades_perdidas || [],

      // Highlights
      highlights: analise.highlights_positivos || analise.highlights || [],

      // Plano de ação
      plano_acao: analise.plano_acao || {},

      // Citações
      citacoes_importantes: analise.citacoes_criticas || analise.citacoes_importantes || [],

      // Veredicto final (novo formato)
      veredicto_final: analise.veredicto_final || {},

      // Metadata para exibição
      metadata: {
        tier,
        cor,
        emoji,
        resumo_formatado: resumoFormatado,
        scores_formatado: scoresFormatado,
        timestamp: new Date().toISOString(),
        parse_success: true
      }
    }
  };
});

return results;
