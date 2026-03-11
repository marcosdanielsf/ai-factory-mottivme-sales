"""
AI Factory - Quick Test
=======================
Teste rápido do sistema sem dependências externas.
"""

import asyncio
import json
from datetime import datetime

from rich.console import Console
from rich.panel import Panel

from orchestrator import AgentOrchestrator
from agents import SalesAnalyzerAgent, PromptGeneratorAgent, ValidatorAgent

console = Console()


async def test_sales_analyzer():
    """Testa o agente de análise de vendas com dados mockados"""
    console.print("\n[bold cyan]Teste 1: SalesAnalyzerAgent")
    console.rule()

    # Dados mockados de uma conversa
    mock_input = {
        'contact_data': {
            'name': 'Maria Silva',
            'phone': '+5511999999999',
            'email': 'maria@email.com',
            'source': 'Instagram',
            'tags': ['lead', 'menopausa']
        },
        'conversation_data': {
            'messages': [
                {'role': 'user', 'content': 'Oi, vi o post sobre menopausa'},
                {'role': 'assistant', 'content': 'Olá! Que bom que nos procurou. O que mais chamou sua atenção?'},
                {'role': 'user', 'content': 'Estou tendo ondas de calor terríveis, já 2 anos assim'},
                {'role': 'assistant', 'content': 'Entendo como isso pode ser desconfortável. Você já tentou algum tratamento?'},
                {'role': 'user', 'content': 'Já tentei chás e suplementos, mas nada resolve'},
                {'role': 'assistant', 'content': 'A reposição hormonal bioidêntica costuma ter ótimos resultados. Gostaria de saber mais sobre nossa consulta?'},
                {'role': 'user', 'content': 'Sim, quanto custa?'},
                {'role': 'assistant', 'content': 'A consulta é R$971, com duração de 1h30. Temos opções de parcelamento.'},
                {'role': 'user', 'content': 'Ok, preciso falar com meu marido primeiro'},
            ]
        },
        'analysis_data': {
            'main_interest': 'Tratamento para menopausa',
            'questions_asked': ['Preço da consulta'],
            'objections': ['Precisa falar com marido'],
            'interest_signals': ['Tem sintomas há 2 anos', 'Já tentou outras soluções']
        }
    }

    # Executar agente
    agent = SalesAnalyzerAgent()

    console.print("[yellow]Executando análise...")
    result = await agent.execute(mock_input)

    if result.success:
        console.print("[green]Sucesso!")
        console.print(Panel(
            json.dumps(result.output, indent=2, ensure_ascii=False),
            title="Resultado da Análise",
            border_style="green"
        ))

        # Mostrar métricas
        classification = result.output.get('classification', 'N/A')
        score = result.output.get('score_total', 0)
        console.print(f"\n[bold]Classificação: {classification}")
        console.print(f"[bold]Score: {score}/100")
        console.print(f"[dim]Tokens: {result.tokens_used}")
        console.print(f"[dim]Tempo: {result.execution_time_ms}ms")
    else:
        console.print(f"[red]Erro: {result.error}")

    return result


async def test_prompt_generator():
    """Testa o gerador de prompts"""
    console.print("\n[bold cyan]Teste 2: PromptGeneratorAgent")
    console.rule()

    mock_input = {
        'business_config': {
            'company_name': 'Instituto Amare',
            'service': 'Medicina Integrativa - Saúde Feminina',
            'ticket': 'R$ 971 (consulta) a R$ 50.000 (tratamentos)',
            'target_audience': 'Mulheres 40+, alta renda, empresárias',
            'addresses': 'Balneário Camboriú e Florianópolis',
            'hours': 'Segunda a Sexta, 9h-18h',
            'phone': '(47) 99999-9999',
            'consultation_price': 'R$ 971',
            'payment_methods': 'PIX, Cartão (até 12x)',
            'calendar_link': 'https://instituto-amare.com/agendar',
            'differentials': '''
            - Dra. Ana Paula: Especialista em hormônios bioidênticos
            - Abordagem integrativa (corpo + mente)
            - Mais de 500 pacientes tratadas
            - Resultados em 90 dias
            ''',
            'common_objections': '''
            - Preço alto → ROI em qualidade de vida
            - Precisa falar com marido → Oferecer consulta juntos
            - Longe → Consultas online disponíveis
            '''
        },
        'agent_name': 'Julia',
        'sales_analysis': {
            'classification': 'WARM',
            'score_total': 65,
            'analysis': {
                'pain_points': ['Ondas de calor', 'Insônia', 'Cansaço'],
                'objections': ['Precisa falar com marido', 'Preço']
            }
        }
    }

    agent = PromptGeneratorAgent()

    console.print("[yellow]Gerando prompt...")
    result = await agent.execute(mock_input)

    if result.success:
        console.print("[green]Sucesso!")

        # Mostrar resumo (prompt é muito longo)
        prompt_preview = result.output.get('system_prompt', '')[:500]
        console.print(Panel(
            f"{prompt_preview}...\n\n[dim](Prompt completo tem {len(result.output.get('system_prompt', ''))} caracteres)",
            title="Preview do Prompt Gerado",
            border_style="green"
        ))

        console.print(f"\n[dim]Tokens: {result.tokens_used}")
        console.print(f"[dim]Tempo: {result.execution_time_ms}ms")
    else:
        console.print(f"[red]Erro: {result.error}")

    return result


