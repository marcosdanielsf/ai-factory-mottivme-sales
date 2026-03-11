"""
AI Factory Agents
=================
Agentes Claude que replicam os workflows do AI Factory (n8n).

Arquitetura:
- Agentes 01-04: Pipeline principal (Extrator → Analisador → Gerador → Validador)
- Agentes 05-10: Sistema de Debate (Crítico, Defensor, Juiz, Especialistas)
- Agente 11: Script Writer (Roteirista de Conteudo para Growth OS)
"""

# Pipeline Principal
from .base_agent import BaseAgent
from .agent_01_extractor import DataExtractorAgent
from .agent_02_analyzer import SalesAnalyzerAgent
from .agent_03_generator import PromptGeneratorAgent
from .agent_04_validator import ValidatorAgent

# Sistema de Debate
from .agent_05_critic_sales import CriticSalesAgent
from .agent_06_advocate_persuasion import AdvocatePersuasionAgent
from .agent_07_judge_conversion import JudgeConversionAgent
from .agent_08_expert_emotions import ExpertEmotionsAgent
from .agent_09_expert_objections import ExpertObjectionsAgent
from .agent_10_expert_rapport import ExpertRapportAgent
from .debate_orchestrator import DebateOrchestrator, QuickDebate

# Growth OS - Content Generation
from .agent_11_script_writer import ScriptWriterAgent

# Growth OS - Prompt Factory (Agentes Modulares)
from .agent_12_prompt_factory import PromptFactoryAgent

__all__ = [
    # Base
    'BaseAgent',

    # Pipeline Principal
    'DataExtractorAgent',
    'SalesAnalyzerAgent',
    'PromptGeneratorAgent',
    'ValidatorAgent',

    # Sistema de Debate
    'CriticSalesAgent',
    'AdvocatePersuasionAgent',
    'JudgeConversionAgent',
    'ExpertEmotionsAgent',
    'ExpertObjectionsAgent',
    'ExpertRapportAgent',
    'DebateOrchestrator',
    'QuickDebate',

    # Growth OS
    'ScriptWriterAgent',
    'PromptFactoryAgent',
]
