#!/usr/bin/env python3
"""
Run Debate - Script para executar debate de prompts
===================================================
Roda o sistema de debate entre agentes para melhorar prompts de vendas.

Uso:
    python run_debate.py --agent "Julia Amare"
    python run_debate.py --prompt "caminho/para/prompt.txt"
    python run_debate.py --quick --agent "Julia Amare"
"""

import os
import sys
import asyncio
import argparse
import json
from datetime import datetime
from pathlib import Path

# Adicionar path do projeto
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client, Client
from agents.debate_orchestrator import DebateOrchestrator, QuickDebate


def get_supabase_client() -> Client:
    """Cria cliente Supabase."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_KEY são necessários")

    return create_client(url, key)


def get_agent_prompt(supabase: Client, agent_name: str) -> dict:
    """Busca prompt do agente no Supabase."""
    # Buscar versão mais recente do agente (busca por nome parcial)
    result = supabase.table("agent_versions").select(
        "id, agent_name, version, system_prompt, business_config, personality_config, tools_config"
    ).ilike("agent_name", f"%{agent_name}%").eq(
        "status", "active"
    ).order(
        "created_at", desc=True
    ).limit(1).execute()

    if not result.data:
        raise ValueError(f"Agente '{agent_name}' não encontrado")

    # Montar context a partir de business_config
    row = result.data[0]
    row["context"] = row.get("business_config") or {}
    return row


def list_agents(supabase: Client):
    """Lista agentes disponíveis."""
    result = supabase.table("agent_versions").select(
        "agent_name, version, status"
    ).order("agent_name").execute()

    agents = {}
    for row in result.data:
        name = row["agent_name"]
        if name not in agents:
            agents[name] = {
                "latest_version": row["version"],
                "status": row["status"]
            }
        elif row["version"] > agents[name]["latest_version"]:
            agents[name]["latest_version"] = row["version"]
            agents[name]["status"] = row["status"]

    print("\n📋 AGENTES DISPONÍVEIS:")
    print("-" * 50)
    for name, info in sorted(agents.items()):
        status = "✅" if info["status"] == "active" else "⚪"
        print(f"  {status} {name} (v{info['latest_version']})")
    print("-" * 50)
    print(f"Total: {len(agents)} agentes\n")


async def run_full_debate(
    prompt: str,
    context: dict,
    max_rounds: int = 3,
    approval_threshold: float = 70.0
):
    """Executa debate completo."""
    orchestrator = DebateOrchestrator(
        max_rounds=max_rounds,
        approval_threshold=approval_threshold,
        include_experts=True
    )

    result = await orchestrator.run_debate(prompt, context, verbose=True)
    return result


async def run_quick_debate(prompt: str, context: dict):
    """Executa debate rápido (só crítico + defensor + juiz)."""
    debate = QuickDebate()

    print("\n" + "="*60)
    print("⚡ DEBATE RÁPIDO")
    print("="*60)

    result = await debate.analyze(prompt, context)

    print("\n🔴 CRÍTICA:")
    print("-"*40)
    print(result["criticism"])

    print("\n🟢 DEFESA:")
    print("-"*40)
    print(result["defense"])

    print("\n⚖️ VEREDITO:")
    print("-"*40)
    print(result["verdict"])

    print("="*60)
    return result


def parse_context_from_agent(agent_data: dict) -> dict:
    """Extrai contexto do agente para o debate."""
    context = agent_data.get("context", {})

    # Tentar extrair informações do context JSON
    if isinstance(context, str):
        try:
            context = json.loads(context)
        except json.JSONDecodeError:
            context = {}

    return {
        "product": context.get("product", context.get("servico", "Não especificado")),
        "target_audience": context.get("target_audience", context.get("publico", "Não especificado")),
        "ticket": context.get("ticket", context.get("preco", "Não especificado")),
        "channel": context.get("channel", "WhatsApp"),
        "sales_cycle": context.get("sales_cycle", "Não especificado"),
        "known_objections": context.get("objections", []),
        "pain_points": context.get("pain_points", context.get("dores", [])),
        "desires": context.get("desires", context.get("desejos", [])),
    }


async def main():
    parser = argparse.ArgumentParser(
        description="Executa debate de prompts entre agentes especializados"
    )

    parser.add_argument(
        "--agent", "-a",
        type=str,
        help="Nome do agente no Supabase (ex: 'Julia Amare')"
    )

    parser.add_argument(
        "--prompt", "-p",
        type=str,
        help="Caminho para arquivo com o prompt"
    )

    parser.add_argument(
        "--quick", "-q",
        action="store_true",
        help="Modo rápido (só crítico + defensor + juiz)"
    )

    parser.add_argument(
        "--list-agents", "-l",
        action="store_true",
        help="Lista agentes disponíveis"
    )

    parser.add_argument(
        "--max-rounds", "-r",
        type=int,
        default=3,
        help="Máximo de rodadas no debate completo (default: 3)"
    )

    parser.add_argument(
        "--threshold", "-t",
        type=float,
        default=70.0,
        help="Score mínimo para aprovação (default: 70)"
    )

    args = parser.parse_args()

    # Inicializar Supabase
    try:
        supabase = get_supabase_client()
    except ValueError as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

    # Listar agentes
    if args.list_agents:
        list_agents(supabase)
        return

    # Verificar se tem prompt ou agente
    if not args.agent and not args.prompt:
        print("❌ Erro: Especifique --agent ou --prompt")
        parser.print_help()
        sys.exit(1)

    # Buscar prompt
    prompt = None
    context = {}

    if args.agent:
        print(f"\n📥 Buscando agente: {args.agent}")
        try:
            agent_data = get_agent_prompt(supabase, args.agent)
            prompt = agent_data["system_prompt"]
            context = parse_context_from_agent(agent_data)
            print(f"✅ Encontrado: {agent_data['agent_name']} v{agent_data['version']}")
        except ValueError as e:
            print(f"❌ Erro: {e}")
            list_agents(supabase)
            sys.exit(1)

    elif args.prompt:
        prompt_path = Path(args.prompt)
        if not prompt_path.exists():
            print(f"❌ Erro: Arquivo não encontrado: {args.prompt}")
            sys.exit(1)

        prompt = prompt_path.read_text()
        print(f"✅ Prompt carregado de: {args.prompt}")

    # Executar debate
    if args.quick:
        result = await run_quick_debate(prompt, context)
    else:
        result = await run_full_debate(
            prompt,
            context,
            max_rounds=args.max_rounds,
            approval_threshold=args.threshold
        )

        # Salvar resultado
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"debate_result_{timestamp}.json"

        # Preparar dados para salvar
        save_data = {
            "agent_name": args.agent if args.agent else "custom_prompt",
            "timestamp": timestamp,
            "total_rounds": result.total_rounds,
            "final_score": result.final_score,
            "verdict": result.verdict,
            "key_improvements": result.key_improvements,
            "total_tokens": result.total_tokens_used,
            "duration_seconds": result.duration_seconds
        }

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Resultado salvo em: {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
