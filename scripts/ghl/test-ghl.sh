#!/bin/bash
# Teste rápido da conexão GHL - Execute no seu terminal
# SUBCONTA: Vertex (MOTTIVME limpo)

export GHL_LOCATION_ID="ehlHgDeJS3sr8rCDcZtA"
export GHL_API_KEY="pit-74b9fbd0-ed0f-49aa-9129-c5e21c751fe0"

echo "=== TESTANDO CONEXAO GHL - VERTEX ==="
echo ""

echo "1. Info da Location:"
curl -s "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -m json.tool 2>/dev/null | head -30

echo ""
echo "2. Pipelines existentes:"
curl -s "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=$GHL_LOCATION_ID" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -m json.tool 2>/dev/null | head -50

echo ""
echo "3. Campos personalizados:"
curl -s "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID/customFields" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -m json.tool 2>/dev/null | head -50

