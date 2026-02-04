#!/usr/bin/env python3
"""
=============================================================================
MOTTIVME - Sincronização de Leads para GoHighLevel
Envia leads qualificados do Supabase (socialfy_leads) para o CRM GoHighLevel
=============================================================================

Uso:
    python sync-ghl.py                 # Sincroniza todos os leads pendentes
    python sync-ghl.py --limit 10      # Sincroniza até 10 leads
    python sync-ghl.py --tier A        # Sincroniza apenas tier A
    python sync-ghl.py --vertical medico  # Sincroniza apenas vertical médico
    python sync-ghl.py --dry-run       # Mostra o que seria sincronizado

Dependências:
    pip install supabase python-dotenv requests

Autor: MOTTIVME
Data: Janeiro 2026
"""

import os
import sys
import json
import logging
import argparse
import time
from datetime import datetime
from typing import Optional, Dict, List, Any
from pathlib import Path

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
    import requests
except ImportError as e:
    print(f"Erro: Dependência não instalada - {e}")
    print("Execute: pip install supabase python-dotenv requests")
    sys.exit(1)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path.home() / '.local/logs/sync-ghl.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv(Path.home() / '.env')
load_dotenv(Path.home() / 'AgenticOSKevsAcademy/.env')
load_dotenv(Path.home() / 'Projects/mottivme/socialfy-platform/.env.local')


