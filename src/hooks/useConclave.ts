import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ConclaveAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  system_prompt: string;
  entity_id: string;
  is_active: boolean;
}

interface IndividualResponse {
  agent_id: string;
  agent_name: string;
  response: string;
  reasoning: string;
  confidence: number;
  dissent_points: string[];
}

interface ConclaveSession {
  id: string;
  question: string;
  context: string | null;
  council_config: {
    agents: { agent_id: string; role: string; weight: number }[];
  };
  status: "deliberating" | "completed" | "cancelled";
  synthesis: string | null;
  individual_responses: IndividualResponse[] | null;
  total_tokens: number | null;
  total_cost: number | null;
  duration_ms: number | null;
  created_at: string;
}

export function useConclave() {
  const [sessions, setSessions] = useState<ConclaveSession[]>([]);
  const [availableAgents, setAvailableAgents] = useState<ConclaveAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliberating, setDeliberating] = useState(false);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("conclave_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSessions(data as ConclaveSession[]);
    setLoading(false);
  }, []);

  const fetchAgents = useCallback(async () => {
    const { data } = await supabase
      .from("auto_agents")
      .select("*")
      .eq("is_active", true)
      .order("agent_name");
    if (data) setAvailableAgents(data as ConclaveAgent[]);
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchAgents();
  }, [fetchSessions, fetchAgents]);

  const createSession = useCallback(
    async (
      question: string,
      context: string | null,
      agentIds: string[],
    ): Promise<ConclaveSession | null> => {
      setDeliberating(true);
      const startTime = Date.now();

      try {
        const selectedAgents = availableAgents.filter((a) =>
          agentIds.includes(a.id),
        );
        const councilConfig = {
          agents: selectedAgents.map((a) => ({
            agent_id: a.id,
            role: a.agent_name,
            weight: 1,
          })),
        };

        // Create session in deliberating status
        const { data: session, error } = await supabase
          .from("conclave_sessions")
          .insert({
            question,
            context,
            council_config: councilConfig,
            status: "deliberating",
            individual_responses: [],
          })
          .select()
          .single();

        if (error || !session) {
          console.error("Erro ao criar sessão:", error);
          return null;
        }

        // Note: actual LLM deliberation would be handled server-side
        // This creates the session for tracking; the scripts handle the AI calls
        await fetchSessions();
        return session as ConclaveSession;
      } finally {
        setDeliberating(false);
      }
    },
    [availableAgents, fetchSessions],
  );

  const cancelSession = useCallback(
    async (sessionId: string) => {
      await supabase
        .from("conclave_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);
      await fetchSessions();
    },
    [fetchSessions],
  );

  return {
    sessions,
    availableAgents,
    loading,
    deliberating,
    createSession,
    cancelSession,
    fetchSessions,
    fetchAgents,
  };
}
