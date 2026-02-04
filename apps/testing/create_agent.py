#!/usr/bin/env python3
"""
AI Factory - Criar Agente Completo
==================================
Cria um agente Growth OS completo a partir de um arquivo de perfil.

Uso:
    python create_agent.py --profile "cliente.txt" --location "xxx" --calendar "yyy"
    python create_agent.py --profile "cliente.txt" --location "xxx" --calendar "yyy" --output "sql/"
    python create_agent.py --full  # Modo completo com validação e scripts

Exemplo:
    python create_agent.py \\
        --profile "/Users/marcosdaniels/Downloads/Dra Eliane.txt" \\
        --location "pFHwENFUxjtiON94jn2k" \\
        --calendar "yYjQWSpdlGorTcy3sLGj" \\
        --output "sql/dra_eline_v2.sql"
"""

import asyncio
import argparse
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from supabase import create_client, Client

# Configurar API Key
os.environ.setdefault('ANTHROPIC_API_KEY', os.getenv('ANTHROPIC_API_KEY', ''))

# Configurar Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

from agents.agent_12_prompt_factory import PromptFactoryAgent
from agents.agent_04_validator import ValidatorAgent
from agents.agent_11_script_writer import ScriptWriterAgent


def get_supabase_client() -> Client:
    """Retorna cliente Supabase configurado"""
    if not SUPABASE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def save_followup_scripts_to_supabase(
    location_id: str,
    agent_name: str,
    scripts: dict
) -> bool:
    """
    Salva scripts de follow-up na coluna followup_scripts da tabela agent_versions.

    Args:
        location_id: GHL Location ID
        agent_name: Nome do agente (ex: "Archie - Arquiteto de Vendas IA")
        scripts: Dict com scripts por stage (ativacao, qualificacao, recuperacao)

    Returns:
        True se atualizou com sucesso, False caso contrário
    """
    supabase = get_supabase_client()
    if not supabase:
        print("   ⚠️ SUPABASE_SERVICE_KEY não configurada - scripts salvos apenas localmente")
        return False

    try:
        # Atualiza a coluna followup_scripts no agent_versions
        result = supabase.table('agent_versions').update({
            'followup_scripts': scripts
        }).eq('location_id', location_id).eq('agent_name', agent_name).execute()

        if result.data:
            print(f"   ✅ Scripts salvos no agent_versions.followup_scripts")
            return True
        else:
            print(f"   ⚠️ Agente não encontrado no agent_versions (location_id={location_id}, agent_name={agent_name})")
            return False

    except Exception as e:
        print(f"   ⚠️ Erro ao salvar scripts no Supabase: {e}")
        return False


