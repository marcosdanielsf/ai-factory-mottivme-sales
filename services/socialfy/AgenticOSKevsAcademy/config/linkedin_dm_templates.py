#!/usr/bin/env python3
"""
LinkedIn DM Templates - Mensagens para Prospecção B2B
=====================================================
Templates para connection requests e follow-up messages
"""

from typing import Optional
import random

# ============================================
# CONNECTION REQUEST NOTES (max 300 chars)
# ============================================
CONNECTION_TEMPLATES = [
    {
        "id": "conn_01",
        "name": "Interesse Genuíno",
        "message": """Oi {first_name}, vi que você é {title} na {company}. Tenho acompanhado o mercado de {industry} e adoraria conectar pra trocar ideias. Abraço!""",
        "variables": ["first_name", "title", "company", "industry"],
        "best_for": ["executivos", "c-level", "diretores"],
        "max_chars": 300
    },
    {
        "id": "conn_02",
        "name": "Conteúdo Hook",
        "message": """{first_name}, curti seu perfil! Trabalho com {specialty} e vejo que temos muito em comum. Vamos conectar e trocar experiências?""",
        "variables": ["first_name", "specialty"],
        "best_for": ["especialistas", "consultores"],
        "max_chars": 300
    },
    {
        "id": "conn_03",
        "name": "Direto ao Ponto",
        "message": """Oi {first_name}! Ajudo empresas de {industry} a {benefit}. Vi seu trabalho na {company} - acho que posso agregar. Conectamos?""",
        "variables": ["first_name", "industry", "benefit", "company"],
        "best_for": ["gerentes", "coordenadores"],
        "max_chars": 300
    },
    {
        "id": "conn_04",
        "name": "Networking Puro",
        "message": """{first_name}, expandindo minha rede no setor de {industry}. Seu perfil chamou atenção - seria ótimo conectar!""",
        "variables": ["first_name", "industry"],
        "best_for": ["qualquer perfil"],
        "max_chars": 300
    },
    {
        "id": "conn_05",
        "name": "Mutuo Interesse",
        "message": """Oi {first_name}! Vi que atua com {specialty}. Tenho interesse genuíno na área e adoraria aprender mais com sua experiência. Conectamos?""",
        "variables": ["first_name", "specialty"],
        "best_for": ["seniores", "especialistas"],
        "max_chars": 300
    }
]

# ============================================
# FOLLOW-UP MESSAGES (após conexão aceita)
# ============================================
FOLLOWUP_TEMPLATES = [
    {
        "id": "fu_01",
        "name": "Agradecimento + Sondagem",
        "message": """Oi {first_name}, obrigado por conectar! 🙏

Vi que você é {title} na {company}. Como está o cenário de {industry} por aí?

Tenho trabalhado com empresas do setor ajudando com {solution}. Se fizer sentido, adoraria trocar uma ideia.

Abs!""",
        "variables": ["first_name", "title", "company", "industry", "solution"],
        "timing": "1-2 dias após aceite"
    },
    {
        "id": "fu_02",
        "name": "Valor Primeiro",
        "message": """{first_name}, valeu pela conexão!

Notei que você atua com {specialty}. Recentemente criei um material sobre {topic} que talvez te interesse.

Quer que eu te envie? É gratuito e sem compromisso.

Abraço!""",
        "variables": ["first_name", "specialty", "topic"],
        "timing": "1-3 dias após aceite"
    },
    {
        "id": "fu_03",
        "name": "Abordagem Direta",
        "message": """Oi {first_name}!

Conectei porque minha empresa ajuda {target_audience} a {benefit}.

Vi que você é {title} na {company} - faz sentido uma call rápida de 15 min essa semana pra eu entender melhor seu cenário?

Sem compromisso!""",
        "variables": ["first_name", "target_audience", "benefit", "title", "company"],
        "timing": "2-3 dias após aceite"
    },
    {
        "id": "fu_04",
        "name": "Pergunta de Descoberta",
        "message": """{first_name}, obrigado por aceitar!

Tenho conversado com vários {title}s e notei que muitos enfrentam {pain_point}.

Isso também é uma realidade na {company}? Curioso pra entender seu cenário.

Abs!""",
        "variables": ["first_name", "title", "pain_point", "company"],
        "timing": "1-2 dias após aceite"
    },
    {
        "id": "fu_05",
        "name": "Soft Sell",
        "message": """Oi {first_name}!

Obrigado pela conexão. Vi que você lidera {specialty} na {company}.

Tenho ajudado empresas similares a {benefit} - resultados têm sido bem interessantes.

Se tiver 15 min essa semana, adoraria te mostrar como funciona. Interesse?""",
        "variables": ["first_name", "specialty", "company", "benefit"],
        "timing": "2-4 dias após aceite"
    }
]

