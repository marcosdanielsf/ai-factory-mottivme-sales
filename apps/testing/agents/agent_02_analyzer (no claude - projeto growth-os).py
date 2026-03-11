"""
Agent 02 - Analisador de Vendas (Head de Vendas)
================================================
Analisa conversas e classifica leads usando framework BANT.
Equivalente ao Workflow 02 do n8n (AI Agent Head Vendas).
"""

import logging
from typing import Dict, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class SalesAnalyzerAgent(BaseAgent):
    """
    Agente Head de Vendas que analisa e classifica leads.

    Inputs (da memória compartilhada ou direto):
    - contact_data: Dados do contato
    - conversation_data: Histórico de mensagens
    - business_context: Contexto do negócio (opcional)

    Outputs:
    - classification: HOT/WARM/COLD/DISQUALIFIED
    - bant_analysis: Análise BANT completa
    - score: Score numérico (0-100)
    - recommendations: Próximos passos
    """

    SYSTEM_PROMPT = """# Head de Vendas - Analista de Leads

Você é um Head de Vendas experiente especializado em qualificação de leads B2C de alto ticket.

## Sua Missão

Analisar conversas de leads e fornecer uma avaliação completa usando o framework BANT, classificando a qualidade e indicando próximos passos.

## Framework BANT

### Budget (Orçamento) - 25 pontos
Avalie a capacidade financeira do lead:
- **25pts**: Orçamento confirmado e compatível
- **20pts**: Indicou poder pagar, sem objeção de preço
- **15pts**: Perguntou preço mas não objetou
- **10pts**: Mencionou preocupação com preço
- **5pts**: Forte objeção de preço
- **0pts**: Claramente sem condições

### Authority (Autoridade) - 25 pontos
Quem toma a decisão:
- **25pts**: É o decisor final
- **20pts**: Decisor com leve influência externa
- **15pts**: Precisa consultar alguém mas tem influência
- **10pts**: Precisa aprovação de terceiros
- **5pts**: Apenas pesquisando para outros
- **0pts**: Sem autoridade alguma

### Need (Necessidade) - 25 pontos
Quão urgente é a dor/necessidade:
- **25pts**: Dor clara, urgente, bem articulada
- **20pts**: Dor identificada, busca ativa por solução
- **15pts**: Reconhece problema, interesse moderado
- **10pts**: Problema vago, interesse superficial
- **5pts**: Sem dor clara, curiosidade apenas
- **0pts**: Sem necessidade identificada

### Timeline (Cronograma) - 25 pontos
Quando pretende resolver:
- **25pts**: Quer resolver imediatamente (1-7 dias)
- **20pts**: Próximas 2-4 semanas
- **15pts**: Próximos 1-2 meses
- **10pts**: Próximos 3-6 meses
- **5pts**: Sem prazo definido
- **0pts**: "Algum dia" / não planeja

## Classificação Final

Baseado no score total (0-100):
- **HOT (80-100)**: Lead pronto para fechar
- **WARM (50-79)**: Lead qualificado, precisa nurturing
- **COLD (20-49)**: Lead com potencial baixo
- **DISQUALIFIED (0-19)**: Não é público-alvo

## Formato de Saída

```json
{
    "classification": "HOT/WARM/COLD/DISQUALIFIED",
    "score_total": 75,
    "bant": {
        "budget": {
            "score": 20,
            "evidence": "Perguntou preço sem objeção",
            "notes": "Mencionou que investe em saúde"
        },
        "authority": {
            "score": 15,
            "evidence": "Precisa falar com marido",
            "notes": "Parece ter influência na decisão"
        },
        "need": {
            "score": 25,
            "evidence": "Sintomas claros de menopausa",
            "notes": "Dor bem articulada, busca ativa"
        },
        "timeline": {
            "score": 15,
            "evidence": "Quer resolver em breve",
            "notes": "Sem data específica"
        }
    },
    "analysis": {
        "main_interest": "Tratamento hormonal para menopausa",
        "pain_points": ["Ondas de calor", "Insônia", "Cansaço"],
        "objections": ["Precisa falar com marido"],
        "positive_signals": ["Engajada", "Fez perguntas específicas"],
        "negative_signals": [],
        "conversation_quality": "high/medium/low"
    },
    "recommendations": {
        "next_action": "Agendar consulta",
        "approach": "Oferecer horário específico, destacar benefícios",
        "talking_points": ["Mencionar cases de sucesso", "Reforçar expertise"],
        "avoid": ["Pressionar demais", "Falar de preço antes do valor"],
        "urgency": "high/medium/low"
    },
    "summary": "Lead qualificada com alta necessidade. Principal barreira é aprovação do marido. Recomendo abordagem consultiva focando nos benefícios de saúde e qualidade de vida."
}
```

## Regras Importantes

1. **Seja objetivo**: Baseie-se apenas nas evidências da conversa
2. **Não invente**: Se não há evidência, indique "Não identificado"
3. **Considere contexto**: Ticket alto requer análise mais criteriosa
4. **Foco em ação**: Recomendações devem ser práticas e aplicáveis
"""

    def __init__(
        self,
        config: AgentConfig = None,
        api_key: str = None,
        shared_memory: Dict = None,
        business_context: Dict = None
    ):
        config = config or AgentConfig(
            name="SalesAnalyzer",
            description="Analisa e classifica leads usando BANT",
            model="claude-opus-4-20250514",
            temperature=0.5,
            max_tokens=4000
        )
        super().__init__(config, api_key, shared_memory)
        self.business_context = business_context or {}

    @property
    def system_prompt(self) -> str:
        # Adicionar contexto de negócio se disponível
        prompt = self.SYSTEM_PROMPT

        if self.business_context:
            context_str = f"""

## Contexto do Negócio

- **Empresa**: {self.business_context.get('company_name', 'N/A')}
- **Serviço**: {self.business_context.get('service', 'N/A')}
- **Ticket Médio**: {self.business_context.get('ticket', 'N/A')}
- **Público-Alvo**: {self.business_context.get('target_audience', 'N/A')}
- **Diferenciais**: {self.business_context.get('differentials', 'N/A')}
"""
            prompt += context_str

        return prompt

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa análise de vendas.

        Args:
            input_data: {
                "contact_data": Dict,
                "conversation_data": Dict,
                "analysis_data": Dict (opcional - do Agent 01),
                "context_data": Dict (opcional - do Agent 01)
            }
        """
        start_time = datetime.utcnow()

        try:
            # Obter dados da memória compartilhada ou input direto
            contact_data = input_data.get('contact_data') or self.get_from_memory('contact_data', {})
            conversation_data = input_data.get('conversation_data') or self.get_from_memory('conversation_data', {})
            analysis_data = input_data.get('analysis_data') or self.get_from_memory('analysis_data', {})
            context_data = input_data.get('context_data') or self.get_from_memory('context_data', {})

            # Preparar prompt
            user_message = self._build_analysis_prompt(
                contact_data,
                conversation_data,
                analysis_data,
                context_data
            )

            # Chamar Claude Opus
            response_text, tokens_used = await self.call_claude(user_message)

            # Parsear resposta
            sales_analysis = self._parse_response(response_text)

            # Salvar na memória compartilhada
            self.set_in_memory('sales_analysis', sales_analysis)
            self.set_in_memory('lead_classification', sales_analysis.get('classification'))
            self.set_in_memory('lead_score', sales_analysis.get('score_total'))

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=sales_analysis,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=tokens_used,
                model=self.config.model,
                metadata={
                    'classification': sales_analysis.get('classification'),
                    'score': sales_analysis.get('score_total')
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"SalesAnalyzer failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    def _build_analysis_prompt(
        self,
        contact: Dict,
        conversation: Dict,
        analysis: Dict,
        context: Dict
    ) -> str:
        """Monta prompt para análise de vendas"""

        prompt = "Analise o seguinte lead e forneça uma avaliação BANT completa:\n\n"

        # Dados do contato
        if contact:
            prompt += f"""## Dados do Lead

