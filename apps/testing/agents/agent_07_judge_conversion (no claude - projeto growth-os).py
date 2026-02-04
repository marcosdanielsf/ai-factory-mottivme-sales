"""
Agent 07 - Juiz de Conversão
============================
Especialista em avaliar impacto em métricas de conversão.
Conhecimento profundo em: Funil de vendas, métricas, benchmarks de indústria.

Papel no Debate: JULGAR qual versão do prompt terá melhor performance.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class JudgeConversionAgent(BaseAgent):
    """
    Agente Juiz focado em conversão.

    Função: AVALIAR objetivamente qual abordagem terá maior impacto
    em métricas de conversão reais.

    Mentalidade: "Qual versão vai converter mais leads em clientes?"
    """

    _SYSTEM_PROMPT = """# Juiz de Conversão - AI Factory

Você é o ÁRBITRO FINAL no debate de prompts. Sua única métrica é:
QUAL VERSÃO VAI CONVERTER MAIS?

Você não tem viés. Você analisa OBJETIVAMENTE baseado em dados,
benchmarks e experiência de mercado.

## SUA MENTALIDADE

"Não me importa se está bonito ou se usa framework X. Me importa:
vai converter ou não vai?"

## SEU CONHECIMENTO DE MÉTRICAS

### Funil de Vendas B2C (Ticket Alto)

```
TOPO (Consciência)
  │ Taxa esperada: 100% → 40% continuam
  │ Métrica: Taxa de Engajamento Inicial
  │
  ▼
MEIO (Consideração)
  │ Taxa esperada: 40% → 15% qualificados
  │ Métrica: Taxa de Qualificação
  │
  ▼
FUNDO (Decisão)
  │ Taxa esperada: 15% → 5% fecham
  │ Métrica: Taxa de Conversão
  │
  ▼
CLIENTE
```

### Benchmarks por Canal

| Canal | Taxa de Resposta | Taxa Qualificação | Taxa Conversão |
|-------|------------------|-------------------|----------------|
| WhatsApp | 60-80% | 20-35% | 8-15% |
| Instagram DM | 40-60% | 15-25% | 5-12% |
| Email | 15-25% | 10-20% | 3-8% |
| Telefone | 70-90% | 30-50% | 10-20% |

### Benchmarks por Ticket

| Ticket | Ciclo Médio | Objeções Esperadas | Touchpoints |
|--------|-------------|-------------------|-------------|
| Baixo (<R$500) | 1-3 dias | 1-2 | 2-4 |
| Médio (R$500-5k) | 1-2 semanas | 2-4 | 4-7 |
| Alto (R$5k-50k) | 2-8 semanas | 4-8 | 8-15 |
| Enterprise (>R$50k) | 2-6 meses | 8+ | 15+ |

### Indicadores de Alta Conversão

1. **Velocidade de Resposta**: <5 min = +30% conversão
2. **Personalização**: Mensagem personalizada = +25% resposta
3. **Pergunta vs Afirmação**: Terminar com pergunta = +40% engajamento
4. **Prova Social Específica**: Case similar = +35% credibilidade
5. **CTA Único**: 1 CTA claro > múltiplas opções
6. **Urgência Real**: Motivo genuíno = +20% ação imediata

### Indicadores de Baixa Conversão

1. **Mensagem Longa**: >200 palavras = -50% leitura
2. **Múltiplos CTAs**: Confusão = paralisia
3. **Tom Robótico**: Template detectável = -60% resposta
4. **Foco no Produto**: Falar de você, não dele = desconexão
5. **Urgência Falsa**: Detectada = -80% confiança
6. **Sem Próximo Passo**: Não saber o que fazer = abandono

## COMO VOCÊ JULGA

### 1. IMPACTO NO TOPO DO FUNIL
- A abertura vai gerar resposta?
- O primeiro contato é engajador?
- Estimativa: X% vai responder

### 2. IMPACTO NA QUALIFICAÇÃO
- As perguntas extraem informação útil?
- O lead vai se sentir qualificado, não interrogado?
- Estimativa: X% dos que respondem serão qualificados

### 3. IMPACTO NA CONVERSÃO
- O CTA é claro e fácil?
- As objeções estão bem tratadas?
- Estimativa: X% dos qualificados vão fechar

### 4. ANÁLISE DE RISCO
- Onde o prompt pode FALHAR?
- Qual % de leads será perdido por qual motivo?

## FORMATO DO SEU JULGAMENTO

```json
{
  "verdict": "APROVA|REPROVA|REVISÃO",
  "conversion_estimate": {
    "response_rate": "X%",
    "qualification_rate": "X%",
    "conversion_rate": "X%",
    "overall_funnel": "X% (de 100 leads, X viram clientes)"
  },
  "comparison_to_benchmark": {
    "status": "ACIMA|NA MÉDIA|ABAIXO",
    "delta": "+X% ou -X% vs benchmark"
  },
  "critical_points": [
    {
      "stage": "topo|meio|fundo",
      "issue": "Descrição do problema",
      "impact": "Perda estimada de X% dos leads",
      "recommendation": "O que mudar"
    }
  ],
  "strong_points": [
    {
      "element": "O que está funcionando",
      "impact": "Ganho estimado de X%"
    }
  ],
  "a_b_recommendation": {
    "test": "O que testar",
    "hypothesis": "Esperamos que X aumente Y em Z%",
    "priority": "alta|média|baixa"
  },
  "final_score": 0-100,
  "reasoning": "Explicação do veredito"
}
```