async def test_validator():
    """Testa o validador de agentes"""
    console.print("\n[bold cyan]Teste 3: ValidatorAgent (simulação rápida)")
    console.rule()

    # Prompt simples para teste
    test_prompt = """# Assistente Julia - Instituto Amare

Você é Julia, assistente virtual do Instituto Amare.

## Objetivo
Qualificar leads e agendar consultas com a Dra. Ana Paula.

## Instruções
1. Seja acolhedora e empática
2. Descubra a dor principal da paciente
3. Qualifique usando BANT
4. Direcione para agendamento

## Exemplo
LEAD: Oi
JULIA: Olá! Que bom ter você aqui. Sou a Julia do Instituto Amare.
O que trouxe você até nós hoje?
"""

    mock_input = {
        'system_prompt': test_prompt,
        'agent_name': 'Julia Test',
        'test_cases': [
            {
                'name': 'Saudação inicial',
                'input': 'Oi',
                'expected_behavior': 'Saudação acolhedora + pergunta aberta'
            },
            {
                'name': 'Pergunta sobre preço',
                'input': 'Quanto custa a consulta?',
                'expected_behavior': 'Âncora valor + qualificação'
            }
        ],
        'threshold': 7.0  # Threshold mais baixo para teste
    }

    agent = ValidatorAgent()

    console.print("[yellow]Executando validação (2 testes)...")
    result = await agent.execute(mock_input)

    if result.success:
        console.print("[green]Sucesso!")

        output = result.output
        console.print(Panel(
            f"Score Geral: {output.get('overall_score', 'N/A')}/10\n"
            f"Status: {output.get('approval_status', 'N/A')}\n"
            f"Passou: {'Sim' if output.get('passed') else 'Não'}",
            title="Resultado da Validação",
            border_style="green" if output.get('passed') else "yellow"
        ))

        # Scores por dimensão
        scores = output.get('scores', {})
        if scores:
            console.print("\n[bold]Scores por Dimensão:")
            for dim, score in scores.items():
                console.print(f"  {dim}: {score}")

        console.print(f"\n[dim]Tokens: {result.tokens_used}")
        console.print(f"[dim]Tempo: {result.execution_time_ms}ms")
    else:
        console.print(f"[red]Erro: {result.error}")

    return result


async def test_pipeline_mock():
    """Testa o pipeline completo com dados mockados"""
    console.print("\n[bold cyan]Teste 4: Pipeline Completo (mock)")
    console.rule()

    orchestrator = AgentOrchestrator()

    # Mostrar agentes disponíveis
    console.print("[bold]Agentes registrados:")
    for name, agent in orchestrator.agents.items():
        console.print(f"  - {name}: {agent.config.description}")

    # Mostrar pipelines
    console.print("\n[bold]Pipelines disponíveis:")
    for name, config in orchestrator.config.get('pipelines', {}).items():
        agents = config.get('agents', [])
        console.print(f"  - {name}: {' -> '.join(agents)}")


async def main():
    """Executa todos os testes"""
    console.print(Panel(
        "[bold]AI Factory - Quick Tests[/bold]\n\n"
        "Testando agentes com dados mockados\n"
        "(não requer credenciais reais)",
        border_style="cyan"
    ))

    # Verificar se tem API key
    import os
    if not os.getenv('ANTHROPIC_API_KEY'):
        console.print("\n[yellow]ANTHROPIC_API_KEY não configurada!")
        console.print("Os testes 1-3 irão falhar sem a API key.")
        console.print("Configure em .env ou exporte a variável.\n")

        # Apenas mostrar estrutura
        await test_pipeline_mock()
        return

    # Executar testes
    try:
        await test_sales_analyzer()
    except Exception as e:
        console.print(f"[red]Erro no teste 1: {e}")

    try:
        await test_prompt_generator()
    except Exception as e:
        console.print(f"[red]Erro no teste 2: {e}")

    try:
        await test_validator()
    except Exception as e:
        console.print(f"[red]Erro no teste 3: {e}")

    await test_pipeline_mock()

    console.print("\n[bold green]Testes concluídos!")


if __name__ == "__main__":
    asyncio.run(main())
