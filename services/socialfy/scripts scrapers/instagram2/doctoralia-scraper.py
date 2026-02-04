#!/usr/bin/env python3
"""
DOCTORALIA LEAD SCRAPER
Scrapa leads de médicos e dentistas do Doctoralia (diretório público)
"""
import os
import re
import json
import time
import logging
from pathlib import Path
from datetime import datetime
from urllib.parse import quote_plus, urljoin

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
    'Referer': 'https://www.doctoralia.com.br/',
}


def extract_phones(text: str) -> list:
    """Extrai telefones brasileiros"""
    patterns = [
        r'\(\d{2}\)\s*\d{4,5}[-.\s]?\d{4}',
        r'\d{2}\s*\d{4,5}[-.\s]?\d{4}',
        r'\+55\s*\d{2}\s*\d{4,5}[-.\s]?\d{4}',
    ]
    phones = []
    for pattern in patterns:
        phones.extend(re.findall(pattern, text))
    return list(set(phones))


def scrape_doctoralia_list(specialty: str, city: str, session: requests.Session, max_pages: int = 10) -> list:
    """Scrapa lista de profissionais do Doctoralia"""
    results = []

    # URL base do Doctoralia
    base_url = f"https://www.doctoralia.com.br/{quote_plus(specialty)}/{quote_plus(city)}"

    for page in range(1, max_pages + 1):
        url = base_url if page == 1 else f"{base_url}/{page}"
        logger.info(f"Página {page}: {url}")

        try:
            resp = session.get(url, headers=HEADERS, timeout=30)

            if resp.status_code != 200:
                logger.warning(f"Status {resp.status_code}")
                break

            soup = BeautifulSoup(resp.text, 'html.parser')

            # Encontrar cards de profissionais
            cards = soup.select('div[data-doctor-id]') or soup.select('.doctor-card') or soup.select('[data-id]')

            if not cards:
                # Tentar outro seletor
                cards = soup.select('.search-result-card')

            if not cards:
                logger.info(f"  Nenhum card encontrado na página {page}")
                break

            for card in cards:
                try:
                    # Nome
                    name_el = card.select_one('h3 a') or card.select_one('.doctor-name') or card.select_one('a[data-ga-label]')
                    name = name_el.get_text(strip=True) if name_el else None

                    # Link do perfil
                    profile_link = name_el.get('href') if name_el else None
                    if profile_link and not profile_link.startswith('http'):
                        profile_link = urljoin('https://www.doctoralia.com.br', profile_link)

                    # Especialidade
                    spec_el = card.select_one('.text-muted') or card.select_one('.doctor-specialization')
                    specialty_text = spec_el.get_text(strip=True) if spec_el else specialty

                    # Endereço
                    addr_el = card.select_one('.doctor-address') or card.select_one('.address')
                    address = addr_el.get_text(strip=True) if addr_el else None

                    # Rating
                    rating_el = card.select_one('.rating-value') or card.select_one('[data-rating]')
                    rating = rating_el.get_text(strip=True) if rating_el else None

                    if name:
                        results.append({
                            'name': name,
                            'specialty': specialty_text,
                            'address': address,
                            'city': city,
                            'rating': rating,
                            'profile_url': profile_link,
                            'source': 'doctoralia'
                        })

                except Exception as e:
                    continue

            logger.info(f"  Encontrados {len(cards)} profissionais")
            time.sleep(2)  # Rate limit

        except Exception as e:
            logger.error(f"Erro na página {page}: {e}")
            break

    return results


def scrape_profile_details(profile_url: str, session: requests.Session) -> dict:
    """Scrapa detalhes de um perfil individual"""
    details = {}

    try:
        resp = session.get(profile_url, headers=HEADERS, timeout=15)

        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            text = soup.get_text()

            # Telefone
            phones = extract_phones(text)
            if phones:
                details['phone'] = phones[0]

            # Website
            website_el = soup.select_one('a[href*="website"]') or soup.select_one('a.website')
            if website_el:
                details['website'] = website_el.get('href')

            # Email (raro, mas às vezes aparece)
            email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            emails = re.findall(email_pattern, text)
            if emails:
                details['email'] = emails[0]

    except Exception as e:
        pass

    return details


