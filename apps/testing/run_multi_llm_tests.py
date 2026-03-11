#!/usr/bin/env python3
"""
AI Factory - Multi-LLM E2E Test Runner
=======================================
Compara Groq, Claude e Gemini no MESMO teste!

Uso:
    python run_multi_llm_tests.py                    # Roda comparação padrão
    python run_multi_llm_tests.py --agent "Julia Amare"  # Agente específico
    python run_multi_llm_tests.py --quick            # Teste rápido
    python run_multi_llm_tests.py --llms groq,gemini # Só esses LLMs

Custos são salvos automaticamente na tabela llm_costs do Supabase!
"""

import asyncio
import argparse
import os
import sys

# API Keys - configure as suas!
os.environ.setdefault('GROQ_API_KEY', os.getenv('GROQ_API_KEY', ''))
os.environ.setdefault('ANTHROPIC_API_KEY', os.getenv('ANTHROPIC_API_KEY', ''))
os.environ.setdefault('GEMINI_API_KEY', os.getenv('GEMINI_API_KEY', ''))

from e2e_testing.multi_llm_runner import (
    MultiLLMTestRunner,
    MultiLLMScenario,
    LLMProvider
)
from e2e_testing import AgentLoader, LeadPersona


# Cenários padrão
DEFAULT_SCENARIOS = [
    MultiLLMScenario(
        name="multi_hot_lead",
        description="Lead quente - comparação de qualidade",
        agent_name="Julia Amare",
        initial_mode="first_contact",
        lead_persona=LeadPersona.HOT,
        expected_outcome="schedule",
        expected_mode_transitions=["first_contact", "scheduler"],
        max_turns=10,
        tags=["multi", "hot"]
    ),
    MultiLLMScenario(
        name="multi_objection",
        description="Objeção de preço - teste de persuasão",
        agent_name="Julia Amare",
        initial_mode="first_contact",
        lead_persona=LeadPersona.OBJECTION_PRICE,
        expected_outcome="objection_resolved",
        expected_mode_transitions=["first_contact", "objection_handler"],
        max_turns=12,
        tags=["multi", "objection"]
    ),
]

QUICK_SCENARIOS = [
    MultiLLMScenario(
        name="quick_multi_test",
        description="Teste rápido multi-LLM",
        agent_name="Julia Amare",
        initial_mode="first_contact",
        lead_persona=LeadPersona.HOT,
        expected_outcome="schedule",
        expected_mode_transitions=["first_contact", "scheduler"],
        max_turns=6,
        tags=["quick", "multi"]
    ),
]


def check_api_keys():
    """Verifica quais API keys estão configuradas"""
    keys = {
        "GROQ": bool(os.getenv('GROQ_API_KEY')),
        "CLAUDE": bool(os.getenv('ANTHROPIC_API_KEY')),
        "GEMINI": bool(os.getenv('GEMINI_API_KEY'))
    }
    return keys


def create_scenarios_for_agent(agent_name: str, modes: list):
    """Cria cenários para um agente"""
    scenarios = []

    if "first_contact" in modes:
        scenarios.append(MultiLLMScenario(
            name=f"multi_{agent_name.lower().replace(' ', '_')}_hot",
            description=f"Lead quente com {agent_name}",
            agent_name=agent_name,
            initial_mode="first_contact",
            lead_persona=LeadPersona.HOT,
            expected_outcome="schedule",
            expected_mode_transitions=["first_contact", "scheduler"] if "scheduler" in modes else [],
            max_turns=10,
            tags=["multi", agent_name.lower()]
        ))

    if "objection_handler" in modes:
        scenarios.append(MultiLLMScenario(
            name=f"multi_{agent_name.lower().replace(' ', '_')}_objection",
            description=f"Objeção com {agent_name}",
            agent_name=agent_name,
            initial_mode="first_contact" if "first_contact" in modes else modes[0],
            lead_persona=LeadPersona.OBJECTION_PRICE,
            expected_outcome="objection_resolved",
            expected_mode_transitions=["objection_handler"],
            max_turns=12,
            tags=["multi", "objection"]
        ))

    return scenarios


async def main():
    parser = argparse.ArgumentParser(description='Multi-LLM E2E Test - Compare Groq, Claude, Gemini!')
    parser.add_argument('--agent', type=str, help='Nome do agente')
    parser.add_argument('--quick', action='store_true', help='Teste rápido')
    parser.add_argument('--llms', type=str, help='LLMs a usar (ex: groq,gemini)')
    parser.add_argument('--list-agents', action='store_true', help='Lista agentes')

    args = parser.parse_args()

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🔬 MULTI-LLM E2E TEST RUNNER                                ║
    ║   Compare Groq, Claude e Gemini no mesmo teste!               ║
    ║                                                               ║
    ║   💾 Custos salvos automaticamente em llm_costs               ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Verificar API keys
    keys = check_api_keys()
    print("🔑 API Keys configuradas:")
    for name, ok in keys.items():
        emoji = "✅" if ok else "❌"
        print(f"   {emoji} {name}")

    available_count = sum(keys.values())
    if available_count < 2:
        print("\n⚠️  Precisa de pelo menos 2 API keys para comparar!")
        print("\nConfigure assim:")
        print("  export GROQ_API_KEY='gsk_...'")
        print("  export ANTHROPIC_API_KEY='sk-ant-...'")
        print("  export GEMINI_API_KEY='...'")
        print("\nLinks:")
        print("  Groq: https://console.groq.com/keys")
        print("  Claude: https://console.anthropic.com/")
        print("  Gemini: https://aistudio.google.com/apikey")
        sys.exit(1)

    print()

    loader = AgentLoader()

    if args.list_agents:
        agents = loader.list_available_agents()
        print("📋 AGENTES DISPONÍVEIS:")
        for ag in agents:
            print(f"   • {ag['agent_name']} ({ag['version']})")
        sys.exit(0)

    # Inicializar runner
    runner = MultiLLMTestRunner()

    print(f"🤖 LLMs disponíveis: {', '.join(runner.get_available_llms())}\n")

    # Selecionar cenários
    if args.quick:
        scenarios = QUICK_SCENARIOS
        print("📌 Modo QUICK\n")
    elif args.agent:
        agent = loader.load_agent(agent_name=args.agent)
        if not agent:
            print(f"❌ Agente '{args.agent}' não encontrado!")
            sys.exit(1)
        print(f"📌 Testando: {agent.agent_name}")
        scenarios = create_scenarios_for_agent(agent.agent_name, agent.get_available_modes())
    else:
        scenarios = DEFAULT_SCENARIOS
        print(f"📌 Rodando {len(scenarios)} cenários padrão\n")

    # Rodar comparações
    await runner.run_all_comparisons(scenarios)

    # Resumo de custos
    print("\n💵 CUSTOS SALVOS NO SUPABASE (tabela llm_costs)")
    print("   Acesse seu dashboard para visualizar!\n")


if __name__ == "__main__":
    asyncio.run(main())
