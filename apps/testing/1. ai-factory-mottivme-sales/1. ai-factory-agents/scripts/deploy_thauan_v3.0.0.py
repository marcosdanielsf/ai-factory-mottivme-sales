#!/usr/bin/env python3
"""
Deploy Maya - Dr. Thauan Santos v3.0.0 to Supabase
CORREÇÕES:
- Remove emojis de estrela/fogo (eram de outro agente)
- Adiciona Santa Rosa como segunda unidade
- Regra anti-mensagens múltiplas
- Coleta de preferência de unidade antes do link
"""

import os
import httpx

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

LOCATION_ID = "Rre0WqSlmAPmIrURgiMf"

def main():
    # Read prompt file
    prompt_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'thauan_santos_v3.0.0.md')
    with open(prompt_path, 'r') as f:
        prompt_content = f.read()

    print(f"Prompt loaded: {len(prompt_content)} chars")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Step 1: Deactivate current version
    print("\n1. Deactivating current version...")
    with httpx.Client(timeout=30) as client:
        response = client.patch(
            f"{SUPABASE_URL}/rest/v1/agent_versions",
            params={
                "location_id": f"eq.{LOCATION_ID}",
                "is_active": "eq.true"
            },
            headers=headers,
            json={"is_active": False}
        )

        if response.status_code in [200, 204]:
            print("   Previous version deactivated")
        else:
            print(f"   Warning: {response.status_code} - {response.text}")

    # Step 2: Insert new version
    print("\n2. Inserting v3.0.0...")

    payload = {
        "location_id": LOCATION_ID,
        "agent_name": "Maya - Assistente Dr. Thauan Santos",
        "version": "v3.0.0",
        "system_prompt": prompt_content,
        "is_active": True
    }

    with httpx.Client(timeout=30) as client:
        response = client.post(
            f"{SUPABASE_URL}/rest/v1/agent_versions",
            headers=headers,
            json=payload
        )

        if response.status_code == 201:
            data = response.json()
            print(f"   SUCCESS! New version ID: {data[0]['id']}")
            print(f"   Version: {data[0]['version']}")
            print(f"   Active: {data[0]['is_active']}")
        else:
            print(f"   ERROR: {response.status_code}")
            print(f"   {response.text}")
            return 1

    # Step 3: Verify
    print("\n3. Verifying...")
    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{SUPABASE_URL}/rest/v1/agent_versions",
            params={
                "select": "version,is_active,created_at",
                "location_id": f"eq.{LOCATION_ID}",
                "is_active": "eq.true"
            },
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            if data:
                print(f"   Active version: {data[0]['version']}")
                print(f"   Created at: {data[0]['created_at']}")
            else:
                print("   WARNING: No active version found!")
        else:
            print(f"   Error: {response.text}")

    print("\n" + "="*60)
    print("  DEPLOY v3.0.0 COMPLETE!")
    print("  CORREÇÕES:")
    print("  - Emojis estrela/fogo REMOVIDOS (eram de outro agente)")
    print("  - Santa Rosa adicionada como 2ª unidade")
    print("  - Regra anti-mensagens múltiplas")
    print("  - Coleta de preferência de unidade")
    print("  - Checklist antes de cada resposta")
    print("="*60)

    return 0

if __name__ == "__main__":
    exit(main())
