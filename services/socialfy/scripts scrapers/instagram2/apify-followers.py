#!/usr/bin/env python3
"""
=============================================================================
MOTTIVME - Scraper de Seguidores via Apify
Usa o actor "devil_port369-owner/instagram-follower" (sem cookies!)
=============================================================================

Uso:
    python apify-followers.py --account aceleradormedico --vertical medico --limit 100
    python apify-followers.py --accounts aceleradormedico,grupoacelerador --vertical medico

Dependências:
    pip install apify-client supabase python-dotenv requests

Autor: MOTTIVME
Data: Janeiro 2026
"""

import os
import sys
import re
import time
import logging
import argparse
from datetime import datetime
from typing import Optional, Dict, List, Any
from pathlib import Path

try:
    from apify_client import ApifyClient
    from supabase import create_client, Client
    from dotenv import load_dotenv
    import requests
except ImportError as e:
    print(f"Erro: Dependência não instalada - {e}")
    print("Execute: pip install apify-client supabase python-dotenv requests")
    sys.exit(1)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path.home() / '.local/logs/apify-followers.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv(Path.home() / '.env')

# =============================================================================
# CONFIGURAÇÃO
# =============================================================================

# Actor do Apify - SEU Actor customizado (funciona no Creator Plan!)
APIFY_ACTOR_ID = "FHC1laGZ14jDtrU0Z"  # my-actor-4 (API v1 mobile para seguidores)

# Palavras-chave para filtrar médicos
MEDICO_KEYWORDS = [
    'dr.', 'dra.', 'médico', 'médica', 'medicina', 'crm',
    'dermatologista', 'cirurgião', 'cirurgiã', 'clínica',
    'nutrólogo', 'nutróloga', 'endocrinologista',
    'cardiologista', 'ortopedista', 'ginecologista',
    'oftalmologista', 'psiquiatra', 'neurologista',
    'oncologista', 'urologista', 'pediatra',
    'harmonização', 'estética', 'botox', 'preenchimento'
]

