export interface SplitConfig {
  enabled: boolean;
  max_chars: number;
  delay_ms: number;
}

export interface SplitPart {
  text: string;
  delayMs: number;
}

export function useSplitMessages() {
  const splitMessage = (text: string, config: SplitConfig): SplitPart[] => {
    if (!config.enabled || text.length <= config.max_chars) {
      return [{ text, delayMs: 0 }];
    }

    // Split by sentence endings
    const sentenceRegex = /(?<=[.!?])\s+/;
    const sentences = text.split(sentenceRegex).filter(s => s.trim().length > 0);

    const parts: SplitPart[] = [];
    let current = '';

    for (const sentence of sentences) {
      const candidate = current ? `${current} ${sentence}` : sentence;

      if (candidate.length <= config.max_chars) {
        current = candidate;
      } else {
        if (current) {
          parts.push({ text: current.trim(), delayMs: config.delay_ms });
        }
        // If single sentence exceeds max_chars, split by comma or just push it
        if (sentence.length > config.max_chars) {
          const subParts = sentence.split(/,\s+/);
          let subCurrent = '';
          for (const sub of subParts) {
            const subCandidate = subCurrent ? `${subCurrent}, ${sub}` : sub;
            if (subCandidate.length <= config.max_chars) {
              subCurrent = subCandidate;
            } else {
              if (subCurrent) parts.push({ text: subCurrent.trim(), delayMs: config.delay_ms });
              subCurrent = sub;
            }
          }
          current = subCurrent;
        } else {
          current = sentence;
        }
      }
    }

    if (current) {
      parts.push({ text: current.trim(), delayMs: config.delay_ms });
    }

    if (parts.length === 0) return [{ text, delayMs: 0 }];

    // First part has no delay
    parts[0].delayMs = 0;

    return parts;
  };

  return { splitMessage };
}
