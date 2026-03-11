#!/usr/bin/env python3
"""
Script para inserir agent_versions via Supabase API
Uso: python scripts/insert_agent_versions.py
"""

import os
import sys
import json
import re
from supabase import create_client, Client

# Config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

# Agents to insert
AGENTS = [
    {
        "location_id": "KtMB8IKwmhtnKt7aimzd",
        "agent_name": "Isabella - Legacy Agency",
        "version": "1.2.0",
        "sql_file": "sql/milton_legacy_agency_v1.2_INSERT.sql"
    },
    {
        "location_id": "Bgi2hFMgiLLoRlOO0K5b",
        "agent_name": "Isabella - Brazillionaires",
        "version": "1.1.0",
        "sql_file": "sql/marina_brazillionaires_v1.1_INSERT.sql"
    },
    {
        "location_id": "EKHxHl3KLPN0iRc69GNU",
        "agent_name": "Isabella - Fernanda Lappe",
        "version": "1.0.0",
        "sql_file": "sql/fernanda_lappe_v1.0_INSERT.sql"
    },
    {
        "location_id": "xliub5H5pQ4QcDeKHc6F",
        "agent_name": "Atendimento - Dra. Gabriella Rossmann",
        "version": "1.0.0",
        "sql_file": "sql/dra_gabriella_rossmann_v1.0_INSERT.sql"
    }
]


def parse_sql_file(filepath: str) -> dict:
    """Parse SQL file and extract values for INSERT"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Extract system_prompt between $SYSTEM_PROMPT$ markers
    system_prompt_match = re.search(r'\$SYSTEM_PROMPT\$(.*?)\$SYSTEM_PROMPT\$', content, re.DOTALL)
    system_prompt = system_prompt_match.group(1).strip() if system_prompt_match else ""

    # Extract prompts_by_mode between $PROMPTS_JSON$ markers
    prompts_match = re.search(r'\$PROMPTS_JSON\$(.*?)\$PROMPTS_JSON\$', content, re.DOTALL)
    prompts_json_str = prompts_match.group(1).strip() if prompts_match else "{}"

    # Extract tools_config (first JSON block after prompts)
    tools_match = re.search(r"'(\{[^']*\"Atualizar_nome\"[^']*\})'::jsonb", content, re.DOTALL)
    tools_json_str = tools_match.group(1) if tools_match else "{}"

    # Extract personality_config (last big JSON block)
    personality_match = re.search(r"'(\{[^']*\"name\"[^']*\"agent_modes\"[^']*\})'::jsonb", content, re.DOTALL)
    personality_json_str = personality_match.group(1) if personality_match else "{}"

    return {
        "system_prompt": system_prompt,
        "prompts_by_mode": json.loads(prompts_json_str),
        "tools_config": json.loads(tools_json_str),
        "personality_config": json.loads(personality_json_str)
    }


def main():
    print("🔌 Conectando ao Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    for agent in AGENTS:
        print(f"\n📝 Processando: {agent['agent_name']} v{agent['version']}")

        try:
            # Parse SQL file
            parsed = parse_sql_file(agent['sql_file'])

            # Deactivate previous versions
            print(f"  ⏸️  Desativando versões anteriores...")
            supabase.table('agent_versions').update({
                'is_active': False
            }).eq('location_id', agent['location_id']).neq('version', agent['version']).execute()

            # Check if this version already exists
            existing = supabase.table('agent_versions').select('id').eq(
                'location_id', agent['location_id']
            ).eq('version', agent['version']).execute()

            if existing.data:
                print(f"  🔄 Atualizando versão existente...")
                result = supabase.table('agent_versions').update({
                    'agent_name': agent['agent_name'],
                    'is_active': True,
                    'system_prompt': parsed['system_prompt'],
                    'prompts_by_mode': parsed['prompts_by_mode'],
                    'tools_config': parsed['tools_config'],
                    'personality_config': parsed['personality_config']
                }).eq('location_id', agent['location_id']).eq('version', agent['version']).execute()
            else:
                print(f"  ➕ Inserindo nova versão...")
                result = supabase.table('agent_versions').insert({
                    'location_id': agent['location_id'],
                    'agent_name': agent['agent_name'],
                    'version': agent['version'],
                    'is_active': True,
                    'system_prompt': parsed['system_prompt'],
                    'prompts_by_mode': parsed['prompts_by_mode'],
                    'tools_config': parsed['tools_config'],
                    'personality_config': parsed['personality_config']
                }).execute()

            print(f"  ✅ {agent['agent_name']} v{agent['version']} - OK!")

        except Exception as e:
            print(f"  ❌ ERRO: {e}")
            continue

    print("\n" + "="*60)
    print("📊 Verificando resultados...")

    # Show all active versions
    result = supabase.table('agent_versions').select(
        'agent_name', 'location_id', 'version', 'is_active'
    ).eq('is_active', True).execute()

    print(f"\n🟢 Agentes ativos ({len(result.data)}):")
    for r in result.data:
        print(f"  • {r['agent_name']} v{r['version']} [{r['location_id']}]")


if __name__ == "__main__":
    main()
