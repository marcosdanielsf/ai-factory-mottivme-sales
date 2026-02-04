"""
AI Factory Runner - Executor Principal
======================================
Integra todos os componentes e permite execução completa do pipeline.
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

import httpx
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from dotenv import load_dotenv

from orchestrator import AgentOrchestrator, PipelineResult
from compare import Comparator, N8NClient

# Carregar variáveis de ambiente
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
console = Console()


class GHLClient:
    """Cliente para GoHighLevel API"""

    def __init__(
        self,
        api_key: str = None,
        location_id: str = None
    ):
        self.api_key = api_key or os.getenv('GHL_API_KEY')
        self.location_id = location_id or os.getenv('GHL_LOCATION_ID')
        self.base_url = "https://services.leadconnectorhq.com"

        if not self.api_key:
            raise ValueError("GHL_API_KEY must be set")

        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
        }

    async def get_contact(self, contact_id: str) -> Dict:
        """Busca dados de um contato"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.base_url}/contacts/{contact_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json().get('contact', {})

    async def get_conversation(self, contact_id: str) -> Dict:
        """Busca conversas de um contato"""
        async with httpx.AsyncClient(timeout=30) as client:
            # Primeiro busca a conversa
            response = await client.get(
                f"{self.base_url}/conversations/search",
                params={'contactId': contact_id, 'locationId': self.location_id},
                headers=self.headers
            )
            response.raise_for_status()
            conversations = response.json().get('conversations', [])

            if not conversations:
                return {'messages': []}

            # Depois busca as mensagens
            conv_id = conversations[0].get('id')
            response = await client.get(
                f"{self.base_url}/conversations/{conv_id}/messages",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def search_contacts(
        self,
        query: str = None,
        limit: int = 20,
        tags: List[str] = None
    ) -> List[Dict]:
        """Busca contatos"""
        async with httpx.AsyncClient(timeout=30) as client:
            params = {
                'locationId': self.location_id,
                'limit': limit
            }
            if query:
                params['query'] = query

            response = await client.get(
                f"{self.base_url}/contacts/",
                params=params,
                headers=self.headers
            )
            response.raise_for_status()
            contacts = response.json().get('contacts', [])

            # Filtrar por tags se especificado
            if tags:
                contacts = [
                    c for c in contacts
                    if any(t in c.get('tags', []) for t in tags)
                ]

            return contacts


class AIFactoryRunner:
    """
    Runner principal do AI Factory.

    Executa pipelines completos com dados reais do GHL.
    """

    def __init__(
        self,
        config_path: str = "config.yaml",
        ghl_api_key: str = None,
        ghl_location_id: str = None
    ):
        self.orchestrator = AgentOrchestrator(config_path=config_path)
        self.ghl_client = GHLClient(
            api_key=ghl_api_key,
            location_id=ghl_location_id
        )
        self.results_dir = Path("results")
        self.results_dir.mkdir(exist_ok=True)

    async def run_for_contact(
        self,
        contact_id: str,
        pipeline: str = 'full',
        save_results: bool = True
    ) -> PipelineResult:
        """
        Executa pipeline completo para um contato.

        Args:
            contact_id: ID do contato no GHL
            pipeline: Nome do pipeline a executar
            save_results: Se deve salvar resultados em arquivo
        """
        console.print(f"\n[bold cyan]AI Factory Runner[/bold cyan]")
        console.print(f"Contato: {contact_id}")
        console.print(f"Pipeline: {pipeline}")
        console.rule()

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            # 1. Buscar dados do GHL
            task = progress.add_task("Buscando dados do GHL...", total=None)

            try:
                contact_data = await self.ghl_client.get_contact(contact_id)
                conversation_data = await self.ghl_client.get_conversation(contact_id)
            except Exception as e:
                logger.error(f"Erro ao buscar dados do GHL: {e}")
                console.print(f"[red]Erro: {e}")
                return None

            progress.update(task, description="Dados carregados!", completed=True)

            # Mostrar resumo do contato
            self._print_contact_summary(contact_data, conversation_data)

            # 2. Preparar input
            input_data = {
                'contact_id': contact_id,
                'location_id': self.ghl_client.location_id,
                'contact_data': contact_data,
                'conversation_data': conversation_data
            }

            # 3. Executar pipeline
            result = await self.orchestrator.run_pipeline(pipeline, input_data)

            # 4. Salvar resultados
            if save_results and result:
                output_file = self.results_dir / f"{contact_id}_{pipeline}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
                console.print(f"\n[green]Resultados salvos em: {output_file}")

            return result

    async def run_batch(
        self,
        contact_ids: List[str] = None,
        query: str = None,
        tags: List[str] = None,
        limit: int = 10,
        pipeline: str = 'full'
    ) -> List[PipelineResult]:
        """
        Executa pipeline para múltiplos contatos.

        Args:
            contact_ids: Lista de IDs específicos
            query: Query para buscar contatos
            tags: Tags para filtrar contatos
            limit: Limite de contatos
            pipeline: Pipeline a executar
        """
        results = []

        # Se não passou IDs, buscar do GHL
        if not contact_ids:
            console.print("[cyan]Buscando contatos do GHL...")
            contacts = await self.ghl_client.search_contacts(
                query=query,
                limit=limit,
                tags=tags
            )
            contact_ids = [c['id'] for c in contacts]
            console.print(f"[green]Encontrados {len(contact_ids)} contatos")

        # Processar cada contato
        for i, contact_id in enumerate(contact_ids, 1):
            console.print(f"\n[bold]Processando {i}/{len(contact_ids)}: {contact_id}")

            try:
                result = await self.run_for_contact(
                    contact_id=contact_id,
                    pipeline=pipeline,
                    save_results=True
                )
                if result:
                    results.append(result)
            except Exception as e:
                logger.error(f"Erro ao processar {contact_id}: {e}")
                console.print(f"[red]Erro: {e}")
                continue

        # Resumo final
        self._print_batch_summary(results)

        return results

    async def compare_with_n8n(
        self,
        workflow_id: str,
        contact_id: str,
        pipeline: str = 'full'
    ) -> Dict:
        """
        Compara resultados do Claude com n8n.

        Args:
            workflow_id: ID do workflow n8n
            contact_id: ID do contato
            pipeline: Pipeline Claude a usar
        """
        comparator = Comparator(
            orchestrator=self.orchestrator,
            n8n_client=N8NClient()
        )

        return await comparator.compare(
            workflow_id=workflow_id,
            contact_id=contact_id,
            location_id=self.ghl_client.location_id,
            pipeline=pipeline
        )

    def _print_contact_summary(self, contact: Dict, conversation: Dict):
        """Imprime resumo do contato"""
        name = contact.get('name') or contact.get('firstName', 'N/A')
        phone = contact.get('phone', 'N/A')
        email = contact.get('email', 'N/A')
        tags = ', '.join(contact.get('tags', [])) or 'Nenhuma'
        msg_count = len(conversation.get('messages', []))

        console.print(Panel(
            f"[bold]{name}[/bold]\n"
            f"Telefone: {phone}\n"
            f"Email: {email}\n"
            f"Tags: {tags}\n"
            f"Mensagens: {msg_count}",
            title="Contato",
            border_style="cyan"
        ))

    def _print_batch_summary(self, results: List[PipelineResult]):
        """Imprime resumo do processamento em lote"""
        console.print()
        console.rule("[bold]Resumo do Batch")

        total = len(results)
        successful = sum(1 for r in results if r.success)
        failed = total - successful

        # Estatísticas
        if results:
            avg_time = sum(r.total_time_ms for r in results) / len(results)
            avg_tokens = sum(r.total_tokens for r in results) / len(results)
            total_tokens = sum(r.total_tokens for r in results)

            # Classificações
            classifications = {}
            for r in results:
                if r.success and r.final_output:
                    sales = r.final_output.get('SalesAnalyzer', {})
                    cls = sales.get('classification', 'UNKNOWN')
                    classifications[cls] = classifications.get(cls, 0) + 1
        else:
            avg_time = 0
            avg_tokens = 0
            total_tokens = 0
            classifications = {}

        # Tabela de resultados
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Métrica")
        table.add_column("Valor")

        table.add_row("Total Processados", str(total))
        table.add_row("Sucesso", f"[green]{successful}")
        table.add_row("Falha", f"[red]{failed}")
        table.add_row("Tempo Médio", f"{avg_time:.0f}ms")
        table.add_row("Tokens Totais", f"{total_tokens:,}")
        table.add_row("Tokens Médio", f"{avg_tokens:.0f}")

        console.print(table)

        # Classificações
        if classifications:
            console.print("\n[bold]Distribuição de Leads:")
            for cls, count in sorted(classifications.items()):
                pct = (count / successful) * 100
                color = {
                    'HOT': 'red',
                    'WARM': 'yellow',
                    'COLD': 'blue',
                    'DISQUALIFIED': 'dim'
                }.get(cls, 'white')
                console.print(f"  [{color}]{cls}: {count} ({pct:.1f}%)")


# ============================================
# CLI
# ============================================

@click.group()
def cli():
    """AI Factory Runner - Executor de Pipelines"""
    pass


@cli.command()
@click.option('--contact-id', '-c', required=True, help='Contact ID')
@click.option('--pipeline', '-p', default='full', help='Pipeline name')
@click.option('--config', default='config.yaml', help='Config file')
def run(contact_id: str, pipeline: str, config: str):
    """Run pipeline for a single contact"""
    runner = AIFactoryRunner(config_path=config)
    asyncio.run(runner.run_for_contact(contact_id, pipeline))


@cli.command()
@click.option('--query', '-q', default=None, help='Search query')
@click.option('--tags', '-t', multiple=True, help='Filter by tags')
@click.option('--limit', '-l', default=10, help='Max contacts')
@click.option('--pipeline', '-p', default='full', help='Pipeline name')
@click.option('--config', default='config.yaml', help='Config file')
def batch(query: str, tags: tuple, limit: int, pipeline: str, config: str):
    """Run pipeline for multiple contacts"""
    runner = AIFactoryRunner(config_path=config)
    asyncio.run(runner.run_batch(
        query=query,
        tags=list(tags) if tags else None,
        limit=limit,
        pipeline=pipeline
    ))


@cli.command()
@click.option('--workflow-id', '-w', required=True, help='n8n Workflow ID')
@click.option('--contact-id', '-c', required=True, help='Contact ID')
@click.option('--pipeline', '-p', default='full', help='Claude pipeline')
@click.option('--config', default='config.yaml', help='Config file')
def compare(workflow_id: str, contact_id: str, pipeline: str, config: str):
    """Compare Claude results with n8n workflow"""
    runner = AIFactoryRunner(config_path=config)
    asyncio.run(runner.compare_with_n8n(workflow_id, contact_id, pipeline))


@cli.command()
@click.option('--config', default='config.yaml', help='Config file')
def status(config: str):
    """Show system status"""
    console.print("[bold cyan]AI Factory Status")
    console.rule()

    # Verificar variáveis de ambiente
    checks = {
        'ANTHROPIC_API_KEY': bool(os.getenv('ANTHROPIC_API_KEY')),
        'GHL_API_KEY': bool(os.getenv('GHL_API_KEY')),
        'GHL_LOCATION_ID': bool(os.getenv('GHL_LOCATION_ID')),
        'N8N_API_KEY': bool(os.getenv('N8N_API_KEY'))
    }

    table = Table(show_header=True, header_style="bold")
    table.add_column("Configuração")
    table.add_column("Status")

    for name, ok in checks.items():
        status_str = "[green]OK" if ok else "[red]FALTANDO"
        table.add_row(name, status_str)

    console.print(table)

    # Verificar config.yaml
    config_path = Path(config)
    if config_path.exists():
        console.print(f"\n[green]Config file: {config}")
    else:
        console.print(f"\n[yellow]Config file not found: {config}")


if __name__ == "__main__":
    cli()
