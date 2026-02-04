#!/usr/bin/env python3
"""
GOOGLE MAPS LEAD SCRAPER - LOCAL
Usa requests + headers realistas para buscar leads no Google
"""
import os
import re
import json
import time
import logging
from pathlib import Path
from datetime import datetime
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
load_dotenv(Path.home() / '.env')

# Headers realistas
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}


def extract_emails(text: str) -> list:
    """Extrai emails de texto"""
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return list(set(re.findall(pattern, text)))


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


def search_google_maps(query: str, session: requests.Session) -> list:
    """Busca no Google Maps via URL"""
    results = []

    # URL do Google Maps search
    url = f"https://www.google.com/maps/search/{quote_plus(query)}"

    logger.info(f"Buscando: {query}")

    try:
        resp = session.get(url, headers=HEADERS, timeout=30)

        if resp.status_code != 200:
            logger.warning(f"Status {resp.status_code} para {query}")
            return results

        # O Google Maps retorna dados em JSON dentro do HTML
        # Procurar por dados estruturados
        html = resp.text

        # Buscar padrões de lugares
        # Pattern para extrair dados de lugares do Maps
        place_pattern = r'\["([^"]+)",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,\[(-?\d+\.\d+),(-?\d+\.\d+)\]'

        matches = re.findall(place_pattern, html)

        for match in matches[:50]:
            name = match[0]
            if len(name) > 3:
                results.append({
                    'name': name,
                    'lat': match[1],
                    'lng': match[2],
                    'query': query
                })

        logger.info(f"  Encontrados {len(results)} lugares")

    except Exception as e:
        logger.error(f"Erro na busca: {e}")

    return results


def scrape_website_contacts(url: str, session: requests.Session) -> dict:
    """Extrai contatos de um site"""
    try:
        resp = session.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            text = resp.text
            soup = BeautifulSoup(text, 'html.parser')

            # Pegar texto da página
            body_text = soup.get_text()

            return {
                'emails': extract_emails(body_text),
                'phones': extract_phones(body_text)
            }
    except:
        pass

    return {'emails': [], 'phones': []}


def search_google_places_api(query: str, api_key: str) -> list:
    """Busca usando Google Places API (mais confiável)"""
    results = []

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        'query': query,
        'key': api_key,
        'language': 'pt-BR'
    }

    try:
        resp = requests.get(url, params=params, timeout=30)
        data = resp.json()

        if data.get('status') == 'OK':
            for place in data.get('results', []):
                results.append({
                    'name': place.get('name'),
                    'address': place.get('formatted_address'),
                    'place_id': place.get('place_id'),
                    'rating': place.get('rating'),
                    'types': place.get('types', []),
                    'query': query
                })

            logger.info(f"  API retornou {len(results)} lugares")
    except Exception as e:
        logger.error(f"Erro na API: {e}")

    return results


def get_place_details(place_id: str, api_key: str) -> dict:
    """Pega detalhes de um lugar (telefone, site, etc)"""
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'key': api_key,
        'fields': 'name,formatted_phone_number,website,formatted_address,rating,reviews',
        'language': 'pt-BR'
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        data = resp.json()

        if data.get('status') == 'OK':
            return data.get('result', {})
    except:
        pass

    return {}


def import_to_growth_leads(leads: list, source: str):
    """Importa leads para growth_leads no Supabase"""
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )

    imported = 0
    duplicates = 0

    for lead in leads:
        name = lead.get('name', '')
        phone = lead.get('phone') or (lead.get('phones', [None])[0] if lead.get('phones') else None)
        email = (lead.get('emails', [None])[0] if lead.get('emails') else None)

        if not name:
            continue

        # Verificar duplicata por nome (aproximado)
        existing = supabase.table('growth_leads').select('id').ilike('name', f'%{name[:20]}%').execute()

        if existing.data:
            duplicates += 1
            continue

        data = {
            'location_id': '11111111-1111-1111-1111-111111111111',
            'name': name[:100],
            'email': email,
            'phone': phone,
            'source_channel': 'google_maps',
            'source_campaign': f'google_maps_{source}',
            'funnel_stage': 'lead_novo',
            'lead_temperature': 'cold',
            'tags': ['google_maps', source.replace('_', ' ')],
            'custom_fields': {
                'address': lead.get('address'),
                'website': lead.get('website'),
                'rating': lead.get('rating'),
                'scraped_from': source,
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

    parser = argparse.ArgumentParser(description='Scraper de Google Maps para leads')
    parser.add_argument('--queries', nargs='+', default=['dentista São Paulo'], help='Termos de busca')
    parser.add_argument('--api-key', help='Google Places API Key (opcional)')
    parser.add_argument('--max', type=int, default=100, help='Máximo de leads por query')
    parser.add_argument('--import-db', action='store_true', help='Importar para Supabase')

    args = parser.parse_args()

    session = requests.Session()
    all_leads = []

    # Se tiver API key, usa a API oficial (melhor)
    google_api_key = args.api_key or os.getenv('GOOGLE_PLACES_API_KEY')

    if google_api_key:
        logger.info("Usando Google Places API")

        for query in args.queries:
            places = search_google_places_api(query, google_api_key)

            for place in places[:args.max]:
                # Pegar detalhes
                if place.get('place_id'):
                    details = get_place_details(place['place_id'], google_api_key)
                    place['phone'] = details.get('formatted_phone_number')
                    place['website'] = details.get('website')
                    place['address'] = details.get('formatted_address') or place.get('address')

                    # Se tiver site, tentar pegar email
                    if place.get('website'):
                        contacts = scrape_website_contacts(place['website'], session)
                        place['emails'] = contacts['emails']

                all_leads.append(place)

            time.sleep(1)  # Rate limit
    else:
        logger.info("Usando scraping direto (sem API key)")
        logger.warning("Para melhores resultados, configure GOOGLE_PLACES_API_KEY no .env")

        for query in args.queries:
            places = search_google_maps(query, session)
            all_leads.extend(places[:args.max])
            time.sleep(2)

    # Resumo
    logger.info(f"""
{'='*60}
RESULTADOS
{'='*60}
Total de leads: {len(all_leads)}
{'='*60}
""")

    # Mostrar alguns
    for lead in all_leads[:10]:
        logger.info(f"  - {lead.get('name')}")
        logger.info(f"    Tel: {lead.get('phone', 'N/A')}")
        logger.info(f"    Email: {lead.get('emails', ['N/A'])[0] if lead.get('emails') else 'N/A'}")

    # Importar
    if args.import_db and all_leads:
        source = args.queries[0].replace(' ', '_')[:30]
        import_to_growth_leads(all_leads, source)

    return all_leads


if __name__ == '__main__':
    main()
