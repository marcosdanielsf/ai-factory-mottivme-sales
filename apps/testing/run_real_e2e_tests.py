#!/usr/bin/env python3
"""
AI Factory - Real E2E Test Runner
=================================
Executa testes E2E com agentes REAIS carregados do Supabase.

Uso:
    python run_real_e2e_tests.py                    # Roda todos os cenários
    python run_real_e2e_tests.py --agent Julia      # Testa agente específico
    python run_real_e2e_tests.py --quick            # Roda apenas 2 cenários rápidos
    python run_real_e2e_tests.py --list-agents      # Lista agentes disponíveis
"""

import asyncio
import argparse
import os
import sys

# Configurar API key
os.environ.setdefault(
    'ANTHROPIC_API_KEY',
    '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'
)

from e2e_testing import (
    RealE2ETestRunner,
    RealTestScenario,
    RealTestResult,
    AgentLoader,
    MetricsCollector,
    LeadPersona
)
from e2e_testing.real_test_runner import DEFAULT_REAL_SCENARIOS, TestStatus


def list_available_agents():
    """Lista todos os agentes disponíveis no Supabase"""
    loader = AgentLoader()
    agents = loader.list_available_agents()

    print("\n📋 AGENTES DISPONÍVEIS NO SUPABASE")
    print("=" * 60)

    for agent in agents:
        print(f"\n🤖 {agent['agent_name']} ({agent['version']})")
        print(f"   Location: {agent['location_id']}")
        print(f"   Modos: {', '.join(agent['modes'])}")

    print("\n" + "=" * 60)
    return agents


def create_quick_scenarios():
    """Cria cenários rápidos para teste"""
    return [
        RealTestScenario(
            name="quick_julia_hot",
            description="Teste rápido - Lead quente com Julia",
            agent_name="Julia",
            initial_mode="first_contact",
            lead_persona=LeadPersona.HOT,
            flow_type="sales_flow",
            expected_outcome="schedule",
            expected_mode_transitions=["first_contact", "scheduler"],
            max_turns=8,
            tags=["quick", "julia", "hot"]
        ),
        RealTestScenario(
            name="quick_julia_objection",
            description="Teste rápido - Objeção de preço com Julia",
            agent_name="Julia",
            initial_mode="first_contact",
            lead_persona=LeadPersona.OBJECTION_PRICE,
            flow_type="objection_flow",
            expected_outcome="objection_resolved",
            expected_mode_transitions=["first_contact", "objection_handler"],
            max_turns=10,
            tags=["quick", "julia", "objection"]
        )
    ]


def create_scenarios_for_agent(agent_name: str, modes: list):
    """Cria cenários de teste para um agente específico"""
    scenarios = []

    # Cenário 1: Lead quente - fluxo completo
    if "first_contact" in modes:
        scenarios.append(RealTestScenario(
            name=f"{agent_name.lower()}_hot_lead",
            description=f"Lead quente com {agent_name} - fluxo completo",
            agent_name=agent_name,
            initial_mode="first_contact",
            lead_persona=LeadPersona.HOT,
            flow_type="sales_flow",
            expected_outcome="schedule",
            expected_mode_transitions=["first_contact", "scheduler"] if "scheduler" in modes else ["first_contact"],
            max_turns=12,
            tags=[agent_name.lower(), "hot_lead"]
        ))

    # Cenário 2: Lead morno
    if "first_contact" in modes:
        scenarios.append(RealTestScenario(
            name=f"{agent_name.lower()}_warm_lead",
            description=f"Lead morno com {agent_name} - qualificação",
            agent_name=agent_name,
            initial_mode="first_contact",
            lead_persona=LeadPersona.WARM,
            flow_type="sales_flow",
            expected_outcome="schedule",
            expected_mode_transitions=["first_contact", "scheduler"] if "scheduler" in modes else ["first_contact"],
            max_turns=15,
            tags=[agent_name.lower(), "warm_lead"]
        ))

    # Cenário 3: Objeção de preço
    if "objection_handler" in modes:
        scenarios.append(RealTestScenario(
            name=f"{agent_name.lower()}_price_objection",
            description=f"Objeção de preço com {agent_name}",
            agent_name=agent_name,
            initial_mode="first_contact" if "first_contact" in modes else modes[0],
            lead_persona=LeadPersona.OBJECTION_PRICE,
            flow_type="objection_flow",
            expected_outcome="objection_resolved",
            expected_mode_transitions=["objection_handler"],
            max_turns=15,
            tags=[agent_name.lower(), "objection", "price"]
        ))

    # Cenário 4: Scheduler direto
    if "scheduler" in modes:
        scenarios.append(RealTestScenario(
            name=f"{agent_name.lower()}_scheduler_direct",
            description=f"Scheduler direto com {agent_name}",
            agent_name=agent_name,
            initial_mode="scheduler",
            lead_persona=LeadPersona.HOT,
            flow_type="sales_flow",
            expected_outcome="appointment_booked",
            expected_mode_transitions=["scheduler", "concierge"] if "concierge" in modes else ["scheduler"],
            max_turns=6,
            tags=[agent_name.lower(), "scheduler"]
        ))

    return scenarios


