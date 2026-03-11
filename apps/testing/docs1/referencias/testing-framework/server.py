"""
AI Factory Testing Framework - FastAPI Server
==============================================
API REST para integração com n8n e outros sistemas.
"""

import asyncio
import logging
import os
from typing import Dict, List, Optional
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

from src.supabase_client import SupabaseClient
from src.evaluator import Evaluator
from src.report_generator import ReportGenerator
from src.test_runner import TestRunner
from src.reflection_loop import ReflectionLoop
from src.skill_loader import SkillLoader

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================
# GLOBAL INSTANCES
# ============================================

supabase_client: Optional[SupabaseClient] = None
evaluator: Optional[Evaluator] = None
report_generator: Optional[ReportGenerator] = None
test_runner: Optional[TestRunner] = None
reflection_loop: Optional[ReflectionLoop] = None
skill_loader: Optional[SkillLoader] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialização e cleanup do app"""
    global supabase_client, evaluator, report_generator, test_runner, reflection_loop, skill_loader

    logger.info("Initializing AI Factory Testing Framework...")

    try:
        supabase_client = SupabaseClient()
        evaluator = Evaluator()
        report_generator = ReportGenerator(output_dir="./reports")
        test_runner = TestRunner(
            supabase_client=supabase_client,
            evaluator=evaluator,
            report_generator=report_generator
        )
        reflection_loop = ReflectionLoop(supabase_client=supabase_client)
        skill_loader = SkillLoader(skills_dir="./skills", supabase_client=supabase_client)

        logger.info("All components initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize components: {e}")
        raise

    yield

    logger.info("Shutting down AI Factory Testing Framework...")


# ============================================
# FASTAPI APP
# ============================================

app = FastAPI(
    title="AI Factory Testing Framework",
    description="API para testar e melhorar agentes IA automaticamente",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# PYDANTIC MODELS
# ============================================

class TestAgentRequest(BaseModel):
    agent_version_id: str = Field(..., description="UUID do agent_version")
    test_mode: str = Field(default="sdr", description="Modo de teste (sdr, support)")
    run_reflection: bool = Field(default=False, description="Executar reflection loop se score < 8")


class TestAgentResponse(BaseModel):
    status: str
    agent_id: str
    message: str
    task_id: Optional[str] = None


class AgentScore(BaseModel):
    id: str
    agent_name: str
    version: str
    last_test_score: Optional[float]
    status: str
    framework_approved: bool
    last_test_at: Optional[str]


class TestResult(BaseModel):
    id: str
    agent_version_id: str
    overall_score: float
    test_details: Dict
    report_url: Optional[str]
    created_at: str


class SkillRequest(BaseModel):
    instructions: str
    examples: Optional[str] = None
    rubric: Optional[str] = None
    test_cases: Optional[List[Dict]] = None


class QuickTestRequest(BaseModel):
    agent_version_id: str
    user_message: str
    expected_behavior: Optional[str] = None


# ============================================
# TASK QUEUE (simple in-memory)
# ============================================

running_tasks: Dict[str, Dict] = {}


async def run_test_task(task_id: str, agent_id: str, test_mode: str, run_reflection: bool):
    """Background task para executar teste"""
    global running_tasks

    try:
        running_tasks[task_id]['status'] = 'running'
        running_tasks[task_id]['started_at'] = datetime.utcnow().isoformat()

        # Executar teste
        result = await test_runner.run_tests(agent_id, test_mode=test_mode)

        running_tasks[task_id]['result'] = result
        running_tasks[task_id]['status'] = 'completed'

        # Executar reflection se necessário
        if run_reflection and result['overall_score'] < 8.0:
            running_tasks[task_id]['status'] = 'improving'
            improvement = await reflection_loop.improve_agent(agent_id, result)
            running_tasks[task_id]['improvement'] = improvement

        running_tasks[task_id]['completed_at'] = datetime.utcnow().isoformat()

    except Exception as e:
        running_tasks[task_id]['status'] = 'failed'
        running_tasks[task_id]['error'] = str(e)
        logger.error(f"Task {task_id} failed: {e}", exc_info=True)


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "AI Factory Testing Framework",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check detalhado"""
    return {
        "status": "healthy",
        "components": {
            "supabase": supabase_client is not None,
            "evaluator": evaluator is not None,
            "test_runner": test_runner is not None,
            "reflection_loop": reflection_loop is not None,
            "skill_loader": skill_loader is not None
        },
        "running_tasks": len([t for t in running_tasks.values() if t['status'] == 'running'])
    }


