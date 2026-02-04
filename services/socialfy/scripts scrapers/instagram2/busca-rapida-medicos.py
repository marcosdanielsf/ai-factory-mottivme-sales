#!/usr/bin/env python3
"""
BUSCA RÁPIDA DE MÉDICOS - Sem parar!
Foca em contas públicas conhecidas
"""

import os
import sys
import time
import random
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
from apify_client import ApifyClient
from supabase import create_client

load_dotenv(Path.home() / '.env')

# Configuração
APIFY_TOKEN = os.getenv('APIFY_API_TOKEN')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
ACTOR_ID = "FHC1laGZ14jDtrU0Z"

# Contas PÚBLICAS de médicos/saúde (verificadas)
CONTAS_PUBLICAS = [
    # Acelerador Médico (principais)
    'aceleradormedico',
    'grupoacelerador',

    # Grandes influenciadores médicos
    'drauziovarella',

    # Cursos de medicina
    'saaborasil',           # Sociedade de Anestesiologia
    'saborasil',            # Sociedade Brasileira de Oncologia

    # Hospitais grandes
    'hospitaleinsteinbr',
    'hospitalsiriolibanes',

    # Contas de especialidades
    'sbgg_oficial',          # Sociedade Brasileira de Geriatria
    'sbcbrasil',             # Cardiologia
    'sbd_oficial',           # Dermatologia
    'cboftalmo',             # Oftalmologia
    'sbneur',                # Neurologia

    # Influenciadores médicos menores mas ativos
    'dr.felipemoraes',
    'dramariafernanda',
    'drrenatosouza',
    'draanaclaudia',
]

# Keywords médicas
MEDICO_KEYWORDS = [
    'dr.', 'dra.', 'médico', 'médica', 'medicina', 'crm',
    'dermatologista', 'cirurgião', 'cirurgiã', 'clínica',
    'nutrólogo', 'nutróloga', 'endocrinologista',
    'cardiologista', 'ortopedista', 'ginecologista',
    'oftalmologista', 'psiquiatra', 'neurologista',
    'oncologista', 'urologista', 'pediatra',
    'harmonização', 'estética', 'botox'
]

# Especialidades para extração
ESPECIALIDADES = {
    'nutrologia': ['nutrólogo', 'nutróloga', 'nutrologia'],
    'cardiologia': ['cardiologista', 'cardiologia'],
    'dermatologia': ['dermatologista', 'dermatologia'],
    'endocrinologia': ['endocrinologista', 'endocrinologia', 'tireoide'],
    'pediatria': ['pediatra', 'pediatria'],
    'psiquiatria': ['psiquiatra', 'psiquiatria'],
    'ginecologia': ['ginecologista', 'ginecologia'],
    'ortopedia': ['ortopedista', 'ortopedia'],
    'neurologia': ['neurologista', 'neurologia'],
    'medicina estética': ['harmonização', 'botox', 'preenchimento', 'estética'],
    'cirurgia plástica': ['cirurgião plástico', 'cirurgiã plástica', 'plástica'],
    'oftalmologia': ['oftalmologista', 'oftalmologia'],
    'gastroenterologia': ['gastro', 'gastroenterologista'],
    'urologia': ['urologista', 'urologia'],
    'oncologia': ['oncologista', 'oncologia'],
    'geriatria': ['geriatra', 'geriatria'],
    'angiologia': ['angiologista', 'varizes'],
    'medicina integrativa': ['integrativa', 'funcional', 'ortomolecular'],
}


def extract_specialty(bio, name):
    """Extrai especialidade da bio e nome"""
    if not bio and not name:
        return []

    text = f"{bio or ''} {name or ''}".lower()
    found = []

    for specialty, keywords in ESPECIALIDADES.items():
        for kw in keywords:
            if kw.lower() in text:
                if specialty not in found:
                    found.append(specialty)
                break

    return found


