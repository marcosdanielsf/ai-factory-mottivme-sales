"""
Agent 12 - Prompt Factory (Fábrica de Agentes Modulares)
========================================================
Cria agentes completos no formato Growth OS com 7 prompts por modo.

Baseado no template Isabella v6.6 - gera:
- system_prompt (personalidade base)
- prompts_by_mode (7 modos operacionais)
- business_config
- personality_config
- SQL pronto para inserir no Supabase

Uso:
    agent = PromptFactoryAgent()
    result = await agent.create_agent_from_profile(
        profile_path="/path/to/cliente.txt",
        location_id="xxx",
        calendar_id="yyy"
    )
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


# Os 7 modos operacionais do Growth OS
GROWTH_OS_MODES = [
    "sdr_inbound",
    "social_seller_instagram",
    "scheduler",
    "concierge",
    "followuper",
    "objection_handler",
    "reativador_base"
]


class PromptFactoryAgent(BaseAgent):
    """
    Fábrica de Agentes - Cria agentes completos no formato Growth OS.

    Input: Arquivo de perfil do cliente (texto livre com informações do negócio)
    Output: SQL completo para inserir no Supabase (agent_versions)

    Gera:
    - system_prompt: Personalidade base do agente
    - prompts_by_mode: 7 prompts específicos por modo
    - business_config: Configurações do negócio
    - personality_config: Tom de voz, bordões, vocabulário
    """

    SYSTEM_PROMPT = """# Prompt Factory - Gerador de Agentes Growth OS

Você é um ARQUITETO DE AGENTES especialista em criar chatbots de vendas de alta conversão.

## SUA MISSÃO

Transformar informações brutas sobre um cliente/negócio em um AGENTE COMPLETO com:
1. **system_prompt**: Personalidade base (quem é o agente, valores, tom)
2. **prompts_by_mode**: 7 prompts específicos para cada modo operacional
3. **business_config**: Dados factuais do negócio
4. **personality_config**: Tom, bordões, vocabulário

## OS 7 MODOS OPERACIONAIS (Growth OS)

### 1. SDR_INBOUND
- **Objetivo**: Qualificar leads que chegam por anúncios/tráfego
- **Foco**: BANT sutil, descoberta de dor, transição para agendamento
- **Tom**: Curioso, acolhedor, consultivo

### 2. SOCIAL_SELLER_INSTAGRAM
- **Objetivo**: Converter seguidores/engajados em leads qualificados
- **Foco**: Conexão genuína, valor antes de vender, DMs personalizadas
- **Tom**: Amigável, interessado, não vendedor

### 3. SCHEDULER
- **Objetivo**: Coletar dados e agendar consulta/reunião
- **Foco**: Nome, telefone, email, pagamento (se aplicável), data/hora
- **Tom**: Prático, eficiente, facilitador

### 4. CONCIERGE
- **Objetivo**: Garantir comparecimento (show rate)
- **Foco**: Lembretes, preparação, expectativas, valor da consulta
- **Tom**: Cuidadoso, prestativo, antecipatório

### 5. FOLLOWUPER
- **Objetivo**: Reativar leads que sumiram no funil
- **Foco**: Retomar sem pressão, entender contexto, requalificar
- **Tom**: Respeitoso, curioso, sem cobrança

### 6. OBJECTION_HANDLER
- **Objetivo**: Contornar objeções (preço, tempo, marido, etc)
- **Foco**: Validar, ressignificar, mostrar valor, não forçar
- **Tom**: Empático, paciente, estratégico

### 7. REATIVADOR_BASE
- **Objetivo**: Despertar lista fria/antiga
- **Foco**: Gancho de novidade, oferta especial, reconexão
- **Tom**: Direto, curto, com gancho forte

## ESTRUTURA DO SYSTEM_PROMPT

