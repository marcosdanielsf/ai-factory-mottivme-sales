"""
AI Factory Testing Framework - Skill Loader
============================================
Carrega skills de arquivos Markdown (estilo Obsidian/Claude Code).
"""

import json
import logging
import os
import re
from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime

from .supabase_client import SupabaseClient

logger = logging.getLogger(__name__)


class SkillLoader:
    """
    Carrega skills de diretórios de arquivos Markdown.

    Estrutura esperada:
    skills/
    ├── isabella-sdr/
    │   ├── INSTRUCTIONS.md
    │   ├── EXAMPLES.md
    │   ├── RUBRIC.md
    │   ├── KNOWLEDGE.md (auto-gerado)
    │   └── test-cases.json
    │
    └── generic-sdr/
        └── ... (fallback)
    """

    def __init__(
        self,
        skills_dir: str = "./skills",
        supabase_client: SupabaseClient = None
    ):
        self.skills_dir = Path(skills_dir)
        self.supabase = supabase_client

        if not self.skills_dir.exists():
            self.skills_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created skills directory: {self.skills_dir}")

    def load_skill(self, agent_name: str) -> Optional[Dict]:
        """
        Carrega skill de skills/{agent_name}/

        Args:
            agent_name: Nome do agente (ex: "isabella-sdr")

        Returns:
            {
                'instructions': str,
                'examples': str,
                'rubric': str,
                'knowledge': str,
                'test_cases': List[Dict],
                'metadata': Dict
            }
        """
        # Normalizar nome
        skill_name = self._normalize_name(agent_name)
        skill_path = self.skills_dir / skill_name

        if not skill_path.exists():
            logger.warning(f"Skill directory not found: {skill_path}")
            # Tentar fallback genérico
            return self._load_fallback_skill()

        logger.info(f"Loading skill from: {skill_path}")

        skill = {
            'name': skill_name,
            'path': str(skill_path),
            'instructions': self._load_file(skill_path / 'INSTRUCTIONS.md'),
            'examples': self._load_file(skill_path / 'EXAMPLES.md'),
            'rubric': self._load_file(skill_path / 'RUBRIC.md'),
            'knowledge': self._load_file(skill_path / 'KNOWLEDGE.md'),
            'test_cases': self._load_test_cases(skill_path / 'test-cases.json'),
            'metadata': self._extract_metadata(skill_path),
            'loaded_at': datetime.utcnow().isoformat()
        }

        # Validar skill mínimo
        if not skill['instructions']:
            logger.warning(f"Skill {skill_name} has no INSTRUCTIONS.md")
            return self._load_fallback_skill()

        return skill

    def _normalize_name(self, name: str) -> str:
        """Normaliza nome para formato de diretório"""
        return name.lower().replace(' ', '-').replace('_', '-')

    def _load_file(self, filepath: Path) -> Optional[str]:
        """Carrega conteúdo de arquivo markdown"""
        if not filepath.exists():
            return None

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Limpar comentários HTML e metadados frontmatter
            content = self._clean_markdown(content)
            return content.strip()

        except Exception as e:
            logger.error(f"Error loading {filepath}: {e}")
            return None

    def _clean_markdown(self, content: str) -> str:
        """Remove frontmatter YAML e comentários HTML"""
        # Remover frontmatter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                content = parts[2]

        # Remover comentários HTML
        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

        return content

    def _load_test_cases(self, filepath: Path) -> List[Dict]:
        """Carrega casos de teste de JSON"""
        if not filepath.exists():
            return []

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading test cases from {filepath}: {e}")
            return []

    def _extract_metadata(self, skill_path: Path) -> Dict:
        """Extrai metadados do skill"""
        metadata = {
            'files': [],
            'last_modified': None
        }

        for file in skill_path.glob('*'):
            if file.is_file():
                metadata['files'].append(file.name)
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                if not metadata['last_modified'] or mtime > metadata['last_modified']:
                    metadata['last_modified'] = mtime

        if metadata['last_modified']:
            metadata['last_modified'] = metadata['last_modified'].isoformat()

        return metadata

    def _load_fallback_skill(self) -> Optional[Dict]:
        """Carrega skill genérico como fallback"""
        fallback_path = self.skills_dir / 'generic-sdr'

        if fallback_path.exists():
            return self.load_skill('generic-sdr')

        # Retorna skill mínimo
        logger.info("Using minimal fallback skill")
        return {
            'name': 'fallback',
            'instructions': self._get_default_instructions(),
            'examples': None,
            'rubric': None,
            'knowledge': None,
            'test_cases': [],
            'metadata': {},
            'loaded_at': datetime.utcnow().isoformat()
        }

    def _get_default_instructions(self) -> str:
        """Instruções padrão para agentes SDR"""
        return """# Instruções Padrão - Agente SDR

## Objetivo
Qualificar leads e agendar consultas/reuniões.

## Tom de Voz
- Consultivo, não vendedor
- Empático e acolhedor
- Profissional mas amigável

## Qualificação (BANT)
- Budget: Entender capacidade de investimento
- Authority: Identificar decisor
- Need: Descobrir dor/necessidade real
- Timeline: Identificar urgência

## Regras
- Nunca inventar informações
- Sempre responder perguntas
- Direcionar para agendamento
- Manter conversa fluindo
"""

    def list_skills(self) -> List[Dict]:
        """Lista todos os skills disponíveis"""
        skills = []

        for item in self.skills_dir.iterdir():
            if item.is_dir() and not item.name.startswith('_'):
                skill_info = {
                    'name': item.name,
                    'path': str(item),
                    'has_instructions': (item / 'INSTRUCTIONS.md').exists(),
                    'has_rubric': (item / 'RUBRIC.md').exists(),
                    'has_examples': (item / 'EXAMPLES.md').exists(),
                    'has_knowledge': (item / 'KNOWLEDGE.md').exists(),
                    'has_test_cases': (item / 'test-cases.json').exists(),
                }
                skills.append(skill_info)

        return skills

    def sync_to_supabase(
        self,
        agent_version_id: str,
        skill: Dict = None,
        agent_name: str = None
    ) -> str:
        """
        Sincroniza skill local para Supabase.

        Args:
            agent_version_id: UUID do agent_version
            skill: Dict de skill já carregado (ou None para carregar)
            agent_name: Nome do agente para carregar skill

        Returns:
            skill_id criado
        """
        if not self.supabase:
            raise ValueError("SupabaseClient not configured")

        # Carregar skill se necessário
        if skill is None:
            if agent_name:
                skill = self.load_skill(agent_name)
            else:
                raise ValueError("Either skill or agent_name must be provided")

        if not skill:
            raise ValueError("Could not load skill")

        # Salvar no Supabase
        skill_id = self.supabase.save_skill(
            agent_version_id=agent_version_id,
            instructions=skill.get('instructions', ''),
            examples=skill.get('examples'),
            rubric=skill.get('rubric'),
            test_cases=skill.get('test_cases'),
            local_file_path=skill.get('path')
        )

        logger.info(f"Synced skill {skill['name']} to Supabase: {skill_id}")
        return skill_id

    def generate_skill_template(self, agent_name: str) -> Path:
        """
        Gera template de skill para um novo agente.

        Returns:
            Path do diretório criado
        """
        skill_name = self._normalize_name(agent_name)
        skill_path = self.skills_dir / skill_name

        skill_path.mkdir(parents=True, exist_ok=True)

        # INSTRUCTIONS.md
        instructions_content = f"""# {agent_name} - Instruções

## Objetivo
[Descreva o objetivo principal do agente]

## Persona
[Defina nome, personalidade, tom de voz]

## Qualificação
[Defina critérios de qualificação de leads]

## Regras
[Liste as regras e guardrails]

## Respostas Padrão
[Inclua respostas para situações comuns]
"""
        (skill_path / 'INSTRUCTIONS.md').write_text(instructions_content, encoding='utf-8')

        # EXAMPLES.md
        examples_content = f"""# {agent_name} - Exemplos de Conversas

## Exemplo 1: Lead Frio

**Lead:** Oi
**Agente:** [Resposta ideal]

---

## Exemplo 2: Pergunta sobre Preço

**Lead:** Quanto custa?
**Agente:** [Resposta ideal]
"""
        (skill_path / 'EXAMPLES.md').write_text(examples_content, encoding='utf-8')

        # RUBRIC.md
        rubric_content = f"""# {agent_name} - Rubrica de Avaliação

## Dimensões

### 1. Completeness (25%)
[Critérios específicos]

### 2. Tone (20%)
[Critérios específicos]

### 3. Engagement (20%)
[Critérios específicos]

### 4. Compliance (20%)
[Critérios específicos]

### 5. Conversion (15%)
[Critérios específicos]
"""
        (skill_path / 'RUBRIC.md').write_text(rubric_content, encoding='utf-8')

        # test-cases.json
        test_cases = [
            {
                "name": "Lead frio",
                "input": "Oi",
                "expected_behavior": "Saudação + pergunta aberta",
                "rubric_focus": ["tone", "engagement"]
            },
            {
                "name": "Pergunta preço",
                "input": "Quanto custa?",
                "expected_behavior": "Âncora valor + qualificação",
                "rubric_focus": ["compliance", "completeness"]
            }
        ]
        (skill_path / 'test-cases.json').write_text(
            json.dumps(test_cases, indent=2, ensure_ascii=False),
            encoding='utf-8'
        )

        logger.info(f"Generated skill template at: {skill_path}")
        return skill_path


