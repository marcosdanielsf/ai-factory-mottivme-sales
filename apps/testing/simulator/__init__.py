"""
AI Sales Simulator
==================
Sistema de simulação de conversas com debate multi-LLM.

Arquitetura:
1. LeadSimulator (Gemini) - Simula comportamento do lead
2. SDRSimulator (Claude) - Usa o prompt real da Isabella
3. Painel de Especialistas:
   - PNLExpert (Gemini) - Analisa linguagem e rapport
   - SalesExpert (Claude) - Analisa técnicas de vendas
   - NeuroSalesExpert (Gemini) - Analisa gatilhos mentais
   - BehaviorExpert (Claude) - Analisa comportamento humano
4. DebateOrchestrator - Orquestra debate entre especialistas
5. PromptImprover - Sintetiza feedback e melhora prompt
"""

from .lead_simulator import LeadSimulator, LeadPersona
from .sdr_simulator import SDRSimulator
from .experts import PNLExpert, SalesExpert, NeuroSalesExpert, BehaviorExpert
from .debate import DebateOrchestrator
from .orchestrator import SimulationOrchestrator

__all__ = [
    'LeadSimulator',
    'LeadPersona',
    'SDRSimulator',
    'PNLExpert',
    'SalesExpert',
    'NeuroSalesExpert',
    'BehaviorExpert',
    'DebateOrchestrator',
    'SimulationOrchestrator'
]
