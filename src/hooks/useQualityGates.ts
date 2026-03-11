import { useMemo } from 'react';
import type { ContentPiece } from './useContentPieces';

export type QualityGateLevel = 'required' | 'recommended';
export type QualityGateStatus = 'pass' | 'fail' | 'warn';

export interface QualityGate {
  id: string;
  label: string;
  description: string;
  level: QualityGateLevel;
  status: QualityGateStatus;
  detail?: string;
}

export interface QualityGatesResult {
  gates: QualityGate[];
  overallStatus: 'pass' | 'warn' | 'block';
  blockers: number;
  warnings: number;
  passed: number;
  canApprove: boolean;
}

const CHAR_LIMITS: Record<ContentPiece['type'], { min: number; max: number }> = {
  post: { min: 100, max: 500 },
  story: { min: 50, max: 150 },
  reel: { min: 50, max: 300 },
  email: { min: 100, max: 2000 },
  ad: { min: 50, max: 300 },
  carousel: { min: 100, max: 500 },
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countEmojis(text: string): number {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return (text.match(emojiRegex) || []).length;
}

function hasLink(text: string): boolean {
  return /https?:\/\/\S+|www\.\S+/i.test(text);
}

export function useQualityGates(piece: ContentPiece): QualityGatesResult {
  return useMemo(() => {
    const gates: QualityGate[] = [];
    const bodyLen = piece.body.length;
    const hookWords = piece.hook ? countWords(piece.hook) : 0;
    const hashCount = piece.hashtags?.length ?? 0;
    const emojiCount = countEmojis(piece.body + (piece.hook || '') + (piece.cta || ''));
    const limits = CHAR_LIMITS[piece.type] ?? { min: 50, max: 1000 };

    // --- GATE 1: CTA presente (required) ---
    const hasCta = !!(piece.cta && piece.cta.trim().length > 0);
    gates.push({
      id: 'cta_present',
      label: 'CTA presente',
      description: 'Todo conteudo precisa de um call-to-action claro',
      level: 'required',
      status: hasCta ? 'pass' : 'fail',
      detail: hasCta ? piece.cta! : 'Nenhum CTA definido',
    });

    // --- GATE 2: Hook < 15 palavras (required) ---
    if (piece.hook !== null) {
      const hookOk = hookWords > 0 && hookWords <= 15;
      gates.push({
        id: 'hook_length',
        label: 'Hook conciso',
        description: 'Hook deve ter no maximo 15 palavras para impacto maximo',
        level: 'required',
        status: hookOk ? 'pass' : 'fail',
        detail: piece.hook
          ? `${hookWords} palavra${hookWords !== 1 ? 's' : ''} (max 15)`
          : 'Hook vazio',
      });
    }

    // --- GATE 3: Hashtags relevantes 2-10 (recommended) ---
    const hashOk = hashCount >= 2 && hashCount <= 10;
    const hashStatus: QualityGateStatus =
      hashCount === 0 ? 'warn' : hashOk ? 'pass' : 'warn';
    gates.push({
      id: 'hashtags',
      label: 'Hashtags (2-10)',
      description: 'Hashtags aumentam alcance organico. Use entre 2 e 10.',
      level: 'recommended',
      status: hashStatus,
      detail:
        hashCount === 0
          ? 'Nenhuma hashtag adicionada'
          : hashCount > 10
          ? `${hashCount} hashtags — reduza para max 10`
          : `${hashCount} hashtags`,
    });

    // --- GATE 4: Tamanho adequado por tipo (required) ---
    const sizeOk = bodyLen >= limits.min && bodyLen <= limits.max;
    gates.push({
      id: 'content_size',
      label: 'Tamanho adequado',
      description: `${piece.type.toUpperCase()}: ${limits.min}–${limits.max} caracteres`,
      level: 'required',
      status: sizeOk ? 'pass' : 'fail',
      detail: `${bodyLen} caracteres (${limits.min}–${limits.max} esperado)`,
    });

    // --- GATE 5: Emoji moderado max 5 (recommended) ---
    const emojiOk = emojiCount <= 5;
    gates.push({
      id: 'emoji_moderation',
      label: 'Emojis moderados',
      description: 'Mais de 5 emojis pode parecer spam ou pouco profissional',
      level: 'recommended',
      status: emojiOk ? 'pass' : 'warn',
      detail: `${emojiCount} emoji${emojiCount !== 1 ? 's' : ''} (max recomendado: 5)`,
    });

    // --- GATE 6: Link presente se tipo = post (recommended) ---
    if (piece.type === 'post') {
      const linkInBody = hasLink(piece.body);
      const linkInCta = piece.cta ? hasLink(piece.cta) : false;
      const linkOk = linkInBody || linkInCta;
      gates.push({
        id: 'link_present',
        label: 'Link presente',
        description: 'Posts devem incluir link no corpo ou no CTA',
        level: 'recommended',
        status: linkOk ? 'pass' : 'warn',
        detail: linkOk ? 'Link detectado' : 'Nenhum link encontrado',
      });
    }

    const blockers = gates.filter(g => g.level === 'required' && g.status === 'fail').length;
    const warnings = gates.filter(g => g.status === 'warn').length;
    const passed = gates.filter(g => g.status === 'pass').length;

    const overallStatus: QualityGatesResult['overallStatus'] =
      blockers > 0 ? 'block' : warnings > 0 ? 'warn' : 'pass';

    return {
      gates,
      overallStatus,
      blockers,
      warnings,
      passed,
      canApprove: blockers === 0,
    };
  }, [piece]);
}
