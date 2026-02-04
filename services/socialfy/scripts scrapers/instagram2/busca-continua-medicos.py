#!/usr/bin/env python3
"""
=============================================================================
MOTTIVME - BUSCA CONTÍNUA DE MÉDICOS NO INSTAGRAM
Roda sem parar buscando médicos de múltiplas contas!
=============================================================================

Uso:
    python busca-continua-medicos.py --session-id "SEU_SESSION_ID"

Autor: MOTTIVME
Data: Janeiro 2026
"""

import os
import sys
import time
import logging
import argparse
import random
from datetime import datetime
from pathlib import Path

# Adicionar diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

# Importar o módulo principal
from importlib import import_module

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path.home() / '.local/logs/busca-continua-medicos.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONTAS FONTE PARA BUSCAR SEGUIDORES
# Médicos, clínicas, associações médicas, cursos de medicina, etc.
# =============================================================================

CONTAS_MEDICAS = [
    # Acelerador Médico (já usadas)
    'aceleradormedico',
    'grupoacelerador',

    # Grandes contas de medicina
    'medicina',
    'medicinaemfoco',
    'medicinabr',
    'eusoumedicina',
    'medicinavideos',

    # Sociedades e associações médicas
    'cfaborasil',           # CFM - Conselho Federal de Medicina
    'ambmedicos',           # AMB - Associação Médica Brasileira
    'cremespoficial',       # CREMESP
    'aaborj',               # Associação de Medicina RJ

    # Especialidades populares
    'dermatologiabr',
    'cardiologiabr',
    'nutrologia.br',
    'endocrinologia_br',
    'pediatriabrasil',
    'psiquiatriabrasil',
    'cirurgiaplasticabr',
    'ortopediaesporte',

    # Influenciadores médicos
    'drauziovarella',
    'draroblessa',
    'drfelipebarros',
    'drrogerioleite',
    'dritamati',
    'draanabrunetwerner',

    # Estética médica (alto valor)
    'harmonizacaofacial',
    'esteticamedica',
    'botoxbrasil',

    # Cursos e educação médica
    'sanarmed',
    'medbullets',
    'medway',
    'estrategiamedica',
    'residenciamedica',

    # Clínicas famosas
    'clinicaimeb',
    'clinicadavinci',
    'hospitalsiriolibanes',
    'hospitaleinsteinbr',
    'hospitalmoinhosdevento',

    # Congressos e eventos
    'cbed_oficial',         # Congresso Brasileiro de Dermatologia
    'sbcbrasil',            # Sociedade Brasileira de Cardiologia
    'abran_oficial',        # Nutrologia

    # Mais influenciadores
    'drdayanbrasil',
    'drdaniloprado',
    'drakarlathalita',
    'dramichellesouto',
    'drjulianapaes',
    'drfernandobrito',

    # Medicina funcional/integrativa
    'medicinafuncional',
    'medicintegrativa',
    'ortomolecular_br',

    # Nutrição médica
    'nutrologiaoficial',
    'nutricaoclinica',
    'nutricaoesportiva',

    # Ginecologia e obstetrícia
    'ginecologiabr',
    'obstetriciaemfoco',
    'febrasgo',

    # Oftalmologia
    'oftalmologiabr',
    'cbobr',                # Conselho Brasileiro de Oftalmologia

    # Mais contas
    'urologiabrasil',
    'neurologiabr',
    'oncologiabrasil',
    'reumatologiabr',
    'pneumologiabr',
    'nefrologiabr',
    'gastroenterologiabr',
    'hematologiabr',
    'anestesiologiabr',
    'patologiabr',
    'radiologiabr',
    'geriatriabr',
    'infectologiabr',
    'medicinadoesporte',
    'medicinadotrabalho',

    # Mais perfis de médicos conhecidos
    'dramiltonbrasil',
    'drbrunocolichio',
    'drciceromazza',
    'drfabiopinheiro',
    'drguidomartins',
]

# Estatísticas globais
STATS_GLOBAL = {
    'total_leads': 0,
    'contas_processadas': 0,
    'inicio': None,
    'erros': 0
}


