#!/usr/bin/env python3
"""
=============================================================================
MOTTIVME - Scraper Universal de Leads via Instagram
Usa a tabela socialfy_leads para TODOS os segmentos (médico, mentor, etc.)
=============================================================================

Uso:
    python scraper-leads.py --hashtag dermato --vertical medico --limit 50
    python scraper-leads.py --hashtag mentoria --vertical mentor --limit 30
    python scraper-leads.py --profile @clinicaexemplo --vertical medico

Dependências:
    pip install instaloader supabase python-dotenv requests

Autor: MOTTIVME
Data: Janeiro 2026
"""

import os
import sys
import json
import re
import time
import logging
import argparse
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, asdict
from pathlib import Path

# Dependências externas
try:
    import instaloader
    from supabase import create_client, Client
    from dotenv import load_dotenv
    import requests
except ImportError as e:
    print(f"Erro: Dependência não instalada - {e}")
    print("Execute: pip install instaloader supabase python-dotenv requests")
    sys.exit(1)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path.home() / '.local/logs/scraper-leads.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv(Path.home() / '.env')
load_dotenv(Path.home() / 'AgenticOSKevsAcademy/.env')


# =============================================================================
# CONFIGURAÇÃO DE VERTICAIS
# =============================================================================

VERTICALS_CONFIG = {
    'medico': {
        'keywords': ['dr.', 'dra.', 'médico', 'médica', 'crm', 'medicina', 'clínica'],
        'hashtags': ['dermatologista', 'cirurgiaplastica', 'nutrologia', 'endocrinologista'],
        'sub_types': {
            'dermatologia': ['dermato', 'dermatologista', 'pele', 'skincare'],
            'cirurgia_plastica': ['cirurgião plástico', 'plastica', 'estética'],
            'nutrologia': ['nutrólogo', 'nutrologia', 'emagrecimento'],
            'endocrinologia': ['endocrinologista', 'hormônios', 'tireoide'],
            'cardiologia': ['cardiologista', 'coração'],
            'medicina_estetica': ['medicina estética', 'harmonização', 'botox'],
        }
    },
    'mentor': {
        'keywords': ['mentor', 'mentoria', 'coach', 'coaching', 'transformação'],
        'hashtags': ['mentoria', 'mentorempreendedor', 'mentoriaempresarial'],
        'sub_types': {
            'negocios': ['mentor de negócios', 'empresarial', 'empreendedor'],
            'vendas': ['mentor de vendas', 'comercial'],
            'mindset': ['mindset', 'desenvolvimento pessoal'],
            'carreira': ['carreira', 'profissional'],
        }
    },
    'advogado': {
        'keywords': ['advogado', 'advogada', 'oab', 'direito', 'jurídico'],
        'hashtags': ['advogado', 'advocacia', 'direitoempresarial'],
        'sub_types': {
            'empresarial': ['direito empresarial', 'societário'],
            'trabalhista': ['trabalhista', 'clt'],
            'tributario': ['tributário', 'impostos'],
            'digital': ['direito digital', 'lgpd'],
        }
    },
    'dentista': {
        'keywords': ['dentista', 'odontólogo', 'cro', 'odontologia'],
        'hashtags': ['dentista', 'odontologia', 'ortodontia'],
        'sub_types': {
            'estetica': ['odontologia estética', 'lentes'],
            'ortodontia': ['ortodontista', 'aparelho'],
            'implante': ['implante', 'implantodontia'],
        }
    },
    'nutricionista': {
        'keywords': ['nutricionista', 'crn', 'nutrição'],
        'hashtags': ['nutricionista', 'nutricao', 'alimentacaosaudavel'],
        'sub_types': {
            'esportiva': ['nutrição esportiva', 'atleta'],
            'clinica': ['nutrição clínica', 'emagrecimento'],
            'funcional': ['nutrição funcional', 'integrativa'],
        }
    }
}


# =============================================================================
# SUPABASE CLIENT
# =============================================================================

