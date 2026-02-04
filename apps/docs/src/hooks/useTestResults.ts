import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgentTestRun } from '../types';

// Interface para test_result individual
interface TestResultItem {
  name: string;
  input: string;
  score: number;
  passed: boolean;
  feedback: string;
  simulated_response: string;
}

// Interface para o validation_result JSONB (suporta múltiplos formatos)
interface ValidationResult {
  // Formato novo (pipeline com --db)
  totals?: {
    total_tokens: number;
    total_time_ms: number;
  };
  validator?: {
    score: number;
    status: string;
    tokens?: number;
    time_ms?: number;
    test_results?: TestResultItem[];
  };
  debate?: {
    score: number;
    verdict: string;
    criticism?: string;
    defense?: string;
  };
  // Formato antigo 1 (sales_analysis)
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
  // Formato antigo 2 (direto na raiz)
  test_results?: TestResultItem[];
  overall_score?: number;
  scores?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  // Formato antigo 3 (pipeline sem --db)
  e2e_results?: Array<{
    scenario_name?: string;
    name?: string;
    status?: string;
    score?: number;
    total_turns?: number;
    conversation?: Array<{ role: string; content: string }>;
  }>;
  debate_score?: number;
  debate_verdict?: string;
  improvement_summary?: string;
  e2e_pass_rate?: number;
}

