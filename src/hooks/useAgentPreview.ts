import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getErrorMessage } from "../lib/getErrorMessage";

export interface AgentV2 {
  id: string;
  agent_name: string;
  version: string;
  location_id: string;
  service_type: string;
  is_active: boolean;
  status: string;
  is_template: boolean;
  parent_template_id: string | null;
}

export interface AgentSkill {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category:
    | "qualification"
    | "compliance"
    | "personality"
    | "mode"
    | "tool"
    | "business";
  priority: number;
  prompt_fragment: string | null;
  tools_config: Record<string, unknown> | null;
  is_active: boolean;
}

export interface AgentSkillJunction {
  id: string;
  skill_id: string;
  is_enabled: boolean;
  priority: number;
  config_overrides: Record<string, unknown> | null;
}

export interface ResolvedAgent {
  id: string;
  agent_name: string;
  version: string;
  system_prompt: string;
  tools_config: Record<string, unknown>;
  personality_config: Record<string, unknown>;
  business_config: Record<string, unknown>;
  qualification_config: Record<string, unknown>;
  compliance_rules: Record<string, unknown>;
  prompts_by_mode: Record<string, unknown>;
  _resolved: {
    skills_applied: string[];
    has_parent_template: boolean;
    resolved_at: string;
  };
}

interface UseAgentPreviewReturn {
  agents: AgentV2[];
  skills: AgentSkill[];
  junctions: AgentSkillJunction[];
  resolved: ResolvedAgent | null;
  selectedAgentId: string | null;
  selectedMode: string | null;
  availableModes: string[];
  loading: boolean;
  resolving: boolean;
  error: string | null;
  selectAgent: (id: string) => void;
  selectMode: (mode: string) => void;
  toggleSkill: (skillId: string, enabled: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAgentPreview = (): UseAgentPreviewReturn => {
  const [agents, setAgents] = useState<AgentV2[]>([]);
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [junctions, setJunctions] = useState<AgentSkillJunction[]>([]);
  const [resolved, setResolved] = useState<ResolvedAgent | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const fetchInitialData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      setLoading(true);
      const [agentsRes, skillsRes] = await Promise.all([
        supabase
          .from("agent_versions_v2")
          .select(
            "id, agent_name, version, location_id, service_type, is_active, status, is_template, parent_template_id",
          )
          .eq("is_template", false)
          .eq("is_active", true)
          .order("agent_name"),
        supabase
          .from("agent_skills")
          .select(
            "id, name, display_name, description, category, priority, prompt_fragment, tools_config, is_active",
          )
          .eq("is_active", true)
          .order("priority"),
      ]);

      if (agentsRes.error) throw agentsRes.error;
      if (skillsRes.error) throw skillsRes.error;

      setAgents((agentsRes.data as AgentV2[]) || []);
      setSkills((skillsRes.data as AgentSkill[]) || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAgent = useCallback(
    async (agentId: string, resetMode = false) => {
      if (!isSupabaseConfigured()) return;
      try {
        setResolving(true);
        setError(null);

        const [resolvedRes, junctionsRes] = await Promise.all([
          supabase.rpc("resolve_agent_v2", { p_agent_id: agentId }),
          supabase
            .from("agent_version_skills")
            .select("id, skill_id, is_enabled, priority, config_overrides")
            .eq("agent_version_id", agentId)
            .order("priority"),
        ]);

        if (resolvedRes.error) throw resolvedRes.error;
        if (junctionsRes.error) throw junctionsRes.error;

        const data = resolvedRes.data as ResolvedAgent;
        setResolved(data);
        setJunctions((junctionsRes.data as AgentSkillJunction[]) || []);

        // Auto-select first mode when switching agents
        if (resetMode && data?.prompts_by_mode) {
          const modes = Object.keys(data.prompts_by_mode).filter(
            (k) => k !== "_base" && k !== "_objecoes",
          );
          if (modes.length > 0) {
            setSelectedMode(modes[0]);
          }
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setResolving(false);
      }
    },
    [],
  );

  const selectAgent = useCallback(
    (id: string) => {
      setSelectedAgentId(id);
      setSelectedMode(null);
      setResolved(null);
      resolveAgent(id, true);
    },
    [resolveAgent],
  );

  const selectMode = useCallback((mode: string) => {
    setSelectedMode(mode);
  }, []);

  const toggleSkill = useCallback(
    async (skillId: string, enabled: boolean) => {
      if (!selectedAgentId) return;
      try {
        const { error: updateError } = await supabase
          .from("agent_version_skills")
          .update({ is_enabled: enabled })
          .eq("agent_version_id", selectedAgentId)
          .eq("skill_id", skillId);

        if (updateError) throw updateError;

        // Re-resolve to see updated prompt
        await resolveAgent(selectedAgentId);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    },
    [selectedAgentId, resolveAgent],
  );

  const availableModes = resolved?.prompts_by_mode
    ? Object.keys(resolved.prompts_by_mode).filter(
        (k) => k !== "_base" && k !== "_objecoes",
      )
    : [];

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      fetchInitialData();
    }
  }, [fetchInitialData]);

  return {
    agents,
    skills,
    junctions,
    resolved,
    selectedAgentId,
    selectedMode,
    availableModes,
    loading,
    resolving,
    error,
    selectAgent,
    selectMode,
    toggleSkill,
    refetch: fetchInitialData,
  };
};