class SupabaseClient:
    """Cliente para operações no Supabase - usando socialfy_leads"""

    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

        if not self.url or not self.key:
            logger.error("Credenciais Supabase não configuradas")
            raise ValueError("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")

        self.client: Client = create_client(self.url, self.key)
        logger.info(f"Conectado ao Supabase: {self.url[:50]}...")

    def lead_exists(self, instagram_handle: str) -> Optional[Dict]:
        """Verifica se lead já existe pelo Instagram handle"""
        handle = instagram_handle.lower().replace('@', '')
        result = self.client.table('socialfy_leads').select('id, score_potencial').eq(
            'instagram_handle', f'@{handle}'
        ).execute()
        return result.data[0] if result.data else None

    def insert_lead(self, lead_data: Dict) -> Optional[str]:
        """Insere novo lead na tabela socialfy_leads"""
        try:
            # Normalizar instagram_handle
            if 'instagram_handle' in lead_data and lead_data['instagram_handle']:
                handle = lead_data['instagram_handle'].lower().replace('@', '')
                lead_data['instagram_handle'] = f'@{handle}'

            # Adicionar organization_id padrão (obrigatório)
            if 'organization_id' not in lead_data:
                lead_data['organization_id'] = '11111111-1111-1111-1111-111111111111'

            # Adicionar timestamps
            lead_data['created_at'] = datetime.now().isoformat()
            lead_data['updated_at'] = datetime.now().isoformat()
            lead_data['scraped_at'] = datetime.now().isoformat()

            # Remover campos None
            lead_data = {k: v for k, v in lead_data.items() if v is not None}

            result = self.client.table('socialfy_leads').insert(lead_data).execute()
            if result.data:
                lead_id = result.data[0]['id']
                logger.info(f"Lead inserido: {lead_data.get('instagram_handle')} (ID: {lead_id})")
                return lead_id
        except Exception as e:
            logger.error(f"Erro ao inserir lead: {e}")
        return None

    def update_lead(self, lead_id: str, data: Dict) -> bool:
        """Atualiza lead existente"""
        try:
            data['updated_at'] = datetime.now().isoformat()
            self.client.table('socialfy_leads').update(data).eq('id', lead_id).execute()
            return True
        except Exception as e:
            logger.error(f"Erro ao atualizar lead {lead_id}: {e}")
            return False


# =============================================================================
# INSTAGRAM SCRAPER
# =============================================================================

