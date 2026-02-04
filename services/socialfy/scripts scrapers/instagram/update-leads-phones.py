#!/usr/bin/env python3
"""
ATUALIZA LEADS COM TELEFONES
Busca telefones do Doctoralia e atualiza leads existentes no Supabase
"""
import os
import re
import time
import logging
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
load_dotenv(Path.home() / '.env')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
}


def extract_phones(text: str) -> list:
    patterns = [
        r'\(\d{2}\)\s*\d{4,5}[-.\s]?\d{4}',
        r'\d{2}\s*\d{4,5}[-.\s]?\d{4}',
        r'\+55\s*\d{2}\s*\d{4,5}[-.\s]?\d{4}',
    ]
    phones = []
    for pattern in patterns:
        phones.extend(re.findall(pattern, text))
    return list(set(phones))


def search_doctoralia_profile(name: str, session: requests.Session) -> dict:
    """Busca perfil no Doctoralia pelo nome"""
    search_name = name.replace('Dr. ', '').replace('Dra. ', '').replace('Prof. ', '')
    search_url = f"https://www.doctoralia.com.br/pesquisa?q={requests.utils.quote(search_name)}"

    try:
        resp = session.get(search_url, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')

            # Pegar primeiro resultado
            first_result = soup.select_one('a[data-ga-label]') or soup.select_one('.doctor-name a')
            if first_result:
                profile_url = first_result.get('href')
                if profile_url and not profile_url.startswith('http'):
                    profile_url = urljoin('https://www.doctoralia.com.br', profile_url)
                return {'profile_url': profile_url}
    except:
        pass
    return {}


def get_phone_from_profile(profile_url: str, session: requests.Session) -> str:
    """Extrai telefone de um perfil do Doctoralia"""
    try:
        resp = session.get(profile_url, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            text = soup.get_text()
            phones = extract_phones(text)
            if phones:
                return phones[0]
    except:
        pass
    return None


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=100, help='Quantidade de leads para atualizar')
    parser.add_argument('--source', default='doctoralia', help='Source channel para filtrar')
    args = parser.parse_args()

    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )
    session = requests.Session()

    # Buscar leads sem telefone
    leads = supabase.table('growth_leads').select('id,name,custom_fields').eq('source_channel', args.source).is_('phone', 'null').limit(args.limit).execute()

    logger.info(f"Encontrados {len(leads.data)} leads sem telefone")

    updated = 0
    for i, lead in enumerate(leads.data):
        name = lead.get('name', '')
        custom_fields = lead.get('custom_fields', {}) or {}
        profile_url = custom_fields.get('profile_url')

        if not profile_url:
            # Tentar buscar pelo nome
            result = search_doctoralia_profile(name, session)
            profile_url = result.get('profile_url')

        if profile_url:
            phone = get_phone_from_profile(profile_url, session)
            if phone:
                # Atualizar lead
                supabase.table('growth_leads').update({'phone': phone}).eq('id', lead['id']).execute()
                updated += 1
                logger.info(f"✅ {name}: {phone}")
            else:
                logger.info(f"❌ {name}: sem telefone no perfil")
        else:
            logger.info(f"⚠️ {name}: perfil não encontrado")

        if (i + 1) % 10 == 0:
            logger.info(f"Progresso: {i + 1}/{len(leads.data)}")

        time.sleep(1)  # Rate limit

    logger.info(f"\n✅ Atualizados: {updated}/{len(leads.data)} leads")


if __name__ == '__main__':
    main()
