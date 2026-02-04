#!/usr/bin/env python3
"""
Migrar mensagens AI de ops_historico_mensagens_grupo para n8n_historico_mensagens
"""

import requests
import hashlib
import json

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def get_ops_ai_messages():
    """Buscar mensagens AI de ops_historico_mensagens_grupo"""
    print("1. Buscando mensagens AI de ops_historico_mensagens_grupo...")
    all_msgs = []
    offset = 0
    limit = 1000
    
    while True:
        url = f"{SUPABASE_URL}/rest/v1/ops_historico_mensagens_grupo?select=*&order=id&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        if not msgs or not isinstance(msgs, list):
            break
        
        # Filtrar só mensagens AI
        ai_msgs = [m for m in msgs if m.get("message", {}).get("type") == "ai"]
        all_msgs.extend(ai_msgs)
        
        offset += limit
        print(f"   Processados: {offset}, AI encontradas: {len(all_msgs)}")
        
        if len(msgs) < limit:
            break
    
    print(f"   Total AI: {len(all_msgs)}")
    return all_msgs

def get_existing_hashes():
    """Buscar hashes de mensagens existentes para evitar duplicados"""
    print("\n2. Buscando hashes existentes...")
    existing = set()
    offset = 0
    limit = 1000
    
    while True:
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=message_hash&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if not data or not isinstance(data, list):
            break
        for r in data:
            h = r.get("message_hash")
            if h:
                existing.add(h)
        offset += limit
        if len(data) < limit:
            break
    
    print(f"   {len(existing)} hashes existentes")
    return existing

def compute_hash(session_id, message):
    """Calcular hash para evitar duplicados"""
    content = message.get("content", "")
    h = hashlib.md5(f"{session_id}:{content}".encode()).hexdigest()
    return h

def migrate():
    print("=== MIGRAÇÃO DE MENSAGENS AI ===\n")
    
    # 1. Buscar mensagens AI
    ai_msgs = get_ops_ai_messages()
    
    if not ai_msgs:
        print("Nenhuma mensagem AI encontrada!")
        return
    
    # 2. Buscar hashes existentes
    existing = get_existing_hashes()
    
    # 3. Preparar registros
    print("\n3. Preparando registros...")
    default_location = "sNwLyynZWP6jEtBy1ubf"
    to_insert = []
    
    for msg in ai_msgs:
        session_id = msg.get("session_id")
        message = msg.get("message")
        
        if not session_id or not message:
            continue
        
        # Calcular hash
        msg_hash = compute_hash(session_id, message)
        
        # Pular se já existe
        if msg_hash in existing:
            continue
        
        record = {
            "session_id": session_id,
            "message": message,
            "message_hash": msg_hash,
            "location_id": default_location
        }
        to_insert.append(record)
    
    print(f"   {len(to_insert)} registros novos para inserir")
    
    # 4. Inserir
    if to_insert:
        print("\n4. Inserindo dados...")
        batch_size = 50
        inserted = 0
        errors = 0
        
        for i in range(0, len(to_insert), batch_size):
            batch = to_insert[i:i+batch_size]
            url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens"
            resp = requests.post(
                url, 
                headers={**headers, "Prefer": "return=minimal"},
                json=batch
            )
            
            if resp.status_code in [200, 201]:
                inserted += len(batch)
                print(f"   Inseridos: {inserted}/{len(to_insert)}")
            else:
                errors += len(batch)
                print(f"   ERRO: {resp.status_code} - {resp.text[:200]}")
        
        print(f"\n   Total inseridos: {inserted}")
        print(f"   Total erros: {errors}")
    
    # 5. Verificar resultado
    print("\n5. Verificando tipos agora:")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=message&limit=1000"
    resp = requests.get(url, headers=headers)
    msgs = resp.json()
    
    types = {}
    for m in msgs:
        t = m.get("message", {}).get("type", "unknown")
        types[t] = types.get(t, 0) + 1
    
    for t, c in sorted(types.items(), key=lambda x: -x[1]):
        print(f"   - {t}: {c}")

if __name__ == "__main__":
    migrate()