def process_profile(profile):
    """Processa um perfil e retorna dados do lead"""
    username = profile.get('username', '')
    full_name = profile.get('fullName', '')
    bio = profile.get('biography', '')
    followers = profile.get('followersCount', 0)

    # ICP tier
    if followers and followers >= 10000:
        icp_tier = 'A'
    elif followers and followers >= 1000:
        icp_tier = 'B'
    else:
        icp_tier = 'C'

    # Especialidades
    especialidades = extract_specialty(bio, full_name)

    # Tags
    tags = ['medico']
    if profile.get('isVerified'):
        tags.append('verificado')
        icp_tier = 'A'
    if profile.get('isBusinessAccount'):
        tags.append('business')
    if followers and followers >= 10000:
        tags.append('influenciador')
    for esp in especialidades:
        if esp not in tags:
            tags.append(esp)

    # Título
    title = None
    if 'Dra.' in full_name or 'Dra ' in full_name:
        title = 'Dra.'
    elif 'Dr.' in full_name or 'Dr ' in full_name:
        title = 'Dr.'

    return {
        'name': full_name,
        'title': title,
        'instagram_handle': f'@{username}',
        'instagram_url': f'https://instagram.com/{username}',
        'instagram_followers': followers,
        'instagram_following': profile.get('followingCount'),
        'instagram_posts': profile.get('postsCount'),
        'instagram_bio': bio[:1000] if bio else None,
        'instagram_is_verified': profile.get('isVerified', False),
        'instagram_is_business': profile.get('isBusinessAccount', False),
        'vertical': 'medico',
        'vertical_data': {
            'especialidades': especialidades,
            'especialidade_principal': especialidades[0] if especialidades else None
        } if especialidades else None,
        'source': 'apify_scraping',
        'source_data': {
            'apify_actor_id': ACTOR_ID,
            'source_type': 'followers'
        },
        'scrape_source': 'apify',
        'tags': tags,
        'status': 'available',
        'icp_tier': icp_tier,
        'channels': ['instagram'],
        'organization_id': '11111111-1111-1111-1111-111111111111',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'scraped_at': datetime.now().isoformat(),
    }


def run_continuous(session_id, max_per_account=500):
    """Roda busca contínua"""
    apify = ApifyClient(APIFY_TOKEN)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    total_leads = 0
    start_time = datetime.now()

    print("\n" + "="*60)
    print("🚀 BUSCA CONTÍNUA DE MÉDICOS")
    print("="*60)
    print(f"📋 Contas para buscar: {len(CONTAS_PUBLICAS)}")
    print(f"👥 Limite por conta: {max_per_account}")
    print("="*60 + "\n")

    cycle = 1

    while True:
        print(f"\n🔄 CICLO {cycle}")

        # Embaralhar contas
        contas = CONTAS_PUBLICAS.copy()
        random.shuffle(contas)

        for i, conta in enumerate(contas, 1):
            print(f"\n[{i}/{len(contas)}] 🔍 @{conta}...")

            try:
                # Buscar seguidores
                run_input = {
                    "targetUsername": conta,
                    "sessionId": session_id,
                    "maxFollowers": max_per_account,
                    "filterKeywords": MEDICO_KEYWORDS,
                    "mode": "followers"
                }

                run = apify.actor(ACTOR_ID).call(run_input=run_input, timeout_secs=600)
                items = list(apify.dataset(run["defaultDatasetId"]).iterate_items())

                print(f"   📊 Encontrados: {len(items)} médicos")

                novos = 0
                for profile in items:
                    if profile.get('error'):
                        continue

                    try:
                        lead = process_profile(profile)
                        handle = lead['instagram_handle'].lower()

                        # Verificar se existe
                        existing = supabase.table('socialfy_leads').select('id').eq(
                            'instagram_handle', handle
                        ).execute()

                        if existing.data:
                            # Atualizar
                            supabase.table('socialfy_leads').update({
                                'instagram_followers': lead['instagram_followers'],
                                'instagram_bio': lead['instagram_bio'],
                                'vertical_data': lead['vertical_data'],
                                'tags': lead['tags'],
                                'updated_at': datetime.now().isoformat()
                            }).eq('id', existing.data[0]['id']).execute()
                        else:
                            # Inserir novo
                            supabase.table('socialfy_leads').insert(lead).execute()
                            novos += 1
                            total_leads += 1
                            esp = lead.get('vertical_data', {}).get('especialidade_principal', '') if lead.get('vertical_data') else ''
                            print(f"   ✓ NOVO: @{profile.get('username')} [{esp}]")

                    except Exception as e:
                        pass

                print(f"   ✅ {novos} novos leads")

                # Intervalo entre contas
                wait = random.randint(30, 60)
                print(f"   ⏳ Aguardando {wait}s...")
                time.sleep(wait)

            except Exception as e:
                print(f"   ❌ Erro: {e}")
                time.sleep(30)

        # Status do ciclo
        tempo = datetime.now() - start_time
        print("\n" + "="*60)
        print(f"📈 CICLO {cycle} COMPLETO")
        print(f"   Total de leads novos: {total_leads}")
        print(f"   Tempo total: {tempo}")
        print("="*60)

        cycle += 1
        print("\n🔄 Reiniciando ciclo em 2 minutos...")
        time.sleep(120)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--session-id', '-s', required=True, help='Session ID do Instagram')
    parser.add_argument('--max', '-m', type=int, default=500, help='Max por conta')
    args = parser.parse_args()

    run_continuous(args.session_id, args.max)
