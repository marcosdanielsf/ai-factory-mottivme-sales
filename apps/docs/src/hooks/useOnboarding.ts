import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============ TYPES ============

export interface OnboardingAnswer {
  questionId: number;
  text: string;
  audioData?: string;
}

export interface OnboardingData {
  name: string;
  answers: OnboardingAnswer[];
}

export interface OnboardingSession {
  id: string;
  user_id: string | null;
  client_name: string;
  q1_product: string | null;
  q2_how_it_works: string | null;
  q3_what_not_do: string | null;
  q4_benefits: string | null;
  q5_ideal_client: string | null;
  q6_ticket_value: string | null;
  q7_daily_goal: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completed_at: string | null;
  created_at: string;
  generated_config: any;
}

interface UseOnboardingReturn {
  saveOnboarding: (data: OnboardingData) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  getLatestOnboarding: (userId?: string) => Promise<OnboardingSession | null>;
  isSaving: boolean;
  error: string | null;
}

// ============ HOOK ============

export function useOnboarding(): UseOnboardingReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Salva os dados do onboarding no Supabase
   */
  const saveOnboarding = useCallback(async (data: OnboardingData) => {
    setIsSaving(true);
    setError(null);

    try {
      // Mapear respostas para as colunas
      const answersMap = new Map<number, OnboardingAnswer>();
      data.answers.forEach(a => answersMap.set(a.questionId, a));

      // Preparar payload
      const payload = {
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
        client_name: data.name,
        q1_product: answersMap.get(1)?.text || null,
        q1_product_audio: answersMap.get(1)?.audioData || null,
        q2_how_it_works: answersMap.get(2)?.text || null,
        q2_how_it_works_audio: answersMap.get(2)?.audioData || null,
        q3_what_not_do: answersMap.get(3)?.text || null,
        q3_what_not_do_audio: answersMap.get(3)?.audioData || null,
        q4_benefits: answersMap.get(4)?.text || null,
        q4_benefits_audio: answersMap.get(4)?.audioData || null,
        q5_ideal_client: answersMap.get(5)?.text || null,
        q5_ideal_client_audio: answersMap.get(5)?.audioData || null,
        q6_ticket_value: answersMap.get(6)?.text || null,
        q6_ticket_value_audio: answersMap.get(6)?.audioData || null,
        q7_daily_goal: answersMap.get(7)?.text || null,
        q7_daily_goal_audio: answersMap.get(7)?.audioData || null,
        status: 'pending' as const,
      };

      // Inserir no Supabase
      const { data: inserted, error: insertError } = await supabase
        .from('onboarding_sessions')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      // TODO: Disparar webhook n8n para processar com IA
      // await processWithIA(inserted.id, payload);

      return {
        success: true,
        sessionId: inserted.id,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao salvar onboarding';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Busca o último onboarding do usuário
   */
  const getLatestOnboarding = useCallback(async (userId?: string) => {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        return null;
      }

      const { data, error } = await supabase
        .from('vw_latest_onboarding')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Nenhum onboarding encontrado
        }
        throw error;
      }

      return data as OnboardingSession;
    } catch (err: any) {
      console.error('Erro ao buscar onboarding:', err);
      return null;
    }
  }, []);

  return {
    saveOnboarding,
    getLatestOnboarding,
    isSaving,
    error,
  };
}

// ============ HELPER: Transcrição de áudio com Gemini ============

/**
 * Transcreve áudio base64 usando Google Gemini
 * NOTA: Requer VITE_GEMINI_API_KEY configurada
 */
export async function transcribeAudio(audioBase64: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  try {
    // Converter base64 para blob
    const byteCharacters = atob(audioBase64.split(',')[1] || audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/webm' });

    // Usar a API do Gemini para transcrição
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              inline_data: {
                mime_type: 'audio/webm',
                data: audioBase64.split(',')[1] || audioBase64,
              }
            }, {
              text: 'Transcreva exatamente o que foi falado neste áudio. Retorne apenas a transcrição, sem adicionar comentários.'
            }]
          }]
        }),
      }
    );

    const result = await response.json();
    const transcript = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return transcript.trim();
  } catch (err) {
    console.error('Erro na transcrição:', err);
    throw err;
  }
}

// ============ HELPER: Processamento com IA ============

/**
 * Envia dados do onboarding para processamento via n8n webhook
 */
export async function processWithIA(sessionId: string, data: any): Promise<void> {
  const webhookUrl = import.meta.env.VITE_N8N_ONBOARDING_WEBHOOK;

  if (!webhookUrl) {
    console.warn('N8N_ONBOARDING_WEBHOOK não configurado, pulando processamento IA');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Erro ao enviar para n8n:', err);
    throw err;
  }
}