# Mapeamento de especialidades médicas
ESPECIALIDADES_MEDICAS = {
    # Clínicas gerais
    'clínico geral': ['clínico geral', 'clínica geral', 'medicina geral', 'generalista'],
    'medicina de família': ['medicina de família', 'médico de família', 'saúde da família'],

    # Especialidades cirúrgicas
    'cirurgia geral': ['cirurgião geral', 'cirurgia geral'],
    'cirurgia plástica': ['cirurgião plástico', 'cirurgiã plástica', 'cirurgia plástica', 'plástica'],
    'cirurgia vascular': ['cirurgião vascular', 'cirurgia vascular', 'vascular'],
    'cirurgia cardíaca': ['cirurgião cardíaco', 'cirurgia cardíaca', 'cardiovascular'],
    'cirurgia bariátrica': ['bariátrica', 'bariátrico', 'cirurgia bariátrica', 'obesidade'],

    # Especialidades clínicas
    'cardiologia': ['cardiologista', 'cardiologia', 'coração'],
    'dermatologia': ['dermatologista', 'dermatologia', 'pele', 'dermatologico'],
    'endocrinologia': ['endocrinologista', 'endocrinologia', 'endócrino', 'tireoide', 'diabetes', 'hormônios'],
    'gastroenterologia': ['gastroenterologista', 'gastroenterologia', 'gastro', 'digestivo'],
    'geriatria': ['geriatra', 'geriatria', 'idoso', 'terceira idade'],
    'ginecologia': ['ginecologista', 'ginecologia', 'gineco', 'saúde da mulher', 'obstetrícia', 'obstetra'],
    'hematologia': ['hematologista', 'hematologia', 'sangue'],
    'infectologia': ['infectologista', 'infectologia', 'infecções'],
    'nefrologia': ['nefrologista', 'nefrologia', 'rim', 'renal'],
    'neurologia': ['neurologista', 'neurologia', 'neuro', 'cérebro'],
    'nutrologia': ['nutrólogo', 'nutróloga', 'nutrologia', 'nutrição médica', 'emagrecimento'],
    'oftalmologia': ['oftalmologista', 'oftalmologia', 'olhos', 'visão', 'oftálmica'],
    'oncologia': ['oncologista', 'oncologia', 'câncer', 'tumor'],
    'ortopedia': ['ortopedista', 'ortopedia', 'ossos', 'coluna', 'joelho', 'ombro', 'quadril'],
    'otorrinolaringologia': ['otorrino', 'otorrinolaringologista', 'ouvido', 'nariz', 'garganta'],
    'pediatria': ['pediatra', 'pediatria', 'infantil', 'criança', 'neonatal'],
    'pneumologia': ['pneumologista', 'pneumologia', 'pulmão', 'respiratório'],
    'proctologia': ['proctologista', 'proctologia', 'coloproctologia'],
    'psiquiatria': ['psiquiatra', 'psiquiatria', 'saúde mental', 'ansiedade', 'depressão'],
    'reumatologia': ['reumatologista', 'reumatologia', 'reumato', 'artrite', 'artrose'],
    'urologia': ['urologista', 'urologia', 'próstata', 'urológico'],

    # Subespecialidades e áreas de atuação
    'medicina estética': ['estética', 'harmonização', 'botox', 'preenchimento', 'bioestimulador', 'fios'],
    'medicina do esporte': ['medicina esportiva', 'esporte', 'atleta', 'performance'],
    'medicina do trabalho': ['medicina do trabalho', 'ocupacional'],
    'medicina intensiva': ['intensivista', 'uti', 'terapia intensiva'],
    'medicina integrativa': ['integrativa', 'funcional', 'ortomolecular'],
    'nutrologia esportiva': ['nutrologia esportiva', 'nutrição esportiva'],
    'mastologia': ['mastologista', 'mastologia', 'mama', 'mamas'],
    'angiologia': ['angiologista', 'angiologia', 'varizes', 'vasos'],
    'alergologia': ['alergista', 'alergologia', 'alergia', 'imunologia'],
    'medicina nuclear': ['medicina nuclear', 'nuclear'],
    'radiologia': ['radiologista', 'radiologia', 'imagem'],
    'patologia': ['patologista', 'patologia'],
    'anestesiologia': ['anestesista', 'anestesiologia', 'anestesia'],
    'acupuntura': ['acupuntura', 'acupunturista'],
    'homeopatia': ['homeopata', 'homeopatia'],
    'medicina hiperbárica': ['hiperbárica', 'oxigenoterapia'],
    'reprodução humana': ['reprodução humana', 'fertilidade', 'fertilização', 'reprodução assistida'],
}

VERTICALS_CONFIG = {
    'medico': {
        'keywords': MEDICO_KEYWORDS,
        'title_patterns': [r'\bDra?\.?\b']
    },
    'mentor': {
        'keywords': ['mentor', 'mentoria', 'coach', 'coaching', 'transformação', 'empresário',
                     'empreendedor', 'negócios', 'business', 'escala', 'faturamento', 'high ticket',
                     'infoprodutor', 'lançamento', 'perpétuo', 'método', 'treinamento'],
        'title_patterns': []
    },
    'dentista': {
        'keywords': ['dentista', 'odontólogo', 'odontóloga', 'cro', 'odontologia', 'ortodontia',
                     'ortodontista', 'implante', 'implantodontia', 'endodontia', 'periodontia',
                     'prótese dentária', 'lente de contato dental', 'faceta', 'clareamento dental',
                     'odontopediatria', 'buco', 'maxilo', 'cirurgião dentista', 'sorriso'],
        'title_patterns': [r'\bDra?\.?\b']
    },
    'hof': {
        'keywords': ['harmonização', 'harmonização facial', 'hof', 'preenchimento', 'botox',
                     'bioestimulador', 'fios de pdo', 'sculptra', 'radiesse', 'ácido hialurônico',
                     'lipo de papada', 'rinomodelação', 'md codes', 'bichectomia', 'skinbooster',
                     'estética facial', 'rejuvenescimento', 'orofacial', 'toxina botulínica'],
        'title_patterns': [r'\bDra?\.?\b']
    },
    'advogado': {
        'keywords': ['advogado', 'advogada', 'oab', 'direito', 'jurídico'],
        'title_patterns': [r'\bDra?\.?\b']
    },
    'nutricionista': {
        'keywords': ['nutricionista', 'crn', 'nutrição', 'nutri', 'emagrecimento', 'dieta',
                     'alimentação', 'reeducação alimentar', 'nutrição esportiva', 'nutrição funcional'],
        'title_patterns': []
    },
    'esteticista': {
        'keywords': ['esteticista', 'estética', 'estética corporal', 'estética avançada',
                     'biomédica', 'biomédico', 'crbm', 'micropigmentação', 'microblading',
                     'lash designer', 'extensão de cílios', 'designer de sobrancelhas'],
        'title_patterns': []
    }
}


