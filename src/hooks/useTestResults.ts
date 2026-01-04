import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgentTestRun } from '../../types';

// Interface para o validation_result JSONB
interface ValidationResult {
  totals?: {
    total_tokens: number;
    total_time_ms: number;
  };
  sales_analysis?: {
    score: number;
    classification: string;
    bant?: Record<string, any>;
    tokens: number;
    time_ms: number;
  };
  prompt_generator?: {
    prompt_size: number;
    tokens: number;
    time_ms: number;
  };
  validator?: {
    score: number;
    status: string;
    tokens: number;
    time_ms: number;
    test_results?: Array<{
      name: string;
      input: string;
      score: number;
      passed: boolean;
      feedback: string;
      simulated_response: string;
    }>;
  };
}

export const useTestResults = () => {
  const [results, setResults] = useState<AgentTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allResults: AgentTestRun[] = [];

      // 1. Buscar de agent_versions com validation_result (nova estrutura)
      const { data: agentVersions, error: avError } = await supabase
        .from('agent_versions')
        .select('*')
        .not('validation_result', 'is', null)
        .order('validated_at', { ascending: false })
        .limit(20);

      if (!avError && agentVersions && agentVersions.length > 0) {
        const mappedFromAV = agentVersions.map((av: any) => {
          const vr: ValidationResult = av.validation_result || {};
          const testResults = vr.validator?.test_results || [];
          const passedTests = testResults.filter(t => t.passed).length;
          const failedTests = testResults.filter(t => !t.passed).length;

          // Extrair nome do cliente do business_config ou location_id
          const businessConfig = av.business_config || {};
          const clientName = businessConfig.company_name || av.location_id || '-';

          return {
            id: av.id,
            agent_version_id: av.version || 'v1.0',
            status: 'completed' as const,
            score_overall: vr.validator?.score || av.validation_score || 0,
            score_dimensions: {
              tone: 0,
              engagement: 0,
              compliance: 0,
              accuracy: 0,
              empathy: 0,
              efficiency: 0
            },
            passed_tests: passedTests || (av.validation_status === 'approved' ? 1 : 0),
            failed_tests: failedTests || (av.validation_status === 'rejected' ? 1 : 0),
            total_tests: testResults.length || 1,
            created_at: av.validated_at || av.created_at,
            run_at: av.validated_at || av.created_at,
            execution_time_ms: vr.totals?.total_time_ms,
            agent_name: av.agent_name,
            agent_version: av.version,
            // Campos extras para exibição rica
            lead_classification: vr.sales_analysis?.classification,
            sales_score: vr.sales_analysis?.score,
            total_tokens: vr.totals?.total_tokens,
            test_details: testResults,
            validation_status: av.validation_status,
            location_id: av.location_id,
            client_name: clientName,
            summary: vr.sales_analysis?.classification
              ? `Lead ${vr.sales_analysis.classification} (${vr.sales_analysis.score}/100) | Score: ${(vr.validator?.score || 0).toFixed(1)}/10`
              : `Score: ${(vr.validator?.score || av.validation_score || 0).toFixed(1)}/10`
          } as AgentTestRun & {
            lead_classification?: string;
            sales_score?: number;
            total_tokens?: number;
            test_details?: any[];
            validation_status?: string;
            location_id?: string;
            client_name?: string;
          };
        });

        allResults.push(...mappedFromAV);
      }

      // 2. Buscar de test_results (estrutura anterior)
      const { data: testResultsData, error: trError } = await supabase
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

      if (!trError && testResultsData && testResultsData.length > 0) {
        const mappedFromTR = testResultsData.map((result: any) => {
          const passed = result.overall_score >= 8 ? 1 : 0;
          const failed = result.overall_score < 8 ? 1 : 0;

          return {
            id: result.id,
            agent_version_id: result.agent_versions?.version || result.agent_version_id?.slice(0, 8) || 'v1.0',
            status: 'completed' as const,
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
          } as AgentTestRun;
        });

        allResults.push(...mappedFromTR);
      }

      // 3. Se não encontrou nada, tentar tabela legacy
      if (allResults.length === 0) {
        const { data: oldData, error: oldError } = await supabase
          .from('agenttest_runs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!oldError && oldData && oldData.length > 0) {
          const mapped = oldData.map((r: any) => ({
            ...r,
            run_at: r.created_at,
            total_tests: (r.passed_tests || 0) + (r.failed_tests || 0),
          }));
          allResults.push(...mapped);
        }
      }

      // 4. Se ainda não tem nada, usar mock
      if (allResults.length === 0) {
        console.warn('Nenhum resultado de teste encontrado. Usando mock data.');
        setResults(getMockResults());
        return;
      }

      // Ordenar por data (mais recente primeiro) e remover duplicatas
      const uniqueResults = allResults
        .sort((a, b) => new Date(b.run_at || b.created_at).getTime() - new Date(a.run_at || a.created_at).getTime())
        .filter((item, index, self) =>
          index === self.findIndex(t => t.id === item.id)
        );

      setResults(uniqueResults);

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
