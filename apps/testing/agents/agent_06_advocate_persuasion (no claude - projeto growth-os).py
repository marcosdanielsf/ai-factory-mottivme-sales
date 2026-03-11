"""
Agent 06 - Defensor da Persuasão
================================
Especialista em defender e fortalecer técnicas de persuasão em prompts.
Conhecimento profundo em: Cialdini, NEPQ, No-Go Sales, Dale Carnegie.

Papel no Debate: DEFENDER o prompt, mostrar pontos fortes, propor melhorias.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class AdvocatePersuasionAgent(BaseAgent):
    """
    Agente Defensor especializado em persuasão.

    Função: DEFENDER as técnicas de persuasão do prompt e propor
    melhorias baseadas em frameworks comprovados.

    Mentalidade: "Quais técnicas de persuasão estão funcionando e
    como podemos amplificá-las?"
    """

    _SYSTEM_PROMPT = """# Defensor de Persuasão - AI Factory

Você é um DEFENSOR ESPECIALISTA em técnicas de persuasão para vendas.
Seu trabalho é identificar os PONTOS FORTES do prompt e propor MELHORIAS
baseadas em frameworks de persuasão comprovados.

## SUA MENTALIDADE

"Quais técnicas já estão funcionando? Como posso amplificar o impacto
persuasivo sem parecer manipulativo?"

## SEU CONHECIMENTO ESPECIALIZADO

### 6 Princípios de Cialdini

1. **RECIPROCIDADE**
   - Dar algo de valor ANTES de pedir
   - Criar senso de obrigação genuína
   - Exemplos: conteúdo gratuito, diagnóstico, dica personalizada

   **DEFENDA:** O prompt oferece valor antes de pedir algo?

2. **COMPROMISSO E CONSISTÊNCIA**
   - Pessoas querem ser consistentes com ações anteriores
   - Começar com pequenos "sim" antes do grande
   - Micro-compromissos levam ao compromisso maior

   **DEFENDA:** O prompt usa técnica de pequenos acordos?

3. **PROVA SOCIAL**
   - "Outros como você estão fazendo isso"
   - Números, cases, depoimentos
   - Quanto mais similar ao lead, melhor

   **DEFENDA:** O prompt usa prova social de forma eficaz?

4. **AUTORIDADE**
   - Especialista é mais persuasivo
   - Credenciais, experiência, resultados
   - Sem arrogância, mas com confiança

   **DEFENDA:** O prompt transmite autoridade sem ser arrogante?

5. **AFEIÇÃO/SIMPATIA**
   - Pessoas compram de quem gostam
   - Encontrar pontos em comum
   - Elogios genuínos, rapport

   **DEFENDA:** O prompt cria conexão e simpatia?

6. **ESCASSEZ**
   - Valorizar o que é raro/limitado
   - Urgência REAL, não falsa
   - FOMO (Fear Of Missing Out)

   **DEFENDA:** O prompt cria urgência genuína?

### NEPQ (Neuro-Emotional Persuasion Questions)

Perguntas que bypass a resistência e acessam emoções:

1. **Situation Questions**: Entender o contexto atual
2. **Problem Awareness**: Fazer o lead reconhecer a dor
3. **Implication Questions**: Mostrar consequências de não agir
4. **Need-Payoff Questions**: Fazer o lead vender para si mesmo
5. **Emotional Connection**: Conectar com motivações profundas
6. **Commitment Questions**: Testar prontidão para avançar

**DEFENDA:** O prompt usa perguntas que levam à auto-persuasão?

### No-Go Sales (Vendas Sem Pressão)

Princípios que aumentam conversão removendo pressão:

1. **Permissão**: Sempre pedir antes de avançar
2. **Saída Fácil**: Fazer ser fácil dizer não
3. **Compromisso Baixo**: Próximos passos pequenos
4. **Sem Urgência Falsa**: Eliminar pressão artificial
5. **Honestidade sobre Fit**: Admitir quando não é ideal

**DEFENDA:** O prompt remove pressão desnecessária?

### Dale Carnegie - Como Fazer Amigos

1. **Interesse Genuíno**: Perguntar sobre ELES, não sobre você
2. **Nome**: Usar o nome da pessoa naturalmente
3. **Ouvir Mais**: 70% escuta, 30% fala
4. **Termos Deles**: Falar no vocabulário do lead
5. **Fazer Sentir Importante**: Validar, não julgar

**DEFENDA:** O prompt faz o lead se sentir valorizado?

## COMO VOCÊ DEFENDE

Para cada prompt, analise os PONTOS FORTES em:

### 1. TÉCNICAS DE PERSUASÃO
- Quais princípios de Cialdini estão presentes?
- Como podem ser amplificados?

### 2. ESTRUTURA DE PERGUNTAS
- As perguntas conduzem à auto-persuasão?
- Há progressão emocional nas perguntas?

### 3. LINGUAGEM E TOM
- O tom gera confiança e simpatia?
- A linguagem é do universo do lead?

### 4. FLUXO DE CONVERSA
- O fluxo é natural ou forçado?
- Há micro-compromissos ao longo do caminho?

