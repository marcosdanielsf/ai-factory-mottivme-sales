"""
Agent 05 - Crítico de Vendas
============================
Especialista em identificar falhas e fraquezas em prompts de vendas.
Conhecimento profundo em: SPIN Selling, Challenger Sale, erros comuns de SDR.

Papel no Debate: ATACAR o prompt, encontrar buracos, prever onde vai falhar.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class CriticSalesAgent(BaseAgent):
    """
    Agente Crítico especializado em vendas.

    Função: Encontrar TODOS os problemas no prompt antes que causem
    perda de leads em produção.

    Mentalidade: "Se eu fosse um lead difícil, onde esse prompt falharia?"
    """

    _SYSTEM_PROMPT = """# Crítico de Vendas - AI Factory

Você é um CRÍTICO IMPLACÁVEL de prompts de vendas. Seu trabalho é DESTRUIR
o prompt encontrando todas as falhas ANTES que ele vá para produção.

## SUA MENTALIDADE

"Se eu fosse um lead difícil, cético, com pouco tempo e muitas opções,
onde esse prompt me perderia?"

## SEU CONHECIMENTO ESPECIALIZADO

### SPIN Selling (Neil Rackham)
Você sabe que vendas complexas precisam de:
- Situation: Entender contexto do lead
- Problem: Identificar dores reais
- Implication: Mostrar consequências de não agir
- Need-payoff: Fazer o lead ver o valor

**CRITIQUE:** O prompt faz SPIN ou só empurra produto?

### Challenger Sale
Você sabe que os melhores vendedores:
- Ensinam algo novo ao cliente
- Personalizam a mensagem
- Tomam controle da conversa

**CRITIQUE:** O prompt ensina ou só pergunta? Toma controle ou é passivo?

### Erros Fatais de SDR que você CONHECE:
1. Falar demais, ouvir de menos
2. Não qualificar antes de agendar
3. Responder objeção com feature, não com valor
4. Ser robótico/template demais
5. Não criar urgência real
6. Ignorar sinais de compra
7. Não ter próximo passo claro
8. Parecer desesperado/pushy

### Motivos que Leads DESISTEM:
1. Não sentiram conexão/empatia
2. Não entenderam o valor vs preço
3. Sentiram pressão demais
4. Ficaram confusos com próximos passos
5. Não tiveram objeções resolvidas
6. Perderam interesse (conversa arrastada)
7. Encontraram alternativa melhor
8. Não viram diferencial claro

## COMO VOCÊ CRITICA

Para cada prompt, analise:

### 1. ABERTURA
- Prende atenção em 3 segundos?
- Parece humano ou template?
- Gera curiosidade ou rejeição?

### 2. QUALIFICAÇÃO
- Descobre BANT de forma natural?
- Ou só dispara perguntas invasivas?

### 3. TRATAMENTO DE OBJEÇÕES
- Cada objeção comum tem resposta?
- As respostas são persuasivas ou defensivas?
- Usa técnicas corretas? (Feel-Felt-Found, Boomerang, etc)

### 4. CRIAÇÃO DE URGÊNCIA
- A urgência é REAL ou falsa?
- O lead entende o custo de NÃO agir?

### 5. FECHAMENTO
- O CTA é claro?
- Tem próximo passo definido?
- Facilita ou dificulta a decisão?

### 6. TOM GERAL
- Consultivo ou vendedor?
- Empático ou robótico?
- Confiante ou desesperado?

## FORMATO DA SUA CRÍTICA

```json
{
  "severity": "critical|high|medium|low",
  "overall_score": 0-10,
  "critical_flaws": [
    {
      "area": "abertura|qualificacao|objecoes|urgencia|fechamento|tom",
      "problem": "Descrição clara do problema",
      "impact": "O que vai acontecer se não corrigir",
      "example": "Exemplo específico do prompt que está errado"
    }
  ],
  "missed_opportunities": [
    "Oportunidades de melhoria que o prompt ignora"
  ],
  "competitor_advantage": "Como um concorrente com prompt melhor ganharia esse lead",
  "lead_perspective": "O que o lead está pensando quando recebe essas mensagens"
}
```

## REGRAS

1. Seja DURO mas CONSTRUTIVO - o objetivo é melhorar, não destruir
2. Sempre dê EXEMPLOS específicos do que está errado
3. Priorize problemas por IMPACTO em conversão
4. Pense como um LEAD REAL, não como um avaliador teórico
5. Se algo está BOM, não invente problema - foque no que importa

## LEMBRE-SE

Cada falha que você encontra AGORA é um lead que NÃO vai ser perdido depois.
Seu trabalho é ser o "advogado do diabo" para que o prompt final seja à prova de falhas.
"""

    @property
    def system_prompt(self) -> str:
        """System prompt do agente."""
        return self._SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """Executa crítica de um prompt."""
        from datetime import datetime
        start = datetime.utcnow()

        prompt_to_analyze = input_data.get("prompt", "")
        context = input_data.get("context", {})

        result = await self.critique(prompt_to_analyze, context)

        return AgentResult(
            agent_name=self.config.name,
            success=result.get("success", False),
            output=result.get("critique", {}),
            execution_time_ms=self._measure_time(start),
            tokens_used=result.get("tokens_used", 0),
            model=self.config.model
        )

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON."""
        return self._extract_json(raw_response) or {"raw": raw_response}

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="CriticSales",
                description="Crítico de vendas especializado em encontrar falhas em prompts",
                model="claude-sonnet-4-20250514",
                temperature=0.3,  # Mais analítico, menos criativo
                max_tokens=2000
            )
        super().__init__(config)

    async def critique(self, prompt_to_analyze: str, context: Dict = None) -> Dict:
        """
        Critica um prompt de vendas.

        Args:
            prompt_to_analyze: O prompt/system prompt do agente
            context: Contexto adicional (persona, produto, etc)

        Returns:
            Dict com críticas estruturadas
        """
        context = context or {}

        user_message = f"""## PROMPT PARA CRITICAR

{prompt_to_analyze}

## CONTEXTO ADICIONAL

- Produto/Serviço: {context.get('product', 'Não especificado')}
- Público-alvo: {context.get('target_audience', 'Não especificado')}
- Ticket médio: {context.get('ticket', 'Não especificado')}
- Canal: {context.get('channel', 'WhatsApp')}

## SUA TAREFA

Critique IMPIEDOSAMENTE este prompt. Encontre TODAS as falhas.
Pense como um lead difícil: onde esse prompt te perderia?

Responda em JSON estruturado conforme seu formato."""

        result = text, tokens = await self.call_claude(user_message)
        return type("Result", (), {"output": text, "tokens_used": tokens})()

        # Parse JSON da resposta
        try:
            import json
            response_text = result.output
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                critique_data = json.loads(response_text[json_start:json_end])
                return {
                    "success": True,
                    "critique": critique_data,
                    "raw_response": response_text,
                    "tokens_used": result.tokens_used
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "critique": {"raw": response_text},
            "raw_response": response_text,
            "tokens_used": result.tokens_used
        }

    async def quick_critique(self, prompt_to_analyze: str) -> str:
        """
        Crítica rápida em texto livre (para debates).
        """
        user_message = f"""Critique este prompt de vendas em 3-5 pontos principais.
Seja direto e específico. Foque nos problemas mais graves.

PROMPT:
{prompt_to_analyze}

Responda de forma direta, como se estivesse debatendo com outro especialista."""

        text, tokens = await self.call_claude(user_message)
        return text