```markdown
# [NOME DO AGENTE] - [VERSÃO]

## IDENTIDADE
[Quem é, papel, missão]

## CONTEXTO DO NEGÓCIO
[Sobre o cliente/empresa]

## VALORES E CRENÇAS
[O que acredita, defende, não tolera]

## TOM DE VOZ
[Como fala, estilo, personalidade]

## BORDÕES E EXPRESSÕES
[Frases características que usa]

## VOCABULÁRIO PREFERIDO
[Termos que usa vs termos que evita]

## REGRAS UNIVERSAIS
[Aplicam a todos os modos]

## REGRA ANTI-LOOP
[Como lidar com respostas monossilábicas]
```

## ESTRUTURA DE CADA MODO (prompts_by_mode)

```markdown
## MODO: [NOME_DO_MODO]

### OBJETIVO
[O que deve alcançar neste modo]

### ETAPAS
1. [Etapa 1]
2. [Etapa 2]
...

### TÉCNICAS
- [Técnica 1]
- [Técnica 2]

### TRANSIÇÕES
- Para [modo_destino]: Quando [condição]

### EXEMPLOS (Few-Shot)
**Lead**: [mensagem]
**Agente**: [resposta ideal]

### REGRAS ESPECÍFICAS
- [Regra 1]
- [Regra 2]
```

## PROCESSO DE CRIAÇÃO

### 1. EXTRAIR DO PERFIL
- Nome do profissional/empresa
- Nicho/especialidade
- Público-alvo (ICP)
- Dores que resolve
- Diferenciais
- Preços/ofertas
- Tom de voz desejado
- Bordões/expressões características
- Valores e crenças
- O que NÃO fazer

### 2. DEFINIR PERSONALIDADE
- Nome do agente (criativo, relacionado ao negócio)
- Papel (assistente, consultora, especialista)
- Características de personalidade
- Emojis permitidos (se aplicável)

### 3. CRIAR CADA MODO
- Adaptar objetivo ao contexto do negócio
- Usar vocabulário específico do nicho
- Incluir exemplos relevantes
- Definir transições claras

### 4. VALIDAR CONSISTÊNCIA
- Tom consistente entre modos
- Bordões aparecem naturalmente
- Informações factuais corretas
- Regras não conflitantes

## FORMATO DE OUTPUT

```json
{
  "agent_name": "Nome do Agente",
  "version": "1.0.0",
  "system_prompt": "... prompt base completo ...",
  "prompts_by_mode": {
    "sdr_inbound": "... prompt do modo ...",
    "social_seller_instagram": "...",
    "scheduler": "...",
    "concierge": "...",
    "followuper": "...",
    "objection_handler": "...",
    "reativador_base": "..."
  },
  "business_config": {
    "company_name": "...",
    "professional_name": "...",
    "specialty": "...",
    "target_audience": "...",
    "main_offer": "...",
    "price": "...",
    "payment_methods": "...",
    "calendar_link": "...",
    "addresses": [],
    "hours": "...",
    "differentials": []
  },
  "personality_config": {
    "tone": "...",
    "bordoes": [],
    "vocabulary": {
      "preferred": [],
      "avoided": []
    },
    "emojis": [],
    "max_message_length": "curto/medio/longo"
  },
  "metadata": {
    "created_at": "...",
    "source_file": "...",
    "tokens_used": 0
  }
}
```

## REGRAS DE OURO