async def create_agent_simple(
    profile_path: str,
    location_id: str,
    calendar_id: str,
    output_path: str = None,
    agent_name: str = None
):
    """Cria agente simples (só prompts)"""

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🏭 AI FACTORY - PROMPT FACTORY                              ║
    ║   Criando agente Growth OS completo...                        ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Verificar arquivo
    if not Path(profile_path).exists():
        print(f"❌ Arquivo não encontrado: {profile_path}")
        sys.exit(1)

    print(f"📄 Perfil: {profile_path}")
    print(f"📍 Location: {location_id}")
    print(f"📅 Calendar: {calendar_id}")
    print()

    # Criar agente
    factory = PromptFactoryAgent()

    print("🔄 Gerando agente com Claude Opus...")
    print("   (isso pode levar 30-60 segundos)\n")

    result = await factory.execute({
        'profile_path': profile_path,
        'location_id': location_id,
        'calendar_id': calendar_id,
        'agent_name': agent_name
    })

    if not result.success:
        print(f"❌ Erro: {result.error}")
        sys.exit(1)

    agent_data = result.output
    print(f"✅ Agente criado: {agent_data.get('agent_name')} v{agent_data.get('version')}")
    print(f"   Modos: {', '.join(agent_data.get('prompts_by_mode', {}).keys())}")
    print(f"   Tokens: {result.tokens_used:,}")

    # Salvar SQL
    if output_path:
        sql_path = output_path
    else:
        # Gerar nome automático
        agent_slug = agent_data.get('agent_name', 'agente').lower().replace(' ', '_')
        sql_path = f"sql/{agent_slug}_v1_prompts_modulares.sql"

    # Criar diretório se não existir
    Path(sql_path).parent.mkdir(parents=True, exist_ok=True)

    # Salvar
    Path(sql_path).write_text(agent_data['sql'], encoding='utf-8')
    print(f"\n💾 SQL salvo em: {sql_path}")

    # Mostrar preview
    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                    📊 RESUMO                                  ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║  Agente: {agent_data.get('agent_name', 'N/A'):<47} ║
    ║  Versão: {agent_data.get('version', 'N/A'):<47} ║
    ║  Modos:  {len(agent_data.get('prompts_by_mode', {})):<47} ║
    ║  SQL:    {sql_path:<47} ║
    ╚═══════════════════════════════════════════════════════════════╝

    📝 Próximos passos:
    1. Revise o SQL gerado
    2. Execute no Supabase: psql -f {sql_path}
    3. Teste com: python run_groq_e2e_tests.py --agent "{agent_data.get('agent_name')}"
    """)

    return agent_data


async def create_agent_full(
    profile_path: str,
    location_id: str,
    calendar_id: str,
    output_dir: str = "sql"
):
    """
    Modo COMPLETO: Cria agente + valida + gera scripts de follow-up

    Pipeline:
    1. PromptFactoryAgent - Cria os 7 prompts
    2. ValidatorAgent - Testa os prompts
    3. ScriptWriterAgent - Gera roteiros de áudio/vídeo
    """

    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🏭 AI FACTORY - MODO COMPLETO                               ║
    ║   Prompts + Validação + Scripts de Follow-up                  ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    # Verificar arquivo
    if not Path(profile_path).exists():
        print(f"❌ Arquivo não encontrado: {profile_path}")
        sys.exit(1)

    profile_text = Path(profile_path).read_text(encoding='utf-8')

    print(f"📄 Perfil: {profile_path}")
    print(f"📍 Location: {location_id}")
    print(f"📅 Calendar: {calendar_id}")
    print()

    # ═══════════════════════════════════════════════════════════════
    # ETAPA 1: Criar Agente
    # ═══════════════════════════════════════════════════════════════
    print("=" * 60)
    print("📦 ETAPA 1/3: Criando Agente com PromptFactory")
    print("=" * 60)

    factory = PromptFactoryAgent()
    factory_result = await factory.execute({
        'profile_path': profile_path,
        'location_id': location_id,
        'calendar_id': calendar_id
    })

    if not factory_result.success:
        print(f"❌ Erro na criação: {factory_result.error}")
        sys.exit(1)

    agent_data = factory_result.output
    agent_name = agent_data.get('agent_name', 'Agente')
    agent_slug = agent_name.lower().replace(' ', '_')

    print(f"✅ Agente criado: {agent_name}")
    print(f"   Modos: {len(agent_data.get('prompts_by_mode', {}))}")
    print(f"   Tokens: {factory_result.tokens_used:,}")

    # Salvar SQL
    sql_path = f"{output_dir}/{agent_slug}_v1_prompts_modulares.sql"
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    Path(sql_path).write_text(agent_data['sql'], encoding='utf-8')
    print(f"💾 SQL: {sql_path}")

    # ═══════════════════════════════════════════════════════════════
    # ETAPA 2: Validar Prompts
    # ═══════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("🧪 ETAPA 2/3: Validando Prompts")
    print("=" * 60)

    validator = ValidatorAgent()

    # Testar cada modo
    validation_results = {}
    for mode_name, mode_prompt in agent_data.get('prompts_by_mode', {}).items():
        print(f"   Testando {mode_name}...")

        # Criar prompt completo para o modo
        full_prompt = f"{agent_data.get('system_prompt', '')}\n\n### MODO: {mode_name.upper()} ###\n{mode_prompt}"

        val_result = await validator.execute({
            'prompt_to_validate': full_prompt,
            'test_cases': [
                {
                    'name': f'{mode_name}_basic',
                    'input': 'Oi, tudo bem?',
                    'expected_behavior': 'Resposta acolhedora e relevante ao modo'
                }
            ]
        })

        if val_result.success:
            scores = val_result.output.get('scores', {})
            avg_score = sum(scores.values()) / len(scores) if scores else 0
            validation_results[mode_name] = {
                'score': avg_score,
                'scores': scores
            }
            status = "✅" if avg_score >= 7 else "⚠️"
            print(f"   {status} {mode_name}: {avg_score:.1f}/10")
        else:
            validation_results[mode_name] = {'score': 0, 'error': val_result.error}
            print(f"   ❌ {mode_name}: Erro")

    # ═══════════════════════════════════════════════════════════════
    # ETAPA 3: Gerar Scripts de Follow-up
    # ═══════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("🎬 ETAPA 3/3: Gerando Scripts de Follow-up")
    print("=" * 60)

    script_writer = ScriptWriterAgent()
    business_config = agent_data.get('business_config', {})
    personality_config = agent_data.get('personality_config', {})

    scripts = {}

    # Gerar scripts para diferentes etapas
    script_stages = [
        ('ativacao', 'Lead novo, primeiro contato'),
        ('qualificacao', 'Lead interessado, descobrindo dor'),
        ('recuperacao', 'Lead sumiu há 3 dias')
    ]

    for stage, context in script_stages:
        print(f"   Gerando script: {stage}...")

        script_result = await script_writer.generate_script(
            script_type='audio_followup',
            stage=stage,
            origin_agent='followuper',
            lead_context={
                'name': '{{nome}}',
                'history': context,
                'pain': business_config.get('main_pain', 'não especificada'),
                'profile': business_config.get('target_audience', 'público geral')
            },
            brand_voice=personality_config.get('tone', 'amigável e profissional'),
            product=business_config.get('main_offer', business_config.get('specialty', 'serviço'))
        )

        if script_result.get('success'):
            scripts[stage] = script_result.get('script', {})
            print(f"   ✅ {stage}: Gerado")
        else:
            print(f"   ⚠️ {stage}: Erro")

    # Salvar scripts localmente
    scripts_path = f"{output_dir}/{agent_slug}_scripts_followup.json"
    Path(scripts_path).write_text(json.dumps(scripts, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"💾 Scripts (local): {scripts_path}")

    # Salvar scripts no Supabase (coluna followup_scripts do agent_versions)
    save_followup_scripts_to_supabase(
        location_id=location_id,
        agent_name=agent_name,
        scripts=scripts
    )

    # ═══════════════════════════════════════════════════════════════
    # RESUMO FINAL
    # ═══════════════════════════════════════════════════════════════
    avg_validation = sum(v.get('score', 0) for v in validation_results.values()) / len(validation_results) if validation_results else 0

    print(f"""

    ╔═══════════════════════════════════════════════════════════════╗
    ║                    🎉 AGENTE CRIADO!                          ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║                                                               ║
    ║  📦 Agente: {agent_name:<44} ║
    ║  🔢 Versão: {agent_data.get('version', '1.0.0'):<44} ║
    ║  📊 Modos:  {len(agent_data.get('prompts_by_mode', {})):<44} ║
    ║  ✅ Score:  {avg_validation:.1f}/10{' ' * 40} ║
    ║                                                               ║
    ║  📁 Arquivos gerados:                                         ║
    ║     • {sql_path:<51} ║
    ║     • {scripts_path:<51} ║
    ║                                                               ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║  📝 Próximos passos:                                          ║
    ║  1. Revise o SQL e ajuste se necessário                       ║
    ║  2. Execute no Supabase                                       ║
    ║  3. Teste: python run_groq_e2e_tests.py --agent "{agent_name[:20]}..." ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    return {
        'agent': agent_data,
        'validation': validation_results,
        'scripts': scripts,
        'files': {
            'sql': sql_path,
            'scripts': scripts_path
        }
    }


