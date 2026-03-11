"""
Agent 13 - Conversation Collector
=================================
Coleta conversas reais do Supabase para analise de QA.
Equivalente ao primeiro passo do workflow 08-QA-Analyst.

Responsabilidades:
- Buscar conversas nao analisadas
- Agrupar mensagens por session_id
- Preparar dados para o QA Analyzer
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

from supabase import create_client, Client

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)

# Supabase config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')


@dataclass
class ConversationData:
    """Estrutura de uma conversa coletada"""
    session_id: str
    location_id: str
    agent_version_id: Optional[str]
    agent_name: Optional[str]
    messages: List[Dict]
    total_messages: int
    human_messages: int
    ai_messages: int
    started_at: datetime
    ended_at: Optional[datetime]
    last_message_type: str
    contact_id: Optional[str]


class ConversationCollectorAgent(BaseAgent):
    """
    Agente que coleta conversas do Supabase para analise.

    Nao usa IA - apenas consulta banco de dados e prepara dados.

    Inputs:
    - location_id: (opcional) filtrar por location
    - agent_version_id: (opcional) filtrar por agente
    - hours_back: quantas horas atras buscar (default: 48)
    - min_messages: minimo de mensagens para considerar (default: 4)
    - limit: maximo de conversas (default: 50)
    - only_unanalyzed: apenas conversas nao analisadas (default: True)

    Outputs:
    - conversations: Lista de ConversationData
    - total_found: Total de conversas encontradas
    - filters_applied: Filtros utilizados
    """

    # Nao precisa de system prompt pois nao usa IA
    _SYSTEM_PROMPT = "N/A - Este agente nao usa IA"

    @property
    def system_prompt(self) -> str:
        return self._SYSTEM_PROMPT

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="ConversationCollector",
                description="Coleta conversas do Supabase para analise QA",
                model="none",  # Nao usa modelo
                temperature=0,
                max_tokens=0
            )

        # Inicializar sem chamar Claude (nao precisa de API key)
        self.config = config
        self.shared_memory = {}
        self.execution_history = []

        # Supabase client
        self.supabase = self._get_supabase_client()

        logger.info(f"Initialized agent: {config.name}")

    def _get_supabase_client(self) -> Optional[Client]:
        """Retorna cliente Supabase configurado"""
        if not SUPABASE_KEY:
            logger.warning("SUPABASE_SERVICE_KEY nao configurada")
            return None
        return create_client(SUPABASE_URL, SUPABASE_KEY)

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Coleta conversas do Supabase.

        Args:
            input_data: {
                "location_id": str (opcional),
                "agent_version_id": str (opcional),
                "hours_back": int (default: 48),
                "min_messages": int (default: 4),
                "limit": int (default: 50),
                "only_unanalyzed": bool (default: True)
            }
        """
        start_time = datetime.utcnow()

        try:
            if not self.supabase:
                raise ValueError("Supabase client nao configurado")

            # Extrair parametros
            location_id = input_data.get('location_id')
            agent_version_id = input_data.get('agent_version_id')
            hours_back = input_data.get('hours_back', 48)
            min_messages = input_data.get('min_messages', 4)
            limit = input_data.get('limit', 50)
            only_unanalyzed = input_data.get('only_unanalyzed', True)

            # Coletar conversas
            conversations = await self._collect_conversations(
                location_id=location_id,
                agent_version_id=agent_version_id,
                hours_back=hours_back,
                min_messages=min_messages,
                limit=limit,
                only_unanalyzed=only_unanalyzed
            )

            # Preparar output
            output = {
                'conversations': [self._conversation_to_dict(c) for c in conversations],
                'total_found': len(conversations),
                'filters_applied': {
                    'location_id': location_id,
                    'agent_version_id': agent_version_id,
                    'hours_back': hours_back,
                    'min_messages': min_messages,
                    'limit': limit,
                    'only_unanalyzed': only_unanalyzed
                },
                'summary': {
                    'total_conversations': len(conversations),
                    'total_messages': sum(c.total_messages for c in conversations),
                    'locations': list(set(c.location_id for c in conversations)),
                    'agents': list(set(c.agent_name for c in conversations if c.agent_name))
                }
            }

            # Salvar na memoria compartilhada
            self.set_in_memory('collected_conversations', conversations)
            self.set_in_memory('collection_summary', output['summary'])

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=output,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,  # Nao usa IA
                model="supabase",
                metadata={'total_conversations': len(conversations)}
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"ConversationCollector failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model="supabase",
                error=str(e)
            )

    async def _collect_conversations(
        self,
        location_id: Optional[str] = None,
        agent_version_id: Optional[str] = None,
        hours_back: int = 48,
        min_messages: int = 4,
        limit: int = 50,
        only_unanalyzed: bool = True
    ) -> List[ConversationData]:
        """
        Coleta conversas do Supabase.

        Busca em n8n_historico_mensagens e agrupa por session_id.
        """
        conversations = []

        # Calcular data limite
        since = datetime.utcnow() - timedelta(hours=hours_back)

        # Buscar session_ids distintos com filtros
        query = self.supabase.table('n8n_historico_mensagens') \
            .select('session_id, location_id, created_at') \
            .gte('created_at', since.isoformat())

        if location_id:
            query = query.eq('location_id', location_id)

        # Executar query para pegar sessions
        result = query.order('created_at', desc=True).limit(500).execute()

        if not result.data:
            logger.info("Nenhuma mensagem encontrada no periodo")
            return []

        # Agrupar por session_id
        sessions = {}
        for row in result.data:
            sid = row['session_id']
            if sid not in sessions:
                sessions[sid] = {
                    'session_id': sid,
                    'location_id': row['location_id'],
                    'first_seen': row['created_at']
                }

        logger.info(f"Encontradas {len(sessions)} sessions unicas")

        # Para cada session, buscar mensagens completas
        processed = 0
        for session_id, session_info in sessions.items():
            if processed >= limit:
                break

            # Buscar mensagens da session
            msgs_result = self.supabase.table('n8n_historico_mensagens') \
                .select('*') \
                .eq('session_id', session_id) \
                .order('created_at', desc=False) \
                .execute()

            messages = msgs_result.data or []

            # Filtrar por minimo de mensagens
            if len(messages) < min_messages:
                continue

            # Verificar se ja foi analisada (se only_unanalyzed)
            if only_unanalyzed:
                try:
                    qa_check = self.supabase.table('qa_analyses') \
                        .select('id') \
                        .eq('session_id', session_id) \
                        .limit(1) \
                        .execute()

                    if qa_check.data:
                        continue  # Ja analisada
                except Exception as e:
                    # Tabela pode nao existir ou ter schema diferente
                    logger.debug(f"Ignorando check de qa_analyses: {e}")
                    pass

            # Processar mensagens
            human_count = 0
            ai_count = 0
            parsed_messages = []

            for msg in messages:
                msg_data = msg.get('message', {})
                msg_type = msg_data.get('type', 'unknown')
                msg_content = msg_data.get('content', '')

                if msg_type == 'human':
                    human_count += 1
                elif msg_type == 'ai':
                    ai_count += 1

                parsed_messages.append({
                    'type': msg_type,
                    'content': msg_content,
                    'created_at': msg.get('created_at'),
                    'raw': msg_data
                })

            # Buscar agent_version associado (se existir)
            agent_info = self._get_agent_info(session_info['location_id'])

            # Criar ConversationData
            conversation = ConversationData(
                session_id=session_id,
                location_id=session_info['location_id'],
                agent_version_id=agent_info.get('id') if agent_info else None,
                agent_name=agent_info.get('agent_name') if agent_info else None,
                messages=parsed_messages,
                total_messages=len(parsed_messages),
                human_messages=human_count,
                ai_messages=ai_count,
                started_at=datetime.fromisoformat(messages[0]['created_at'].replace('Z', '+00:00')) if messages else datetime.utcnow(),
                ended_at=datetime.fromisoformat(messages[-1]['created_at'].replace('Z', '+00:00')) if messages else None,
                last_message_type=parsed_messages[-1]['type'] if parsed_messages else 'unknown',
                contact_id=None  # Pode ser adicionado se necessario
            )

            conversations.append(conversation)
            processed += 1

        logger.info(f"Coletadas {len(conversations)} conversas para analise")
        return conversations

    def _get_agent_info(self, location_id: str) -> Optional[Dict]:
        """Busca informacoes do agente pelo location_id"""
        try:
            result = self.supabase.table('agent_versions') \
                .select('id, agent_name, version, system_prompt') \
                .eq('location_id', location_id) \
                .eq('is_active', True) \
                .limit(1) \
                .execute()

            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.warning(f"Erro ao buscar agent_info: {e}")
            return None

    def _conversation_to_dict(self, conv: ConversationData) -> Dict:
        """Converte ConversationData para dict serializavel"""
        return {
            'session_id': conv.session_id,
            'location_id': conv.location_id,
            'agent_version_id': conv.agent_version_id,
            'agent_name': conv.agent_name,
            'messages': conv.messages,
            'total_messages': conv.total_messages,
            'human_messages': conv.human_messages,
            'ai_messages': conv.ai_messages,
            'started_at': conv.started_at.isoformat() if conv.started_at else None,
            'ended_at': conv.ended_at.isoformat() if conv.ended_at else None,
            'last_message_type': conv.last_message_type,
            'contact_id': conv.contact_id
        }

    def _parse_response(self, raw_response: str) -> Dict:
        """Nao usado - agente nao usa IA"""
        return {}

    def _measure_time(self, start: datetime) -> int:
        """Calcula tempo de execucao em ms"""
        return int((datetime.utcnow() - start).total_seconds() * 1000)

    def get_from_memory(self, key: str, default=None):
        """Obtem valor da memoria compartilhada"""
        return self.shared_memory.get(key, default)

    def set_in_memory(self, key: str, value):
        """Define valor na memoria compartilhada"""
        self.shared_memory[key] = value

    def log_execution(self, result: AgentResult):
        """Registra execucao no historico"""
        self.execution_history.append(result)
        logger.info(
            f"Agent {result.agent_name}: "
            f"success={result.success}, "
            f"time={result.execution_time_ms}ms"
        )
