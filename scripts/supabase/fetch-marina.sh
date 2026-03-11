#!/bin/bash
SUPABASE_URL="https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Buscar agente da Marina (location_id = Bgi2hFMgiLLoRlOO0K5b)
curl -s "${SUPABASE_URL}/rest/v1/agent_versions?location_id=eq.Bgi2hFMgiLLoRlOO0K5b&select=id,agent_name,version,status,is_active,system_prompt&order=created_at.desc&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
