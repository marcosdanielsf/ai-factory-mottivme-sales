#!/usr/bin/env python3
"""
Dashboard Sync Agent
Expõe API REST para o Dashboard consumir em tempo real
"""

import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app)

@app.route('/api/agents/test-version', methods=['POST'])
def trigger_test():
    """
    Endpoint para Dashboard triggerar testes manualmente

    Body:
    {
      "version_id": "uuid-da-versao"
    }
    """
    data = request.json
    version_id = data.get("version_id")

    if not version_id:
        return jsonify({"error": "version_id is required"}), 400

    # Atualizar status para 'pending_approval' para triggerar AI Judge
    supabase.table("agent_versions").update({
        "status": "pending_approval"
    }).eq("id", version_id).execute()

    return jsonify({
        "success": True,
        "message": "Test queued. AI Judge will process it shortly.",
        "version_id": version_id
    })

@app.route('/api/agents/<agent_id>/scores', methods=['GET'])
def get_agent_scores(agent_id: str):
    """
    Retorna scores de todas as versões de um agente
    """

    versions = supabase.table("agent_versions").select("id, version_number, avg_score_overall, avg_score_dimensions, total_test_runs").eq("agent_id", agent_id).execute()

    return jsonify({
        "agent_id": agent_id,
        "versions": versions.data
    })

@app.route('/api/agents/<version_id>/status', methods=['PATCH'])
def update_status(version_id: str):
    """
    Atualiza status de uma versão (usado pelo Dashboard para aprovar)

    Body:
    {
      "status": "production"
    }
    """
    data = request.json
    new_status = data.get("status")

    allowed_statuses = ["production", "sandbox", "archived", "draft", "pending_approval"]
    if new_status not in allowed_statuses:
        return jsonify({"error": "Invalid status"}), 400

    # Atualizar no Supabase
    supabase.table("agent_versions").update({
        "status": new_status,
        "deployed_at": datetime.utcnow().isoformat() if new_status == "production" else None
    }).eq("id", version_id).execute()

    return jsonify({
        "success": True,
        "version_id": version_id,
        "new_status": new_status
    })

@app.route('/api/dashboard/metrics', methods=['GET'])
def get_dashboard_metrics():
    """
    Retorna métricas agregadas para o Dashboard (espelha vw_dashboard_metrics)
    """

    # Usar a view otimizada do Supabase
    metrics = supabase.table("vw_dashboard_metrics").select("*").single().execute()

    return jsonify(metrics.data)

@app.route('/api/conversations/log', methods=['POST'])
def log_conversation():
    """
    Endpoint para logar conversas em tempo real

    Body:
    {
      "lead_id": "uuid",
      "agent_id": "uuid",
      "role": "user|assistant",
      "content": "mensagem",
      "channel": "whatsapp|webchat",
      "tokens_used": 123,
      "cost_usd": 0.0045
    }
    """
    data = request.json

    # Validar campos obrigatórios
    required_fields = ["lead_id", "agent_id", "role", "content"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Inserir no Supabase
    conversation = {
        "lead_id": data["lead_id"],
        "agent_id": data["agent_id"],
        "role": data["role"],
        "content": data["content"],
        "channel": data.get("channel", "webchat"),
        "tokens_used": data.get("tokens_used"),
        "cost_usd": data.get("cost_usd"),
        "sentiment_score": data.get("sentiment_score"),
        "created_at": datetime.utcnow().isoformat()
    }

    result = supabase.table("ai_factory_conversations").insert(conversation).execute()

    return jsonify({
        "success": True,
        "conversation_id": result.data[0]["id"]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Dashboard Sync Agent",
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Dashboard Sync Agent running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