export const useTestResults = () => {
  const [results, setResults] = useState<AgentTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allResults: AgentTestRun[] = [];

      // 1. Buscar TODOS os agent_versions (com ou sem validação)
      const { data: agentVersions, error: avError } = await supabase
        .from('agent_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!avError && agentVersions && agentVersions.length > 0) {
        const mappedFromAV = agentVersions.map((av: any) => {
          const vr: ValidationResult = av.validation_result || {};
          const hasValidation = av.validation_result !== null;

          // Extrair test_results de QUALQUER formato:
          // 1. Novo formato: vr.validator.test_results
          // 2. Formato antigo 2: vr.test_results (direto na raiz)
          // 3. Formato antigo 3: vr.e2e_results (converter para test_results)
          // 4. Formato validação cenários: vr.resultados (com aprovado/nota)
          // 5. Formato validacoes: vr.validacoes (com atende_expectativa)
          let testResults: TestResultItem[] = [];

          if (vr.validator?.test_results && vr.validator.test_results.length > 0) {
            // Formato novo (pipeline com --db após correção)
            testResults = vr.validator.test_results;
          } else if (vr.test_results && vr.test_results.length > 0) {
            // Formato antigo 2 (direto na raiz)
            testResults = vr.test_results;
          } else if ((vr as any).resultados && (vr as any).resultados.length > 0) {
            // Formato validação de cenários (Julia Amare, Isabella, etc.)
            testResults = (vr as any).resultados.map((r: any) => ({
              name: r.cenario_nome || r.nome || 'Cenário',
              input: r.mensagem_teste || r.mensagem || '',
              score: r.nota || 0,
              passed: r.aprovado === true,
              feedback: r.justificativa || '',
              simulated_response: r.resposta_simulada || r.resposta || ''
            }));
          } else if ((vr as any).validacoes && (vr as any).validacoes.length > 0) {
            // Formato validações (Isabella SDR)
            testResults = (vr as any).validacoes.map((v: any) => ({
              name: v.nome || v.id || 'Validação',
              input: v.mensagem || '',
              score: v.nota || 0,
              passed: v.atende_expectativa === true,
              feedback: '',
              simulated_response: v.resposta || ''
            }));
          } else if (vr.e2e_results && vr.e2e_results.length > 0) {
            // Formato antigo 3 (pipeline sem --db) - converter e2e_results
            testResults = vr.e2e_results.map((e2e) => {
              const conversation = e2e.conversation || [];
              const leadMsgs = conversation.filter(m => m.role === 'user' || m.role === 'lead');
              const agentMsgs = conversation.filter(m => m.role === 'assistant');
              const score = e2e.score || 0;

              return {
                name: e2e.scenario_name || e2e.name || 'Cenário E2E',
                input: leadMsgs[0]?.content || 'Lead iniciou conversa',
                score: score,
                passed: e2e.status === 'passed' || score >= 7,
                feedback: `Cenário: ${e2e.scenario_name || e2e.name} | Status: ${e2e.status || 'unknown'} | Turnos: ${e2e.total_turns || 0}`,
                simulated_response: agentMsgs[agentMsgs.length - 1]?.content || 'Resposta do agente'
              };
            });
          }

          const passedTests = testResults.filter(t => t.passed).length;
          const failedTests = testResults.filter(t => !t.passed).length;

          // Extrair nome do cliente do business_config ou location_id
          const businessConfig = av.business_config || {};
          const clientName = businessConfig.company_name || av.location_id || '-';

          // Extrair score de qualquer formato
          // Suporta: vr.validator.score, vr.overall_score, vr.metricas_globais.nota_media_geral
          const metricas = (vr as any).metricas_globais || {};
          const scoreOverall = vr.validator?.score
            || vr.overall_score
            || metricas.nota_media_geral
            || metricas.nota_media_ponderada
            || av.validation_score
            || 0;

          // Extrair tokens/time de qualquer formato
          const totalTokens = vr.totals?.total_tokens || (vr as any).total_tokens || 0;
          const executionTimeMs = vr.totals?.total_time_ms || ((vr as any).duration_seconds ? (vr as any).duration_seconds * 1000 : 0);

          // Calcular score_dimensions de testResults se não houver scores explícitos
          const avgTestScore = testResults.length > 0
            ? testResults.reduce((sum, t) => sum + (t.score || 0), 0) / testResults.length
            : 0;
          const passRate = testResults.length > 0
            ? (passedTests / testResults.length) * 10
            : 0;

          // Extrair dimensions de scores ou derivar de resultados
          const derivedDimensions = {
            tone: vr.scores?.tone || vr.scores?.completeness || Math.min(10, avgTestScore * 1.05),
            engagement: vr.scores?.engagement || Math.min(10, passRate),
            compliance: vr.scores?.compliance || Math.min(10, avgTestScore),
            accuracy: vr.scores?.accuracy || Math.min(10, avgTestScore * 0.95),
            empathy: vr.scores?.empathy || Math.min(10, avgTestScore * 0.9),
            efficiency: vr.scores?.efficiency || vr.scores?.conversion || Math.min(10, passedTests > 0 ? 8 : 4)
          };

          return {
            id: av.id,
            agent_version_id: av.version || 'v1.0',
            status: hasValidation ? 'completed' as const : 'pending' as const,
            score_overall: scoreOverall,
            score_dimensions: derivedDimensions,
            passed_tests: passedTests || (av.validation_status === 'approved' ? 1 : 0),
            failed_tests: failedTests || (av.validation_status === 'rejected' ? 1 : 0),
            total_tests: testResults.length || (hasValidation ? 1 : 0),
            created_at: av.validated_at || av.created_at,
            run_at: av.validated_at || av.created_at,
            has_validation: hasValidation,
            execution_time_ms: executionTimeMs,
            agent_name: av.agent_name,
            agent_version: av.version,
            // Campos extras para exibição rica
            lead_classification: vr.sales_analysis?.classification,
            sales_score: vr.sales_analysis?.score,
            total_tokens: totalTokens,
            test_details: testResults,
            validation_status: av.validation_status,
            location_id: av.location_id,
            client_name: clientName,
            // Status e ativação
            is_active: av.is_active === true,
            agent_status: av.status || 'unknown',
            // Campos para o modal de prompt e raciocínio
            system_prompt: av.system_prompt,
            business_config: av.business_config,
            // Dados do debate (quando E2E não rodou)
            debate: vr.debate || (vr.debate_score !== undefined ? {
              score: vr.debate_score,
              verdict: vr.debate_verdict || '',
              improvement_summary: vr.improvement_summary || ''
            } : undefined),
            summary: vr.sales_analysis?.classification
              ? `Lead ${vr.sales_analysis.classification} (${vr.sales_analysis.score}/100) | Score: ${scoreOverall.toFixed(1)}/10`
              : (vr.debate_score !== undefined
                ? `Debate: ${vr.debate_score}/100 | ${vr.e2e_pass_rate !== undefined ? `E2E: ${vr.e2e_pass_rate}%` : 'Sem E2E'}`
                : `Score: ${scoreOverall.toFixed(1)}/10`)
          } as AgentTestRun & {
            lead_classification?: string;
            sales_score?: number;
            total_tokens?: number;
            test_details?: any[];
            validation_status?: string;
            location_id?: string;
            client_name?: string;
            is_active?: boolean;
            agent_status?: string;
            has_validation?: boolean;
            system_prompt?: string;
            business_config?: Record<string, any>;
            debate?: {
              score: number;
              verdict: string;
              criticism?: string;
              defense?: string;
              improvement_summary?: string;
            };
          };
        });

        allResults.push(...mappedFromAV);
      }

      // 2. Buscar de e2e_test_results (nova estrutura com cenários)
      const { data: e2eResults, error: e2eError } = await supabase
        .from('e2e_test_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!e2eError && e2eResults && e2eResults.length > 0) {
        // Buscar info dos agentes
        const agentIds = [...new Set(e2eResults.map(r => r.agent_version_id))];
        const { data: agentsData } = await supabase
          .from('agent_versions')
          .select('id, agent_name, version')
          .in('id', agentIds);

        const agentMap = new Map(agentsData?.map(a => [a.id, a]) || []);

        // Agrupar por agente + janela de 5 minutos
        const executionGroups = new Map<string, any[]>();

        for (const result of e2eResults) {
          const timestamp = new Date(result.created_at);
          const windowStart = new Date(Math.floor(timestamp.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
          const key = `${result.agent_version_id}_${windowStart.toISOString()}`;

          if (!executionGroups.has(key)) {
            executionGroups.set(key, []);
          }
          executionGroups.get(key)!.push(result);
        }

        // Converter grupos em AgentTestRun
        for (const [key, scenarios] of executionGroups) {
          const agentId = scenarios[0].agent_version_id;
          const agent = agentMap.get(agentId);
          const passedScenarios = scenarios.filter(s => s.status === 'passed').length;
          const failedScenarios = scenarios.filter(s => s.status !== 'passed').length;
          const scores = scenarios.filter(s => s.score !== null && s.score !== undefined).map(s => s.score);
          const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

          // Calcular dimensões aproximadas baseado nos scores dos cenários E2E
          // Usamos a distribuição dos scores para criar uma visualização útil
          const highScores = scores.filter(s => s >= 8).length;
          const medScores = scores.filter(s => s >= 6 && s < 8).length;
          const lowScores = scores.filter(s => s < 6).length;
          const totalScenarios = scenarios.length || 1;

          // Dimensões derivadas do desempenho E2E
          const derivedDimensions = {
            tone: Math.min(10, avgScore * 1.1), // Tom geralmente correlaciona com score
            engagement: Math.min(10, (passedScenarios / totalScenarios) * 10), // Taxa de sucesso = engajamento
            compliance: Math.min(10, avgScore), // Compliance = score médio
            accuracy: Math.min(10, (highScores / totalScenarios) * 10), // % de scores altos
            empathy: Math.min(10, avgScore * 0.9), // Empathy aproximado
            efficiency: Math.min(10, passedScenarios > 0 ? 8 : 4) // Passou algum = eficiente
          };

          allResults.push({
            id: key,
            agent_version_id: agent?.version || 'v4.0',
            status: 'completed' as const,
            score_overall: avgScore,
            score_dimensions: derivedDimensions,
            passed_tests: passedScenarios,
            failed_tests: failedScenarios,
            total_tests: scenarios.length,
            created_at: scenarios[0].created_at,
            run_at: scenarios[0].created_at,
            agent_name: agent?.agent_name || 'Unknown Agent',
            agent_version: agent?.version,
            summary: `E2E: ${passedScenarios}/${scenarios.length} cenários | Score: ${avgScore.toFixed(1)}/10`,
            // Incluir cenários para expansão futura
            e2e_scenarios: scenarios.map(s => ({
              id: s.id,
              scenario_name: s.scenario_name,
              status: s.status,
              score: s.score,
              lead_persona: s.lead_persona,
              total_turns: s.total_turns,
              duration_seconds: s.duration_seconds,
              conversation: s.conversation || []
            }))
          } as AgentTestRun & { e2e_scenarios?: any[] });
        }
      }

      // 3. Buscar de test_results (estrutura anterior) - pode não existir mais
      let testResultsData: any[] | null = null;
      let trError: any = null;

      try {
        const joinResult = await supabase
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

        // Verificar se tabela existe (código 42P01 = tabela não existe)
        if (joinResult.error?.code === '42P01' || joinResult.error?.message?.includes('does not exist')) {
          console.info('Tabela test_results não existe, pulando...');
          testResultsData = null;
          trError = null; // Não é erro, tabela simplesmente não existe
        } else if (joinResult.error?.code === 'PGRST200' || joinResult.error?.message?.includes('400') || joinResult.error?.message?.includes('relationship')) {
          // Fallback: buscar sem JOIN quando FK não existe
          console.warn('test_results JOIN failed, trying without join:', joinResult.error?.message);
          const fallbackResult = await supabase
            .from('test_results')
            .select('*')
            .order('tested_at', { ascending: false })
            .limit(20);

          // Verificar novamente se tabela existe
          if (fallbackResult.error?.code === '42P01' || fallbackResult.error?.message?.includes('does not exist')) {
            testResultsData = null;
            trError = null;
          } else {
            testResultsData = fallbackResult.data;
            trError = fallbackResult.error;
          }
        } else {
          testResultsData = joinResult.data;
          trError = joinResult.error;
        }
      } catch (e) {
        console.info('test_results query failed, continuing without it');
        testResultsData = null;
        trError = null;
      }

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

      // 4. Se não encontrou nada, tentar tabela legacy
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

      // 5. Se ainda não tem nada, usar mock
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

  const deleteTestRun = useCallback(async (id: string, source?: string): Promise<boolean> => {
    try {
      setDeleting(id);

      // Verificar se é um registro E2E (id composto com underscore e ISO date)
      const isE2ERecord = id.includes('_') && id.includes('T') && id.includes('Z');

      if (isE2ERecord) {
        // Para E2E, extrair agent_version_id e deletar todos os cenários desse grupo
        const [agentVersionId, timestamp] = id.split('_');
        const windowStart = new Date(timestamp);
        const windowEnd = new Date(windowStart.getTime() + 5 * 60 * 1000);

        // Buscar IDs dos cenários nessa janela
        const { data: scenariosToDelete } = await supabase
          .from('e2e_test_results')
          .select('id')
          .eq('agent_version_id', agentVersionId)
          .gte('created_at', windowStart.toISOString())
          .lt('created_at', windowEnd.toISOString());

        if (scenariosToDelete && scenariosToDelete.length > 0) {
          const scenarioIds = scenariosToDelete.map(s => s.id);
          const { error: e2eError } = await supabase
            .from('e2e_test_results')
            .delete()
            .in('id', scenarioIds);

          if (e2eError) {
            console.error('Error deleting e2e results:', e2eError);
            return false;
          }
        }
      } else {
        // Tentar deletar de agent_versions primeiro (fonte principal)
        const { error: avError } = await supabase
          .from('agent_versions')
          .delete()
          .eq('id', id);

        if (avError) {
          // Se não encontrou em agent_versions, tentar test_results
          const { error: trError } = await supabase
            .from('test_results')
            .delete()
            .eq('id', id);

          if (trError) {
            console.error('Error deleting test result:', trError);
            return false;
          }
        }
      }

      // Remover do estado local imediatamente
      setResults(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting:', err);
      return false;
    } finally {
      setDeleting(null);
    }
  }, []);

  // Função para ativar/desativar uma versão
  const toggleVersionActive = useCallback(async (id: string, activate: boolean): Promise<boolean> => {
    try {
      const targetRun = results.find(r => r.id === id);
      const targetLocationId = (targetRun as any)?.location_id;

      // Se ativando, primeiro desativar todas outras versões do mesmo location_id
      if (activate && targetLocationId) {
        // Desativar outras versões do mesmo location
        await supabase
          .from('agent_versions')
          .update({ is_active: false, status: 'superseded' })
          .eq('location_id', targetLocationId)
          .neq('id', id);
      }

      // Atualizar a versão específica
      const { error } = await supabase
        .from('agent_versions')
        .update({
          is_active: activate,
          status: activate ? 'active' : 'inactive',
          activated_at: activate ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) {
        console.error('Error toggling version:', error);
        return false;
      }

      // Atualizar estado local
      setResults(prev => prev.map(r =>
        r.id === id
          ? { ...r, is_active: activate, agent_status: activate ? 'active' : 'inactive' }
          : targetLocationId && (r as any).location_id === targetLocationId
            ? { ...r, is_active: false, agent_status: 'superseded' }
            : r
      ));

      return true;
    } catch (err) {
      console.error('Error toggling version:', err);
      return false;
    }
  }, [results]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { testRuns: results, loading, error, refetch: fetchResults, deleteTestRun, deleting, toggleVersionActive };
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
