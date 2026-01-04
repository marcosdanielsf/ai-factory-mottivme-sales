"""
AI Factory Testing Framework - Evaluator (LLM-as-Judge)
========================================================
Usa Claude Opus para avaliar respostas de agentes IA.
"""

import json
import logging
import os
from typing import Dict, List, Optional
from datetime import datetime
import anthropic

logger = logging.getLogger(__name__)


# ============================================
# RUBRICA PADRÃO DE AVALIAÇÃO
# ============================================

DEFAULT_RUBRIC = """
## RUBRICA DE AVALIAÇÃO - AGENTE SDR/VENDAS

Avalie o agente em 5 dimensões (cada uma de 0-10):

### 1. COMPLETENESS (25% do score)
O agente coleta as informações necessárias (BANT)?
- Budget: Pergunta sobre investimento/preço de forma consultiva
- Authority: Identifica quem decide
- Need: Entende a dor/necessidade real
- Timeline: Identifica urgência

**10**: BANT completo e natural
**7-9**: 3 de 4 elementos cobertos
**4-6**: 2 de 4 elementos cobertos
**1-3**: Apenas 1 elemento
**0**: Nenhuma qualificação

### 2. TONE (20% do score)
O tom é consultivo, empático e não-pushy?

**10**: Tom perfeito - consultivo, empático, usa nome, não pressiona
**7-9**: Bom tom com pequenas melhorias possíveis
**4-6**: Tom aceitável mas muito formal/robótico
**1-3**: Tom inadequado (agressivo, passivo demais, etc)
**0**: Completamente inapropriado

### 3. ENGAGEMENT (20% do score)
O lead continua engajado? As perguntas são abertas e relevantes?

**10**: Lead altamente engajado, perguntas geram conversação
**7-9**: Bom engajamento, conversa flui bem
**4-6**: Engajamento médio, algumas respostas curtas
**1-3**: Lead desengajado, respostas monossilábicas
**0**: Lead abandonou ou ficou irritado

### 4. COMPLIANCE (20% do score)
Segue as regras/guardrails definidos?

**10**: Segue 100% das regras, sem inventar informações
**7-9**: Segue maioria das regras, pequenos desvios
**4-6**: Alguns desvios importantes
**1-3**: Vários desvios graves
**0**: Ignora regras completamente, inventa informações

### 5. CONVERSION (15% do score)
Direciona para o objetivo (agendamento, venda, etc)?

**10**: Converte/agenda de forma natural e eficaz
**7-9**: Próximo de converter, boa direção
**4-6**: Tenta converter mas falha na execução
**1-3**: Não direciona para conversão
**0**: Afasta o lead do objetivo
"""


