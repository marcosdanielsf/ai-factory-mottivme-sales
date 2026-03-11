import urllib.request
import json

url = "https://bfumywvwubvernvhjehk.supabase.co/rest/v1/fuu_templates"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

templates = [
    {"location_id": "DEFAULT_CONFIG", "follow_up_type": "sdr_outbound_instagram", "name": "micro_ping_1", "body": "Conseguiu ver?", "channel": "instagram", "is_active": True},
    {"location_id": "DEFAULT_CONFIG", "follow_up_type": "sdr_outbound_instagram", "name": "micro_ping_2", "body": "Viu?", "channel": "instagram", "is_active": True},
    {"location_id": "DEFAULT_CONFIG", "follow_up_type": "sdr_outbound_instagram", "name": "urgency_wa", "body": "{{nome}}, chat vai fechar. Qual teu WA?", "channel": "instagram", "is_active": True},
    {"location_id": "DEFAULT_CONFIG", "follow_up_type": "sdr_outbound_instagram_reactivation", "name": "breakup", "body": "Vou parar por aqui. Se fizer sentido, me chama!", "channel": "instagram", "is_active": True}
]

for template in templates:
    req = urllib.request.Request(url, data=json.dumps(template).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"OK: {template['name']}")
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print(f"ERROR {template['name']}: {error}")
