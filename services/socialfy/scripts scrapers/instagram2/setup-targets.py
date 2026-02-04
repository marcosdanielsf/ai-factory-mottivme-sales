#!/usr/bin/env python3
"""
=============================================================================
Setup inicial de alvos de scraping no Supabase
Configura hashtags e perfis para scraping automático
=============================================================================
"""

import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("Execute: pip install supabase python-dotenv")
    sys.exit(1)

load_dotenv(Path.home() / '.env')
load_dotenv(Path.home() / 'Projects/mottivme/socialfy-platform/.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Credenciais Supabase não configuradas")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Alvos de scraping - Hashtags prioritárias
TARGETS = [
    # Tier A - Alto ticket
    {"nome": "Dermatologista", "tipo": "hashtag", "valor": "dermatologista", "prioridade": 10,
     "filtros": {"limit": 30, "min_followers": 1000}},
    {"nome": "Cirurgião Plástico", "tipo": "hashtag", "valor": "cirurgiaoplastico", "prioridade": 10,
     "filtros": {"limit": 25, "min_followers": 2000}},
    {"nome": "Medicina Estética", "tipo": "hashtag", "valor": "medicinaestetica", "prioridade": 10,
     "filtros": {"limit": 30, "min_followers": 1000}},
    {"nome": "Nutrólogo", "tipo": "hashtag", "valor": "nutrologo", "prioridade": 9,
     "filtros": {"limit": 25, "min_followers": 1000}},
    {"nome": "Harmonização Facial", "tipo": "hashtag", "valor": "harmonizacaofacial", "prioridade": 9,
     "filtros": {"limit": 30, "min_followers": 1000}},

    # Tier B - Médio ticket
    {"nome": "Endocrinologista", "tipo": "hashtag", "valor": "endocrinologista", "prioridade": 7,
     "filtros": {"limit": 20, "min_followers": 500}},
    {"nome": "Cardiologista", "tipo": "hashtag", "valor": "cardiologista", "prioridade": 7,
     "filtros": {"limit": 20, "min_followers": 500}},
    {"nome": "Oftalmologista", "tipo": "hashtag", "valor": "oftalmologista", "prioridade": 6,
     "filtros": {"limit": 15, "min_followers": 500}},
    {"nome": "Odontologia Estética", "tipo": "hashtag", "valor": "odontologiaestetica", "prioridade": 7,
     "filtros": {"limit": 25, "min_followers": 1000}},
    {"nome": "Ginecologista", "tipo": "hashtag", "valor": "ginecologista", "prioridade": 6,
     "filtros": {"limit": 20, "min_followers": 500}},

    # Tier C - Volume
    {"nome": "Nutricionista", "tipo": "hashtag", "valor": "nutricionistaclinico", "prioridade": 5,
     "filtros": {"limit": 15, "min_followers": 500}},
    {"nome": "Fisioterapeuta", "tipo": "hashtag", "valor": "fisioterapeutaesportivo", "prioridade": 4,
     "filtros": {"limit": 15, "min_followers": 500}},
    {"nome": "Psiquiatra", "tipo": "hashtag", "valor": "psiquiatra", "prioridade": 5,
     "filtros": {"limit": 15, "min_followers": 500}},

    # Hashtags regionais (SP)
    {"nome": "Dermato SP", "tipo": "hashtag", "valor": "dermatologistasp", "prioridade": 8,
     "filtros": {"limit": 20, "min_followers": 1000}},
    {"nome": "Médico SP", "tipo": "hashtag", "valor": "medicosp", "prioridade": 6,
     "filtros": {"limit": 15, "min_followers": 500}},

    # Hashtags de conteúdo médico
    {"nome": "Dicas Dermato", "tipo": "hashtag", "valor": "dicasdedermatologia", "prioridade": 7,
     "filtros": {"limit": 20, "min_followers": 2000}},
    {"nome": "Saúde da Pele", "tipo": "hashtag", "valor": "saudedapele", "prioridade": 6,
     "filtros": {"limit": 15, "min_followers": 1000}},
]

def setup_targets():
    """Insere alvos de scraping no Supabase"""
    print("Configurando alvos de scraping...")

    inserted = 0
    for target in TARGETS:
        try:
            # Verificar se já existe
            existing = supabase.table('scrape_targets').select('id').eq(
                'valor', target['valor']
            ).execute()

            if existing.data:
                print(f"  ⏭️  {target['nome']} já existe")
                continue

            # Inserir
            supabase.table('scrape_targets').insert({
                'nome': target['nome'],
                'tipo': target['tipo'],
                'valor': target['valor'],
                'prioridade': target['prioridade'],
                'filtros': target['filtros'],
                'ativo': True,
                'frequencia': 'daily'
            }).execute()

            print(f"  ✅ {target['nome']} inserido")
            inserted += 1

        except Exception as e:
            print(f"  ❌ Erro em {target['nome']}: {e}")

    print(f"\nTotal inseridos: {inserted}/{len(TARGETS)}")


if __name__ == '__main__':
    setup_targets()
