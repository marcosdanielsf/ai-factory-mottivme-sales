#!/usr/bin/env python3
"""
Backup da tabela n8n_schedule_tracking antes de qualquer alteração
"""

import requests
import json
from datetime import datetime

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def backup():
    print("=== BACKUP: n8n_schedule_tracking ===\n")

    # Buscar todos os registros
    all_records = []
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=*&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if not data or not isinstance(data, list):
            break
        all_records.extend(data)
        offset += limit
        print(f"   {len(all_records)} registros...")
        if len(data) < limit:
            break

    print(f"\nTotal: {len(all_records)} registros\n")

    # Salvar em arquivo JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_n8n_schedule_tracking_{timestamp}.json"

    with open(filename, 'w') as f:
        json.dump(all_records, f, indent=2, default=str)

    print(f"✅ Backup salvo em: {filename}")
    print(f"   Tamanho: {len(json.dumps(all_records))} bytes")

    return filename

if __name__ == "__main__":
    backup()
