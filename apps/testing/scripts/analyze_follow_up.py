#!/usr/bin/env python3
"""
Análise detalhada do estado do Follow Up Eterno
"""

import requests

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

def analyze():
    print("=== ANÁLISE FOLLOW UP ETERNO ===\n")
    
    # 1. Total de leads ativos
    url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=count&ativo=eq.true"
    resp = requests.get(url, headers={**headers, "Prefer": "count=exact", "Range": "0-0"})
    total_active = int(resp.headers.get("content-range", "0/0").split("/")[-1])
    print(f"1. Leads ativos: {total_active}")
    
    # 2. Pegar amostra de 100 leads ativos
    url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=unique_id&ativo=eq.true&limit=100"
    resp = requests.get(url, headers=headers)
    active_leads = [r["unique_id"] for r in resp.json()]
    
    # 3. Ver quantos têm histórico
    with_history = 0
    ai_as_last = 0
    human_as_last = 0
    no_history = 0
    
    print(f"\n2. Verificando {len(active_leads)} leads ativos...")
    
    for uid in active_leads:
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=message&session_id=eq.{uid}&order=created_at.desc&limit=1"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        
        if not msgs:
            no_history += 1
        else:
            with_history += 1
            last_type = msgs[0].get("message", {}).get("type", "unknown")
            if last_type == "ai":
                ai_as_last += 1
            elif last_type == "human":
                human_as_last += 1
    
    print(f"\n   Resultados da amostra:")
    print(f"   - Com histórico: {with_history}")
    print(f"   - Sem histórico: {no_history}")
    print(f"   - AI como última: {ai_as_last}")
    print(f"   - Human como última: {human_as_last}")
    
    # 4. Verificar a tabela de histórico
    print("\n3. Estatísticas do n8n_historico_mensagens:")
    
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=count"
    resp = requests.get(url, headers={**headers, "Prefer": "count=exact", "Range": "0-0"})
    total_msgs = int(resp.headers.get("content-range", "0/0").split("/")[-1])
    print(f"   - Total de mensagens: {total_msgs}")
    
    # Contar tipos
    print("\n   - Por tipo:")
    for offset in range(0, min(total_msgs, 20000), 5000):
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=message&offset={offset}&limit=5000"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        ai = sum(1 for m in msgs if m.get("message", {}).get("type") == "ai")
        human = sum(1 for m in msgs if m.get("message", {}).get("type") == "human")
        print(f"     Offset {offset}: AI={ai}, Human={human}")

if __name__ == "__main__":
    analyze()
