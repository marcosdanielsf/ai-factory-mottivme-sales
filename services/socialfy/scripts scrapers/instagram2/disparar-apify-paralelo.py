#!/usr/bin/env python3
"""
DISPARAR ATORES APIFY EM PARALELO
Roda múltiplos scrapes simultaneamente para extração em massa
"""
import os
import sys
import time
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from apify_client import ApifyClient
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
load_dotenv(Path.home() / '.env')

APIFY_ACTOR_ID = "FHC1laGZ14jDtrU0Z"

# Contas-alvo ordenadas por tamanho
CONTAS_ALVO = [
    ('paulomuzy', 7800000),           # Ortopedista
    ('paulobonavides', 4600000),      # Dentista
    ('dr.fernando_lemos', 2400000),   # Coloproctologista
    ('igoorcostalves', 1700000),      # HOF
    ('drviotto', 1000000),            # Dentista + HOF
    ('drjulianopimentel', 894000),    # Médico
    ('dentistamusical', 549000),      # Dentista
    ('congressosmedicosbr', 85000),   # Congressos
    ('congressociam', 52000),         # CIAM
]

FILTER_KEYWORDS = [
    'dr.', 'dra.', 'médico', 'médica', 'medicina', 'crm',
    'harmonização', 'botox', 'preenchimento', 'dentista',
    'odontologia', 'cro', 'estética', 'clínica', 'cirurgião'
]

def disparar_ator(apify: ApifyClient, username: str, max_followers: int, session_id: str) -> dict:
    """Dispara um ator do Apify de forma assíncrona"""
    logger.info(f"🚀 Disparando ator para @{username} (max: {max_followers})...")

    run_input = {
        "targetUsername": username,
        "maxFollowers": max_followers,
        "filterKeywords": FILTER_KEYWORDS,
        "mode": "followers"
    }

    if session_id:
        run_input["sessionId"] = session_id

    try:
        # Dispara o ator sem esperar (async)
        run = apify.actor(APIFY_ACTOR_ID).start(run_input=run_input)
        run_id = run.get('id')
        logger.info(f"✅ Ator disparado para @{username} - Run ID: {run_id}")
        return {
            'username': username,
            'run_id': run_id,
            'status': 'RUNNING',
            'max_followers': max_followers
        }
    except Exception as e:
        logger.error(f"❌ Erro ao disparar @{username}: {e}")
        return {
            'username': username,
            'run_id': None,
            'status': 'ERROR',
            'error': str(e)
        }

def verificar_status(apify: ApifyClient, run_id: str) -> dict:
    """Verifica status de um run"""
    try:
        run = apify.run(run_id).get()
        return {
            'status': run.get('status'),
            'dataset_id': run.get('defaultDatasetId'),
            'stats': run.get('stats', {})
        }
    except Exception as e:
        return {'status': 'ERROR', 'error': str(e)}

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Disparar atores Apify em paralelo')
    parser.add_argument('--session-id', required=True, help='Session ID do Instagram')
    parser.add_argument('--max-followers', type=int, default=5000, help='Max seguidores por conta')
    parser.add_argument('--contas', type=int, default=5, help='Quantas contas processar')
    parser.add_argument('--paralelo', type=int, default=3, help='Quantos atores em paralelo')

    args = parser.parse_args()

    apify = ApifyClient(os.getenv('APIFY_API_TOKEN'))

    contas_para_processar = CONTAS_ALVO[:args.contas]

    logger.info(f"""
{'='*60}
DISPARANDO ATORES EM PARALELO
{'='*60}
Contas: {len(contas_para_processar)}
Max seguidores/conta: {args.max_followers}
Paralelo: {args.paralelo} atores simultâneos
{'='*60}
""")

    runs = []

    # Dispara atores em paralelo
    with ThreadPoolExecutor(max_workers=args.paralelo) as executor:
        futures = {}
        for username, _ in contas_para_processar:
            future = executor.submit(
                disparar_ator,
                apify,
                username,
                args.max_followers,
                args.session_id
            )
            futures[future] = username

        for future in as_completed(futures):
            result = future.result()
            runs.append(result)

    # Resumo
    logger.info(f"""
{'='*60}
ATORES DISPARADOS
{'='*60}""")

    for run in runs:
        status_icon = "✅" if run['status'] == 'RUNNING' else "❌"
        logger.info(f"{status_icon} @{run['username']}: {run.get('run_id', 'ERRO')}")

    # Salva run IDs para monitoramento
    run_ids = [r['run_id'] for r in runs if r['run_id']]

    logger.info(f"""
{'='*60}
MONITORAR PROGRESSO
{'='*60}
Run IDs: {', '.join(run_ids)}

Para verificar status:
  python disparar-apify-paralelo.py --check {' '.join(run_ids)}

Ou acesse:
  https://console.apify.com/organization/runs
{'='*60}
""")

    return runs

if __name__ == '__main__':
    main()
