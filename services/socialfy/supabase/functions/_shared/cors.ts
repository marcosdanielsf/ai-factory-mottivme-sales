// Shared CORS headers for all Edge Functions
// SECURITY: Whitelist de domínios permitidos (não usar '*')

const ALLOWED_ORIGINS = [
  'https://socialfy-platform.vercel.app',
  'https://socialfy.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Legacy export para compatibilidade (usar getCorsHeaders preferencialmente)
export const corsHeaders = getCorsHeaders(ALLOWED_ORIGINS[0])

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }
  return null
}

// ===========================================
// SECURITY UTILS
// ===========================================

/**
 * Sanitiza input para prevenir prompt injection
 */
export function sanitizePromptInput(text: string | null | undefined, maxLength = 500): string {
  if (!text || typeof text !== 'string') return ''

  const jailbreakPatterns = [
    /ignore (all )?(previous |prior )?instruction/gi,
    /disregard (all )?(previous |prior )?instruction/gi,
    /forget (all )?(previous |prior )?instruction/gi,
    /system prompt/gi,
    /you are now/gi,
    /act as/gi,
    /pretend (to be|you are)/gi,
    /new instruction/gi,
    /override/gi,
  ]

  let sanitized = text
  jailbreakPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[FILTERED]')
  })

  return sanitized.slice(0, maxLength).trim()
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Valida formato de telefone (E.164)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Valida UUID
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
}

/**
 * Log de segurança padronizado
 */
export function securityLog(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, any>) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }

  if (level === 'error') {
    console.error('[SECURITY]', JSON.stringify(log))
  } else if (level === 'warn') {
    console.warn('[SECURITY]', JSON.stringify(log))
  } else {
    console.log('[SECURITY]', JSON.stringify(log))
  }
}
