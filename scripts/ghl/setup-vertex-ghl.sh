#!/bin/bash
# ============================================
# SETUP COMPLETO GHL - SUBCONTA VERTEX
# MOTTIVME - Processo Comercial
# ============================================

echo ""
echo "========================================"
echo "  SETUP GHL - SUBCONTA VERTEX (MOTTIVME)"
echo "========================================"
echo ""

# Credenciais Vertex
export GHL_LOCATION_ID="ehlHgDeJS3sr8rCDcZtA"
export GHL_API_KEY="pit-74b9fbd0-ed0f-49aa-9129-c5e21c751fe0"

echo "Location ID: $GHL_LOCATION_ID"
echo "API Key: pit-74b9fbd0-***"
echo ""

# ============================================
# PASSO 1: TESTAR CONEXAO
# ============================================

echo ">>> PASSO 1: Testando conexao..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERRO: Conexao falhou (HTTP $HTTP_CODE)"
  echo "Verifique as credenciais."
  exit 1
fi

LOCATION_NAME=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('location',{}).get('name','N/A'))" 2>/dev/null)
echo "Conexao OK! Location: $LOCATION_NAME"
echo ""

# ============================================
# PASSO 2: VERIFICAR ESTADO ATUAL
# ============================================

echo ">>> PASSO 2: Verificando estado atual..."
echo ""

# Pipelines
PIPELINES=$(curl -s "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=$GHL_LOCATION_ID" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('pipelines',[])))" 2>/dev/null)
echo "   Pipelines existentes: $PIPELINES"

# Campos personalizados
FIELDS=$(curl -s "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID/customFields" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('customFields',[])))" 2>/dev/null)
echo "   Campos personalizados: $FIELDS"

# Tags
TAGS=$(curl -s "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID/tags" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('tags',[])))" 2>/dev/null)
echo "   Tags: $TAGS"

echo ""

# ============================================
# PASSO 3: EXECUTAR SETUP
# ============================================

echo ">>> PASSO 3: Executando setup..."
echo ""
echo "Isso vai criar:"
echo "   - 21 campos de contato"
echo "   - 5 campos de oportunidade"
echo "   - 38 tags"
echo "   - 1 pipeline com 11 estagios"
echo ""

read -p "Continuar com o setup? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
  echo "Setup cancelado."
  exit 0
fi

echo ""
echo "Executando ghl-mottivme-setup.js..."
echo ""

# Verificar se Node.js esta instalado
if ! command -v node &> /dev/null; then
  echo "ERRO: Node.js nao encontrado!"
  echo "Instale: brew install node"
  exit 1
fi

# Verificar se axios esta instalado
if ! npm list axios &> /dev/null; then
  echo "Instalando axios..."
  npm install axios --silent
fi

# Executar setup
cd /Users/marcosdaniels/Projects/mottivme
node ghl-mottivme-setup.js

echo ""
echo "========================================"
echo "  SETUP FINALIZADO!"
echo "========================================"
echo ""
echo "Proximos passos:"
echo "1. Verifique o GHL: https://app.socialfy.me/v2/location/$GHL_LOCATION_ID"
echo "2. Configure os webhooks manualmente"
echo "3. Importe os workflows n8n"
echo "4. Teste com um lead de teste"
echo ""
