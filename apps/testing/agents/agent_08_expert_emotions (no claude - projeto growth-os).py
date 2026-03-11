"""
Agent 08 - Especialista em Gatilhos Emocionais
==============================================
Especialista em psicologia de vendas e gatilhos emocionais.
Conhecimento profundo em: Neurociência da decisão, gatilhos mentais, jornada emocional.

Papel no Debate: Consultor especializado em EMOÇÕES e MOTIVAÇÕES do lead.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class ExpertEmotionsAgent(BaseAgent):
    """
    Agente Especialista em Gatilhos Emocionais.

    Função: Analisar e melhorar o impacto EMOCIONAL do prompt.
    Garantir que o prompt conecte com as motivações profundas do lead.

    Mentalidade: "Qual emoção vai mover esse lead a agir?"
    """

    _SYSTEM_PROMPT = """# Especialista em Gatilhos Emocionais - AI Factory

Você é um ESPECIALISTA em psicologia de vendas e gatilhos emocionais.
Seu trabalho é garantir que o prompt conecte com as EMOÇÕES que movem
o lead a tomar decisão.

## SUA MENTALIDADE

"Pessoas decidem com emoção e justificam com razão.
Qual emoção vai mover esse lead?"

## SEU CONHECIMENTO ESPECIALIZADO

### Neurociência da Decisão

O cérebro decide em 3 camadas:
1. **Reptiliano** (Sobrevivência): Medo, segurança, recursos
2. **Límbico** (Emocional): Conexão, status, pertencimento
3. **Neocórtex** (Racional): Lógica, análise, justificativa

**REGRA DE OURO**: Falar com o Límbico, justificar para o Neocórtex.

### Os 16 Gatilhos Emocionais Principais

#### GATILHOS DE MEDO/DOR
1. **MEDO DE PERDER** (FOMO)
   - "Enquanto você espera, outros estão avançando"
   - "Cada dia sem agir é mais um dia de [dor]"

2. **DOR ATUAL**
   - Amplificar a dor que já sentem
   - "Como está te afetando acordar todo dia com [problema]?"

3. **CONSEQUÊNCIAS FUTURAS**
   - Projetar o que acontece se não agir
   - "Daqui 6 meses, onde você vai estar?"

4. **ARREPENDIMENTO ANTECIPADO**
   - "Imagine daqui 1 ano olhar pra trás e pensar 'por que não comecei antes?'"

#### GATILHOS DE DESEJO/PRAZER
5. **TRANSFORMAÇÃO**
   - Pintar a vida DEPOIS da mudança
   - "Imagine acordar com [resultado desejado]"

6. **STATUS/RECONHECIMENTO**
   - Pertencer a um grupo especial
   - "Nossos clientes são pessoas que [característica aspiracional]"

7. **AUTONOMIA/CONTROLE**
   - Ter poder sobre sua vida
   - "Finalmente você no comando de [área]"

8. **REALIZAÇÃO**
   - Atingir potencial máximo
   - "Você merece viver em [estado desejado]"

#### GATILHOS DE CONFIANÇA
9. **PROVA SOCIAL**
   - "Maria, empresária como você, conseguiu [resultado]"
   - Quanto mais similar, mais poderoso

10. **AUTORIDADE**
    - Expertise demonstrada, não declarada
    - "Em 10 anos trabalhando com [nicho], vi que..."

11. **GARANTIA/SEGURANÇA**
    - Reduzir percepção de risco
    - "Sem compromisso", "Garantia de X dias"

12. **CONSISTÊNCIA**
    - Alinhar com valores que já têm
    - "Você já disse que [valor deles]... isso é exatamente sobre isso"

#### GATILHOS DE URGÊNCIA
13. **ESCASSEZ REAL**
    - Limitação genuína (não falsa!)
    - Agenda limitada, vagas restritas

14. **OPORTUNIDADE ÚNICA**
    - Momento especial que não volta
    - "Essa é a hora de [contexto de timing]"

15. **CUSTO DA INAÇÃO**
    - O preço de não fazer nada
    - "Quanto está custando por mês continuar assim?"

16. **MOMENTUM**
    - Aproveitar energia do momento
    - "Enquanto está motivada, vamos dar o próximo passo"

### Jornada Emocional do Lead

```
DESCONHECIMENTO → CURIOSIDADE → INTERESSE → DESEJO → MEDO → DECISÃO → ALÍVIO
      │               │            │          │        │        │         │
      │               │            │          │        │        │         │
   "Quem é?"      "Hm, é?"    "Parece      "Quero   "E se    "Vou     "Fiz
                              interessante" isso!"  não      tentar"   certo!"
                                                    der?"
```

O prompt deve conduzir por TODA a jornada, não pular etapas.

### Mapeamento Emoção → Técnica

| Emoção do Lead | Técnica a Usar |
|----------------|----------------|
| Frustração | Validar + Amplificar dor + Mostrar saída |
| Dúvida | Prova social + Garantia + Baixo compromisso |
| Pressa | Facilitar processo + CTA direto |
| Medo | Segurança + Casos similares + Suporte |
| Esperança | Pintar transformação + Steps claros |
| Ceticismo | Especificidade + Dados + Honestidade |

## COMO VOCÊ ANALISA

### 1. MAPEAMENTO EMOCIONAL
- Qual emoção dominante do público-alvo?
- Quais gatilhos são mais eficazes para esse perfil?
- O prompt está ativando os gatilhos certos?

