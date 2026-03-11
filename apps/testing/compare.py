"""
AI Factory - Comparador n8n vs Claude Agents
=============================================
Compara resultados entre workflows n8n e agentes Claude.
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field

import httpx
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from orchestrator import AgentOrchestrator, PipelineResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
console = Console()


@dataclass
class ComparisonResult:
    """Resultado da comparação n8n vs Claude"""
    contact_id: str
    timestamp: str

    # Resultados
    n8n_result: Dict
    claude_result: PipelineResult

    # Métricas de comparação
    metrics: Dict = field(default_factory=dict)

    # Análise
    classification_match: bool = False
    score_difference: float = 0.0
    execution_time_ratio: float = 0.0
    token_cost_estimate: float = 0.0

    def to_dict(self) -> Dict:
        return {
            'contact_id': self.contact_id,
            'timestamp': self.timestamp,
            'n8n_result': self.n8n_result,
            'claude_result': self.claude_result.to_dict() if self.claude_result else None,
            'metrics': self.metrics,
            'classification_match': self.classification_match,
            'score_difference': self.score_difference,
            'execution_time_ratio': self.execution_time_ratio,
            'token_cost_estimate': self.token_cost_estimate
        }


class N8NClient:
    """Cliente para interagir com n8n API"""

    def __init__(
        self,
        base_url: str = None,
        api_key: str = None
    ):
        self.base_url = base_url or os.getenv('N8N_URL', 'https://cliente-a1.mentorfy.io')
        self.api_key = api_key or os.getenv('N8N_API_KEY')

        if not self.api_key:
            raise ValueError("N8N_API_KEY must be set")

        self.headers = {'X-N8N-API-KEY': self.api_key}

    async def trigger_workflow(
        self,
        workflow_id: str,
        payload: Dict
    ) -> Dict:
        """Dispara um workflow e aguarda resultado"""
        async with httpx.AsyncClient(timeout=120) as client:
            # Disparar workflow
            response = await client.post(
                f"{self.base_url}/webhook/{workflow_id}",
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_execution(
        self,
        workflow_id: str,
        execution_id: str
    ) -> Dict:
        """Busca detalhes de uma execução"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/executions/{execution_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_recent_execution(
        self,
        workflow_id: str
    ) -> Optional[Dict]:
        """Busca execução mais recente de um workflow"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/executions",
                params={'workflowId': workflow_id, 'limit': 1},
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()

            if data.get('data'):
                exec_id = data['data'][0]['id']
                return await self.get_execution(workflow_id, exec_id)

        return None

    async def extract_workflow_result(
        self,
        execution: Dict,
        output_node: str = None
    ) -> Dict:
        """Extrai resultado de um nó específico da execução"""
        run_data = execution.get('data', {}).get('resultData', {}).get('runData', {})

        if output_node and output_node in run_data:
            node_runs = run_data[output_node]
            if node_runs:
                main_output = node_runs[-1].get('data', {}).get('main', [[]])
                if main_output and main_output[0]:
                    return main_output[0][0].get('json', {})

        # Retornar último nó executado
        for node_name in reversed(list(run_data.keys())):
            node_runs = run_data[node_name]
            if node_runs:
                main_output = node_runs[-1].get('data', {}).get('main', [[]])
                if main_output and main_output[0]:
                    return main_output[0][0].get('json', {})

        return {}


class Comparator:
    """Comparador de resultados n8n vs Claude Agents"""

    # Custo estimado por 1M tokens (USD)
    TOKEN_COSTS = {
        'claude-opus-4-20250514': {'input': 15, 'output': 75},
        'claude-sonnet-4-20250514': {'input': 3, 'output': 15},
        'claude-3-5-haiku-20241022': {'input': 1, 'output': 5}
    }

    def __init__(
        self,
        orchestrator: AgentOrchestrator = None,
        n8n_client: N8NClient = None
    ):
        self.orchestrator = orchestrator or AgentOrchestrator()
        self.n8n_client = n8n_client or N8NClient()

    async def compare(
        self,
        workflow_id: str,
        contact_id: str,
        location_id: str = None,
        pipeline: str = 'full'
    ) -> ComparisonResult:
        """
        Executa comparação completa entre n8n e Claude.

        Args:
            workflow_id: ID do workflow n8n
            contact_id: ID do contato
            location_id: ID da location (opcional)
            pipeline: Pipeline do Claude a usar
        """
        console.print(f"[bold]Comparando workflow {workflow_id} com pipeline {pipeline}...")
        console.print()

        # 1. Executar via n8n
        console.print("[cyan]Executando via n8n...")
        n8n_start = datetime.utcnow()

        try:
            n8n_execution = await self.n8n_client.get_recent_execution(workflow_id)
            n8n_result = await self.n8n_client.extract_workflow_result(n8n_execution)
            n8n_time = int((datetime.utcnow() - n8n_start).total_seconds() * 1000)
        except Exception as e:
            logger.error(f"n8n execution failed: {e}")
            n8n_result = {'error': str(e)}
            n8n_time = 0

        # 2. Executar via Claude Agents
        console.print("[cyan]Executando via Claude Agents...")

        input_data = {
            'contact_id': contact_id,
            'location_id': location_id,
            # Passar dados já disponíveis do n8n (para comparação justa)
            'raw_contact': n8n_result.get('contact'),
            'raw_conversation': n8n_result.get('messages', [])
        }

        claude_result = await self.orchestrator.run_pipeline(pipeline, input_data)

        # 3. Calcular métricas
        metrics = self._calculate_metrics(n8n_result, claude_result, n8n_time)

        # 4. Montar resultado
        comparison = ComparisonResult(
            contact_id=contact_id,
            timestamp=datetime.utcnow().isoformat(),
            n8n_result=n8n_result,
            claude_result=claude_result,
            metrics=metrics,
            classification_match=metrics.get('classification_match', False),
            score_difference=metrics.get('score_difference', 0),
            execution_time_ratio=metrics.get('time_ratio', 0),
            token_cost_estimate=metrics.get('estimated_cost_usd', 0)
        )

        self._print_comparison(comparison)

        return comparison

    def _calculate_metrics(
        self,
        n8n_result: Dict,
        claude_result: PipelineResult,
        n8n_time_ms: int
    ) -> Dict:
        """Calcula métricas de comparação"""
        metrics = {}

        # Tempo de execução
        metrics['n8n_time_ms'] = n8n_time_ms
        metrics['claude_time_ms'] = claude_result.total_time_ms
        metrics['time_ratio'] = claude_result.total_time_ms / max(n8n_time_ms, 1)

        # Tokens e custo
        metrics['total_tokens'] = claude_result.total_tokens
        metrics['estimated_cost_usd'] = self._estimate_cost(claude_result)

        # Comparação de classificação
        n8n_classification = self._extract_classification(n8n_result)
        claude_classification = self._extract_classification(claude_result.final_output)

        metrics['n8n_classification'] = n8n_classification
        metrics['claude_classification'] = claude_classification
        metrics['classification_match'] = n8n_classification == claude_classification

        # Comparação de scores
        n8n_score = self._extract_score(n8n_result)
        claude_score = self._extract_score(claude_result.final_output)

        metrics['n8n_score'] = n8n_score
        metrics['claude_score'] = claude_score
        metrics['score_difference'] = abs(n8n_score - claude_score)

        return metrics

    def _extract_classification(self, result: Dict) -> str:
        """Extrai classificação do resultado"""
        # Tentar diferentes caminhos
        paths = [
            'sales_analysis.classification',
            'SalesAnalyzer.classification',
            'analise_geral.status',
            'classification'
        ]

        for path in paths:
            value = self._get_nested(result, path)
            if value:
                return str(value).upper()

        return 'UNKNOWN'

    def _extract_score(self, result: Dict) -> float:
        """Extrai score do resultado"""
        paths = [
            'sales_analysis.score_total',
            'SalesAnalyzer.score_total',
            'analise_geral.score_total',
            'score_total',
            'overall_score'
        ]

        for path in paths:
            value = self._get_nested(result, path)
            if value is not None:
                try:
                    return float(value)
                except:
                    pass

        return 0.0

    def _get_nested(self, d: Dict, path: str) -> Any:
        """Acessa valor aninhado via path (ex: 'a.b.c')"""
        keys = path.split('.')
        for key in keys:
            if isinstance(d, dict):
                d = d.get(key)
            else:
                return None
        return d

    def _estimate_cost(self, result: PipelineResult) -> float:
        """Estima custo em USD baseado nos tokens"""
        # Assumir 50% input, 50% output
        total = result.total_tokens
        input_tokens = total * 0.5
        output_tokens = total * 0.5

        # Usar custo médio (mix de modelos)
        cost_per_m = {
            'input': 5,  # Média entre Opus e Sonnet
            'output': 30
        }

        cost = (input_tokens * cost_per_m['input'] + output_tokens * cost_per_m['output']) / 1_000_000

        return round(cost, 4)

    def _print_comparison(self, comparison: ComparisonResult):
        """Imprime resultado da comparação"""
        console.print()
        console.rule("[bold]Resultado da Comparação")

        # Tabela de métricas
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Métrica")
        table.add_column("n8n")
        table.add_column("Claude")
        table.add_column("Diferença")

        m = comparison.metrics

        # Classificação
        class_match = "OK" if m.get('classification_match') else "DIFF"
        class_color = "green" if m.get('classification_match') else "red"
        table.add_row(
            "Classificação",
            m.get('n8n_classification', 'N/A'),
            m.get('claude_classification', 'N/A'),
            f"[{class_color}]{class_match}"
        )

        # Score
        score_diff = m.get('score_difference', 0)
        score_color = "green" if score_diff < 5 else "yellow" if score_diff < 10 else "red"
        table.add_row(
            "Score",
            str(m.get('n8n_score', 'N/A')),
            str(m.get('claude_score', 'N/A')),
            f"[{score_color}]{score_diff:.1f}"
        )

        # Tempo
        time_ratio = m.get('time_ratio', 0)
        time_color = "green" if time_ratio < 2 else "yellow" if time_ratio < 5 else "red"
        table.add_row(
            "Tempo (ms)",
            str(m.get('n8n_time_ms', 'N/A')),
            str(m.get('claude_time_ms', 'N/A')),
            f"[{time_color}]{time_ratio:.1f}x"
        )

        # Tokens e custo
        table.add_row(
            "Tokens",
            "N/A",
            str(m.get('total_tokens', 0)),
            ""
        )

        table.add_row(
            "Custo Est. (USD)",
            "~$0",
            f"${m.get('estimated_cost_usd', 0):.4f}",
            ""
        )

        console.print(table)

        # Resumo
        console.print()
        if m.get('classification_match') and m.get('score_difference', 100) < 10:
            console.print("[green]Resultados consistentes entre n8n e Claude!")
        else:
            console.print("[yellow]Diferenças encontradas - revisar resultados")


# ============================================
# CLI
# ============================================

@click.command()
@click.option('--workflow-id', '-w', required=True, help='n8n Workflow ID')
@click.option('--contact-id', '-c', required=True, help='Contact ID')
@click.option('--location-id', '-l', default=None, help='Location ID')
@click.option('--pipeline', '-p', default='full', help='Claude pipeline')
@click.option('--output', '-o', default=None, help='Output JSON file')
def compare(workflow_id: str, contact_id: str, location_id: str, pipeline: str, output: str):
    """Compare n8n workflow with Claude agents"""
    comparator = Comparator()

    result = asyncio.run(comparator.compare(
        workflow_id=workflow_id,
        contact_id=contact_id,
        location_id=location_id,
        pipeline=pipeline
    ))

    if output:
        with open(output, 'w') as f:
            json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
        console.print(f"[green]Resultado salvo em {output}")


if __name__ == "__main__":
    compare()
