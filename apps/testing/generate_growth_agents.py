#!/usr/bin/env python3
"""
AI Factory - Growth OS Agent Generator
======================================
Gera os 5 agentes operacionais essenciais a partir de um agente base.

Agentes Essenciais:
- SSIG: Social Seller Instagram (DMs de prospecção)
- SCHD: Scheduler (Agendamento + Reagendamento)
- OBJH: Objection Handler (Contorno de objeções)
- CONC: Concierge (Pré-consulta, garantir show rate)
- SDRI: SDR Inbound (Atendimento de leads que chegam)

Uso:
    python generate_growth_agents.py --agent "Julia Amare"    # Gera agentes para Julia
    python generate_growth_agents.py --agent-id <uuid>        # Por ID específico
    python generate_growth_agents.py --list                   # Lista agentes disponíveis
    python generate_growth_agents.py --save                   # Salva no Supabase após gerar
"""

import asyncio
import argparse
import json
import os
import sys
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from pathlib import Path

# Load .env file
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

# Groq
from groq import Groq

# Supabase
from supabase import create_client, Client

# Config
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
SUPABASE_URL = os.getenv(
    'SUPABASE_URL',
    'https://bfumywvwubvernvhjehk.supabase.co'
)
SUPABASE_KEY = os.getenv(
    'SUPABASE_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE'
)

# Modelo Groq
GROQ_MODEL = "llama-3.3-70b-versatile"


# =============================================================================
# TEMPLATES DOS AGENTES OPERACIONAIS
# =============================================================================

GROWTH_AGENT_DEFINITIONS = {
    "SSIG": {
        "code": "SSIG",
        "name": "Social Seller Instagram",
        "full_name": "Social Seller - Instagram DM",
        "category": "social_selling",
        "description": "Especialista em prospecção via DMs do Instagram. Aborda leads de forma consultiva e personalizada.",
        "objective": "Qualificar leads via DM e agendar consultas/reuniões",
        "key_capabilities": [
            "Abordar leads com mensagens personalizadas baseadas no perfil",
            "Fazer perguntas de qualificação BANT",
            "Transicionar naturalmente para agendamento",
            "Identificar e escalar objeções"
        ],
        "handoffs": {
            "objection_detected": "OBJH",
            "ready_to_schedule": "SCHD",
            "needs_human": "ESCALATE"
        },
        "metrics": ["dm_response_rate", "qualification_rate", "meetings_booked"]
    },
    "SCHD": {
        "code": "SCHD",
        "name": "Scheduler",
        "full_name": "Scheduler - Agendamento & Reagendamento",
        "category": "conversion",
        "description": "Especialista em agendar e reagendar consultas. Gerencia calendário e confirma compromissos.",
        "objective": "Converter leads qualificados em agendamentos confirmados",
        "key_capabilities": [
            "Oferecer horários disponíveis de forma persuasiva",
            "Confirmar agendamentos via WhatsApp/SMS",
            "Gerenciar reagendamentos",
            "Enviar lembretes pré-consulta",
            "Coletar informações necessárias pré-agendamento"
        ],
        "handoffs": {
            "objection_detected": "OBJH",
            "appointment_booked": "CONC",
            "needs_human": "ESCALATE"
        },
        "metrics": ["scheduling_rate", "confirmation_rate", "reschedule_rate"]
    },
    "OBJH": {
        "code": "OBJH",
        "name": "Objection Handler",
        "full_name": "Objection Handler - Contorno de Objeções",
        "category": "conversion",
        "description": "Especialista em identificar e contornar objeções de vendas usando técnicas consultivas.",
        "objective": "Resolver objeções e reconverter para o fluxo principal",
        "key_capabilities": [
            "Identificar tipo de objeção (preço, tempo, autoridade, necessidade)",
            "Aplicar técnica apropriada para cada tipo",
            "Usar prova social e casos de sucesso",
            "Reconverter lead de volta ao fluxo de agendamento",
            "Saber quando escalar para humano"
        ],
        "objection_types": [
            {"type": "price", "technique": "Reframe valor, parcelamento, ROI"},
            {"type": "time", "technique": "Urgência, consequências de esperar"},
            {"type": "authority", "technique": "Envolver decisor, armar champion"},
            {"type": "need", "technique": "Aprofundar dor, consequências"},
            {"type": "competitor", "technique": "Diferenciação, casos de sucesso"}
        ],
        "handoffs": {
            "objection_resolved": "SCHD",
            "needs_human": "ESCALATE",
            "lead_lost": "LOST"
        },
        "metrics": ["objection_resolution_rate", "reconversion_rate"]
    },
    "CONC": {
        "code": "CONC",
        "name": "Concierge",
        "full_name": "Concierge - Garantia de Show Rate",
        "category": "conversion",
        "description": "Especialista em garantir comparecimento. Acompanha lead desde agendamento até consulta.",
        "objective": "Maximizar show rate e preparar lead para conversão",
        "key_capabilities": [
            "Enviar sequência de lembretes estratégicos",
            "Responder dúvidas pré-consulta",
            "Enviar preparatório com o que esperar",
            "Detectar sinais de no-show e intervir",
            "Confirmar presença no dia"
        ],
        "reminder_sequence": [
            {"timing": "48h_before", "type": "confirmation"},
            {"timing": "24h_before", "type": "preparation"},
            {"timing": "2h_before", "type": "final_reminder"},
            {"timing": "post_no_show", "type": "rescue"}
        ],
        "handoffs": {
            "appointment_confirmed": "DONE",
            "needs_reschedule": "SCHD",
            "no_show": "SCHD",
            "needs_human": "ESCALATE"
        },
        "metrics": ["show_rate", "confirmation_rate", "rescue_rate"]
    },
    "SDRI": {
        "code": "SDRI",
        "name": "SDR Inbound",
        "full_name": "SDR Inbound - Atendimento de Leads",
        "category": "inbound",
        "description": "Especialista em atender leads que chegam (site, WhatsApp, redes). Qualifica e direciona rapidamente.",
        "objective": "Qualificar leads inbound e direcionar para agendamento em até 5 minutos",
        "key_capabilities": [
            "Responder rapidamente a novos leads",
            "Fazer triagem inicial de qualificação",
            "Identificar urgência e intenção",
            "Responder perguntas frequentes",
            "Transicionar para agendamento ou especialista"
        ],
        "response_sla": "5_minutes",
        "qualification_questions": [
            "interesse_principal",
            "urgencia",
            "budget_awareness",
            "decisor"
        ],
        "handoffs": {
            "qualified_hot": "SCHD",
            "qualified_warm": "SSIG",
            "objection_detected": "OBJH",
            "needs_human": "ESCALATE"
        },
        "metrics": ["response_time", "qualification_rate", "conversion_to_schedule"]
    }
}


