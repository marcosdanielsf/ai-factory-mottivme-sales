"""
AI Factory Testing Framework - Report Generator
================================================
Gera relatórios HTML de avaliação de agentes.
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

# Template HTML inline (para não depender de arquivos externos)
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - {{ agent_name }} v{{ version }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .score-card { transition: all 0.3s ease; }
        .score-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .test-case { border-left: 4px solid #e5e7eb; }
        .test-case.passed { border-left-color: #10b981; }
        .test-case.failed { border-left-color: #ef4444; }
        .badge { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
        .badge-success { background-color: #d1fae5; color: #065f46; }
        .badge-warning { background-color: #fef3c7; color: #92400e; }
        .badge-danger { background-color: #fee2e2; color: #991b1b; }
        .progress-bar { height: 8px; border-radius: 4px; background-color: #e5e7eb; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold">{{ agent_name }}</h1>
                    <p class="text-indigo-200 mt-1">Versão {{ version }} | {{ client_name }}</p>
                </div>
                <div class="text-right">
                    <div class="text-5xl font-bold">{{ overall_score }}<span class="text-2xl">/10</span></div>
                    <p class="text-indigo-200 mt-1">Score Geral</p>
                </div>
            </div>
        </div>
    </header>

    <!-- Summary Cards -->
    <div class="max-w-6xl mx-auto px-4 -mt-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            {% for dimension, score in scores.items() %}
            <div class="score-card bg-white rounded-lg shadow-md p-4">
                <div class="text-gray-500 text-sm uppercase tracking-wide">{{ dimension }}</div>
                <div class="text-2xl font-bold mt-1 {% if score >= 8 %}text-green-600{% elif score >= 6 %}text-yellow-600{% else %}text-red-600{% endif %}">
                    {{ "%.1f"|format(score) }}
                </div>
                <div class="progress-bar mt-2">
                    <div class="progress-fill {% if score >= 8 %}bg-green-500{% elif score >= 6 %}bg-yellow-500{% else %}bg-red-500{% endif %}"
                         style="width: {{ score * 10 }}%"></div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- Left Column: Strengths & Weaknesses -->
            <div class="lg:col-span-1 space-y-6">

                <!-- Strengths -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-lg font-semibold text-green-700 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        Pontos Fortes
                    </h2>
                    <ul class="mt-4 space-y-2">
                        {% for strength in strengths %}
                        <li class="flex items-start gap-2">
                            <span class="text-green-500 mt-0.5">+</span>
                            <span class="text-gray-700">{{ strength }}</span>
                        </li>
                        {% endfor %}
                    </ul>
                </div>

                <!-- Weaknesses -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-lg font-semibold text-yellow-700 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                        Pontos de Melhoria
                    </h2>
                    <ul class="mt-4 space-y-2">
                        {% for weakness in weaknesses %}
                        <li class="flex items-start gap-2">
                            <span class="text-yellow-500 mt-0.5">!</span>
                            <span class="text-gray-700">{{ weakness }}</span>
                        </li>
                        {% endfor %}
                    </ul>
                </div>

                {% if failures %}
                <!-- Failures -->
                <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                    <h2 class="text-lg font-semibold text-red-700 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                        Falhas Críticas
                    </h2>
                    <ul class="mt-4 space-y-2">
                        {% for failure in failures %}
                        <li class="flex items-start gap-2">
                            <span class="text-red-500 mt-0.5">X</span>
                            <span class="text-gray-700">{{ failure }}</span>
                        </li>
                        {% endfor %}
                    </ul>
                </div>
                {% endif %}

                {% if recommendations %}
                <!-- Recommendations -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-lg font-semibold text-indigo-700 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
                        </svg>
                        Recomendações
                    </h2>
                    <ul class="mt-4 space-y-2">
                        {% for rec in recommendations %}
                        <li class="flex items-start gap-2">
                            <span class="text-indigo-500 mt-0.5">→</span>
                            <span class="text-gray-700">{{ rec }}</span>
                        </li>
                        {% endfor %}
                    </ul>
                </div>
                {% endif %}
            </div>

            <!-- Right Column: Test Cases -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Casos de Teste</h2>

                    <div class="space-y-4">
                        {% for test in test_results %}
                        <div class="test-case {% if test.score >= 7 %}passed{% else %}failed{% endif %} bg-gray-50 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-medium text-gray-800">{{ test.name }}</h3>
                                <span class="badge {% if test.score >= 8 %}badge-success{% elif test.score >= 6 %}badge-warning{% else %}badge-danger{% endif %}">
                                    {{ "%.1f"|format(test.score) }}/10
                                </span>
                            </div>

                            <div class="space-y-2 text-sm">
                                <div>
                                    <span class="font-medium text-gray-600">Input:</span>
                                    <p class="text-gray-700 bg-white p-2 rounded mt-1">{{ test.input }}</p>
                                </div>
                                <div>
                                    <span class="font-medium text-gray-600">Resposta do Agente:</span>
                                    <p class="text-gray-700 bg-white p-2 rounded mt-1">{{ test.agent_response }}</p>
                                </div>
                                {% if test.feedback %}
                                <div>
                                    <span class="font-medium text-gray-600">Feedback:</span>
                                    <p class="text-gray-600 italic mt-1">{{ test.feedback }}</p>
                                </div>
                                {% endif %}
                            </div>
                        </div>
                        {% endfor %}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-100 py-6 mt-8">
        <div class="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>Gerado em {{ generated_at }} | AI Factory Testing Framework v1.0</p>
            <p class="mt-1">Avaliador: Claude Opus | {{ total_tests }} testes executados em {{ duration_ms }}ms</p>
        </div>
    </footer>
</body>
</html>
'''


class ReportGenerator:
    """
    Gerador de relatórios HTML para avaliação de agentes.

    Features:
    - Relatórios bonitos com Tailwind CSS
    - Scores visuais com barras de progresso
    - Detalhes de cada caso de teste
    - Exportação para arquivo local ou URL
    """

    def __init__(
        self,
        output_dir: str = "./reports",
        public_url_base: str = None
    ):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.public_url_base = public_url_base

        logger.info(f"ReportGenerator initialized: output_dir={output_dir}")

    async def generate_html_report(
        self,
        agent: Dict,
        evaluation: Dict,
        test_results: List[Dict]
    ) -> str:
        """
        Gera relatório HTML completo.

        Args:
            agent: Info do agente
            evaluation: Resultado da avaliação
            test_results: Lista de resultados dos testes

        Returns:
            URL ou path do relatório gerado
        """
        logger.info(f"Generating report for agent: {agent.get('agent_name', 'Unknown')}")

        # Preparar dados para o template
        context = self._prepare_context(agent, evaluation, test_results)

        # Renderizar template
        html_content = self._render_template(context)

        # Salvar arquivo
        filename = self._generate_filename(agent)
        filepath = self.output_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        logger.info(f"Report saved: {filepath}")

        # Retornar URL ou path
        if self.public_url_base:
            return f"{self.public_url_base.rstrip('/')}/{filename}"
        else:
            return str(filepath)

    def _prepare_context(
        self,
        agent: Dict,
        evaluation: Dict,
        test_results: List[Dict]
    ) -> Dict:
        """Prepara contexto para o template"""
        return {
            'agent_name': agent.get('agent_name', 'Unknown Agent'),
            'version': agent.get('version', '1.0'),
            'client_name': self._get_client_name(agent),
            'overall_score': evaluation.get('overall_score', 0),
            'scores': evaluation.get('scores', {}),
            'strengths': evaluation.get('strengths', []),
            'weaknesses': evaluation.get('weaknesses', []),
            'failures': evaluation.get('failures', []),
            'warnings': evaluation.get('warnings', []),
            'recommendations': evaluation.get('recommendations', []),
            'test_results': test_results,
            'generated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'total_tests': len(test_results),
            'duration_ms': evaluation.get('duration_ms', 0)
        }

    def _get_client_name(self, agent: Dict) -> str:
        """Extrai nome do cliente do agent"""
        if agent.get('clients'):
            return agent['clients'].get('name', 'Unknown Client')
        return agent.get('client_name', 'Unknown Client')

    def _render_template(self, context: Dict) -> str:
        """Renderiza o template HTML com Jinja2-like substitution"""
        try:
            from jinja2 import Template
            template = Template(HTML_TEMPLATE)
            return template.render(**context)
        except ImportError:
            # Fallback: simple string replacement
            logger.warning("Jinja2 not installed, using fallback rendering")
            return self._simple_render(context)

    def _simple_render(self, context: Dict) -> str:
        """Renderização simples sem Jinja2"""
        html = HTML_TEMPLATE

        # Substituições básicas
        replacements = {
            '{{ agent_name }}': str(context.get('agent_name', '')),
            '{{ version }}': str(context.get('version', '')),
            '{{ client_name }}': str(context.get('client_name', '')),
            '{{ overall_score }}': str(context.get('overall_score', 0)),
            '{{ generated_at }}': str(context.get('generated_at', '')),
            '{{ total_tests }}': str(context.get('total_tests', 0)),
            '{{ duration_ms }}': str(context.get('duration_ms', 0)),
        }

        for key, value in replacements.items():
            html = html.replace(key, value)

        # Para loops e condicionais, gerar HTML simples
        # (versão simplificada - use Jinja2 para produção)

        return html

    def _generate_filename(self, agent: Dict) -> str:
        """Gera nome de arquivo único"""
        agent_name = agent.get('agent_name', 'agent').lower().replace(' ', '-')
        version = agent.get('version', '1.0').replace('.', '-')
        timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')

        return f"report-{agent_name}-v{version}-{timestamp}.html"

    def generate_json_report(
        self,
        agent: Dict,
        evaluation: Dict,
        test_results: List[Dict]
    ) -> str:
        """Gera relatório em JSON (alternativa ao HTML)"""
        report = {
            'agent': {
                'id': agent.get('id'),
                'name': agent.get('agent_name'),
                'version': agent.get('version'),
            },
            'evaluation': evaluation,
            'test_results': test_results,
            'generated_at': datetime.utcnow().isoformat(),
        }

        filename = self._generate_filename(agent).replace('.html', '.json')
        filepath = self.output_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        logger.info(f"JSON report saved: {filepath}")
        return str(filepath)

    def generate_markdown_report(
        self,
        agent: Dict,
        evaluation: Dict,
        test_results: List[Dict]
    ) -> str:
        """Gera relatório em Markdown"""
        md_content = f"""# Test Report: {agent.get('agent_name', 'Unknown')}

