/**
 * Sync GHL Calendar Events → Supabase appointments_log
 * Puxa todos os appointments de cada location via GHL Calendar API
 * e faz upsert no Supabase (dedup por appointmentId).
 *
 * Usage: node scripts/sync-appointments.mjs
 */

const GHL_BASE = 'https://services.leadconnectorhq.com';
const SUPABASE_URL = 'https://bfumywvwubvernvhjehk.supabase.co';

// Service role key para bypass de RLS
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required');
  process.exit(1);
}

// Clientes com location_id, PIT e calendarios
const LOCATIONS = [
  {
    name: 'Marina Couto',
    location_id: 'Bgi2hFMgiLLoRlOO0K5b',
    pit: 'pit-f06ab738-26de-4c52-85f1-79435666c4e6',
    calendars: ['LvZWMISiyYnF8p7TrY7q', 'adnTALAtLmPN7yuideFk'],
  },
  {
    name: 'Dr. Alberto',
    location_id: 'GT77iGk2WDneoHwtuq6D',
    pit: 'pit-eb6cb2ad-a0ac-40cd-b416-ef0064420e73',
    calendars: [], // will use locationId only
  },
  {
    name: 'Dra. Eline',
    location_id: 'pFHwENFUxjtiON94jn2k',
    pit: 'pit-ff8884c8-1492-4e84-8ad5-7c3013e7e955',
    calendars: [],
  },
  {
    name: 'Dra. Gabriella',
    location_id: 'xliub5H5pQ4QcDeKHc6F',
    pit: 'pit-19779a74-2143-4f1e-be77-2985452ec76b',
    calendars: [],
  },
  {
    name: 'Fernanda Lappe',
    location_id: 'EKHxHl3KLPN0iRc69GNU',
    pit: 'pit-ec27c8b8-d8c6-4c12-abd4-8c8de6482f41',
    calendars: [],
  },
  {
    name: 'Milton Abreu',
    location_id: 'mHuN6v75KQc3lwmBd6mV',
    pit: 'pit-048a8eba-fa6e-42ce-8bd4-3564a7dde62d',
    calendars: [],
  },
];

// Date range: last 60 days
const END = new Date();
END.setHours(23, 59, 59, 999);
const START = new Date();
START.setDate(START.getDate() - 60);
START.setHours(0, 0, 0, 0);

const startMs = START.getTime().toString();
const endMs = END.getTime().toString();

console.log(`Sync period: ${START.toISOString().slice(0,10)} → ${END.toISOString().slice(0,10)}`);

async function fetchCalendarEvents(pit, locationId, calendarId) {
  const params = new URLSearchParams({
    locationId,
    startTime: startMs,
    endTime: endMs,
  });
  if (calendarId) params.set('calendarId', calendarId);

  const res = await fetch(`${GHL_BASE}/calendars/events?${params}`, {
    headers: {
      'Authorization': `Bearer ${pit}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL API ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.events || [];
}

async function fetchAllEventsForLocation(loc) {
  let allEvents = [];

  if (loc.calendars.length > 0) {
    // Fetch per calendar
    for (const calId of loc.calendars) {
      const events = await fetchCalendarEvents(loc.pit, loc.location_id, calId);
      allEvents.push(...events);
    }
  } else {
    // Fetch all calendars for location — first get calendars list
    const res = await fetch(`${GHL_BASE}/calendars/?locationId=${loc.location_id}`, {
      headers: {
        'Authorization': `Bearer ${loc.pit}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const calendars = data.calendars || [];
      for (const cal of calendars) {
        const events = await fetchCalendarEvents(loc.pit, loc.location_id, cal.id);
        allEvents.push(...events);
      }
    }
  }

  // Dedup by event id
  const seen = new Map();
  for (const ev of allEvents) {
    if (ev.id && !ev.deleted) {
      seen.set(ev.id, ev);
    }
  }

  return Array.from(seen.values());
}

function mapEventToRow(event, locationName, locationId) {
  const startTime = event.startTime ? new Date(event.startTime).toISOString() : null;

  return {
    ghl_appointment_id: event.id,
    appointment_date: startTime,
    contact_name: event.title || null,
    location_id: locationId,
    location_name: locationName,
    appointment_type: event.calendarId || null,
    raw_payload: {
      calendar: {
        appointmentId: event.id,
        appoinmentStatus: event.appointmentStatus || 'new',
        calendarId: event.calendarId,
        contactId: event.contactId,
      },
      contact_id: event.contactId,
      ghl_sync: true,
    },
  };
}

async function upsertToSupabase(rows) {
  if (rows.length === 0) return { inserted: 0, errors: 0 };

  // Batch in chunks of 50
  const BATCH = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/appointments_log?on_conflict=ghl_appointment_id`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
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

  for (const loc of LOCATIONS) {
    process.stdout.write(`\n${loc.name} (${loc.location_id})... `);

    try {
      const events = await fetchAllEventsForLocation(loc);
      console.log(`${events.length} events from GHL`);

      if (events.length === 0) continue;

      const rows = events.map(ev => mapEventToRow(ev, loc.name, loc.location_id));
      const { inserted, errors } = await upsertToSupabase(rows);

      console.log(`  → ${inserted} upserted, ${errors} errors`);
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
