"""
AI Factory - Orquestrador de Agentes
====================================
Coordena a execução de múltiplos agentes Claude em pipelines.
"""

import os
import json
import yaml
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field

import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

from agents import (
    DataExtractorAgent,
    SalesAnalyzerAgent,
    PromptGeneratorAgent,
    ValidatorAgent
)
from agents.base_agent import AgentConfig, AgentResult

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

console = Console()


@dataclass
class PipelineResult:
    """Resultado de execução de um pipeline"""
    pipeline_name: str
    success: bool
    total_time_ms: int
    total_tokens: int
    agent_results: List[AgentResult]
    final_output: Dict[str, Any]
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            'pipeline_name': self.pipeline_name,
            'success': self.success,
            'total_time_ms': self.total_time_ms,
            'total_tokens': self.total_tokens,
            'agent_results': [r.to_dict() for r in self.agent_results],
            'final_output': self.final_output,
            'errors': self.errors
        }


class AgentOrchestrator:
    """
    Orquestrador que coordena a execução de agentes em pipelines.

    Pipelines disponíveis:
    - full: Extração → Análise → Geração → Validação
    - analysis_only: Extração → Análise
    - prompt_only: Geração de prompt
    - validate_only: Validação de prompt existente
    """

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.shared_memory: Dict[str, Any] = {}
        self.agents: Dict[str, Any] = {}

        self._initialize_agents()

    def _load_config(self, config_path: str) -> Dict:
        """Carrega configuração do arquivo YAML"""
        path = Path(config_path)
        if path.exists():
            with open(path, 'r') as f:
                config = yaml.safe_load(f)
                # Substituir variáveis de ambiente
                config = self._replace_env_vars(config)
                return config
        else:
            logger.warning(f"Config file not found: {config_path}, using defaults")
            return self._get_default_config()

    def _replace_env_vars(self, obj: Any) -> Any:
        """Substitui ${VAR} por valores de ambiente"""
        if isinstance(obj, dict):
            return {k: self._replace_env_vars(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._replace_env_vars(item) for item in obj]
        elif isinstance(obj, str) and obj.startswith('${') and obj.endswith('}'):
            var_name = obj[2:-1]
            return os.getenv(var_name, obj)
        return obj

    def _get_default_config(self) -> Dict:
        """Configuração padrão"""
        return {
            'anthropic': {
                'api_key': os.getenv('ANTHROPIC_API_KEY'),
                'models': {
                    'orchestrator': 'claude-opus-4-5-20251101',
                    'agents': 'claude-sonnet-4-20250514'
                }
            },
            'pipelines': {
                'full': {
                    'agents': ['agent_01_extractor', 'agent_02_analyzer', 'agent_03_generator', 'agent_04_validator']
                }
            }
        }

    def _initialize_agents(self):
        """Inicializa todos os agentes"""
        api_key = self.config.get('anthropic', {}).get('api_key')

        self.agents = {
            'agent_01_extractor': DataExtractorAgent(
                api_key=api_key,
                shared_memory=self.shared_memory
            ),
            'agent_02_analyzer': SalesAnalyzerAgent(
                api_key=api_key,
                shared_memory=self.shared_memory
            ),
            'agent_03_generator': PromptGeneratorAgent(
                api_key=api_key,
                shared_memory=self.shared_memory
            ),
            'agent_04_validator': ValidatorAgent(
                api_key=api_key,
                shared_memory=self.shared_memory
            )
        }

        logger.info(f"Initialized {len(self.agents)} agents")

    async def run_pipeline(
        self,
        pipeline_name: str,
        input_data: Dict
    ) -> PipelineResult:
        """
        Executa um pipeline completo.

        Args:
            pipeline_name: Nome do pipeline (full, analysis_only, etc)
            input_data: Dados de entrada para o primeiro agente
        """
        start_time = datetime.utcnow()
        agent_results: List[AgentResult] = []
        errors: List[str] = []

        # Obter configuração do pipeline
        pipeline_config = self.config.get('pipelines', {}).get(pipeline_name)
        if not pipeline_config:
            raise ValueError(f"Pipeline '{pipeline_name}' not found")

        agent_names = pipeline_config.get('agents', [])
        logger.info(f"Starting pipeline '{pipeline_name}' with {len(agent_names)} agents")

        # Limpar memória compartilhada
        self.shared_memory.clear()

        # Preservar dados originais importantes que devem persistir entre agentes
        preserved_keys = ['business_config', 'agent_name', 'location_id', 'client_id']
        preserved_data = {k: v for k, v in input_data.items() if k in preserved_keys}

        # Dados atuais (passados entre agentes)
        current_data = input_data

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task(f"Running {pipeline_name}...", total=len(agent_names))

            for agent_name in agent_names:
                agent = self.agents.get(agent_name)
                if not agent:
                    error = f"Agent '{agent_name}' not found"
                    errors.append(error)
                    logger.error(error)
                    continue

                progress.update(task, description=f"Running {agent.config.name}...")

                try:
                    result = await agent.execute(current_data)
                    agent_results.append(result)

                    if not result.success:
                        errors.append(f"{agent_name}: {result.error}")
                        logger.error(f"Agent {agent_name} failed: {result.error}")
                        break

                    # Passar output para próximo agente, preservando dados importantes
                    current_data = {**preserved_data, **result.output}

                except Exception as e:
                    error = f"{agent_name}: {str(e)}"
                    errors.append(error)
                    logger.error(f"Exception in {agent_name}: {e}", exc_info=True)
                    break

                progress.advance(task)

        # Calcular totais
        total_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        total_tokens = sum(r.tokens_used for r in agent_results)

        # Montar resultado final
        final_output = self._aggregate_outputs(agent_results)

        pipeline_result = PipelineResult(
            pipeline_name=pipeline_name,
            success=len(errors) == 0,
            total_time_ms=total_time,
            total_tokens=total_tokens,
            agent_results=agent_results,
            final_output=final_output,
            errors=errors
        )

        self._print_summary(pipeline_result)

        return pipeline_result

    async def run_single_agent(
        self,
        agent_name: str,
        input_data: Dict
    ) -> AgentResult:
        """Executa um único agente"""
        agent = self.agents.get(agent_name)
        if not agent:
            raise ValueError(f"Agent '{agent_name}' not found")

        logger.info(f"Running single agent: {agent_name}")

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            progress.add_task(f"Running {agent.config.name}...")
            result = await agent.execute(input_data)

        self._print_agent_result(result)
        return result

    def _aggregate_outputs(self, results: List[AgentResult]) -> Dict:
        """Agrega outputs de todos os agentes"""
        aggregated = {}

        for result in results:
            if result.success:
                aggregated[result.agent_name] = result.output

        # Campos especiais do shared_memory
        aggregated['shared_memory'] = dict(self.shared_memory)

        return aggregated

    def _print_summary(self, result: PipelineResult):
        """Imprime resumo do pipeline"""
        console.print()
        console.rule(f"[bold]Pipeline: {result.pipeline_name}")

        # Tabela de agentes
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Agent")
        table.add_column("Status")
        table.add_column("Time (ms)")
        table.add_column("Tokens")

        for agent_result in result.agent_results:
            status = "[green]OK" if agent_result.success else f"[red]FAIL: {agent_result.error}"
            table.add_row(
                agent_result.agent_name,
                status,
                str(agent_result.execution_time_ms),
                str(agent_result.tokens_used)
            )

        console.print(table)

        # Resumo final
        status_emoji = "OK" if result.success else "FALHOU"
        status_color = "green" if result.success else "red"

        console.print()
        console.print(f"[{status_color}]Status: {status_emoji}")
        console.print(f"Tempo total: {result.total_time_ms}ms")
        console.print(f"Tokens totais: {result.total_tokens}")

        if result.errors:
            console.print()
            console.print("[red]Erros:")
            for error in result.errors:
                console.print(f"  - {error}")

    def _print_agent_result(self, result: AgentResult):
        """Imprime resultado de um agente"""
        console.print()
        console.rule(f"[bold]{result.agent_name}")

        status = "[green]OK" if result.success else f"[red]FAIL"
        console.print(f"Status: {status}")
        console.print(f"Tempo: {result.execution_time_ms}ms")
        console.print(f"Tokens: {result.tokens_used}")

        if result.success:
            console.print()
            console.print("[bold]Output:")
            console.print_json(data=result.output)


# ============================================
# CLI
# ============================================

@click.group()
def cli():
    """AI Factory Agent Orchestrator"""
    pass


@cli.command()
@click.option('--pipeline', '-p', default='full', help='Pipeline to run')
@click.option('--input', '-i', 'input_json', required=True, help='Input JSON')
@click.option('--config', '-c', default='config.yaml', help='Config file')
@click.option('--output', '-o', default=None, help='Output file')
def run(pipeline: str, input_json: str, config: str, output: str):
    """Run a pipeline"""
    try:
        input_data = json.loads(input_json)
    except json.JSONDecodeError:
        # Tentar como key=value
        input_data = dict(kv.split('=') for kv in input_json.split(','))

    orchestrator = AgentOrchestrator(config_path=config)
    result = asyncio.run(orchestrator.run_pipeline(pipeline, input_data))

    if output:
        with open(output, 'w') as f:
            json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
        console.print(f"[green]Output saved to {output}")


@cli.command()
@click.option('--agent', '-a', required=True, help='Agent name')
@click.option('--input', '-i', 'input_json', required=True, help='Input JSON')
@click.option('--config', '-c', default='config.yaml', help='Config file')
def agent(agent: str, input_json: str, config: str):
    """Run a single agent"""
    input_data = json.loads(input_json)

    orchestrator = AgentOrchestrator(config_path=config)
    asyncio.run(orchestrator.run_single_agent(agent, input_data))


@cli.command()
@click.option('--config', '-c', default='config.yaml', help='Config file')
def list_agents(config: str):
    """List available agents"""
    orchestrator = AgentOrchestrator(config_path=config)

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Agent ID")
    table.add_column("Name")
    table.add_column("Model")

    for agent_id, agent in orchestrator.agents.items():
        table.add_row(
            agent_id,
            agent.config.name,
            agent.config.model
        )

    console.print(table)


@cli.command()
@click.option('--config', '-c', default='config.yaml', help='Config file')
def list_pipelines(config: str):
    """List available pipelines"""
    orchestrator = AgentOrchestrator(config_path=config)

    console.print("[bold]Available Pipelines:")
    for name, cfg in orchestrator.config.get('pipelines', {}).items():
        agents = cfg.get('agents', [])
        console.print(f"  [cyan]{name}[/cyan]: {' -> '.join(agents)}")


if __name__ == "__main__":
    cli()
