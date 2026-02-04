"""
Agent 01 - Extrator de Dados GHL
================================
Extrai informações de contatos e conversas do GoHighLevel.
Equivalente ao Workflow 01 do n8n.
"""

import logging
from typing import Dict, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class DataExtractorAgent(BaseAgent):
    """
    Agente que extrai e estrutura dados do GoHighLevel.

    Inputs:
    - contact_id: ID do contato no GHL
    - location_id: ID da location no GHL

    Outputs:
    - contact_info: Dados do contato (nome, email, telefone, etc)
    - conversation: Histórico de mensagens
    - context: Contexto extraído da conversa
    """

    SYSTEM_PROMPT = """# Agente Extrator de Dados

Você é um especialista em extrair e estruturar informações de conversas de vendas.

## Sua Tarefa

Dado um histórico de conversa e dados de contato, você deve:

1. **Estruturar informações do contato**
   - Nome completo
   - Telefone
   - Email
   - Origem/Fonte (como chegou)
   - Tags relevantes

2. **Analisar a conversa**
   - Identificar o interesse principal
   - Extrair perguntas feitas
   - Identificar objeções mencionadas
   - Notar sinais de interesse/desinteresse

3. **Gerar contexto resumido**
   - Resumo da situação do lead
   - Estágio no funil (topo, meio, fundo)
   - Próximos passos sugeridos

## Formato de Saída

Retorne um JSON estruturado:

```json
{
    "contact": {
        "id": "string",
        "name": "string",
        "phone": "string",
        "email": "string",
        "source": "string",
        "tags": ["string"]
    },
    "conversation": {
        "message_count": number,
        "last_message_at": "datetime",
        "messages": [
            {"role": "lead/agent", "content": "string", "timestamp": "datetime"}
        ]
    },
    "analysis": {
        "main_interest": "string",
        "questions_asked": ["string"],
        "objections": ["string"],
        "interest_signals": ["string"],
        "disinterest_signals": ["string"]
    },
    "context": {
        "summary": "string",
        "funnel_stage": "top/middle/bottom",
        "next_steps": ["string"],
        "priority": "high/medium/low"
    }
}
```

Seja preciso e objetivo. Extraia apenas informações presentes nos dados.
"""

    def __init__(
        self,
        config: AgentConfig = None,
        api_key: str = None,
        shared_memory: Dict = None,
        ghl_client = None  # Injetado externamente
    ):
        config = config or AgentConfig(
            name="DataExtractor",
            description="Extrai dados de contato e conversa do GHL",
            model="claude-sonnet-4-20250514",
            temperature=0.3,
            max_tokens=2000
        )
        super().__init__(config, api_key, shared_memory)
        self.ghl_client = ghl_client

    @property
    def system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa extração de dados.

        Args:
            input_data: {
                "contact_id": str,
                "location_id": str,
                "raw_contact": Dict (opcional - se já tiver dados),
                "raw_conversation": List[Dict] (opcional)
            }
        """
        start_time = datetime.utcnow()

        try:
            contact_id = input_data.get('contact_id')
            location_id = input_data.get('location_id')

            # Obter dados do GHL ou usar dados fornecidos
            raw_contact = input_data.get('raw_contact')
            raw_conversation = input_data.get('raw_conversation')

            if not raw_contact and self.ghl_client:
                raw_contact = await self._fetch_contact(contact_id, location_id)

            if not raw_conversation and self.ghl_client:
                raw_conversation = await self._fetch_conversation(contact_id, location_id)

            # Preparar prompt com dados
            user_message = self._build_extraction_prompt(raw_contact, raw_conversation)

            # Chamar Claude
            response_text, tokens_used = await self.call_claude(user_message)

            # Parsear resposta
            extracted_data = self._parse_response(response_text)

            # Salvar na memória compartilhada
            self.set_in_memory('contact_data', extracted_data.get('contact'))
            self.set_in_memory('conversation_data', extracted_data.get('conversation'))
            self.set_in_memory('analysis_data', extracted_data.get('analysis'))
            self.set_in_memory('context_data', extracted_data.get('context'))

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=extracted_data,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=tokens_used,
                model=self.config.model,
                metadata={
                    'contact_id': contact_id,
                    'message_count': len(raw_conversation or [])
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"DataExtractor failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    def _build_extraction_prompt(
        self,
        contact: Dict,
        conversation: list
    ) -> str:
        """Monta prompt com dados para extração"""

        contact_str = ""
        if contact:
            contact_str = f"""
## Dados do Contato

- ID: {contact.get('id', 'N/A')}
- Nome: {contact.get('firstName', '')} {contact.get('lastName', '')}
- Telefone: {contact.get('phone', 'N/A')}
- Email: {contact.get('email', 'N/A')}
- Fonte: {contact.get('source', 'N/A')}
- Tags: {', '.join(contact.get('tags', []))}
- Custom Fields: {contact.get('customFields', {})}
"""

        conversation_str = ""
        if conversation:
            conversation_str = "\n## Histórico de Conversa\n\n"
            for msg in conversation[-30:]:  # Últimas 30 mensagens
                role = "Lead" if msg.get('direction') == 'inbound' else "Agente"
                content = msg.get('body', msg.get('message', ''))
                timestamp = msg.get('dateAdded', msg.get('timestamp', ''))
                conversation_str += f"**{role}** ({timestamp}):\n{content}\n\n---\n"

        return f"""Analise os seguintes dados e extraia informações estruturadas:

{contact_str}

{conversation_str}

Retorne o JSON estruturado conforme as instruções.
"""

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta do Claude"""
        parsed = self._extract_json(raw_response)

        if parsed:
            return parsed

        # Fallback: estrutura mínima
        logger.warning("Could not parse response, using fallback structure")
        return {
            'contact': {},
            'conversation': {'message_count': 0, 'messages': []},
            'analysis': {'main_interest': 'Não identificado'},
            'context': {'summary': raw_response[:500], 'funnel_stage': 'unknown'}
        }

    async def _fetch_contact(self, contact_id: str, location_id: str) -> Dict:
        """Busca contato no GHL"""
        if not self.ghl_client:
            return {}

        try:
            return await self.ghl_client.get_contact(contact_id)
        except Exception as e:
            logger.error(f"Error fetching contact: {e}")
            return {}

    async def _fetch_conversation(self, contact_id: str, location_id: str) -> list:
        """Busca conversa no GHL"""
        if not self.ghl_client:
            return []

        try:
            return await self.ghl_client.get_conversation(contact_id)
        except Exception as e:
            logger.error(f"Error fetching conversation: {e}")
            return []
