"""
Agent 15 - Reflection Aggregator
================================
Agrega analises de QA por agente e detecta padroes.
Equivalente ao workflow 09-Reflection-Loop do n8n.

Responsabilidades:
- Agregar analises de multiplas conversas
- Detectar padroes positivos e negativos
- Identificar violacoes criticas recorrentes
- Calcular metricas de performance
- Gerar recomendacoes priorizadas
"""

import logging
import json
from typing import Dict, List, Optional
from datetime import datetime
from collections import Counter

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class ReflectionAggregatorAgent(BaseAgent):
    """
    Agente que agrega analises de QA e gera relatorio de reflection.

    Inputs:
    - qa_analyses: Lista de analises do QAAnalyzerAgent
    - agent_info: Informacoes do agente (nome, version, system_prompt)
    - period_days: Periodo analisado em dias

    Outputs:
    - metricas: Metricas agregadas (media scores, taxa conversao, etc)
    - padroes_positivos: O que o agente faz bem consistentemente
    - padroes_negativos: Problemas recorrentes
    - violacoes_criticas: Red flags que se repetem
    - recomendacoes_priorizadas: Acoes ordenadas por impacto
    - prompt_improvements: Sugestoes especificas de melhoria no prompt
    """

    _SYSTEM_PROMPT = """# Reflection Aggregator - Analista de Padroes de Performance

Voce e um analista especializado em detectar padroes de performance de agentes de IA SDR.
Seu trabalho e agregar multiplas analises de conversas e identificar tendencias.

## SUA MISSAO

1. Analisar conjunto de avaliacoes de QA
2. Identificar padroes que se repetem (positivos e negativos)
3. Calcular metricas agregadas
4. Priorizar recomendacoes por impacto
5. Sugerir melhorias especificas no prompt

## COMO ANALISAR

### Metricas a Calcular
- Media de cada dimensao (clareza, objecoes, compliance, avanco)
- Media geral
- Taxa de conversao (agendado / total)
- Taxa de perda (perdido / total)
- Frequencia de red flags

### Padroes a Detectar

**Padroes Positivos** (o que funciona bem):
- Tecnicas que aparecem em conversas de sucesso
- Frases que geram engajamento
- Abordagens que convertem

**Padroes Negativos** (o que falha):
- Erros que se repetem em conversas perdidas
- Pontos onde leads desistem
- Violacoes recorrentes de compliance

### Priorizacao de Recomendacoes

Ordene por:
1. IMPACTO (quantas conversas afetadas)
2. GRAVIDADE (quao ruim e o problema)
3. FACILIDADE (quao facil e corrigir)

## OUTPUT OBRIGATORIO (JSON)

{
  "periodo_analisado": {
    "inicio": "ISO date",
    "fim": "ISO date",
    "total_conversas": 50,
    "total_mensagens": 500
  },
  "metricas": {
    "score_medio": 6.5,
    "score_clareza": 7.0,
    "score_objecoes": 5.5,
    "score_compliance": 7.5,
    "score_avanco": 6.0,
    "taxa_conversao": "30%",
    "taxa_perda": "20%",
    "taxa_em_andamento": "50%"
  },
  "classificacao_geral": "ADEQUADO",
  "padroes_positivos": [
    {
      "padrao": "descricao do que funciona bem",
      "frequencia": "X de Y conversas",
      "impacto": "como isso ajuda na conversao",
      "exemplo": "citacao da conversa"
    }
  ],
  "padroes_negativos": [
    {
      "padrao": "descricao do problema",
      "frequencia": "X de Y conversas",
      "impacto": "como isso prejudica",
      "exemplo": "citacao da conversa"
    }
  ],
  "violacoes_criticas": [
    {
      "tipo": "tipo da violacao",
      "frequencia": "X ocorrencias",
      "gravidade": "CRITICA|ALTA|MEDIA",
      "acao_necessaria": "o que fazer"
    }
  ],
  "recomendacoes_priorizadas": [
    {
      "prioridade": 1,
      "area": "area de melhoria",
      "problema": "descricao do problema",
      "solucao": "como resolver",
      "impacto_esperado": "melhoria estimada",
      "esforco": "BAIXO|MEDIO|ALTO",
      "timeline": "quando implementar"
    }
  ],
  "prompt_improvements": {
    "secoes_adicionar": [
      {
        "secao": "nome da secao",
        "conteudo": "conteudo sugerido",
        "motivo": "por que adicionar"
      }
    ],
    "secoes_modificar": [
      {
        "secao": "nome da secao",
        "alteracao": "o que mudar",
        "motivo": "por que mudar"
      }
    ],
    "few_shot_adicionar": [
      {
        "situacao": "quando usar",
        "exemplo": "Q: pergunta\\nA: resposta ideal"
      }
    ]
  },
  "resumo_executivo": "3-5 frases resumindo a situacao e principais acoes"
}

## REGRAS

1. Baseie-se APENAS nos dados fornecidos
2. Priorize acoes de ALTO IMPACTO e BAIXO ESFORCO
3. Seja especifico nas sugestoes de prompt
4. Inclua exemplos concretos sempre que possivel
5. Retorne APENAS o JSON valido
"""

    @property
    def system_prompt(self) -> str:
        return self._SYSTEM_PROMPT

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="ReflectionAggregator",
                description="Agrega analises de QA e detecta padroes",
                model="claude-sonnet-4-20250514",
                temperature=0.4,
                max_tokens=6000
            )
        super().__init__(config)

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Agrega analises e gera relatorio de reflection.

        Args:
            input_data: {
                "qa_analyses": Lista de analises do QAAnalyzer,
                "agent_info": {name, version, system_prompt},
                "period_days": int
            }
        """
        start_time = datetime.utcnow()

        try:
            qa_analyses = input_data.get('qa_analyses', [])
            agent_info = input_data.get('agent_info', {})
            period_days = input_data.get('period_days', 7)

            if not qa_analyses:
                raise ValueError("Nenhuma analise de QA fornecida")

            # Pre-processar metricas
            pre_metrics = self._calculate_pre_metrics(qa_analyses)

            # Montar prompt
            user_message = self._build_reflection_prompt(
                qa_analyses,
                agent_info,
                pre_metrics,
                period_days
            )

            # Chamar Claude
            response_text, tokens_used = await self.call_claude(user_message)

            # Parsear resposta
            reflection = self._parse_response(response_text)

            # Adicionar metricas pre-calculadas
            reflection['pre_calculated_metrics'] = pre_metrics

            # Adicionar metadados
            reflection['metadata'] = {
                'agent_name': agent_info.get('agent_name'),
                'agent_version_id': agent_info.get('id'),
                'total_analyses': len(qa_analyses),
                'generated_at': datetime.utcnow().isoformat()
            }

            # Salvar na memoria compartilhada
            self.set_in_memory('last_reflection', reflection)

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=reflection,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=tokens_used,
                model=self.config.model,
                metadata={
                    'score_medio': pre_metrics.get('score_medio'),
                    'total_conversas': len(qa_analyses),
                    'recomendacoes_count': len(reflection.get('recomendacoes_priorizadas', []))
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"ReflectionAggregator failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    def _calculate_pre_metrics(self, qa_analyses: List[Dict]) -> Dict:
        """Calcula metricas basicas antes de enviar para IA"""
        total = len(qa_analyses)
        if total == 0:
            return {}

        # Coletar notas
        scores_geral = []
        scores_clareza = []
        scores_objecoes = []
        scores_compliance = []
        scores_avanco = []

        # Resultados
        agendados = 0
        perdidos = 0
        em_andamento = 0
        aquecidos = 0

        # Red flags
        all_red_flags = []

        for analysis in qa_analyses:
            # Nota final
            nota_final = analysis.get('nota_final', {})
            if 'valor' in nota_final:
                scores_geral.append(nota_final['valor'])

            # Dimensoes
            dimensoes = analysis.get('dimensoes', {})
            if 'clareza_conducao' in dimensoes:
                scores_clareza.append(dimensoes['clareza_conducao'].get('nota', 0))
            if 'tratamento_objecoes' in dimensoes:
                scores_objecoes.append(dimensoes['tratamento_objecoes'].get('nota', 0))
            if 'loop_compliance' in dimensoes:
                scores_compliance.append(dimensoes['loop_compliance'].get('nota', 0))
            if 'avanco_objetivo' in dimensoes:
                scores_avanco.append(dimensoes['avanco_objetivo'].get('nota', 0))

            # Resultado
            conversa = analysis.get('conversa', {})
            resultado = conversa.get('resultado_inferido', 'em_andamento')
            if resultado == 'agendado':
                agendados += 1
            elif resultado == 'perdido':
                perdidos += 1
            elif resultado == 'aquecido':
                aquecidos += 1
            else:
                em_andamento += 1

            # Red flags
            red_flags = analysis.get('red_flags', [])
            for rf in red_flags:
                all_red_flags.append(rf.get('tipo', 'desconhecido'))

        # Calcular medias
        def safe_avg(lst):
            return round(sum(lst) / len(lst), 2) if lst else 0

        # Contar red flags
        red_flag_counts = Counter(all_red_flags)

        return {
            'total_conversas': total,
            'score_medio': safe_avg(scores_geral),
            'score_clareza': safe_avg(scores_clareza),
            'score_objecoes': safe_avg(scores_objecoes),
            'score_compliance': safe_avg(scores_compliance),
            'score_avanco': safe_avg(scores_avanco),
            'agendados': agendados,
            'perdidos': perdidos,
            'aquecidos': aquecidos,
            'em_andamento': em_andamento,
            'taxa_conversao': f"{round(agendados/total*100, 1)}%",
            'taxa_perda': f"{round(perdidos/total*100, 1)}%",
            'red_flags_frequentes': dict(red_flag_counts.most_common(5))
        }

    def _build_reflection_prompt(
        self,
        qa_analyses: List[Dict],
        agent_info: Dict,
        pre_metrics: Dict,
        period_days: int
    ) -> str:
        """Monta prompt para geracao de reflection"""

        # Resumo das analises
        analyses_summary = []
        for i, analysis in enumerate(qa_analyses[:30], 1):  # Limitar a 30
            nota = analysis.get('nota_final', {}).get('valor', 'N/A')
            classif = analysis.get('nota_final', {}).get('classificacao', 'N/A')
            resultado = analysis.get('conversa', {}).get('resultado_inferido', 'N/A')
            resumo = analysis.get('resumo_executivo', 'Sem resumo')[:200]
            red_flags = len(analysis.get('red_flags', []))

            analyses_summary.append(
                f"{i}. Nota: {nota} ({classif}) | Resultado: {resultado} | "
                f"Red flags: {red_flags} | {resumo}"
            )

        # Coletar todas as oportunidades de melhoria
        all_improvements = []
        for analysis in qa_analyses:
            for opp in analysis.get('oportunidades_melhoria', []):
                all_improvements.append(opp.get('area', '') + ': ' + opp.get('sugestao', ''))

        # Coletar todos os red flags detalhados
        all_red_flags_detail = []
        for analysis in qa_analyses:
            for rf in analysis.get('red_flags', []):
                all_red_flags_detail.append(
                    f"- {rf.get('tipo', 'N/A')}: {rf.get('descricao', 'N/A')} "
                    f"(Gravidade: {rf.get('gravidade', 'N/A')})"
                )

        prompt = f"""## DADOS PARA REFLECTION

