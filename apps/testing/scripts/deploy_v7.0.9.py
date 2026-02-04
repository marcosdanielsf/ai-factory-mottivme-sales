#!/usr/bin/env python3
"""Deploy Isabella Amare v7.0.9 para Supabase"""

import json
import requests
import os

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

def main():
    # Caminho do prompt
    script_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(script_dir, '..', 'prompts', 'isabella_amare_v7.0.9.md')

    # Ler prompt do arquivo
    with open(prompt_path, 'r') as f:
        prompt_content = f.read()

    print(f"Prompt carregado: {len(prompt_content)} caracteres")

    # Criar payload (sem metadata - coluna nao existe)
    payload = {
        "location_id": "sNwLyynZWP6jEtBy1ubf",
        "agent_name": "Isabella Amare",
        "version": "v7.0.9",
        "system_prompt": prompt_content,
        "is_active": True
    }

    # Headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Inserir via API REST
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/agent_versions",
        headers=headers,
        json=payload
    )

    if response.status_code in [200, 201]:
        data = response.json()
        if data:
            result = data[0] if isinstance(data, list) else data
            print(f"\n✅ SUCESSO!")
            print(f"ID: {result.get('id')}")
            print(f"Version: {result.get('version')}")
            print(f"Active: {result.get('is_active')}")
            print(f"Prompt Length: {len(result.get('system_prompt', ''))}")
        else:
            print(f"\n✅ Inserido (sem retorno de dados)")
    else:
        print(f"\n❌ Erro: {response.status_code}")
        print(response.text)

if __name__ == '__main__':
    main()
