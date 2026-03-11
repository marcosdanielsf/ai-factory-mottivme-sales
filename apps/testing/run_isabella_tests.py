#!/usr/bin/env python3
"""
AI Factory - Isabella v6.3 Test Runner
=======================================
Executa testes E2E específicos para Isabella Amare v6.3
Cobertura completa dos 7 modos operacionais.

Uso:
    python run_isabella_tests.py                    # Testes rápidos
    python run_isabella_tests.py --all              # Todos os cenários (17)
    python run_isabella_tests.py --priority         # 5 cenários prioritários
    python run_isabella_tests.py --mode sdr_inbound # Testes de um modo específico
"""

import asyncio
import argparse
import os
import sys

# API Keys
os.environ.setdefault(
    'GROQ_API_KEY',
    'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
)

from e2e_testing.groq_test_runner import GroqE2ETestRunner, TestStatus
from e2e_testing.scenarios_isabella_v63 import (
    get_isabella_scenarios,
    get_isabella_suite,
    IsabellaMode,
    ISABELLA_LEAD_PERSONAS
)
from e2e_testing import MetricsCollector


async def main():
    parser = argparse.ArgumentParser(description='Isabella v6.3 Test Runner')
    parser.add_argument('--all', action='store_true', help='Rodar todos os cenários (17)')
    parser.add_argument('--priority', action='store_true', help='Cenários prioritários (5)')
    parser.add_argument('--mode', type=str, help='Modo específico para testar')
    parser.add_argument('--list-modes', action='store_true', help='Lista modos disponíveis')
    parser.add_argument('--no-save', action='store_true', help='Não salvar no Supabase')

    args = parser.parse_args()

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🧪 ISABELLA v6.3 TEST RUNNER                                ║
    ║   Cobertura completa dos 7 modos operacionais                 ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    if args.list_modes:
        print("\n📋 MODOS DISPONÍVEIS NA ISABELLA v6.3:")
        print("=" * 50)
        suite = get_isabella_suite()
        for mode in IsabellaMode:
            scenarios = get_isabella_scenarios(mode.value)
            print(f"\n🔹 {mode.value}")
            print(f"   Cenários: {len(scenarios)}")
            for s in scenarios:
                print(f"      - {s.name}")
        print("\n" + "=" * 50)
        sys.exit(0)

    # Verificar API key
    if not os.getenv('GROQ_API_KEY') or 'xxxx' in os.getenv('GROQ_API_KEY', ''):
        print("❌ GROQ_API_KEY não configurada!")
        print("\nConfigure assim:")
        print("  export GROQ_API_KEY='gsk_sua_key_aqui'")
        sys.exit(1)

    # Selecionar cenários
    if args.all:
        scenarios = get_isabella_scenarios("all")
        print(f"📌 Modo COMPLETO: {len(scenarios)} cenários\n")
    elif args.priority:
        scenarios = get_isabella_scenarios("priority")
        print(f"📌 Modo PRIORITY: {len(scenarios)} cenários\n")
    elif args.mode:
        scenarios = get_isabella_scenarios(args.mode)
        if not scenarios:
            print(f"❌ Modo '{args.mode}' não encontrado!")
            print("Use --list-modes para ver modos disponíveis")
            sys.exit(1)
        print(f"📌 Modo {args.mode.upper()}: {len(scenarios)} cenários\n")
    else:
        scenarios = get_isabella_scenarios("quick")
        print(f"📌 Modo QUICK: {len(scenarios)} cenários\n")

    # Listar cenários
    print("📋 CENÁRIOS A EXECUTAR:")
    for i, s in enumerate(scenarios, 1):
        print(f"   {i}. {s.name} ({s.initial_mode})")
    print()

    # Rodar
    runner = GroqE2ETestRunner()
    results = await runner.run_all_scenarios(scenarios)

    # Salvar no Supabase
    if not args.no_save and results:
        print("\n💾 Salvando no Supabase...")
        collector = MetricsCollector()

        save_result = collector.save_e2e_suite_dashboard_format(
            results=results,
            agent_name="Isabella Amare",
            version="v6.3",
            location_id="instituto-amare"
        )

        print(f"   ✅ Salvos: {save_result['saved_count']} registros")
        if save_result['errors']:
            print(f"   ⚠️ Erros: {save_result['errors']}")

    # Resumo
    summary = runner.get_summary()
    pass_rate = summary['passed']/summary['total']*100 if summary['total'] else 0

    # Breakdown por modo
    mode_results = {}
    for r in results:
        mode = r.scenario.initial_mode
        if mode not in mode_results:
            mode_results[mode] = {"passed": 0, "failed": 0, "timeout": 0}
        if r.status == TestStatus.PASSED:
            mode_results[mode]["passed"] += 1
        elif r.status == TestStatus.TIMEOUT:
            mode_results[mode]["timeout"] += 1
        else:
            mode_results[mode]["failed"] += 1

    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                📊 RESUMO - ISABELLA v6.3                       ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║  Total:        {summary['total']:3d}                                          ║
    ║  ✅ Passou:    {summary['passed']:3d}                                          ║
    ║  ❌ Falhou:    {summary['failed']:3d}                                          ║
    ║  ⏱️ Timeout:   {summary['timeout']:3d}                                          ║
    ║                                                               ║
    ║  Taxa:         {pass_rate:5.1f}%                                        ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    print("📊 RESULTADOS POR MODO:")
    print("-" * 50)
    for mode, stats in mode_results.items():
        total = stats["passed"] + stats["failed"] + stats["timeout"]
        rate = stats["passed"]/total*100 if total else 0
        status = "✅" if rate >= 80 else "⚠️" if rate >= 50 else "❌"
        print(f"   {status} {mode}: {stats['passed']}/{total} ({rate:.0f}%)")
    print("-" * 50)

    if summary['failed'] > 0 or summary['error'] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
