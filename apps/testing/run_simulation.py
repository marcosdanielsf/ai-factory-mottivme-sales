#!/usr/bin/env python3
"""
Run AI Sales Simulation
========================
Executa simulação de conversas com debate de especialistas.

Uso:
    python run_simulation.py                    # Simulação padrão (3 personas)
    python run_simulation.py --quick            # Simulação rápida (1 persona)
    python run_simulation.py --full             # Simulação completa (5 personas)
    python run_simulation.py --persona maria_preco  # Persona específica
"""

import os
import sys
import asyncio
import argparse

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configurar variáveis
os.environ.setdefault('GROQ_API_KEY', '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')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

from simulator.orchestrator import SimulationOrchestrator
from simulator.lead_simulator import LEAD_PERSONAS


def print_header():
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                    🎭 AI SALES SIMULATOR                          ║
║                    Debate Multi-LLM Engine                        ║
╚═══════════════════════════════════════════════════════════════════╝
""")


async def main():
    parser = argparse.ArgumentParser(description='AI Sales Simulation')
    parser.add_argument('--quick', action='store_true', help='Simulação rápida (1 persona)')
    parser.add_argument('--full', action='store_true', help='Simulação completa (todas personas)')
    parser.add_argument('--persona', type=str, help='Persona específica')
    parser.add_argument('--no-analyze', action='store_true', help='Pular análise de especialistas')
    parser.add_argument('--list-personas', action='store_true', help='Listar personas disponíveis')

    args = parser.parse_args()

    print_header()

    # Listar personas
    if args.list_personas:
        print("📋 PERSONAS DISPONÍVEIS:\n")
        for name, persona in LEAD_PERSONAS.items():
            print(f"  • {name}")
            print(f"    Tipo: {persona.lead_type.value}")
            print(f"    Sintoma: {persona.symptom}")
            print(f"    Objeções: {', '.join(persona.objections[:2])}...")
            print()
        return

    # Definir personas
    if args.persona:
        if args.persona not in LEAD_PERSONAS:
            print(f"❌ Persona '{args.persona}' não encontrada!")
            print(f"   Use --list-personas para ver disponíveis")
            return
        personas = [args.persona]
    elif args.quick:
        personas = ["maria_preco"]
    elif args.full:
        personas = list(LEAD_PERSONAS.keys())
    else:
        personas = ["maria_preco", "claudia_emocional", "patricia_pronta"]

    print(f"🎯 Personas selecionadas: {', '.join(personas)}")
    print(f"📊 Análise de especialistas: {'Não' if args.no_analyze else 'Sim'}")
    print()

    # Executar simulação
    orchestrator = SimulationOrchestrator()

    try:
        report = await orchestrator.run_full_simulation(
            personas=personas,
            analyze=not args.no_analyze
        )

        orchestrator.print_report(report)

        # Salvar relatório
        import json
        from datetime import datetime

        report_data = {
            "timestamp": report.timestamp,
            "prompt_version": report.prompt_version,
            "overall_score": report.overall_score,
            "needs_improvement": report.needs_improvement,
            "simulations": [
                {
                    "persona": s.persona_name,
                    "outcome": s.outcome,
                    "turn_count": s.turn_count,
                    "score": s.debate_result.average_score if s.debate_result else None
                }
                for s in report.simulations
            ],
            "recommended_changes": report.recommended_changes[:5]
        }

        report_file = f"simulation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Relatório salvo: {report_file}")

        # Retorna código de saída baseado no score
        if report.needs_improvement:
            print(f"\n⚠️  Score abaixo do mínimo (75). Melhorias recomendadas!")
            return 1
        else:
            print(f"\n✅ Score satisfatório!")
            return 0

    except Exception as e:
        print(f"\n❌ Erro na simulação: {e}")
        import traceback
        traceback.print_exc()
        return 2


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
