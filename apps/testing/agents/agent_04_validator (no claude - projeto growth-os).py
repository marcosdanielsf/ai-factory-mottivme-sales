"""
Agent 04 - Validador (Testing Framework)
=========================================
Testa e valida agentes gerados usando LLM-as-Judge.
Equivalente ao Workflow 04 do n8n (Agent Tester).
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class ValidatorAgent(BaseAgent):
    """
    Agente que valida outros agentes através de testes automatizados.

    Inputs:
    - system_prompt: Prompt do agente a ser testado
    - test_cases: Casos de teste (ou usa default)
    - rubric: Rubrica de avaliação (ou usa default)

    Outputs:
    - overall_score: Score geral (0-10)
    - scores: Scores por dimensão
    - test_results: Resultados detalhados
    - recommendations: Melhorias sugeridas
    """

    SYSTEM_PROMPT = """# Validador de Agentes IA

Você é um especialista em avaliar agentes de IA para vendas e atendimento.
Sua tarefa é testar agentes simulando conversas e avaliando as respostas.

## Processo de Validação

1. **Simular Conversa**: Para cada caso de teste, simule a resposta do agente
2. **Avaliar Resposta**: Use a rubrica para pontuar cada dimensão
3. **Agregar Scores**: Calcule score geral com pesos
4. **Identificar Gaps**: Liste pontos fortes e fracos
5. **Recomendar Melhorias**: Sugira ações específicas

## Rubrica Padrão (5 Dimensões)

### 1. COMPLETENESS (25%)
O agente coleta informações de qualificação (BANT)?
- 10: BANT completo de forma natural
- 7-9: 3 de 4 elementos
- 4-6: 2 de 4 elementos
- 1-3: Apenas 1 elemento
- 0: Sem qualificação

### 2. TONE (20%)
Tom consultivo, empático e não-pushy?
- 10: Tom perfeito
- 7-9: Bom com pequenas melhorias
- 4-6: Aceitável mas robótico
- 1-3: Inadequado
- 0: Completamente errado

### 3. ENGAGEMENT (20%)
Lead continua engajado? Perguntas relevantes?
- 10: Altamente engajado
- 7-9: Bom engajamento
- 4-6: Médio
- 1-3: Desengajado
- 0: Lead irritado/abandonou

### 4. COMPLIANCE (20%)
Segue regras e guardrails?
- 10: 100% compliance
- 7-9: Maioria das regras
- 4-6: Alguns desvios
- 1-3: Vários desvios
- 0: Ignora regras

### 5. CONVERSION (15%)
Direciona para o objetivo?
- 10: Converte naturalmente
- 7-9: Próximo de converter
- 4-6: Tenta mas falha
- 1-3: Não direciona
- 0: Afasta do objetivo

## Formato de Saída

```json
{
    "overall_score": 8.5,
    "passed": true,
    "scores": {
        "completeness": 9.0,
        "tone": 8.5,
        "engagement": 8.0,
        "compliance": 9.0,
        "conversion": 7.5
    },
    "test_results": [
        {
            "name": "Test 1",
            "input": "Oi",
            "simulated_response": "Olá! Tudo bem...",
            "score": 8.5,
            "feedback": "Tom acolhedor, boa pergunta aberta",
            "passed": true
        }
    ],
    "strengths": [
        "Tom consultivo excelente",
        "Qualificação natural"
    ],
    "weaknesses": [
        "Poderia ser mais específico em X"
    ],
    "failures": [],
    "recommendations": [
        "Adicionar mais prova social",
        "Melhorar tratamento de objeção de preço"
    ],
    "approval_status": "approved/needs_improvement/rejected"
}
```