- **Nome**: {contact.get('name', 'N/A')}
- **Telefone**: {contact.get('phone', 'N/A')}
- **Email**: {contact.get('email', 'N/A')}
- **Fonte**: {contact.get('source', 'N/A')}
- **Tags**: {', '.join(contact.get('tags', []))}

"""

        # Conversa
        if conversation and conversation.get('messages'):
            prompt += "## Histórico da Conversa\n\n"
            for msg in conversation['messages'][-25:]:  # Últimas 25
                role = msg.get('role', 'unknown').upper()
                content = msg.get('content', '')
                prompt += f"**{role}**: {content}\n\n"

        # Análise prévia (do Agent 01)
        if analysis:
            prompt += f"""## Análise Prévia

- **Interesse Principal**: {analysis.get('main_interest', 'N/A')}
- **Perguntas Feitas**: {', '.join(analysis.get('questions_asked', []))}
- **Objeções**: {', '.join(analysis.get('objections', []))}
- **Sinais Positivos**: {', '.join(analysis.get('interest_signals', []))}
- **Sinais Negativos**: {', '.join(analysis.get('disinterest_signals', []))}

"""

        # Contexto
        if context:
            prompt += f"""## Contexto Adicional

- **Resumo**: {context.get('summary', 'N/A')}
- **Estágio no Funil**: {context.get('funnel_stage', 'N/A')}
- **Prioridade Sugerida**: {context.get('priority', 'N/A')}

"""

        prompt += "\nRetorne a análise BANT completa em formato JSON conforme instruções."

        return prompt

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta do Claude"""
        parsed = self._extract_json(raw_response)

        if parsed:
            # Validar campos obrigatórios
            if 'classification' not in parsed:
                parsed['classification'] = self._infer_classification(parsed.get('score_total', 0))
            return parsed

        # Fallback
        logger.warning("Could not parse sales analysis, using fallback")
        return {
            'classification': 'COLD',
            'score_total': 30,
            'bant': {
                'budget': {'score': 10, 'evidence': 'Não identificado'},
                'authority': {'score': 10, 'evidence': 'Não identificado'},
                'need': {'score': 5, 'evidence': 'Não identificado'},
                'timeline': {'score': 5, 'evidence': 'Não identificado'}
            },
            'analysis': {
                'main_interest': 'Não identificado',
                'conversation_quality': 'low'
            },
            'recommendations': {
                'next_action': 'Revisar manualmente',
                'urgency': 'low'
            },
            'summary': raw_response[:500]
        }

    def _infer_classification(self, score: int) -> str:
        """Infere classificação baseado no score"""
        if score >= 80:
            return 'HOT'
        elif score >= 50:
            return 'WARM'
        elif score >= 20:
            return 'COLD'
        else:
            return 'DISQUALIFIED'
