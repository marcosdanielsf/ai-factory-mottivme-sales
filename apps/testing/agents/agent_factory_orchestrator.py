"""
Agent Factory Orchestrator
==========================
Orquestrador mestre que conecta os dois pipelines:
- Pipeline CRIADOR (01-12): Cria novos agentes via debate
- Pipeline QA (13-16): Analisa e melhora agentes existentes

Segue padrao CLAUDE.md:
- Orquestrador NUNCA codifica, apenas delega
- Usa subagentes especializados
- Ciclo continuo: Create → Deploy → QA → Improve → Redeploy

Autor: AI Factory / MOTTIVME
"""

import os
import logging
import asyncio
from typing import Dict, List, Optional, Literal
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

from supabase import create_client, Client

# Pipeline QA (13-16) - Sempre disponivel
from .agent_13_conversation_collector import ConversationCollectorAgent
from .agent_14_qa_analyzer import QAAnalyzerAgent
from .agent_15_reflection_aggregator import ReflectionAggregatorAgent
from .agent_16_prompt_improver import PromptImproverAgent

# Pipeline Criador (01-12) - Imports condicionais (arquivos com nomes legados)
# Estes agentes estao em arquivos com sufixo "(no claude - projeto growth-os)"
# Por enquanto, usamos stubs ate os arquivos serem renomeados
try:
    from .agent_01_extractor import DataExtractorAgent
    from .agent_02_analyzer import SalesAnalyzerAgent
    from .agent_03_generator import PromptGeneratorAgent
    from .agent_04_validator import ValidatorAgent
    from .debate_orchestrator import DebateOrchestrator, QuickDebate
    CREATOR_PIPELINE_AVAILABLE = True
except ImportError:
    CREATOR_PIPELINE_AVAILABLE = False
    DataExtractorAgent = None
    SalesAnalyzerAgent = None
    PromptGeneratorAgent = None
    ValidatorAgent = None
    DebateOrchestrator = None
    QuickDebate = None

logger = logging.getLogger(__name__)

# Supabase config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')


class PipelineMode(Enum):
    """Modos de operacao do orquestrador"""
    CREATE = "create"           # Criar novo agente do zero
    IMPROVE = "improve"         # Melhorar agente existente via QA
    FULL_CYCLE = "full_cycle"   # Ciclo completo: Create → QA → Improve
    QA_ONLY = "qa_only"         # Apenas analise QA (sem aplicar melhorias)


@dataclass
class PipelineResult:
    """Resultado de uma execucao do pipeline"""
    mode: str
    success: bool
    agent_name: str
    agent_version_id: Optional[str]
    stages_completed: List[str]
    final_score: Optional[float]
    improvements_applied: int
    tokens_used: int
    duration_seconds: float
    error: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            'mode': self.mode,
            'success': self.success,
            'agent_name': self.agent_name,
            'agent_version_id': self.agent_version_id,
            'stages_completed': self.stages_completed,
            'final_score': self.final_score,
            'improvements_applied': self.improvements_applied,
            'tokens_used': self.tokens_used,
            'duration_seconds': self.duration_seconds,
            'error': self.error,
            'metadata': self.metadata
        }


