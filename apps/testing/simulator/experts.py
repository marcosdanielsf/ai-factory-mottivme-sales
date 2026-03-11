"""
Painel de Especialistas - Analisam conversas sob diferentes perspectivas
Cada especialista usa um LLM diferente para diversidade de análise
"""

import os
import httpx
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


@dataclass
class ExpertAnalysis:
    """Resultado da análise de um especialista"""
    expert_name: str
    perspective: str
    score: int  # 0-100
    strengths: List[str]
    weaknesses: List[str]
    specific_improvements: List[str]
    critical_moments: List[Dict]  # {"turn": int, "issue": str, "suggestion": str}
    overall_assessment: str


class BaseExpert(ABC):
    """Classe base para especialistas"""

    def __init__(self):
        self.name: str = "BaseExpert"
        self.perspective: str = "Generic"
        self.llm: str = "groq"  # groq ou anthropic
        self.model: str = "llama-3.3-70b-versatile"

    @abstractmethod
    def get_system_prompt(self) -> str:
        pass

    def _build_analysis_prompt(self, transcript: str, sdr_prompt: str) -> str:
        return f"""Analise a seguinte conversa de vendas entre uma SDR (Isabella) e um lead.

## PROMPT DA SDR (para referência):
```
{sdr_prompt[:3000]}...
```

## TRANSCRIÇÃO DA CONVERSA:
```
{transcript}
```

## SUA TAREFA:
Analise sob sua perspectiva especializada e retorne um JSON com:

```json
{{
  "score": 0-100,
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["fraqueza 1", "fraqueza 2"],
  "specific_improvements": ["melhoria específica 1", "melhoria 2"],
  "critical_moments": [
    {{"turn": 3, "issue": "problema identificado", "suggestion": "como melhorar"}}
  ],
  "overall_assessment": "Avaliação geral em 2-3 frases"
}}
```

Retorne APENAS o JSON, sem texto adicional.
"""

    async def analyze(self, transcript: str, sdr_prompt: str) -> ExpertAnalysis:
        """Executa análise da conversa"""

        system = self.get_system_prompt()
        user = self._build_analysis_prompt(transcript, sdr_prompt)

        # Sempre usa Groq (sem dependência de Anthropic)
        result = await self._call_groq(system, user)

        # Parse JSON
        import json
        try:
            # Limpa possíveis ```json ``` wrappers
            result = result.strip()
            if result.startswith("```"):
                result = result.split("```")[1]
                if result.startswith("json"):
                    result = result[4:]
            result = result.strip()

            data = json.loads(result)

            return ExpertAnalysis(
                expert_name=self.name,
                perspective=self.perspective,
                score=data.get("score", 50),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                specific_improvements=data.get("specific_improvements", []),
                critical_moments=data.get("critical_moments", []),
                overall_assessment=data.get("overall_assessment", "")
            )
        except json.JSONDecodeError:
            return ExpertAnalysis(
                expert_name=self.name,
                perspective=self.perspective,
                score=50,
                strengths=[],
                weaknesses=["Erro ao parsear resposta do especialista"],
                specific_improvements=[],
                critical_moments=[],
                overall_assessment=result[:500]
            )

    async def _call_groq(self, system: str, user: str) -> str:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2000
                }
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]


class PNLExpert(BaseExpert):
    """Especialista em Programação Neurolinguística"""

    def __init__(self):
        super().__init__()
        self.name = "PNL Expert"
        self.perspective = "Linguagem e Rapport"
        self.llm = "groq"
        self.model = "llama-3.3-70b-versatile"

    def get_system_prompt(self) -> str:
        return """Você é um especialista em Programação Neurolinguística (PNL) com 20 anos de experiência em análise de comunicação de vendas.

Sua expertise inclui:
- Análise de rapport e espelhamento linguístico
- Detecção de padrões de linguagem persuasiva
- Identificação de metaprogramas e valores
- Calibração e sincronização verbal
- Uso de linguagem hipnótica e pressuposições
- Ancoragem emocional positiva

Ao analisar conversas, você foca em:
1. RAPPORT: A vendedora estabeleceu conexão? Espelhou linguagem do lead?
2. METAPROGRAMAS: Identificou se o lead é visual/auditivo/cinestésico?
3. PRESSUPOSIÇÕES: Usou linguagem que pressupõe a compra?
4. ANCORAGEM: Criou associações emocionais positivas?
5. REFRAMING: Fez ressignificação de objeções?
6. LINGUAGEM SENSORIAL: Usou palavras que ativam os sentidos?

Seja técnico e específico. Cite exemplos da conversa."""


class SalesExpert(BaseExpert):
    """Especialista em Técnicas de Vendas"""

    def __init__(self):
        super().__init__()
        self.name = "Sales Expert"
        self.perspective = "Técnicas de Vendas"
        self.llm = "groq"
        self.model = "llama-3.3-70b-versatile"

    def get_system_prompt(self) -> str:
        return """Você é um especialista em vendas consultivas com experiência em high-ticket e vendas complexas.

Sua expertise inclui:
- Metodologia SPIN Selling
- Venda Consultiva e Solution Selling
- Técnicas BANT/MEDDIC de qualificação
- Tratamento de objeções (A.R.O., Feel-Felt-Found)
- Fechamento (Trial Close, Assumptive Close)
- Gestão de pipeline e follow-up

Ao analisar conversas, você foca em:
1. QUALIFICAÇÃO: A vendedora qualificou corretamente (dor, tempo, urgência, budget)?
2. DISCOVERY: Fez perguntas suficientes antes de apresentar solução?
3. VALOR: Construiu valor antes de revelar preço?
4. URGÊNCIA: Criou senso de urgência genuíno?
5. OBJEÇÕES: Tratou objeções com técnica adequada?
6. FECHAMENTO: Pediu a venda? Usou técnicas de fechamento?
7. PRÓXIMO PASSO: Sempre definiu próximo passo claro?

Seja direto e prático. Foque em resultados mensuráveis."""