async def main():
    parser = argparse.ArgumentParser(description='Real E2E Test Runner - Growth OS')
    parser.add_argument('--agent', type=str, help='Nome do agente específico para testar')
    parser.add_argument('--quick', action='store_true', help='Rodar apenas cenários rápidos')
    parser.add_argument('--list-agents', action='store_true', help='Lista agentes disponíveis')
    parser.add_argument('--no-save', action='store_true', help='Não salvar no Supabase')
    parser.add_argument('--verbose', action='store_true', help='Modo verbose')

    args = parser.parse_args()

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🧪 REAL E2E TEST RUNNER - GROWTH OS                         ║
    ║   Testes com Agentes REAIS do Supabase                        ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Listar agentes
    if args.list_agents:
        list_available_agents()
        sys.exit(0)

    # Carregar agente loader
    loader = AgentLoader()

    # Selecionar cenários
    if args.quick:
        scenarios = create_quick_scenarios()
        print("📌 Modo QUICK: Rodando 2 cenários rápidos\n")

    elif args.agent:
        # Buscar agente específico
        agent = loader.load_agent(agent_name=args.agent)
        if not agent:
            print(f"❌ Agente '{args.agent}' não encontrado!")
            print("\nAgentes disponíveis:")
            list_available_agents()
            sys.exit(1)

        print(f"📌 Criando cenários para: {agent.agent_name} ({agent.version})")
        print(f"   Modos disponíveis: {agent.get_available_modes()}\n")

        scenarios = create_scenarios_for_agent(
            agent.agent_name,
            agent.get_available_modes()
        )

    else:
        scenarios = DEFAULT_REAL_SCENARIOS
        print(f"📌 Rodando TODOS os {len(scenarios)} cenários padrão\n")

    # Inicializar runner
    runner = RealE2ETestRunner()

    # Rodar testes
    results = await runner.run_all_scenarios(scenarios)

    # Salvar no Supabase - FORMATO CORRETO PARA DASHBOARD
    if not args.no_save and results:
        print("\n💾 Salvando resultados no Supabase (formato Dashboard)...")

        # Pegar nome do primeiro agente testado
        first_agent = results[0].agent if results[0].agent else None
        agent_name = first_agent.agent_name if first_agent else "Unknown"
        version = first_agent.version if first_agent else "e2e-test"

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

    # Resumo final
    summary = runner.get_summary()
    pass_rate = summary['passed']/summary['total']*100 if summary['total'] else 0

    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                    📊 RESUMO FINAL                            ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║  Total de Testes:    {summary['total']:3d}                                    ║
    ║  ✅ Passou:          {summary['passed']:3d}                                    ║
    ║  ❌ Falhou:          {summary['failed']:3d}                                    ║
    ║  ⏱️ Timeout:         {summary['timeout']:3d}                                    ║
    ║  💥 Erro:            {summary['error']:3d}                                    ║
    ║                                                               ║
    ║  Taxa de Sucesso:    {pass_rate:5.1f}%                              ║
    ║  Tokens Usados:      {summary['total_tokens']:,}                             ║
    ║  Média de Turnos:    {summary['avg_turns']:.1f}                                  ║
    ║  Modos Testados:     {len(summary['modes_coverage'])}                                     ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    if summary['modes_coverage']:
        print(f"   Modos: {', '.join(summary['modes_coverage'])}")

    # Retornar código de saída
    if summary['failed'] > 0 or summary['error'] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