# =============================================================================
# PROMPT PARA GERAÇÃO DE AGENTES
# =============================================================================

AGENT_GENERATION_PROMPT = """Você é um especialista em criar prompts de agentes de IA para vendas consultivas.

## CONTEXTO DO CLIENTE
{client_context}

## AGENTE BASE
O cliente já tem um agente base chamado "{base_agent_name}" com o seguinte prompt:

```
{base_prompt}
```

## AGENTE A CRIAR
Agora você precisa criar o prompt do agente **{agent_code}** ({agent_name}):

**Descrição**: {agent_description}
**Objetivo**: {agent_objective}
**Capacidades**:
{agent_capabilities}

**Handoffs** (transições):
{agent_handoffs}

## INSTRUÇÕES

Crie um prompt COMPLETO seguindo a estrutura GHL Architect V2:

1. **PERSONA & CONTEXTO** (quem é, para qual negócio)
2. **PRIME DIRECTIVE** (objetivo principal, missão)
3. **PROTOCOLO** (fluxo de conversa passo a passo)
4. **GUARDRAILS** (o que não fazer, limites)
5. **FEW-SHOTS** (3-5 exemplos de conversas ideais)

## REGRAS IMPORTANTES

1. Manter consistência com o agente base (mesmo tom, mesmo conhecimento do negócio)
2. Usar as variáveis {{nome_cliente}}, {{nome_empresa}}, {{telefone_humano}} onde aplicável
3. Incluir as transições (handoffs) de forma natural no protocolo
4. O prompt deve funcionar SOZINHO, sem depender do prompt base
5. Incluir exemplos realistas do nicho do cliente
6. RESPONDA APENAS COM O JSON NO FORMATO ESPECIFICADO

## FORMATO DE RESPOSTA

Responda APENAS com um JSON válido no seguinte formato:
```json
{{
    "agent_code": "{agent_code}",
    "agent_name": "{agent_name}",
    "system_prompt": "PROMPT COMPLETO AQUI...",
    "few_shots": [
        {{
            "scenario": "Nome do cenário",
            "messages": [
                {{"role": "lead", "content": "Mensagem do lead"}},
                {{"role": "agent", "content": "Resposta do agente"}}
            ]
        }}
    ],
    "metadata": {{
        "created_from_base": "{base_agent_name}",
        "category": "{agent_category}",
        "version": "1.0"
    }}
}}
```
"""