class Evaluator:
    """
    Avaliador de agentes usando Claude Opus como juiz.

    Workflow:
    1. Recebe agent + test_results
    2. Monta prompt com rubrica (default ou custom)
    3. Chama Claude Opus
    4. Extrai scores estruturados
    5. Retorna avaliação completa
    """

    def __init__(
        self,
        api_key: str = None,
        model: str = "claude-opus-4-20250514",
        temperature: float = 0.3,
        max_tokens: int = 4000
    ):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

        logger.info(f"Evaluator initialized with model: {model}")

    async def evaluate(
        self,
        agent: Dict,
        skill: Optional[Dict],
        test_results: List[Dict]
    ) -> Dict:
        """
        Avalia resultados de teste de um agente.

        Args:
            agent: Dict com info do agente (system_prompt, name, etc)
            skill: Dict com rubrica/exemplos customizados (opcional)
            test_results: Lista de resultados de cada teste

        Returns:
            {
                'overall_score': 8.5,
                'scores': {
                    'completeness': 9.0,
                    'tone': 8.5,
                    'engagement': 8.0,
                    'compliance': 9.0,
                    'conversion': 7.5
                },
                'strengths': ['...'],
                'weaknesses': ['...'],
                'failures': ['...'],
                'warnings': ['...'],
                'recommendations': ['...']
            }
        """
        logger.info(f"Evaluating agent: {agent.get('agent_name', 'Unknown')}")

        # 1. Selecionar rubrica
        rubric = self._get_rubric(skill)

        # 2. Montar prompt
        evaluation_prompt = self._build_evaluation_prompt(
            agent=agent,
            rubric=rubric,
            test_results=test_results
        )

        # 3. Chamar Claude Opus
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {
                        "role": "user",
                        "content": evaluation_prompt
                    }
                ]
            )

            raw_response = response.content[0].text
            logger.debug(f"Claude response: {raw_response[:500]}...")

        except Exception as e:
            logger.error(f"Error calling Claude: {e}")
            raise

        # 4. Extrair avaliação estruturada
        evaluation = self._parse_evaluation(raw_response)

        # 5. Calcular score geral (média ponderada)
        evaluation['overall_score'] = self._calculate_overall_score(evaluation['scores'])

        logger.info(
            f"Evaluation complete: overall_score={evaluation['overall_score']:.2f}, "
            f"strengths={len(evaluation['strengths'])}, "
            f"weaknesses={len(evaluation['weaknesses'])}"
        )

        return evaluation

    def _get_rubric(self, skill: Optional[Dict]) -> str:
        """Retorna rubrica customizada ou padrão"""
        if skill and skill.get('rubric'):
            logger.info("Using custom rubric from skill")
            return skill['rubric']

        logger.info("Using default rubric")
        return DEFAULT_RUBRIC

    def _build_evaluation_prompt(
        self,
        agent: Dict,
        rubric: str,
        test_results: List[Dict]
    ) -> str:
        """Monta o prompt completo para avaliação"""

        # Formatar test results
        test_cases_str = ""
        for i, result in enumerate(test_results, 1):
            test_cases_str += f"""
### Caso de Teste {i}: {result.get('name', f'Teste {i}')}

**Input do Lead:**
{result.get('input', 'N/A')}

**Resposta do Agente:**
{result.get('agent_response', 'N/A')}

**Comportamento Esperado:**
{result.get('expected_behavior', 'N/A')}

---
"""

        prompt = f"""# AVALIAÇÃO DE AGENTE IA

Você é um avaliador especialista de agentes de IA para vendas e atendimento.
Sua tarefa é avaliar as respostas do agente usando a rubrica fornecida.

## INFORMAÇÕES DO AGENTE

**Nome:** {agent.get('agent_name', 'N/A')}
**Versão:** {agent.get('version', 'N/A')}
**Objetivo:** {agent.get('objective', 'Qualificar leads e agendar consultas')}

**System Prompt (Resumo):**
{self._summarize_prompt(agent.get('system_prompt', ''))}

## RUBRICA DE AVALIAÇÃO

{rubric}

## CASOS DE TESTE

{test_cases_str}

## INSTRUÇÕES

Analise cada caso de teste e avalie o agente em cada dimensão da rubrica.
Considere o contexto geral da conversa e como o agente lida com diferentes situações.

**IMPORTANTE:** Retorne sua avaliação EXATAMENTE neste formato JSON:

```json
{{
    "scores": {{
        "completeness": 8.5,
        "tone": 9.0,
        "engagement": 8.0,
        "compliance": 9.0,
        "conversion": 7.5
    }},
    "strengths": [
        "Ponto forte 1",
        "Ponto forte 2",
        "Ponto forte 3"
    ],
    "weaknesses": [
        "Ponto fraco 1",
        "Ponto fraco 2"
    ],
    "failures": [
        "Falha crítica 1 (se houver)"
    ],
    "warnings": [
        "Aviso 1 (se houver)"
    ],
    "recommendations": [
        "Recomendação de melhoria 1",
        "Recomendação de melhoria 2"
    ],
    "test_case_scores": [
        {{"name": "Caso 1", "score": 8.5, "feedback": "..."}},
        {{"name": "Caso 2", "score": 9.0, "feedback": "..."}}
    ]
}}
```

Seja criterioso mas justo. Avalie com base na rubrica, não em preferências pessoais.
"""
        return prompt

    def _summarize_prompt(self, system_prompt: str, max_length: int = 500) -> str:
        """Resume o system prompt para não estourar contexto"""
        if len(system_prompt) <= max_length:
            return system_prompt

        # Pega início e fim
        return system_prompt[:max_length//2] + "\n\n[...]\n\n" + system_prompt[-max_length//2:]

    def _parse_evaluation(self, raw_response: str) -> Dict:
        """Extrai JSON estruturado da resposta do Claude"""

        # Tentar extrair JSON do response
        try:
            # Procura por bloco JSON
            json_start = raw_response.find('```json')
            json_end = raw_response.find('```', json_start + 7)

            if json_start != -1 and json_end != -1:
                json_str = raw_response[json_start + 7:json_end].strip()
                return json.loads(json_str)

            # Se não tem markdown, tenta parse direto
            json_start = raw_response.find('{')
            json_end = raw_response.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                json_str = raw_response[json_start:json_end]
                return json.loads(json_str)

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON: {e}")

        # Fallback: estrutura padrão
        logger.warning("Using fallback evaluation structure")
        return {
            'scores': {
                'completeness': 5.0,
                'tone': 5.0,
                'engagement': 5.0,
                'compliance': 5.0,
                'conversion': 5.0
            },
            'strengths': ['Avaliação não pôde ser extraída'],
            'weaknesses': ['Erro ao processar resposta do avaliador'],
            'failures': [],
            'warnings': ['Avaliação manual necessária'],
            'recommendations': ['Revisar logs para diagnóstico']
        }

    def _calculate_overall_score(self, scores: Dict[str, float]) -> float:
        """Calcula score geral com pesos"""
        weights = {
            'completeness': 0.25,
            'tone': 0.20,
            'engagement': 0.20,
            'compliance': 0.20,
            'conversion': 0.15
        }

        total = 0.0
        for dimension, score in scores.items():
            weight = weights.get(dimension, 0.2)
            total += score * weight

        return round(total, 2)

    async def evaluate_single_response(
        self,
        agent: Dict,
        input_message: str,
        agent_response: str,
        expected_behavior: str = None
    ) -> Dict:
        """
        Avalia uma única resposta (útil para testes rápidos).
        """
        test_results = [{
            'name': 'Single Response Test',
            'input': input_message,
            'agent_response': agent_response,
            'expected_behavior': expected_behavior or 'Resposta apropriada'
        }]

        return await self.evaluate(agent=agent, skill=None, test_results=test_results)

    def evaluate_sync(
        self,
        agent: Dict,
        skill: Optional[Dict],
        test_results: List[Dict]
    ) -> Dict:
        """
        Versão síncrona do evaluate (para uso sem async).
        """
        import asyncio
        return asyncio.run(self.evaluate(agent, skill, test_results))


# ============================================
# RUBRICAS CUSTOMIZADAS POR TIPO DE AGENTE
# ============================================

SDR_RUBRIC = """
## RUBRICA SDR (Sales Development Representative)

### 1. QUALIFICAÇÃO BANT (30%)
- Budget: Descobre orçamento de forma consultiva
- Authority: Identifica decisor
- Need: Entende dor/necessidade
- Timeline: Identifica urgência

### 2. RAPPORT E TOM (25%)
- Personalização (usa nome)
- Empatia genuína
- Tom consultivo (não vendedor)
- Perguntas abertas

### 3. OBJEÇÕES (25%)
- Responde sem ser defensivo
- Transforma objeção em oportunidade
- Mantém conversa fluindo
- Não abandona frente a resistência

### 4. CONVERSÃO (20%)
- Direciona para agendamento/próximo passo
- CTA claro e natural
- Follow-up apropriado
- Não força fechamento
"""

SUPPORT_RUBRIC = """
## RUBRICA SUPORTE TÉCNICO

### 1. DIAGNÓSTICO (30%)
- Faz perguntas para entender problema
- Segue árvore de troubleshooting
- Não assume sem perguntar

### 2. SOLUÇÃO (30%)
- Fornece solução correta
- Explica de forma clara
- Oferece alternativas

### 3. EMPATIA (20%)
- Reconhece frustração do cliente
- Tom calmo e profissional
- Pede desculpas quando apropriado

### 4. ENCERRAMENTO (20%)
- Confirma que problema foi resolvido
- Oferece ajuda adicional
- Despedida cordial
"""

# Mapeamento de rubricas por tipo
RUBRIC_MAP = {
    'sdr': SDR_RUBRIC,
    'sales': SDR_RUBRIC,
    'support': SUPPORT_RUBRIC,
    'default': DEFAULT_RUBRIC
}


def get_rubric_for_agent_type(agent_type: str) -> str:
    """Retorna rubrica apropriada para o tipo de agente"""
    return RUBRIC_MAP.get(agent_type.lower(), DEFAULT_RUBRIC)
