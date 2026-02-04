#!/bin/bash

# ============================================
# Criar campo "Tipo de Lead" no GHL
# ============================================

# INSTRUÇÕES:
# 1. Substitua YOUR_ACCESS_TOKEN pelo token do GHL
# 2. Substitua LOCATION_ID pelo ID do location
# 3. Execute: bash criar-campo-tipo-lead-ghl.sh

ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
LOCATION_ID="YOUR_LOCATION_ID"

# Criar o campo customizado
curl --request POST \
  --url "https://services.leadconnectorhq.com/locations/${LOCATION_ID}/customFields" \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --header "Version: 2021-07-28" \
  --data '{
    "name": "Tipo de Lead",
    "dataType": "SINGLE_OPTIONS",
    "model": "contact",
    "placeholder": "Selecione o tipo de lead",
    "options": [
      {
        "name": "Paciente",
        "value": "paciente"
      },
      {
        "name": "Médico (Mentoria)",
        "value": "medico_mentoria"
      },
      {
        "name": "Empresário",
        "value": "empresario"
      },
      {
        "name": "Investidor",
        "value": "investidor"
      }
    ]
  }'

echo ""
echo "Campo criado! Verifique no GHL > Settings > Custom Fields"
