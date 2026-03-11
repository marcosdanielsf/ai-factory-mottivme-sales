#!/usr/bin/env python3
"""
Run Orchestrator - Executa o AgentFactoryOrchestrator
=====================================================

Modos de uso:

1. ANALYZE (QA apenas, sem mudancas):
   python run_orchestrator.py analyze --location-id=xxx

2. IMPROVE (QA + aplica melhorias):
   python run_orchestrator.py improve --location-id=xxx --auto-deploy

3. CREATE (cria novo agente):
   python run_orchestrator.py create --profile=perfil.txt --location-id=xxx --name="Isabella"

4. FULL CYCLE:
   python run_orchestrator.py full --location-id=xxx
"""

import os
import sys
import asyncio
import argparse
import logging
from datetime import datetime

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configurar variaveis
os.environ.setdefault('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger(__name__)

# Imports
from agents.agent_factory_orchestrator import (
    AgentFactoryOrchestrator,
    PipelineMode,
    analyze_agent,
    improve_agent,
    create_agent
)


def print_header(mode: str):
    """Imprime header bonito"""
    print("\n" + "="*70)
    print("  🏭 AI FACTORY ORCHESTRATOR")
    print(f"  Mode: {mode.upper()}")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)


def print_result(result):
    """Imprime resultado formatado"""
    print("\n" + "-"*70)
    print("📊 RESULTADO")
    print("-"*70)

    status = "✅ SUCESSO" if result.success else "❌ FALHA"
    print(f"Status: {status}")
    print(f"Agente: {result.agent_name}")
    print(f"Version ID: {result.agent_version_id or 'N/A'}")
    print(f"Score Final: {result.final_score or 'N/A'}")
    print(f"Melhorias Aplicadas: {result.improvements_applied}")
    print(f"Tokens Usados: {result.tokens_used:,}")
    print(f"Duracao: {result.duration_seconds:.1f}s")

    print(f"\nEtapas Concluidas ({len(result.stages_completed)}):")
    for stage in result.stages_completed:
        print(f"  ✓ {stage}")

    if result.error:
        print(f"\n⚠️ Erro: {result.error}")

    if result.metadata:
        print(f"\nMetadata:")
        for key, value in result.metadata.items():
            if isinstance(value, dict):
                print(f"  {key}:")
                for k, v in value.items():
                    print(f"    {k}: {v}")
            else:
                val_str = str(value)[:100] + "..." if len(str(value)) > 100 else value
                print(f"  {key}: {val_str}")

    print("-"*70 + "\n")


async def run_analyze(args):
    """Executa modo ANALYZE (QA apenas)"""
    print_header("analyze")

    if not args.location_id and not args.agent_id:
        print("❌ Forneca --location-id ou --agent-id")
        return

    print(f"📍 Location ID: {args.location_id}")
    print(f"📍 Agent ID: {args.agent_id}")
    print(f"⏰ Horas atras: {args.hours_back}")

    orchestrator = AgentFactoryOrchestrator(
        qa_hours_back=args.hours_back
    )

    result = await orchestrator.run(
        mode=PipelineMode.QA_ONLY,
        agent_version_id=args.agent_id,
        location_id=args.location_id
    )

    print_result(result)
    return result


async def run_improve(args):
    """Executa modo IMPROVE (QA + melhorias)"""
    print_header("improve")

    if not args.location_id and not args.agent_id:
        print("❌ Forneca --location-id ou --agent-id")
        return

    print(f"📍 Location ID: {args.location_id}")
    print(f"📍 Agent ID: {args.agent_id}")
    print(f"🔧 Auto Deploy: {args.auto_deploy}")
    print(f"📊 Modo: {args.improvement_mode}")

    orchestrator = AgentFactoryOrchestrator(
        qa_hours_back=args.hours_back,
        improvement_mode=args.improvement_mode
    )

    result = await orchestrator.run(
        mode=PipelineMode.IMPROVE,
        agent_version_id=args.agent_id,
        location_id=args.location_id,
        auto_deploy=args.auto_deploy
    )

    print_result(result)
    return result


async def run_create(args):
    """Executa modo CREATE (novo agente)"""
    print_header("create")

    if not args.profile:
        print("❌ Forneca --profile com arquivo de perfil")
        return

    if not args.location_id:
        print("❌ Forneca --location-id")
        return

    if not args.name:
        print("❌ Forneca --name com nome do agente")
        return

    # Ler perfil
    try:
        with open(args.profile, 'r') as f:
            profile_text = f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo nao encontrado: {args.profile}")
        return

    print(f"📄 Perfil: {args.profile} ({len(profile_text)} chars)")
    print(f"📍 Location ID: {args.location_id}")
    print(f"👤 Nome: {args.name}")
    print(f"📅 Calendar ID: {args.calendar_id or 'N/A'}")

    orchestrator = AgentFactoryOrchestrator(
        debate_max_rounds=args.debate_rounds
    )

    result = await orchestrator.run(
        mode=PipelineMode.CREATE,
        client_profile=profile_text,
        location_id=args.location_id,
        agent_name=args.name,
        calendar_id=args.calendar_id
    )

    print_result(result)
    return result


