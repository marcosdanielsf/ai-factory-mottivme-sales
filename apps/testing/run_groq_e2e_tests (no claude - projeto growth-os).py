#!/usr/bin/env python3
"""
AI Factory - Groq E2E Test Runner
=================================
Testes E2E usando Groq (Llama 3.1 70B) - 5-20x mais barato que Claude!

Uso:
    python run_groq_e2e_tests.py                    # Roda cenários padrão
    python run_groq_e2e_tests.py --agent "Julia Amare"  # Agente específico
    python run_groq_e2e_tests.py --quick            # 2 cenários rápidos
"""

import asyncio
import argparse
import os
import sys

# API Keys
os.environ.setdefault(
    'GROQ_API_KEY',
    'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'  # Substituir pela sua key
)

from e2e_testing.groq_test_runner import (
    GroqE2ETestRunner,
    GroqTestScenario,
    DEFAULT_GROQ_SCENARIOS,
    TestStatus,
    MODE_ALIASES
)
from e2e_testing import AgentLoader, LeadPersona, MetricsCollector

# Importar cenários completos (20 turnos por fluxo)
from e2e_testing.scenarios_inbound import INBOUND_SCENARIOS
from e2e_testing.scenarios_followup import FOLLOWUP_SCENARIOS, REACTIVATION_SCENARIOS
from e2e_testing.scenarios_edge_cases import EDGE_CASE_SCENARIOS


def get_sdr_mode(modes: list) -> str:
    """Retorna o modo de SDR/primeiro contato disponível"""
    for mode in ["sdr_inbound", "first_contact", "social_seller_instagram"]:
        if mode in modes:
            return mode
    return modes[0] if modes else "sdr_inbound"


def create_quick_scenarios():
    """Cenários rápidos"""
    return [
        GroqTestScenario(
            name="groq_quick_hot",
            description="Teste rápido - Lead quente",
            agent_name="Isabella Amare",
            initial_mode="sdr_inbound",
            lead_persona=LeadPersona.HOT,
            expected_outcome="schedule",
            expected_mode_transitions=["sdr_inbound", "scheduler"],
            max_turns=8,
            tags=["quick", "groq"]
        ),
        GroqTestScenario(
            name="groq_quick_objection",
            description="Teste rápido - Objeção preço",
            agent_name="Isabella Amare",
            initial_mode="sdr_inbound",
            lead_persona=LeadPersona.OBJECTION_PRICE,
            expected_outcome="objection_resolved",
            expected_mode_transitions=["sdr_inbound", "objection_handler"],
            max_turns=10,
            tags=["quick", "groq", "objection"]
        )
    ]