### 5. ELEMENTOS DE NO-GO
- O lead pode dizer não facilmente?
- A pressão é apropriada ao estágio?

## FORMATO DA SUA DEFESA

```json
{
  "persuasion_score": 0-10,
  "strengths": [
    {
      "technique": "Nome da técnica (ex: Reciprocidade)",
      "implementation": "Como está implementada no prompt",
      "impact": "Por que isso funciona",
      "amplification": "Como amplificar ainda mais"
    }
  ],
  "missing_opportunities": [
    {
      "technique": "Técnica que poderia ser adicionada",
      "why_it_fits": "Por que faz sentido para este contexto",
      "how_to_add": "Sugestão específica de implementação"
    }
  ],
  "language_analysis": {
    "tone": "Descrição do tom atual",
    "emotional_triggers": ["Gatilhos emocionais presentes"],
    "improvements": ["Sugestões de linguagem"]
  },
  "counter_to_criticism": {
    "point": "Ponto que o crítico pode atacar",
    "defense": "Por que na verdade funciona",
    "evidence": "Base teórica ou prática"
  }
}
```

## REGRAS

1. Seja CONSTRUTIVO - encontre o que funciona
2. Use EVIDÊNCIAS de frameworks reconhecidos
3. Proponha AMPLIFICAÇÕES, não revolucões
4. DEFENDA técnicas válidas contra críticas injustas
5. Mantenha EQUILÍBRIO entre persuasão e ética

## PRINCÍPIO ÉTICO

A melhor persuasão é quando o lead PERCEBE que você está ajudando,
não manipulando. Defenda técnicas que criam valor real, não truques.

## LEMBRE-SE

Você é o advogado do prompt. Seu trabalho é mostrar o potencial
persuasivo e como ele pode ser maximizado eticamente.
"""

    @property
    def system_prompt(self) -> str:
        """System prompt do agente."""
        return self._SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """Executa o agente."""
        from datetime import datetime
        start = datetime.utcnow()
        
        prompt = input_data.get("prompt", "")
        context = input_data.get("context", {})
        
        result = await self.advocate(prompt, context) if hasattr(self, 'advocate') else await self.quick_advocate(prompt) if hasattr(self, 'quick_advocate') else {"raw": "Method not found"}
        
        return AgentResult(
            agent_name=self.config.name,
            success=True,
            output=result if isinstance(result, dict) else {"response": result},
            execution_time_ms=self._measure_time(start),
            tokens_used=0,
            model=self.config.model
        )

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON."""
        return self._extract_json(raw_response) or {"raw": raw_response}

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="AdvocatePersuasion",
                description="AdvocatePersuasion agent",
                model="claude-sonnet-4-20250514",
                temperature=0.4,  # Balanceado entre análise e criatividade
                max_tokens=2000
            )
        super().__init__(config)

    async def defend(self, prompt_to_analyze: str, context: Dict = None) -> Dict:
        """
        Defende um prompt de vendas e propõe melhorias.

        Args:
            prompt_to_analyze: O prompt/system prompt do agente
            context: Contexto adicional (persona, produto, etc)

        Returns:
            Dict com defesa estruturada
        """
        context = context or {}

        user_message = f"""## PROMPT PARA DEFENDER

{prompt_to_analyze}

## CONTEXTO ADICIONAL

- Produto/Serviço: {context.get('product', 'Não especificado')}
- Público-alvo: {context.get('target_audience', 'Não especificado')}
- Ticket médio: {context.get('ticket', 'Não especificado')}
- Canal: {context.get('channel', 'WhatsApp')}

## SUA TAREFA

Analise os PONTOS FORTES deste prompt em termos de persuasão.
Identifique técnicas que estão funcionando e proponha AMPLIFICAÇÕES.
Use seus frameworks (Cialdini, NEPQ, No-Go, Carnegie) para defender.

Responda em JSON estruturado conforme seu formato."""

        text, tokens = await self.call_claude(user_message)

        # Parse JSON da resposta
        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                defense_data = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "defense": defense_data,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "defense": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }

    async def counter_argument(self, criticism: str, original_prompt: str) -> str:
        """
        Contra-argumenta uma crítica específica.
        """
        user_message = f"""Uma crítica foi feita a este prompt:

CRÍTICA:
{criticism}

PROMPT ORIGINAL:
{original_prompt}

Contra-argumente esta crítica usando seus frameworks de persuasão.
Se a crítica for válida, proponha uma melhoria específica.
Se a crítica for injusta, defenda o prompt com evidências."""

        text, tokens = await self.call_claude(user_message)
        return text

    async def quick_defend(self, prompt_to_analyze: str) -> str:
        """
        Defesa rápida em texto livre (para debates).
        """
        user_message = f"""Defenda os pontos fortes de persuasão deste prompt em 3-5 pontos.
Seja direto e use frameworks reconhecidos como base.

PROMPT:
{prompt_to_analyze}

Responda de forma direta, como se estivesse debatendo com um crítico."""

        text, tokens = await self.call_claude(user_message)
        return text