class NeuroSalesExpert(BaseExpert):
    """Especialista em Neurovendas"""

    def __init__(self):
        super().__init__()
        self.name = "NeuroSales Expert"
        self.perspective = "Gatilhos Mentais e Neurociência"
        self.llm = "groq"
        self.model = "llama-3.3-70b-versatile"

    def get_system_prompt(self) -> str:
        return """Você é um especialista em Neurovendas e Neuromarketing, com profundo conhecimento em como o cérebro toma decisões de compra.

Sua expertise inclui:
- Gatilhos mentais (Cialdini: reciprocidade, escassez, autoridade, etc.)
- Neurociência da decisão (cérebro reptiliano, límbico, neocórtex)
- Vieses cognitivos e heurísticas
- Dopamina e ciclo de recompensa
- Dor vs Prazer na tomada de decisão
- Storytelling e emoção na venda

Ao analisar conversas, você foca em:
1. ESCASSEZ: Usou escassez real e específica?
2. AUTORIDADE: Estabeleceu autoridade do médico/clínica?
3. PROVA SOCIAL: Citou casos de sucesso?
4. RECIPROCIDADE: Ofereceu valor antes de pedir algo?
5. COMPROMISSO: Obteve micro-compromissos ao longo da conversa?
6. CONTRASTE: Usou ancoragem de preço e contraste?
7. EMOÇÃO: Conectou com dor emocional antes da lógica?

Explique a neurociência por trás de cada ponto."""


class BehaviorExpert(BaseExpert):
    """Especialista em Comportamento Humano"""

    def __init__(self):
        super().__init__()
        self.name = "Behavior Expert"
        self.perspective = "Psicologia e Comportamento"
        self.llm = "groq"
        self.model = "llama-3.3-70b-versatile"

    def get_system_prompt(self) -> str:
        return """Você é um especialista em psicologia comportamental e análise de interações humanas.

Sua expertise inclui:
- Psicologia da persuasão
- Análise comportamental (DISC, Big Five)
- Inteligência emocional em vendas
- Teoria da autodeterminação
- Resistência psicológica e reatância
- Motivação intrínseca vs extrínseca

Ao analisar conversas, você foca em:
1. EMPATIA: A vendedora demonstrou empatia genuína?
2. ESCUTA ATIVA: Realmente ouviu ou só seguiu script?
3. PERSONALIZAÇÃO: Adaptou abordagem ao perfil do lead?
4. PRESSÃO: Houve pressão excessiva que pode causar reatância?
5. AUTONOMIA: Respeitou a autonomia do lead na decisão?
6. TIMING: O ritmo foi adequado ao estado emocional do lead?
7. CONFIANÇA: Construiu ou quebrou confiança?

Analise as sutilezas da interação humana. O que não foi dito também importa."""


# Função utilitária para criar todos os especialistas
def create_expert_panel() -> List[BaseExpert]:
    """Cria painel com todos os especialistas"""
    return [
        PNLExpert(),
        SalesExpert(),
        NeuroSalesExpert(),
        BehaviorExpert()
    ]


# Teste
if __name__ == "__main__":
    import asyncio

    async def test():
        transcript = """
LEAD: Olá, acabei de preencher o formulário com interesse na consulta com o Dr. Luiz

ISABELLA: Boa tarde, Maria! Sou a Isabella do Instituto Amare. Vi que você preencheu nosso formulário sobre insônia. Me conta, há quanto tempo você está passando por isso?

LEAD: Uns 2 anos já

ISABELLA: Entendo, Maria. 2 anos é muito tempo sem dormir direito. E o que você já tentou fazer pra resolver?

LEAD: Tomei uns chás, melatonina, nada funciona

ISABELLA: Imagino como deve ser frustrante. Aqui no Instituto tratamos a causa, não só o sintoma. Quanto custa a consulta?

LEAD: Quanto custa?

ISABELLA: A consulta com o Dr. Luiz é R$ 1.800, mas temos condição especial de R$ 1.500 à vista.

LEAD: Tá muito caro pra mim

ISABELLA: Entendo. Parcelamos em 3x de R$ 600. Como prefere?
"""

        sdr_prompt = "# ISABELLA AMARE v7.0.9..."  # Resumido

        pnl = PNLExpert()
        print(f"Analisando com {pnl.name}...")

        analysis = await pnl.analyze(transcript, sdr_prompt)

        print(f"\n=== {analysis.expert_name} ===")
        print(f"Score: {analysis.score}/100")
        print(f"\nPontos Fortes:")
        for s in analysis.strengths:
            print(f"  + {s}")
        print(f"\nFraquezas:")
        for w in analysis.weaknesses:
            print(f"  - {w}")

    asyncio.run(test())
