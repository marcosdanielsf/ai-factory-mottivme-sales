"""
Flow Builder API - Flows Router
Endpoints para CRUD de flows, nodes e edges.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from ..models.flow import (
    Flow, FlowCreate, FlowUpdate, FlowSummary,
    FlowNode, FlowNodeCreate, FlowNodeUpdate,
    FlowEdge, FlowEdgeCreate
)
from ..services.flow_service import flow_service

router = APIRouter(prefix="/flows", tags=["Flows"])


# ============================================================================
# FLOWS
# ============================================================================

@router.get("", response_model=List[FlowSummary])
async def list_flows(client_id: Optional[UUID] = Query(None)):
    """Lista todos os flows (opcionalmente filtrado por client_id)"""
    return await flow_service.list_flows(client_id)


@router.post("", response_model=Flow, status_code=201)
async def create_flow(flow: FlowCreate):
    """Cria um novo flow"""
    return await flow_service.create_flow(flow)


@router.get("/{flow_id}", response_model=Flow)
async def get_flow(flow_id: UUID):
    """Busca um flow completo com nodes e edges"""
    flow = await flow_service.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow


@router.put("/{flow_id}", response_model=Flow)
async def update_flow(flow_id: UUID, flow: FlowUpdate):
    """Atualiza um flow"""
    updated = await flow_service.update_flow(flow_id, flow)
    if not updated:
        raise HTTPException(status_code=404, detail="Flow not found")
    return updated


@router.delete("/{flow_id}", status_code=204)
async def delete_flow(flow_id: UUID):
    """Deleta um flow (cascade para nodes e edges)"""
    deleted = await flow_service.delete_flow(flow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Flow not found")


# ============================================================================
# NODES
# ============================================================================

@router.get("/{flow_id}/nodes", response_model=List[FlowNode])
async def list_nodes(flow_id: UUID):
    """Lista todos os nodes de um flow"""
    return await flow_service.list_nodes(flow_id)


@router.post("/{flow_id}/nodes", response_model=FlowNode, status_code=201)
async def create_node(flow_id: UUID, node: FlowNodeCreate):
    """Cria um novo node no flow"""
    # Verifica se flow existe
    flow = await flow_service.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")

    return await flow_service.create_node(flow_id, node)


@router.put("/{flow_id}/nodes/{node_id}", response_model=FlowNode)
async def update_node(flow_id: UUID, node_id: UUID, node: FlowNodeUpdate):
    """Atualiza um node"""
    updated = await flow_service.update_node(flow_id, node_id, node)
    if not updated:
        raise HTTPException(status_code=404, detail="Node not found")
    return updated


@router.delete("/{flow_id}/nodes/{node_id}", status_code=204)
async def delete_node(flow_id: UUID, node_id: UUID):
    """Deleta um node"""
    deleted = await flow_service.delete_node(flow_id, node_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Node not found")


# ============================================================================
# EDGES
# ============================================================================

@router.get("/{flow_id}/edges", response_model=List[FlowEdge])
async def list_edges(flow_id: UUID):
    """Lista todas as edges de um flow"""
    return await flow_service.list_edges(flow_id)


@router.post("/{flow_id}/edges", response_model=FlowEdge, status_code=201)
async def create_edge(flow_id: UUID, edge: FlowEdgeCreate):
    """Cria uma nova edge no flow"""
    # Verifica se flow existe
    flow = await flow_service.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")

    return await flow_service.create_edge(flow_id, edge)


@router.delete("/{flow_id}/edges/{edge_id}", status_code=204)
async def delete_edge(flow_id: UUID, edge_id: UUID):
    """Deleta uma edge"""
    deleted = await flow_service.delete_edge(flow_id, edge_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Edge not found")
