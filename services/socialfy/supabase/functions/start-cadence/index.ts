// Supabase Edge Function: Start Cadence
// Enrolls a lead into a cadence sequence

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartCadenceRequest {
  lead_id: string
  cadence_id: string
  campaign_id?: string
  start_immediately?: boolean
}

interface BulkStartCadenceRequest {
  lead_ids: string[]
  cadence_id: string
  campaign_id?: string
  start_immediately?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // Check if bulk operation
    if (body.lead_ids && Array.isArray(body.lead_ids)) {
      return await handleBulkStart(supabase, body as BulkStartCadenceRequest)
    }

    return await handleSingleStart(supabase, body as StartCadenceRequest)

  } catch (error) {
    console.error('Error starting cadence:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleSingleStart(supabase: any, request: StartCadenceRequest) {
  const { lead_id, cadence_id, campaign_id, start_immediately = false } = request

  // Verify lead exists
  const { data: lead, error: leadError } = await supabase
    .from('socialfy_leads')
    .select('*')
    .eq('id', lead_id)
    .single()

  if (leadError || !lead) {
    return new Response(
      JSON.stringify({ success: false, error: `Lead not found: ${lead_id}` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if lead is already in an active cadence
  const { data: existingCadence } = await supabase
    .from('socialfy_lead_cadences')
    .select('id, cadence_id')
    .eq('lead_id', lead_id)
    .eq('status', 'active')
    .single()

  if (existingCadence) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Lead is already in an active cadence',
        existing_cadence_id: existingCadence.cadence_id
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get cadence details
  const { data: cadence, error: cadenceError } = await supabase
    .from('socialfy_cadences')
    .select('*')
    .eq('id', cadence_id)
    .single()

  if (cadenceError || !cadence) {
    return new Response(
      JSON.stringify({ success: false, error: `Cadence not found: ${cadence_id}` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const steps = cadence.steps as any[]
  const firstStep = steps[0]

  // Calculate first activity time
  let nextActivityAt: string
  if (start_immediately) {
    nextActivityAt = new Date().toISOString()
  } else {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    nextActivityAt = tomorrow.toISOString()
  }

  // Create lead-cadence entry
  const { data: leadCadence, error: createError } = await supabase
    .from('socialfy_lead_cadences')
    .insert({
      lead_id,
      campaign_id,
      cadence_id,
      current_step: 0,
      current_day: 0,
      status: 'active',
      next_activity_at: nextActivityAt,
      next_activity_channel: firstStep?.channel,
      next_activity_type: firstStep?.action,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (createError) {
    throw createError
  }

  // Update lead status
  await supabase
    .from('socialfy_leads')
    .update({ status: 'in_cadence' })
    .eq('id', lead_id)

  // Update campaign leads count if applicable
  if (campaign_id) {
    await supabase.rpc('increment_campaign_leads', { campaign_id })
  }

  // Update cadence usage count
  await supabase.rpc('increment_cadence_usage', { cadence_id })

  // Log activity
  await supabase.from('socialfy_activities').insert({
    organization_id: lead.organization_id,
    lead_id,
    campaign_id,
    lead_cadence_id: leadCadence.id,
    type: 'cadence_started',
    channel: 'system',
    direction: 'outbound',
    content: `Started cadence: ${cadence.name}`,
    status: 'completed',
    responded: false,
    metadata: {
      cadence_id,
      cadence_name: cadence.name,
      total_steps: steps.length,
      duration_days: cadence.duration_days
    },
    performed_at: new Date().toISOString()
  })

  // Trigger immediate processing if requested
  if (start_immediately) {
    const processUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-cadence`
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ lead_cadence_id: leadCadence.id })
    }).catch(console.error)
  }

  return new Response(
    JSON.stringify({
      success: true,
      lead_cadence_id: leadCadence.id,
      lead: {
        id: lead.id,
        name: lead.name,
        company: lead.company
      },
      cadence: {
        id: cadence.id,
        name: cadence.name,
        duration_days: cadence.duration_days,
        total_steps: steps.length
      },
      first_activity: {
        scheduled_at: nextActivityAt,
        channel: firstStep?.channel,
        action: firstStep?.action
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkStart(supabase: any, request: BulkStartCadenceRequest) {
  const { lead_ids, cadence_id, campaign_id, start_immediately = false } = request

  const results: any[] = []
  const errors: any[] = []

  for (const lead_id of lead_ids) {
    try {
      const response = await handleSingleStart(supabase, {
        lead_id,
        cadence_id,
        campaign_id,
        start_immediately
      })

      const result = await response.json()

      if (result.success) {
        results.push(result)
      } else {
        errors.push({ lead_id, error: result.error })
      }
    } catch (error) {
      errors.push({ lead_id, error: error.message })
    }
  }

  return new Response(
    JSON.stringify({
      success: errors.length === 0,
      total: lead_ids.length,
      enrolled: results.length,
      failed: errors.length,
      results,
      errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
