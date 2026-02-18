import { useEffect, useState, useCallback } from 'react';
import { AiosContextHealth, AiosContextEntityType } from '../../types/aios';

interface UseAiosContextHealthReturn {
  data: AiosContextHealth[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Mock data — substituir por query Supabase quando tabela existir
const MOCK_HEALTH_DATA: AiosContextHealth[] = [
  {
    id: 'ch-001',
    entity_type: 'agent',
    entity_id: 'agent-001',
    entity_name: 'Diana SDR',
    health_score: 92,
    alerts: [],
    last_updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-002',
    entity_type: 'agent',
    entity_id: 'agent-002',
    entity_name: 'Isabella MOTTIVME',
    health_score: 61,
    alerts: [
      { level: 'warning', message: 'System prompt desatualizado há 7 dias', field: 'system_prompt' },
    ],
    last_updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-003',
    entity_type: 'clone',
    entity_id: 'clone-001',
    entity_name: 'Clone Marcos Social',
    health_score: 78,
    alerts: [
      { level: 'info', message: 'Novos swipe files disponíveis para adicionar', field: 'swipe_files' },
    ],
    last_updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-004',
    entity_type: 'squad',
    entity_id: 'squad-001',
    entity_name: 'Squad Assembly Line',
    health_score: 85,
    alerts: [],
    last_updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-005',
    entity_type: 'project',
    entity_id: 'project-001',
    entity_name: 'AIOS Dashboard SaaS',
    health_score: 44,
    alerts: [
      { level: 'error', message: 'Schema SQL pendente de aplicação', field: 'database' },
      { level: 'warning', message: 'Sem seed data configurado', field: 'data' },
    ],
    last_updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'ch-006',
    entity_type: 'agent',
    entity_id: 'agent-003',
    entity_name: 'Fernanda Lappe',
    health_score: 88,
    alerts: [],
    last_updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

export function useAiosContextHealth(
  filterType?: AiosContextEntityType | 'all'
): UseAiosContextHealthReturn {
  const [data, setData] = useState<AiosContextHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Simular delay de API
    await new Promise((r) => setTimeout(r, 400));

    let result = MOCK_HEALTH_DATA;
    if (filterType && filterType !== 'all') {
      result = result.filter((h) => h.entity_type === filterType);
    }

    setData(result);
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
