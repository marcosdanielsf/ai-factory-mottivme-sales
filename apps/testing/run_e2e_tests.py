#!/usr/bin/env python3
"""
AI Factory - E2E Test Runner
============================
Executa testes E2E completos simulando conversas reais.

Uso:
    python run_e2e_tests.py                    # Roda todos os cenários
    python run_e2e_tests.py --scenario hot     # Roda cenário específico
    python run_e2e_tests.py --quick            # Roda apenas 2 cenários rápidos
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
    E2ETestRunner,
    TestScenario,
    MetricsCollector,
    LeadPersona,
    AgentMode
)
from e2e_testing.test_runner import DEFAULT_TEST_SCENARIOS


# Cenários rápidos para teste
QUICK_SCENARIOS = [
    TestScenario(
        name="quick_hot_lead",
        description="Teste rápido - Lead quente",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.HOT,
        expected_outcome="schedule",
        expected_handoffs=[AgentMode.SCHEDULER],
        max_turns=6,
        tags=["quick", "hot"]
    ),
    TestScenario(
        name="quick_objection",
        description="Teste rápido - Objeção de preço",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.OBJECTION_PRICE,
        expected_outcome="objection_resolved",
        expected_handoffs=[AgentMode.OBJECTION_HANDLER],
        max_turns=8,
        tags=["quick", "objection"]
    )
]


async def main():
    parser = argparse.ArgumentParser(description='E2E Test Runner - Growth OS')
    parser.add_argument('--scenario', type=str, help='Nome do cenário específico')
    parser.add_argument('--quick', action='store_true', help='Rodar apenas cenários rápidos')
    parser.add_argument('--no-save', action='store_true', help='Não salvar no Supabase')
    parser.add_argument('--verbose', action='store_true', help='Modo verbose')

    args = parser.parse_args()

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🧪 E2E TEST RUNNER - GROWTH OS                              ║
    ║   Sistema de Testes End-to-End para Agentes Conversacionais   ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Selecionar cenários
    if args.quick:
        scenarios = QUICK_SCENARIOS
        print("📌 Modo QUICK: Rodando apenas 2 cenários rápidos\n")
    elif args.scenario:
        # Buscar cenário específico
        matching = [s for s in DEFAULT_TEST_SCENARIOS if args.scenario.lower() in s.name.lower()]
        if not matching:
            print(f"❌ Cenário '{args.scenario}' não encontrado")
            print(f"   Disponíveis: {[s.name for s in DEFAULT_TEST_SCENARIOS]}")
            sys.exit(1)
        scenarios = matching
        print(f"📌 Rodando cenário específico: {scenarios[0].name}\n")
    else:
        scenarios = DEFAULT_TEST_SCENARIOS
        print(f"📌 Rodando TODOS os {len(scenarios)} cenários\n")

    # Inicializar runner
    runner = E2ETestRunner()

    # Rodar testes
    results = await runner.run_all_scenarios(scenarios)

    # Salvar no Supabase
    if not args.no_save:
        print("\n💾 Salvando resultados no Supabase...")
        collector = MetricsCollector()
        save_result = collector.save_batch_results(
            results,
            agent_name="Julia",
            version="e2e-v1",
            location_id="instituto-amare"
        )
        print(f"   ✅ Salvos: {save_result['saved_count']} registros")
        if save_result['summary_id']:
            print(f"   📊 Summary ID: {save_result['summary_id']}")
        if save_result['errors']:
            print(f"   ⚠️ Erros: {save_result['errors']}")

    # Resumo final
    summary = runner.get_summary()
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
    ║  Taxa de Sucesso:    {summary['passed']/summary['total']*100 if summary['total'] else 0:5.1f}%                              ║
    ║  Tokens Usados:      {summary['total_tokens']:,}                             ║
    ║  Média de Turnos:    {summary['avg_turns']:.1f}                                  ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Retornar código de saída
    if summary['failed'] > 0 or summary['error'] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