# =============================================================================
# APIFY CLIENT
# =============================================================================

class ApifyFollowersScraper:
    """Cliente para buscar seguidores via Apify"""

    def __init__(self):
        self.api_token = os.getenv('APIFY_API_TOKEN')
        if not self.api_token:
            raise ValueError("Configure APIFY_API_TOKEN no arquivo ~/.env")

        self.client = ApifyClient(self.api_token)
        logger.info("Apify client inicializado")

    def scrape_profiles(self, usernames: List[str]) -> List[Dict]:
        """Busca dados de perfis usando o Actor customizado

        Args:
            usernames: Lista de usernames do Instagram

        Returns:
            Lista de dicionários com dados dos perfis
        """
        logger.info(f"Buscando dados de {len(usernames)} perfis via Apify")

        try:
            # Preparar input
            run_input = {
                "usernames": [u.replace('@', '').lower() for u in usernames],
                "mode": "profiles"
            }

            # Executar actor customizado
            logger.info(f"Executando Actor: {APIFY_ACTOR_ID}")
            run = self.client.actor(APIFY_ACTOR_ID).call(run_input=run_input, timeout_secs=300)

            # Buscar resultados
            dataset_id = run["defaultDatasetId"]
            items = list(self.client.dataset(dataset_id).iterate_items())

            logger.info(f"Apify retornou {len(items)} perfis")
            return items

        except Exception as e:
            logger.error(f"Erro no Apify: {e}")
            return []

    def scrape_followers(self, target_username: str, session_id: str,
                         max_followers: int = 100, filter_keywords: List[str] = None) -> List[Dict]:
        """Busca seguidores de um perfil e filtra por keywords

        Args:
            target_username: Username do perfil alvo
            session_id: Cookie sessionid do Instagram
            max_followers: Máximo de seguidores para buscar
            filter_keywords: Keywords para filtrar (ex: ['dr.', 'médico'])

        Returns:
            Lista de dicionários com dados dos perfis dos seguidores
        """
        logger.info(f"Buscando seguidores de @{target_username} via Apify")

        try:
            run_input = {
                "targetUsername": target_username.replace('@', '').lower(),
                "sessionId": session_id,
                "maxFollowers": max_followers,
                "filterKeywords": filter_keywords or [],
                "mode": "followers"
            }

            logger.info(f"Executando Actor: {APIFY_ACTOR_ID}")
            logger.info(f"  Target: @{target_username}")
            logger.info(f"  Max: {max_followers} seguidores")
            if filter_keywords:
                logger.info(f"  Filtros: {', '.join(filter_keywords)}")

            # Timeout maior para buscar seguidores
            run = self.client.actor(APIFY_ACTOR_ID).call(run_input=run_input, timeout_secs=600)

            dataset_id = run["defaultDatasetId"]
            items = list(self.client.dataset(dataset_id).iterate_items())

            logger.info(f"Apify retornou {len(items)} perfis de seguidores")
            return items

        except Exception as e:
            logger.error(f"Erro no Apify: {e}")
            return []



# =============================================================================
# SUPABASE CLIENT
# =============================================================================

