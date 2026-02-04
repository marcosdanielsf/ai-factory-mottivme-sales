"""
Agent 03 - Gerador de Prompts (Prompt Factory)
==============================================
Cria e otimiza system prompts para agentes conversacionais.
Equivalente ao Workflow 03 do n8n (Prompt Factory).
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class PromptGeneratorAgent(BaseAgent):
    """
    Agente que gera system prompts otimizados para chatbots/SDR bots.

    Inputs:
    - business_config: Configuração do negócio
    - sales_analysis: Análise de vendas (do Agent 02)
    - existing_prompt: Prompt existente para otimizar (opcional)
    - target_scores: Scores alvo por dimensão (opcional)

    Outputs:
    - system_prompt: Prompt gerado
    - tools_config: Configuração de ferramentas
    - test_cases: Casos de teste sugeridos
    - metadata: Metadados do prompt
    """

    SYSTEM_PROMPT = """# Prompt Factory - Gerador de Prompts de Alta Performance

Você é um especialista em criar system prompts para chatbots de vendas e SDR.
Seu objetivo é gerar prompts que maximizem conversão mantendo qualidade consultiva.

## Frameworks que Você Domina

### 1. Protocolo do Prompt Foda
- **PERSONA**: Definição cirúrgica de quem é o bot
- **META (Prime Directive)**: Único objetivo mensurável
- **PROTOCOLO**: Chain of Thought step-by-step
- **GUARDRAILS**: Regras afirmativas (não use "não faça X")
- **FEW-SHOT**: Exemplos de conversas ideais

### 2. BANT para Qualificação
- Budget: Descobrir capacidade de investimento
- Authority: Identificar decisor
- Need: Entender dor/necessidade
- Timeline: Identificar urgência

### 3. Técnicas de Persuasão
- NEPQ (Neuro-Emotional Persuasion Questions)
- Dale Carnegie principles
- No-Go Sales (sem pressão)
- Storytelling e prova social

## Estrutura do Prompt Gerado

```markdown
### 0. PRIME DIRECTIVE ###
[Único objetivo mensurável - o que define sucesso]

### 1. PERSONA E CONTEXTO ###
[Quem é o agente, tom de voz, personalidade]

### 2. INFORMAÇÕES DO NEGÓCIO ###
[Dados factuais: preços, endereços, horários, etc]

### 3. PROTOCOLO DE CONDUÇÃO ###
[Step-by-step de como conduzir conversa]

### 4. QUALIFICAÇÃO BANT ###
[Perguntas e técnicas para cada dimensão]

### 5. TRATAMENTO DE OBJEÇÕES ###
[Respostas para objeções comuns]

### 6. REGRAS E GUARDRAILS ###
[Regras afirmativas que o agente DEVE seguir]

### 7. EXEMPLOS (FEW-SHOT) ###
[2-3 conversas exemplo]

### 8. REGRA ANTI-LOOP ###
[Como evitar repetição com respostas monossilábicas]
```

## Regras para Geração

1. **Tom consultivo**: Nunca vendedor/pushy
2. **Linguagem afirmativa**: "Faça X" ao invés de "Não faça Y"
3. **Específico**: Use Custom Values do cliente
4. **Testável**: Prompt deve ser validável com casos de teste
5. **Adaptativo**: Considere diferentes tipos de lead

## Formato de Saída

