// Supabase Edge Function: Process Prospector Queue
// Picks leads from queue, selects templates, dispatches DMs via n8n webhook,
// logs results, and advances stage.
// Triggered by cron (hourly 9h-20h BRT) or manual invocation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HOUR_MS = 3_600_000
const BRT_OFFSET_MS = -3 * HOUR_MS

interface Campaign {
  id: string
  name: string
  vertical: 'clinicas' | 'coaches' | 'infoprodutores'
  channels: string[]
  status: 'ativa' | 'pausada' | 'concluida'
  daily_limit: number
  dms_sent: number
  leads_processed: number
  total_leads: number
  replies: number
  conversions: number
}

interface Lead {
  id: string
  campaign_id: string
  name: string
  username: string | null
  channel: 'instagram' | 'linkedin' | 'whatsapp'
  stage: 'warm_up' | 'first_contact' | 'follow_up' | 'breakup' | 'completed'
  temperature: 'hot' | 'warm' | 'cold'
  icp_tier: 'A' | 'B' | 'C'
  city: string | null
  bio_highlight: string | null
  next_action: string | null
  next_action_at: string | null
}

interface DmTemplate {
  id: string
  name: string
  channel: string
  stage: string
  vertical: string
  content: string
  variant: string
  reply_rate: number
  times_sent: number
  is_active: boolean
}

// Stage progression map: current -> next stage + delay in hours
const STAGE_MAP: Record<string, { next: string; delayHours: number }> = {
  warm_up:       { next: 'first_contact', delayHours: 24 },
  first_contact: { next: 'follow_up',     delayHours: 48 },
  follow_up:     { next: 'breakup',       delayHours: 72 },
  breakup:       { next: 'completed',     delayHours: 0 },
}

// Operating hours (BRT = UTC-3)
const OPERATING_START_UTC = 12 // 9h BRT
const OPERATING_END_UTC = 23   // 20h BRT

interface ProcessRequest {
  campaign_id?: string
  dry_run?: boolean
}

interface ProcessResult {
  lead_id: string
  lead_name: string
  campaign_id: string
  channel: string
  stage: string
  template_name: string | null
  action: 'dm_sent' | 'no_template' | 'skipped' | 'completed' | 'error'
  next_stage?: string
  next_action_at?: string
  error?: string
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

    const body = await req.json().catch(() => ({}))
    const { campaign_id, dry_run = false } = body as ProcessRequest

