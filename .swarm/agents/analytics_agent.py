#!/usr/bin/env python3
"""
Analytics & Conversion Tracking Agent
Calcula métricas de conversão e performance
"""

import os
from datetime import datetime
from typing import Dict
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class AnalyticsEngine:
    """Calcula e atualiza métricas de conversão"""

    def calculate_conversion_rate(self, agent_id: str) -> Dict:
        """
        Calcula taxa de conversão de um agente baseado em ai_factory_leads
        Formula: (qualified_leads / total_leads) * 100
        """

        # Buscar leads associados ao agente
        leads_data = supabase.table("ai_factory_leads").select("id, status").eq("agent_id", agent_id).execute()

        total_leads = len(leads_data.data)
        if total_leads == 0:
            return {"conversion_rate": 0.0, "total_leads": 0, "qualified_leads": 0}

        # Contar leads qualificados
        qualified_statuses = ["qualified", "call_booked", "proposal", "won"]
        qualified_leads = sum(1 for lead in leads_data.data if lead["status"] in qualified_statuses)

        conversion_rate = round((qualified_leads / total_leads) * 100, 2)

        return {
            "conversion_rate": conversion_rate,
            "total_leads": total_leads,
            "qualified_leads": qualified_leads
        }

    def calculate_avg_interactions(self, agent_id: str) -> float:
        """
        Calcula média de interações até atingir o objetivo
        """

        # Buscar conversas que resultaram em conversão
        conversations = supabase.table("ai_factory_conversations").select("lead_id").eq("agent_id", agent_id).execute()

        # Agrupar por lead_id e contar mensagens
        lead_interactions = {}
        for conv in conversations.data:
            lead_id = conv["lead_id"]
            lead_interactions[lead_id] = lead_interactions.get(lead_id, 0) + 1

        if not lead_interactions:
            return 0.0

        avg = sum(lead_interactions.values()) / len(lead_interactions)
        return round(avg, 1)

    def update_version_metrics(self, version_id: str):
        """Atualiza métricas de conversão na agent_versions"""

        # Buscar agent_id da versão
        version_data = supabase.table("agent_versions").select("agent_id").eq("id", version_id).single().execute()
        agent_id = version_data.data["agent_id"]

        # Calcular métricas
        conversion_data = self.calculate_conversion_rate(agent_id)
        avg_interactions = self.calculate_avg_interactions(agent_id)

        # Atualizar no Supabase
        supabase.table("agent_versions").update({
            "conversion_rate": conversion_data["conversion_rate"],
            "avg_interactions_to_goal": avg_interactions
        }).eq("id", version_id).execute()

        print(f"📈 Analytics updated: conversion={conversion_data['conversion_rate']}%, avg_interactions={avg_interactions}")

        return conversion_data

def main():
    """Executa cálculo de métricas para todas as versões ativas"""
    engine = AnalyticsEngine()

    # Buscar todas as versões production ou sandbox
    versions = supabase.table("agent_versions").select("id, version_number, agent_id").in_("status", ["production", "sandbox"]).execute()

    print(f"📊 Updating analytics for {len(versions.data)} versions...")

    for version in versions.data:
        print(f"⚙️ Processing version {version['version_number']}...")
        engine.update_version_metrics(version["id"])

    print("✅ Analytics update completed!")

if __name__ == "__main__":
    main()