# ============================================
# COLD OUTREACH (conexão + mensagem)
# ============================================
COLD_OUTREACH_TEMPLATES = [
    {
        "id": "cold_01",
        "name": "AIDA Sequence",
        "connection_note": """Oi {first_name}! Vi seu trabalho na {company} com {specialty}. Adoraria conectar e trocar experiências. Abs!""",
        "followup_message": """Oi {first_name}, obrigado por conectar!

Minha empresa tem ajudado {target_audience} a {benefit}. 

Recentemente ajudamos uma empresa similar à {company} a alcançar {result}.

Faz sentido uma conversa rápida pra eu entender se podemos ajudar vocês também?""",
        "variables": ["first_name", "company", "specialty", "target_audience", "benefit", "result"],
        "followup_delay_days": 2
    },
    {
        "id": "cold_02",
        "name": "Consultive Approach",
        "connection_note": """{first_name}, acompanho o mercado de {industry} e seu perfil chamou atenção. Vamos conectar?""",
        "followup_message": """Oi {first_name}!

Tenho estudado o mercado de {industry} e notei que muitas empresas estão enfrentando {pain_point}.

Como vocês na {company} têm lidado com isso?

Pergunto porque desenvolvemos uma solução específica pra esse problema. Se fizer sentido, posso te mostrar.""",
        "variables": ["first_name", "industry", "pain_point", "company"],
        "followup_delay_days": 3
    }
]

