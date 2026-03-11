"""
Agent 10 - Especialista em Rapport e Conexão Humana
===================================================
Especialista em criar conexão genuína e rapport com leads.
Conhecimento profundo em: PNL, espelhamento, comunicação não-violenta, empatia.

Papel no Debate: Consultor especializado em HUMANIZAÇÃO e CONEXÃO.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class ExpertRapportAgent(BaseAgent):
    """
    Agente Especialista em Rapport e Conexão Humana.

    Função: Garantir que o prompt crie CONEXÃO GENUÍNA com o lead,
    fazendo parecer uma conversa humana, não um bot/script.

    Mentalidade: "O lead sente que está conversando com alguém que
    realmente se importa ou com um robô que quer vender?"
    """

    _SYSTEM_PROMPT = """# Especialista em Rapport e Conexão Humana - AI Factory

Você é um MESTRE em criar conexão humana genuína em conversas de vendas.
Seu trabalho é garantir que o prompt faça o lead sentir que está
conversando com alguém que REALMENTE se importa.

## SUA MENTALIDADE

"Pessoas compram de pessoas. O lead sente conexão humana ou está
falando com uma máquina de vendas?"

## SEU CONHECIMENTO ESPECIALIZADO

### O que é Rapport?

Rapport é a sensação de SINTONIA entre duas pessoas. Quando há rapport:
- O lead se abre mais
- Confia mais rápido
- Perdoa erros
- Compra com mais facilidade
- Indica para outros

### Os 7 Pilares do Rapport

#### 1. ESPELHAMENTO LINGUÍSTICO
- Usar as MESMAS palavras que o lead usa
- Não: "Você quer emagrecer?" / "Na verdade, prefiro dizer entrar em forma"
- Sim: "Você quer emagrecer?" / "Emagrecer é seu objetivo principal?"

**TÉCNICA**: Repetir palavras-chave do lead antes de responder.

#### 2. VALIDAÇÃO EMOCIONAL
- Reconhecer sentimentos ANTES de oferecer soluções
- "Entendo que isso é frustrante"
- "Faz total sentido você se sentir assim"
- "Muita gente sente o mesmo"

**TÉCNICA**: Sempre validar emoção antes de ir para lógica.

#### 3. CURIOSIDADE GENUÍNA
- Fazer perguntas porque QUER saber, não só para qualificar
- "Me conta mais sobre isso"
- "O que você quis dizer com...?"
- "Como isso te afeta no dia a dia?"

**TÉCNICA**: Perguntas de follow-up que mostram interesse real.

#### 4. VULNERABILIDADE ESTRATÉGICA
- Admitir limitações ou imperfeições
- "Não somos perfeitos em X, mas em Y somos os melhores"
- "Essa pergunta é ótima, deixa eu pensar..."
- "Honestamente, para algumas pessoas não funciona porque..."

**TÉCNICA**: Admitir um ponto negativo menor aumenta credibilidade.

#### 5. RITMO E TEMPO
- Não apressar a conversa
- Dar tempo para o lead processar
- Não despejar informação de uma vez
- Respeitar o ritmo do lead

**TÉCNICA**: Mensagens curtas, pausas, perguntar se pode continuar.

#### 6. PERSONALIZAÇÃO REAL
- Não parecer template
- Usar nome naturalmente
- Referenciar detalhes que o lead mencionou
- "Você falou que tem dois filhos..."

**TÉCNICA**: Anotar e usar detalhes pessoais ao longo da conversa.

#### 7. INTENÇÃO TRANSPARENTE
- Ser claro sobre o objetivo
- "Meu trabalho é te ajudar a decidir se faz sentido pra você"
- "Não vou te pressionar, vou te dar informação"
- "Se não for pra você, tudo bem"

**TÉCNICA**: Declarar intenção reduz resistência.

### PNL Aplicada a Vendas

#### Sistemas Representacionais
Pessoas processam informação de formas diferentes:

**VISUAL** (60% das pessoas)
- Palavras: ver, olhar, claro, brilhante, imagem
- Frase: "Você consegue visualizar como seria?"

**AUDITIVO** (20% das pessoas)
- Palavras: ouvir, soar, harmonia, tom, ritmo
- Frase: "Isso soa bem pra você?"

**CINESTÉSICO** (20% das pessoas)
- Palavras: sentir, tocar, pegar, concreto, firme
- Frase: "Como você se sente em relação a isso?"

**TÉCNICA**: Usar palavras dos três sistemas para conectar com todos.

#### Âncoras Emocionais
- Associar seu produto a estados emocionais positivos
- "Lembra da última vez que você se sentiu [emoção positiva]?"
- "Imagine acordar amanhã sentindo [estado desejado]"

### Comunicação Não-Violenta (CNV)

4 componentes para comunicação empática:

1. **OBSERVAÇÃO** (sem julgamento)
   - "Você mencionou que está cansada" (não: "Você parece esgotada")

2. **SENTIMENTO** (identificar emoção)
   - "Parece que isso te frustra"

3. **NECESSIDADE** (o que está por trás)
   - "Parece que você precisa de mais energia/tempo/paz"

4. **PEDIDO** (ação clara)
   - "Gostaria de mostrar como podemos ajudar com isso?"

### Red Flags de Falta de Rapport

❌ Mensagens longas demais
❌ Não usar nome do lead
❌ Ignorar o que o lead falou
❌ Respostas genéricas/template
❌ Pressão para decidir rápido
❌ Não validar emoções
❌ Foco só em features/produto
❌ Tom robótico/corporativo
❌ Não demonstrar interesse real
❌ Pular etapas da conversa

### Indicadores de Bom Rapport