# =============================================================================
# CLASSES
# =============================================================================

@dataclass
class GeneratedAgent:
    """Agente gerado"""
    code: str
    name: str
    system_prompt: str
    few_shots: List[Dict]
    metadata: Dict
    generation_time_ms: int = 0
    tokens_used: int = 0


@dataclass
class BaseAgent:
    """Agente base carregado do Supabase"""
    id: str
    name: str
    version: str
    location_id: str
    system_prompt: str
    business_config: Dict
    personality_config: Dict

    def get_client_context(self) -> str:
        """Extrai contexto do cliente para uso nos prompts"""
        bc = self.business_config or {}
        pc = self.personality_config or {}

        context_parts = [
            f"**Empresa**: {bc.get('nome_empresa', 'N/A')}",
            f"**Tipo de Negócio**: {bc.get('tipo_negocio', 'N/A')}",
            f"**Oferta Principal**: {bc.get('oferta_principal', 'N/A')}",
            f"**Público-Alvo**: {bc.get('publico_alvo', 'N/A')}",
            f"**Dor Principal**: {bc.get('dor_principal', 'N/A')}",
            f"**Diferenciais**: {', '.join(bc.get('diferenciais', []))}",
            f"**Preço**: {bc.get('faixa_preco_texto', 'N/A')}",
            f"**Tom do Agente**: {pc.get('tom_agente', 'consultivo')}",
            f"**Nome do Agente**: {pc.get('nome_agente', 'Assistente')}"
        ]

        return "\n".join(context_parts)