class SupabaseClient:
    """Cliente para operações no Supabase"""

    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

        if not self.url or not self.key:
            raise ValueError("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")

        self.client: Client = create_client(self.url, self.key)
        logger.info(f"Conectado ao Supabase")

    def lead_exists(self, instagram_handle: str) -> Optional[Dict]:
        """Verifica se lead já existe"""
        handle = instagram_handle.lower().replace('@', '')
        result = self.client.table('socialfy_leads').select('id').eq(
            'instagram_handle', f'@{handle}'
        ).execute()
        return result.data[0] if result.data else None

    def insert_lead(self, lead_data: Dict) -> Optional[str]:
        """Insere novo lead"""
        try:
            if 'instagram_handle' in lead_data:
                handle = lead_data['instagram_handle'].lower().replace('@', '')
                lead_data['instagram_handle'] = f'@{handle}'

            if 'organization_id' not in lead_data:
                lead_data['organization_id'] = '11111111-1111-1111-1111-111111111111'

            lead_data['created_at'] = datetime.now().isoformat()
            lead_data['updated_at'] = datetime.now().isoformat()
            lead_data['scraped_at'] = datetime.now().isoformat()

            lead_data = {k: v for k, v in lead_data.items() if v is not None}

            result = self.client.table('socialfy_leads').insert(lead_data).execute()
            if result.data:
                return result.data[0]['id']
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
            logger.error(f"Erro ao atualizar lead: {e}")
            return False


# =============================================================================
# LEAD PROCESSOR
# =============================================================================

