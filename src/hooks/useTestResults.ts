import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgentTestRun } from '../../types';

export const useTestResults = () => {
  const [results, setResults] = useState<AgentTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar buscar da tabela test_results (estrutura do dashboard 3000)
      const { data, error: fetchError } = await supabase
        .from('test_results')
        .select(`
          *,
          agent_versions (
            agent_name,
            version
          )
        `)
        .order('tested_at', { ascending: false })
        .limit(20);

      if (fetchError) {
        // Se a tabela não existir, tentar a tabela antiga
        if (fetchError.code === '42P01') {
          const { data: oldData, error: oldError } = await supabase
            .from('agenttest_runs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (oldError) {
            console.warn('Nenhuma tabela de testes encontrada. Usando mock data.');
            setResults(getMockResults());
            return;
          }

          if (oldData && oldData.length > 0) {
            // Mapear formato antigo
            const mapped = oldData.map((r: any) => ({
              ...r,
              run_at: r.created_at,
              total_tests: (r.passed_tests || 0) + (r.failed_tests || 0),
            }));
            setResults(mapped);
            return;
          }
        }

        console.warn('Erro ao buscar resultados:', fetchError);
        setResults(getMockResults());
        return;
      }

      if (data && data.length > 0) {
        // Mapear para o formato esperado pelo Dashboard e Validation
        const mappedResults: AgentTestRun[] = data.map((result: any) => {
          const passed = result.overall_score >= 8 ? 1 : 0;
          const failed = result.overall_score < 8 ? 1 : 0;

          return {
            id: result.id,
            agent_version_id: result.agent_versions?.version || result.agent_version_id?.slice(0, 8) || 'v1.0',
            status: 'completed',
            score_overall: result.overall_score || 0,
            score_dimensions: {
              tone: result.tone || 0,
              engagement: result.engagement || 0,
              compliance: result.compliance || 0,
              accuracy: result.completeness || 0,
              empathy: 0,
              efficiency: result.conversion || 0
            },
            passed_tests: passed,
            failed_tests: failed,
            total_tests: passed + failed,
            created_at: result.tested_at || result.created_at,
            run_at: result.tested_at || result.created_at,
            html_report_url: result.html_report_url,
            agent_name: result.agent_versions?.agent_name,
            agent_version: result.agent_versions?.version,
            strengths: result.strengths || [],
            weaknesses: result.weaknesses || [],
            summary: result.strengths?.length > 0
              ? `Pontos fortes: ${result.strengths.slice(0, 2).join(', ')}`
              : `Score: ${(result.overall_score || 0).toFixed(1)}/10`
          };
        });

        setResults(mappedResults);
      } else {
        setResults(getMockResults());
      }
    } catch (err: any) {
      console.error('Error fetching test results:', err);
      setError(err.message);
      setResults(getMockResults());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { testRuns: results, loading, error, refetch: fetchResults };
};

// Mock data para visualização quando não há dados reais
function getMockResults(): AgentTestRun[] {
  return [
    {
      id: 'mock-1',
      agent_version_id: 'v2.1',
      status: 'completed',
      score_overall: 8.5,
      score_dimensions: { tone: 9, engagement: 8, compliance: 9, accuracy: 8, empathy: 8, efficiency: 9 },
      passed_tests: 12,
      failed_tests: 1,
      total_tests: 13,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      run_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      summary: 'Excelente performance em tom e engajamento'
    },
    {
      id: 'mock-2',
      agent_version_id: 'v2.0',
      status: 'completed',
      score_overall: 7.2,
      score_dimensions: { tone: 7, engagement: 7, compliance: 8, accuracy: 7, empathy: 7, efficiency: 7 },
      passed_tests: 10,
      failed_tests: 3,
      total_tests: 13,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      run_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      summary: 'Precisa melhorar engajamento'
    },
    {
      id: 'mock-3',
      agent_version_id: 'v2.1',
      status: 'completed',
      score_overall: 9.1,
      score_dimensions: { tone: 9, engagement: 9, compliance: 10, accuracy: 9, empathy: 9, efficiency: 9 },
      passed_tests: 13,
      failed_tests: 0,
      total_tests: 13,
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      run_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      summary: 'Todos os testes passaram'
    }
  ];
}
