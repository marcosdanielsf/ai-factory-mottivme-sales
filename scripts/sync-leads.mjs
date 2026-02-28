/**
 * Sync GHL Contacts → Supabase n8n_schedule_tracking
 * Usa POST /contacts/search (retorna TODOS os contatos com paginacao correta)
 * e faz upsert no Supabase (dedup por unique_id = contactId).
 *
 * Usage: node scripts/sync-leads.mjs              # todas as locations
 *        node scripts/sync-leads.mjs "Marina"      # filtrar por nome
 */

const GHL_BASE = 'https://services.leadconnectorhq.com';
const SUPABASE_URL = 'https://bfumywvwubvernvhjehk.supabase.co';

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required');
  process.exit(1);
}

const LOCATIONS = [
  { name: 'Marina Couto', location_id: 'Bgi2hFMgiLLoRlOO0K5b', pit: 'pit-f06ab738-26de-4c52-85f1-79435666c4e6' },
  { name: 'Dr. Alberto', location_id: 'GT77iGk2WDneoHwtuq6D', pit: 'pit-eb6cb2ad-a0ac-40cd-b416-ef0064420e73' },
  { name: 'Dra. Eline', location_id: 'pFHwENFUxjtiON94jn2k', pit: 'pit-ff8884c8-1492-4e84-8ad5-7c3013e7e955' },
  { name: 'Dra. Gabriella', location_id: 'xliub5H5pQ4QcDeKHc6F', pit: 'pit-19779a74-2143-4f1e-be77-2985452ec76b' },
  { name: 'Fernanda Lappe', location_id: 'EKHxHl3KLPN0iRc69GNU', pit: 'pit-ec27c8b8-d8c6-4c12-abd4-8c8de6482f41' },
  { name: 'Milton Abreu', location_id: 'mHuN6v75KQc3lwmBd6mV', pit: 'pit-048a8eba-fa6e-42ce-8bd4-3564a7dde62d' },
  { name: 'Flavia Leal', location_id: '8GedMLMaF26jIkHq50XG', pit: 'pit-12c3bcfd-8745-4fb7-a232-64b370998c9a' },
  { name: 'Heloise Silvestre', location_id: 'uSwkCg4V1rfpvk4tG6zP', pit: 'pit-585083ce-b329-426b-bfe3-b77a00efc96a' },
  { name: 'Luiz Augusto', location_id: 'sNwLyynZWP6jEtBy1ubf', pit: 'pit-f520ac8a-0846-4822-ad3b-0047451618d1' },
  { name: 'Thauan Santos', location_id: 'Rre0WqSlmAPmIrURgiMf', pit: 'pit-449e1aee-aff9-49a9-9859-82b1f8ee6988' },
  { name: 'Dra. Carolina Simonatto', location_id: 'mfOxMOpk3DoQXRB47MgS', pit: 'pit-e933857c-2295-4004-b9fe-7b57798e6f02' },
];

const filterNames = process.argv.slice(2);
if (filterNames.length > 0) {
  console.log(`Filtering locations: ${filterNames.join(', ')}`);
}

/**
 * Fetch ALL contacts via POST /contacts/search (proper pagination)
 * Returns all contacts, no arbitrary cap
 */
async function fetchContacts(pit, locationId) {
  let allContacts = [];
  let page = 1;
  const pageLimit = 100;

  while (true) {
    const res = await fetch(`${GHL_BASE}/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pit}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locationId, pageLimit, page }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GHL Search API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const contacts = data.contacts || [];
    allContacts.push(...contacts);

    if (page % 10 === 0) process.stdout.write(`  page ${page} (${allContacts.length})... `);

    if (contacts.length < pageLimit) break;

    // Safety: max 500 pages (50k contacts per location)
    if (page >= 500) {
      console.log('  (max pages reached)');
      break;
    }
    page++;
  }

  return allContacts;
}

// Truncate to fit varchar columns
const trunc = (val, max = 50) => val ? String(val).slice(0, max) : null;

function mapContactToRow(contact, locationName, locationId) {
  const attr = contact.attributionSource || {};

  return {
    unique_id: contact.id,
    first_name: trunc(contact.firstName || contact.name),
    last_name: trunc(contact.lastName),
    email: trunc(contact.email, 100),
    phone: trunc(contact.phone, 30),
    location_id: locationId,
    location_name: trunc(locationName),
    source: trunc(contact.source),
    utm_source: trunc(attr.utmSource),
    utm_medium: trunc(attr.medium),
    utm_campaign: trunc(attr.utmCampaign, 100),
    utm_content: trunc(attr.utmContent, 100),
    ad_id: trunc(attr.adId),
    adset_id: trunc(attr.adsetId),
    campaign_id: trunc(attr.campaignId),
    session_source: trunc(attr.sessionSource),
    created_at: contact.dateAdded || contact.createdAt || new Date().toISOString(),
    ativo: true,
    field: 'ghl_sync',
    value: 'synced',
    execution_id: 'sync-leads-script',
  };
}

async function upsertToSupabase(rows) {
  if (rows.length === 0) return { inserted: 0, errors: 0 };

  const BATCH = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/n8n_schedule_tracking?on_conflict=unique_id`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      inserted += batch.length;
    } else {
      const text = await res.text();
      console.error(`  Supabase error batch ${i}: ${text.slice(0, 200)}`);
      errors += batch.length;
    }
  }

  return { inserted, errors };
}

async function main() {
  let totalSynced = 0;
  let totalErrors = 0;

  const locs = filterNames.length > 0
    ? LOCATIONS.filter(l => filterNames.some(f => l.name.toLowerCase().includes(f.toLowerCase())))
    : LOCATIONS;

  for (const loc of locs) {
    process.stdout.write(`\n${loc.name} (${loc.location_id})... `);

    try {
      const contacts = await fetchContacts(loc.pit, loc.location_id);
      console.log(`${contacts.length} contacts from GHL`);

      if (contacts.length === 0) continue;

      const rows = contacts.map(c => mapContactToRow(c, loc.name, loc.location_id));
      const { inserted, errors } = await upsertToSupabase(rows);

      console.log(`  → ${inserted} upserted (new only), ${errors} errors`);
      totalSynced += inserted;
      totalErrors += errors;
    } catch (err) {
      console.error(`  ERRO: ${err.message}`);
      totalErrors++;
    }
  }

  console.log(`\n===========================`);
  console.log(`Total synced: ${totalSynced}`);
  console.log(`Total errors: ${totalErrors}`);
}

main();