def create_scenarios_for_agent(agent_name: str, modes: list):
    """Cria cenários para um agente baseado nos modos disponíveis"""
    scenarios = []
    sdr_mode = get_sdr_mode(modes)

    # Cenário de lead quente (SDR)
    if sdr_mode in modes:
        scenarios.append(GroqTestScenario(
            name=f"groq_{agent_name.lower().replace(' ', '_')}_hot",
            description=f"Lead quente com {agent_name}",
            agent_name=agent_name,
            initial_mode=sdr_mode,
            lead_persona=LeadPersona.HOT,
            expected_outcome="schedule",
            expected_mode_transitions=[sdr_mode, "scheduler"] if "scheduler" in modes else [sdr_mode],
            max_turns=12,
            tags=["groq", agent_name.lower()]
        ))

        scenarios.append(GroqTestScenario(
            name=f"groq_{agent_name.lower().replace(' ', '_')}_warm",
            description=f"Lead morno com {agent_name}",
            agent_name=agent_name,
            initial_mode=sdr_mode,
            lead_persona=LeadPersona.WARM,
            expected_outcome="schedule",
            expected_mode_transitions=[sdr_mode, "scheduler"] if "scheduler" in modes else [sdr_mode],
            max_turns=15,
            tags=["groq", agent_name.lower()]
        ))

    # Cenário de objeção
    if "objection_handler" in modes:
        scenarios.append(GroqTestScenario(
            name=f"groq_{agent_name.lower().replace(' ', '_')}_objection",
            description=f"Objeção preço com {agent_name}",
            agent_name=agent_name,
            initial_mode=sdr_mode,
            lead_persona=LeadPersona.OBJECTION_PRICE,
            expected_outcome="objection_resolved",
            expected_mode_transitions=[sdr_mode, "objection_handler"],
            max_turns=15,
            tags=["groq", agent_name.lower(), "objection"]
        ))

    # Cenário de scheduler direto
    if "scheduler" in modes:
        scenarios.append(GroqTestScenario(
            name=f"groq_{agent_name.lower().replace(' ', '_')}_scheduler",
            description=f"Scheduler direto com {agent_name}",
            agent_name=agent_name,
            initial_mode="scheduler",
            lead_persona=LeadPersona.HOT,
            expected_outcome="appointment_booked",
            expected_mode_transitions=["scheduler"],
            max_turns=6,
            tags=["groq", agent_name.lower(), "scheduler"]
        ))

    # Cenário de concierge (se disponível)
    if "concierge" in modes:
        scenarios.append(GroqTestScenario(
            name=f"groq_{agent_name.lower().replace(' ', '_')}_concierge",
            description=f"Concierge pré-consulta com {agent_name}",
            agent_name=agent_name,
            initial_mode="concierge",
            lead_persona=LeadPersona.HOT,
            expected_outcome="confirmed_attendance",
            expected_mode_transitions=["concierge"],
            max_turns=6,
            tags=["groq", agent_name.lower(), "concierge"]
        ))

    # Cenário de followuper/reativador (se disponível)
    for followup_mode in ["followuper", "reativador_base"]:
        if followup_mode in modes:
            scenarios.append(GroqTestScenario(
                name=f"groq_{agent_name.lower().replace(' ', '_')}_{followup_mode}",
                description=f"Reativação com {agent_name}",
                agent_name=agent_name,
                initial_mode=followup_mode,
                lead_persona=LeadPersona.COLD,
                expected_outcome="reengaged",
                expected_mode_transitions=[followup_mode, sdr_mode],
                max_turns=10,
                tags=["groq", agent_name.lower(), "followup"]
            ))
            break  # Só um cenário de followup

    # Cenário de social seller (se disponível)
    if "social_seller_instagram" in modes:
        scenarios.append(GroqTestScenario(
            name=f"groq_{agent_name.lower().replace(' ', '_')}_social",
            description=f"Social selling com {agent_name}",
            agent_name=agent_name,
            initial_mode="social_seller_instagram",
            lead_persona=LeadPersona.WARM,
            expected_outcome="schedule",
            expected_mode_transitions=["social_seller_instagram", "scheduler"],
            max_turns=15,
            tags=["groq", agent_name.lower(), "social"]
        ))

    return scenarios


