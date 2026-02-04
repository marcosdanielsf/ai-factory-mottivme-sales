#!/usr/bin/env python3
"""
Testa o Follow Up Eterno - verificação mais profunda
"""

import requests

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def test():
    print("=== TESTE FOLLOW UP ETERNO V2 ===\n")
    
    # 1. Buscar session_ids que têm mensagens AI
    print("1. Buscando sessions com mensagens AI...")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,message&limit=2000&offset=17000"
    resp = requests.get(url, headers=headers)
    msgs = resp.json()
    
    # Sessions que têm AI
    ai_sessions = set()
    for m in msgs:
        if m.get("message", {}).get("type") == "ai":
            ai_sessions.add(m["session_id"])
    
    print(f"   {len(ai_sessions)} sessions com mensagens AI")
    
    # 2. Ver quais desses sessions estão no schedule_tracking como ativos
    print("\n2. Verificando quais estão ativos no schedule_tracking...")
    
    active_with_ai = []
    for sid in list(ai_sessions)[:50]:  # Checar os primeiros 50
        url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=unique_id,ativo&unique_id=eq.{sid}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if data:
            if data[0].get("ativo"):
                active_with_ai.append(sid)
    
    print(f"   {len(active_with_ai)} sessions com AI que estão ativos")
    
    if not active_with_ai:
        print("\n   Nenhum session com AI está ativo no schedule_tracking!")
        print("   Isso significa que os leads que tiveram interação AI já foram desativados.")
        return
    
    # 3. Para cada um, verificar qual foi a última mensagem
    print("\n3. Verificando última mensagem de cada um:")
    
    prontos = []
    for sid in active_with_ai[:10]:
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,message,created_at&session_id=eq.{sid}&order=created_at.desc&limit=1"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        
        if msgs:
            last = msgs[0]
            last_type = last.get("message", {}).get("type")
            last_time = last.get("created_at")
            print(f"   {sid}: última = {last_type} @ {last_time}")
            
            if last_type == "ai":
                prontos.append({
                    "session_id": sid,
                    "last_time": last_time
                })
    
    print(f"\n4. Leads prontos para follow-up: {len(prontos)}")
    for p in prontos:
        print(f"   - {p['session_id']} (última msg: {p['last_time']})")

if __name__ == "__main__":
    test()
