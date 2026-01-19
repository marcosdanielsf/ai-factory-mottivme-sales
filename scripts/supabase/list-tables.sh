#!/bin/bash
SUPABASE_URL="https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Listar tabelas que podem ter estado do lead
curl -s "${SUPABASE_URL}/rest/v1/n8n_active_conversation?select=*&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" | jq '.[0] | keys'