def buscar_seguidores_conta(pipeline, conta: str, session_id: str, limite: int = 200):
    """Busca seguidores de uma conta específica"""
    logger.info(f"\n{'='*60}")
    logger.info(f"🔍 BUSCANDO SEGUIDORES DE @{conta}")
    logger.info(f"{'='*60}")

    try:
        stats = pipeline.run_followers(
            target_username=conta,
            session_id=session_id,
            max_followers=limite
        )

        STATS_GLOBAL['total_leads'] += stats.get('novos', 0)
        STATS_GLOBAL['contas_processadas'] += 1

        logger.info(f"\n📊 Resultado @{conta}:")
        logger.info(f"   - Médicos encontrados: {stats.get('total_filtered', 0)}")
        logger.info(f"   - Novos leads: {stats.get('novos', 0)}")
        logger.info(f"   - Atualizados: {stats.get('atualizados', 0)}")

        return stats

    except Exception as e:
        logger.error(f"❌ Erro ao buscar @{conta}: {e}")
        STATS_GLOBAL['erros'] += 1
        return None


def mostrar_estatisticas():
    """Mostra estatísticas globais da busca"""
    tempo_execucao = datetime.now() - STATS_GLOBAL['inicio']
    horas = tempo_execucao.total_seconds() / 3600

    print("\n" + "="*70)
    print("📈 ESTATÍSTICAS DA BUSCA CONTÍNUA")
    print("="*70)
    print(f"⏱️  Tempo de execução: {tempo_execucao}")
    print(f"👥 Total de leads encontrados: {STATS_GLOBAL['total_leads']}")
    print(f"📱 Contas processadas: {STATS_GLOBAL['contas_processadas']}")
    print(f"❌ Erros: {STATS_GLOBAL['erros']}")
    if horas > 0:
        print(f"📊 Média: {STATS_GLOBAL['total_leads']/horas:.0f} leads/hora")
    print("="*70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='MOTTIVME - Busca Contínua de Médicos no Instagram'
    )

    parser.add_argument('--session-id', '-s', required=True,
                       help='Cookie sessionid do Instagram')
    parser.add_argument('--limite-por-conta', '-l', type=int, default=200,
                       help='Limite de seguidores por conta (padrão: 200)')
    parser.add_argument('--intervalo', '-i', type=int, default=60,
                       help='Intervalo entre contas em segundos (padrão: 60)')
    parser.add_argument('--aleatorio', '-r', action='store_true',
                       help='Ordem aleatória das contas')
    parser.add_argument('--loop', action='store_true',
                       help='Reiniciar quando terminar todas as contas')

    args = parser.parse_args()

    # Importar e inicializar pipeline
    try:
        apify_module = import_module('apify-followers')
        ApifyPipeline = apify_module.ApifyPipeline
    except Exception as e:
        logger.error(f"Erro ao importar apify-followers: {e}")
        sys.exit(1)

    pipeline = ApifyPipeline('medico')

    STATS_GLOBAL['inicio'] = datetime.now()

    print("\n" + "="*70)
    print("🚀 MOTTIVME - BUSCA CONTÍNUA DE MÉDICOS")
    print("="*70)
    print(f"📋 Total de contas fonte: {len(CONTAS_MEDICAS)}")
    print(f"👥 Limite por conta: {args.limite_por_conta}")
    print(f"⏱️  Intervalo entre contas: {args.intervalo}s")
    print(f"🔄 Loop contínuo: {'Sim' if args.loop else 'Não'}")
    print("="*70)
    print("\n⚡ INICIANDO BUSCA... (Ctrl+C para parar)\n")

    # Lista de contas para processar
    contas = CONTAS_MEDICAS.copy()

    if args.aleatorio:
        random.shuffle(contas)

    ciclo = 1

    try:
        while True:
            logger.info(f"\n🔄 CICLO {ciclo} - Processando {len(contas)} contas")

            for i, conta in enumerate(contas, 1):
                logger.info(f"\n[{i}/{len(contas)}] Processando @{conta}...")

                buscar_seguidores_conta(
                    pipeline=pipeline,
                    conta=conta,
                    session_id=args.session_id,
                    limite=args.limite_por_conta
                )

                # Mostrar estatísticas a cada 5 contas
                if i % 5 == 0:
                    mostrar_estatisticas()

                # Intervalo entre contas (com variação aleatória)
                intervalo = args.intervalo + random.randint(-10, 30)
                logger.info(f"\n⏳ Aguardando {intervalo}s antes da próxima conta...")
                time.sleep(intervalo)

            if not args.loop:
                break

            ciclo += 1
            # Embaralhar para próximo ciclo
            random.shuffle(contas)
            logger.info(f"\n🔄 Reiniciando ciclo (aguardando 5 minutos)...")
            time.sleep(300)  # 5 minutos entre ciclos

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Busca interrompida pelo usuário")
    finally:
        mostrar_estatisticas()
        print("\n✅ Busca finalizada!")
        print(f"Total de médicos encontrados: {STATS_GLOBAL['total_leads']}")


if __name__ == '__main__':
    main()
