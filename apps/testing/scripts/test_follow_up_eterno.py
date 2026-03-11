#!/usr/bin/env python3
"""
Testa o Follow Up Eterno via API REST do Supabase
"""

import requests

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def test_follow_up():
    print("=== TESTE FOLLOW UP ETERNO ===\n")
    
    # 1. Quantos leads ativos?
    url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=count&ativo=eq.true"
    resp = requests.get(url, headers={**headers, "Prefer": "count=exact", "Range": "0-0"})
    count_active = resp.headers.get("content-range", "0").split("/")[-1]
    print(f"1. Leads ativos: {count_active}")
    
    # 2. Buscar histórico com type 'ai' na última mensagem
    print("\n2. Verificando últimas mensagens por session_id...")
    
    # Pegar 10 leads ativos com seus unique_ids
    url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=unique_id&ativo=eq.true&limit=20"
    resp = requests.get(url, headers=headers)
    active_leads = resp.json()
    
    ai_last_count = 0
    sample_results = []
    
    for lead in active_leads:
        uid = lead["unique_id"]
        
        # Buscar última mensagem deste lead
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,message,created_at&session_id=eq.{uid}&order=created_at.desc&limit=1"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        
        if msgs:
            msg = msgs[0]
            msg_type = msg.get("message", {}).get("type", "unknown")
            if msg_type == "ai":
                ai_last_count += 1
                sample_results.append({
                    "unique_id": uid,
                    "type": msg_type,
                    "content": msg.get("message", {}).get("content", "")[:80],
                    "created_at": msg.get("created_at")
                })
    
    print(f"   Dos 20 leads verificados, {ai_last_count} têm IA como última mensagem")
    
    if sample_results:
        print("\n3. Exemplos de leads onde IA foi a última:")
        for s in sample_results[:5]:
            print(f"\n   Lead: {s['unique_id']}")
            print(f"   Type: {s['type']}")
            print(f"   Created: {s['created_at']}")
            print(f"   Content: {s['content']}...")
    
    # 4. Verificar tipos de mensagens no histórico
    print("\n4. Amostra de tipos de mensagem no histórico:")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=message&limit=100"
    resp = requests.get(url, headers=headers)
    msgs = resp.json()
    
    types = {}
    for m in msgs:
        t = m.get("message", {}).get("type", "unknown")
        types[t] = types.get(t, 0) + 1
    
    for t, c in sorted(types.items(), key=lambda x: -x[1]):
        print(f"   - {t}: {c}")
    
    # 5. Cadências
    print("\n5. Cadências configuradas:")
    url = f"{SUPABASE_URL}/rest/v1/follow_up_cadencias?select=*&ativo=eq.true"
    resp = requests.get(url, headers=headers)
    cadencias = resp.json()
    for c in cadencias:
        print(f"   Tentativa {c['tentativa']}: {c['intervalo_minutos']} min ({c['canal']})")

if __name__ == "__main__":
    test_follow_up()