    // Check operating hours (BRT)
    const nowUtc = new Date()
    const hour = nowUtc.getUTCHours()
    if (hour < OPERATING_START_UTC || hour >= OPERATING_END_UTC) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Outside operating hours (9-20h BRT). Current UTC hour: ${hour}. Skipping.`,
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Get active campaigns (optionally filtered)
    let campaignQuery = supabase
      .from('prospector_campaigns')
      .select('*')
      .eq('status', 'ativa')

    if (campaign_id) {
      campaignQuery = campaignQuery.eq('id', campaign_id)
    }

    const { data: campaigns, error: campErr } = await campaignQuery
    if (campErr) throw campErr
    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active campaigns', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Load all active templates
    const { data: templates, error: tmplErr } = await supabase
      .from('prospector_dm_templates')
      .select('*')
      .eq('is_active', true)

    if (tmplErr) throw tmplErr

    const results: ProcessResult[] = []

    // Calculate "today" in BRT timezone for daily limit
    const nowBrt = new Date(nowUtc.getTime() + BRT_OFFSET_MS)
    const todayBrt = nowBrt.toISOString().slice(0, 10) // YYYY-MM-DD in BRT
    // BRT day boundaries in UTC: 03:00 UTC = 00:00 BRT
    const dayStartUtc = `${todayBrt}T03:00:00Z`
    const dayEndUtc = new Date(new Date(`${todayBrt}T03:00:00Z`).getTime() + 24 * HOUR_MS).toISOString()

    for (const campaign of campaigns as Campaign[]) {
      // 3. Count DMs already sent today (BRT) for this campaign
      const { count: sentToday, error: countErr } = await supabase
        .from('prospector_dm_logs')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .gte('sent_at', dayStartUtc)
        .lt('sent_at', dayEndUtc)

      if (countErr) throw countErr

      const dailyLimit = campaign.daily_limit || 50
      const remaining = dailyLimit - (sentToday || 0)

      if (remaining <= 0) {
        results.push({
          lead_id: '',
          lead_name: '',
          campaign_id: campaign.id,
          channel: '',
          stage: '',
          template_name: null,
          action: 'skipped',
          error: `Daily limit reached (${sentToday}/${dailyLimit})`,
        })
        continue
      }

      // 4. Get leads ready for action (next_action_at <= now OR null for new leads)
      const nowIso = nowUtc.toISOString()
      const { data: leads, error: leadErr } = await supabase
        .from('prospector_queue_leads')
        .select('*')
        .eq('campaign_id', campaign.id)
        .neq('stage', 'completed')
        .or(`next_action_at.is.null,next_action_at.lte.${nowIso}`)
        .order('next_action_at', { ascending: true, nullsFirst: true })
        .limit(remaining)

      if (leadErr) throw leadErr
      if (!leads || leads.length === 0) continue

      // 5. Process each lead
      for (const lead of leads as Lead[]) {
        try {
          const result = await processLead(supabase, campaign, lead, (templates || []) as DmTemplate[], dry_run)
          results.push(result)
        } catch (err) {
          results.push({
            lead_id: lead.id,
            lead_name: lead.name,
            campaign_id: campaign.id,
            channel: lead.channel,
            stage: lead.stage,
            template_name: null,
            action: 'error',
            error: (err as Error).message,
          })
        }
      }

      // 6. Update campaign counters
      if (!dry_run) {
        const sentCount = results.filter(
          r => r.campaign_id === campaign.id && r.action === 'dm_sent'
        ).length

        if (sentCount > 0) {
          const { error: updateErr } = await supabase
            .from('prospector_campaigns')
            .update({
              dms_sent: (campaign.dms_sent || 0) + sentCount,
              leads_processed: (campaign.leads_processed || 0) + sentCount,
            })
            .eq('id', campaign.id)

          if (updateErr) {
            console.error(`Failed to update campaign ${campaign.id} counters:`, updateErr)
          }
        }
      }
    }

    const sent = results.filter(r => r.action === 'dm_sent').length
    const completed = results.filter(r => r.action === 'completed').length
    const skipped = results.filter(r => r.action === 'skipped').length
    const noTemplate = results.filter(r => r.action === 'no_template').length
    const errors = results.filter(r => r.action === 'error').length

    return new Response(
      JSON.stringify({
        success: true,
        dry_run,
        processed: results.length,
        summary: { sent, completed, skipped, no_template: noTemplate, errors },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Process prospector queue error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processLead(
  supabase: SupabaseClient,
  campaign: Campaign,
  lead: Lead,
  templates: DmTemplate[],
  dryRun: boolean
): Promise<ProcessResult> {
  const stage = lead.stage || 'warm_up'
  const channel = lead.channel
  const vertical = campaign.vertical

  // Find matching template
  const matching = templates.filter(
    t => t.channel === channel && t.stage === stage && t.vertical === vertical
  )

  if (matching.length === 0) {
    return {
      lead_id: lead.id,
      lead_name: lead.name,
      campaign_id: campaign.id,
      channel,
      stage,
      template_name: null,
      action: 'no_template',
      error: `No template for ${channel}/${stage}/${vertical}`,
    }
  }

  // Pick template (weighted random by reply_rate)
  const template = pickTemplate(matching)

  // Build personalized message
  const message = personalizeMessage(template.content, lead, campaign)

  // Calculate stage progression (used in both dry_run and real mode)
  const progression = STAGE_MAP[stage]
  const nextActionAt = progression && progression.delayHours > 0
    ? new Date(Date.now() + progression.delayHours * HOUR_MS).toISOString()
    : null
  const nextStage = progression?.next ?? stage

  if (dryRun) {
    return {
      lead_id: lead.id,
      lead_name: lead.name,
      campaign_id: campaign.id,
      channel,
      stage,
      template_name: template.name,
      action: nextStage === 'completed' ? 'completed' : 'dm_sent',
      next_stage: nextStage,
      next_action_at: nextActionAt ?? undefined,
    }
  }

  // Log the DM first (audit trail)
  const { error: logErr } = await supabase.from('prospector_dm_logs').insert({
    campaign_id: campaign.id,
    lead_id: lead.id,
    template_id: template.id,
    channel,
  })
  if (logErr) {
    throw new Error(`Failed to log DM for lead ${lead.id}: ${logErr.message}`)
  }

  // Update template send count
  const { error: tmplUpdateErr } = await supabase
    .from('prospector_dm_templates')
    .update({ times_sent: (template.times_sent || 0) + 1 })
    .eq('id', template.id)

  if (tmplUpdateErr) {
    console.error(`Failed to update template ${template.id} count:`, tmplUpdateErr)
  }

  // Dispatch via n8n webhook (with retry)
  const webhookUrl = Deno.env.get('N8N_PROSPECTOR_WEBHOOK_URL')
  if (webhookUrl) {
    await dispatchDM(webhookUrl, {
      event: 'prospector_dm',
      lead_id: lead.id,
      lead_name: lead.name,
      username: lead.username,
      channel,
      message,
      template_id: template.id,
      template_name: template.name,
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      vertical,
      stage,
    })
  }

  // Advance stage
  if (progression) {
    const updateData: Record<string, unknown> = {
      stage: progression.next,
      next_action: progression.next === 'completed' ? null : `send_${progression.next}`,
      next_action_at: nextActionAt,
    }

    const { error: leadUpdateErr } = await supabase
      .from('prospector_queue_leads')
      .update(updateData)
      .eq('id', lead.id)

    if (leadUpdateErr) {
      console.error(`Failed to advance lead ${lead.id} stage:`, leadUpdateErr)
    }
  }

  return {
    lead_id: lead.id,
    lead_name: lead.name,
    campaign_id: campaign.id,
    channel,
    stage,
    template_name: template.name,
    action: nextStage === 'completed' ? 'completed' : 'dm_sent',
    next_stage: nextStage,
    next_action_at: nextActionAt ?? undefined,
  }
}

function pickTemplate(candidates: DmTemplate[]): DmTemplate {
  const totalRate = candidates.reduce((sum, t) => sum + (t.reply_rate || 0.1), 0)

  if (totalRate <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  let rand = Math.random() * totalRate
  for (const t of candidates) {
    rand -= (t.reply_rate || 0.1)
    if (rand <= 0) return t
  }
  return candidates[0]
}

function personalizeMessage(content: string, lead: Lead, campaign: Campaign): string {
  return content
    .replace(/\{\{nome\}\}/gi, lead.name || 'voce')
    .replace(/\{\{username\}\}/gi, lead.username || '')
    .replace(/\{\{cidade\}\}/gi, lead.city || 'sua cidade')
    .replace(/\{\{bio\}\}/gi, lead.bio_highlight || '')
    .replace(/\{\{vertical\}\}/gi, campaign.vertical || '')
    .replace(/\{\{campanha\}\}/gi, campaign.name || '')
}

async function dispatchDM(webhookUrl: string, data: Record<string, unknown>, retries = 3): Promise<void> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) return

      console.error(`Webhook attempt ${attempt + 1}/${retries} failed: ${response.status} ${response.statusText}`)
    } catch (error) {
      console.error(`Webhook attempt ${attempt + 1}/${retries} error:`, error)
    }

    if (attempt < retries - 1) {
      await new Promise(r => setTimeout(r, 2 ** attempt * 1000))
    }
  }

  throw new Error(`Webhook dispatch failed after ${retries} attempts`)
}