**Versão:** {agent.get('version', '1.0')}
**Score Geral:** {evaluation.get('overall_score', 0)}/10
**Data:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}

---

## Scores por Dimensão

| Dimensão | Score |
|----------|-------|
"""
        for dimension, score in evaluation.get('scores', {}).items():
            md_content += f"| {dimension.capitalize()} | {score:.1f}/10 |\n"

        md_content += """
---

## Pontos Fortes

"""
        for strength in evaluation.get('strengths', []):
            md_content += f"- {strength}\n"

        md_content += """
## Pontos de Melhoria

"""
        for weakness in evaluation.get('weaknesses', []):
            md_content += f"- {weakness}\n"

        if evaluation.get('failures'):
            md_content += """
## Falhas Críticas

"""
            for failure in evaluation.get('failures', []):
                md_content += f"- **{failure}**\n"

        md_content += """
---

## Casos de Teste

"""
        for test in test_results:
            status = "Passou" if test.get('score', 0) >= 7 else "Falhou"
            md_content += f"""
### {test.get('name', 'Test')} ({status})

**Input:** {test.get('input', 'N/A')}

**Resposta:** {test.get('agent_response', 'N/A')}

**Score:** {test.get('score', 0)}/10

---
"""

        filename = self._generate_filename(agent).replace('.html', '.md')
        filepath = self.output_dir / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)

        logger.info(f"Markdown report saved: {filepath}")
        return str(filepath)