# ============================================
# NURTURING SEQUENCES
# ============================================
NURTURING_TEMPLATES = {
    "day_1": {
        "id": "nur_01",
        "message": """{first_name}, obrigado por conectar! 

Sem querer te vender nada agora - só queria agradecer e dizer que seu trabalho na {company} é inspirador.

Qualquer coisa que precisar, pode contar comigo.

Abs!"""
    },
    "day_7": {
        "id": "nur_07",
        "message": """Oi {first_name}!

Vi um artigo sobre {topic} essa semana e lembrei de você. Achei que poderia ser útil: [link]

O que você acha dessa tendência?"""
    },
    "day_14": {
        "id": "nur_14",
        "message": """{first_name}, tudo bem?

Tenho preparado um conteúdo sobre {topic} e gostaria da sua opinião. Você tem 5 min essa semana pra uma call rápida?

Sem compromisso - só quero ouvir o ponto de vista de quem está no mercado."""
    },
    "day_21": {
        "id": "nur_21",
        "message": """Oi {first_name}!

Lembra que conversamos sobre {topic}? 

Acabei de ajudar uma empresa similar à {company} a resolver {pain_point}. Os resultados foram bem interessantes.

Se quiser saber como, me avisa que te conto!"""
    }
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_connection_template(template_id: str = None, best_for: str = None) -> dict:
    """Retorna template de connection request"""
    if template_id:
        for t in CONNECTION_TEMPLATES:
            if t["id"] == template_id:
                return t
    
    if best_for:
        matching = [t for t in CONNECTION_TEMPLATES if best_for.lower() in str(t.get("best_for", [])).lower()]
        if matching:
            return random.choice(matching)
    
    return random.choice(CONNECTION_TEMPLATES)


def get_followup_template(template_id: str = None) -> dict:
    """Retorna template de follow-up message"""
    if template_id:
        for t in FOLLOWUP_TEMPLATES:
            if t["id"] == template_id:
                return t
    
    return random.choice(FOLLOWUP_TEMPLATES)


def get_cold_sequence(sequence_id: str = None) -> dict:
    """Retorna sequência completa de cold outreach"""
    if sequence_id:
        for t in COLD_OUTREACH_TEMPLATES:
            if t["id"] == sequence_id:
                return t
    
    return random.choice(COLD_OUTREACH_TEMPLATES)


def render_template(template: dict, variables: dict) -> str:
    """Renderiza template com variáveis"""
    # Determina qual campo usar (message, connection_note, etc)
    message = template.get("message") or template.get("connection_note") or ""
    
    for key, value in variables.items():
        message = message.replace(f"{{{key}}}", str(value or ""))
    
    return message.strip()


def truncate_connection_note(message: str, max_chars: int = 300) -> str:
    """Trunca mensagem de connection para limite de 300 chars"""
    if len(message) <= max_chars:
        return message
    
    # Trunca no último espaço antes do limite
    truncated = message[:max_chars-3]
    last_space = truncated.rfind(" ")
    if last_space > max_chars - 50:
        truncated = truncated[:last_space]
    
    return truncated + "..."


def extract_first_name(full_name: str) -> str:
    """Extrai primeiro nome, removendo títulos"""
    if not full_name:
        return ""
    
    # Remove títulos comuns
    titles = ["Dr.", "Dra.", "Prof.", "Eng.", "Arq.", "Sr.", "Sra.", "Mr.", "Mrs.", "Ms."]
    name = full_name
    for title in titles:
        name = name.replace(title, "").strip()
    
    return name.split()[0] if name else ""


def extract_company_from_headline(headline: str) -> Optional[str]:
    """Tenta extrair empresa do headline"""
    if not headline:
        return None
    
    # Padrões comuns: "Title at Company", "Title | Company", "Title @ Company"
    separators = [" at ", " @ ", " | ", " - ", " na ", " no "]
    
    for sep in separators:
        if sep in headline.lower():
            parts = headline.split(sep if sep == sep.lower() else sep.lower())
            if len(parts) >= 2:
                return parts[-1].strip()
    
    return None


def extract_title_from_headline(headline: str) -> Optional[str]:
    """Tenta extrair cargo do headline"""
    if not headline:
        return None
    
    separators = [" at ", " @ ", " | ", " - ", " na ", " no "]
    
    for sep in separators:
        if sep in headline.lower():
            parts = headline.split(sep if sep == sep.lower() else sep.lower())
            if len(parts) >= 2:
                return parts[0].strip()
    
    return headline[:50] if headline else None


# ============================================
# ICP SCORING KEYWORDS
# ============================================
ICP_POSITIVE_KEYWORDS = {
    "titles": [
        "ceo", "cto", "cfo", "cmo", "coo",
        "founder", "fundador", "co-founder",
        "diretor", "director", "head",
        "vp", "vice president", "vice-presidente",
        "gerente", "manager", "líder", "leader",
        "owner", "proprietário", "sócio", "partner"
    ],
    "industries": [
        "saas", "software", "tech", "tecnologia",
        "fintech", "healthtech", "edtech",
        "marketing", "vendas", "sales",
        "consultoria", "consulting"
    ],
    "company_size": [
        "startup", "scale-up", "scaleup",
        "série a", "series a", "série b", "series b"
    ]
}

ICP_NEGATIVE_KEYWORDS = {
    "titles": [
        "estagiário", "intern", "trainee",
        "estudante", "student", "freelancer",
        "desempregado", "unemployed", "buscando"
    ],
    "red_flags": [
        "mlm", "multinível", "renda extra",
        "trabalhe de casa", "ganhe dinheiro"
    ]
}


def calculate_icp_score(profile: dict) -> tuple[int, str]:
    """
    Calcula score ICP (0-100) baseado no perfil.
    Retorna (score, priority)
    """
    score = 50  # Base score
    
    headline = (profile.get("headline") or "").lower()
    title = (profile.get("title") or "").lower()
    company = (profile.get("company") or "").lower()
    
    combined_text = f"{headline} {title} {company}"
    
    # Positive scoring
    for keyword in ICP_POSITIVE_KEYWORDS["titles"]:
        if keyword in combined_text:
            score += 15
            break
    
    for keyword in ICP_POSITIVE_KEYWORDS["industries"]:
        if keyword in combined_text:
            score += 10
            break
    
    for keyword in ICP_POSITIVE_KEYWORDS["company_size"]:
        if keyword in combined_text:
            score += 5
            break
    
    # Negative scoring
    for keyword in ICP_NEGATIVE_KEYWORDS["titles"]:
        if keyword in combined_text:
            score -= 30
            break
    
    for keyword in ICP_NEGATIVE_KEYWORDS["red_flags"]:
        if keyword in combined_text:
            score -= 50
            break
    
    # Connection count bonus
    connections = profile.get("connections_count", 0)
    if connections > 500:
        score += 5
    elif connections < 50:
        score -= 20  # Likely fake profile
    
    # Clamp score
    score = max(0, min(100, score))
    
    # Determine priority
    if score >= 70:
        priority = "hot"
    elif score >= 50:
        priority = "warm"
    elif score >= 30:
        priority = "cold"
    else:
        priority = "skip"
    
    return score, priority


# ============================================
# EXAMPLE USAGE
# ============================================
if __name__ == "__main__":
    # Exemplo de lead
    lead = {
        "full_name": "João Silva",
        "headline": "CEO at TechStartup | SaaS | B2B",
        "company": "TechStartup",
        "title": "CEO",
        "industry": "Software"
    }
    
    # Extrair variáveis
    variables = {
        "first_name": extract_first_name(lead["full_name"]),
        "title": lead["title"],
        "company": lead["company"],
        "industry": lead["industry"],
        "specialty": "SaaS B2B"
    }
    
    # Gerar connection note
    template = get_connection_template()
    note = render_template(template, variables)
    note = truncate_connection_note(note)
    
    print("=" * 50)
    print("CONNECTION NOTE (max 300 chars):")
    print("=" * 50)
    print(note)
    print(f"\nChars: {len(note)}")
    
    # Calcular ICP score
    score, priority = calculate_icp_score(lead)
    print(f"\nICP Score: {score} ({priority})")
    print("=" * 50)
