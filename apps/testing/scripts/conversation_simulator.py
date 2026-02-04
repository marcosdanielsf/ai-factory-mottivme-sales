#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
CONVERSATION SIMULATOR v1.1
Simulador de conversas para testar agentes SDR com 20 módulos
Usa GROQ API (llama-3.3-70b) para geração de respostas

Uso:
  python scripts/conversation_simulator.py                    # Todos agentes
  python scripts/conversation_simulator.py --agent milton     # Agente específico
  python scripts/conversation_simulator.py --module 5         # Módulo específico
  python scripts/conversation_simulator.py --list-modules     # Listar módulos
  python scripts/conversation_simulator.py --quick            # Teste rápido (1,11,16)
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import argparse
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import requests

# Supabase
from supabase import create_client, Client

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
GROQ_MODEL = 'llama-3.3-70b-versatile'  # Modelo rápido e capaz

# Agents mapping
AGENTS = {
    "milton": {
        "location_id": "KtMB8IKwmhtnKt7aimzd",
        "name": "Milton - Legacy Agency",
        "type": "financial"
    },
    "marina": {
        "location_id": "Bgi2hFMgiLLoRlOO0K5b",
        "name": "Marina - Brazillionaires",
        "type": "financial"
    },
    "fernanda": {
        "location_id": "EKHxHl3KLPN0iRc69GNU",
        "name": "Fernanda Lappe",
        "type": "financial"
    },
    "dra_gabi": {
        "location_id": "xliub5H5pQ4QcDeKHc6F",
        "name": "Dra. Gabriella Rossmann",
        "type": "clinic"
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# 20 TEST MODULES
# ═══════════════════════════════════════════════════════════════════════════════

TEST_MODULES = [
    # ─────────────────────────────────────────────────────────────────────────
    # MÓDULO 1-5: ABERTURA E QUALIFICAÇÃO INICIAL
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": 1,
        "name": "Abertura Simples",
        "description": "Lead manda 'oi' ou 'bom dia' - teste de abertura humanizada",
        "category": "abertura",
        "lead_behavior": "greeting_only",
        "expected_agent_actions": ["saudação personalizada", "pergunta aberta"],
        "max_turns": 3
    },
    {
        "id": 2,
        "name": "Lead Indicado",
        "description": "Lead menciona que veio por indicação de amigo",
        "category": "abertura",
        "lead_behavior": "referral",
        "expected_agent_actions": ["explorar indicação", "não perguntar nome do amigo"],
        "max_turns": 5
    },
    {
        "id": 3,
        "name": "Lead Direto ao Ponto",
        "description": "Lead já pergunta preço/agenda de cara",
        "category": "abertura",
        "lead_behavior": "direct_price_ask",
        "expected_agent_actions": ["não dar preço imediato", "qualificar primeiro"],
        "max_turns": 5
    },
    {
        "id": 4,
        "name": "Lead com Dor Clara",
        "description": "Lead já descreve seu problema/dor logo de início",
        "category": "qualificacao",
        "lead_behavior": "pain_expressed",
        "expected_agent_actions": ["validar dor", "aprofundar com NEPQ"],
        "max_turns": 6
    },
    {
        "id": 5,
        "name": "Lead Vago/Curioso",
        "description": "Lead diz 'quero saber mais' sem especificar",
        "category": "qualificacao",
        "lead_behavior": "vague_curious",
        "expected_agent_actions": ["perguntas abertas", "descobrir motivação"],
        "max_turns": 6
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MÓDULO 6-10: QUALIFICAÇÃO PROFUNDA E DIFERENCIAÇÃO
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": 6,
        "name": "Qualificação Work Permit (Financial)",
        "description": "Teste do fluxo Work Permit para agentes financeiros",
        "category": "qualificacao",
        "lead_behavior": "work_permit_flow",
        "expected_agent_actions": ["perguntar Work Permit", "rotear carreira/consultoria"],
        "max_turns": 8,
        "agent_types": ["financial"]
    },
    {
        "id": 7,
        "name": "Lead Já Tentou Outras Soluções",
        "description": "Lead diz que já tentou concorrentes sem sucesso",
        "category": "qualificacao",
        "lead_behavior": "tried_competitors",
        "expected_agent_actions": ["empatia", "diferenciação", "Feel-Felt-Found"],
        "max_turns": 6
    },
    {
        "id": 8,
        "name": "Lead de Outra Cidade/Estado",
        "description": "Lead menciona que é de longe (BANT - Authority/Location)",
        "category": "qualificacao",
        "lead_behavior": "remote_location",
        "expected_agent_actions": ["validar localização", "explicar opções remotas"],
        "max_turns": 5
    },
    {
        "id": 9,
        "name": "Lead com Timeline Urgente",
        "description": "Lead diz que precisa resolver logo",
        "category": "qualificacao",
        "lead_behavior": "urgent_timeline",
        "expected_agent_actions": ["validar urgência", "priorizar agenda"],
        "max_turns": 5
    },
    {
        "id": 10,
        "name": "Lead com Timeline Longa",
        "description": "Lead diz 'tô só pesquisando', 'talvez no futuro'",
        "category": "qualificacao",
        "lead_behavior": "long_timeline",
        "expected_agent_actions": ["respeitar", "nutrir", "deixar porta aberta"],
        "max_turns": 5
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MÓDULO 11-15: OBJEÇÕES
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": 11,
        "name": "Objeção: Preço Alto",
        "description": "Lead diz 'tá caro', 'não tenho esse valor'",
        "category": "objecao",
        "lead_behavior": "price_objection",
        "expected_agent_actions": ["reframe valor", "não baixar preço", "No-Go"],
        "max_turns": 6
    },
    {
        "id": 12,
        "name": "Objeção: Preciso Pensar",
        "description": "Lead diz 'vou pensar', 'depois te falo'",
        "category": "objecao",
        "lead_behavior": "think_about_it",
        "expected_agent_actions": ["descobrir real objeção", "No-Go", "não pressionar"],
        "max_turns": 6
    },
    {
        "id": 13,
        "name": "Objeção: Consultar Cônjuge/Família",
        "description": "Lead diz 'preciso falar com meu marido/esposa'",
        "category": "objecao",
        "lead_behavior": "spouse_objection",
        "expected_agent_actions": ["validar", "oferecer reserva", "No-Go"],
        "max_turns": 5
    },
    {
        "id": 14,
        "name": "Objeção: Sem Tempo",
        "description": "Lead diz 'não tenho tempo agora', 'agenda cheia'",
        "category": "objecao",
        "lead_behavior": "no_time_objection",
        "expected_agent_actions": ["flexibilizar", "oferecer alternativas"],
        "max_turns": 5
    },
    {
        "id": 15,
        "name": "Objeção: Desconfiança",
        "description": "Lead questiona credibilidade, pede provas",
        "category": "objecao",
        "lead_behavior": "trust_objection",
        "expected_agent_actions": ["prova social", "depoimentos", "não defensivo"],
        "max_turns": 6
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MÓDULO 16-18: FECHAMENTO
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": 16,
        "name": "Fechamento OU/OU",
        "description": "Lead está pronto, teste do fechamento binário",
        "category": "fechamento",
        "lead_behavior": "ready_to_close",
        "expected_agent_actions": ["fechamento OU/OU", "máx 2-3 opções", "não lista"],
        "max_turns": 5
    },
    {
        "id": 17,
        "name": "Lead Aceita e Agenda",
        "description": "Lead escolhe horário e confirma agendamento",
        "category": "fechamento",
        "lead_behavior": "accepts_and_schedules",
        "expected_agent_actions": ["confirmar dados", "enviar PIX/próximos passos", "mudar modo"],
        "max_turns": 4
    },
    {
        "id": 18,
        "name": "Lead Desiste no Último Momento",
        "description": "Lead ia agendar mas desiste",
        "category": "fechamento",
        "lead_behavior": "last_minute_dropout",
        "expected_agent_actions": ["No-Go", "descobrir motivo", "deixar porta aberta"],
        "max_turns": 5
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MÓDULO 19-20: FOLLOW-UP E EDGE CASES
    # ─────────────────────────────────────────────────────────────────────────
    {
        "id": 19,
        "name": "Follow-up Pós-Agendamento",
        "description": "Lead agendou mas não pagou sinal (24h+)",
        "category": "followup",
        "lead_behavior": "scheduled_no_payment",
        "expected_agent_actions": ["follow-up gentil", "No-Go", "escassez real"],
        "max_turns": 4
    },
    {
        "id": 20,
        "name": "Lead Retorna Após Sumir",
        "description": "Lead sumiu e volta depois de dias",
        "category": "followup",
        "lead_behavior": "ghost_return",
        "expected_agent_actions": ["acolher sem julgamento", "retomar contexto"],
        "max_turns": 5
    }
]


# ═══════════════════════════════════════════════════════════════════════════════
# LEAD GENÉRICO ADAPTÁVEL - PROMPT
# ═══════════════════════════════════════════════════════════════════════════════

ADAPTIVE_LEAD_SYSTEM_PROMPT = """# LEAD SIMULADO - GENÉRICO ADAPTÁVEL v1.0

## SEU PAPEL
Você é um **lead simulado** para testar agentes SDR/atendimento.
Você deve agir de forma REALISTA como um potencial cliente.

## REGRA DE OURO
- Você NÃO é um assistente
- Você É o cliente sendo atendido
- Responda como uma pessoa REAL responderia
- Use linguagem informal, abreviações, erros de digitação ocasionais
- Seja NATURAL, não robótico

## CONTEXTO DO TESTE
- **Tipo de Agente:** {agent_type}
- **Nome do Agente:** {agent_name}
- **Módulo de Teste:** {module_name}
- **Comportamento Esperado:** {lead_behavior}

## SEU PERFIL PARA ESTE TESTE
{lead_profile}

## INSTRUÇÕES DE COMPORTAMENTO

### Comportamentos por Tipo:

**greeting_only**: Apenas mande "oi", "bom dia", "olá". Seja breve.

**referral**: Mencione que um amigo indicou. Se perguntarem o nome, diga que prefere não passar ou seja vago.

**direct_price_ask**: Pergunte logo "quanto custa?" ou "qual o valor?". Seja direto.

**pain_expressed**: Descreva uma dor real (cansaço, frustração com peso, problemas financeiros). Seja emocional.

**vague_curious**: Diga "quero saber mais" sem dar detalhes. Force o agente a fazer perguntas.

**work_permit_flow**: Quando perguntarem sobre Work Permit, responda de acordo com o sub-cenário:
  - Se for testar CARREIRA: diga que TEM ou está tirando
  - Se for testar CONSULTORIA: diga que NÃO TEM e não pretende

**tried_competitors**: Diga que já tentou outros profissionais/soluções e não funcionou. Mostre frustração.

**remote_location**: Mencione que mora longe (outra cidade/estado). Questione se vale a pena.

**urgent_timeline**: Diga que precisa resolver urgente. Use palavras como "logo", "essa semana", "não posso esperar".

**long_timeline**: Diga que está "só pesquisando", "talvez no futuro", "não tenho pressa".

**price_objection**: Quando falarem preço, diga que está caro. Questione o valor. Não ceda fácil.

**think_about_it**: Diga "vou pensar" ou "depois te falo". Seja evasivo sobre o real motivo.

**spouse_objection**: Diga que precisa falar com marido/esposa antes de decidir.

**no_time_objection**: Diga que não tem tempo, agenda cheia, muito ocupado.

**trust_objection**: Questione credibilidade. Peça provas, depoimentos, garantias.

**ready_to_close**: Mostre interesse claro. Faça perguntas sobre próximos passos. Esteja pronto para fechar.

**accepts_and_schedules**: Aceite a proposta. Escolha um horário quando oferecerem. Confirme dados.

**last_minute_dropout**: Esteja quase fechando, mas desista. Invente uma desculpa vaga.

**scheduled_no_payment**: Aja como se tivesse agendado mas não pagou. Quando cobrarem, dê desculpa.

**ghost_return**: Aja como se tivesse sumido e voltou. Diga "oi, lembra de mim?" ou similar.

## FORMATO DE RESPOSTA
- Mensagens CURTAS (1-3 frases máximo)
- Linguagem de WhatsApp (informal)
- Pode usar emoji com moderação
- Pode ter erros de digitação ocasionais
- NUNCA explique que é um teste
- NUNCA quebre o personagem

## EXEMPLO DE RESPOSTAS REALISTAS
❌ ERRADO: "Olá! Estou interessado em saber mais sobre os serviços oferecidos pela sua empresa."
✅ CERTO: "oi! vi que vcs trabalham com isso, queria entender melhor"

❌ ERRADO: "Agradeço a explicação. Gostaria de agendar uma consulta."
✅ CERTO: "entendi... e como faz pra agendar?"

❌ ERRADO: "O valor está um pouco acima do meu orçamento no momento."
✅ CERTO: "nossa, ta caro hein 😅"
"""

LEAD_PROFILES = {
    "financial": """
### Perfil: Lead para Agente Financeiro
- **Nome:** Carlos ou Mariana (escolha um)
- **Idade:** 35-50 anos
- **Situação:** Brasileiro nos EUA ou interessado em ir
- **Dores possíveis:**
  - Medo do futuro financeiro
  - Não entende investimentos nos EUA
  - Quer proteger a família
  - Preocupado com aposentadoria
  - Frustrado com falta de planejamento
- **Perfil financeiro:** Classe média-alta, tem algum dinheiro mas não sabe onde colocar
- **Sotaque:** Português brasileiro, pode misturar inglês ocasionalmente
""",
    "clinic": """
### Perfil: Lead para Clínica de Nutrologia
- **Nome:** Marcos ou Fernanda (escolha um)
- **Idade:** 30-45 anos
- **Situação:** Mora no Brasil (pode ser de fora de Sinop)
- **Dores possíveis:**
  - Cansaço sem motivo
  - Dificuldade para perder peso
  - Corpo "não responde mais"
  - Já tentou nutris e não funcionou
  - Frustrado com dietas
- **Perfil:** Pessoa que cuida da saúde mas não vê resultado
- **Sotaque:** Português brasileiro
"""
}


# ═══════════════════════════════════════════════════════════════════════════════
# GROQ API CLIENT
# ═══════════════════════════════════════════════════════════════════════════════

class GroqClient:
    """Cliente para API Groq"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = GROQ_MODEL

    def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 500) -> str:
        """Enviar mensagem para Groq e obter resposta"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"[ERRO: {e}]"


# ═══════════════════════════════════════════════════════════════════════════════
# CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ConversationTurn:
    role: str  # "agent" or "lead"
    content: str
    timestamp: datetime
    turn_number: int


@dataclass
class TestResult:
    module_id: int
    module_name: str
    agent_name: str
    passed: bool
    score: float  # 0-100
    turns: int
    conversation: List[ConversationTurn]
    observations: List[str]
    errors: List[str]


class ConversationSimulator:
    def __init__(self, groq_api_key: str = None):
        # Supabase
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Groq
        self.groq = GroqClient(groq_api_key)

        # State
        self.agents_cache = {}

    def get_agent_config(self, agent_key: str) -> Dict:
        """Fetch agent config from Supabase"""
        if agent_key in self.agents_cache:
            return self.agents_cache[agent_key]

        agent_info = AGENTS.get(agent_key)
        if not agent_info:
            raise ValueError(f"Agente '{agent_key}' não encontrado")

        result = self.supabase.table('agent_versions').select('*').eq(
            'location_id', agent_info['location_id']
        ).eq('is_active', True).execute()

        if not result.data:
            raise ValueError(f"Nenhuma versão ativa para {agent_key}")

        config = result.data[0]
        config['agent_type'] = agent_info['type']
        self.agents_cache[agent_key] = config
        return config

    def build_lead_prompt(self, agent_config: Dict, module: Dict) -> str:
        """Build the adaptive lead prompt for a specific test"""
        agent_type = agent_config.get('agent_type', 'financial')
        lead_profile = LEAD_PROFILES.get(agent_type, LEAD_PROFILES['financial'])

        return ADAPTIVE_LEAD_SYSTEM_PROMPT.format(
            agent_type=agent_type,
            agent_name=agent_config.get('agent_name', 'Unknown'),
            module_name=module['name'],
            lead_behavior=module['lead_behavior'],
            lead_profile=lead_profile
        )

    def build_agent_prompt(self, agent_config: Dict, mode: str = None) -> str:
        """Build agent system prompt with mode-specific instructions"""
        system_prompt = agent_config.get('system_prompt', '')
        prompts_by_mode = agent_config.get('prompts_by_mode', {})

        # Determine mode
        if not mode:
            agent_type = agent_config.get('agent_type', 'financial')
            mode = 'sdr_carreira' if agent_type == 'financial' else 'sdr_inbound'

        mode_prompt = prompts_by_mode.get(mode, '')

        return f"{system_prompt}\n\n{mode_prompt}"

    def get_initial_lead_message(self, module: Dict) -> str:
        """Get initial message based on lead behavior"""
        behavior = module['lead_behavior']
        messages = {
            'greeting_only': "oi",
            'referral': "oi! um amigo meu falou de vcs, queria saber mais",
            'direct_price_ask': "oi, quanto custa?",
            'pain_expressed': "oi... to precisando de ajuda, to bem frustrado com minha situacao",
            'vague_curious': "oi, quero saber mais sobre o trabalho de vcs",
            'work_permit_flow': "oi! vi sobre os serviços, tenho interesse",
            'tried_competitors': "oi, ja tentei com outros profissionais e nao deu certo",
            'remote_location': "oi! vi que vcs atendem, mas moro longe... funciona mesmo?",
            'urgent_timeline': "oi preciso resolver isso logo, essa semana se possivel",
            'long_timeline': "oi, to só pesquisando por enquanto, sem pressa",
            'price_objection': "oi, quero saber mais mas ja adianto q to com budget apertado",
            'think_about_it': "oi, tava vendo sobre o serviço de vcs",
            'spouse_objection': "oi! me interessei mas tenho q ver com meu marido",
            'no_time_objection': "oi, agenda ta corrida mas queria entender como funciona",
            'trust_objection': "oi, vi sobre vcs... isso funciona mesmo? tem alguma garantia?",
            'ready_to_close': "oi! quero agendar, como faz?",
            'accepts_and_schedules': "oi! to pronto pra agendar, qual melhor horario?",
            'last_minute_dropout': "oi! pensei bem e quero agendar sim",
            'scheduled_no_payment': "oi! desculpa a demora, tive uns imprevistos",
            'ghost_return': "oi! lembra de mim? conversamos semana passada"
        }
        return messages.get(behavior, "oi, tudo bem?")

    def generate_lead_response(self, lead_prompt: str, conversation_history: List[Dict], module: Dict) -> str:
        """Generate lead response using Groq"""
        messages = [{"role": "system", "content": lead_prompt}]

        # Add conversation history
        for turn in conversation_history:
            role = "assistant" if turn['role'] == 'lead' else "user"
            messages.append({"role": role, "content": turn['content']})

        # Add instruction for response
        if conversation_history:
            messages.append({
                "role": "user",
                "content": f"Responda como o lead. Última mensagem do agente: \"{conversation_history[-1]['content']}\""
            })

        return self.groq.chat(messages, temperature=0.8)

    def generate_agent_response(self, agent_prompt: str, conversation_history: List[Dict]) -> str:
        """Generate agent response using Groq"""
        messages = [{"role": "system", "content": agent_prompt}]

        # Add conversation history
        for turn in conversation_history:
            role = "assistant" if turn['role'] == 'agent' else "user"
            messages.append({"role": role, "content": turn['content']})

        # Add instruction
        last_msg = conversation_history[-1]['content'] if conversation_history else "Conversa iniciada"
        messages.append({
            "role": "user",
            "content": f"Responda como o agente SDR. Mensagem do lead: \"{last_msg}\""
        })

        return self.groq.chat(messages, temperature=0.7)

    def evaluate_conversation(self, module: Dict, conversation: List[ConversationTurn], agent_config: Dict) -> Dict:
        """Evaluate the conversation against expected actions"""
        observations = []
        errors = []
        score = 100.0

        expected_actions = module.get('expected_agent_actions', [])
        conversation_text = "\n".join([f"{t.role}: {t.content}" for t in conversation])

        # Basic checks
        if len(conversation) < 2:
            errors.append("Conversa muito curta")
            score -= 30

        # Check for errors in conversation
        error_count = sum(1 for t in conversation if "[ERRO" in t.content)
        if error_count > 0:
            errors.append(f"{error_count} erros de API detectados")
            score -= error_count * 15

        # Check for expected behaviors (simplified heuristics)
        for action in expected_actions:
            action_lower = action.lower()
            conv_lower = conversation_text.lower()

            if "ou/ou" in action_lower or "binário" in action_lower:
                if " ou " in conv_lower or "qual " in conv_lower:
                    observations.append(f"✅ {action}")
                else:
                    observations.append(f"⚠️ Possível falta: {action}")
                    score -= 10

            elif "no-go" in action_lower:
                no_go_phrases = ["sem problema", "sem pressa", "tranquilo", "fique à vontade", "sem pressão"]
                if any(phrase in conv_lower for phrase in no_go_phrases):
                    observations.append(f"✅ {action}")
                else:
                    observations.append(f"⚠️ Possível falta: {action}")
                    score -= 10

            elif "reframe" in action_lower or "valor" in action_lower:
                value_phrases = ["inclui", "incluído", "na prática", "total", "investimento"]
                if any(phrase in conv_lower for phrase in value_phrases):
                    observations.append(f"✅ {action}")
                else:
                    observations.append(f"⚠️ Possível falta: {action}")
                    score -= 10

            elif "pergunta" in action_lower:
                # Check if agent is asking questions
                agent_turns = [t for t in conversation if t.role == 'agent']
                questions = sum(1 for t in agent_turns if '?' in t.content)
                if questions >= 1:
                    observations.append(f"✅ {action} ({questions} perguntas)")
                else:
                    observations.append(f"⚠️ Possível falta: {action}")
                    score -= 10

            else:
                observations.append(f"ℹ️ Verificar: {action}")

        return {
            "passed": score >= 60 and error_count == 0,
            "score": max(0, score),
            "observations": observations,
            "errors": errors
        }

    def run_module(self, agent_key: str, module: Dict, verbose: bool = True) -> TestResult:
        """Run a single test module"""
        agent_config = self.get_agent_config(agent_key)

        # Check if module applies to this agent type
        allowed_types = module.get('agent_types', ['financial', 'clinic'])
        if agent_config['agent_type'] not in allowed_types:
            return TestResult(
                module_id=module['id'],
                module_name=module['name'],
                agent_name=agent_config['agent_name'],
                passed=True,
                score=100,
                turns=0,
                conversation=[],
                observations=["⏭️ Módulo não aplicável a este tipo de agente"],
                errors=[]
            )

        # Build prompts
        lead_prompt = self.build_lead_prompt(agent_config, module)
        agent_prompt = self.build_agent_prompt(agent_config)

        conversation_history = []
        conversation_turns = []
        max_turns = module.get('max_turns', 6)

        if verbose:
            print(f"\n{'='*60}")
            print(f"📝 Módulo {module['id']}: {module['name']}")
            print(f"🤖 Agente: {agent_config['agent_name']}")
            print(f"{'='*60}\n")

        # Initial lead message
        initial_msg = self.get_initial_lead_message(module)
        conversation_history.append({"role": "lead", "content": initial_msg})
        conversation_turns.append(ConversationTurn(
            role="lead",
            content=initial_msg,
            timestamp=datetime.now(),
            turn_number=0
        ))

        if verbose:
            print(f"👤 LEAD: {initial_msg}")

        # Simulate conversation
        for turn_num in range(max_turns):
            time.sleep(0.3)  # Rate limiting

            # Agent turn
            agent_msg = self.generate_agent_response(agent_prompt, conversation_history)
            conversation_history.append({"role": "agent", "content": agent_msg})
            conversation_turns.append(ConversationTurn(
                role="agent",
                content=agent_msg,
                timestamp=datetime.now(),
                turn_number=turn_num * 2 + 1
            ))

            if verbose:
                print(f"🤖 AGENTE: {agent_msg}\n")

            # Check for conversation end signals
            end_signals = ["pix", "comprovante", "agendado", "confirmado", "tchau", "obrigado"]
            if any(signal in agent_msg.lower() for signal in end_signals):
                break

            # Check for errors
            if "[ERRO" in agent_msg:
                break

            time.sleep(0.3)  # Rate limiting

            # Lead turn
            lead_msg = self.generate_lead_response(lead_prompt, conversation_history, module)
            conversation_history.append({"role": "lead", "content": lead_msg})
            conversation_turns.append(ConversationTurn(
                role="lead",
                content=lead_msg,
                timestamp=datetime.now(),
                turn_number=turn_num * 2 + 2
            ))

            if verbose:
                print(f"👤 LEAD: {lead_msg}")

            if "[ERRO" in lead_msg:
                break

        # Evaluate
        evaluation = self.evaluate_conversation(module, conversation_turns, agent_config)

        return TestResult(
            module_id=module['id'],
            module_name=module['name'],
            agent_name=agent_config['agent_name'],
            passed=evaluation['passed'],
            score=evaluation['score'],
            turns=len(conversation_turns),
            conversation=conversation_turns,
            observations=evaluation['observations'],
            errors=evaluation['errors']
        )

    def run_all_modules(self, agent_key: str, verbose: bool = True) -> List[TestResult]:
        """Run all 20 modules for an agent"""
        results = []

        for module in TEST_MODULES:
            try:
                result = self.run_module(agent_key, module, verbose)
                results.append(result)

                if verbose:
                    status = "✅ PASSOU" if result.passed else "❌ FALHOU"
                    print(f"\n{status} - Score: {result.score:.0f}/100")
                    for obs in result.observations:
                        print(f"  {obs}")

            except Exception as e:
                print(f"❌ ERRO no módulo {module['id']}: {e}")
                results.append(TestResult(
                    module_id=module['id'],
                    module_name=module['name'],
                    agent_name=agent_key,
                    passed=False,
                    score=0,
                    turns=0,
                    conversation=[],
                    observations=[],
                    errors=[str(e)]
                ))

        return results


# ═══════════════════════════════════════════════════════════════════════════════
# REPORT GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

def generate_report(all_results: Dict[str, List[TestResult]], output_path: str = None):
    """Generate markdown report"""
    report_lines = [
        "# 📊 Relatório de Testes - Conversation Simulator",
        f"\n**Data:** {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        f"\n**Modelo:** {GROQ_MODEL}",
        "\n---\n",
        "## Resumo Geral\n",
        "| Agente | Passou | Falhou | Score Médio |",
        "|--------|--------|--------|-------------|"
    ]

    for agent_key, results in all_results.items():
        passed = sum(1 for r in results if r.passed)
        failed = len(results) - passed
        avg_score = sum(r.score for r in results) / len(results) if results else 0
        agent_name = AGENTS.get(agent_key, {}).get('name', agent_key)
        report_lines.append(f"| {agent_name} | {passed} | {failed} | {avg_score:.1f} |")

    report_lines.append("\n---\n")

    # Detailed results per agent
    for agent_key, results in all_results.items():
        agent_name = AGENTS.get(agent_key, {}).get('name', agent_key)
        report_lines.append(f"\n## {agent_name}\n")
        report_lines.append("| # | Módulo | Status | Score | Turnos | Observações |")
        report_lines.append("|---|--------|--------|-------|--------|-------------|")

        for r in results:
            status = "✅" if r.passed else "❌"
            obs = "; ".join(r.observations[:2]) if r.observations else "-"
            obs_truncated = obs[:40] + "..." if len(obs) > 40 else obs
            report_lines.append(f"| {r.module_id} | {r.module_name} | {status} | {r.score:.0f} | {r.turns} | {obs_truncated} |")

        # Add conversation samples for failed tests
        failed_tests = [r for r in results if not r.passed]
        if failed_tests:
            report_lines.append(f"\n### Conversas com Falha\n")
            for r in failed_tests[:3]:  # Max 3 samples
                report_lines.append(f"\n#### Módulo {r.module_id}: {r.module_name}\n")
                report_lines.append("```")
                for turn in r.conversation[:6]:  # Max 6 turns
                    emoji = "👤" if turn.role == "lead" else "🤖"
                    report_lines.append(f"{emoji} {turn.role.upper()}: {turn.content[:100]}")
                report_lines.append("```")

    report = "\n".join(report_lines)

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            f.write(report)
        print(f"\n📄 Relatório salvo em: {output_path}")

    return report


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Simulador de Conversas para Agentes SDR (Groq)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python conversation_simulator.py                     # Todos agentes, todos módulos
  python conversation_simulator.py --agent milton     # Só Milton
  python conversation_simulator.py --module 11        # Só módulo 11 (objeção preço)
  python conversation_simulator.py --list-modules     # Listar módulos
  python conversation_simulator.py --quick            # Teste rápido (módulos 1,11,16)
        """
    )

    parser.add_argument('--agent', '-a', choices=list(AGENTS.keys()),
                        help='Agente específico para testar')
    parser.add_argument('--module', '-m', type=int, choices=range(1, 21),
                        help='Módulo específico (1-20)')
    parser.add_argument('--list-modules', '-l', action='store_true',
                        help='Listar todos os módulos')
    parser.add_argument('--quick', '-q', action='store_true',
                        help='Teste rápido (módulos 1, 11, 16)')
    parser.add_argument('--quiet', action='store_true',
                        help='Modo silencioso (só relatório final)')
    parser.add_argument('--output', '-o', default='reports/simulation_report.md',
                        help='Arquivo de saída do relatório')

    args = parser.parse_args()

    # List modules
    if args.list_modules:
        print("\n📋 MÓDULOS DE TESTE DISPONÍVEIS\n")
        print(f"{'ID':<4} {'Nome':<35} {'Categoria':<15}")
        print("-" * 60)
        for m in TEST_MODULES:
            print(f"{m['id']:<4} {m['name']:<35} {m['category']:<15}")
        return

    # Initialize simulator
    try:
        simulator = ConversationSimulator()
        print(f"🚀 Usando modelo: {GROQ_MODEL}")
    except Exception as e:
        print(f"❌ Erro ao inicializar: {e}")
        sys.exit(1)

    verbose = not args.quiet
    all_results = {}

    # Determine which agents and modules to run
    agents_to_test = [args.agent] if args.agent else list(AGENTS.keys())

    if args.module:
        modules_to_test = [m for m in TEST_MODULES if m['id'] == args.module]
    elif args.quick:
        modules_to_test = [m for m in TEST_MODULES if m['id'] in [1, 11, 16]]
    else:
        modules_to_test = TEST_MODULES

    # Run tests
    for agent_key in agents_to_test:
        print(f"\n{'#'*60}")
        print(f"# TESTANDO: {AGENTS[agent_key]['name']}")
        print(f"{'#'*60}")

        results = []
        for module in modules_to_test:
            try:
                result = simulator.run_module(agent_key, module, verbose)
                results.append(result)

                if verbose:
                    status = "✅ PASSOU" if result.passed else "❌ FALHOU"
                    print(f"\n{status} - Score: {result.score:.0f}/100")
                    for obs in result.observations:
                        print(f"  {obs}")

            except Exception as e:
                print(f"❌ ERRO: {e}")

        all_results[agent_key] = results

    # Generate report
    report = generate_report(all_results, args.output)

    # Summary
    print("\n" + "="*60)
    print("📊 RESUMO FINAL")
    print("="*60)

    for agent_key, results in all_results.items():
        passed = sum(1 for r in results if r.passed)
        total = len(results)
        avg_score = sum(r.score for r in results) / total if total else 0
        print(f"  {AGENTS[agent_key]['name']}: {passed}/{total} ({avg_score:.1f}%)")


if __name__ == "__main__":
    main()