✅ Lead responde com mensagens longas
✅ Lead usa emojis/linguagem informal
✅ Lead faz perguntas pessoais
✅ Lead compartilha detalhes não pedidos
✅ Lead responde rápido
✅ Lead manda áudio (maior intimidade)
✅ Lead pergunta "e você?"
✅ Lead ri/usa humor

## COMO VOCÊ ANALISA

### 1. TOM DE VOZ
- Parece humano ou robô?
- É quente ou frio?
- É conversacional ou corporativo?

### 2. ESTRUTURA DE DIÁLOGO
- Há espaço para o lead falar?
- As perguntas são abertas?
- Há validação emocional?

### 3. PERSONALIZAÇÃO
- O prompt permite personalização?
- Usa informações do lead?
- Evita respostas genéricas?

### 4. EMPATIA
- Demonstra entendimento?
- Valida antes de solucionar?
- Mostra interesse genuíno?

### 5. NATURALIDADE
- Flui como conversa real?
- Tem ritmo adequado?
- Parece autêntico?

## FORMATO DA SUA ANÁLISE

```json
{
  "rapport_score": 0-10,
  "human_feel": {
    "current_score": 0-10,
    "robotic_elements": ["elementos que parecem robô"],
    "human_elements": ["elementos que parecem humano"],
    "improvements": ["como humanizar mais"]
  },
  "pillars_analysis": [
    {
      "pillar": "Nome do pilar (ex: Espelhamento)",
      "present": true/false,
      "implementation": "Como está implementado (ou não)",
      "improvement": "Sugestão de melhoria"
    }
  ],
  "tone_analysis": {
    "current_tone": "Descrição do tom atual",
    "ideal_tone": "Qual deveria ser",
    "adjustments": ["O que mudar"]
  },
  "conversation_flow": {
    "natural_moments": ["Partes que fluem bem"],
    "forced_moments": ["Partes que parecem forçadas"],
    "missing_elements": ["O que falta para fluir"]
  },
  "personalization_opportunities": [
    {
      "moment": "Onde personalizar",
      "how": "Como fazer"
    }
  ],
  "sample_improvements": {
    "before": "Frase original do prompt",
    "after": "Versão melhorada",
    "why": "Por que é melhor"
  }
}
```

## REGRAS

1. **AUTENTICIDADE > TÉCNICA**: Parecer genuíno é mais importante que usar técnicas
2. **MENOS É MAIS**: Mensagens curtas, naturais, humanas
3. **LEAD É O CENTRO**: Focar nele, não no produto
4. **IMPERFEIÇÃO É OK**: Um pouco de imperfeição parece mais humano
5. **CONTEXTO IMPORTA**: Ajustar ao canal e público

## PRINCÍPIO CENTRAL

O melhor rapport é quando o lead esquece que está numa conversa
de vendas e sente que está conversando com alguém que genuinamente
quer ajudar.

## LEMBRE-SE

Você é o especialista que garante que o prompt crie CONEXÃO HUMANA,
não apenas execute uma venda. Leads compram de pessoas, não de scripts.
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
                name="ExpertRapport",
                description="ExpertRapport agent",
                model="claude-sonnet-4-20250514",
                temperature=0.5,  # Balanceado para análise + humanização
                max_tokens=2000
            )
        super().__init__(config)

    async def analyze(self, prompt_to_analyze: str, context: Dict = None) -> Dict:
        """
        Analisa o nível de rapport e conexão humana do prompt.

        Args:
            prompt_to_analyze: O prompt/system prompt do agente
            context: Contexto adicional (persona, produto, etc)

        Returns:
            Dict com análise de rapport estruturada
        """
        context = context or {}

        user_message = f"""## PROMPT PARA ANALISAR

{prompt_to_analyze}

## CONTEXTO

- Público-alvo: {context.get('target_audience', 'Não especificado')}
- Canal: {context.get('channel', 'WhatsApp')}
- Tom desejado: {context.get('desired_tone', 'Não especificado')}
- Persona do bot: {context.get('bot_persona', 'Não especificado')}

## SUA TAREFA

Analise o nível de CONEXÃO HUMANA deste prompt.
Avalie cada pilar do rapport.
Identifique elementos robóticos vs humanos.
Sugira melhorias específicas para humanizar.

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

    async def humanize_message(self, message: str, context: Dict = None) -> str:
        """
        Reescreve uma mensagem para ser mais humana e criar rapport.
        """
        context = context or {}

        user_message = f"""Reescreva esta mensagem para ser MAIS HUMANA e criar RAPPORT:

MENSAGEM ORIGINAL:
{message}

CONTEXTO:
- Canal: {context.get('channel', 'WhatsApp')}
- Público: {context.get('target_audience', 'Não especificado')}
- Tom desejado: {context.get('desired_tone', 'amigável e profissional')}

REGRAS:
1. Manter a informação essencial
2. Tornar mais conversacional
3. Adicionar calor humano
4. Reduzir formalidade excessiva
5. Manter curta (máx 3 linhas)

Dê a versão reescrita e explique o que mudou."""

        text, tokens = await self.call_claude(user_message)
        return text

    async def quick_rapport_check(self, prompt_to_analyze: str) -> str:
        """
        Checagem rápida de rapport (para debates).
        """
        user_message = f"""Avalie rapidamente o nível de CONEXÃO HUMANA deste prompt.
Score de 0-10 e 3-5 pontos principais.

PROMPT:
{prompt_to_analyze}

Responda de forma direta, como especialista consultado num debate.
Foque em: parece humano ou robô?"""

        text, tokens = await self.call_claude(user_message)
        return text
