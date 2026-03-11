#!/usr/bin/env python3
"""
MONITORAR ATORES APIFY E IMPORTAR LEADS
Monitora runs em andamento e importa resultados para growth_leads
"""
import os
import sys
import time
import json
import logging
from pathlib import Path
from datetime import datetime

from apify_client import ApifyClient
from supabase import create_client
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
load_dotenv(Path.home() / '.env')

# Run IDs dos atores disparados (BATCH 3 - 10K cada COM SESSION)
RUN_IDS = [
    ('drjulianopimentel', 'tUtvVnQiTO7unhMOb'),
    ('dentistamusical', 'qCQp8OgqqHnYXNfdD'),
    ('congressosmedicosbr', 'AqHe2qwIgoAjq9YzH'),
    ('congressociam', 'nThUVYOciTjKMfTTI'),
    ('drviotto', '5381IhybRKrlO0Qir'),
    ('igoorcostalves', '7P5HrkQ2zn2bdK5QY'),
    ('paulomuzy', 'oiMJm0KPRmdv991Ev'),
    ('paulobonavides', 'sIvIfdpXbSpDD7kzb'),
    ('dr.fernando_lemos', 'HQlhyPLNiDFZ8mzfg'),
]

class MonitorImportador:
    def __init__(self):
        self.apify = ApifyClient(os.getenv('APIFY_API_TOKEN'))
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        self.leads_importados = 0
        self.leads_duplicados = 0

    def verificar_status(self, run_id: str) -> dict:
        """Verifica status de um run"""
        try:
            run = self.apify.run(run_id).get()
            return {
                'status': run.get('status'),
                'dataset_id': run.get('defaultDatasetId'),
                'started_at': run.get('startedAt'),
                'finished_at': run.get('finishedAt'),
            }
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e)}

    def baixar_resultados(self, dataset_id: str) -> list:
        """Baixa resultados de um dataset"""
        try:
            items = list(self.apify.dataset(dataset_id).iterate_items())
            return items
        except Exception as e:
            logger.error(f"Erro ao baixar dataset {dataset_id}: {e}")
            return []

    def importar_lead(self, perfil: dict, fonte: str) -> bool:
        """Importa um lead para growth_leads"""
        username = perfil.get('username', '')
        if not username:
            return False

        try:
            # Verifica se já existe por instagram_username
            existing = self.supabase.table('growth_leads').select('id').eq('instagram_username', username).execute()

            if existing.data:
                self.leads_duplicados += 1
                return False

            # Monta dados do lead
            full_name = perfil.get('fullName', '') or perfil.get('full_name', '') or ''
            bio = perfil.get('biography', '') or perfil.get('bio', '') or ''
            followers = perfil.get('followersCount') or perfil.get('followers') or 0
            profile_pic = perfil.get('profilePicUrl') or perfil.get('profile_pic_url', '')

            # Detecta se é médico, dentista ou HOF baseado na bio
            bio_lower = bio.lower()
            tags = []
            if any(kw in bio_lower for kw in ['médico', 'médica', 'dr.', 'dra.', 'crm', 'medicina']):
                tags.append('medico')
            if any(kw in bio_lower for kw in ['dentista', 'cro', 'odonto']):
                tags.append('dentista')
            if any(kw in bio_lower for kw in ['harmonização', 'hof', 'botox', 'preenchimento', 'estética']):
                tags.append('hof')
            tags.append('instagram_scrape')

            data = {
                'location_id': '11111111-1111-1111-1111-111111111111',  # Location padrão
                'name': full_name or username,
                'instagram_username': username,
                'avatar_url': profile_pic,
                'source_channel': 'instagram',
                'source_campaign': f'scrape_{fonte}',
                'funnel_stage': 'lead_novo',
                'lead_temperature': 'cold',
                'tags': tags,
                'custom_fields': {
                    'bio': bio[:500] if bio else None,
                    'followers': followers,
                    'scraped_from': fonte,
                    'scraped_at': datetime.now().isoformat()
                }
            }

            self.supabase.table('growth_leads').insert(data).execute()
            self.leads_importados += 1

            if self.leads_importados % 100 == 0:
                logger.info(f"📊 Progresso: {self.leads_importados} importados, {self.leads_duplicados} duplicados")

            return True

        except Exception as e:
            if 'duplicate' in str(e).lower():
                self.leads_duplicados += 1
            else:
                logger.error(f"Erro ao importar @{username}: {e}")
            return False

    def monitorar_e_importar(self, intervalo: int = 30):
        """Monitora runs e importa quando terminarem"""
        runs_pendentes = {run_id: username for username, run_id in RUN_IDS}
        runs_importados = set()

        logger.info(f"""
{'='*60}
MONITORANDO {len(runs_pendentes)} RUNS
{'='*60}
Intervalo de verificação: {intervalo}s
{'='*60}
""")

        while runs_pendentes:
            for run_id, username in list(runs_pendentes.items()):
                status = self.verificar_status(run_id)

                if status['status'] == 'SUCCEEDED':
                    logger.info(f"✅ @{username} CONCLUÍDO! Importando...")

                    # Baixa e importa resultados
                    dataset_id = status.get('dataset_id')
                    if dataset_id:
                        resultados = self.baixar_resultados(dataset_id)
                        logger.info(f"   Baixados {len(resultados)} perfis de @{username}")

                        for perfil in resultados:
                            self.importar_lead(perfil, username)

                    runs_importados.add(run_id)
                    del runs_pendentes[run_id]

                elif status['status'] == 'FAILED':
                    logger.error(f"❌ @{username} FALHOU!")
                    del runs_pendentes[run_id]

                elif status['status'] == 'RUNNING':
                    logger.info(f"⏳ @{username} ainda rodando...")

            if runs_pendentes:
                logger.info(f"\n💤 Aguardando {intervalo}s... ({len(runs_pendentes)} runs pendentes)\n")
                time.sleep(intervalo)

        # Resumo final
        logger.info(f"""
{'='*60}
IMPORTAÇÃO CONCLUÍDA
{'='*60}
✅ Leads importados: {self.leads_importados}
🔄 Leads duplicados: {self.leads_duplicados}
📊 Total processado: {self.leads_importados + self.leads_duplicados}
{'='*60}
""")

        return self.leads_importados

    def importar_run_especifico(self, run_id: str, fonte: str):
        """Importa resultados de um run específico"""
        logger.info(f"Importando run {run_id} ({fonte})...")

        status = self.verificar_status(run_id)
        if status['status'] != 'SUCCEEDED':
            logger.warning(f"Run {run_id} não está concluído (status: {status['status']})")
            return 0

        dataset_id = status.get('dataset_id')
        if not dataset_id:
            logger.error(f"Dataset não encontrado para run {run_id}")
            return 0

        resultados = self.baixar_resultados(dataset_id)
        logger.info(f"Baixados {len(resultados)} perfis")

        for perfil in resultados:
            self.importar_lead(perfil, fonte)

        logger.info(f"✅ Importados: {self.leads_importados}, Duplicados: {self.leads_duplicados}")
        return self.leads_importados


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Monitorar e importar leads do Apify')
    parser.add_argument('--monitorar', action='store_true', help='Monitorar runs e importar quando terminarem')
    parser.add_argument('--intervalo', type=int, default=30, help='Intervalo entre verificações (segundos)')
    parser.add_argument('--run-id', help='Importar run específico')
    parser.add_argument('--fonte', help='Nome da fonte (para run específico)')
    parser.add_argument('--status', action='store_true', help='Apenas verificar status dos runs')

    args = parser.parse_args()

    monitor = MonitorImportador()

    if args.status:
        print(f"\n{'='*60}")
        print("STATUS DOS RUNS")
        print(f"{'='*60}")
        for username, run_id in RUN_IDS:
            status = monitor.verificar_status(run_id)
            icon = "✅" if status['status'] == 'SUCCEEDED' else "⏳" if status['status'] == 'RUNNING' else "❌"
            print(f"{icon} @{username}: {status['status']}")
        print(f"{'='*60}\n")

    elif args.run_id:
        fonte = args.fonte or 'manual'
        monitor.importar_run_especifico(args.run_id, fonte)

    elif args.monitorar:
        monitor.monitorar_e_importar(intervalo=args.intervalo)

    else:
        # Default: verificar status
        print("Uso:")
        print("  --status      Verificar status dos runs")
        print("  --monitorar   Monitorar e importar quando terminarem")
        print("  --run-id ID   Importar run específico")
