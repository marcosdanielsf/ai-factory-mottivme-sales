"""
Simulation Orchestrator - Orquestra todo o processo de simulação e melhoria
"""

import os
import asyncio
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime

from .lead_simulator import LeadSimulator, LeadPersona, LEAD_PERSONAS
from .sdr_simulator import SDRSimulator, SimulationContext
from .experts import create_expert_panel
from .debate import DebateOrchestrator, DebateResult


@dataclass
class SimulationRun:
    """Uma execução de simulação"""
    persona_name: str
    transcript: str
    turn_count: int
    outcome: str  # converted | lost | pending
    debate_result: Optional[DebateResult] = None


@dataclass
class SimulationReport:
    """Relatório completo de simulação"""
    timestamp: str
    prompt_version: str
    simulations: List[SimulationRun]
    overall_score: float
    needs_improvement: bool
    recommended_changes: List[Dict]
    new_prompt_version: Optional[str] = None


class SimulationOrchestrator:
    """Orquestra simulações de conversa e debate de especialistas"""

    def __init__(self, location_id: str = "sNwLyynZWP6jEtBy1ubf"):
        self.location_id = location_id
        self.sdr = SDRSimulator(location_id)
        self.debate_orchestrator = DebateOrchestrator()
        self.min_acceptable_score = 75  # Score mínimo para não precisar melhorar

    async def simulate_conversation(
        self,
        persona: LeadPersona,
        max_turns: int = 12
    ) -> SimulationRun:
        """Simula uma conversa completa entre lead e SDR"""

        print(f"\n{'='*60}")
        print(f"🎭 SIMULANDO: {persona.name} ({persona.lead_type.value})")
        print(f"{'='*60}")

        # Inicializa simuladores
        lead = LeadSimulator(persona)
        self.sdr.reset()

        # Carrega prompt se ainda não carregou
        if not self.sdr.system_prompt:
            await self.sdr.load_prompt()

        context = SimulationContext(
            lead_name=persona.name,
            lead_symptom=persona.symptom
        )

        # Primeira mensagem do lead
        lead_msg = lead.get_first_message()
        print(f"\n👤 LEAD: {lead_msg}")

        for turn in range(max_turns):
            # SDR responde
            try:
                sdr_response = await self.sdr.respond(lead_msg, context)
                print(f"\n🤖 ISABELLA: {sdr_response}")
            except Exception as e:
                print(f"\n❌ Erro SDR: {e}")
                break

            # Verifica se conversa deve terminar
            if any(x in sdr_response.lower() for x in ["fico no aguardo", "tenha um", "ótima noite", "bom descanso"]):
                break

            # Lead responde
            try:
                lead_msg = await lead.respond(sdr_response)
                print(f"\n👤 LEAD: {lead_msg}")
            except Exception as e:
                print(f"\n❌ Erro Lead: {e}")
                break

            # Verifica sinais de conversão ou perda
            if any(x in lead_msg.lower() for x in ["vou pensar", "agradeço", "não tenho interesse", "tchau"]):
                break
            if any(x in lead_msg.lower() for x in ["pode agendar", "quero marcar", "manda o pix", "fechado"]):
                break

        # Determina outcome
        transcript = self.sdr.get_conversation_transcript()

        if any(x in transcript.lower() for x in ["pix", "agendado", "confirmado", "fechado"]):
            outcome = "converted"
        elif any(x in transcript.lower() for x in ["vou pensar", "agradeço a atenção", "não tenho"]):
            outcome = "lost"
        else:
            outcome = "pending"

        return SimulationRun(
            persona_name=persona.name,
            transcript=transcript,
            turn_count=turn + 1,
            outcome=outcome
        )

    async def analyze_simulation(self, simulation: SimulationRun) -> SimulationRun:
        """Analisa uma simulação com o painel de especialistas"""

        print(f"\n{'='*60}")
        print(f"🔬 ANALISANDO CONVERSA: {simulation.persona_name}")
        print(f"{'='*60}")

        result = await self.debate_orchestrator.run_full_debate(
            simulation.transcript,
            self.sdr.system_prompt
        )

        simulation.debate_result = result
        return simulation

    async def run_full_simulation(
        self,
        personas: Optional[List[str]] = None,
        analyze: bool = True
    ) -> SimulationReport:
        """Executa simulação completa com múltiplas personas"""

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Carrega prompt
        print("\n📄 Carregando prompt...")
        version = await self.sdr.load_prompt()
        print(f"   Versão: {version}")

        # Define personas a simular
        if personas is None:
            personas = ["maria_preco", "claudia_emocional", "ana_ocupada"]

        simulations = []

        # Executa simulações
        for persona_name in personas:
            if persona_name not in LEAD_PERSONAS:
                print(f"⚠️ Persona '{persona_name}' não encontrada, pulando...")
                continue

            persona = LEAD_PERSONAS[persona_name]
            sim = await self.simulate_conversation(persona)

            if analyze:
                sim = await self.analyze_simulation(sim)

            simulations.append(sim)

        # Calcula score geral
        scores = [s.debate_result.average_score for s in simulations if s.debate_result]
        overall_score = sum(scores) / len(scores) if scores else 0

        # Consolida mudanças recomendadas
        all_changes = []
        for sim in simulations:
            if sim.debate_result:
                all_changes.extend(sim.debate_result.prompt_changes_recommended)

        # Remove duplicatas
        unique_changes = []
        seen_sections = set()
        for change in all_changes:
            section = change.get("section", "")
            if section not in seen_sections:
                unique_changes.append(change)
                seen_sections.add(section)

        needs_improvement = overall_score < self.min_acceptable_score

        report = SimulationReport(
            timestamp=timestamp,
            prompt_version=version,
            simulations=simulations,
            overall_score=overall_score,
            needs_improvement=needs_improvement,
            recommended_changes=unique_changes[:10]
        )

        return report

    def print_report(self, report: SimulationReport):
        """Imprime relatório formatado"""

        print(f"\n{'='*70}")
        print(f"📊 RELATÓRIO DE SIMULAÇÃO")
        print(f"{'='*70}")
        print(f"Data: {report.timestamp}")
        print(f"Versão do Prompt: {report.prompt_version}")
        print(f"Score Geral: {report.overall_score:.1f}/100")
        print(f"Precisa Melhorar: {'SIM ⚠️' if report.needs_improvement else 'NÃO ✅'}")

        print(f"\n📋 SIMULAÇÕES:")
        for sim in report.simulations:
            outcome_emoji = {"converted": "✅", "lost": "❌", "pending": "⏳"}.get(sim.outcome, "?")
            score = sim.debate_result.average_score if sim.debate_result else 0
            print(f"  • {sim.persona_name}: {outcome_emoji} {sim.outcome} | Score: {score:.0f} | Turnos: {sim.turn_count}")

        if report.recommended_changes:
            print(f"\n🔧 MUDANÇAS RECOMENDADAS:")
            for i, change in enumerate(report.recommended_changes[:5], 1):
                print(f"\n  {i}. Seção: {change.get('section', 'N/A')}")
                print(f"     Problema: {change.get('issue', 'N/A')}")
                print(f"     Sugestão: {change.get('suggested_text', 'N/A')[:200]}...")

        # Sumário dos debates
        print(f"\n📝 INSIGHTS DOS ESPECIALISTAS:")
        for sim in report.simulations:
            if sim.debate_result:
                print(f"\n  [{sim.persona_name}]")
                print(f"  {sim.debate_result.executive_summary}")

        print(f"\n{'='*70}")


# Script de execução
async def run_simulation():
    """Função principal para rodar simulação"""

    orchestrator = SimulationOrchestrator()

    # Simular com 3 personas diferentes
    report = await orchestrator.run_full_simulation(
        personas=["maria_preco", "patricia_pronta", "joana_cetica"],
        analyze=True
    )

    orchestrator.print_report(report)

    return report


if __name__ == "__main__":
    asyncio.run(run_simulation())
