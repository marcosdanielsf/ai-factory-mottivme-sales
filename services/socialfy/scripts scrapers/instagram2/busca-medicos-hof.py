#!/usr/bin/env python3
"""
BUSCA MÉDICOS + HOF - Combinado
Busca seguidores de contas de médicos e filtra por médico OU HOF
"""
import os
import sys
import re
import time
import logging
from datetime import datetime
from pathlib import Path

from apify_client import ApifyClient
from supabase import create_client
from dotenv import load_dotenv

# Configuração
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
load_dotenv(Path.home() / '.env')

# Keywords combinadas: MÉDICO + HOF
KEYWORDS_MEDICO_HOF = [
    # Médicos
    'dr.', 'dra.', 'médico', 'médica', 'medicina', 'crm',
    'dermatologista', 'cirurgião', 'cirurgiã', 'clínica',
    'nutrólogo', 'nutróloga', 'endocrinologista',
    'cardiologista', 'ortopedista', 'ginecologista',
    'oftalmologista', 'psiquiatra', 'neurologista',
    'oncologista', 'urologista', 'pediatra',
    # HOF / Harmonização
    'harmonização', 'harmonização facial', 'hof', 'preenchimento', 'botox',
    'bioestimulador', 'fios de pdo', 'sculptra', 'radiesse', 'ácido hialurônico',
    'lipo de papada', 'rinomodelação', 'md codes', 'bichectomia', 'skinbooster',
    'estética facial', 'rejuvenescimento', 'orofacial', 'toxina botulínica',
    'estética', 'cirurgia plástica', 'plástica'
]

# Contas alvo - TIER 1: Influencers grandes (milhões de seguidores)
CONTAS_TIER1 = [
    'paulomuzy',           # 7.8M - Ortopedista, medicina esportiva
    'paulobonavides',      # 4.6M - Dentista influencer
    'dr.fernando_lemos',   # 2.4M - Coloproctologista, Planeta Intestino
    'igoorcostalves',      # 1.7M - Referência HOF
    'drviotto',            # 1M - Lentes dentais + HOF
    'drjulianopimentel',   # 894K - Saúde e bem-estar
    'dentistamusical',     # 549K - Odontopediatria
]

# Contas alvo - TIER 2: Congressos e associações
CONTAS_TIER2 = [
    'congressosmedicosbr', # 85K - Congressos médicos
    'congressociam',       # 52K - CIAM
    'anamt_brasil',        # 12K - Medicina do Trabalho
]

# Contas alvo - TIER 3: Médicos/HOF a verificar
CONTAS_TIER3 = [
    'drgabrielalmeida',
    'zeballos59',
    'dr.igorpadovesi',
    'drarobertanogueira',
    'drajackelinebrito',
    'drbrunocamargo',
    'dranatdornelas',
]

# Default: usar TIER 1 (as maiores)
CONTAS_ALVO = CONTAS_TIER1

APIFY_ACTOR_ID = "FHC1laGZ14jDtrU0Z"