class KnowledgeGenerator:
    """
    Gera KNOWLEDGE.md automaticamente baseado em:
    - Agent version (system_prompt)
    - Test results (últimos N)
    - Conversations de alta qualidade
    - Metrics
    """

    def __init__(self, supabase_client: SupabaseClient):
        self.supabase = supabase_client

    async def generate_knowledge(
        self,
        agent_version_id: str,
        output_path: Path = None
    ) -> str:
        """
        Gera KNOWLEDGE.md para um agente.

        Returns:
            Conteúdo do KNOWLEDGE.md
        """
        # Carregar dados
        agent = self.supabase.get_agent_version(agent_version_id)
        test_results = self.supabase.get_test_results_history(agent_version_id, limit=10)
        conversations = self.supabase.get_recent_conversations(agent_version_id, limit=50)
        metrics = self.supabase.get_agent_metrics(agent_version_id, days=30)

        # Gerar conteúdo
        content = self._build_knowledge_content(
            agent=agent,
            test_results=test_results,
            conversations=conversations,
            metrics=metrics
        )

        # Salvar se path fornecido
        if output_path:
            output_path.write_text(content, encoding='utf-8')
            logger.info(f"Generated KNOWLEDGE.md: {output_path}")

        return content

    def _build_knowledge_content(
        self,
        agent: Dict,
        test_results: List[Dict],
        conversations: List[Dict],
        metrics: List[Dict]
    ) -> str:
        """Monta o conteúdo do KNOWLEDGE.md"""

        agent_name = agent.get('agent_name', 'Agent') if agent else 'Agent'
        version = agent.get('version', '1.0') if agent else '1.0'

        content = f"""# {agent_name} - Knowledge Base
> Gerado automaticamente em {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}
> Versão: {version}

## Resumo de Performance

"""
        # Adicionar métricas se disponíveis
        if test_results:
            last_score = test_results[0].get('overall_score', 0)
            avg_score = sum(t.get('overall_score', 0) for t in test_results) / len(test_results)
            content += f"""### Scores de Teste
- Último Score: {last_score:.1f}/10
- Média (últimos {len(test_results)} testes): {avg_score:.1f}/10

"""

        # Adicionar conversas de sucesso como exemplos
        if conversations:
            content += """## Exemplos de Conversas de Sucesso

"""
            for i, conv in enumerate(conversations[:5], 1):
                content += f"""### Conversa {i}
**Score:** {conv.get('sentiment_score', 'N/A')}

```
[Transcrição resumida]
```

---

"""

        # Adicionar insights de teste
        if test_results and test_results[0].get('test_details'):
            details = test_results[0]['test_details']

            if details.get('strengths'):
                content += """## Pontos Fortes Identificados

"""
                for s in details['strengths']:
                    content += f"- {s}\n"
                content += "\n"

            if details.get('weaknesses'):
                content += """## Áreas de Melhoria

"""
                for w in details['weaknesses']:
                    content += f"- {w}\n"
                content += "\n"

        return content
