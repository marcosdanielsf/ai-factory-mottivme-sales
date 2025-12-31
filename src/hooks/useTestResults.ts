import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AgentTestRun } from '../../types';

export const useTestResults = () => {
  const [results, setResults] = useState<AgentTestRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from('agenttest_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  return { results, loading };
};