## Critérios de Aprovação
- **Approved**: Score >= 8.0 e sem failures críticos
- **Needs Improvement**: Score >= 6.0 ou 1-2 failures não-críticos
- **Rejected**: Score < 6.0 ou failures críticos
"""

    DEFAULT_TEST_CASES = [
        {
            'name': 'Lead frio - primeira mensagem',
            'input': 'Oi',
            'expected_behavior': 'Saudação acolhedora + pergunta aberta'
        },
        {
            'name': 'Pergunta sobre preço',
            'input': 'Quanto custa?',
            'expected_behavior': 'Âncora valor + qualificação, não dar preço direto'
        },
        {
            'name': 'Objeção de preço',
            'input': 'Está muito caro',
            'expected_behavior': 'Empatia + reforçar valor + não dar desconto'
        },
        {
            'name': 'Precisa consultar terceiro',
            'input': 'Preciso falar com meu marido',
            'expected_behavior': 'Respeitar + manter conversa + sugerir incluir'
        },
        {
            'name': 'Resposta monossilábica',
            'input': 'Ok',
            'expected_behavior': 'Avançar com nova pergunta, não repetir'
        },
        {
            'name': 'Pronto para agendar',
            'input': 'Quero agendar',
            'expected_behavior': 'Entusiasmo + oferecer horários + próximos passos'
        },
        {
            'name': 'Pergunta fora do escopo',
            'input': 'Vocês fazem cirurgia plástica?',
            'expected_behavior': 'Redirecionar gentilmente para serviços oferecidos'
        },
        {
            'name': 'Lead desconfiado',
            'input': 'Será que funciona mesmo?',
            'expected_behavior': 'Prova social + cases + confiança sem pressão'
        }
    ]

    def __init__(
        self,
        config: AgentConfig = None,
        api_key: str = None,
        shared_memory: Dict = None
    ):
        config = config or AgentConfig(
            name="Validator",
            description="Testa e valida agentes",
            model="claude-opus-4-20250514",
            temperature=0.3,
            max_tokens=4000
        )
        super().__init__(config, api_key, shared_memory)

    @property
    def system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa validação de um agente.

        Args:
            input_data: {
                "system_prompt": str (obrigatório),
                "agent_name": str,
                "test_cases": List[Dict] (opcional),
                "rubric": str (opcional),
                "threshold": float (default 8.0)
            }
        """
        start_time = datetime.utcnow()

        try:
            agent_prompt = input_data.get('system_prompt') or self.get_from_memory('generated_prompt')
            if not agent_prompt:
                raise ValueError("system_prompt is required")

            agent_name = input_data.get('agent_name', 'Agent')
            test_cases = input_data.get('test_cases') or self.get_from_memory('test_cases') or self.DEFAULT_TEST_CASES
            rubric = input_data.get('rubric')
            threshold = input_data.get('threshold', 8.0)

            # Simular respostas e avaliar
            test_results = await self._run_tests(agent_prompt, test_cases)

            # Avaliar resultados
            evaluation = await self._evaluate_results(
                agent_prompt=agent_prompt,
                agent_name=agent_name,
                test_results=test_results,
                rubric=rubric
            )

            # Determinar status de aprovação
            overall_score = evaluation.get('overall_score', 0)
            failures = evaluation.get('failures', [])

            if overall_score >= threshold and not failures:
                approval_status = 'approved'
            elif overall_score >= 6.0 and len(failures) <= 2:
                approval_status = 'needs_improvement'
            else:
                approval_status = 'rejected'

            evaluation['approval_status'] = approval_status
            evaluation['passed'] = approval_status == 'approved'

            # Salvar na memória
            self.set_in_memory('validation_result', evaluation)
            self.set_in_memory('agent_approved', evaluation['passed'])

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=evaluation,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=evaluation.get('tokens_used', 0),
                model=self.config.model,
                metadata={
                    'overall_score': overall_score,
                    'approval_status': approval_status,
                    'tests_run': len(test_results)
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"Validator failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    async def _run_tests(
        self,
        agent_prompt: str,
        test_cases: List[Dict]
    ) -> List[Dict]:
        """Simula respostas do agente para cada caso de teste"""

        results = []

        for test in test_cases:
            # Simular resposta do agente
            simulated_response, tokens = await self._simulate_agent(
                agent_prompt=agent_prompt,
                user_input=test['input']
            )

            results.append({
                'name': test.get('name', 'Test'),
                'input': test['input'],
                'expected_behavior': test.get('expected_behavior', ''),
                'simulated_response': simulated_response,
                'tokens_used': tokens
            })

        return results

    async def _simulate_agent(
        self,
        agent_prompt: str,
        user_input: str
    ) -> tuple[str, int]:
        """Simula resposta de um agente"""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Usar Sonnet para simulação
                max_tokens=500,
                temperature=0.7,
                system=agent_prompt,
                messages=[{"role": "user", "content": user_input}]
            )

            response_text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens

            return response_text, tokens

        except Exception as e:
            logger.error(f"Error simulating agent: {e}")
            return f"[ERROR: {str(e)}]", 0

    async def _evaluate_results(
        self,
        agent_prompt: str,
        agent_name: str,
        test_results: List[Dict],
        rubric: str = None
    ) -> Dict:
        """Avalia resultados dos testes usando Claude Opus"""

        # Montar prompt de avaliação
        eval_prompt = f"""Avalie o seguinte agente com base nos resultados dos testes:

## Agente: {agent_name}

## System Prompt (Resumo)
```
{agent_prompt[:2000]}
```

## Resultados dos Testes

"""
        for i, test in enumerate(test_results, 1):
            eval_prompt += f"""
### Teste {i}: {test['name']}

**Input do Lead:** {test['input']}

**Resposta do Agente:**
{test['simulated_response']}

**Comportamento Esperado:** {test['expected_behavior']}

---
"""

        eval_prompt += """
## Instruções

1. Avalie cada resposta contra o comportamento esperado
2. Pontue cada dimensão da rubrica (0-10)
3. Identifique pontos fortes e fracos
4. Sugira melhorias específicas
5. Retorne avaliação em formato JSON
"""

        # Chamar Claude Opus para avaliação
        response_text, tokens_used = await self.call_claude(eval_prompt)

        # Parsear resultado
        evaluation = self._parse_response(response_text)
        evaluation['tokens_used'] = tokens_used

        return evaluation

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta de avaliação"""
        parsed = self._extract_json(raw_response)

        if parsed:
            # Garantir campos obrigatórios
            if 'overall_score' not in parsed:
                scores = parsed.get('scores', {})
                if scores:
                    weights = {'completeness': 0.25, 'tone': 0.20, 'engagement': 0.20, 'compliance': 0.20, 'conversion': 0.15}
                    total = sum(scores.get(k, 5) * v for k, v in weights.items())
                    parsed['overall_score'] = round(total, 2)
                else:
                    parsed['overall_score'] = 5.0

            return parsed

        # Fallback
        logger.warning("Could not parse evaluation, using fallback")
        return {
            'overall_score': 5.0,
            'passed': False,
            'scores': {
                'completeness': 5.0,
                'tone': 5.0,
                'engagement': 5.0,
                'compliance': 5.0,
                'conversion': 5.0
            },
            'strengths': [],
            'weaknesses': ['Avaliação automática falhou'],
            'failures': [],
            'recommendations': ['Revisar manualmente'],
            'approval_status': 'needs_improvement'
        }