class InstagramScraper:
    """Scraper de perfis do Instagram para qualquer vertical"""

    def __init__(self, username: Optional[str] = None, password: Optional[str] = None):
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            post_metadata_txt_pattern='',
            max_connection_attempts=3
        )

        # Conta usada para scraping (conta secundária para não arriscar a principal)
        scraping_username = os.getenv('INSTAGRAM_SCRAPING_USERNAME', 'eumdaniels')

        # 1. Tentar carregar sessão salva do instaloader (mais seguro)
        session_file = Path.home() / '.config' / 'instaloader' / f'session-{scraping_username}'
        if session_file.exists():
            try:
                self.loader.load_session_from_file(scraping_username, str(session_file))
                logger.info(f"Sessão carregada de arquivo para: {scraping_username}")
            except Exception as e:
                logger.warning(f"Erro ao carregar sessão de arquivo: {e}")

        # 2. Fallback: session_id via cookie
        elif os.getenv('INSTAGRAM_SESSION_ID'):
            session_id = os.getenv('INSTAGRAM_SESSION_ID')
            try:
                import urllib.parse
                session_id = urllib.parse.unquote(session_id)

                session = requests.Session()
                session.cookies.set('sessionid', session_id, domain='.instagram.com')
                session.cookies.set('ds_user_id', session_id.split(':')[0], domain='.instagram.com')

                self.loader.context._session.cookies.update(session.cookies)
                self.loader.context.username = scraping_username
                logger.info(f"Sessão carregada via session_id para: {scraping_username}")
            except Exception as e:
                logger.warning(f"Erro ao carregar session_id: {e}")

        # 3. Fallback: login com usuário/senha
        elif username and password:
            try:
                self.loader.login(username, password)
                logger.info(f"Logado como: {username}")
            except Exception as e:
                logger.warning(f"Não foi possível fazer login: {e}")
        else:
            logger.warning("Nenhuma autenticação configurada - algumas funcionalidades podem não funcionar")

    def detect_vertical(self, bio: str) -> Optional[str]:
        """Detecta o vertical do perfil baseado no bio"""
        if not bio:
            return None

        bio_lower = bio.lower()

        for vertical, config in VERTICALS_CONFIG.items():
            for keyword in config['keywords']:
                if keyword.lower() in bio_lower:
                    return vertical

        return None

    def detect_sub_type(self, bio: str, vertical: str) -> Optional[str]:
        """Detecta o sub-tipo dentro do vertical"""
        if not bio or not vertical or vertical not in VERTICALS_CONFIG:
            return None

        bio_lower = bio.lower()
        config = VERTICALS_CONFIG[vertical]

        for sub_type, keywords in config.get('sub_types', {}).items():
            for keyword in keywords:
                if keyword.lower() in bio_lower:
                    return sub_type

        return None

    def is_valid_profile(self, bio: str, vertical: str) -> bool:
        """Verifica se o perfil é válido para o vertical especificado"""
        if not bio:
            return False

        if vertical not in VERTICALS_CONFIG:
            return True  # Se não tem config, aceita qualquer um

        bio_lower = bio.lower()
        config = VERTICALS_CONFIG[vertical]

        for keyword in config['keywords']:
            if keyword.lower() in bio_lower:
                return True

        return False

    def extract_contact_info(self, bio: str, external_url: str = None) -> Dict:
        """Extrai informações de contato do bio"""
        info = {}

        if bio:
            # Email
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', bio)
            if email_match:
                info['email'] = email_match.group()

            # Telefone
            phone_match = re.search(r'\(?(\d{2})\)?[\s\-]?(\d{4,5})[\s\-]?(\d{4})', bio)
            if phone_match:
                phone = ''.join(phone_match.groups())
                if len(phone) >= 10:
                    info['phone'] = f"+55{phone}"
                    if 'whatsapp' in bio.lower() or 'whats' in bio.lower():
                        info['whatsapp'] = f"+55{phone}"

        if external_url:
            # Adicionar ao custom_fields
            info['custom_fields'] = {'website': external_url}

        return info

    def extract_vertical_data(self, bio: str, vertical: str) -> Dict:
        """Extrai dados específicos do vertical"""
        data = {}

        if vertical == 'medico':
            # Extrair CRM
            crm_match = re.search(r'CRM[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if crm_match:
                data['crm_estado'] = crm_match.group(1).upper()
                data['crm_numero'] = crm_match.group(2)

        elif vertical == 'advogado':
            # Extrair OAB
            oab_match = re.search(r'OAB[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if oab_match:
                data['oab_estado'] = oab_match.group(1).upper()
                data['oab_numero'] = oab_match.group(2)

        elif vertical == 'dentista':
            # Extrair CRO
            cro_match = re.search(r'CRO[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if cro_match:
                data['cro_estado'] = cro_match.group(1).upper()
                data['cro_numero'] = cro_match.group(2)

        elif vertical == 'nutricionista':
            # Extrair CRN
            crn_match = re.search(r'CRN[\s\-/]*(\d+)[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if crn_match:
                data['crn_regiao'] = crn_match.group(1)
                data['crn_numero'] = crn_match.group(2)

        return data

    def profile_to_lead(self, profile: instaloader.Profile, vertical: str, source_info: Dict = None) -> Dict:
        """Converte profile do Instagram para formato socialfy_leads"""
        bio = profile.biography or ''

        # Extrair informações
        contact_info = self.extract_contact_info(bio, profile.external_url)
        vertical_data = self.extract_vertical_data(bio, vertical)
        sub_type = self.detect_sub_type(bio, vertical)

        # Determinar título
        title = None
        if re.search(r'\bDra\.?\b', profile.full_name, re.IGNORECASE) or re.search(r'\bDra\.?\b', bio, re.IGNORECASE):
            title = 'Dra.'
        elif re.search(r'\bDr\.?\b', profile.full_name, re.IGNORECASE) or re.search(r'\bDr\.?\b', bio, re.IGNORECASE):
            title = 'Dr.'

        # Gerar tags baseado no vertical
        tags = [vertical]
        if sub_type:
            tags.append(sub_type)
        if profile.is_verified:
            tags.append('verificado')
        if profile.followers >= 10000:
            tags.append('influenciador')

        # Construir lead
        lead = {
            'name': profile.full_name,
            'title': title,
            'instagram_handle': f'@{profile.username}',
            'instagram_url': f'https://instagram.com/{profile.username}',
            'instagram_followers': profile.followers,
            'instagram_following': profile.followees,
            'instagram_posts': profile.mediacount,
            'instagram_bio': bio[:1000] if bio else None,
            'instagram_is_verified': profile.is_verified,
            'instagram_is_business': profile.is_business_account,

            'vertical': vertical,
            'vertical_data': vertical_data if vertical_data else None,

            'email': contact_info.get('email'),
            'phone': contact_info.get('phone'),
            'whatsapp': contact_info.get('whatsapp'),

            'source': 'instagram_scraping',
            'source_data': source_info or {},
            'scrape_source': source_info.get('type', 'hashtag') if source_info else 'manual',

            'tags': tags,
            'status': 'available',
            'icp_tier': 'A' if profile.followers >= 10000 else 'B' if profile.followers >= 1000 else 'C',

            # Campos para compatibilidade com Socialfy
            'channels': ['instagram'],
            'custom_fields': contact_info.get('custom_fields', {}),
        }

        return lead

    def scrape_hashtag(self, hashtag: str, vertical: str, limit: int = 50) -> List[Dict]:
        """Scrape perfis a partir de uma hashtag"""
        leads = []
        processed = set()

        hashtag = hashtag.replace('#', '').lower()
        logger.info(f"Scraping hashtag: #{hashtag} (vertical: {vertical}, limit: {limit})")

        try:
            posts = instaloader.Hashtag.from_name(self.loader.context, hashtag).get_posts()

            count = 0
            for post in posts:
                if count >= limit * 3:
                    break

                try:
                    username = post.owner_username

                    if username in processed:
                        continue
                    processed.add(username)

                    # Carregar perfil completo
                    profile = instaloader.Profile.from_username(self.loader.context, username)

                    if profile.is_private:
                        continue

                    # Verificar se é válido para o vertical
                    if not self.is_valid_profile(profile.biography, vertical):
                        continue

                    # Converter para lead
                    lead = self.profile_to_lead(profile, vertical, {
                        'type': 'hashtag',
                        'hashtag': hashtag,
                        'post_shortcode': post.shortcode
                    })
                    leads.append(lead)

                    logger.info(f"Lead encontrado: @{username} ({lead.get('title', '')} - {vertical})")

                    if len(leads) >= limit:
                        break

                    time.sleep(2)

                except Exception as e:
                    logger.warning(f"Erro ao processar @{username}: {e}")
                    continue

                count += 1

        except Exception as e:
            logger.error(f"Erro no scrape da hashtag #{hashtag}: {e}")

        logger.info(f"Hashtag #{hashtag}: {len(leads)} leads encontrados")
        return leads

    def scrape_profile(self, username: str, vertical: str) -> Optional[Dict]:
        """Scrape um perfil específico"""
        username = username.replace('@', '').lower()
        logger.info(f"Scraping perfil: @{username}")

        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)

            if profile.is_private:
                logger.warning(f"Perfil @{username} é privado")
                return None

            lead = self.profile_to_lead(profile, vertical, {'type': 'profile_direct'})
            return lead

        except Exception as e:
            logger.error(f"Erro ao carregar @{username}: {e}")
            return None

    def scrape_followers(self, target_username: str, vertical: str, limit: int = 50) -> List[Dict]:
        """Scrape seguidores de uma conta específica

        Essa é a forma mais segura de descobrir leads porque:
        1. Instagram não bloqueia acesso a seguidores como faz com hashtags
        2. Seguidores de contas de nicho (ex: @aceleradormedico) são leads qualificados
        3. Menor risco de bloqueio da conta

        Args:
            target_username: Conta alvo para pegar seguidores (ex: aceleradormedico)
            vertical: Vertical do lead (medico, mentor, etc)
            limit: Quantidade máxima de leads
        """
        leads = []
        processed = set()

        target_username = target_username.replace('@', '').lower()
        logger.info(f"Scraping seguidores de @{target_username} (vertical: {vertical}, limit: {limit})")

        try:
            # Carregar perfil alvo
            target_profile = instaloader.Profile.from_username(self.loader.context, target_username)

            if target_profile.is_private:
                logger.error(f"Perfil @{target_username} é privado - não é possível ver seguidores")
                return leads

            logger.info(f"@{target_username} tem {target_profile.followers} seguidores")

            # Iterar pelos seguidores
            followers_count = 0
            for follower in target_profile.get_followers():
                if len(leads) >= limit:
                    break

                if followers_count >= limit * 5:  # Processa até 5x o limite para filtrar
                    break

                followers_count += 1

                try:
                    username = follower.username

                    if username in processed:
                        continue
                    processed.add(username)

                    # Pular perfis privados
                    if follower.is_private:
                        logger.debug(f"@{username} é privado, pulando")
                        continue

                    # Verificar se é válido para o vertical
                    bio = follower.biography or ''
                    if not self.is_valid_profile(bio, vertical):
                        continue

                    # Converter para lead
                    lead = self.profile_to_lead(follower, vertical, {
                        'type': 'followers',
                        'source_account': target_username,
                        'source_followers': target_profile.followers
                    })

                    # Adicionar campo is_private
                    lead['instagram_is_private'] = follower.is_private

                    leads.append(lead)

                    logger.info(f"Lead encontrado: @{username} ({lead.get('title', '')} - {follower.followers} seguidores)")

                    # Rate limiting para evitar bloqueio
                    time.sleep(1.5)

                except instaloader.exceptions.QueryReturnedNotFoundException:
                    logger.warning(f"Perfil não encontrado, pulando")
                    continue
                except Exception as e:
                    logger.warning(f"Erro ao processar seguidor: {e}")
                    continue

        except instaloader.exceptions.LoginRequiredException:
            logger.error("Login necessário para ver seguidores. Verifique a sessão do Instagram.")
        except Exception as e:
            logger.error(f"Erro ao buscar seguidores de @{target_username}: {e}")

        logger.info(f"Seguidores de @{target_username}: {len(leads)} leads encontrados")
        return leads


# =============================================================================
# PIPELINE
# =============================================================================

class ScrapingPipeline:
    """Pipeline de scraping para qualquer vertical"""

    def __init__(self):
        self.supabase = SupabaseClient()
        self.scraper = InstagramScraper(
            username=os.getenv('INSTAGRAM_USERNAME'),
            password=os.getenv('INSTAGRAM_PASSWORD')
        )

    def run_hashtag_scrape(self, hashtag: str, vertical: str, limit: int = 50) -> Dict:
        """Executa scrape de hashtag e salva no Supabase"""
        stats = {'total': 0, 'novos': 0, 'atualizados': 0, 'erros': 0}

        leads = self.scraper.scrape_hashtag(hashtag, vertical, limit)
        stats['total'] = len(leads)

        for lead in leads:
            try:
                existing = self.supabase.lead_exists(lead['instagram_handle'])

                if existing:
                    # Atualizar existente
                    self.supabase.update_lead(existing['id'], {
                        'instagram_followers': lead.get('instagram_followers'),
                        'instagram_posts': lead.get('instagram_posts'),
                        'scraped_at': datetime.now().isoformat()
                    })
                    stats['atualizados'] += 1
                else:
                    # Inserir novo
                    if self.supabase.insert_lead(lead):
                        stats['novos'] += 1
                    else:
                        stats['erros'] += 1
            except Exception as e:
                logger.error(f"Erro ao salvar lead: {e}")
                stats['erros'] += 1

        return stats

    def run_profile_scrape(self, username: str, vertical: str) -> Dict:
        """Scrape de perfil único"""
        lead = self.scraper.scrape_profile(username, vertical)

        if not lead:
            return {'total': 0, 'novos': 0, 'erros': 1}

        existing = self.supabase.lead_exists(lead['instagram_handle'])

        if existing:
            self.supabase.update_lead(existing['id'], lead)
            return {'total': 1, 'novos': 0, 'atualizados': 1, 'erros': 0}
        else:
            if self.supabase.insert_lead(lead):
                return {'total': 1, 'novos': 1, 'atualizados': 0, 'erros': 0}
            else:
                return {'total': 1, 'novos': 0, 'atualizados': 0, 'erros': 1}

    def run_followers_scrape(self, target_accounts: List[str], vertical: str, limit: int = 50) -> Dict:
        """Scrape seguidores de contas específicas

        Args:
            target_accounts: Lista de contas para pegar seguidores (ex: ['aceleradormedico', 'grupoacelerador'])
            vertical: Vertical do lead
            limit: Limite de leads por conta
        """
        stats = {'total': 0, 'novos': 0, 'atualizados': 0, 'erros': 0, 'contas_processadas': 0}

        for account in target_accounts:
            account = account.strip().replace('@', '').lower()
            if not account:
                continue

            logger.info(f"\n{'='*50}")
            logger.info(f"Processando seguidores de @{account}")
            logger.info(f"{'='*50}")

            leads = self.scraper.scrape_followers(account, vertical, limit)
            stats['contas_processadas'] += 1

            for lead in leads:
                try:
                    existing = self.supabase.lead_exists(lead['instagram_handle'])

                    if existing:
                        self.supabase.update_lead(existing['id'], {
                            'instagram_followers': lead.get('instagram_followers'),
                            'instagram_posts': lead.get('instagram_posts'),
                            'instagram_bio': lead.get('instagram_bio'),
                            'scraped_at': datetime.now().isoformat()
                        })
                        stats['atualizados'] += 1
                    else:
                        if self.supabase.insert_lead(lead):
                            stats['novos'] += 1
                        else:
                            stats['erros'] += 1

                    stats['total'] += 1

                except Exception as e:
                    logger.error(f"Erro ao salvar lead: {e}")
                    stats['erros'] += 1

            # Pausa entre contas para evitar rate limit
            if account != target_accounts[-1]:
                logger.info("Aguardando 30s antes da próxima conta...")
                time.sleep(30)

        return stats

    def run_file_scrape(self, file_path: str, vertical: str, limit: int = 0, delay: float = 2.0) -> Dict:
        """Scrape de lista de perfis de um arquivo

        Formatos suportados:
        - .txt: um username por linha
        - .csv: coluna 'username' ou 'instagram' ou primeira coluna
        - .json: array de strings ou objetos com 'username'/'instagram'
        """
        stats = {'total': 0, 'novos': 0, 'atualizados': 0, 'erros': 0, 'pulados': 0}

        # Ler usernames do arquivo
        usernames = self._read_usernames_from_file(file_path)

        if not usernames:
            logger.error(f"Nenhum username encontrado em {file_path}")
            return stats

        # Aplicar limite se especificado
        if limit > 0:
            usernames = usernames[:limit]

        logger.info(f"Processando {len(usernames)} perfis de {file_path}")

        for i, username in enumerate(usernames, 1):
            try:
                # Limpar username
                username = username.strip().replace('@', '').lower()
                if not username or username.startswith('#'):
                    continue

                logger.info(f"[{i}/{len(usernames)}] Processando @{username}")

                # Verificar se já existe
                existing = self.supabase.lead_exists(f'@{username}')
                if existing:
                    logger.info(f"  → Já existe, pulando")
                    stats['pulados'] += 1
                    continue

                # Scrape do perfil
                lead = self.scraper.scrape_profile(username, vertical)

                if not lead:
                    stats['erros'] += 1
                    continue

                stats['total'] += 1

                # Inserir
                if self.supabase.insert_lead(lead):
                    stats['novos'] += 1
                    logger.info(f"  ✓ Lead inserido")
                else:
                    stats['erros'] += 1

                # Rate limiting
                time.sleep(delay)

            except KeyboardInterrupt:
                logger.info("Interrompido pelo usuário")
                break
            except Exception as e:
                logger.error(f"Erro ao processar @{username}: {e}")
                stats['erros'] += 1

        return stats

    def _read_usernames_from_file(self, file_path: str) -> List[str]:
        """Lê usernames de arquivo .txt, .csv ou .json"""
        import csv

        path = Path(file_path)
        if not path.exists():
            logger.error(f"Arquivo não encontrado: {file_path}")
            return []

        usernames = []

        if path.suffix.lower() == '.txt':
            # Arquivo texto: um username por linha
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        usernames.append(line)

        elif path.suffix.lower() == '.csv':
            # CSV: procurar coluna username/instagram ou usar primeira
            with open(path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Tentar diferentes nomes de coluna
                    username = (row.get('username') or row.get('instagram') or
                               row.get('instagram_handle') or row.get('user') or
                               list(row.values())[0] if row else None)
                    if username:
                        usernames.append(username)

        elif path.suffix.lower() == '.json':
            # JSON: array de strings ou objetos
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, str):
                            usernames.append(item)
                        elif isinstance(item, dict):
                            username = (item.get('username') or item.get('instagram') or
                                       item.get('instagram_handle'))
                            if username:
                                usernames.append(username)

        else:
            logger.error(f"Formato não suportado: {path.suffix}")

        logger.info(f"Carregados {len(usernames)} usernames de {file_path}")
        return usernames


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='MOTTIVME - Scraper Universal de Leads')
    parser.add_argument('--hashtag', '-t', help='Hashtag para scrape (ex: dermato)')
    parser.add_argument('--profile', '-p', help='Perfil para scrape (ex: @clinica)')
    parser.add_argument('--followers', '-F', nargs='+', help='Contas para buscar seguidores (ex: aceleradormedico grupoacelerador)')
    parser.add_argument('--file', '-f', help='Arquivo com lista de perfis (.txt, .csv, .json)')
    parser.add_argument('--vertical', '-v', required=True,
                       choices=list(VERTICALS_CONFIG.keys()),
                       help='Vertical do lead (medico, mentor, advogado, etc.)')
    parser.add_argument('--limit', '-l', type=int, default=50, help='Limite de leads (por conta no modo followers)')
    parser.add_argument('--delay', '-d', type=float, default=2.0, help='Delay entre requisições (segundos)')

    args = parser.parse_args()

    if not args.hashtag and not args.profile and not args.file and not args.followers:
        parser.print_help()
        print("\n" + "="*60)
        print("EXEMPLOS DE USO")
        print("="*60)
        print("\n🎯 MODO SEGUIDORES (RECOMENDADO - menos risco de bloqueio):")
        print("  python scraper-leads.py --followers aceleradormedico grupoacelerador --vertical medico --limit 30")
        print("  python scraper-leads.py -F aceleradormedico -v medico -l 50")
        print("\n📌 OUTROS MODOS:")
        print("  python scraper-leads.py --hashtag dermato --vertical medico --limit 30")
        print("  python scraper-leads.py --profile @clinicaexemplo --vertical medico")
        print("  python scraper-leads.py --file perfis.txt --vertical medico --limit 100")
        print("\n📁 Formatos de arquivo suportados:")
        print("  .txt - um username por linha")
        print("  .csv - coluna 'username' ou 'instagram'")
        print("  .json - array de strings ou objetos")
        print("\n⚠️  ATENÇÃO: O modo --hashtag está bloqueado pelo Instagram.")
        print("    Use --followers para buscar leads de forma segura!")
        sys.exit(1)

    try:
        pipeline = ScrapingPipeline()

        if args.followers:
            stats = pipeline.run_followers_scrape(args.followers, args.vertical, args.limit)
        elif args.file:
            stats = pipeline.run_file_scrape(args.file, args.vertical, args.limit, args.delay)
        elif args.hashtag:
            print("\n⚠️  AVISO: O modo hashtag está bloqueado pelo Instagram.")
            print("    Recomendamos usar --followers em vez de --hashtag")
            print("    Tentando mesmo assim...\n")
            stats = pipeline.run_hashtag_scrape(args.hashtag, args.vertical, args.limit)
        else:
            stats = pipeline.run_profile_scrape(args.profile, args.vertical)

        print("\n" + "="*50)
        print(f"RESULTADO DO SCRAPING ({args.vertical.upper()})")
        print("="*50)
        print(f"Total encontrados: {stats['total']}")
        print(f"Novos leads: {stats['novos']}")
        print(f"Atualizados: {stats.get('atualizados', 0)}")
        print(f"Pulados (já existem): {stats.get('pulados', 0)}")
        if 'contas_processadas' in stats:
            print(f"Contas processadas: {stats['contas_processadas']}")
        print(f"Erros: {stats['erros']}")
        print("="*50)

    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
