"""
Debate Orchestrator
==================
Orquestra o debate entre os agentes especializados para melhorar prompts.
Gerencia rodadas de crítica, defesa e consultoria especializada.
"""

import logging
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass, field

from .agent_05_critic_sales import CriticSalesAgent
from .agent_06_advocate_persuasion import AdvocatePersuasionAgent
from .agent_07_judge_conversion import JudgeConversionAgent
from .agent_08_expert_emotions import ExpertEmotionsAgent
from .agent_09_expert_objections import ExpertObjectionsAgent
from .agent_10_expert_rapport import ExpertRapportAgent

logger = logging.getLogger(__name__)


@dataclass
class DebateRound:
    """Representa uma rodada do debate."""
    round_number: int
    prompt_version: str
    criticism: Optional[Dict] = None
    defense: Optional[Dict] = None
    expert_opinions: Dict = field(default_factory=dict)
    judgment: Optional[Dict] = None
    improvements_suggested: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class DebateResult:
    """Resultado final do debate."""
    original_prompt: str
    final_prompt: str
    total_rounds: int
    rounds: List[DebateRound]
    final_score: float
    verdict: str
    key_improvements: List[str]
    total_tokens_used: int
    duration_seconds: float


class DebateOrchestrator:
    """
    Orquestra o debate entre agentes para melhorar prompts de vendas.

    Fluxo:
    1. Crítico ataca o prompt (encontra falhas)
    2. Defensor defende e propõe melhorias
    3. Especialistas consultam (emoções, objeções, rapport)
    4. Juiz dá veredito e score
    5. Se score < threshold, nova rodada com prompt melhorado
    """

    def __init__(
        self,
        max_rounds: int = 3,
        approval_threshold: float = 70.0,
        include_experts: bool = True
    ):
        """
        Inicializa o orquestrador.

        Args:
            max_rounds: Máximo de rodadas de debate
            approval_threshold: Score mínimo para aprovar (0-100)
            include_experts: Se inclui especialistas (emoções, objeções, rapport)
        """
        self.max_rounds = max_rounds
        self.approval_threshold = approval_threshold
        self.include_experts = include_experts

        # Inicializar agentes
        self.critic = CriticSalesAgent()
        self.advocate = AdvocatePersuasionAgent()
        self.judge = JudgeConversionAgent()

        if include_experts:
            self.expert_emotions = ExpertEmotionsAgent()
            self.expert_objections = ExpertObjectionsAgent()
            self.expert_rapport = ExpertRapportAgent()
        else:
            self.expert_emotions = None
            self.expert_objections = None
            self.expert_rapport = None

        self.rounds: List[DebateRound] = []
        self.total_tokens = 0

    async def run_debate(
        self,
        prompt: str,
        context: Dict = None,
        verbose: bool = True
    ) -> DebateResult:
        """
        Executa o debate completo sobre um prompt.

        Args:
            prompt: O prompt a ser debatido
            context: Contexto do negócio (produto, público, ticket, etc)
            verbose: Se imprime progresso

        Returns:
            DebateResult com todo o histórico e prompt final
        """
        context = context or {}
        start_time = datetime.now()
        current_prompt = prompt
        self.rounds = []
        self.total_tokens = 0

        if verbose:
            print("\n" + "="*60)
            print("🎭 INICIANDO DEBATE DE PROMPT")
            print("="*60)

        for round_num in range(1, self.max_rounds + 1):
            if verbose:
                print(f"\n📍 RODADA {round_num}/{self.max_rounds}")
                print("-"*40)

            # Executar rodada
            round_result = await self._execute_round(
                round_num,
                current_prompt,
                context,
                verbose
            )
            self.rounds.append(round_result)

            # Verificar veredito
            if round_result.judgment:
                judgment = round_result.judgment.get("judgment", {})
                score = judgment.get("final_score", 0)
                verdict = judgment.get("verdict", "REVISÃO")

                if verbose:
                    print(f"\n📊 Score: {score}/100 | Veredito: {verdict}")

                # Se aprovado ou última rodada, parar
                if score >= self.approval_threshold or verdict == "APROVA":
                    if verbose:
                        print(f"✅ APROVADO! Score {score} >= {self.approval_threshold}")
                    break

                if round_num == self.max_rounds:
                    if verbose:
                        print(f"⚠️ Máximo de rodadas atingido. Score final: {score}")
                    break

                # Gerar prompt melhorado para próxima rodada
                current_prompt = await self._generate_improved_prompt(
                    current_prompt,
                    round_result,
                    context
                )

                if verbose:
                    print(f"\n🔄 Gerando versão melhorada para próxima rodada...")

        # Compilar resultado final
        duration = (datetime.now() - start_time).total_seconds()
        final_round = self.rounds[-1]
        final_judgment = final_round.judgment.get("judgment", {}) if final_round.judgment else {}

        result = DebateResult(
            original_prompt=prompt,
            final_prompt=current_prompt,
            total_rounds=len(self.rounds),
            rounds=self.rounds,
            final_score=final_judgment.get("final_score", 0),
            verdict=final_judgment.get("verdict", "REVISÃO"),
            key_improvements=self._extract_key_improvements(),
            total_tokens_used=self.total_tokens,
            duration_seconds=duration
        )

        if verbose:
            self._print_summary(result)

        return result

    async def _execute_round(
        self,
        round_num: int,
        prompt: str,
        context: Dict,
        verbose: bool
    ) -> DebateRound:
        """Executa uma rodada do debate."""

        round_result = DebateRound(
            round_number=round_num,
            prompt_version=prompt
        )

        # 1. Crítico ataca
        if verbose:
            print("🔴 Crítico analisando...")

        criticism = await self.critic.critique(prompt, context)
        round_result.criticism = criticism
        self.total_tokens += criticism.get("tokens_used", 0)

        # 2. Defensor defende
        if verbose:
            print("🟢 Defensor analisando...")

        defense = await self.advocate.defend(prompt, context)
        round_result.defense = defense
        self.total_tokens += defense.get("tokens_used", 0)

        # 3. Especialistas consultam (em paralelo se possível)
        if self.include_experts:
            if verbose:
                print("🔵 Especialistas consultando...")

            expert_tasks = [
                self.expert_emotions.analyze(prompt, context),
                self.expert_objections.analyze(prompt, context),
                self.expert_rapport.analyze(prompt, context)
            ]

            results = await asyncio.gather(*expert_tasks)

            round_result.expert_opinions = {
                "emotions": results[0],
                "objections": results[1],
                "rapport": results[2]
            }

            for result in results:
                self.total_tokens += result.get("tokens_used", 0)

        # 4. Juiz julga
        if verbose:
            print("⚖️ Juiz avaliando...")

        criticism_text = criticism.get("raw_response", "")
        defense_text = defense.get("raw_response", "")

        judgment = await self.judge.judge(
            prompt,
            context,
            criticism=criticism_text,
            defense=defense_text
        )
        round_result.judgment = judgment
        self.total_tokens += judgment.get("tokens_used", 0)

        return round_result

    async def _generate_improved_prompt(
        self,
        current_prompt: str,
        round_result: DebateRound,
        context: Dict
    ) -> str:
        """
        Gera uma versão melhorada do prompt baseado no feedback.
        Esta é uma versão simplificada - pode ser expandida para
        usar outro agente (Generator) para realmente reescrever.
        """
        # Por enquanto, retorna o mesmo prompt
        # TODO: Integrar com agent_03_generator para gerar nova versão
        return current_prompt

    def _extract_key_improvements(self) -> List[str]:
        """Extrai as principais melhorias sugeridas ao longo do debate."""
        improvements = []

        for round_data in self.rounds:
            # Extrair de críticas
            if round_data.criticism:
                critique = round_data.criticism.get("critique", {})
                if isinstance(critique, dict):
                    flaws = critique.get("critical_flaws", [])
                    for flaw in flaws[:2]:  # Top 2 por rodada
                        if isinstance(flaw, dict):
                            improvements.append(flaw.get("problem", ""))

            # Extrair de defesa
            if round_data.defense:
                defense = round_data.defense.get("defense", {})
                if isinstance(defense, dict):
                    missing = defense.get("missing_opportunities", [])
                    for opp in missing[:2]:
                        if isinstance(opp, dict):
                            improvements.append(opp.get("technique", ""))

        return list(set(improvements))[:10]  # Deduplica e limita

    def _print_summary(self, result: DebateResult):
        """Imprime resumo do debate."""
        print("\n" + "="*60)
        print("📋 RESUMO DO DEBATE")
        print("="*60)
        print(f"Rodadas: {result.total_rounds}")
        print(f"Score Final: {result.final_score}/100")
        print(f"Veredito: {result.verdict}")
        print(f"Tokens usados: {result.total_tokens_used:,}")
        print(f"Duração: {result.duration_seconds:.1f}s")

        if result.key_improvements:
            print("\n🔧 Principais pontos levantados:")
            for i, imp in enumerate(result.key_improvements[:5], 1):
                if imp:
                    print(f"   {i}. {imp}")

        print("="*60)


class QuickDebate:
    """
    Versão rápida do debate para análise express.
    Usa apenas crítico + defensor + juiz, sem especialistas.
    """

    def __init__(self):
        self.critic = CriticSalesAgent()
        self.advocate = AdvocatePersuasionAgent()
        self.judge = JudgeConversionAgent()

    async def analyze(self, prompt: str, context: Dict = None) -> Dict:
        """
        Análise rápida em uma rodada.

        Returns:
            Dict com crítica, defesa e veredito
        """
        context = context or {}

        # Executar em paralelo
        tasks = [
            self.critic.quick_critique(prompt),
            self.advocate.quick_defend(prompt),
        ]

        results = await asyncio.gather(*tasks)
        criticism, defense = results

        # Juiz avalia
        verdict = await self.judge.quick_verdict(prompt)

        return {
            "criticism": criticism,
            "defense": defense,
            "verdict": verdict
        }