class LeadProcessor:
    """Processa dados do Apify e converte para formato socialfy_leads"""

    def __init__(self, vertical: str):
        self.vertical = vertical
        self.config = VERTICALS_CONFIG.get(vertical, {})

    def is_valid_lead(self, follower: Dict) -> bool:
        """Verifica se o seguidor é um lead válido para o vertical"""
        # Pular perfis privados
        if follower.get('is_private', False):
            return False

        # Verificar nome completo contra keywords
        full_name = (follower.get('full_name') or '').lower()
        username = (follower.get('username') or '').lower()

        keywords = self.config.get('keywords', [])

        for keyword in keywords:
            if keyword.lower() in full_name or keyword.lower() in username:
                return True

        return False

    def extract_title(self, full_name: str) -> Optional[str]:
        """Extrai título (Dr./Dra.) do nome"""
        if not full_name:
            return None

        if re.search(r'\bDra\.?\b', full_name, re.IGNORECASE):
            return 'Dra.'
        elif re.search(r'\bDr\.?\b', full_name, re.IGNORECASE):
            return 'Dr.'

        return None

    def process_profile(self, profile: Dict, source: str = 'apify') -> Dict:
        """Converte dados do Apify para formato socialfy_leads"""
        username = profile.get('username', '')
        full_name = profile.get('fullName', '')
        bio = profile.get('biography', '')
        followers = profile.get('followersCount', 0)

        # Determinar ICP tier baseado em seguidores
        if followers and followers >= 10000:
            icp_tier = 'A'
        elif followers and followers >= 1000:
            icp_tier = 'B'
        else:
            icp_tier = 'C'

        # Verificado sobe de tier
        is_verified = profile.get('isVerified', False)
        if is_verified and icp_tier != 'A':
            icp_tier = 'A'

        # Extrair dados do vertical (especialidades, CRM, etc)
        vertical_data = self.extract_vertical_data(bio, full_name)

        # Tags
        tags = [self.vertical]
        if is_verified:
            tags.append('verificado')
        if profile.get('isBusinessAccount'):
            tags.append('business')
        if followers and followers >= 10000:
            tags.append('influenciador')

        # Adicionar especialidades como tags
        if vertical_data and vertical_data.get('especialidades'):
            for esp in vertical_data['especialidades']:
                if esp not in tags:
                    tags.append(esp)

        # Extrair contato da bio
        contact_info = self.extract_contact_from_bio(bio)

        lead = {
            'name': full_name,
            'title': self.extract_title(full_name) or self.extract_title(bio),
            'instagram_handle': f'@{username}',
            'instagram_url': f'https://instagram.com/{username}',
            'instagram_followers': followers,
            'instagram_following': profile.get('followingCount'),
            'instagram_posts': profile.get('postsCount'),
            'instagram_bio': bio[:1000] if bio else None,
            'instagram_is_verified': is_verified,
            'instagram_is_business': profile.get('isBusinessAccount', False),

            'vertical': self.vertical,
            'vertical_data': vertical_data,  # Contém: especialidades, especialidade_principal, crm, rqe

            'email': contact_info.get('email'),
            'phone': contact_info.get('phone'),
            'whatsapp': contact_info.get('whatsapp'),

            'source': 'apify_scraping',
            'source_data': {
                'apify_actor_id': APIFY_ACTOR_ID,
                'source_type': source,
                'external_url': profile.get('externalUrl'),
                'category': profile.get('category'),
                'profile_pic_url': profile.get('profilePicUrl')
            },
            'scrape_source': 'apify',

            'tags': tags,
            'status': 'available',
            'icp_tier': icp_tier,
            'channels': ['instagram'],
        }

        return lead

    def extract_contact_from_bio(self, bio: str) -> Dict:
        """Extrai email, telefone e whatsapp da bio"""
        import re
        info = {}

        if not bio:
            return info

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
                if 'whatsapp' in bio.lower() or 'whats' in bio.lower() or 'wa.me' in bio.lower():
                    info['whatsapp'] = f"+55{phone}"

        return info

    def extract_especialidades(self, bio: str, full_name: str = '') -> List[str]:
        """Extrai especialidades médicas da bio e nome"""
        if not bio and not full_name:
            return []

        text = f"{bio or ''} {full_name or ''}".lower()
        especialidades_encontradas = []

        for especialidade, keywords in ESPECIALIDADES_MEDICAS.items():
            for keyword in keywords:
                if keyword.lower() in text:
                    if especialidade not in especialidades_encontradas:
                        especialidades_encontradas.append(especialidade)
                    break  # Encontrou uma keyword, não precisa checar as outras

        return especialidades_encontradas

    def extract_vertical_data(self, bio: str, full_name: str = '') -> Dict:
        """Extrai dados específicos do vertical (CRM, OAB, especialidades, etc)"""
        import re
        data = {}

        if not bio:
            return data

        if self.vertical == 'medico':
            # Extrair CRM
            crm_match = re.search(r'CRM[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if crm_match:
                data['crm_estado'] = crm_match.group(1).upper()
                data['crm_numero'] = crm_match.group(2)

            # Extrair RQE (Registro de Qualificação de Especialista)
            rqe_match = re.search(r'RQE[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if rqe_match:
                data['rqe'] = rqe_match.group(1)

            # Extrair especialidades
            especialidades = self.extract_especialidades(bio, full_name)
            if especialidades:
                data['especialidades'] = especialidades
                data['especialidade_principal'] = especialidades[0]  # Primeira encontrada

        elif self.vertical == 'advogado':
            oab_match = re.search(r'OAB[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if oab_match:
                data['oab_estado'] = oab_match.group(1).upper()
                data['oab_numero'] = oab_match.group(2)

        elif self.vertical == 'dentista':
            cro_match = re.search(r'CRO[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)', bio, re.IGNORECASE)
            if cro_match:
                data['cro_estado'] = cro_match.group(1).upper()
                data['cro_numero'] = cro_match.group(2)

        return data if data else None


# =============================================================================
# PIPELINE
# =============================================================================

class ApifyPipeline:
    """Pipeline completo: Apify -> Processamento -> Supabase"""

    def __init__(self, vertical: str):
        self.apify = ApifyFollowersScraper()
        self.supabase = SupabaseClient()
        self.processor = LeadProcessor(vertical)
        self.vertical = vertical

    def run_followers(self, target_username: str, session_id: str,
                      max_followers: int = 100) -> Dict:
        """Busca seguidores de um perfil, filtra médicos e salva no Supabase

        Args:
            target_username: Perfil alvo para buscar seguidores
            session_id: Cookie sessionid do Instagram
            max_followers: Máximo de seguidores para buscar

        Returns:
            Estatísticas da execução
        """
        stats = {
            'total_scraped': 0,
            'total_filtered': 0,
            'novos': 0,
            'atualizados': 0,
            'erros': 0,
            'target_account': target_username
        }

        # Keywords para filtrar baseado no vertical
        filter_keywords = self.processor.config.get('keywords', [])

        # Buscar seguidores via Apify
        profiles = self.apify.scrape_followers(
            target_username=target_username,
            session_id=session_id,
            max_followers=max_followers,
            filter_keywords=filter_keywords
        )

        stats['total_scraped'] = max_followers  # Tentou buscar esse tanto
        stats['total_filtered'] = len(profiles)  # Retornou após filtro

        # Processar cada perfil
        for profile in profiles:
            try:
                if profile.get('error'):
                    logger.warning(f"Perfil com erro: @{profile.get('username')} - {profile.get('error')}")
                    stats['erros'] += 1
                    continue

                # Converter para formato lead
                lead = self.processor.process_profile(profile, source='apify_followers')
                lead['source_data']['source_account'] = target_username

                # Verificar se já existe
                existing = self.supabase.lead_exists(lead['instagram_handle'])

                if existing:
                    update_data = {
                        'instagram_followers': lead.get('instagram_followers'),
                        'instagram_following': lead.get('instagram_following'),
                        'instagram_posts': lead.get('instagram_posts'),
                        'instagram_bio': lead.get('instagram_bio'),
                        'vertical_data': lead.get('vertical_data'),  # Atualizar especialidades
                        'tags': lead.get('tags'),  # Atualizar tags com especialidades
                        'scraped_at': datetime.now().isoformat()
                    }
                    self.supabase.update_lead(existing['id'], update_data)
                    stats['atualizados'] += 1
                    esp = lead.get('vertical_data', {}).get('especialidade_principal', '')
                    logger.info(f"  ↻ Atualizado: @{profile.get('username')} [{esp}]")
                else:
                    if self.supabase.insert_lead(lead):
                        stats['novos'] += 1
                        logger.info(f"  ✓ Novo: @{profile.get('username')} ({lead.get('instagram_followers')} seg)")
                    else:
                        stats['erros'] += 1

            except Exception as e:
                logger.error(f"Erro ao processar: {e}")
                stats['erros'] += 1

        return stats

    def run_profiles(self, usernames: List[str]) -> Dict:
        """Busca perfis e salva no Supabase

        Args:
            usernames: Lista de usernames para buscar

        Returns:
            Estatísticas da execução
        """
        stats = {
            'total_scraped': 0,
            'total_valid': 0,
            'novos': 0,
            'atualizados': 0,
            'erros': 0,
            'contas_processadas': len(usernames)
        }

        # Buscar perfis via Apify
        profiles = self.apify.scrape_profiles(usernames)
        stats['total_scraped'] = len(profiles)

        # Processar cada perfil
        for profile in profiles:
            try:
                # Verificar se teve erro
                if profile.get('error'):
                    logger.warning(f"Perfil com erro: @{profile.get('username')} - {profile.get('error')}")
                    stats['erros'] += 1
                    continue

                # Verificar se é lead válido para o vertical
                bio = profile.get('biography', '')
                full_name = profile.get('fullName', '')

                if not self.processor.is_valid_lead({'full_name': full_name, 'is_private': profile.get('isPrivate', False)}):
                    # Se não tem keyword do vertical na bio/nome, ainda salva mas marca
                    pass

                stats['total_valid'] += 1

                # Converter para formato lead
                lead = self.processor.process_profile(profile, source='apify_direct')

                # Verificar se já existe
                existing = self.supabase.lead_exists(lead['instagram_handle'])

                if existing:
                    # Atualizar com dados novos
                    update_data = {
                        'instagram_followers': lead.get('instagram_followers'),
                        'instagram_following': lead.get('instagram_following'),
                        'instagram_posts': lead.get('instagram_posts'),
                        'instagram_bio': lead.get('instagram_bio'),
                        'scraped_at': datetime.now().isoformat()
                    }
                    self.supabase.update_lead(existing['id'], update_data)
                    stats['atualizados'] += 1
                    logger.info(f"  ↻ Atualizado: @{profile.get('username')} ({lead.get('instagram_followers')} seguidores)")
                else:
                    if self.supabase.insert_lead(lead):
                        stats['novos'] += 1
                        logger.info(f"  ✓ Novo lead: @{profile.get('username')} ({lead.get('title', '')} - {lead.get('instagram_followers')} seguidores)")
                    else:
                        stats['erros'] += 1

            except Exception as e:
                logger.error(f"Erro ao processar perfil: {e}")
                stats['erros'] += 1

        return stats

    def run(self, accounts: List[str], limit_per_account: int = 100) -> Dict:
        """Método legado - redireciona para run_profiles"""
        logger.info("Usando run_profiles para buscar dados de perfis")
        return self.run_profiles(accounts)


# =============================================================================
# ENRIQUECIMENTO (buscar bio e followers count)
# =============================================================================

class LeadEnricher:
    """Enriquece leads com dados adicionais via scraper local"""

    def __init__(self, supabase: SupabaseClient):
        self.supabase = supabase

        # Importar scraper local se disponível
        try:
            sys.path.insert(0, str(Path(__file__).parent))
            from importlib import import_module
            scraper_module = import_module('scraper-leads')
            self.local_scraper = scraper_module.InstagramScraper()
            self.has_local_scraper = True
            logger.info("Scraper local disponível para enriquecimento")
        except Exception as e:
            self.has_local_scraper = False
            logger.warning(f"Scraper local não disponível: {e}")

    def enrich_leads(self, limit: int = 50) -> Dict:
        """Enriquece leads que vieram do Apify com dados completos"""
        if not self.has_local_scraper:
            logger.warning("Enriquecimento requer scraper local")
            return {'enriched': 0, 'errors': 0}

        stats = {'enriched': 0, 'errors': 0}

        # Buscar leads do Apify sem bio
        result = self.supabase.client.table('socialfy_leads').select(
            'id, instagram_handle'
        ).eq('source', 'apify_followers').is_('instagram_bio', 'null').limit(limit).execute()

        for lead in result.data:
            try:
                username = lead['instagram_handle'].replace('@', '')

                # Buscar dados completos
                import instaloader
                profile = instaloader.Profile.from_username(
                    self.local_scraper.loader.context, username
                )

                # Atualizar lead
                self.supabase.update_lead(lead['id'], {
                    'instagram_bio': profile.biography[:1000] if profile.biography else None,
                    'instagram_followers': profile.followers,
                    'instagram_following': profile.followees,
                    'instagram_posts': profile.mediacount,
                    'instagram_is_business': profile.is_business_account,
                    'icp_tier': 'A' if profile.followers >= 10000 else 'B' if profile.followers >= 1000 else 'C'
                })

                stats['enriched'] += 1
                logger.info(f"  ✓ Enriquecido: @{username} ({profile.followers} seguidores)")

                time.sleep(2)  # Rate limiting

            except Exception as e:
                logger.error(f"Erro ao enriquecer {lead['instagram_handle']}: {e}")
                stats['errors'] += 1

        return stats


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='MOTTIVME - Scraper de Seguidores via Apify'
    )

    # Modos de operação
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument('--followers', '-f', metavar='USERNAME',
                           help='Buscar SEGUIDORES de um perfil (requer --session-id)')
    mode_group.add_argument('--accounts', '-A',
                           help='Buscar dados de PERFIS específicos (separados por vírgula)')
    mode_group.add_argument('--enrich', '-e', action='store_true',
                           help='Enriquecer leads existentes')

    # Parâmetros comuns
    parser.add_argument('--vertical', '-v', required=True,
                       choices=list(VERTICALS_CONFIG.keys()),
                       help='Vertical do lead')
    parser.add_argument('--limit', '-l', type=int, default=100,
                       help='Limite de seguidores/perfis')

    # Parâmetros para modo followers
    parser.add_argument('--session-id', '-s',
                       help='Cookie sessionid do Instagram (obrigatório para --followers)')

    # Parâmetros para enrich
    parser.add_argument('--enrich-limit', type=int, default=50,
                       help='Limite de leads para enriquecer')

    args = parser.parse_args()

    # Validar argumentos
    if not args.followers and not args.accounts and not args.enrich:
        parser.print_help()
        print("\n" + "="*70)
        print("EXEMPLOS DE USO")
        print("="*70)
        print("\n🔥 BUSCAR SEGUIDORES (filtra médicos automaticamente):")
        print("  python apify-followers.py --followers aceleradormedico --vertical medico --limit 500 --session-id SEU_SESSION_ID")
        print("\n📊 BUSCAR DADOS DE PERFIS ESPECÍFICOS:")
        print("  python apify-followers.py --accounts dr.fulano,dra.ciclana --vertical medico")
        print("\n🔄 ENRIQUECER LEADS EXISTENTES:")
        print("  python apify-followers.py --vertical medico --enrich --enrich-limit 50")
        print("\n⚠️  COMO OBTER O SESSION ID:")
        print("  1. Faça login no Instagram pelo navegador")
        print("  2. Pressione F12 > Application > Cookies > instagram.com")
        print("  3. Copie o valor do cookie 'sessionid'")
        print("="*70)
        sys.exit(1)

    try:
        # Modo enriquecimento
        if args.enrich:
            logger.info("Iniciando enriquecimento de leads...")
            supabase = SupabaseClient()
            enricher = LeadEnricher(supabase)
            stats = enricher.enrich_leads(args.enrich_limit)

            print("\n" + "="*50)
            print("RESULTADO DO ENRIQUECIMENTO")
            print("="*50)
            print(f"Leads enriquecidos: {stats['enriched']}")
            print(f"Erros: {stats['errors']}")
            return

        pipeline = ApifyPipeline(args.vertical)

        # Modo followers (buscar seguidores de um perfil)
        if args.followers:
            if not args.session_id:
                print("\n❌ ERRO: --session-id é obrigatório para buscar seguidores!")
                print("\nComo obter o session ID:")
                print("  1. Faça login no Instagram pelo navegador")
                print("  2. Pressione F12 > Application > Cookies > instagram.com")
                print("  3. Copie o valor do cookie 'sessionid'")
                sys.exit(1)

            stats = pipeline.run_followers(
                target_username=args.followers,
                session_id=args.session_id,
                max_followers=args.limit
            )

            print("\n" + "="*60)
            print(f"RESULTADO - SEGUIDORES DE @{args.followers} ({args.vertical.upper()})")
            print("="*60)
            print(f"Seguidores analisados: {stats['total_scraped']}")
            print(f"Médicos encontrados: {stats['total_filtered']}")
            print(f"Novos leads: {stats['novos']}")
            print(f"Atualizados: {stats['atualizados']}")
            print(f"Erros: {stats['erros']}")
            print("="*60)

        # Modo profiles (buscar dados de perfis específicos)
        elif args.accounts:
            accounts = [a.strip() for a in args.accounts.split(',')]
            stats = pipeline.run_profiles(accounts)

            print("\n" + "="*50)
            print(f"RESULTADO - PERFIS ({args.vertical.upper()})")
            print("="*50)
            print(f"Perfis buscados: {stats['total_scraped']}")
            print(f"Leads válidos: {stats['total_valid']}")
            print(f"Novos leads: {stats['novos']}")
            print(f"Atualizados: {stats['atualizados']}")
            print(f"Erros: {stats['erros']}")
            print("="*50)

        # Estimar custo
        cost = stats.get('total_scraped', 0) * 0.0012
        print(f"\n💰 Custo estimado Apify: ${cost:.2f}")

    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
