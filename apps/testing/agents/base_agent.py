"""
Base Agent - Classe base para todos os agentes
===============================================
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field

import anthropic

logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """Configuração de um agente"""
    name: str
    description: str
    model: str = "claude-sonnet-4-20250514"  # Sonnet 4 para agents
    temperature: float = 0.7
    max_tokens: int = 4000
    timeout_seconds: int = 120
    tools: List[Dict] = field(default_factory=list)


@dataclass
class AgentResult:
    """Resultado de execução de um agente"""
    agent_name: str
    success: bool
    output: Dict[str, Any]
    execution_time_ms: int
    tokens_used: int
    model: str
    error: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            'agent_name': self.agent_name,
            'success': self.success,
            'output': self.output,
            'execution_time_ms': self.execution_time_ms,
            'tokens_used': self.tokens_used,
            'model': self.model,
            'error': self.error,
            'metadata': self.metadata
        }


class BaseAgent(ABC):
    """
    Classe base para todos os agentes do AI Factory.

    Cada agente implementa:
    - system_prompt: Instruções do agente
    - execute(): Lógica principal
    - _parse_response(): Parser da resposta do Claude
    """

    def __init__(
        self,
        config: AgentConfig,
        api_key: str = None,
        shared_memory: Dict = None
    ):
        self.config = config
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        self.shared_memory = shared_memory or {}

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.execution_history: List[AgentResult] = []

        logger.info(f"Initialized agent: {config.name}")

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt do agente. Deve ser implementado por subclasses."""
        pass

    @abstractmethod
    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa a lógica principal do agente.
        Deve ser implementado por subclasses.
        """
        pass

    @abstractmethod
    def _parse_response(self, raw_response: str) -> Dict:
        """
        Parseia a resposta do Claude.
        Deve ser implementado por subclasses.
        """
        pass

    async def call_claude(
        self,
        user_message: str,
        system: str = None,
        tools: List[Dict] = None,
        use_streaming: bool = True
    ) -> tuple[str, int]:
        """
        Chama Claude API e retorna resposta + tokens usados.
        Usa streaming por padrão para operações longas.
        """
        system_prompt = system or self.system_prompt

        try:
            kwargs = {
                "model": self.config.model,
                "max_tokens": self.config.max_tokens,
                "temperature": self.config.temperature,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_message}]
            }

            if tools:
                kwargs["tools"] = tools

            if use_streaming:
                # Usar streaming para operações longas
                response_text = ""
                input_tokens = 0
                output_tokens = 0

                with self.client.messages.stream(**kwargs) as stream:
                    for text in stream.text_stream:
                        response_text += text

                    # Obter usage do final
                    final_message = stream.get_final_message()
                    input_tokens = final_message.usage.input_tokens
                    output_tokens = final_message.usage.output_tokens

                tokens_used = input_tokens + output_tokens
                return response_text, tokens_used
            else:
                # Modo sem streaming (para operações rápidas)
                response = self.client.messages.create(**kwargs)

                response_text = ""
                for block in response.content:
                    if hasattr(block, 'text'):
                        response_text += block.text

                tokens_used = response.usage.input_tokens + response.usage.output_tokens
                return response_text, tokens_used

        except Exception as e:
            logger.error(f"Error calling Claude: {e}")
            raise

    def get_from_memory(self, key: str, default: Any = None) -> Any:
        """Obtém valor da memória compartilhada"""
        return self.shared_memory.get(key, default)

    def set_in_memory(self, key: str, value: Any):
        """Define valor na memória compartilhada"""
        self.shared_memory[key] = value
        logger.debug(f"Set memory[{key}] = {type(value)}")

    def log_execution(self, result: AgentResult):
        """Registra execução no histórico"""
        self.execution_history.append(result)
        logger.info(
            f"Agent {result.agent_name}: "
            f"success={result.success}, "
            f"time={result.execution_time_ms}ms, "
            f"tokens={result.tokens_used}"
        )

    def _extract_json(self, text: str) -> Optional[Dict]:
        """Extrai JSON de uma resposta de texto"""
        try:
            # Tentar encontrar bloco JSON
            json_start = text.find('```json')
            if json_start != -1:
                json_end = text.find('```', json_start + 7)
                if json_end != -1:
                    json_str = text[json_start + 7:json_end].strip()
                    return json.loads(json_str)

            # Tentar parse direto
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = text[json_start:json_end]
                return json.loads(json_str)

            return None

        except json.JSONDecodeError:
            return None

    def _measure_time(self, start: datetime) -> int:
        """Calcula tempo de execução em ms"""
        return int((datetime.utcnow() - start).total_seconds() * 1000)


class ToolDefinition:
    """Helper para definir tools do Claude"""

    @staticmethod
    def create(
        name: str,
        description: str,
        parameters: Dict[str, Any]
    ) -> Dict:
        return {
            "name": name,
            "description": description,
            "input_schema": {
                "type": "object",
                "properties": parameters,
                "required": list(parameters.keys())
            }
        }
