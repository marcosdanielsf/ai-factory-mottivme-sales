"""
E2E Testing System - Growth OS
==============================
Sistema de testes End-to-End para validar fluxos completos de conversação.

Componentes:
- LeadSimulator: Claude fazendo papel de cliente (com personas)
- FlowOrchestrator: Controla fluxo e handoffs entre agentes
- TestRunner: Executa cenários de teste E2E (prompts genéricos)
- RealE2ETestRunner: Executa testes com agentes REAIS do Supabase
- AgentLoader: Carrega agentes reais do Supabase
- MetricsCollector: Coleta e salva métricas no Supabase
"""

from .lead_simulator import LeadSimulator, LeadPersona
from .flow_orchestrator import FlowOrchestrator, AgentMode, HandoffResult
from .test_runner import E2ETestRunner, TestScenario, TestResult, TestStatus
from .agent_loader import AgentLoader, RealAgent, AgentMode as LoaderAgentMode, FLOW_DEFINITIONS
from .real_test_runner import RealE2ETestRunner, RealTestScenario, RealTestResult
from .groq_test_runner import GroqE2ETestRunner, GroqTestScenario, GroqTestResult
from .metrics_collector import MetricsCollector
from .scenarios_inbound import (
    INBOUND_SCENARIOS,
    INBOUND_HOT_SCENARIO,
    INBOUND_OBJECTION_SCENARIO,
    InboundStage,
    InboundStageValidation,
    InboundLeadPersona,
    INBOUND_PERSONAS,
    get_inbound_scenario,
    get_scenarios_by_tag,
    validate_conversation_flow
)
from .scenarios_edge_cases import (
    EdgeCaseScenario,
    EdgeCaseTestResult,
    EdgeCaseTestRunner,
    EdgeCaseLeadSimulator,
    EdgeCaseLeadProfile,
    EdgeCaseOutcome,
    EDGE_CASE_SCENARIOS,
    EDGE_CASE_PROFILES,
    run_edge_case_tests
)
from .scenarios_isabella_v63 import (
    IsabellaTestSuite,
    IsabellaMode,
    get_isabella_suite,
    get_isabella_scenarios,
    ISABELLA_ALL_SCENARIOS,
    ISABELLA_QUICK_SCENARIOS,
    ISABELLA_PRIORITY_SCENARIOS,
    ISABELLA_LEAD_PERSONAS
)

__all__ = [
    # Lead Simulator
    'LeadSimulator',
    'LeadPersona',

    # Flow Orchestrator
    'FlowOrchestrator',
    'AgentMode',
    'HandoffResult',

    # Test Runner (genérico)
    'E2ETestRunner',
    'TestScenario',
    'TestResult',
    'TestStatus',

    # Agent Loader (Supabase)
    'AgentLoader',
    'RealAgent',
    'FLOW_DEFINITIONS',

    # Real Test Runner (agentes reais)
    'RealE2ETestRunner',
    'RealTestScenario',
    'RealTestResult',

    # Metrics
    'MetricsCollector',

    # Inbound Scenarios
    'INBOUND_SCENARIOS',
    'INBOUND_HOT_SCENARIO',
    'INBOUND_OBJECTION_SCENARIO',
    'InboundStage',
    'InboundStageValidation',
    'InboundLeadPersona',
    'INBOUND_PERSONAS',
    'get_inbound_scenario',
    'get_scenarios_by_tag',
    'validate_conversation_flow',

    # Edge Case Scenarios
    'EdgeCaseScenario',
    'EdgeCaseTestResult',
    'EdgeCaseTestRunner',
    'EdgeCaseLeadSimulator',
    'EdgeCaseLeadProfile',
    'EdgeCaseOutcome',
    'EDGE_CASE_SCENARIOS',
    'EDGE_CASE_PROFILES',
    'run_edge_case_tests',

    # Isabella v6.3 Scenarios
    'IsabellaTestSuite',
    'IsabellaMode',
    'get_isabella_suite',
    'get_isabella_scenarios',
    'ISABELLA_ALL_SCENARIOS',
    'ISABELLA_QUICK_SCENARIOS',
    'ISABELLA_PRIORITY_SCENARIOS',
    'ISABELLA_LEAD_PERSONAS'
]