class GoHighLevelClient:
    """Cliente para API do GoHighLevel"""

    BASE_URL = "https://services.leadconnectorhq.com"
    API_VERSION = "2021-07-28"

    def __init__(self):
        self.api_key = os.getenv('GHL_API_KEY') or os.getenv('GHL_AGENCY_API_KEY')
        if not self.api_key:
            # Usar API key documentada
            self.api_key = 'pit-3872ad13-41f7-4e76-a3ff-f2dee789f8d6'

        self.location_id = os.getenv('GHL_LOCATION_ID') or 'cd1uyzpJox6XPt4Vct8Y'

        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Version': self.API_VERSION
        }

        logger.info(f"GHL Client inicializado para location: {self.location_id}")

    def create_contact(self, lead_data: Dict) -> Optional[str]:
        """Cria contato no GHL e retorna o ID - adaptado para socialfy_leads"""
        url = f"{self.BASE_URL}/contacts/"

        # Mapear dados do lead (socialfy_leads) para formato GHL
        name = lead_data.get('name', '')
        contact = {
            'locationId': self.location_id,
            'firstName': self._extract_first_name(name),
            'lastName': self._extract_last_name(name),
            'name': name,
            'source': 'Big Data - Scraping Automatizado',
            'tags': self._generate_tags(lead_data)
        }

        # Adicionar email se disponível
        if lead_data.get('email'):
            contact['email'] = lead_data['email']

        # Adicionar telefone se disponível
        if lead_data.get('phone') or lead_data.get('whatsapp'):
            phone = lead_data.get('whatsapp') or lead_data.get('phone')
            # Formatar telefone brasileiro
            if phone and not phone.startswith('+'):
                phone = f"+55{phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '')}"
            if phone:
                contact['phone'] = phone

        # Adicionar localização (de source_data ou vertical_data)
        source_data = lead_data.get('source_data') or {}
        vertical_data = lead_data.get('vertical_data') or {}
        if source_data.get('cidade') or vertical_data.get('cidade'):
            contact['city'] = source_data.get('cidade') or vertical_data.get('cidade')
        if source_data.get('estado') or vertical_data.get('estado'):
            contact['state'] = source_data.get('estado') or vertical_data.get('estado')
        contact['country'] = 'BR'

        # Adicionar website (de custom_fields)
        custom_fields_data = lead_data.get('custom_fields') or {}
        if custom_fields_data.get('website'):
            contact['website'] = custom_fields_data['website']

        # Campos customizados para GHL
        custom_fields = []

        # Instagram handle
        if lead_data.get('instagram_handle'):
            custom_fields.append({
                'key': 'instagram',
                'field_value': lead_data['instagram_handle']
            })

        # Vertical como "especialidade"
        if lead_data.get('vertical'):
            custom_fields.append({
                'key': 'especialidade',
                'field_value': lead_data['vertical']
            })

        # Seguidores Instagram
        if lead_data.get('instagram_followers'):
            custom_fields.append({
                'key': 'instagram_followers',
                'field_value': str(lead_data['instagram_followers'])
            })

        # Score potencial
        if lead_data.get('score_potencial'):
            custom_fields.append({
                'key': 'score_potencial',
                'field_value': str(lead_data['score_potencial'])
            })

        # ICP Tier
        if lead_data.get('icp_tier'):
            custom_fields.append({
                'key': 'tier',
                'field_value': lead_data['icp_tier']
            })

        if custom_fields:
            contact['customFields'] = custom_fields

        try:
            response = requests.post(url, headers=self.headers, json=contact, timeout=30)

            if response.status_code in [200, 201]:
                data = response.json()
                contact_id = data.get('contact', {}).get('id')
                logger.info(f"Contato criado no GHL: {name} (ID: {contact_id})")
                return contact_id
            else:
                logger.error(f"Erro ao criar contato: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"Erro na requisição GHL: {e}")
            return None

    def update_contact(self, contact_id: str, data: Dict) -> bool:
        """Atualiza contato existente"""
        url = f"{self.BASE_URL}/contacts/{contact_id}"

        try:
            response = requests.put(url, headers=self.headers, json=data, timeout=30)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Erro ao atualizar contato: {e}")
            return False

    def find_contact_by_email(self, email: str) -> Optional[Dict]:
        """Busca contato por email"""
        url = f"{self.BASE_URL}/contacts/search"
        params = {
            'locationId': self.location_id,
            'query': email
        }

        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            if response.status_code == 200:
                data = response.json()
                contacts = data.get('contacts', [])
                for contact in contacts:
                    if contact.get('email', '').lower() == email.lower():
                        return contact
        except Exception as e:
            logger.error(f"Erro na busca: {e}")

        return None

    def add_to_pipeline(self, contact_id: str, pipeline_id: str, stage_id: str) -> bool:
        """Adiciona contato a um pipeline"""
        url = f"{self.BASE_URL}/opportunities"

        data = {
            'locationId': self.location_id,
            'contactId': contact_id,
            'pipelineId': pipeline_id,
            'pipelineStageId': stage_id,
            'name': 'Lead Big Data',
            'status': 'open'
        }

        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            return response.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Erro ao adicionar ao pipeline: {e}")
            return False

    def _extract_first_name(self, full_name: str) -> str:
        """Extrai primeiro nome"""
        parts = full_name.strip().split()
        # Remover títulos
        if parts and parts[0].lower() in ['dr.', 'dra.', 'dr', 'dra']:
            parts = parts[1:]
        return parts[0] if parts else full_name

    def _extract_last_name(self, full_name: str) -> str:
        """Extrai sobrenome"""
        parts = full_name.strip().split()
        # Remover títulos
        if parts and parts[0].lower() in ['dr.', 'dra.', 'dr', 'dra']:
            parts = parts[1:]
        return ' '.join(parts[1:]) if len(parts) > 1 else ''

    def _generate_tags(self, lead_data: Dict) -> List[str]:
        """Gera tags para o contato - adaptado para socialfy_leads"""
        tags = ['big-data', 'scraping-automatico', 'lead-frio']

        # Vertical (ex: medico, mentor, advogado)
        if lead_data.get('vertical'):
            tags.append(f"vertical-{lead_data['vertical'].lower()}")

        # ICP Tier
        if lead_data.get('icp_tier'):
            tags.append(f"tier-{lead_data['icp_tier'].lower()}")

        # Instagram
        if lead_data.get('instagram_handle'):
            tags.append('tem-instagram')

        followers = lead_data.get('instagram_followers') or 0
        if followers >= 10000:
            tags.append('influenciador')

        # Tags existentes do lead
        lead_tags = lead_data.get('tags') or []
        for tag in lead_tags:
            if tag not in tags:
                tags.append(tag)

        return tags


class SupabaseClient:
    """Cliente Supabase para buscar leads - usando socialfy_leads"""

    def __init__(self):
        self.url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')

        if not self.url or not self.key:
            raise ValueError("Credenciais Supabase não configuradas")

        self.client: Client = create_client(self.url, self.key)
        logger.info(f"Supabase conectado: {self.url[:50]}...")

    def get_leads_for_sync(self, limit: int = 50, tier: Optional[str] = None,
                           vertical: Optional[str] = None,
                           min_score: int = 50) -> List[Dict]:
        """Busca leads qualificados para sincronização - usando socialfy_leads"""

        query = self.client.table('socialfy_leads').select('*')

        # Filtros
        query = query.is_('ghl_contact_id', 'null')  # Não sincronizados
        query = query.in_('status', ['available', 'new', 'qualificado'])  # Status válidos

        # Score mínimo (se campo existir após migração)
        # query = query.gte('score_potencial', min_score)

        # Filtro por ICP Tier
        if tier:
            query = query.eq('icp_tier', tier.upper())

        # Filtro por vertical
        if vertical:
            query = query.eq('vertical', vertical.lower())

        # Ordenar por ICP score se disponível
        query = query.order('icp_score', desc=True)
        query = query.limit(limit * 2)  # Buscar mais para filtrar

        result = query.execute()

        # Filtrar leads com contato válido
        leads = []
        for lead in result.data:
            if lead.get('email') or lead.get('phone') or lead.get('whatsapp'):
                leads.append(lead)
                if len(leads) >= limit:
                    break

        return leads

    def mark_as_synced(self, lead_id: str, ghl_contact_id: str) -> bool:
        """Marca lead como sincronizado"""
        try:
            self.client.table('socialfy_leads').update({
                'ghl_contact_id': ghl_contact_id,
                'location_id': os.getenv('GHL_LOCATION_ID', 'cd1uyzpJox6XPt4Vct8Y'),
                'updated_at': datetime.now().isoformat()
            }).eq('id', lead_id).execute()
            return True
        except Exception as e:
            logger.error(f"Erro ao marcar como sincronizado: {e}")
            return False


class GHLSyncPipeline:
    """Pipeline de sincronização Supabase → GHL"""

    def __init__(self):
        self.supabase = SupabaseClient()
        self.ghl = GoHighLevelClient()

    def sync_leads(self, limit: int = 50, tier: Optional[str] = None,
                   vertical: Optional[str] = None, dry_run: bool = False) -> Dict:
        """Sincroniza leads para o GHL"""

        stats = {'total': 0, 'synced': 0, 'skipped': 0, 'errors': 0}

        leads = self.supabase.get_leads_for_sync(limit=limit, tier=tier, vertical=vertical)
        stats['total'] = len(leads)

        logger.info(f"Encontrados {len(leads)} leads para sincronização")

        for lead in leads:
            try:
                name = lead.get('name', 'Sem nome')
                instagram = lead.get('instagram_handle', 'N/A')
                logger.info(f"Processando: {name} ({instagram})")

                if dry_run:
                    logger.info(f"  [DRY-RUN] Seria sincronizado - Tier: {lead.get('icp_tier')}, Vertical: {lead.get('vertical')}")
                    stats['synced'] += 1
                    continue

                # Verificar se já existe por email
                if lead.get('email'):
                    existing = self.ghl.find_contact_by_email(lead['email'])
                    if existing:
                        logger.info(f"  Contato já existe: {existing.get('id')}")
                        self.supabase.mark_as_synced(lead['id'], existing['id'])
                        stats['skipped'] += 1
                        continue

                # Criar contato
                contact_id = self.ghl.create_contact(lead)

                if contact_id:
                    self.supabase.mark_as_synced(lead['id'], contact_id)
                    stats['synced'] += 1
                    logger.info(f"  ✓ Sincronizado: {contact_id}")
                else:
                    stats['errors'] += 1
                    logger.warning(f"  ✗ Falha na sincronização")

                # Rate limiting
                time.sleep(1)

            except Exception as e:
                logger.error(f"Erro ao processar lead {lead.get('id')}: {e}")
                stats['errors'] += 1

        return stats


def main():
    parser = argparse.ArgumentParser(description='MOTTIVME - Sync GHL (socialfy_leads)')
    parser.add_argument('--limit', '-l', type=int, default=50, help='Limite de leads')
    parser.add_argument('--tier', '-t', choices=['A', 'B', 'C', 'D'], help='Filtrar por ICP tier')
    parser.add_argument('--vertical', '-v', choices=['medico', 'mentor', 'advogado', 'dentista', 'nutricionista'],
                       help='Filtrar por vertical')
    parser.add_argument('--dry-run', action='store_true', help='Não executar, apenas mostrar')

    args = parser.parse_args()

    try:
        pipeline = GHLSyncPipeline()
        stats = pipeline.sync_leads(
            limit=args.limit,
            tier=args.tier,
            vertical=args.vertical,
            dry_run=args.dry_run
        )

        print("\n" + "="*50)
        print("RESULTADO DA SINCRONIZAÇÃO")
        print("="*50)
        print(f"Total de leads: {stats['total']}")
        print(f"Sincronizados: {stats['synced']}")
        print(f"Ignorados (já existem): {stats['skipped']}")
        print(f"Erros: {stats['errors']}")
        if args.vertical:
            print(f"Vertical: {args.vertical}")
        if args.tier:
            print(f"Tier: {args.tier}")
        print("="*50)

    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
