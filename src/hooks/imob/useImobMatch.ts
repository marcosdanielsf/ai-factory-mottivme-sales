import { useCallback } from 'react';
import { Imovel } from './useImobImoveis';
import { ImobLeadPerfil } from './useImobLeads';

export interface ImovelMatch {
  imovel: Imovel;
  score: number;
  highlights: string[];
}

export const useImobMatch = (imoveis: Imovel[]) => {
  const matchImoveis = useCallback((leadPerfil: ImobLeadPerfil): ImovelMatch[] => {
    const disponiveis = imoveis.filter(i => i.status === 'disponivel');

    const scored = disponiveis.map(imovel => {
      let score = 0;
      const highlights: string[] = [];

      // Tipo de interesse (30 pts)
      if (leadPerfil.tipo_interesse && imovel.tipo === leadPerfil.tipo_interesse) {
        score += 30;
        highlights.push(`Tipo ${imovel.tipo} conforme interesse`);
      }

      // Bairro de interesse (25 pts)
      if (leadPerfil.bairros_interesse && leadPerfil.bairros_interesse.length > 0 && imovel.bairro) {
        const match = leadPerfil.bairros_interesse.some(b =>
          imovel.bairro?.toLowerCase().includes(b.toLowerCase())
        );
        if (match) {
          score += 25;
          highlights.push(`Bairro ${imovel.bairro} na lista de interesse`);
        }
      }

      // Faixa de valor (25 pts)
      const valor = imovel.valor_venda || imovel.valor_aluguel || 0;
      if (valor > 0) {
        const min = leadPerfil.faixa_valor_min ?? 0;
        const max = leadPerfil.faixa_valor_max ?? Infinity;
        if (valor >= min && valor <= max) {
          score += 25;
          highlights.push('Valor dentro da faixa desejada');
        } else if (valor < min * 1.1 || valor > max * 0.9) {
          score += 10;
          highlights.push('Valor próximo da faixa desejada');
        }
      }

      // Quartos mínimos (20 pts)
      if (leadPerfil.quartos_min && imovel.quartos) {
        if (imovel.quartos >= leadPerfil.quartos_min) {
          score += 20;
          highlights.push(`${imovel.quartos} quartos (mín. ${leadPerfil.quartos_min})`);
        }
      }

      return { imovel, score, highlights };
    });

    return scored
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(m => ({ ...m, score: Math.min(100, m.score) }));
  }, [imoveis]);

  return { matchImoveis };
};