1. **NUNCA INVENTAR** dados factuais (preços, endereços, horários)
2. **MANTER CONSISTÊNCIA** de tom entre todos os modos
3. **USAR VOCABULÁRIO DO NICHO** - parecer especialista
4. **BORDÕES NATURAIS** - não forçados, aparecem organicamente
5. **EXEMPLOS REALISTAS** - conversas que poderiam acontecer
6. **TRANSIÇÕES CLARAS** - quando ir de um modo para outro
7. **REGRAS AFIRMATIVAS** - "Faça X" ao invés de "Não faça Y"
"""

    def __init__(
        self,
        config: AgentConfig = None,
        api_key: str = None,
        shared_memory: Dict = None
    ):
        config = config or AgentConfig(
            name="PromptFactory",
            description="Fábrica de agentes modulares Growth OS",
            model="claude-opus-4-20250514",
            temperature=0.7,
            max_tokens=16000  # Precisa de muito espaço para gerar tudo
        )
        super().__init__(config, api_key, shared_memory)

    @property
    def system_prompt(self) -> str:
        return self.SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa criação de agente.

        Args:
            input_data: {
                "profile_text": str (texto do perfil) OU
                "profile_path": str (caminho do arquivo),
                "location_id": str (GHL location),
                "calendar_id": str (GHL calendar),
                "agent_name": str (opcional - nome sugerido)
            }
        """
        start_time = datetime.utcnow()

        try:
            # Obter texto do perfil
            profile_text = input_data.get('profile_text')
            if not profile_text and input_data.get('profile_path'):
                profile_path = Path(input_data['profile_path'])
                if profile_path.exists():
                    profile_text = profile_path.read_text(encoding='utf-8')
                else:
                    raise ValueError(f"Arquivo não encontrado: {profile_path}")

            if not profile_text:
                raise ValueError("profile_text ou profile_path é obrigatório")

            location_id = input_data.get('location_id', 'LOCATION_ID_AQUI')
            calendar_id = input_data.get('calendar_id', 'CALENDAR_ID_AQUI')
            suggested_name = input_data.get('agent_name')

            # Gerar agente
            result = await self.create_agent_from_profile(
                profile_text=profile_text,
                location_id=location_id,
                calendar_id=calendar_id,
                suggested_name=suggested_name
            )

            return AgentResult(
                agent_name=self.config.name,
                success=True,
                output=result,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=result.get('metadata', {}).get('tokens_used', 0),
                model=self.config.model,
                metadata={
                    'agent_name': result.get('agent_name'),
                    'version': result.get('version'),
                    'modes_generated': list(result.get('prompts_by_mode', {}).keys())
                }
            )

        except Exception as e:
            logger.error(f"PromptFactory failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    async def create_agent_from_profile(
        self,
        profile_text: str,
        location_id: str,
        calendar_id: str,
        suggested_name: str = None
    ) -> Dict:
        """
        Cria um agente completo a partir do texto do perfil.

        Args:
            profile_text: Texto com informações do cliente/negócio
            location_id: ID do location no GHL
            calendar_id: ID do calendário no GHL
            suggested_name: Nome sugerido para o agente (opcional)

        Returns:
            Dict com agente completo + SQL
        """

        user_message = f"""## TAREFA: CRIAR AGENTE COMPLETO

### PERFIL DO CLIENTE/NEGÓCIO

```
{profile_text}
```

### CONFIGURAÇÕES TÉCNICAS

- **Location ID (GHL)**: {location_id}
- **Calendar ID (GHL)**: {calendar_id}
{f'- **Nome sugerido**: {suggested_name}' if suggested_name else ''}

### INSTRUÇÕES

1. Analise o perfil e extraia TODAS as informações relevantes
2. Crie um nome criativo para o agente (se não sugerido)
3. Gere o system_prompt completo com a personalidade
4. Gere os 7 prompts_by_mode adaptados ao nicho
5. Preencha business_config com dados factuais
6. Defina personality_config com tom, bordões, vocabulário

### IMPORTANTE

- Use EXATAMENTE os dados do perfil (não invente preços, endereços)
- Mantenha consistência de tom entre todos os modos
- Inclua exemplos few-shot realistas para cada modo
- Bordões devem aparecer naturalmente, não forçados

Retorne em JSON conforme o formato especificado."""

        response_text, tokens_used = await self.call_claude(user_message)

        # Parsear resposta
        agent_data = self._parse_response(response_text)

        # Adicionar metadados
        agent_data['metadata'] = agent_data.get('metadata', {})
        agent_data['metadata']['created_at'] = datetime.utcnow().isoformat()
        agent_data['metadata']['tokens_used'] = tokens_used
        agent_data['metadata']['location_id'] = location_id
        agent_data['metadata']['calendar_id'] = calendar_id

        # Gerar SQL
        agent_data['sql'] = self._generate_sql(agent_data, location_id, calendar_id)

        return agent_data

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON do Claude"""
        parsed = self._extract_json(raw_response)

        if parsed and 'system_prompt' in parsed:
            return parsed

        # Se não conseguiu parsear, retornar estrutura básica
        logger.warning("Could not parse JSON, returning raw response")
        return {
            'agent_name': 'Agente',
            'version': '1.0.0',
            'system_prompt': raw_response,
            'prompts_by_mode': {},
            'business_config': {},
            'personality_config': {},
            'metadata': {}
        }

    def _generate_sql(self, agent_data: Dict, location_id: str, calendar_id: str) -> str:
        """Gera SQL para inserir no Supabase"""

        agent_name = agent_data.get('agent_name', 'Agente')
        version = agent_data.get('version', '1.0.0')
        system_prompt = agent_data.get('system_prompt', '').replace("'", "''")
        prompts_by_mode = json.dumps(agent_data.get('prompts_by_mode', {}), ensure_ascii=False, indent=2).replace("'", "''")
        business_config = json.dumps(agent_data.get('business_config', {}), ensure_ascii=False, indent=2).replace("'", "''")
        personality_config = json.dumps(agent_data.get('personality_config', {}), ensure_ascii=False, indent=2).replace("'", "''")

        sql = f"""-- =============================================================================