# ---------- TESTING ----------

@app.post("/api/test-agent", response_model=TestAgentResponse)
async def test_agent(request: TestAgentRequest, background_tasks: BackgroundTasks):
    """
    Inicia teste de um agente (async).
    Retorna task_id para acompanhar progresso.
    """
    task_id = f"test-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{request.agent_version_id[:8]}"

    running_tasks[task_id] = {
        'status': 'queued',
        'agent_id': request.agent_version_id,
        'created_at': datetime.utcnow().isoformat()
    }

    background_tasks.add_task(
        run_test_task,
        task_id,
        request.agent_version_id,
        request.test_mode,
        request.run_reflection
    )

    return TestAgentResponse(
        status="queued",
        agent_id=request.agent_version_id,
        message="Test queued successfully",
        task_id=task_id
    )


@app.post("/api/test-agent/sync")
async def test_agent_sync(request: TestAgentRequest):
    """
    Executa teste de forma síncrona (aguarda resultado).
    Use apenas para testes rápidos.
    """
    try:
        result = await test_runner.run_tests(
            request.agent_version_id,
            test_mode=request.test_mode
        )

        return {
            "status": "completed",
            "agent_id": request.agent_version_id,
            "overall_score": result['overall_score'],
            "report_url": result['report_url'],
            "duration_ms": result['duration_ms'],
            "scores": result['test_details']['scores']
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str):
    """Retorna status de uma task"""
    if task_id not in running_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    return running_tasks[task_id]