async def main():
    parser = argparse.ArgumentParser(description='Groq E2E Test Runner - 5-20x mais barato!')
    parser.add_argument('--agent', type=str, help='Nome do agente')
    parser.add_argument('--quick', action='store_true', help='Cenários rápidos')
    parser.add_argument('--full', action='store_true', help='Cenários completos (20 turnos por fluxo)')
    parser.add_argument('--flow', type=str, choices=['inbound', 'followup', 'edge', 'all'],
                       help='Fluxo específico para --full')
    parser.add_argument('--list-agents', action='store_true', help='Lista agentes')
    parser.add_argument('--no-save', action='store_true', help='Não salvar no Supabase')

    args = parser.parse_args()

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🚀 GROQ E2E TEST RUNNER                                     ║
    ║   Llama 3.1 70B - 5-20x mais barato que Claude!               ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Verificar API key
    if not os.getenv('GROQ_API_KEY') or 'xxxx' in os.getenv('GROQ_API_KEY', ''):
        print("❌ GROQ_API_KEY não configurada!")
        print("\nConfigure assim:")
        print("  export GROQ_API_KEY='gsk_sua_key_aqui'")
        print("\nOu edite o arquivo run_groq_e2e_tests.py")
        print("\nPegue sua key em: https://console.groq.com/keys")
        sys.exit(1)

    loader = AgentLoader()

    if args.list_agents:
        agents = loader.list_available_agents()
        print("\n📋 AGENTES DISPONÍVEIS:")
        print("=" * 60)
        for ag in agents:
            print(f"\n🤖 {ag['agent_name']} ({ag['version']})")
            print(f"   Modos: {', '.join(ag['modes'])}")
        print("\n" + "=" * 60)
        sys.exit(0)

    # Selecionar cenários
    if args.quick:
        scenarios = create_quick_scenarios()
        print("📌 Modo QUICK: 2 cenários rápidos\n")
    elif args.full:
        # Cenários completos (20 turnos por fluxo)
        flow = args.flow or 'all'
        scenarios = []

        if flow in ['inbound', 'all']:
            scenarios.extend(INBOUND_SCENARIOS)
        if flow in ['followup', 'all']:
            scenarios.extend(FOLLOWUP_SCENARIOS)
            scenarios.extend(REACTIVATION_SCENARIOS)
        if flow in ['edge', 'all']:
            scenarios.extend(EDGE_CASE_SCENARIOS)

        # Adaptar para o agente se especificado
        if args.agent:
            agent = loader.load_agent(agent_name=args.agent)
            if agent:
                for scenario in scenarios:
                    scenario.agent_name = agent.agent_name
                print(f"📌 Modo FULL: {len(scenarios)} cenários completos para {agent.agent_name}\n")
            else:
                print(f"⚠️ Agente '{args.agent}' não encontrado, usando nomes originais dos cenários\n")
        else:
            print(f"📌 Modo FULL: {len(scenarios)} cenários completos ({flow})\n")
    elif args.agent:
        agent = loader.load_agent(agent_name=args.agent)
        if not agent:
            print(f"❌ Agente '{args.agent}' não encontrado!")
            sys.exit(1)
        print(f"📌 Testando: {agent.agent_name} ({agent.version})")
        print(f"   Modos: {agent.get_available_modes()}\n")
        scenarios = create_scenarios_for_agent(agent.agent_name, agent.get_available_modes())
    else:
        scenarios = DEFAULT_GROQ_SCENARIOS
        print(f"📌 Rodando {len(scenarios)} cenários padrão\n")

    # Rodar
    runner = GroqE2ETestRunner()
    results = await runner.run_all_scenarios(scenarios)

    # Salvar no Supabase - FORMATO CORRETO PARA DASHBOARD
    if not args.no_save and results:
        print("\n💾 Salvando no Supabase (formato Dashboard)...")

        # Pegar nome do primeiro agente testado
        first_agent = results[0].agent if hasattr(results[0], 'agent') and results[0].agent else None
        agent_name = first_agent.agent_name if first_agent else args.agent or "Unknown"
        version = first_agent.version if first_agent else "groq-e2e"

        collector = MetricsCollector()

        # USAR NOVO MÉTODO QUE SALVA NO FORMATO CORRETO DO DASHBOARD
        # Este método cria validation_result com:
        # - validator.test_results[] (name, input, score, passed, feedback, simulated_response)
        # - totals (total_tokens, total_time_ms)
        # - sales_analysis (classification, score)
        save_result = collector.save_e2e_suite_dashboard_format(
            results=results,
            agent_name=agent_name,
            version=version,
            location_id="instituto-amare"
        )

        print(f"   ✅ Salvos: {save_result['saved_count']} registros no formato Dashboard")
        if save_result['errors']:
            print(f"   ⚠️ Erros: {save_result['errors']}")

    # Resumo
    summary = runner.get_summary()
    pass_rate = summary['passed']/summary['total']*100 if summary['total'] else 0

    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                    📊 RESUMO FINAL (GROQ)                     ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║  Total:        {summary['total']:3d}                                          ║
    ║  ✅ Passou:    {summary['passed']:3d}                                          ║
    ║  ❌ Falhou:    {summary['failed']:3d}                                          ║
    ║  ⏱️ Timeout:   {summary['timeout']:3d}                                          ║
    ║  💥 Erro:      {summary['error']:3d}                                          ║
    ║                                                               ║
    ║  Taxa:         {pass_rate:5.1f}%                                        ║
    ║  Tokens:       {summary['total_tokens']:,}                                   ║
    ║  Média Turnos: {summary['avg_turns']:.1f}                                        ║
    ║                                                               ║
    ║  💰 Custo estimado: ~${summary['total_tokens'] * 0.7 / 1000000:.4f}                            ║
    ║     (vs Claude: ~${summary['total_tokens'] * 9 / 1000000:.4f})                            ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    if summary['failed'] > 0 or summary['error'] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