-- AGENTE: {agent_name} v{version}
-- Gerado por PromptFactoryAgent em {datetime.utcnow().isoformat()}
-- =============================================================================

INSERT INTO agent_versions (
    agent_name,
    version,
    location_id,
    status,
    system_prompt,
    prompts_by_mode,
    business_config,
    personality_config,
    tools_config,
    compliance_rules,
    hyperpersonalization
) VALUES (
    '{agent_name}',
    '{version}',
    '{location_id}',
    'draft',

    -- SYSTEM PROMPT
    '{system_prompt}',

    -- PROMPTS BY MODE (7 modos)
    '{prompts_by_mode}'::jsonb,

    -- BUSINESS CONFIG
    '{business_config}'::jsonb,

    -- PERSONALITY CONFIG
    '{personality_config}'::jsonb,

    -- TOOLS CONFIG
    '{{"calendar_id": "{calendar_id}", "location_id": "{location_id}"}}'::jsonb,

    -- COMPLIANCE RULES
    '{{}}'::jsonb,

    -- HYPERPERSONALIZATION
    '{{}}'::jsonb
);

-- Para verificar:
-- SELECT agent_name, version, status FROM agent_versions WHERE agent_name = '{agent_name}';
"""
        return sql

    async def create_and_save(
        self,
        profile_path: str,
        location_id: str,
        calendar_id: str,
        output_path: str = None,
        insert_supabase: bool = False
    ) -> Dict:
        """
        Cria agente e salva SQL em arquivo.

        Args:
            profile_path: Caminho do arquivo de perfil
            location_id: GHL location ID
            calendar_id: GHL calendar ID
            output_path: Caminho para salvar SQL (opcional)
            insert_supabase: Se True, insere direto no Supabase

        Returns:
            Dict com resultado
        """
        # Ler perfil
        profile_text = Path(profile_path).read_text(encoding='utf-8')

        # Criar agente
        agent_data = await self.create_agent_from_profile(
            profile_text=profile_text,
            location_id=location_id,
            calendar_id=calendar_id
        )

        # Salvar SQL
        if output_path:
            Path(output_path).write_text(agent_data['sql'], encoding='utf-8')
            agent_data['sql_path'] = output_path

        # Inserir no Supabase (se solicitado)
        if insert_supabase:
            # TODO: Implementar inserção direta
            pass

        return agent_data