@app.post("/api/quick-test")
async def quick_test(request: QuickTestRequest):
    """
    Teste rápido de uma única mensagem.
    Útil para debugging.
    """
    try:
        agent = supabase_client.get_agent_version(request.agent_version_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        result = await evaluator.evaluate_single_response(
            agent=agent,
            input_message=request.user_message,
            agent_response="",  # Será simulado
            expected_behavior=request.expected_behavior
        )

        return {
            "agent_id": request.agent_version_id,
            "input": request.user_message,
            "score": result['overall_score'],
            "evaluation": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- AGENTS ----------

@app.get("/api/agents")
async def list_agents(
    limit: int = Query(default=50, le=100),
    status: Optional[str] = Query(default=None)
):
    """Lista todos os agentes com scores"""
    try:
        # Buscar agentes que precisam de teste
        if status == "needs_testing":
            agents = supabase_client.get_agents_needing_testing(limit=limit)
        else:
            # Buscar todos
            response = supabase_client.client.table('agent_versions')\
                .select('id, agent_name, version, last_test_score, status, framework_approved, last_test_at')\
                .order('last_test_at', desc=True)\
                .limit(limit)\
                .execute()
            agents = response.data

        return {
            "count": len(agents),
            "agents": agents
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agent/{agent_id}")
async def get_agent(agent_id: str):
    """Retorna detalhes de um agente"""
    agent = supabase_client.get_agent_version(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Buscar último teste
    tests = supabase_client.get_test_results_history(agent_id, limit=1)
    latest_test = tests[0] if tests else None

    return {
        "agent": agent,
        "latest_test": latest_test
    }


@app.get("/api/agent/{agent_id}/tests")
async def get_agent_tests(
    agent_id: str,
    limit: int = Query(default=20, le=100)
):
    """Retorna histórico de testes de um agente"""
    tests = supabase_client.get_test_results_history(agent_id, limit=limit)

    return {
        "agent_id": agent_id,
        "count": len(tests),
        "tests": tests
    }


# ---------- SKILLS ----------

@app.get("/api/agent/{agent_id}/skill")
async def get_agent_skill(agent_id: str):
    """Retorna skill atual do agente"""
    skill = supabase_client.get_skill(agent_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    return skill


@app.post("/api/agent/{agent_id}/skill")
async def save_agent_skill(agent_id: str, request: SkillRequest):
    """Salva ou atualiza skill do agente"""
    try:
        skill_id = supabase_client.save_skill(
            agent_version_id=agent_id,
            instructions=request.instructions,
            examples=request.examples,
            rubric=request.rubric,
            test_cases=request.test_cases
        )

        return {
            "status": "success",
            "skill_id": skill_id,
            "agent_id": agent_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/skills")
async def list_skills():
    """Lista todos os skills locais disponíveis"""
    skills = skill_loader.list_skills()
    return {
        "count": len(skills),
        "skills": skills
    }


@app.post("/api/skills/sync/{agent_name}")
async def sync_skill(agent_name: str, agent_version_id: str = Query(...)):
    """Sincroniza skill local para Supabase"""
    try:
        skill = skill_loader.load_skill(agent_name)
        if not skill:
            raise HTTPException(status_code=404, detail=f"Skill '{agent_name}' not found")

        skill_id = skill_loader.sync_to_supabase(
            agent_version_id=agent_version_id,
            skill=skill
        )

        return {
            "status": "synced",
            "skill_id": skill_id,
            "skill_name": agent_name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- TEST RESULTS ----------

@app.get("/api/test-results/{test_id}")
async def get_test_result(test_id: str):
    """Retorna resultado completo de um teste"""
    try:
        response = supabase_client.client.table('agenttest_test_results')\
            .select('*')\
            .eq('id', test_id)\
            .single()\
            .execute()

        return response.data

    except Exception as e:
        raise HTTPException(status_code=404, detail="Test result not found")


@app.get("/api/reports/{filename}")
async def get_report(filename: str):
    """Retorna arquivo de relatório HTML"""
    filepath = f"./reports/{filename}"
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(filepath, media_type="text/html")


# ---------- REFLECTION LOOP ----------

@app.post("/api/agent/{agent_id}/improve")
async def improve_agent(agent_id: str, background_tasks: BackgroundTasks):
    """
    Inicia processo de melhoria automática do agente.
    """
    # Buscar último teste
    tests = supabase_client.get_test_results_history(agent_id, limit=1)
    if not tests:
        raise HTTPException(status_code=400, detail="No test results found. Run a test first.")

    last_test = tests[0]

    if last_test['overall_score'] >= 8.0:
        return {
            "status": "skipped",
            "message": "Agent already meets quality threshold",
            "current_score": last_test['overall_score']
        }

    task_id = f"improve-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{agent_id[:8]}"

    running_tasks[task_id] = {
        'status': 'queued',
        'agent_id': agent_id,
        'type': 'improvement',
        'created_at': datetime.utcnow().isoformat()
    }

    async def run_improvement():
        try:
            running_tasks[task_id]['status'] = 'running'
            result = await reflection_loop.improve_agent(agent_id, {
                'overall_score': last_test['overall_score'],
                'test_details': last_test['test_details']
            })
            running_tasks[task_id]['result'] = result
            running_tasks[task_id]['status'] = 'completed'
        except Exception as e:
            running_tasks[task_id]['status'] = 'failed'
            running_tasks[task_id]['error'] = str(e)

    background_tasks.add_task(run_improvement)

    return {
        "status": "queued",
        "task_id": task_id,
        "current_score": last_test['overall_score'],
        "message": "Improvement process started"
    }


# ---------- BATCH OPERATIONS ----------

@app.post("/api/batch/test")
async def batch_test(
    background_tasks: BackgroundTasks,
    limit: int = Query(default=10, le=50),
    test_mode: str = Query(default="sdr")
):
    """
    Testa todos os agentes que precisam de teste.
    """
    agents = supabase_client.get_agents_needing_testing(limit=limit)

    task_ids = []
    for agent in agents:
        task_id = f"test-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{agent['id'][:8]}"
        running_tasks[task_id] = {
            'status': 'queued',
            'agent_id': agent['id'],
            'created_at': datetime.utcnow().isoformat()
        }
        background_tasks.add_task(run_test_task, task_id, agent['id'], test_mode, False)
        task_ids.append(task_id)

    return {
        "status": "queued",
        "agents_queued": len(task_ids),
        "task_ids": task_ids
    }


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"

    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=reload
    )
