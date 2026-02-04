import urllib.request
import json

url = "https://bfumywvwubvernvhjehk.supabase.co/rest/v1/fuu_agent_configs"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

data = {
    "location_id": "DEFAULT_CONFIG",
    "follow_up_type": "sdr_outbound_instagram_reactivation",
    "agent_name": "BDR Virtual",
    "company_name": "{{company_name}}",
    "company_description": "{{company_description}}",
    "agent_role": "BDR de Reativacao",
    "language": "pt-BR",
    "tone": "casual-amigavel",
    "use_slang": True,
    "use_emoji": True,
    "max_emoji_per_message": 1,
    "max_message_lines": 3,
    "offer_value_attempt": 2,
    "breakup_attempt": 3,
    "custom_prompts": {"prime_directive": "Reativacao leve. Ofereca valor primeiro."},
    "message_examples": [
        {"attempt": 1, "example": "Oi! Tinha te mandado msg."},
        {"attempt": 2, "example": "Tenho um material sobre Y. Quer?"},
        {"attempt": 3, "example": "Vou parar por aqui."}
    ],
    "custom_rules": ["Nunca cobre resposta", "Ofereca valor antes"],
    "is_active": True
}

req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        print("SUCCESS:", json.dumps(result, indent=2))
except urllib.error.HTTPError as e:
    print("ERROR:", e.code, e.read().decode())
