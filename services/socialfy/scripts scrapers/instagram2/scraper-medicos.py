#!/usr/bin/env python3
"""
=============================================================================
MOTTIVME - Scraper de Médicos via Instagram
Sistema de Big Data para prospecção automatizada de profissionais de saúde
=============================================================================

Uso:
    python scraper-medicos.py --hashtag dermato --limit 50
    python scraper-medicos.py --profile @clinicaexemplo
    python scraper-medicos.py --auto  # Executa alvos configurados no Supabase

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
        logging.FileHandler(Path.home() / '.local/logs/scraper-medicos.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv(Path.home() / '.env')
load_dotenv(Path.home() / 'Projects/mottivme/socialfy-platform/.env.local')


@dataclass
class LeadMedico:
    """Estrutura de dados para um lead médico"""
    nome: str
    instagram_username: str
    fonte: str

    # Campos opcionais
    titulo: Optional[str] = None
    nome_social: Optional[str] = None
    especialidade: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None

    instagram_followers: Optional[int] = None
    instagram_following: Optional[int] = None
    instagram_posts: Optional[int] = None
    instagram_bio: Optional[str] = None
    instagram_website: Optional[str] = None
    instagram_is_verified: bool = False
    instagram_is_business: bool = False
    instagram_last_post_date: Optional[str] = None

    cidade: Optional[str] = None
    estado: Optional[str] = None
    estado_sigla: Optional[str] = None
    website: Optional[str] = None

    fonte_detalhes: Optional[Dict] = None
    raw_data: Optional[Dict] = None


class SupabaseClient:
    """Cliente para operações no Supabase"""

    def __init__(self):
        self.url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')

        if not self.url or not self.key:
            logger.error("Credenciais Supabase não configuradas")
            logger.info("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no .env")
            raise ValueError("Credenciais Supabase não configuradas")

        self.client: Client = create_client(self.url, self.key)
        logger.info(f"Conectado ao Supabase: {self.url[:50]}...")

    def lead_exists(self, instagram_username: str) -> bool:
        """Verifica se lead já existe no banco"""
        result = self.client.table('leads_medicos').select('id').eq(
            'instagram_username', instagram_username.lower().replace('@', '')
        ).execute()
        return len(result.data) > 0

    def insert_lead(self, lead: LeadMedico) -> Optional[str]:
        """Insere novo lead no banco"""
        data = asdict(lead)
        # Remover campos None
        data = {k: v for k, v in data.items() if v is not None}

        # Normalizar username
        if 'instagram_username' in data:
            data['instagram_username'] = data['instagram_username'].lower().replace('@', '')

        try:
            result = self.client.table('leads_medicos').insert(data).execute()
            if result.data:
                lead_id = result.data[0]['id']
                logger.info(f"Lead inserido: {lead.instagram_username} (ID: {lead_id})")
                return lead_id
        except Exception as e:
            logger.error(f"Erro ao inserir lead {lead.instagram_username}: {e}")
        return None

    def update_lead(self, instagram_username: str, data: Dict) -> bool:
        """Atualiza lead existente"""
        try:
            username = instagram_username.lower().replace('@', '')
            self.client.table('leads_medicos').update(data).eq(
                'instagram_username', username
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Erro ao atualizar {instagram_username}: {e}")
            return False

    def get_scrape_targets(self, tipo: Optional[str] = None) -> List[Dict]:
        """Busca alvos de scraping configurados"""
        query = self.client.table('scrape_targets').select('*').eq('ativo', True)
        if tipo:
            query = query.eq('tipo', tipo)
        result = query.order('prioridade', desc=True).execute()
        return result.data

    def create_scrape_job(self, tipo: str, parametros: Dict) -> str:
        """Cria registro de job de scraping"""
        result = self.client.table('scrape_jobs').insert({
            'tipo': tipo,
            'parametros': parametros,
            'status': 'running',
            'started_at': datetime.now().isoformat()
        }).execute()
        return result.data[0]['id']

    def complete_scrape_job(self, job_id: str, stats: Dict, error: Optional[str] = None):
        """Finaliza job de scraping"""
        data = {
            'status': 'failed' if error else 'completed',
            'completed_at': datetime.now().isoformat(),
            'total_encontrados': stats.get('total', 0),
            'total_novos': stats.get('novos', 0),
            'total_atualizados': stats.get('atualizados', 0),
            'total_erros': stats.get('erros', 0)
        }
        if error:
            data['error_log'] = error

        self.client.table('scrape_jobs').update(data).eq('id', job_id).execute()


class InstagramScraper:
    """Scraper de perfis médicos do Instagram"""

    # Padrões para identificar profissionais de saúde
    TITULO_PATTERNS = [
        r'\bDr\.?\b', r'\bDra\.?\b', r'\bDrº?\b', r'\bDrª?\b',
        r'\bMédic[ao]\b', r'\bDoctor\b', r'\bMD\b'
    ]

    ESPECIALIDADE_KEYWORDS = {
        'dermatologia': ['dermato', 'dermatologista', 'pele', 'skincare', 'acne'],
        'cirurgia_plastica': ['cirurgião plástico', 'cirurgia plástica', 'plastica', 'estética facial'],
        'nutrologia': ['nutrólogo', 'nutrologia', 'nutrição médica', 'emagrecimento'],
        'endocrinologia': ['endocrinologista', 'endocrino', 'hormônios', 'tireoide', 'diabetes'],
        'cardiologia': ['cardiologista', 'cardio', 'coração'],
        'ginecologia': ['ginecologista', 'gineco', 'obstetra', 'saúde da mulher'],
        'oftalmologia': ['oftalmo', 'oftalmologista', 'olhos', 'visão'],
        'ortopedia': ['ortopedista', 'ortopedia', 'coluna', 'joelho'],
        'medicina_estetica': ['medicina estética', 'harmonização', 'botox', 'preenchimento'],
        'psiquiatria': ['psiquiatra', 'saúde mental'],
        'nutricionista': ['nutricionista', 'nutri', 'alimentação'],
        'fisioterapia': ['fisioterapeuta', 'fisio', 'rpg'],
        'odontologia': ['dentista', 'odonto', 'ortodontista', 'implante']
    }

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

        # Login se credenciais fornecidas
        if username and password:
            try:
                self.loader.login(username, password)
                logger.info(f"Logado como: {username}")
            except Exception as e:
                logger.warning(f"Não foi possível fazer login: {e}")

        # Tentar carregar sessão salva
        session_file = Path.home() / '.config/instaloader/session'
        if session_file.exists():
            try:
                self.loader.load_session_from_file(username or 'session')
                logger.info("Sessão carregada do arquivo")
            except:
                pass

    def is_medical_profile(self, bio: str) -> bool:
        """Verifica se o perfil parece ser de profissional de saúde"""
        if not bio:
            return False

        bio_lower = bio.lower()

        # Verificar títulos
        for pattern in self.TITULO_PATTERNS:
            if re.search(pattern, bio, re.IGNORECASE):
                return True

        # Verificar CRM
        if re.search(r'CRM[\s\-:]*\d+', bio, re.IGNORECASE):
            return True

        # Verificar especialidades
        for keywords in self.ESPECIALIDADE_KEYWORDS.values():
            for kw in keywords:
                if kw.lower() in bio_lower:
                    return True

        return False

    def extract_crm(self, bio: str) -> Optional[tuple]:
        """Extrai CRM e estado do bio"""
        if not bio:
            return None

        # Padrões: CRM-SP 123456, CRM/SP 123456, CRMSP 123456
        patterns = [
            r'CRM[\s\-/]*([A-Z]{2})[\s\-:]*(\d+)',
            r'CRM[\s\-:]*(\d+)[\s\-/]*([A-Z]{2})'
        ]

        for pattern in patterns:
            match = re.search(pattern, bio, re.IGNORECASE)
            if match:
                groups = match.groups()
                # Determinar qual é estado e qual é número
                if groups[0].isdigit():
                    return (groups[0], groups[1].upper())
                else:
                    return (groups[1], groups[0].upper())

        return None

    def detect_especialidade(self, bio: str) -> Optional[str]:
        """Detecta especialidade baseado no bio"""
        if not bio:
            return None

        bio_lower = bio.lower()

        for especialidade, keywords in self.ESPECIALIDADE_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in bio_lower:
                    # Formatar nome da especialidade
                    return especialidade.replace('_', ' ').title()

        return None

    def extract_contact_info(self, bio: str, external_url: str = None) -> Dict:
        """Extrai informações de contato do bio e URL"""
        info = {}

        if bio:
            # Email
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', bio)
            if email_match:
                info['email'] = email_match.group()

            # Telefone/WhatsApp
            phone_patterns = [
                r'\(?(\d{2})\)?[\s\-]?(\d{4,5})[\s\-]?(\d{4})',
                r'\+?55[\s\-]?\(?(\d{2})\)?[\s\-]?(\d{4,5})[\s\-]?(\d{4})'
            ]
            for pattern in phone_patterns:
                match = re.search(pattern, bio)
                if match:
                    phone = ''.join(match.groups())
                    if len(phone) >= 10:
                        info['telefone'] = phone
                        # Se menciona WhatsApp, usar como WhatsApp também
                        if 'whatsapp' in bio.lower() or 'whats' in bio.lower():
                            info['whatsapp'] = phone
                        break

        if external_url:
            info['website'] = external_url

        return info

    def extract_location(self, bio: str) -> Dict:
        """Extrai localização do bio"""
        info = {}

        if not bio:
            return info

        # Estados brasileiros
        estados = {
            'sp': 'São Paulo', 'rj': 'Rio de Janeiro', 'mg': 'Minas Gerais',
            'ba': 'Bahia', 'pr': 'Paraná', 'rs': 'Rio Grande do Sul',
            'sc': 'Santa Catarina', 'pe': 'Pernambuco', 'ce': 'Ceará',
            'go': 'Goiás', 'df': 'Distrito Federal', 'es': 'Espírito Santo',
            'ma': 'Maranhão', 'mt': 'Mato Grosso', 'ms': 'Mato Grosso do Sul',
            'pb': 'Paraíba', 'pa': 'Pará', 'am': 'Amazonas', 'pi': 'Piauí',
            'rn': 'Rio Grande do Norte', 'al': 'Alagoas', 'se': 'Sergipe',
            'to': 'Tocantins', 'ro': 'Rondônia', 'ac': 'Acre', 'ap': 'Amapá',
            'rr': 'Roraima'
        }

        bio_lower = bio.lower()

        # Buscar estado
        for sigla, nome in estados.items():
            if f' {sigla} ' in f' {bio_lower} ' or f'/{sigla}' in bio_lower or f'-{sigla}' in bio_lower:
                info['estado_sigla'] = sigla.upper()
                info['estado'] = nome
                break
            if nome.lower() in bio_lower:
                info['estado_sigla'] = sigla.upper()
                info['estado'] = nome
                break

        # Cidades comuns
        cidades = [
            'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador',
            'Curitiba', 'Porto Alegre', 'Brasília', 'Fortaleza', 'Recife',
            'Campinas', 'Goiânia', 'Florianópolis', 'Ribeirão Preto'
        ]

        for cidade in cidades:
            if cidade.lower() in bio_lower:
                info['cidade'] = cidade
                break

        return info

    def profile_to_lead(self, profile: instaloader.Profile, fonte_detalhes: Dict = None) -> LeadMedico:
        """Converte profile do Instagram para LeadMedico"""
        bio = profile.biography or ''

        # Extrair informações
        crm_info = self.extract_crm(bio)
        contact_info = self.extract_contact_info(bio, profile.external_url)
        location_info = self.extract_location(bio)
        especialidade = self.detect_especialidade(bio)

        # Determinar título
        titulo = None
        if re.search(r'\bDra\.?\b', profile.full_name, re.IGNORECASE) or re.search(r'\bDra\.?\b', bio, re.IGNORECASE):
            titulo = 'Dra.'
        elif re.search(r'\bDr\.?\b', profile.full_name, re.IGNORECASE) or re.search(r'\bDr\.?\b', bio, re.IGNORECASE):
            titulo = 'Dr.'

        # Última postagem
        last_post_date = None
        try:
            posts = profile.get_posts()
            first_post = next(iter(posts), None)
            if first_post:
                last_post_date = first_post.date_utc.isoformat()
        except:
            pass

        return LeadMedico(
            nome=profile.full_name,
            instagram_username=profile.username,
            fonte='instagram',

            titulo=titulo,
            especialidade=especialidade,

            instagram_followers=profile.followers,
            instagram_following=profile.followees,
            instagram_posts=profile.mediacount,
            instagram_bio=bio[:1000] if bio else None,
            instagram_website=profile.external_url,
            instagram_is_verified=profile.is_verified,
            instagram_is_business=profile.is_business_account,
            instagram_last_post_date=last_post_date,

            email=contact_info.get('email'),
            telefone=contact_info.get('telefone'),
            whatsapp=contact_info.get('whatsapp'),
            website=contact_info.get('website'),

            cidade=location_info.get('cidade'),
            estado=location_info.get('estado'),
            estado_sigla=location_info.get('estado_sigla'),

            fonte_detalhes=fonte_detalhes,
            raw_data={
                'biography': bio,
                'full_name': profile.full_name,
                'is_private': profile.is_private,
                'profile_pic_url': profile.profile_pic_url
            }
        )

    def scrape_hashtag(self, hashtag: str, limit: int = 50) -> List[LeadMedico]:
        """Scrape perfis médicos a partir de uma hashtag"""
        leads = []
        processed = set()

        hashtag = hashtag.replace('#', '').lower()
        logger.info(f"Iniciando scrape da hashtag: #{hashtag} (limit: {limit})")

        try:
            posts = instaloader.Hashtag.from_name(self.loader.context, hashtag).get_posts()

            count = 0
            for post in posts:
                if count >= limit * 3:  # Processar mais posts pois nem todos serão médicos
                    break

                try:
                    username = post.owner_username

                    if username in processed:
                        continue
                    processed.add(username)

                    # Carregar perfil completo
                    profile = instaloader.Profile.from_username(self.loader.context, username)

                    # Verificar se é privado
                    if profile.is_private:
                        continue

                    # Verificar se parece ser médico
                    if not self.is_medical_profile(profile.biography):
                        continue

                    # Converter para lead
                    lead = self.profile_to_lead(profile, {
                        'hashtag': hashtag,
                        'post_shortcode': post.shortcode
                    })
                    leads.append(lead)

                    logger.info(f"Lead encontrado: @{username} ({lead.especialidade or 'sem especialidade'})")

                    if len(leads) >= limit:
                        break

                    # Rate limiting
                    time.sleep(2)

                except Exception as e:
                    logger.warning(f"Erro ao processar @{username}: {e}")
                    continue

                count += 1

        except Exception as e:
            logger.error(f"Erro no scrape da hashtag #{hashtag}: {e}")

        logger.info(f"Hashtag #{hashtag}: {len(leads)} leads encontrados")
        return leads

    def scrape_profile(self, username: str) -> Optional[LeadMedico]:
        """Scrape um perfil específico"""
        username = username.replace('@', '').lower()
        logger.info(f"Scraping perfil: @{username}")

        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)

            if profile.is_private:
                logger.warning(f"Perfil @{username} é privado")
                return None

            lead = self.profile_to_lead(profile, {'tipo': 'perfil_direto'})
            return lead

        except Exception as e:
            logger.error(f"Erro ao carregar @{username}: {e}")
            return None


class BigDataPipeline:
    """Pipeline completo de Big Data para médicos"""

    def __init__(self):
        self.supabase = SupabaseClient()
        self.scraper = InstagramScraper(
            username=os.getenv('INSTAGRAM_USERNAME'),
            password=os.getenv('INSTAGRAM_PASSWORD')
        )

    def run_hashtag_scrape(self, hashtag: str, limit: int = 50) -> Dict:
        """Executa scrape de hashtag e salva no Supabase"""
        stats = {'total': 0, 'novos': 0, 'atualizados': 0, 'erros': 0}

        # Criar job
        job_id = self.supabase.create_scrape_job('instagram_hashtag', {
            'hashtag': hashtag,
            'limit': limit
        })

        try:
            leads = self.scraper.scrape_hashtag(hashtag, limit)
            stats['total'] = len(leads)

            for lead in leads:
                try:
                    if self.supabase.lead_exists(lead.instagram_username):
                        # Atualizar existente
                        self.supabase.update_lead(lead.instagram_username, {
                            'instagram_followers': lead.instagram_followers,
                            'instagram_posts': lead.instagram_posts,
                            'last_updated_at': datetime.now().isoformat()
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

            self.supabase.complete_scrape_job(job_id, stats)

        except Exception as e:
            self.supabase.complete_scrape_job(job_id, stats, str(e))
            raise

        return stats

    def run_auto_scrape(self) -> Dict:
        """Executa scrape automático baseado nos alvos configurados"""
        total_stats = {'total': 0, 'novos': 0, 'atualizados': 0, 'erros': 0}

        targets = self.supabase.get_scrape_targets()
        logger.info(f"Encontrados {len(targets)} alvos de scraping")

        for target in targets:
            try:
                if target['tipo'] == 'hashtag':
                    hashtag = target['valor'].replace('#', '')
                    limit = target.get('filtros', {}).get('limit', 30)

                    logger.info(f"Processando hashtag: #{hashtag}")
                    stats = self.run_hashtag_scrape(hashtag, limit)

                    for key in stats:
                        total_stats[key] += stats[key]

                    # Atualizar última execução
                    self.supabase.client.table('scrape_targets').update({
                        'ultima_execucao': datetime.now().isoformat(),
                        'total_leads_gerados': target.get('total_leads_gerados', 0) + stats['novos']
                    }).eq('id', target['id']).execute()

                    # Rate limiting entre alvos
                    time.sleep(30)

            except Exception as e:
                logger.error(f"Erro no alvo {target['nome']}: {e}")
                total_stats['erros'] += 1

        return total_stats


def main():
    parser = argparse.ArgumentParser(description='MOTTIVME - Scraper de Médicos')
    parser.add_argument('--hashtag', '-t', help='Hashtag para scrape (ex: dermato)')
    parser.add_argument('--profile', '-p', help='Perfil para scrape (ex: @clinica)')
    parser.add_argument('--limit', '-l', type=int, default=50, help='Limite de leads (default: 50)')
    parser.add_argument('--auto', action='store_true', help='Executar scrape automático')
    parser.add_argument('--dry-run', action='store_true', help='Não salvar no banco')

    args = parser.parse_args()

    if not any([args.hashtag, args.profile, args.auto]):
        parser.print_help()
        print("\nExemplos:")
        print("  python scraper-medicos.py --hashtag dermato --limit 30")
        print("  python scraper-medicos.py --profile @clinicaexemplo")
        print("  python scraper-medicos.py --auto")
        sys.exit(1)

    try:
        pipeline = BigDataPipeline()

        if args.auto:
            logger.info("Iniciando scrape automático...")
            stats = pipeline.run_auto_scrape()
        elif args.hashtag:
            stats = pipeline.run_hashtag_scrape(args.hashtag, args.limit)
        elif args.profile:
            lead = pipeline.scraper.scrape_profile(args.profile)
            if lead and not args.dry_run:
                pipeline.supabase.insert_lead(lead)
            stats = {'total': 1 if lead else 0, 'novos': 1 if lead else 0, 'erros': 0}

        print("\n" + "="*50)
        print("RESULTADO DO SCRAPING")
        print("="*50)
        print(f"Total encontrados: {stats['total']}")
        print(f"Novos leads: {stats['novos']}")
        print(f"Atualizados: {stats.get('atualizados', 0)}")
        print(f"Erros: {stats['erros']}")
        print("="*50)

    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
