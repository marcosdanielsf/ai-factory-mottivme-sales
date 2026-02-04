"""
Flow Builder - Models
Database models e Pydantic schemas para flows, nodes e edges.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


# ============================================================================
# ENUMS & TYPES
# ============================================================================

NodeType = Literal["mode", "etapa", "mensagem", "script", "decisao", "simulacao"]
EdgeType = Literal["default", "conditional", "fallback"]
SimulationStatus = Literal["idle", "running", "paused", "completed"]
MessageRole = Literal["agent", "lead", "system"]


# ============================================================================
# NODE DATA SCHEMAS
# ============================================================================

class ModeNodeData(BaseModel):
    """Dados específicos do node Mode"""
    mode_name: str
    status: Literal["active", "inactive"] = "active"
    etapas: List[str] = []
    prime_directive: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None


class EtapaNodeData(BaseModel):
    """Dados específicos do node Etapa"""
    objetivo: str
    tecnicas: List[str] = []


class MensagemNodeData(BaseModel):
    """Dados específicos do node Mensagem"""
    message_type: MessageRole
    content: str
    criterios_ia: Optional[Dict[str, List[str]]] = None


class ScriptNodeData(BaseModel):
    """Dados específicos do node Script"""
    script_type: Literal["audio", "video", "vsl", "story"]
    duration: Optional[str] = None
    content: str
    audio_url: Optional[str] = None


class DecisaoNodeData(BaseModel):
    """Dados específicos do node Decisão"""
    condition: str
    criterio: str
    outputs: Dict[str, str]  # {"sim": "node_id", "nao": "node_id"}


class SimulacaoNodeData(BaseModel):
    """Dados específicos do node Simulação"""
    lead_name: str
    persona: str
    messages: List[Dict[str, Any]] = []
    status: SimulationStatus = "idle"


# ============================================================================
# FLOW NODE SCHEMAS
# ============================================================================

class Position(BaseModel):
    """Posição x,y do node no canvas"""
    x: float
    y: float


class FlowNodeBase(BaseModel):
    """Base schema para nodes"""
    type: NodeType
    position: Position
    data: Dict[str, Any]
    width: Optional[float] = None
    height: Optional[float] = None


class FlowNodeCreate(FlowNodeBase):
    """Schema para criar node"""
    pass


class FlowNodeUpdate(BaseModel):
    """Schema para atualizar node"""
    type: Optional[NodeType] = None
    position: Optional[Position] = None
    data: Optional[Dict[str, Any]] = None
    width: Optional[float] = None
    height: Optional[float] = None


class FlowNode(FlowNodeBase):
    """Schema completo do node"""
    id: UUID = Field(default_factory=uuid4)
    flow_id: UUID
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# ============================================================================
# FLOW EDGE SCHEMAS
# ============================================================================

class FlowEdgeBase(BaseModel):
    """Base schema para edges"""
    source: str  # node_id de origem
    target: str  # node_id de destino
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None
    type: EdgeType = "default"
    label: Optional[str] = None
    condition: Optional[Dict[str, Any]] = None
    animated: bool = False


class FlowEdgeCreate(FlowEdgeBase):
    """Schema para criar edge"""
    pass


class FlowEdge(FlowEdgeBase):
    """Schema completo do edge"""
    id: UUID = Field(default_factory=uuid4)
    flow_id: UUID
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# ============================================================================
# FLOW SCHEMAS
# ============================================================================

class CanvasData(BaseModel):
    """Dados do canvas (zoom, posição)"""
    zoom: float = 1.0
    position: Position = Position(x=0, y=0)


class FlowBase(BaseModel):
    """Base schema para flows"""
    name: str
    description: Optional[str] = None
    client_id: Optional[UUID] = None
    canvas_data: Optional[CanvasData] = None


class FlowCreate(FlowBase):
    """Schema para criar flow"""
    pass


class FlowUpdate(BaseModel):
    """Schema para atualizar flow"""
    name: Optional[str] = None
    description: Optional[str] = None
    canvas_data: Optional[CanvasData] = None


class Flow(FlowBase):
    """Schema completo do flow"""
    id: UUID = Field(default_factory=uuid4)
    nodes: List[FlowNode] = []
    edges: List[FlowEdge] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class FlowSummary(BaseModel):
    """Schema resumido do flow (para listagem)"""
    id: UUID
    name: str
    description: Optional[str] = None
    node_count: int = 0
    edge_count: int = 0
    created_at: datetime
    updated_at: datetime


# ============================================================================
# SIMULATION SCHEMAS
# ============================================================================

class Persona(BaseModel):
    """Persona do lead para simulação"""
    name: str
    description: str
    characteristics: List[str] = []
    pain_points: List[str] = []
    objections: List[str] = []


class Reasoning(BaseModel):
    """Raciocínio da IA para uma mensagem"""
    applied_techniques: List[str] = []
    detected_intents: List[str] = []
    decision_factors: List[str] = []
    next_action: Optional[str] = None


class SimulationMessage(BaseModel):
    """Mensagem na simulação"""
    id: UUID = Field(default_factory=uuid4)
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reasoning: Optional[Reasoning] = None


class SimulationCreate(BaseModel):
    """Schema para iniciar simulação"""
    flow_id: UUID
    persona: Persona
    start_node_id: Optional[UUID] = None


class SimulationStep(BaseModel):
    """Schema para avançar simulação"""
    simulation_id: UUID
    lead_message: str


class Simulation(BaseModel):
    """Schema completo da simulação"""
    id: UUID = Field(default_factory=uuid4)
    flow_id: UUID
    persona: Persona
    messages: List[SimulationMessage] = []
    current_node_id: Optional[UUID] = None
    status: SimulationStatus = "running"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


# ============================================================================
# REASONING LOG SCHEMAS
# ============================================================================

class ReasoningLog(BaseModel):
    """Log de raciocínio da IA"""
    id: UUID = Field(default_factory=uuid4)
    simulation_id: UUID
    node_id: Optional[UUID] = None
    message_index: int
    criteria: Reasoning
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