## REGRAS DE JULGAMENTO

1. **DADOS > OPINIÃO**: Base em benchmarks, não em feeling
2. **CONTEXTO IMPORTA**: Ticket alto ≠ ticket baixo
3. **TRADE-OFFS**: Reconheça quando melhorar X piora Y
4. **IMPARCIALIDADE**: Não favoreça técnica específica
5. **PRAGMATISMO**: Prefira 80% pronto do que 100% teórico

## CRITÉRIOS DE APROVAÇÃO

### APROVA (Score 70+)
- Taxas estimadas acima ou na média do benchmark
- Sem falhas críticas que causem perda >20%
- Fluxo de conversa coerente

### REVISÃO (Score 50-69)
- Potencial, mas com gaps significativos
- Correções necessárias antes de produção
- Não vai performar sem ajustes

### REPROVA (Score <50)
- Taxas estimadas bem abaixo do benchmark
- Falhas críticas que causarão perda massiva
- Precisa ser refeito, não apenas ajustado

## LEMBRE-SE

Você é o último checkpoint antes do prompt ir para produção.
Seu julgamento determina se leads reais vão ser bem atendidos
ou desperdiçados. Seja rigoroso, mas justo.
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
        
        result = await self.judge(prompt, context) if hasattr(self, 'judge') else await self.quick_judge(prompt) if hasattr(self, 'quick_judge') else {"raw": "Method not found"}
        
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
                name="JudgeConversion",
                description="JudgeConversion agent",
                model="claude-sonnet-4-20250514",
                temperature=0.2,  # Mais analítico e objetivo
                max_tokens=2500
            )
        super().__init__(config)

    async def judge(
        self,
        prompt_to_analyze: str,
        context: Dict = None,
        criticism: str = None,
        defense: str = None
    ) -> Dict:
        """
        Julga um prompt de vendas e dá o veredito.

        Args:
            prompt_to_analyze: O prompt/system prompt do agente
            context: Contexto adicional (persona, produto, etc)
            criticism: Críticas levantadas pelo CriticSales
            defense: Defesa apresentada pelo AdvocatePersuasion

        Returns:
            Dict com julgamento estruturado
        """
        context = context or {}

        debate_section = ""
        if criticism or defense:
            debate_section = f"""
## DEBATE ANTERIOR

### CRÍTICAS LEVANTADAS:
{criticism or "Nenhuma crítica apresentada"}

### DEFESA APRESENTADA:
{defense or "Nenhuma defesa apresentada"}
"""

        user_message = f"""## PROMPT PARA JULGAR

{prompt_to_analyze}

## CONTEXTO DO NEGÓCIO

- Produto/Serviço: {context.get('product', 'Não especificado')}
- Público-alvo: {context.get('target_audience', 'Não especificado')}
- Ticket médio: {context.get('ticket', 'Não especificado')}
- Canal: {context.get('channel', 'WhatsApp')}
- Ciclo de vendas esperado: {context.get('sales_cycle', 'Não especificado')}
{debate_section}

## SUA TAREFA

Analise este prompt OBJETIVAMENTE focando em CONVERSÃO.
Estime as taxas em cada etapa do funil.
Compare com benchmarks do mercado.
Dê seu veredito final: APROVA, REPROVA ou REVISÃO.

Responda em JSON estruturado conforme seu formato."""

        text, tokens = await self.call_claude(user_message)

        # Parse JSON da resposta
        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                judgment_data = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "judgment": judgment_data,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "judgment": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }

    async def compare_versions(
        self,
        version_a: str,
        version_b: str,
        context: Dict = None
    ) -> Dict:
        """
        Compara duas versões de prompt e indica qual é melhor.
        """
        context = context or {}

        user_message = f"""## COMPARAÇÃO DE VERSÕES

### VERSÃO A:
{version_a}

### VERSÃO B:
{version_b}

## CONTEXTO
- Produto: {context.get('product', 'Não especificado')}
- Ticket: {context.get('ticket', 'Não especificado')}
- Canal: {context.get('channel', 'WhatsApp')}

## SUA TAREFA

Compare as duas versões OBJETIVAMENTE.
Qual vai converter mais leads? Por quê?

Responda com:
1. VENCEDOR: A ou B
2. MARGEM: Quanto melhor (ex: +15% conversão estimada)
3. POR QUE: 3 motivos principais
4. O QUE A PERDEDORA TEM DE BOM: Para não jogar fora"""

        text, tokens = await self.call_claude(user_message)

        return {
            "success": True,
            "comparison": text,
            "tokens_used": tokens
        }

    async def quick_verdict(self, prompt_to_analyze: str) -> str:
        """
        Veredito rápido em texto livre (para debates).
        """
        user_message = f"""Dê seu veredito rápido sobre este prompt em 3-5 pontos.
Foque em: vai converter ou não? Por quê?

PROMPT:
{prompt_to_analyze}

Responda como árbitro: direto, objetivo, sem rodeios."""

        text, tokens = await self.call_claude(user_message)
        return text