class BuscaMedicosHOF:
    def __init__(self, session_id: str = None):
        self.apify = ApifyClient(os.getenv('APIFY_API_TOKEN'))
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        self.session_id = session_id
        self.leads_salvos = 0
        self.leads_duplicados = 0

    def buscar_seguidores(self, username: str, limit: int = 500) -> list:
        """Busca seguidores de uma conta"""
        logger.info(f"Buscando até {limit} seguidores de @{username}...")

        run_input = {
            "targetUsername": username.replace('@', '').lower(),
            "maxFollowers": limit,
            "filterKeywords": KEYWORDS_MEDICO_HOF[:20],  # Top 20 keywords para filtro no Apify
            "mode": "followers"
        }

        if self.session_id:
            run_input["sessionId"] = self.session_id

        try:
            run = self.apify.actor(APIFY_ACTOR_ID).call(run_input=run_input, timeout_secs=600)
            items = list(self.apify.dataset(run["defaultDatasetId"]).iterate_items())
            logger.info(f"Apify retornou {len(items)} perfis")
            return items
        except Exception as e:
            logger.error(f"Erro Apify: {e}")
            return []

    def filtrar_medicos_hof(self, perfis: list) -> list:
        """Filtra perfis que são médicos ou fazem HOF"""
        leads = []

        for p in perfis:
            username = p.get('username', '')
            full_name = p.get('fullName', '') or p.get('full_name', '')
            bio = p.get('biography', '') or p.get('bio', '') or ''

            # Texto combinado para busca
            texto = f"{full_name} {bio}".lower()

            # Verifica se tem alguma keyword
            match = False
            keyword_encontrada = None
            for kw in KEYWORDS_MEDICO_HOF:
                if kw.lower() in texto:
                    match = True
                    keyword_encontrada = kw
                    break

            # Verifica padrão Dr./Dra. no nome
            if not match and re.search(r'\bDra?\.?\b', full_name, re.IGNORECASE):
                match = True
                keyword_encontrada = 'Dr./Dra.'

            if match:
                leads.append({
                    'username': username,
                    'full_name': full_name,
                    'bio': bio[:500] if bio else None,
                    'profile_pic_url': p.get('profilePicUrl') or p.get('profile_pic_url'),
                    'followers': p.get('followersCount') or p.get('followers'),
                    'following': p.get('followingCount') or p.get('following'),
                    'is_verified': p.get('isVerified', False),
                    'is_private': p.get('isPrivate', False),
                    'keyword_match': keyword_encontrada
                })

        logger.info(f"Filtrados {len(leads)} médicos/HOF de {len(perfis)} perfis")
        return leads

    def salvar_leads(self, leads: list, fonte: str):
        """Salva leads no Supabase"""
        for lead in leads:
            try:
                # Verifica se já existe
                existing = self.supabase.table('agentic_instagram_leads').select('id').eq('username', lead['username']).execute()

                if existing.data:
                    self.leads_duplicados += 1
                    continue

                # Monta bio com metadados (colunas disponíveis: username, full_name, bio, source)
                bio_completa = lead.get('bio') or ''
                if lead.get('followers'):
                    bio_completa += f"\n[{lead.get('followers'):,} seguidores]"
                if lead.get('keyword_match'):
                    bio_completa += f" [match: {lead['keyword_match']}]"

                # Insere novo lead (apenas colunas que existem na tabela)
                data = {
                    'username': lead['username'],
                    'full_name': lead.get('full_name') or '',
                    'bio': bio_completa[:500] if bio_completa else None,
                    'source': f"medico_hof:{fonte}"
                }

                self.supabase.table('agentic_instagram_leads').insert(data).execute()
                self.leads_salvos += 1
                seg = lead.get('followers') or 0
                kw = lead.get('keyword_match') or ''
                logger.info(f"✅ Novo: @{lead['username']} ({seg:,} seg) [{kw}]")

            except Exception as e:
                if 'duplicate' in str(e).lower():
                    self.leads_duplicados += 1
                else:
                    logger.error(f"Erro ao salvar @{lead['username']}: {e}")

    def executar(self, contas: list = None, limit_por_conta: int = 500):
        """Executa busca em todas as contas"""
        contas = contas or CONTAS_ALVO

        logger.info(f"""
{'='*60}
BUSCA MÉDICOS + HOF
{'='*60}
Contas alvo: {', '.join(contas)}
Limite por conta: {limit_por_conta}
Keywords: {len(KEYWORDS_MEDICO_HOF)} termos
{'='*60}
""")

        for i, conta in enumerate(contas, 1):
            logger.info(f"\n[{i}/{len(contas)}] Processando @{conta}...")

            # Buscar seguidores
            perfis = self.buscar_seguidores(conta, limit_por_conta)

            if not perfis:
                logger.warning(f"Nenhum perfil retornado de @{conta}")
                continue

            # Filtrar médicos/HOF
            leads = self.filtrar_medicos_hof(perfis)

            # Salvar
            if leads:
                self.salvar_leads(leads, conta)

            # Delay entre contas (reduzido pois são contas diferentes)
            if i < len(contas):
                delay = 10
                logger.info(f"⏳ Aguardando {delay}s antes da próxima conta...")
                time.sleep(delay)

        # Resumo final
        logger.info(f"""
{'='*60}
RESUMO FINAL
{'='*60}
✅ Leads novos salvos: {self.leads_salvos}
🔄 Leads duplicados: {self.leads_duplicados}
📊 Total processado: {self.leads_salvos + self.leads_duplicados}
{'='*60}
""")

        return self.leads_salvos


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Busca médicos + HOF')
    parser.add_argument('--session-id', help='Session ID do Instagram')
    parser.add_argument('--limit', type=int, default=500, help='Limite por conta')
    parser.add_argument('--contas', help='Contas separadas por vírgula')

    args = parser.parse_args()

    contas = args.contas.split(',') if args.contas else None

    busca = BuscaMedicosHOF(session_id=args.session_id)
    busca.executar(contas=contas, limit_por_conta=args.limit)
