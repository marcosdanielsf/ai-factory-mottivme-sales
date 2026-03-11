#!/usr/bin/env python3
"""
CONTAS ALVO - Médicos + HOF + Dentistas
Contas grandes para extração de seguidores
"""

# TOP CONTAS - MÉDICOS (verificadas, públicas, 100k+)
MEDICOS_TOP = [
    'paulomuzy',           # 7.8M - Ortopedista, medicina esportiva
    'dr.fernando_lemos',   # 2.4M - Coloproctologista, Planeta Intestino
    'drjulianopimentel',   # 894K - Saúde e bem-estar
    'drgabrielalmeida',    # Grande - Saúde e qualidade de vida
    'zeballos59',          # Grande - Imunologista
    'dr.igorpadovesi',     # Grande - Ginecologista
]

# CONTAS CONGRESSOS MÉDICOS
CONGRESSOS_MEDICOS = [
    'congressosmedicosbr', # 85K - Congressos médicos
    'anamt_brasil',        # 12K - Medicina do Trabalho
    'congressociam',       # 52K - CIAM
    'xmedicbr',            # 7.4K - Congresso Goiás
]

# TOP CONTAS - HOF / HARMONIZAÇÃO FACIAL
HOF_TOP = [
    'igoorcostalves',      # 1.7M - Referência HOF, formou 30k profissionais
    'drviotto',            # 1M - Lentes dentais + HOF
    'drarobertanogueira',  # Grande - HOF São Paulo
    'drajackelinebrito',   # Grande - HOF premium
    'drbrunocamargo',      # Grande - HOF
    'dranatdornelas',      # Grande - Estética e HOF
]

# TOP CONTAS - DENTISTAS
DENTISTAS_TOP = [
    'paulobonavides',      # 4.6M - Tio Paulo, dentista influencer
    'dentistamusical',     # 549K - Dra Simone, odontopediatria
    'drviotto',            # 1M - Lentes de contato dental
]

# TODAS AS CONTAS ORDENADAS POR PRIORIDADE (maior audiência primeiro)
TODAS_CONTAS = [
    # Tier 1: Milhões de seguidores
    ('paulomuzy', 'medico', 7800000),
    ('paulobonavides', 'dentista', 4600000),
    ('dr.fernando_lemos', 'medico', 2400000),
    ('igoorcostalves', 'hof', 1700000),
    ('drviotto', 'dentista_hof', 1000000),
    ('drjulianopimentel', 'medico', 894000),
    ('dentistamusical', 'dentista', 549000),

    # Tier 2: Centenas de milhares
    ('congressosmedicosbr', 'congresso', 85000),
    ('congressociam', 'congresso', 52000),
    ('anamt_brasil', 'congresso', 12000),
    ('xmedicbr', 'congresso', 7400),

    # Tier 3: A verificar (provavelmente grandes)
    ('drgabrielalmeida', 'medico', 0),
    ('zeballos59', 'medico', 0),
    ('dr.igorpadovesi', 'medico', 0),
    ('drarobertanogueira', 'hof', 0),
    ('drajackelinebrito', 'hof', 0),
    ('drbrunocamargo', 'hof', 0),
    ('dranatdornelas', 'hof', 0),
]

# Keywords para filtrar seguidores relevantes
KEYWORDS_FILTRO = [
    # Médicos
    'dr.', 'dra.', 'médico', 'médica', 'medicina', 'crm',
    'dermatologista', 'cirurgião', 'cirurgiã', 'clínica',
    'nutrólogo', 'nutróloga', 'endocrinologista',
    'cardiologista', 'ortopedista', 'ginecologista',
    'oftalmologista', 'psiquiatra', 'neurologista',
    'oncologista', 'urologista', 'pediatra',
    # HOF / Harmonização
    'harmonização', 'hof', 'preenchimento', 'botox',
    'bioestimulador', 'fios de pdo', 'sculptra', 'radiesse',
    'ácido hialurônico', 'lipo de papada', 'rinomodelação',
    'md codes', 'bichectomia', 'skinbooster', 'estética facial',
    'rejuvenescimento', 'orofacial', 'toxina botulínica',
    # Dentistas
    'dentista', 'odontólogo', 'cro', 'odontologia',
    'ortodontia', 'implante', 'lente de contato dental',
    'faceta', 'clareamento', 'sorriso',
]

if __name__ == '__main__':
    print("=" * 60)
    print("CONTAS ALVO PARA SCRAPING")
    print("=" * 60)

    print("\n📊 TIER 1 - Milhões de seguidores:")
    for conta, nicho, seg in TODAS_CONTAS:
        if seg >= 500000:
            print(f"  @{conta} ({seg:,}) - {nicho}")

    print("\n📊 TIER 2 - Congressos:")
    for conta, nicho, seg in TODAS_CONTAS:
        if 'congresso' in nicho:
            print(f"  @{conta} ({seg:,}) - {nicho}")

    print("\n📊 TIER 3 - A verificar:")
    for conta, nicho, seg in TODAS_CONTAS:
        if seg == 0:
            print(f"  @{conta} - {nicho}")

    print(f"\n✅ Total: {len(TODAS_CONTAS)} contas")
    print(f"🔑 Keywords para filtro: {len(KEYWORDS_FILTRO)} termos")
