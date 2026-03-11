// Supabase Edge Function: Process Cadence Step
// Executes the next step in a lead's cadence sequence

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessCadenceRequest {
  lead_cadence_id?: string  // Process specific lead-cadence
  batch_size?: number       // Or process batch of due cadences
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

    const { lead_cadence_id, batch_size = 10 } = await req.json() as ProcessCadenceRequest

    let leadCadences: any[] = []

    if (lead_cadence_id) {
      // Process specific lead-cadence
      const { data, error } = await supabase
        .from('socialfy_lead_cadences')
        .select(`
          *,
          lead:socialfy_leads(*),
          cadence:socialfy_cadences(*)
        `)
        .eq('id', lead_cadence_id)
        .single()

      if (error) throw error
      leadCadences = [data]
    } else {
      // Process batch of due cadences
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('socialfy_lead_cadences')
        .select(`
          *,
          lead:socialfy_leads(*),
          cadence:socialfy_cadences(*)
        `)
        .eq('status', 'active')
        .lte('next_activity_at', now)
        .order('next_activity_at', { ascending: true })
        .limit(batch_size)

      if (error) throw error
      leadCadences = data || []
    }

    const results: any[] = []

    for (const lc of leadCadences) {
      try {
        const result = await processLeadCadence(supabase, lc)
        results.push(result)
      } catch (error) {
        console.error(`Error processing lead-cadence ${lc.id}:`, error)
        results.push({
          lead_cadence_id: lc.id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing cadences:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processLeadCadence(supabase: any, lc: any) {
  const { lead, cadence } = lc
  const steps = cadence.steps as any[]
  const currentStep = steps[lc.current_step]

  if (!currentStep) {
    // Cadence completed
    await supabase
      .from('socialfy_lead_cadences')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', lc.id)

    return {
      lead_cadence_id: lc.id,
      lead_id: lead.id,
      success: true,
      action: 'completed',
      message: 'Cadence completed - no more steps'
    }
  }

  // Create activity for this step
  const activity = {
    organization_id: lead.organization_id,
    lead_id: lead.id,
    campaign_id: lc.campaign_id,
    lead_cadence_id: lc.id,
    type: currentStep.action,
    channel: currentStep.channel,
    direction: 'outbound',
    content: currentStep.content || `${currentStep.action} via ${currentStep.channel}`,
    status: 'scheduled',
    responded: false,
    metadata: {
      cadence_name: cadence.name,
      step_number: lc.current_step + 1,
      total_steps: steps.length,
      day: currentStep.day
    },
    scheduled_at: new Date().toISOString(),
    performed_at: new Date().toISOString()
  }

  await supabase.from('socialfy_activities').insert(activity)

  // Calculate next activity time
  const nextStepIndex = lc.current_step + 1
  const nextStep = steps[nextStepIndex]
  let nextActivityAt = null

  if (nextStep) {
    const daysUntilNext = nextStep.day - currentStep.day
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + daysUntilNext)

    // Set time if specified
    if (nextStep.time) {
      const [hours, minutes] = nextStep.time.split(':')
      nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    } else {
      // Default to 9 AM
      nextDate.setHours(9, 0, 0, 0)
    }

    nextActivityAt = nextDate.toISOString()
  }

  // Update lead-cadence
  await supabase
    .from('socialfy_lead_cadences')
    .update({
      current_step: nextStepIndex,
      current_day: currentStep.day,
      next_activity_at: nextActivityAt,
      next_activity_channel: nextStep?.channel || null,
      next_activity_type: nextStep?.action || null
    })
    .eq('id', lc.id)

  // Trigger webhook for N8N to execute the actual action
  const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
  if (webhookUrl) {
    await triggerN8NWebhook(webhookUrl, {
      event: 'cadence_step',
      lead_cadence_id: lc.id,
      lead_id: lead.id,
      lead_name: lead.name,
      lead_email: lead.email,
      lead_phone: lead.phone,
      lead_linkedin: lead.linkedin_url,
      lead_instagram: lead.instagram_handle,
      lead_whatsapp: lead.whatsapp,
      channel: currentStep.channel,
      action: currentStep.action,
      content: currentStep.content,
      template_id: currentStep.template_id,
      cadence_name: cadence.name,
      step_number: lc.current_step + 1,
      campaign_id: lc.campaign_id
    })
  }

  return {
    lead_cadence_id: lc.id,
    lead_id: lead.id,
    lead_name: lead.name,
    success: true,
    action: 'step_processed',
    step: {
      number: lc.current_step + 1,
      channel: currentStep.channel,
      action: currentStep.action
    },
    next_step: nextStep ? {
      number: nextStepIndex + 1,
      channel: nextStep.channel,
      scheduled_at: nextActivityAt
    } : null
  }
}

async function triggerN8NWebhook(url: string, data: any) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  } catch (error) {
    console.error('Failed to trigger N8N webhook:', error)
  }
}