```json
{
    "system_prompt": "string (o prompt completo)",
    "version": "1.0",
    "agent_name": "string",
    "objective": "string",
    "tools_config": {
        "calendar_link": "string",
        "payment_link": "string",
        "faq_enabled": boolean
    },
    "test_cases": [
        {
            "name": "string",
            "input": "string",
            "expected_behavior": "string"
        }
    ],
    "metadata": {
        "target_audience": "string",
        "tone": "string",
        "avg_response_length": "short/medium/long",
        "created_at": "datetime"
    }
}
```
"""

    def __init__(
        self,
        config: AgentConfig = None,
        api_key: str = None,
        shared_memory: Dict = None
    ):
        config = config or AgentConfig(
            name="PromptGenerator",
            description="Gera system prompts otimizados",
            model="claude-opus-4-20250514",
            temperature=0.7,
            max_tokens=8000
        )
        super().__init__(config, api_key, shared_memory)

    @property
    def system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa geração de prompt.

        Args:
            input_data: {
                "business_config": Dict (obrigatório),
                "sales_analysis": Dict (opcional - do Agent 02),
                "existing_prompt": str (opcional - para otimização),
                "target_scores": Dict (opcional),
                "agent_name": str (opcional)
            }
        """
        start_time = datetime.utcnow()

        try:
            business_config = input_data.get('business_config', {})
            sales_analysis = input_data.get('sales_analysis') or self.get_from_memory('sales_analysis', {})
            existing_prompt = input_data.get('existing_prompt')
            target_scores = input_data.get('target_scores', {})
            agent_name = input_data.get('agent_name', 'Assistente')

            if not business_config:
                raise ValueError("business_config is required")

            # Preparar prompt
            user_message = self._build_generation_prompt(
                business_config=business_config,
                sales_analysis=sales_analysis,
                existing_prompt=existing_prompt,
                target_scores=target_scores,
                agent_name=agent_name
            )

            # Chamar Claude Opus
            response_text, tokens_used = await self.call_claude(user_message)

            # Parsear resposta
            generated = self._parse_response(response_text)

            # Adicionar metadados
            generated['metadata'] = generated.get('metadata', {})
            generated['metadata']['created_at'] = datetime.utcnow().isoformat()
            generated['metadata']['tokens_used'] = tokens_used

            # Salvar na memória compartilhada
            self.set_in_memory('generated_prompt', generated.get('system_prompt'))
            self.set_in_memory('tools_config', generated.get('tools_config'))
            self.set_in_memory('test_cases', generated.get('test_cases'))

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=generated,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=tokens_used,
                model=self.config.model,
                metadata={
                    'agent_name': generated.get('agent_name'),
                    'version': generated.get('version'),
                    'prompt_length': len(generated.get('system_prompt', ''))
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"PromptGenerator failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    def _build_generation_prompt(
        self,
        business_config: Dict,
        sales_analysis: Dict,
        existing_prompt: str,
        target_scores: Dict,
        agent_name: str
    ) -> str:
        """Monta prompt para geração"""

        prompt = f"Gere um system prompt de alta performance para o seguinte contexto:\n\n"

        # Configuração do negócio
        prompt += f"""## Configuração do Negócio

- **Nome do Agente**: {agent_name}
- **Empresa**: {business_config.get('company_name', 'N/A')}
- **Serviço/Produto**: {business_config.get('service', 'N/A')}
- **Ticket Médio**: {business_config.get('ticket', 'N/A')}
- **Público-Alvo**: {business_config.get('target_audience', 'N/A')}

### Informações de Contato
- **Endereço(s)**: {business_config.get('addresses', 'N/A')}
- **Horários**: {business_config.get('hours', 'N/A')}
- **Telefone**: {business_config.get('phone', 'N/A')}

### Preços e Pagamento
- **Valor da Consulta**: {business_config.get('consultation_price', 'N/A')}
- **Formas de Pagamento**: {business_config.get('payment_methods', 'N/A')}
- **Link de Agendamento**: {business_config.get('calendar_link', 'N/A')}

### Diferenciais
{business_config.get('differentials', 'N/A')}

### Objeções Comuns
{business_config.get('common_objections', 'N/A')}

"""

        # Análise de vendas (insights)
        if sales_analysis:
            prompt += f"""## Insights da Análise de Vendas

- **Classificação Típica**: {sales_analysis.get('classification', 'N/A')}
- **Score Médio**: {sales_analysis.get('score_total', 'N/A')}
- **Principais Dores**: {sales_analysis.get('analysis', {}).get('pain_points', 'N/A')}
- **Objeções Frequentes**: {sales_analysis.get('analysis', {}).get('objections', 'N/A')}

"""

        # Prompt existente (para otimização)
        if existing_prompt:
            prompt += f"""## Prompt Existente (para otimização)

```
{existing_prompt[:3000]}
```

### O que melhorar:
- Analise pontos fracos
- Mantenha o que funciona
- Adicione elementos faltantes

"""

        # Scores alvo
        if target_scores:
            prompt += f"""## Scores Alvo

- Completeness: {target_scores.get('completeness', '9+')}
- Tone: {target_scores.get('tone', '9+')}
- Engagement: {target_scores.get('engagement', '8+')}
- Compliance: {target_scores.get('compliance', '9+')}
- Conversion: {target_scores.get('conversion', '8+')}

"""

        prompt += """
## Instruções Finais

1. Gere um prompt COMPLETO seguindo a estrutura indicada
2. Use linguagem AFIRMATIVA (não use "não faça X")
3. Inclua pelo menos 2 exemplos Few-Shot
4. Adicione regra anti-loop para respostas monossilábicas
5. Retorne em formato JSON conforme especificado
"""

        return prompt

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta do Claude"""
        parsed = self._extract_json(raw_response)

        if parsed and 'system_prompt' in parsed:
            return parsed

        # Se não conseguiu parsear JSON, tratar como prompt puro
        logger.warning("Could not parse as JSON, treating as raw prompt")
        return {
            'system_prompt': raw_response,
            'version': '1.0',
            'agent_name': 'Assistente',
            'objective': 'Qualificar leads e agendar consultas',
            'tools_config': {},
            'test_cases': [],
            'metadata': {}
        }

    async def optimize_prompt(
        self,
        current_prompt: str,
        test_results: Dict,
        target_improvements: List[str]
    ) -> AgentResult:
        """
        Otimiza um prompt existente baseado em resultados de teste.

        Args:
            current_prompt: Prompt atual
            test_results: Resultados do Testing Framework
            target_improvements: Lista de melhorias desejadas
        """
        optimization_prompt = f"""# Otimização de Prompt

## Prompt Atual
```
{current_prompt}
```

## Resultados do Teste
- Score Geral: {test_results.get('overall_score', 'N/A')}
- Scores: {test_results.get('scores', {})}
- Pontos Fracos: {test_results.get('weaknesses', [])}
- Falhas: {test_results.get('failures', [])}

## Melhorias Desejadas
{chr(10).join(f'- {imp}' for imp in target_improvements)}

## Tarefa
Gere uma versão otimizada do prompt que:
1. Corrija os pontos fracos identificados
2. Mantenha os pontos fortes
3. Implemente as melhorias desejadas
4. Aumente o score geral

Retorne o prompt otimizado em formato JSON.
"""

        response_text, tokens_used = await self.call_claude(optimization_prompt)
        return self._parse_response(response_text)