### Informacoes do Agente
- **Nome:** {agent_info.get('agent_name', 'N/A')}
- **Versao:** {agent_info.get('version', 'N/A')}
- **Periodo analisado:** Ultimos {period_days} dias

### Metricas Pre-Calculadas
{json.dumps(pre_metrics, indent=2, ensure_ascii=False)}

### Resumo das {len(qa_analyses)} Analises de QA

{chr(10).join(analyses_summary)}

### Todos os Red Flags Identificados ({len(all_red_flags_detail)} ocorrencias)

{chr(10).join(all_red_flags_detail[:50])}

### Oportunidades de Melhoria Sugeridas nas Analises

{chr(10).join(all_improvements[:30])}

---

Analise estes dados, identifique padroes e gere o relatorio de reflection conforme o formato JSON especificado.
Foque em acoes PRATICAS e PRIORIZADAS que podem melhorar a performance do agente."""

        return prompt

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON"""
        parsed = self._extract_json(raw_response)

        if parsed:
            return parsed

        # Fallback
        logger.warning("Could not parse reflection response")
        return {
            'metricas': {},
            'padroes_positivos': [],
            'padroes_negativos': [],
            'violacoes_criticas': [],
            'recomendacoes_priorizadas': [],
            'prompt_improvements': {},
            'resumo_executivo': 'Erro ao processar reflection',
            'raw_response': raw_response[:2000]
        }
