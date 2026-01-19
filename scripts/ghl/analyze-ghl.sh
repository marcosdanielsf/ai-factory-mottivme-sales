#!/bin/bash
export GHL_LOCATION_ID="ehlHgDeJS3sr8rCDcZtA"
export GHL_API_KEY="pit-74b9fbd0-ed0f-49aa-9129-c5e21c751fe0"

echo "=== ANALISE COMPLETA GHL - VERTEX (MOTTIVME) ==="
echo ""

echo ">>> PIPELINES COMPLETOS:"
curl -s "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=$GHL_LOCATION_ID" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in data.get('pipelines', []):
    print(f\"\n📊 PIPELINE: {p['name']} (ID: {p['id']})\")
    print('   Estagios:')
    for s in p.get('stages', []):
        print(f\"   {s['position']+1}. {s['name']} (ID: {s['id'][:8]}...)\")
"

echo ""
echo ">>> CAMPOS PERSONALIZADOS (CONTACT):"
curl -s "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID/customFields" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "
import json, sys
data = json.load(sys.stdin)
fields = [f for f in data.get('customFields', []) if f.get('model') == 'contact']
print(f'   Total: {len(fields)} campos')
print('')
for f in sorted(fields, key=lambda x: x.get('position', 0)):
    tipo = f.get('dataType', 'TEXT')
    nome = f.get('name', 'N/A')[:40]
    key = f.get('fieldKey', 'N/A').replace('contact.', '')[:30]
    print(f\"   - {nome} [{tipo}] -> {key}\")
"

echo ""
echo ">>> TAGS EXISTENTES:"
curl -s "https://services.leadconnectorhq.com/locations/$GHL_LOCATION_ID/tags" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "
import json, sys
data = json.load(sys.stdin)
tags = data.get('tags', [])
print(f'   Total: {len(tags)} tags')
for t in tags[:30]:
    print(f\"   - {t.get('name', 'N/A')}\")
if len(tags) > 30:
    print(f'   ... e mais {len(tags)-30} tags')
"

echo ""
echo ">>> CONTATOS RECENTES:"
curl -s "https://services.leadconnectorhq.com/contacts/?locationId=$GHL_LOCATION_ID&limit=5" \
  -H "Authorization: Bearer $GHL_API_KEY" \
  -H "Version: 2021-07-28" | python3 -c "
import json, sys
data = json.load(sys.stdin)
contacts = data.get('contacts', [])
print(f'   Ultimos {len(contacts)} contatos:')
for c in contacts:
    name = c.get('name') or c.get('firstName', 'N/A')
    email = c.get('email', '-')
    print(f\"   - {name} ({email})\")
"