async def run_full(args):
    """Executa modo FULL CYCLE"""
    print_header("full_cycle")

    orchestrator = AgentFactoryOrchestrator(
        qa_hours_back=args.hours_back,
        improvement_mode=args.improvement_mode,
        debate_max_rounds=args.debate_rounds
    )

    # Se tem perfil, cria novo
    if args.profile:
        try:
            with open(args.profile, 'r') as f:
                profile_text = f.read()
        except FileNotFoundError:
            print(f"❌ Arquivo nao encontrado: {args.profile}")
            return

        result = await orchestrator.run(
            mode=PipelineMode.FULL_CYCLE,
            client_profile=profile_text,
            location_id=args.location_id,
            agent_name=args.name,
            calendar_id=args.calendar_id
        )
    else:
        # Melhora existente
        result = await orchestrator.run(
            mode=PipelineMode.FULL_CYCLE,
            agent_version_id=args.agent_id,
            location_id=args.location_id,
            auto_deploy=args.auto_deploy
        )

    print_result(result)
    return result


async def run_demo(args):
    """Demo com dados de teste"""
    print_header("demo")

    print("🎭 Executando demo com dados locais...")

    # Testar apenas o collector (nao precisa de ANTHROPIC_API_KEY)
    from agents.agent_13_conversation_collector import ConversationCollectorAgent

    collector = ConversationCollectorAgent()
    result = await collector.execute({
        'hours_back': 72,
        'min_messages': 4,
        'limit': 5
    })

    print(f"\n✓ Collector: {'OK' if result.success else 'FALHA'}")
    print(f"  Conversas: {result.output.get('total_found', 0)}")
    print(f"  Tempo: {result.execution_time_ms}ms")

    if result.success and result.output.get('conversations'):
        print("\n  Agentes encontrados:")
        for agent in result.output.get('summary', {}).get('agents', []):
            print(f"    - {agent}")


def main():
    parser = argparse.ArgumentParser(
        description='AI Factory Orchestrator CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Comando a executar')

    # ANALYZE
    analyze_parser = subparsers.add_parser('analyze', help='Analisa performance (QA apenas)')
    analyze_parser.add_argument('--location-id', '-l', help='Location ID do GHL')
    analyze_parser.add_argument('--agent-id', '-a', help='Agent Version ID')
    analyze_parser.add_argument('--hours-back', type=int, default=72, help='Horas atras (default: 72)')

    # IMPROVE
    improve_parser = subparsers.add_parser('improve', help='Analisa e aplica melhorias')
    improve_parser.add_argument('--location-id', '-l', help='Location ID do GHL')
    improve_parser.add_argument('--agent-id', '-a', help='Agent Version ID')
    improve_parser.add_argument('--hours-back', type=int, default=72, help='Horas atras')
    improve_parser.add_argument('--auto-deploy', action='store_true', help='Deploy automatico')
    improve_parser.add_argument('--improvement-mode', '-m', default='moderate',
                               choices=['conservative', 'moderate', 'aggressive'])

    # CREATE
    create_parser = subparsers.add_parser('create', help='Cria novo agente')
    create_parser.add_argument('--profile', '-p', required=True, help='Arquivo com perfil do cliente')
    create_parser.add_argument('--location-id', '-l', required=True, help='Location ID do GHL')
    create_parser.add_argument('--name', '-n', required=True, help='Nome do agente')
    create_parser.add_argument('--calendar-id', '-c', help='Calendar ID')
    create_parser.add_argument('--debate-rounds', type=int, default=3, help='Max rodadas debate')

    # FULL
    full_parser = subparsers.add_parser('full', help='Ciclo completo')
    full_parser.add_argument('--profile', '-p', help='Arquivo perfil (se criar novo)')
    full_parser.add_argument('--location-id', '-l', help='Location ID')
    full_parser.add_argument('--agent-id', '-a', help='Agent ID (se melhorar)')
    full_parser.add_argument('--name', '-n', help='Nome do agente')
    full_parser.add_argument('--calendar-id', '-c', help='Calendar ID')
    full_parser.add_argument('--hours-back', type=int, default=72)
    full_parser.add_argument('--auto-deploy', action='store_true')
    full_parser.add_argument('--improvement-mode', '-m', default='moderate')
    full_parser.add_argument('--debate-rounds', type=int, default=3)

    # DEMO
    demo_parser = subparsers.add_parser('demo', help='Demo com dados locais')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Verificar API key para comandos que precisam
    if args.command in ['create', 'improve', 'full'] and not os.getenv('ANTHROPIC_API_KEY'):
        print("⚠️  ANTHROPIC_API_KEY nao configurada")
        print("   Exporte a variavel: export ANTHROPIC_API_KEY=sk-xxx")
        return

    # Executar comando
    if args.command == 'analyze':
        asyncio.run(run_analyze(args))
    elif args.command == 'improve':
        asyncio.run(run_improve(args))
    elif args.command == 'create':
        asyncio.run(run_create(args))
    elif args.command == 'full':
        asyncio.run(run_full(args))
    elif args.command == 'demo':
        asyncio.run(run_demo(args))


if __name__ == '__main__':
    main()
