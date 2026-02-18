// OpenRouter API client for Arena de Debates

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEBATE_MODEL = 'anthropic/claude-3.5-haiku';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export function getOpenRouterApiKey(): string | null {
  return import.meta.env.VITE_OPENROUTER_API_KEY ?? null;
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  signal?: AbortSignal
): Promise<string> {
  const apiKey = getOpenRouterApiKey();

  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY não configurada no .env');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AIOS Arena de Debates',
    },
    body: JSON.stringify({
      model: DEBATE_MODEL,
      messages,
      max_tokens: 400,
      temperature: 0.8,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}
