"""
Agent Loader - Carrega agentes REAIS do Supabase
================================================
Busca agentes cadastrados e seus prompts por modo.
"""

import os
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from supabase import create_client, Client


@dataclass
class AgentMode:
    """Modo de operação de um agente"""
    name: str
    prompt: str
    few_shots: List[Dict] = field(default_factory=list)


@dataclass
class RealAgent:
    """Agente real carregado do Supabase"""
    id: str
    agent_name: str
    version: str
    location_id: str
    status: str

    # Prompts
    system_prompt: str
    modes: Dict[str, AgentMode]

    # Configs
    business_config: Dict
    personality_config: Dict
    compliance_rules: Dict
    hyperpersonalization: Dict

    # Few-shots globais
    few_shots_global: List[Dict]

    def get_full_prompt(self, mode: str) -> str:
        """
        Retorna o prompt completo para um modo específico.
        Combina: system_prompt (master) + prompt do modo
        """
        if mode not in self.modes:
            return self.system_prompt

        mode_prompt = self.modes[mode].prompt

        return f"""{self.system_prompt}

### MODO ATUAL: {mode.upper()} ###
{mode_prompt}
"""

    def get_available_modes(self) -> List[str]:
        """Lista modos disponíveis"""
        return list(self.modes.keys())


class AgentLoader:
    """
    Carrega agentes reais do Supabase.
    """

    def __init__(
        self,
        supabase_url: str = None,
        supabase_key: str = None
    ):
        self.supabase_url = supabase_url or os.getenv(
            'SUPABASE_URL',
            'https://bfumywvwubvernvhjehk.supabase.co'
        )
        self.supabase_key = supabase_key or os.getenv(
            'SUPABASE_KEY',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE'
        )
        self.client = create_client(self.supabase_url, self.supabase_key)

    def load_agent(
        self,
        agent_name: str = None,
        agent_id: str = None,
        version: str = None,
        allow_draft: bool = True
    ) -> Optional[RealAgent]:
        """
        Carrega um agente do Supabase.

        Args:
            agent_name: Nome do agente (ex: "Julia")
            agent_id: ID específico do agente
            version: Versão específica (ex: "v3.2-sales-optimized")
            allow_draft: Se True, aceita agentes com status 'draft' também

        Returns:
            RealAgent ou None se não encontrar
        """
        query = self.client.table('agent_versions').select('*')

        if agent_id:
            query = query.eq('id', agent_id)
        elif agent_name:
            query = query.eq('agent_name', agent_name)
            if version:
                query = query.eq('version', version)
            elif not allow_draft:
                # Apenas se explicitamente não permitir draft
                query = query.eq('status', 'active')
            # Se allow_draft=True (padrão), pega qualquer status

        query = query.order('created_at', desc=True).limit(1)
        result = query.execute()

        if not result.data:
            return None

        return self._parse_agent(result.data[0])

    def load_agents_by_location(self, location_id: str) -> List[RealAgent]:
        """Carrega todos os agentes ativos de um location"""
        result = self.client.table('agent_versions') \
            .select('*') \
            .eq('location_id', location_id) \
            .eq('status', 'active') \
            .order('created_at', desc=True) \
            .execute()

        agents = []
        for row in result.data:
            agent = self._parse_agent(row)
            if agent:
                agents.append(agent)

        return agents

    def list_available_agents(self, include_draft: bool = True) -> List[Dict]:
        """Lista todos os agentes disponíveis (active e opcionalmente draft)"""
        query = self.client.table('agent_versions') \
            .select('id, agent_name, version, location_id, status, tools_config, prompts_by_mode')

        if include_draft:
            # Pega active, draft e pending_approval
            query = query.in_('status', ['active', 'draft', 'pending_approval'])
        else:
            query = query.eq('status', 'active')

        result = query.order('created_at', desc=True).execute()

        agents = []
        for row in result.data:
            # NOVO: Priorizar prompts_by_mode (formato Isabella v6.6+)
            prompts_by_mode = row.get('prompts_by_mode', {}) or {}
            tools = row.get('tools_config', {}) or {}

            # Modos: primeiro de prompts_by_mode, depois de tools_config
            if prompts_by_mode:
                modos = list(prompts_by_mode.keys())
            else:
                modos = tools.get('modos_identificados', [])

            agents.append({
                'id': row['id'],
                'agent_name': row['agent_name'],
                'version': row['version'],
                'location_id': row['location_id'],
                'modes': modos
            })

        return agents

    def _parse_agent(self, row: Dict) -> Optional[RealAgent]:
        """Parseia um registro do Supabase para RealAgent"""
        try:
            tools_config = row.get('tools_config', {}) or {}
            personality_config = row.get('personality_config', {}) or {}

            # NOVO: Buscar prompts_by_mode diretamente (formato Isabella v6.6+)
            prompts_by_mode = row.get('prompts_by_mode', {}) or {}

            # Buscar prompts_por_modo de tools_config (formato Growth OS)
            prompts_por_modo = tools_config.get('prompts_por_modo', {})

            # Se tem prompts_by_mode direto, usar como fonte principal
            if prompts_by_mode:
                prompts_por_modo = prompts_by_mode

            # Buscar modos de múltiplas fontes (prioridade: prompts_by_mode > tools_config > personality_config)
            modos_identificados = list(prompts_by_mode.keys()) if prompts_by_mode else tools_config.get('modos_identificados', [])

            # Se não tem modos em prompts_by_mode ou tools_config, buscar de personality_config.modos
            personality_modos = personality_config.get('modos', {})
            if not modos_identificados and personality_modos:
                modos_identificados = list(personality_modos.keys())

            few_shots_global = tools_config.get('few_shot_global', [])
            few_shots_por_modo = tools_config.get('few_shots_por_modo', {})

            # Criar modos combinando as duas fontes
            modes = {}
            for modo_name in modos_identificados:
                # Tentar pegar prompt de tools_config primeiro, depois de personality_config
                prompt = prompts_por_modo.get(modo_name, '')

                # Se não tem prompt em tools_config, extrair info de personality_config
                if not prompt and modo_name in personality_modos:
                    modo_info = personality_modos[modo_name]
                    # Converter estrutura de personality_config para prompt
                    prompt = self._build_prompt_from_personality(modo_name, modo_info)

                # Few-shots do modo
                mode_few_shots = few_shots_por_modo.get(modo_name, [])

                modes[modo_name] = AgentMode(
                    name=modo_name,
                    prompt=prompt,
                    few_shots=mode_few_shots
                )

            return RealAgent(
                id=row['id'],
                agent_name=row['agent_name'],
                version=row['version'],
                location_id=row['location_id'],
                status=row['status'],
                system_prompt=row.get('system_prompt', ''),
                modes=modes,
                business_config=row.get('business_config', {}) or {},
                personality_config=row.get('personality_config', {}) or {},
                compliance_rules=row.get('compliance_rules', {}) or {},
                hyperpersonalization=row.get('hyperpersonalization', {}) or {},
                few_shots_global=few_shots_global
            )
        except Exception as e:
            print(f"Erro ao parsear agente: {e}")
            return None

    def _build_prompt_from_personality(self, modo_name: str, modo_info: Dict) -> str:
        """
        Converte estrutura de personality_config.modos para um prompt utilizável.
        Usado quando o agente tem modos definidos em personality_config mas não em tools_config.
        """
        parts = []

        # Objetivo
        if modo_info.get('objetivo'):
            parts.append(f"## OBJETIVO\n{modo_info['objetivo']}")

        # Tom
        if modo_info.get('tom'):
            parts.append(f"## TOM\n{modo_info['tom']}")

        # Características
        if modo_info.get('caracteristicas'):
            chars = "\n".join([f"- {c}" for c in modo_info['caracteristicas']])
            parts.append(f"## CARACTERÍSTICAS\n{chars}")

        # Etapas/Fases
        if modo_info.get('etapas'):
            etapas = "\n".join([f"{i+1}. {e}" for i, e in enumerate(modo_info['etapas'])])
            parts.append(f"## ETAPAS\n{etapas}")
        elif modo_info.get('fases'):
            fases = "\n".join([f"{i+1}. {f}" for i, f in enumerate(modo_info['fases'])])
            parts.append(f"## FASES\n{fases}")

        # Regras específicas
        if modo_info.get('regras'):
            regras = modo_info['regras']
            if isinstance(regras, dict):
                regras_text = "\n".join([f"- {k}: {v}" for k, v in regras.items()])
            else:
                regras_text = str(regras)
            parts.append(f"## REGRAS\n{regras_text}")

        # Regras especiais
        if modo_info.get('regras_especiais'):
            regras_esp = modo_info['regras_especiais']
            if isinstance(regras_esp, dict):
                regras_text = "\n".join([f"- {k}: {v}" for k, v in regras_esp.items()])
            else:
                regras_text = str(regras_esp)
            parts.append(f"## REGRAS ESPECIAIS\n{regras_text}")

        # Gatilhos (para concierge)
        if modo_info.get('gatilhos'):
            gatilhos = modo_info['gatilhos']
            if isinstance(gatilhos, dict):
                gatilhos_text = "\n".join([f"- {k}: {v}" for k, v in gatilhos.items()])
            else:
                gatilhos_text = str(gatilhos)
            parts.append(f"## GATILHOS\n{gatilhos_text}")

        # Cadência (para followuper)
        if modo_info.get('cadencia'):
            cadencia = modo_info['cadencia']
            if isinstance(cadencia, dict):
                cadencia_text = "\n".join([f"- {k}: {v}" for k, v in cadencia.items()])
            else:
                cadencia_text = str(cadencia)
            parts.append(f"## CADÊNCIA\n{cadencia_text}")

        # Método (para objection_handler)
        if modo_info.get('metodo'):
            parts.append(f"## MÉTODO\n{modo_info['metodo']}")

        # Max frases
        if modo_info.get('max_frases'):
            parts.append(f"## LIMITE\nMáximo {modo_info['max_frases']} frases por mensagem")

        # Nota adicional
        if modo_info.get('nota'):
            parts.append(f"## NOTA\n{modo_info['nota']}")

        return "\n\n".join(parts) if parts else ""