def main():
    parser = argparse.ArgumentParser(
        description='AI Factory - Criar Agente Growth OS Completo',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Criar agente simples (só prompts)
  python create_agent.py --profile "cliente.txt" --location "xxx" --calendar "yyy"

  # Criar agente completo (prompts + validação + scripts)
  python create_agent.py --full --profile "cliente.txt" --location "xxx" --calendar "yyy"

  # Especificar arquivo de saída
  python create_agent.py --profile "cliente.txt" --location "xxx" --calendar "yyy" --output "sql/meu_agente.sql"
        """
    )

    parser.add_argument('--profile', '-p', type=str, required=True,
                        help='Caminho do arquivo de perfil do cliente')
    parser.add_argument('--location', '-l', type=str, required=True,
                        help='GHL Location ID')
    parser.add_argument('--calendar', '-c', type=str, required=True,
                        help='GHL Calendar ID')
    parser.add_argument('--output', '-o', type=str, default=None,
                        help='Caminho do arquivo SQL de saída')
    parser.add_argument('--name', '-n', type=str, default=None,
                        help='Nome sugerido para o agente')
    parser.add_argument('--full', '-f', action='store_true',
                        help='Modo completo: prompts + validação + scripts')

    args = parser.parse_args()

    # Verificar API Key
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ ANTHROPIC_API_KEY não configurada!")
        print("\nConfigure assim:")
        print("  export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)

    # Executar
    if args.full:
        asyncio.run(create_agent_full(
            profile_path=args.profile,
            location_id=args.location,
            calendar_id=args.calendar,
            output_dir=args.output or 'sql'
        ))
    else:
        asyncio.run(create_agent_simple(
            profile_path=args.profile,
            location_id=args.location,
            calendar_id=args.calendar,
            output_path=args.output,
            agent_name=args.name
        ))


if __name__ == "__main__":
    main()