def import_to_growth_leads(leads: list, source_campaign: str):
    """Importa leads para growth_leads no Supabase"""
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )

    imported = 0
    duplicates = 0

    for lead in leads:
        name = lead.get('name', '')

        if not name:
            continue

        # Verificar duplicata
        existing = supabase.table('growth_leads').select('id').ilike('name', f'%{name[:20]}%').execute()

        if existing.data:
            duplicates += 1
            continue

        data = {
            'location_id': '11111111-1111-1111-1111-111111111111',
            'name': name[:100],
            'email': lead.get('email'),
            'phone': lead.get('phone'),
            'source_channel': 'doctoralia',
            'source_campaign': source_campaign,
            'funnel_stage': 'lead_novo',
            'lead_temperature': 'cold',
            'tags': ['doctoralia', lead.get('specialty', ''), lead.get('city', '')],
            'custom_fields': {
                'specialty': lead.get('specialty'),
                'address': lead.get('address'),
                'city': lead.get('city'),
                'rating': lead.get('rating'),
                'profile_url': lead.get('profile_url'),
                'website': lead.get('website'),
                'scraped_at': datetime.now().isoformat()
            }
        }

        try:
            supabase.table('growth_leads').insert(data).execute()
            imported += 1

            if imported % 50 == 0:
                logger.info(f"  Progresso: {imported} importados")
        except Exception as e:
            if 'duplicate' not in str(e).lower():
                logger.error(f"Erro ao importar {name}: {e}")

    logger.info(f"✅ Importados: {imported}, Duplicados: {duplicates}")
    return imported


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Scraper de Doctoralia para leads de saúde')
    parser.add_argument('--specialty', default='dentista', help='Especialidade (dentista, dermatologista, etc)')
    parser.add_argument('--cities', nargs='+', default=['sao-paulo'], help='Cidades para buscar')
    parser.add_argument('--pages', type=int, default=10, help='Páginas por cidade')
    parser.add_argument('--details', action='store_true', help='Buscar detalhes de cada perfil (mais lento)')
    parser.add_argument('--import-db', action='store_true', help='Importar para Supabase')

    args = parser.parse_args()

    session = requests.Session()
    all_leads = []

    for city in args.cities:
        logger.info(f"\n{'='*60}")
        logger.info(f"Buscando {args.specialty} em {city}")
        logger.info(f"{'='*60}")

        leads = scrape_doctoralia_list(args.specialty, city, session, args.pages)

        if args.details:
            logger.info(f"Buscando detalhes de {len(leads)} perfis...")
            for i, lead in enumerate(leads):
                if lead.get('profile_url'):
                    details = scrape_profile_details(lead['profile_url'], session)
                    lead.update(details)

                    if (i + 1) % 10 == 0:
                        logger.info(f"  Detalhes: {i + 1}/{len(leads)}")
                    time.sleep(1)

        all_leads.extend(leads)

    # Remover duplicatas por nome
    seen = set()
    unique_leads = []
    for lead in all_leads:
        key = lead.get('name', '').lower()[:30]
        if key and key not in seen:
            seen.add(key)
            unique_leads.append(lead)

    logger.info(f"""
{'='*60}
RESULTADOS
{'='*60}
Total bruto: {len(all_leads)}
Total único: {len(unique_leads)}
{'='*60}
""")

    # Mostrar alguns
    for lead in unique_leads[:10]:
        logger.info(f"  - {lead.get('name')}")
        logger.info(f"    Esp: {lead.get('specialty', 'N/A')}")
        logger.info(f"    Tel: {lead.get('phone', 'N/A')}")

    # Importar
    if args.import_db and unique_leads:
        source = f"doctoralia_{args.specialty}_{args.cities[0]}"[:50]
        import_to_growth_leads(unique_leads, source)

    return unique_leads


if __name__ == '__main__':
    main()