# Definição dos fluxos padrão entre modos
FLOW_DEFINITIONS = {
    # Fluxo padrão de vendas
    "sales_flow": {
        "name": "Fluxo de Vendas",
        "description": "First contact até agendamento",
        "steps": [
            {
                "mode": "first_contact",
                "objective": "Qualificar lead e gerar interesse",
                "success_criteria": ["lead_qualified", "interest_generated"],
                "next_mode": "scheduler",
                "max_messages": 10
            },
            {
                "mode": "scheduler",
                "objective": "Agendar consulta e garantir pagamento",
                "success_criteria": ["appointment_scheduled", "payment_confirmed"],
                "next_mode": "concierge",
                "max_messages": 8
            },
            {
                "mode": "concierge",
                "objective": "Garantir comparecimento",
                "success_criteria": ["show_rate_confirmed"],
                "next_mode": None,
                "max_messages": 6
            }
        ],
        "exception_handlers": {
            "objection_detected": "objection_handler",
            "no_response": "followuper"
        }
    },

    # Fluxo de reativação
    "reactivation_flow": {
        "name": "Fluxo de Reativação",
        "description": "Reativar leads frios",
        "steps": [
            {
                "mode": "followuper",
                "objective": "Reengajar lead",
                "success_criteria": ["response_received"],
                "next_mode": "first_contact",
                "max_messages": 5
            }
        ]
    },

    # Fluxo de objeção
    "objection_flow": {
        "name": "Fluxo de Objeção",
        "description": "Contornar objeções",
        "steps": [
            {
                "mode": "objection_handler",
                "objective": "Resolver objeção",
                "success_criteria": ["objection_resolved"],
                "next_mode": "scheduler",  # Volta pro fluxo principal
                "max_messages": 6
            }
        ]
    }
}


def get_flow_for_agent(agent: RealAgent, flow_name: str = "sales_flow") -> Dict:
    """
    Retorna o fluxo adaptado para os modos disponíveis no agente.
    """
    flow = FLOW_DEFINITIONS.get(flow_name, FLOW_DEFINITIONS["sales_flow"])
    available_modes = agent.get_available_modes()

    # Filtrar steps para apenas modos disponíveis
    adapted_steps = []
    for step in flow["steps"]:
        if step["mode"] in available_modes:
            adapted_steps.append(step)

    return {
        **flow,
        "steps": adapted_steps,
        "agent_name": agent.agent_name,
        "agent_version": agent.version
    }