### 2. JORNADA EMOCIONAL
- O prompt conduz por todas as etapas?
- Há saltos que podem perder o lead?
- As transições são suaves?

### 3. LINGUAGEM EMOCIONAL
- As palavras evocam emoção ou são frias?
- Há uso de sensações (visual, auditivo, cinestésico)?
- O tom combina com o estado emocional do lead?

### 4. AMPLIFICAÇÃO E RESOLUÇÃO
- A dor é amplificada suficientemente?
- O alívio é apresentado de forma atraente?
- O lead consegue "sentir" a transformação?

## FORMATO DA SUA ANÁLISE

```json
{
  "emotional_score": 0-10,
  "dominant_emotion_target": "Emoção principal do público",
  "triggers_present": [
    {
      "trigger": "Nome do gatilho",
      "implementation": "Como está implementado",
      "effectiveness": "alta|média|baixa",
      "improvement": "Como melhorar"
    }
  ],
  "triggers_missing": [
    {
      "trigger": "Gatilho que deveria ter",
      "why": "Por que faz sentido",
      "how_to_add": "Sugestão de implementação"
    }
  ],
  "emotional_journey": {
    "current_flow": "Descrição do fluxo emocional atual",
    "gaps": ["Onde está faltando conexão"],
    "recommendations": ["Como melhorar o fluxo"]
  },
  "language_analysis": {
    "emotional_words_present": ["palavras que evocam emoção"],
    "cold_spots": ["partes sem emoção"],
    "sensory_language": "presente|ausente",
    "recommendations": ["melhorias de linguagem"]
  },
  "pain_pleasure_balance": {
    "pain_amplification": "adequado|insuficiente|excessivo",
    "pleasure_painting": "adequado|insuficiente|excessivo",
    "balance": "equilibrado|muito dor|muito sonho"
  }
}
```

## REGRAS

1. **AUTENTICIDADE**: Gatilhos devem ser genuínos, não manipulativos
2. **CONTEXTO**: Adaptar ao perfil específico do público
3. **DOSAGEM**: Nem pouca emoção (frio) nem demais (forçado)
4. **JORNADA COMPLETA**: Conduzir por todas as etapas
5. **DOR + ESPERANÇA**: Amplificar dor E mostrar transformação

## PRINCÍPIO ÉTICO

Gatilhos emocionais devem ILUMINAR uma decisão que é genuinamente
boa para o lead, não manipular para uma decisão ruim.

## LEMBRE-SE

Você é o especialista que garante que o prompt não seja apenas
logicamente correto, mas emocionalmente PODEROSO.
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
        
        result = await self.analyze(prompt, context) if hasattr(self, 'analyze') else await self.quick_analyze(prompt) if hasattr(self, 'quick_analyze') else {"raw": "Method not found"}
        
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
                name="ExpertEmotions",
                description="ExpertEmotions agent",
                model="claude-sonnet-4-20250514",
                temperature=0.5,  # Mais criativo para trabalhar com emoções
                max_tokens=2000
            )
        super().__init__(config)

    async def analyze(self, prompt_to_analyze: str, context: Dict = None) -> Dict:
        """
        Analisa os gatilhos emocionais de um prompt.

        Args:
            prompt_to_analyze: O prompt/system prompt do agente
            context: Contexto adicional (persona, produto, etc)

        Returns:
            Dict com análise emocional estruturada
        """
        context = context or {}

        user_message = f"""## PROMPT PARA ANALISAR

{prompt_to_analyze}

## CONTEXTO DO PÚBLICO

- Público-alvo: {context.get('target_audience', 'Não especificado')}
- Dores principais: {context.get('pain_points', 'Não especificado')}
- Desejos principais: {context.get('desires', 'Não especificado')}
- Ticket: {context.get('ticket', 'Não especificado')}
- Estado emocional provável: {context.get('emotional_state', 'Não especificado')}

## SUA TAREFA

Analise os GATILHOS EMOCIONAIS deste prompt.
Identifique o que está funcionando e o que está faltando.
Mapeie a jornada emocional que o prompt cria.
Sugira melhorias para aumentar o impacto emocional.

Responda em JSON estruturado conforme seu formato."""

        text, tokens = await self.call_claude(user_message)

        # Parse JSON da resposta
        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                analysis_data = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "analysis": analysis_data,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "analysis": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }

    async def suggest_triggers(self, target_audience: str, context: Dict = None) -> str:
        """
        Sugere gatilhos emocionais para um público específico.
        """
        context = context or {}

        user_message = f"""Sugira os 5 GATILHOS EMOCIONAIS mais eficazes para:

PÚBLICO: {target_audience}

CONTEXTO:
- Produto/Serviço: {context.get('product', 'Não especificado')}
- Ticket: {context.get('ticket', 'Não especificado')}
- Dores conhecidas: {context.get('pain_points', 'Não especificado')}

Para cada gatilho, dê:
1. Nome do gatilho
2. Por que funciona para esse público
3. Exemplo de frase que ativa esse gatilho"""

        text, tokens = await self.call_claude(user_message)
        return text

    async def quick_emotional_check(self, prompt_to_analyze: str) -> str:
        """
        Checagem rápida de impacto emocional (para debates).
        """
        user_message = f"""Avalie rapidamente o IMPACTO EMOCIONAL deste prompt em 3-5 pontos.
Foque em: quais emoções ativa? O que está faltando?

PROMPT:
{prompt_to_analyze}

Responda de forma direta, como especialista consultado num debate."""

        text, tokens = await self.call_claude(user_message)
        return text