class GrowthAgentGenerator:
    """Gera agentes operacionais do Growth OS"""

    def __init__(self):
        self.groq = None  # Inicializado sob demanda
        self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.generated_agents: List[GeneratedAgent] = []
        self.total_tokens = 0
        self.total_time_ms = 0

    def _get_groq_client(self):
        """Inicializa cliente Groq sob demanda"""
        if self.groq is None:
            self.groq = Groq(api_key=GROQ_API_KEY)
        return self.groq

    def load_base_agent(
        self,
        agent_name: str = None,
        agent_id: str = None
    ) -> Optional[BaseAgent]:
        """Carrega agente base do Supabase"""
        query = self.supabase.table('agent_versions').select('*')

        if agent_id:
            query = query.eq('id', agent_id)
        elif agent_name:
            query = query.ilike('agent_name', f'%{agent_name}%')
            query = query.eq('status', 'active')

        query = query.order('created_at', desc=True).limit(1)
        result = query.execute()

        if not result.data:
            return None

        row = result.data[0]
        return BaseAgent(
            id=row['id'],
            name=row['agent_name'],
            version=row.get('version', 'unknown'),
            location_id=row.get('location_id', ''),
            system_prompt=row.get('system_prompt', ''),
            business_config=row.get('business_config', {}) or {},
            personality_config=row.get('personality_config', {}) or {}
        )

    def list_available_agents(self) -> List[Dict]:
        """Lista agentes disponíveis no Supabase"""
        result = self.supabase.table('agent_versions') \
            .select('id, agent_name, version, location_id, status, created_at') \
            .eq('status', 'active') \
            .order('created_at', desc=True) \
            .execute()

        return result.data

    def generate_agent(
        self,
        base_agent: BaseAgent,
        agent_code: str
    ) -> Optional[GeneratedAgent]:
        """Gera um agente operacional usando Groq"""

        if agent_code not in GROWTH_AGENT_DEFINITIONS:
            print(f"❌ Agente {agent_code} não definido")
            return None

        agent_def = GROWTH_AGENT_DEFINITIONS[agent_code]

        # Montar prompt
        capabilities_text = "\n".join([f"- {c}" for c in agent_def['key_capabilities']])
        handoffs_text = "\n".join([f"- {k}: {v}" for k, v in agent_def['handoffs'].items()])

        prompt = AGENT_GENERATION_PROMPT.format(
            client_context=base_agent.get_client_context(),
            base_agent_name=base_agent.name,
            base_prompt=base_agent.system_prompt[:3000],  # Truncar se muito longo
            agent_code=agent_code,
            agent_name=agent_def['name'],
            agent_description=agent_def['description'],
            agent_objective=agent_def['objective'],
            agent_capabilities=capabilities_text,
            agent_handoffs=handoffs_text,
            agent_category=agent_def['category']
        )

        print(f"\n🤖 Gerando {agent_code} ({agent_def['name']})...")

        start_time = datetime.now()

        try:
            groq_client = self._get_groq_client()
            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em criar prompts de agentes de vendas. Responda APENAS com JSON válido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )

            elapsed_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            tokens = response.usage.total_tokens if response.usage else 0

            self.total_tokens += tokens
            self.total_time_ms += elapsed_ms

            # Parse response
            content = response.choices[0].message.content
            data = json.loads(content)

            # Tratar system_prompt que pode vir como objeto ou string
            system_prompt = data.get('system_prompt', '')
            if isinstance(system_prompt, dict):
                # Converter dicionário para string formatada
                prompt_parts = []
                for key, value in system_prompt.items():
                    if isinstance(value, list):
                        items = "\n".join([f"  - {json.dumps(v, ensure_ascii=False) if isinstance(v, dict) else str(v)}" for v in value])
                        prompt_parts.append(f"### {key.upper()} ###\n{items}")
                    else:
                        prompt_parts.append(f"### {key.upper()} ###\n{value}")
                system_prompt = "\n\n".join(prompt_parts)
            elif system_prompt is None:
                system_prompt = ""

            agent = GeneratedAgent(
                code=data.get('agent_code', agent_code),
                name=data.get('agent_name', agent_def['name']),
                system_prompt=system_prompt,
                few_shots=data.get('few_shots', []) or [],
                metadata=data.get('metadata', {}) or {},
                generation_time_ms=elapsed_ms,
                tokens_used=tokens
            )

            # Verificar se o prompt veio vazio (retry se necessário)
            if not system_prompt or len(system_prompt) < 100:
                print(f"   ⚠️ Prompt curto/vazio, tentando novamente...")
                # Retry uma vez
                response2 = groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": "Você é um especialista em criar prompts de agentes de vendas. Responda APENAS com JSON válido. O campo system_prompt DEVE ser uma STRING completa com o prompt do agente."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.5,  # Menos criativo, mais consistente
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )
                content2 = response2.choices[0].message.content
                data2 = json.loads(content2)
                system_prompt = data2.get('system_prompt', '')
                if isinstance(system_prompt, dict):
                    prompt_parts = []
                    for key, value in system_prompt.items():
                        if isinstance(value, list):
                            items = "\n".join([f"  - {json.dumps(v, ensure_ascii=False) if isinstance(v, dict) else str(v)}" for v in value])
                            prompt_parts.append(f"### {key.upper()} ###\n{items}")
                        else:
                            prompt_parts.append(f"### {key.upper()} ###\n{value}")
                    system_prompt = "\n\n".join(prompt_parts)

                agent = GeneratedAgent(
                    code=data2.get('agent_code', agent_code),
                    name=data2.get('agent_name', agent_def['name']),
                    system_prompt=system_prompt or "",
                    few_shots=data2.get('few_shots', []) or [],
                    metadata=data2.get('metadata', {}) or {},
                    generation_time_ms=elapsed_ms,
                    tokens_used=tokens + (response2.usage.total_tokens if response2.usage else 0)
                )

            self.generated_agents.append(agent)

            print(f"   ✅ Gerado em {elapsed_ms}ms ({tokens} tokens)")
            return agent

        except Exception as e:
            print(f"   ❌ Erro: {e}")
            return None

    def generate_all_essential_agents(
        self,
        base_agent: BaseAgent
    ) -> List[GeneratedAgent]:
        """Gera todos os 5 agentes essenciais"""

        essential_codes = ["SSIG", "SCHD", "OBJH", "CONC", "SDRI"]
        results = []

        for code in essential_codes:
            agent = self.generate_agent(base_agent, code)
            if agent:
                results.append(agent)

        return results

    def save_to_supabase(
        self,
        base_agent: BaseAgent,
        generated_agents: List[GeneratedAgent]
    ) -> Dict:
        """
        Atualiza tools_config.prompts_por_modo do agente base existente.

        Os prompts gerados são inseridos DENTRO do agente base na estrutura:
        tools_config.prompts_por_modo = {
            "SSIG": "prompt do social seller...",
            "SCHD": "prompt do scheduler...",
            ...
        }

        E os códigos são adicionados em modos_identificados.
        """

        try:
            # 1. Buscar tools_config atual do agente base
            result = self.supabase.table('agent_versions') \
                .select('tools_config') \
                .eq('id', base_agent.id) \
                .single() \
                .execute()

            current_tools_config = result.data.get('tools_config', {}) or {}

            # 2. Preparar prompts_por_modo e modos_identificados
            prompts_por_modo = current_tools_config.get('prompts_por_modo', {}) or {}
            modos_identificados = current_tools_config.get('modos_identificados', []) or []
            few_shots_por_modo = current_tools_config.get('few_shots_por_modo', {}) or {}

            # 3. Adicionar cada agente gerado
            for agent in generated_agents:
                # Mapear código do agente para modo
                mode_mapping = {
                    "SSIG": "social_seller_instagram",
                    "SCHD": "scheduler",
                    "OBJH": "objection_handler",
                    "CONC": "concierge",
                    "SDRI": "sdr_inbound"
                }
                mode_key = mode_mapping.get(agent.code, agent.code.lower())

                # Adicionar prompt ao modo
                prompts_por_modo[mode_key] = agent.system_prompt

                # Adicionar few_shots se houver
                if agent.few_shots:
                    few_shots_por_modo[mode_key] = agent.few_shots

                # Adicionar modo à lista se não existir
                if mode_key not in modos_identificados:
                    modos_identificados.append(mode_key)

                print(f"   📝 Modo '{mode_key}' adicionado ({len(agent.system_prompt)} chars)")

            # 4. Atualizar tools_config com os novos dados
            updated_tools_config = {
                **current_tools_config,
                "prompts_por_modo": prompts_por_modo,
                "modos_identificados": modos_identificados,
                "few_shots_por_modo": few_shots_por_modo,
                "growth_os_metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "model": GROQ_MODEL,
                    "agents_generated": [a.code for a in generated_agents],
                    "total_tokens": self.total_tokens,
                    "total_time_ms": self.total_time_ms
                }
            }

            # 5. Fazer UPDATE no agente base
            update_result = self.supabase.table('agent_versions') \
                .update({"tools_config": updated_tools_config}) \
                .eq('id', base_agent.id) \
                .execute()

            if update_result.data:
                print(f"\n   ✅ tools_config atualizado no agente '{base_agent.name}'")
                print(f"   📊 Modos disponíveis: {', '.join(modos_identificados)}")
                return {
                    "saved": len(generated_agents),
                    "errors": [],
                    "updated_agent_id": base_agent.id,
                    "modes_added": [a.code for a in generated_agents]
                }
            else:
                return {
                    "saved": 0,
                    "errors": ["Nenhum dado retornado do update"],
                    "updated_agent_id": None,
                    "modes_added": []
                }

        except Exception as e:
            return {
                "saved": 0,
                "errors": [str(e)],
                "updated_agent_id": None,
                "modes_added": []
            }

    def export_to_json(
        self,
        output_path: str
    ):
        """Exporta agentes gerados para JSON"""

        export_data = {
            "generated_at": datetime.now().isoformat(),
            "model": GROQ_MODEL,
            "total_tokens": self.total_tokens,
            "total_time_ms": self.total_time_ms,
            "agents": [
                {
                    "code": a.code,
                    "name": a.name,
                    "system_prompt": a.system_prompt,
                    "few_shots": a.few_shots,
                    "metadata": a.metadata,
                    "generation_time_ms": a.generation_time_ms,
                    "tokens_used": a.tokens_used
                }
                for a in self.generated_agents
            ]
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        print(f"\n📁 Exportado para: {output_path}")

    def print_summary(self):
        """Imprime resumo da geração"""

        print(f"""
╔═══════════════════════════════════════════════════════════════╗
║                📊 RESUMO DA GERAÇÃO                           ║
╠═══════════════════════════════════════════════════════════════╣
║  Total de agentes: {len(self.generated_agents):3d}                                       ║
║  Tokens usados:    {self.total_tokens:,}                                   ║
║  Tempo total:      {self.total_time_ms:,}ms                                ║
║                                                               ║
║  💰 Custo estimado: ~${self.total_tokens * 0.7 / 1000000:.4f}                            ║
╚═══════════════════════════════════════════════════════════════╝
        """)

        print("\n📋 AGENTES GERADOS:")
        print("=" * 60)
        for agent in self.generated_agents:
            print(f"\n🤖 {agent.code} - {agent.name}")
            prompt_len = len(agent.system_prompt) if agent.system_prompt else 0
            few_shots_len = len(agent.few_shots) if agent.few_shots else 0
            print(f"   Prompt: {prompt_len} chars")
            print(f"   Few-shots: {few_shots_len}")
            print(f"   Tempo: {agent.generation_time_ms}ms")


# =============================================================================
# MAIN
# =============================================================================

async def main():
    parser = argparse.ArgumentParser(description='Growth OS Agent Generator')
    parser.add_argument('--agent', type=str, help='Nome do agente base')
    parser.add_argument('--agent-id', type=str, help='ID do agente base')
    parser.add_argument('--list', action='store_true', help='Lista agentes disponíveis')
    parser.add_argument('--codes', type=str, help='Códigos específicos (ex: SSIG,SCHD)')
    parser.add_argument('--save', action='store_true', help='Salvar no Supabase')
    parser.add_argument('--output', type=str, default='generated_agents.json', help='Arquivo de saída')

    args = parser.parse_args()

    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 GROWTH OS - AGENT GENERATOR                              ║
║   Gera os 5 agentes operacionais essenciais                   ║
║                                                               ║
║   SSIG: Social Seller Instagram                               ║
║   SCHD: Scheduler (+ Reagendamento)                           ║
║   OBJH: Objection Handler                                     ║
║   CONC: Concierge                                             ║
║   SDRI: SDR Inbound                                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    generator = GrowthAgentGenerator()

    # Listar agentes disponíveis (não precisa de GROQ_API_KEY)
    if args.list:
        agents = generator.list_available_agents()
        print("\n📋 AGENTES DISPONÍVEIS NO SUPABASE:")
        print("=" * 70)
        for ag in agents:
            print(f"\n🤖 {ag['agent_name']}")
            print(f"   ID: {ag['id']}")
            print(f"   Version: {ag.get('version', 'N/A')}")
            print(f"   Location: {ag.get('location_id', 'N/A')}")
        print("\n" + "=" * 70)
        sys.exit(0)

    # Verificar API key (precisa para geração)
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY não configurada!")
        print("\nConfigure assim:")
        print("  export GROQ_API_KEY='gsk_sua_key_aqui'")
        print("\nOu edite o arquivo .env")
        sys.exit(1)

    # Carregar agente base
    if not args.agent and not args.agent_id:
        print("❌ Especifique --agent ou --agent-id")
        print("\nUse --list para ver agentes disponíveis")
        sys.exit(1)

    base_agent = generator.load_base_agent(
        agent_name=args.agent,
        agent_id=args.agent_id
    )

    if not base_agent:
        print(f"❌ Agente não encontrado: {args.agent or args.agent_id}")
        sys.exit(1)

    print(f"\n✅ Agente base carregado: {base_agent.name} ({base_agent.version})")
    print(f"   Location: {base_agent.location_id}")
    print(f"   Prompt base: {len(base_agent.system_prompt)} chars")

    # Gerar agentes
    if args.codes:
        codes = [c.strip().upper() for c in args.codes.split(',')]
        print(f"\n🎯 Gerando agentes específicos: {', '.join(codes)}")
        for code in codes:
            generator.generate_agent(base_agent, code)
    else:
        print("\n🎯 Gerando todos os 5 agentes essenciais...")
        generator.generate_all_essential_agents(base_agent)

    # Salvar no Supabase
    if args.save and generator.generated_agents:
        print("\n💾 Salvando no Supabase...")
        result = generator.save_to_supabase(base_agent, generator.generated_agents)
        print(f"   Salvos: {result['saved']}")
        if result['errors']:
            print(f"   Erros: {result['errors']}")

    # Exportar para JSON
    generator.export_to_json(args.output)

    # Resumo
    generator.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
