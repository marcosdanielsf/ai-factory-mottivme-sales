"""
Flow Builder API - Simulation Router
Endpoints para simulação de conversas.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID

from ..models.flow import (
    Simulation, SimulationCreate, SimulationStep, ReasoningLog
)
from ..services.simulation_service import simulation_service

router = APIRouter(prefix="/simulate", tags=["Simulation"])


@router.post("", response_model=Simulation, status_code=201)
async def create_simulation(sim: SimulationCreate):
    """Inicia uma nova simulação de conversa"""
    try:
        return await simulation_service.create_simulation(sim)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/step", response_model=Simulation)
async def step_simulation(step: SimulationStep):
    """Avança a simulação com uma mensagem do lead"""
    try:
        return await simulation_service.step_simulation(step)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{simulation_id}", response_model=Simulation)
async def get_simulation(simulation_id: UUID):
    """Busca uma simulação"""
    simulation = await simulation_service.get_simulation(simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation


@router.get("/{simulation_id}/reasoning", response_model=List[ReasoningLog])
async def get_reasoning(simulation_id: UUID):
    """Busca logs de reasoning de uma simulação"""
    # Verifica se simulação existe
    simulation = await simulation_service.get_simulation(simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return await simulation_service.get_reasoning(simulation_id)
