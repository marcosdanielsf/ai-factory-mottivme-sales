"""
Flow Builder API - Flow Service
CRUD operations para flows, nodes e edges.
"""
from typing import List, Optional
from uuid import UUID
import logging
from datetime import datetime

from ..core.database import get_supabase
from ..models.flow import (
    Flow, FlowCreate, FlowUpdate, FlowSummary,
    FlowNode, FlowNodeCreate, FlowNodeUpdate,
    FlowEdge, FlowEdgeCreate,
    Position
)

logger = logging.getLogger(__name__)


class FlowService:
    """Service para operações de Flow"""

    def __init__(self):
        self.supabase = get_supabase()

    # ========================================================================
    # FLOWS
    # ========================================================================

    async def list_flows(self, client_id: Optional[UUID] = None) -> List[FlowSummary]:
        """Lista todos os flows"""
        query = self.supabase.table("flows").select("*")

        if client_id:
            query = query.eq("client_id", str(client_id))

        result = query.order("updated_at", desc=True).execute()

        flows = []
        for row in result.data:
            # Conta nodes e edges
            nodes_count = self.supabase.table("flow_nodes")\
                .select("id", count="exact")\
                .eq("flow_id", row["id"])\
                .execute()

            edges_count = self.supabase.table("flow_edges")\
                .select("id", count="exact")\
                .eq("flow_id", row["id"])\
                .execute()

            flows.append(FlowSummary(
                id=UUID(row["id"]),
                name=row["name"],
                description=row.get("description"),
                node_count=nodes_count.count or 0,
                edge_count=edges_count.count or 0,
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"])
            ))

        return flows

    async def get_flow(self, flow_id: UUID) -> Optional[Flow]:
        """Busca um flow completo com nodes e edges"""
        # Flow
        result = self.supabase.table("flows")\
            .select("*")\
            .eq("id", str(flow_id))\
            .single()\
            .execute()

        if not result.data:
            return None

        flow_data = result.data

        # Nodes
        nodes_result = self.supabase.table("flow_nodes")\
            .select("*")\
            .eq("flow_id", str(flow_id))\
            .execute()

        nodes = [
            FlowNode(
                id=UUID(n["id"]),
                flow_id=UUID(n["flow_id"]),
                type=n["type"],
                position=Position(x=n["position_x"], y=n["position_y"]),
                data=n["data"],
                width=n.get("width"),
                height=n.get("height"),
                created_at=datetime.fromisoformat(n["created_at"])
            )
            for n in nodes_result.data
        ]

        # Edges
        edges_result = self.supabase.table("flow_edges")\
            .select("*")\
            .eq("flow_id", str(flow_id))\
            .execute()

        edges = [
            FlowEdge(
                id=UUID(e["id"]),
                flow_id=UUID(e["flow_id"]),
                source=e["source_node_id"],
                target=e["target_node_id"],
                source_handle=e.get("source_handle"),
                target_handle=e.get("target_handle"),
                type=e.get("type", "default"),
                label=e.get("label"),
                condition=e.get("condition"),
                animated=e.get("animated", False),
                created_at=datetime.fromisoformat(e["created_at"])
            )
            for e in edges_result.data
        ]

        return Flow(
            id=UUID(flow_data["id"]),
            name=flow_data["name"],
            description=flow_data.get("description"),
            client_id=UUID(flow_data["client_id"]) if flow_data.get("client_id") else None,
            canvas_data=flow_data.get("canvas_data"),
            nodes=nodes,
            edges=edges,
            created_at=datetime.fromisoformat(flow_data["created_at"]),
            updated_at=datetime.fromisoformat(flow_data["updated_at"])
        )

    async def create_flow(self, flow: FlowCreate) -> Flow:
        """Cria um novo flow"""
        data = {
            "name": flow.name,
            "description": flow.description,
            "client_id": str(flow.client_id) if flow.client_id else None,
            "canvas_data": flow.canvas_data.model_dump() if flow.canvas_data else None
        }

        result = self.supabase.table("flows")\
            .insert(data)\
            .execute()

        created = result.data[0]
        return Flow(
            id=UUID(created["id"]),
            name=created["name"],
            description=created.get("description"),
            client_id=UUID(created["client_id"]) if created.get("client_id") else None,
            canvas_data=created.get("canvas_data"),
            nodes=[],
            edges=[],
            created_at=datetime.fromisoformat(created["created_at"]),
            updated_at=datetime.fromisoformat(created["updated_at"])
        )

    async def update_flow(self, flow_id: UUID, flow: FlowUpdate) -> Optional[Flow]:
        """Atualiza um flow"""
        data = {}
        if flow.name is not None:
            data["name"] = flow.name
        if flow.description is not None:
            data["description"] = flow.description
        if flow.canvas_data is not None:
            data["canvas_data"] = flow.canvas_data.model_dump()

        if not data:
            return await self.get_flow(flow_id)

        result = self.supabase.table("flows")\
            .update(data)\
            .eq("id", str(flow_id))\
            .execute()

        if not result.data:
            return None

        return await self.get_flow(flow_id)

    async def delete_flow(self, flow_id: UUID) -> bool:
        """Deleta um flow (cascade para nodes e edges)"""
        result = self.supabase.table("flows")\
            .delete()\
            .eq("id", str(flow_id))\
            .execute()

        return len(result.data) > 0

    # ========================================================================
    # NODES
    # ========================================================================

    async def list_nodes(self, flow_id: UUID) -> List[FlowNode]:
        """Lista nodes de um flow"""
        result = self.supabase.table("flow_nodes")\
            .select("*")\
            .eq("flow_id", str(flow_id))\
            .execute()

        return [
            FlowNode(
                id=UUID(n["id"]),
                flow_id=UUID(n["flow_id"]),
                type=n["type"],
                position=Position(x=n["position_x"], y=n["position_y"]),
                data=n["data"],
                width=n.get("width"),
                height=n.get("height"),
                created_at=datetime.fromisoformat(n["created_at"])
            )
            for n in result.data
        ]

    async def create_node(self, flow_id: UUID, node: FlowNodeCreate) -> FlowNode:
        """Cria um novo node"""
        data = {
            "flow_id": str(flow_id),
            "type": node.type,
            "position_x": node.position.x,
            "position_y": node.position.y,
            "data": node.data,
            "width": node.width,
            "height": node.height
        }

        result = self.supabase.table("flow_nodes")\
            .insert(data)\
            .execute()

        created = result.data[0]
        return FlowNode(
            id=UUID(created["id"]),
            flow_id=UUID(created["flow_id"]),
            type=created["type"],
            position=Position(x=created["position_x"], y=created["position_y"]),
            data=created["data"],
            width=created.get("width"),
            height=created.get("height"),
            created_at=datetime.fromisoformat(created["created_at"])
        )

    async def update_node(self, flow_id: UUID, node_id: UUID, node: FlowNodeUpdate) -> Optional[FlowNode]:
        """Atualiza um node"""
        data = {}
        if node.type is not None:
            data["type"] = node.type
        if node.position is not None:
            data["position_x"] = node.position.x
            data["position_y"] = node.position.y
        if node.data is not None:
            data["data"] = node.data
        if node.width is not None:
            data["width"] = node.width
        if node.height is not None:
            data["height"] = node.height

        if not data:
            return None

        result = self.supabase.table("flow_nodes")\
            .update(data)\
            .eq("id", str(node_id))\
            .eq("flow_id", str(flow_id))\
            .execute()

        if not result.data:
            return None

        updated = result.data[0]
        return FlowNode(
            id=UUID(updated["id"]),
            flow_id=UUID(updated["flow_id"]),
            type=updated["type"],
            position=Position(x=updated["position_x"], y=updated["position_y"]),
            data=updated["data"],
            width=updated.get("width"),
            height=updated.get("height"),
            created_at=datetime.fromisoformat(updated["created_at"])
        )

    async def delete_node(self, flow_id: UUID, node_id: UUID) -> bool:
        """Deleta um node"""
        result = self.supabase.table("flow_nodes")\
            .delete()\
            .eq("id", str(node_id))\
            .eq("flow_id", str(flow_id))\
            .execute()

        return len(result.data) > 0

    # ========================================================================
    # EDGES
    # ========================================================================

    async def list_edges(self, flow_id: UUID) -> List[FlowEdge]:
        """Lista edges de um flow"""
        result = self.supabase.table("flow_edges")\
            .select("*")\
            .eq("flow_id", str(flow_id))\
            .execute()

        return [
            FlowEdge(
                id=UUID(e["id"]),
                flow_id=UUID(e["flow_id"]),
                source=e["source_node_id"],
                target=e["target_node_id"],
                source_handle=e.get("source_handle"),
                target_handle=e.get("target_handle"),
                type=e.get("type", "default"),
                label=e.get("label"),
                condition=e.get("condition"),
                animated=e.get("animated", False),
                created_at=datetime.fromisoformat(e["created_at"])
            )
            for e in result.data
        ]

    async def create_edge(self, flow_id: UUID, edge: FlowEdgeCreate) -> FlowEdge:
        """Cria uma nova edge"""
        data = {
            "flow_id": str(flow_id),
            "source_node_id": edge.source,
            "target_node_id": edge.target,
            "source_handle": edge.source_handle,
            "target_handle": edge.target_handle,
            "type": edge.type,
            "label": edge.label,
            "condition": edge.condition,
            "animated": edge.animated
        }

        result = self.supabase.table("flow_edges")\
            .insert(data)\
            .execute()

        created = result.data[0]
        return FlowEdge(
            id=UUID(created["id"]),
            flow_id=UUID(created["flow_id"]),
            source=created["source_node_id"],
            target=created["target_node_id"],
            source_handle=created.get("source_handle"),
            target_handle=created.get("target_handle"),
            type=created.get("type", "default"),
            label=created.get("label"),
            condition=created.get("condition"),
            animated=created.get("animated", False),
            created_at=datetime.fromisoformat(created["created_at"])
        )

    async def delete_edge(self, flow_id: UUID, edge_id: UUID) -> bool:
        """Deleta uma edge"""
        result = self.supabase.table("flow_edges")\
            .delete()\
            .eq("id", str(edge_id))\
            .eq("flow_id", str(flow_id))\
            .execute()

        return len(result.data) > 0


# Singleton
flow_service = FlowService()
