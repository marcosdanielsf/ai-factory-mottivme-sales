// Supabase Edge Function: Qualify Lead (ICP Scoring)
// Uses Claude API to analyze lead profile and calculate ICP score

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, sanitizePromptInput, securityLog } from '../_shared/cors.ts'

interface QualifyLeadRequest {
  lead_id: string
  icp_criteria?: ICPCriteria
}

interface ICPCriteria {
  target_titles: string[]
  target_industries: string[]
  company_size_min?: number
  company_size_max?: number
  revenue_min?: number
  location?: string[]
  custom_criteria?: string
}

const DEFAULT_ICP: ICPCriteria = {
  target_titles: ['CEO', 'Founder', 'Owner', 'CMO', 'CFO', 'COO', 'Director', 'Head', 'VP'],
  target_industries: ['Technology', 'SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'Marketing'],
  company_size_min: 10,
  company_size_max: 500,
  location: ['São Paulo', 'Rio de Janeiro', 'Brasil', 'Brazil']
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { lead_id, icp_criteria } = await req.json() as QualifyLeadRequest
    const criteria = { ...DEFAULT_ICP, ...icp_criteria }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('socialfy_leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${lead_id}`)
    }

    // Calculate base score from structured data
    let baseScore = calculateBaseScore(lead, criteria)

    // Use AI for deeper analysis if we have enough data
    let aiInsights = null
    if (lead.source_data || lead.cnpj_data) {
      const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (claudeApiKey) {
        aiInsights = await getAIInsights(lead, criteria, claudeApiKey)
        // Adjust score based on AI analysis
        baseScore = Math.round((baseScore + aiInsights.score) / 2)
      }
    }

    // Ensure score is within bounds
    const finalScore = Math.max(0, Math.min(100, baseScore))

    // Update lead with new ICP score
    const { error: updateError } = await supabase
      .from('socialfy_leads')
      .update({
        icp_score: finalScore,
        custom_fields: {
          ...lead.custom_fields,
          icp_analysis: {
            score: finalScore,
            analyzed_at: new Date().toISOString(),
            insights: aiInsights?.insights || null,
            criteria_match: aiInsights?.criteria_match || null
          }
        }
      })
      .eq('id', lead_id)

    if (updateError) {
      throw new Error(`Failed to update lead: ${updateError.message}`)
    }

    // Log activity
    await supabase.from('socialfy_activities').insert({
      organization_id: lead.organization_id,
      lead_id: lead.id,
      type: 'icp_qualification',
      channel: 'system',
      direction: 'outbound',
      content: `ICP Score updated to ${finalScore}`,
      status: 'completed',
      metadata: {
        previous_score: lead.icp_score,
        new_score: finalScore,
        ai_used: !!aiInsights
      },
      performed_at: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        lead_id,
        score: finalScore,
        previous_score: lead.icp_score,
        insights: aiInsights?.insights || null,
        criteria_match: aiInsights?.criteria_match || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error qualifying lead:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateBaseScore(lead: any, criteria: ICPCriteria): number {
  let score = 50 // Start at neutral

  // Title match (max +25)
  if (lead.title) {
    const titleLower = lead.title.toLowerCase()
    const titleMatch = criteria.target_titles.some(t =>
      titleLower.includes(t.toLowerCase())
    )
    if (titleMatch) score += 25
  }

  // Has company info (+10)
  if (lead.company) score += 10

  // Has multiple channels (+5 per channel, max +15)
  const channelCount = lead.channels?.length || 0
  score += Math.min(channelCount * 5, 15)

  // Has email (+5)
  if (lead.email) score += 5

  // Has phone (+5)
  if (lead.phone) score += 5

  // Has LinkedIn (+5)
  if (lead.linkedin_url) score += 5

  // Has CNPJ data (+10)
  if (lead.cnpj_data) score += 10

  // Has source data (+5)
  if (lead.source_data) score += 5

  return score
}

async function getAIInsights(
  lead: any,
  criteria: ICPCriteria,
  apiKey: string
): Promise<{ score: number; insights: string; criteria_match: Record<string, boolean> }> {
  // ===========================================
  // SECURITY: Sanitização de inputs do prompt
  // ===========================================
  const safeName = sanitizePromptInput(lead.name, 100)
  const safeTitle = sanitizePromptInput(lead.title, 100) || 'N/A'
  const safeCompany = sanitizePromptInput(lead.company, 100) || 'N/A'
  const safeEmail = lead.email ? '(presente)' : 'N/A' // Não expor email no prompt
  const safeChannels = Array.isArray(lead.channels) ? lead.channels.slice(0, 5).join(', ') : 'N/A'

  // Sanitizar source_data
  let safeSourceData = ''
  if (lead.source_data && typeof lead.source_data === 'object') {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(lead.source_data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizePromptInput(value, 150)
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      }
    }
    if (Object.keys(sanitized).length > 0) {
      safeSourceData = `- Dados do perfil: ${JSON.stringify(sanitized)}`
    }
  }

  // Sanitizar cnpj_data (apenas dados seguros)
  let safeCnpjData = ''
  if (lead.cnpj_data && typeof lead.cnpj_data === 'object') {
    const cnpjSafe = {
      porte: sanitizePromptInput(lead.cnpj_data.porte, 50),
      natureza_juridica: sanitizePromptInput(lead.cnpj_data.natureza_juridica, 100),
      capital_social: typeof lead.cnpj_data.capital_social === 'number' ? lead.cnpj_data.capital_social : null,
    }
    safeCnpjData = `- Dados CNPJ: ${JSON.stringify(cnpjSafe)}`
  }

  // Sanitizar custom_criteria
  const safeCustomCriteria = criteria.custom_criteria
    ? sanitizePromptInput(criteria.custom_criteria, 200)
    : ''

  const prompt = `Analise este lead e determine o ICP Score (0-100) baseado nos critérios fornecidos.

LEAD:
- Nome: ${safeName}
- Cargo: ${safeTitle}
- Empresa: ${safeCompany}
- Email: ${safeEmail}
- Canais disponíveis: ${safeChannels}
${safeSourceData}
${safeCnpjData}

CRITÉRIOS ICP:
- Cargos alvo: ${criteria.target_titles.slice(0, 10).join(', ')}
- Setores alvo: ${criteria.target_industries.slice(0, 10).join(', ')}
- Tamanho empresa: ${criteria.company_size_min || 0} - ${criteria.company_size_max || 'ilimitado'} funcionários
- Localização: ${criteria.location?.slice(0, 5).join(', ') || 'Qualquer'}
${safeCustomCriteria ? `- Critérios custom: ${safeCustomCriteria}` : ''}

Responda APENAS em JSON válido no formato:
{
  "score": <número 0-100>,
  "insights": "<análise em 1-2 frases>",
  "criteria_match": {
    "title": <true/false>,
    "industry": <true/false>,
    "company_size": <true/false>,
    "location": <true/false>
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      securityLog('error', 'Claude API error in qualify-lead', { status: response.status })
      throw new Error(`Claude API returned ${response.status}`)
    }

    const data = await response.json()
    const text = data.content?.[0]?.text

    if (!text) {
      securityLog('warn', 'Empty response from Claude API')
      throw new Error('Empty response from Claude')
    }

    // ===========================================
    // SECURITY: Parse JSON com try-catch
    // ===========================================
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])

        // Validar estrutura do response
        const score = typeof parsed.score === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : 50

        const insights = typeof parsed.insights === 'string'
          ? parsed.insights.slice(0, 500)
          : 'Análise disponível'

        const criteriaMatch = parsed.criteria_match && typeof parsed.criteria_match === 'object'
          ? {
              title: !!parsed.criteria_match.title,
              industry: !!parsed.criteria_match.industry,
              company_size: !!parsed.criteria_match.company_size,
              location: !!parsed.criteria_match.location
            }
          : { title: false, industry: false, company_size: false, location: false }

        return { score, insights, criteria_match: criteriaMatch }

      } catch (parseError) {
        securityLog('warn', 'Failed to parse Claude JSON response', {
          error: parseError instanceof Error ? parseError.message : 'Unknown'
        })
      }
    }
  } catch (error) {
    securityLog('error', 'AI analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown'
    })
  }

  // Fallback
  return {
    score: 50,
    insights: 'Análise automática não disponível',
    criteria_match: { title: false, industry: false, company_size: false, location: false }
  }
}
