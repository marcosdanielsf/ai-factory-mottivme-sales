"""
Debate Orchestrator - Orquestra debate entre especialistas
Os especialistas apresentam análises, identificam discordâncias e debatem
"""

import os
import httpx
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from .experts import ExpertAnalysis, BaseExpert, create_expert_panel

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


@dataclass
class DebatePoint:
    """Um ponto de debate entre especialistas"""
    topic: str
    positions: Dict[str, str]  # {expert_name: position}
    resolution: Optional[str] = None
    final_recommendation: Optional[str] = None


@dataclass
class DebateResult:
    """Resultado final do debate"""
    individual_analyses: List[ExpertAnalysis]
    average_score: float
    consensus_strengths: List[str]
    consensus_weaknesses: List[str]
    debate_points: List[DebatePoint]
    final_improvements: List[str]
    prompt_changes_recommended: List[Dict]  # {"section": str, "current": str, "suggested": str}
    executive_summary: str


class DebateOrchestrator:
    """Orquestra debate entre especialistas"""

    def __init__(self, experts: Optional[List[BaseExpert]] = None):
        self.experts = experts or create_expert_panel()
        self.model = "llama-3.3-70b-versatile"

    async def run_analysis_phase(self, transcript: str, sdr_prompt: str) -> List[ExpertAnalysis]:
        """Fase 1: Cada especialista analisa independentemente"""
        analyses = []

        for expert in self.experts:
            print(f"  → Analisando com {expert.name}...")
            analysis = await expert.analyze(transcript, sdr_prompt)
            analyses.append(analysis)

        return analyses

    async def identify_disagreements(self, analyses: List[ExpertAnalysis]) -> List[DebatePoint]:
        """Fase 2: Identifica pontos de discordância"""

        # Monta resumo das análises para o LLM identificar discordâncias
        analyses_summary = ""
        for a in analyses:
            analyses_summary += f"""
### {a.expert_name} (Score: {a.score})
**Pontos Fortes:** {', '.join(a.strengths[:3])}
**Fraquezas:** {', '.join(a.weaknesses[:3])}
**Melhorias:** {', '.join(a.specific_improvements[:3])}
"""

        prompt = f"""Analise as avaliações de 4 especialistas sobre a mesma conversa de vendas.

{analyses_summary}

Identifique PONTOS DE DISCORDÂNCIA onde os especialistas têm visões diferentes ou contraditórias.

Retorne JSON:
```json
{{
  "debate_points": [
    {{
      "topic": "Nome do ponto de debate",
      "expert_positions": {{
        "PNL Expert": "posição resumida",
        "Sales Expert": "posição resumida",
        "NeuroSales Expert": "posição resumida",
        "Behavior Expert": "posição resumida"
      }}
    }}
  ]
}}
```

Identifique 2-4 pontos de real discordância. Retorne APENAS o JSON."""

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1500
                }
            )
            data = response.json()
            result = data["choices"][0]["message"]["content"]

        # Parse
        import json
        try:
            result = result.strip()
            if "```" in result:
                result = result.split("```")[1]
                if result.startswith("json"):
                    result = result[4:]
            data = json.loads(result.strip())

            points = []
            for dp in data.get("debate_points", []):
                points.append(DebatePoint(
                    topic=dp.get("topic", ""),
                    positions=dp.get("expert_positions", {})
                ))
            return points
        except:
            return []

    async def resolve_debate(self, point: DebatePoint, transcript: str) -> DebatePoint:
        """Fase 3: Resolve cada ponto de debate"""

        positions_text = "\n".join([
            f"- **{expert}**: {position}"
            for expert, position in point.positions.items()
        ])

        prompt = f"""Você é um mediador de debate entre especialistas em vendas.

## PONTO DE DEBATE: {point.topic}

## POSIÇÕES DOS ESPECIALISTAS:
{positions_text}

## CONTEXTO DA CONVERSA:
{transcript[:1500]}

## SUA TAREFA:
1. Analise as diferentes perspectivas
2. Identifique qual posição é mais válida para este contexto específico
3. Sintetize uma recomendação final

Retorne JSON:
```json
{{
  "resolution": "Explicação de como as visões se complementam ou qual prevalece",
  "final_recommendation": "Recomendação prática específica para o prompt/SDR"
}}
```"""

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 800
                }
            )
            data = response.json()
            result = data["choices"][0]["message"]["content"]

        import json
        try:
            result = result.strip()
            if "```" in result:
                result = result.split("```")[1]
                if result.startswith("json"):
                    result = result[4:]
            data = json.loads(result.strip())

            point.resolution = data.get("resolution", "")
            point.final_recommendation = data.get("final_recommendation", "")
        except:
            point.resolution = result[:500]
            point.final_recommendation = ""

        return point

    async def synthesize_improvements(
        self,
        analyses: List[ExpertAnalysis],
        debate_points: List[DebatePoint],
        sdr_prompt: str
    ) -> DebateResult:
        """Fase 4: Sintetiza tudo em melhorias concretas para o prompt"""

        # Calcula score médio
        avg_score = sum(a.score for a in analyses) / len(analyses)

        # Encontra consensos (aparecem em 3+ análises)
        all_strengths = [s for a in analyses for s in a.strengths]
        all_weaknesses = [w for a in analyses for w in a.weaknesses]

        from collections import Counter
        strength_counts = Counter(all_strengths)
        weakness_counts = Counter(all_weaknesses)

        consensus_strengths = [s for s, c in strength_counts.items() if c >= 2][:5]
        consensus_weaknesses = [w for w, c in weakness_counts.items() if c >= 2][:5]

        # Gera prompt changes
        all_improvements = [i for a in analyses for i in a.specific_improvements]
        debate_recommendations = [p.final_recommendation for p in debate_points if p.final_recommendation]

        prompt = f"""Você é um especialista em otimização de prompts de IA para vendas.

## ANÁLISES DOS ESPECIALISTAS (Score médio: {avg_score:.1f}/100)

### Consensos - Pontos Fortes:
{chr(10).join(f'- {s}' for s in consensus_strengths)}

### Consensos - Fraquezas:
{chr(10).join(f'- {w}' for w in consensus_weaknesses)}

### Melhorias Sugeridas pelos Especialistas:
{chr(10).join(f'- {i}' for i in all_improvements[:10])}

### Recomendações do Debate:
{chr(10).join(f'- {r}' for r in debate_recommendations)}

## TRECHO DO PROMPT ATUAL:
```
{sdr_prompt[:4000]}
```

## SUA TAREFA:
Gere mudanças ESPECÍFICAS para o prompt da SDR.

Retorne JSON:
```json
{{
  "executive_summary": "Resumo executivo em 3-4 frases",
  "final_improvements": ["melhoria 1", "melhoria 2", "melhoria 3"],
  "prompt_changes": [
    {{
      "section": "Nome da seção do prompt (ex: FASE 8: TRATAMENTO DE OBJECOES)",
      "issue": "Problema identificado",
      "suggested_text": "Novo texto sugerido para substituir/adicionar"
    }}
  ]
}}
```

Seja específico. Cite exatamente onde e o que mudar no prompt."""

        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000
                }
            )
            data = response.json()
            result = data["choices"][0]["message"]["content"]

        import json
        try:
            result = result.strip()
            if "```" in result:
                result = result.split("```")[1]
                if result.startswith("json"):
                    result = result[4:]
            data = json.loads(result.strip())

            return DebateResult(
                individual_analyses=analyses,
                average_score=avg_score,
                consensus_strengths=consensus_strengths,
                consensus_weaknesses=consensus_weaknesses,
                debate_points=debate_points,
                final_improvements=data.get("final_improvements", []),
                prompt_changes_recommended=data.get("prompt_changes", []),
                executive_summary=data.get("executive_summary", "")
            )
        except Exception as e:
            return DebateResult(
                individual_analyses=analyses,
                average_score=avg_score,
                consensus_strengths=consensus_strengths,
                consensus_weaknesses=consensus_weaknesses,
                debate_points=debate_points,
                final_improvements=all_improvements[:5],
                prompt_changes_recommended=[],
                executive_summary=f"Erro ao sintetizar: {str(e)}"
            )

    async def run_full_debate(self, transcript: str, sdr_prompt: str) -> DebateResult:
        """Executa debate completo"""

        print("\n📊 FASE 1: Análise individual dos especialistas...")
        analyses = await self.run_analysis_phase(transcript, sdr_prompt)

        print("\n🔍 FASE 2: Identificando discordâncias...")
        debate_points = await self.identify_disagreements(analyses)

        print(f"\n⚔️ FASE 3: Resolvendo {len(debate_points)} pontos de debate...")
        for i, point in enumerate(debate_points):
            print(f"  → Debatendo: {point.topic}")
            debate_points[i] = await self.resolve_debate(point, transcript)

        print("\n🎯 FASE 4: Sintetizando melhorias...")
        result = await self.synthesize_improvements(analyses, debate_points, sdr_prompt)

        return result


# Teste
if __name__ == "__main__":
    import asyncio

    async def test():
        transcript = """
LEAD: Olá, acabei de preencher o formulário

ISABELLA: Boa tarde, Maria! Sou a Isabella do Instituto Amare. Vi que você preencheu nosso formulário sobre insônia. Me conta, há quanto tempo você está passando por isso?

LEAD: Uns 2 anos já

ISABELLA: Entendo. E o que você já tentou fazer?

LEAD: Nada, só vim aqui ver

ISABELLA: Certo. A consulta custa R$ 1.800. Quer agendar?

LEAD: Nossa, tá caro

ISABELLA: Parcelamos em 3x. Como prefere?

LEAD: Vou pensar

ISABELLA: Ok, fico no aguardo
"""

        sdr_prompt = "# ISABELLA v7.0.9..."

        orchestrator = DebateOrchestrator()
        result = await orchestrator.run_full_debate(transcript, sdr_prompt)

        print(f"\n{'='*60}")
        print(f"RESULTADO DO DEBATE")
        print(f"{'='*60}")
        print(f"\nScore Médio: {result.average_score:.1f}/100")
        print(f"\n{result.executive_summary}")

    asyncio.run(test())
