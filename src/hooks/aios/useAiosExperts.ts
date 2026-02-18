import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AiosExpert } from '../../types/aios';

interface UseAiosExpertsReturn {
  data: AiosExpert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAiosExperts(): UseAiosExpertsReturn {
  const [data, setData] = useState<AiosExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: result, error: fetchError } = await supabase
      .from('aios_experts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (fetchError) {
      setError(fetchError.message);
      // Return mock data so UI renders even without the table
      setData(MOCK_EXPERTS);
    } else {
      setData(result ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  return { data, loading, error, refetch: fetchExperts };
}

// Mock data para desenvolvimento (tabela pode não existir ainda)
const MOCK_EXPERTS: AiosExpert[] = [
  {
    id: 'expert-001',
    name: 'Copywriter Persuasivo',
    avatar_url: null,
    bio: 'Expert em copywriting de alta conversão, especializado em gatilhos mentais, headlines poderosas e calls-to-action irresistíveis.',
    expertise: 'Copywriting & Persuasão',
    squad_id: null,
    frameworks: [
      {
        id: 'fw-001',
        name: 'AIDA Framework',
        description: 'Atenção → Interesse → Desejo → Ação',
        steps: ['Capturar Atenção', 'Gerar Interesse', 'Criar Desejo', 'Chamar para Ação'],
        use_cases: ['Landing pages', 'Emails de vendas', 'Anúncios'],
      },
      {
        id: 'fw-002',
        name: 'PAS Framework',
        description: 'Problema → Agitação → Solução',
        steps: ['Identificar o Problema', 'Agitar a Dor', 'Apresentar a Solução'],
        use_cases: ['Emails frios', 'Posts Instagram', 'VSLs'],
      },
    ],
    swipe_files: [
      {
        id: 'sf-001',
        title: 'Headlines de Alta Conversão',
        content: '7 Segredos que [Profissional] não quer que você saiba...',
        category: 'Headlines',
        tags: ['headline', 'curiosidade', 'segredo'],
      },
    ],
    checklists: [
      {
        id: 'cl-001',
        title: 'Checklist de Copy para Landing Page',
        category: 'Landing Page',
        items: [
          { id: 'item-001', label: 'Headline clara e com benefício', required: true },
          { id: 'item-002', label: 'Prova social acima da dobra', required: true },
          { id: 'item-003', label: 'CTA com verbo de ação', required: true },
          { id: 'item-004', label: 'Urgência ou escassez', required: false },
        ],
      },
    ],
    total_tasks_executed: 142,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expert-002',
    name: 'SDR Master',
    avatar_url: null,
    bio: 'Especialista em prospecção outbound, qualificação BANT e abertura de conversas que convertem.',
    expertise: 'Vendas & Qualificação',
    squad_id: null,
    frameworks: [
      {
        id: 'fw-003',
        name: 'BANT Qualification',
        description: 'Budget → Authority → Need → Timeline',
        steps: ['Validar Budget', 'Identificar Autoridade', 'Confirmar Necessidade', 'Definir Timeline'],
        use_cases: ['Cold call', 'DM Instagram', 'WhatsApp'],
      },
    ],
    swipe_files: [],
    checklists: [
      {
        id: 'cl-002',
        title: 'Checklist de Qualificação SDR',
        category: 'Qualificação',
        items: [
          { id: 'item-005', label: 'Confirmar orçamento disponível', required: true },
          { id: 'item-006', label: 'Identificar tomador de decisão', required: true },
          { id: 'item-007', label: 'Validar dor real', required: true },
          { id: 'item-008', label: 'Definir prazo para decisão', required: false },
        ],
      },
    ],
    total_tasks_executed: 89,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expert-003',
    name: 'Estrategista de Conteúdo',
    avatar_url: null,
    bio: 'Expert em estratégia de conteúdo, distribuição cross-platform e criação de autoridade para CEOs e founders.',
    expertise: 'Content Strategy',
    squad_id: null,
    frameworks: [
      {
        id: 'fw-004',
        name: 'Content Pillar System',
        description: 'Estrutura de conteúdo em pilares temáticos',
        steps: ['Definir 3-5 pilares', 'Criar conteúdo raiz', 'Atomizar em formatos', 'Distribuir e repurpose'],
        use_cases: ['LinkedIn', 'Instagram', 'Newsletter'],
      },
    ],
    swipe_files: [],
    checklists: [],
    total_tasks_executed: 203,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