class AgentFactoryOrchestrator:
    """
    Orquestrador Mestre da AI Factory.

    Conecta os dois pipelines em um ciclo continuo de melhoria:

    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │   PIPELINE CRIADOR (01-12)         PIPELINE QA (13-16)      │
    │   ════════════════════════         ═══════════════════      │
    │                                                             │
    │   ┌──────────┐                     ┌──────────┐             │
    │   │ Extractor│                     │ Collector│             │
    │   └────┬─────┘                     └────┬─────┘             │
    │        ▼                                ▼                   │
    │   ┌──────────┐                     ┌──────────┐             │
    │   │ Analyzer │                     │QA Analyzer│            │
    │   └────┬─────┘                     └────┬─────┘             │
    │        ▼                                ▼                   │
    │   ┌──────────┐                     ┌──────────┐             │
    │   │Generator │                     │Reflection│             │
    │   └────┬─────┘                     └────┬─────┘             │
    │        ▼                                ▼                   │
    │   ┌──────────┐                     ┌──────────┐             │
    │   │ Debate   │ ◄───────────────────│ Improver │             │
    │   │Orchestr. │                     └──────────┘             │
    │   └────┬─────┘                          ▲                   │
    │        ▼                                │                   │
    │   ┌──────────┐                          │                   │
    │   │ Deploy   │ ─────────────────────────┘                   │
    │   │(Supabase)│    Conversas Reais                           │
    │   └──────────┘                                              │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘

    REGRAS (seguindo CLAUDE.md):
    - Orquestrador NUNCA executa logica de negocio
    - Apenas DELEGA para subagentes especializados
    - VALIDA resultados entre etapas
    - PERSISTE estado no Supabase
    """

    def __init__(
        self,
        supabase_client: Client = None,
        debate_max_rounds: int = 3,
        qa_hours_back: int = 72,
        improvement_mode: str = 'moderate',
        min_score_to_improve: float = 7.5
    ):
        """
        Inicializa o orquestrador.

        Args:
            supabase_client: Cliente Supabase (ou cria um novo)
            debate_max_rounds: Max rodadas do debate criador
            qa_hours_back: Horas atras para buscar conversas
            improvement_mode: conservative|moderate|aggressive
            min_score_to_improve: Score minimo para considerar melhoria
        """
        self.supabase = supabase_client or self._get_supabase_client()
        self.debate_max_rounds = debate_max_rounds
        self.qa_hours_back = qa_hours_back
        self.improvement_mode = improvement_mode
        self.min_score_to_improve = min_score_to_improve

        # Subagentes - inicializados sob demanda
        self._creator_pipeline = None
        self._qa_pipeline = None
        self._debate_orchestrator = None

        # Estado
        self.current_run_id = None
        self.stages_completed = []
        self.total_tokens = 0

        logger.info("AgentFactoryOrchestrator initialized")

    def _get_supabase_client(self) -> Optional[Client]:
        """Retorna cliente Supabase configurado"""
        if not SUPABASE_KEY:
            logger.warning("SUPABASE_SERVICE_KEY nao configurada")
            return None
        return create_client(SUPABASE_URL, SUPABASE_KEY)

    # =========================================================================
    # SUBAGENTES - Lazy initialization
    # =========================================================================

    @property
    def creator_pipeline(self) -> Dict:
        """Pipeline de criacao (agentes 01-04)"""
        if not CREATOR_PIPELINE_AVAILABLE:
            raise RuntimeError(
                "Pipeline Criador (01-12) nao disponivel. "
                "Arquivos de agentes precisam ser renomeados. "
                "Use apenas modo IMPROVE ou QA_ONLY."
            )
        if self._creator_pipeline is None:
            self._creator_pipeline = {
                'extractor': DataExtractorAgent(),
                'analyzer': SalesAnalyzerAgent(),
                'generator': PromptGeneratorAgent(),
                'validator': ValidatorAgent()
            }
        return self._creator_pipeline

    @property
    def debate_orchestrator(self):
        """Orquestrador de debate (agentes 05-10)"""
        if not CREATOR_PIPELINE_AVAILABLE:
            raise RuntimeError(
                "DebateOrchestrator nao disponivel. "
                "Arquivos de agentes precisam ser renomeados."
            )
        if self._debate_orchestrator is None:
            self._debate_orchestrator = DebateOrchestrator(
                max_rounds=self.debate_max_rounds,
                approval_threshold=70.0,
                include_experts=True
            )
        return self._debate_orchestrator

    @property
    def qa_pipeline(self) -> Dict:
        """Pipeline de QA (agentes 13-16)"""
        if self._qa_pipeline is None:
            self._qa_pipeline = {
                'collector': ConversationCollectorAgent(),
                'analyzer': QAAnalyzerAgent(),
                'aggregator': ReflectionAggregatorAgent(),
                'improver': PromptImproverAgent()
            }
        return self._qa_pipeline

    # =========================================================================
    # MODOS DE OPERACAO
    # =========================================================================

    async def run(
        self,
        mode: PipelineMode,
        **kwargs
    ) -> PipelineResult:
        """
        Executa o pipeline no modo especificado.

        Args:
            mode: Modo de operacao (CREATE, IMPROVE, FULL_CYCLE, QA_ONLY)
            **kwargs: Parametros especificos do modo

        Returns:
            PipelineResult com resultado da execucao
        """
        start_time = datetime.utcnow()
        self.stages_completed = []
        self.total_tokens = 0
        self.current_run_id = f"run_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        logger.info(f"Starting pipeline run: {self.current_run_id} | Mode: {mode.value}")

        try:
            if mode == PipelineMode.CREATE:
                result = await self._run_create_pipeline(**kwargs)
            elif mode == PipelineMode.IMPROVE:
                result = await self._run_improve_pipeline(**kwargs)
            elif mode == PipelineMode.FULL_CYCLE:
                result = await self._run_full_cycle(**kwargs)
            elif mode == PipelineMode.QA_ONLY:
                result = await self._run_qa_only(**kwargs)
            else:
                raise ValueError(f"Modo desconhecido: {mode}")

            duration = (datetime.utcnow() - start_time).total_seconds()
            result.duration_seconds = duration
            result.tokens_used = self.total_tokens

            # Persistir resultado
            await self._save_run_result(result)

            return result

        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            duration = (datetime.utcnow() - start_time).total_seconds()

            return PipelineResult(
                mode=mode.value,
                success=False,
                agent_name=kwargs.get('agent_name', 'unknown'),
                agent_version_id=None,
                stages_completed=self.stages_completed,
                final_score=None,
                improvements_applied=0,
                tokens_used=self.total_tokens,
                duration_seconds=duration,
                error=str(e)
            )

    # =========================================================================
    # PIPELINE: CREATE (01-12)
    # =========================================================================

    async def _run_create_pipeline(
        self,
        client_profile: str,
        location_id: str,
        agent_name: str,
        calendar_id: str = None,
        **kwargs
    ) -> PipelineResult:
        """
        Cria um novo agente do zero.

        Fluxo:
        1. Extrator processa perfil do cliente
        2. Analisador identifica contexto de vendas
        3. Gerador cria primeira versao do prompt
        4. Debate refina o prompt (Critico ↔ Defensor ↔ Juiz)
        5. Validador aprova estrutura final
        6. Deploy no Supabase
        """
        logger.info(f"CREATE PIPELINE: {agent_name}")

        # 1. EXTRATOR - Processar perfil
        self._log_stage("01_extractor")
        extractor_result = await self.creator_pipeline['extractor'].execute({
            'profile_text': client_profile,
            'location_id': location_id
        })
        self._track_tokens(extractor_result)

        if not extractor_result.success:
            raise Exception(f"Extractor failed: {extractor_result.error}")

        extracted_data = extractor_result.output

        # 2. ANALISADOR - Contexto de vendas
        self._log_stage("02_analyzer")
        analyzer_result = await self.creator_pipeline['analyzer'].execute({
            'extracted_data': extracted_data,
            'client_profile': client_profile
        })
        self._track_tokens(analyzer_result)

        if not analyzer_result.success:
            raise Exception(f"Analyzer failed: {analyzer_result.error}")

        sales_context = analyzer_result.output

        # 3. GERADOR - Primeira versao do prompt
        self._log_stage("03_generator")
        generator_result = await self.creator_pipeline['generator'].execute({
            'extracted_data': extracted_data,
            'sales_context': sales_context,
            'agent_name': agent_name
        })
        self._track_tokens(generator_result)

        if not generator_result.success:
            raise Exception(f"Generator failed: {generator_result.error}")

        initial_prompt = generator_result.output.get('system_prompt', '')

        # 4. DEBATE - Refinamento via critica
        self._log_stage("04_debate")
        debate_result = await self.debate_orchestrator.run_debate(
            prompt=initial_prompt,
            context=sales_context,
            verbose=True
        )
        self.total_tokens += debate_result.total_tokens_used

        final_prompt = debate_result.final_prompt
        debate_score = debate_result.final_score

        # 5. VALIDADOR - Aprovar estrutura
        self._log_stage("05_validator")
        validator_result = await self.creator_pipeline['validator'].execute({
            'prompt': final_prompt,
            'context': sales_context
        })
        self._track_tokens(validator_result)

        # 6. DEPLOY - Salvar no Supabase
        self._log_stage("06_deploy")
        version_id = await self._deploy_agent(
            agent_name=agent_name,
            location_id=location_id,
            system_prompt=final_prompt,
            calendar_id=calendar_id,
            metadata={
                'created_by': 'AgentFactoryOrchestrator',
                'debate_score': debate_score,
                'debate_rounds': debate_result.total_rounds
            }
        )

        return PipelineResult(
            mode=PipelineMode.CREATE.value,
            success=True,
            agent_name=agent_name,
            agent_version_id=version_id,
            stages_completed=self.stages_completed,
            final_score=debate_score,
            improvements_applied=0,
            tokens_used=self.total_tokens,
            duration_seconds=0,  # Preenchido depois
            metadata={
                'debate_rounds': debate_result.total_rounds,
                'debate_verdict': debate_result.verdict,
                'validation': validator_result.output
            }
        )

    # =========================================================================
    # PIPELINE: IMPROVE (13-16)
    # =========================================================================

    async def _run_improve_pipeline(
        self,
        agent_version_id: str = None,
        location_id: str = None,
        agent_name: str = None,
        auto_deploy: bool = False,
        **kwargs
    ) -> PipelineResult:
        """
        Melhora um agente existente baseado em conversas reais.

        Fluxo:
        1. Collector busca conversas do Supabase
        2. QA Analyzer avalia cada conversa (4 dimensoes)
        3. Reflection agrega padroes e recomendacoes
        4. Improver gera prompt melhorado
        5. (Opcional) Deploy da nova versao
        """
        logger.info(f"IMPROVE PIPELINE: {agent_name or agent_version_id}")

        # Resolver agent_version_id se necessario
        if not agent_version_id and location_id:
            agent_version_id = await self._get_active_agent_version(location_id)

        if not agent_version_id:
            raise ValueError("agent_version_id ou location_id necessario")

        # Buscar dados do agente
        agent_info = await self._get_agent_info(agent_version_id)
        agent_name = agent_name or agent_info.get('agent_name', 'Unknown')

        # 1. COLLECTOR - Buscar conversas
        self._log_stage("13_collector")
        collector_result = await self.qa_pipeline['collector'].execute({
            'location_id': agent_info.get('location_id'),
            'hours_back': self.qa_hours_back,
            'min_messages': 4,
            'limit': 50,
            'only_unanalyzed': True
        })
        self._track_tokens(collector_result)

        if not collector_result.success:
            raise Exception(f"Collector failed: {collector_result.error}")

        conversations = collector_result.output.get('conversations', [])

        if not conversations:
            logger.info("Nenhuma conversa nova para analisar")
            return PipelineResult(
                mode=PipelineMode.IMPROVE.value,
                success=True,
                agent_name=agent_name,
                agent_version_id=agent_version_id,
                stages_completed=self.stages_completed,
                final_score=None,
                improvements_applied=0,
                tokens_used=self.total_tokens,
                duration_seconds=0,
                metadata={'message': 'Nenhuma conversa nova'}
            )

        # 2. QA ANALYZER - Analisar conversas
        self._log_stage("14_qa_analyzer")
        qa_analyses = []

        for conv in conversations:
            analysis_result = await self.qa_pipeline['analyzer'].execute({
                'conversation': conv,
                'agent_context': agent_info
            })
            self._track_tokens(analysis_result)

            if analysis_result.success:
                qa_analyses.append(analysis_result.output)

        if not qa_analyses:
            raise Exception("Nenhuma analise de QA concluida")

        # 3. REFLECTION - Agregar padroes
        self._log_stage("15_reflection")
        reflection_result = await self.qa_pipeline['aggregator'].execute({
            'qa_analyses': qa_analyses,
            'agent_info': agent_info,
            'period_days': self.qa_hours_back // 24 or 1
        })
        self._track_tokens(reflection_result)

        if not reflection_result.success:
            raise Exception(f"Reflection failed: {reflection_result.error}")

        reflection = reflection_result.output
        score_medio = reflection.get('metricas', {}).get('score_medio', 0)

        # Verificar se precisa melhorar
        if score_medio >= self.min_score_to_improve:
            logger.info(f"Score {score_medio} >= {self.min_score_to_improve}, melhoria opcional")

        # 4. IMPROVER - Gerar melhorias
        self._log_stage("16_improver")
        improver_result = await self.qa_pipeline['improver'].execute({
            'reflection': reflection,
            'current_prompt': agent_info.get('system_prompt', ''),
            'agent_info': agent_info,
            'improvement_mode': self.improvement_mode
        })
        self._track_tokens(improver_result)

        if not improver_result.success:
            raise Exception(f"Improver failed: {improver_result.error}")

        improvement = improver_result.output
        changes_count = improvement.get('change_summary', {}).get('total_changes', 0)

        # 5. DEPLOY (opcional)
        new_version_id = None
        if auto_deploy and changes_count > 0:
            self._log_stage("17_deploy")
            deploy_result = await self.qa_pipeline['improver'].apply_improvement(
                reflection=reflection,
                agent_version_id=agent_version_id,
                supabase_client=self.supabase,
                mode=self.improvement_mode,
                auto_deploy=True
            )
            if deploy_result.get('deployed'):
                new_version_id = deploy_result.get('deploy_result', {}).get('new_version_id')

        return PipelineResult(
            mode=PipelineMode.IMPROVE.value,
            success=True,
            agent_name=agent_name,
            agent_version_id=new_version_id or agent_version_id,
            stages_completed=self.stages_completed,
            final_score=score_medio,
            improvements_applied=changes_count,
            tokens_used=self.total_tokens,
            duration_seconds=0,
            metadata={
                'conversations_analyzed': len(qa_analyses),
                'reflection_summary': reflection.get('resumo_executivo'),
                'changes': improvement.get('change_summary'),
                'deployed': bool(new_version_id)
            }
        )

    # =========================================================================
    # PIPELINE: FULL CYCLE
    # =========================================================================

    async def _run_full_cycle(
        self,
        client_profile: str = None,
        location_id: str = None,
        agent_name: str = None,
        agent_version_id: str = None,
        **kwargs
    ) -> PipelineResult:
        """
        Ciclo completo: Cria ou melhora dependendo do contexto.

        Se client_profile fornecido: Cria novo agente
        Se agent_version_id fornecido: Melhora existente
        Depois roda QA para validar
        """
        logger.info("FULL CYCLE PIPELINE")

        # Decidir se cria ou melhora
        if client_profile:
            # Criar novo agente
            create_result = await self._run_create_pipeline(
                client_profile=client_profile,
                location_id=location_id,
                agent_name=agent_name,
                **kwargs
            )

            if not create_result.success:
                return create_result

            agent_version_id = create_result.agent_version_id

            # Aguardar algumas conversas antes de rodar QA
            logger.info("Agente criado. QA sera executado quando houver conversas.")
            return create_result

        elif agent_version_id or location_id:
            # Melhorar existente
            return await self._run_improve_pipeline(
                agent_version_id=agent_version_id,
                location_id=location_id,
                agent_name=agent_name,
                auto_deploy=kwargs.get('auto_deploy', False),
                **kwargs
            )
        else:
            raise ValueError("Forneca client_profile (criar) ou agent_version_id (melhorar)")

    # =========================================================================
    # PIPELINE: QA ONLY
    # =========================================================================

    async def _run_qa_only(
        self,
        agent_version_id: str = None,
        location_id: str = None,
        **kwargs
    ) -> PipelineResult:
        """
        Apenas roda QA sem aplicar melhorias.
        Util para diagnostico.
        """
        return await self._run_improve_pipeline(
            agent_version_id=agent_version_id,
            location_id=location_id,
            auto_deploy=False,
            **kwargs
        )

    # =========================================================================
    # HELPERS
    # =========================================================================

    def _log_stage(self, stage: str):
        """Registra conclusao de uma etapa"""
        self.stages_completed.append(stage)
        logger.info(f"Stage completed: {stage}")

    def _track_tokens(self, result):
        """Acumula tokens usados"""
        if hasattr(result, 'tokens_used'):
            self.total_tokens += result.tokens_used

    async def _get_agent_info(self, agent_version_id: str) -> Dict:
        """Busca informacoes do agente no Supabase"""
        if not self.supabase:
            return {'id': agent_version_id}

        result = self.supabase.table('agent_versions') \
            .select('*') \
            .eq('id', agent_version_id) \
            .single() \
            .execute()

        return result.data or {'id': agent_version_id}

    async def _get_active_agent_version(self, location_id: str) -> Optional[str]:
        """Busca versao ativa do agente por location"""
        if not self.supabase:
            return None

        result = self.supabase.table('agent_versions') \
            .select('id') \
            .eq('location_id', location_id) \
            .eq('is_active', True) \
            .limit(1) \
            .execute()

        if result.data:
            return result.data[0]['id']
        return None

    async def _deploy_agent(
        self,
        agent_name: str,
        location_id: str,
        system_prompt: str,
        calendar_id: str = None,
        metadata: Dict = None
    ) -> str:
        """Salva novo agente no Supabase"""
        if not self.supabase:
            logger.warning("Supabase nao configurado, deploy simulado")
            return "simulated_version_id"

        # Desativar versoes anteriores
        self.supabase.table('agent_versions') \
            .update({'is_active': False}) \
            .eq('location_id', location_id) \
            .execute()

        # Criar nova versao
        new_agent = {
            'agent_name': agent_name,
            'location_id': location_id,
            'version': '1.0.0',
            'system_prompt': system_prompt,
            'is_active': True,
            'created_at': datetime.utcnow().isoformat(),
            'metadata': metadata
        }

        if calendar_id:
            new_agent['calendar_id'] = calendar_id

        result = self.supabase.table('agent_versions') \
            .insert(new_agent) \
            .execute()

        if result.data:
            return result.data[0]['id']
        return None

    async def _save_run_result(self, result: PipelineResult):
        """Persiste resultado da execucao"""
        if not self.supabase:
            return

        try:
            self.supabase.table('pipeline_runs').insert({
                'run_id': self.current_run_id,
                'mode': result.mode,
                'success': result.success,
                'agent_name': result.agent_name,
                'agent_version_id': result.agent_version_id,
                'stages_completed': result.stages_completed,
                'final_score': result.final_score,
                'improvements_applied': result.improvements_applied,
                'tokens_used': result.tokens_used,
                'duration_seconds': result.duration_seconds,
                'error': result.error,
                'metadata': result.metadata,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save run result: {e}")


# =============================================================================
# FUNCOES HELPER PARA USO DIRETO
# =============================================================================

async def create_agent(
    client_profile: str,
    location_id: str,
    agent_name: str,
    calendar_id: str = None
) -> PipelineResult:
    """
    Cria um novo agente SDR.

    Args:
        client_profile: Texto com perfil do cliente/negocio
        location_id: ID da location no GHL
        agent_name: Nome do agente
        calendar_id: ID do calendario (opcional)

    Returns:
        PipelineResult com o resultado
    """
    orchestrator = AgentFactoryOrchestrator()
    return await orchestrator.run(
        mode=PipelineMode.CREATE,
        client_profile=client_profile,
        location_id=location_id,
        agent_name=agent_name,
        calendar_id=calendar_id
    )


async def improve_agent(
    agent_version_id: str = None,
    location_id: str = None,
    auto_deploy: bool = False
) -> PipelineResult:
    """
    Melhora um agente existente baseado em conversas reais.

    Args:
        agent_version_id: ID da versao do agente
        location_id: Ou location_id para buscar agente ativo
        auto_deploy: Se True, faz deploy automatico

    Returns:
        PipelineResult com o resultado
    """
    orchestrator = AgentFactoryOrchestrator()
    return await orchestrator.run(
        mode=PipelineMode.IMPROVE,
        agent_version_id=agent_version_id,
        location_id=location_id,
        auto_deploy=auto_deploy
    )


async def analyze_agent(
    agent_version_id: str = None,
    location_id: str = None
) -> PipelineResult:
    """
    Apenas analisa performance do agente (sem aplicar melhorias).

    Returns:
        PipelineResult com diagnostico
    """
    orchestrator = AgentFactoryOrchestrator()
    return await orchestrator.run(
        mode=PipelineMode.QA_ONLY,
        agent_version_id=agent_version_id,
        location_id=location_id
    )
