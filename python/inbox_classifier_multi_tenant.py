"""
🔥 MULTI-TENANT INBOX CLASSIFIER
Classifica leads de inbox do Instagram usando IA personalizada por tenant.

Integra com:
- Self-Improving System (migrations 001-004)
- Multi-Tenant Schema (migration 005)
- Instagram Profile Scraper (Gemini)
- Agent Conversations (para tracking)

Author: AI Factory V4 - MOTTIVME
Date: 2024-12-31
"""

import os
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import asyncio

# Supabase
from supabase import create_client, Client

# IA (Gemini/Claude)
import google.generativeai as genai

# Instagram Scraper
from instagram_profile_scraper_gemini import InstagramProfileScraperGemini


# ============================================
# DATA CLASSES
# ============================================

@dataclass
class TenantPersona:
    """Persona/ICP de um tenant"""
    id: str
    tenant_id: str
    version: int
    business_type: str
    target_audience: str
    product_service: str
    value_proposition: str
    main_pain_points: List[str]
    ideal_niches: List[str]
    ideal_job_titles: List[str]
    min_followers: int
    max_followers: int
    positive_keywords: List[str]
    negative_keywords: List[str]
    brand_voice: str
    message_style: str


@dataclass
class KnownContact:
    """Contato conhecido (whitelist)"""
    is_known: bool
    id: Optional[str] = None
    contact_type: Optional[str] = None
    auto_classify_as: Optional[str] = None
    skip_ai_analysis: bool = False
    notes: Optional[str] = None


@dataclass
class InstagramProfile:
    """Dados do perfil do Instagram"""
    username: str
    full_name: str
    bio: str
    followers_count: int
    following_count: int
    posts_count: int
    is_verified: bool
    is_business: bool
    category: Optional[str]
    website: Optional[str]
    recent_posts: List[Dict]


@dataclass
class LeadClassification:
    """Resultado da classificação de um lead"""
    classification: str  # "LEAD_HOT", "LEAD_WARM", "LEAD_COLD", "PESSOAL", "SPAM"
    icp_score: int  # 0-100
    confidence: float  # 0.0-1.0
    reasoning: str
    match_keywords: List[str]
    red_flags: List[str]
    qualification_signals: List[str]
    score_breakdown: Dict[str, int]
    suggested_response: str
    next_steps: str


# ============================================
# MULTI-TENANT INBOX CLASSIFIER
# ============================================

class InboxClassifierMultiTenant:
    """
    Classificador de leads multi-tenant.

    Cada tenant tem:
    - Persona/ICP próprio (versionado)
    - Whitelist de conhecidos
    - Configuração de IA personalizada
    """

    def __init__(
        self,
        tenant_slug: str,
        supabase_url: str = None,
        supabase_key: str = None,
        gemini_api_key: str = None
    ):
        """
        Args:
            tenant_slug: Slug do tenant (ex: "socialfy", "fitpro")
            supabase_url: URL do Supabase (ou usa env var)
            supabase_key: Key do Supabase (ou usa env var)
            gemini_api_key: API key do Gemini (ou usa env var)
        """
        self.tenant_slug = tenant_slug

        # Supabase
        self.supabase: Client = create_client(
            supabase_url or os.getenv("SUPABASE_URL"),
            supabase_key or os.getenv("SUPABASE_ANON_KEY")
        )

        # Gemini
        genai.configure(api_key=gemini_api_key or os.getenv("GEMINI_API_KEY"))
        self.ai_model = genai.GenerativeModel("gemini-2.0-flash-exp")

        # Instagram Scraper
        self.scraper = InstagramProfileScraperGemini()

        # Cache
        self.tenant_id: Optional[str] = None
        self.persona: Optional[TenantPersona] = None
        self.whitelist_cache: Dict[str, KnownContact] = {}


    async def initialize(self):
        """Carrega tenant e persona ativa"""
        # Buscar tenant por slug
        tenant_result = self.supabase.table("tenants").select("*").eq("slug", self.tenant_slug).single().execute()

        if not tenant_result.data:
            raise ValueError(f"Tenant '{self.tenant_slug}' não encontrado")

        self.tenant_id = tenant_result.data["id"]

        # Buscar persona ativa
        persona_result = self.supabase.rpc("get_active_persona", {"p_tenant_id": self.tenant_id}).execute()

        if not persona_result.data:
            raise ValueError(f"Nenhuma persona ativa para tenant '{self.tenant_slug}'")

        # Converter para dataclass
        persona_data = persona_result.data
        self.persona = TenantPersona(**persona_data)

        print(f"✅ Tenant '{self.tenant_slug}' inicializado")
        print(f"   Persona V{self.persona.version}: {self.persona.business_type}")


    async def classify_inbox_message(
        self,
        username: str,
        message: str,
        platform: str = "instagram"
    ) -> Tuple[LeadClassification, Optional[str]]:
        """
        Classifica uma mensagem recebida no inbox.

        Args:
            username: Username do remetente (sem @)
            message: Texto da mensagem
            platform: "instagram", "whatsapp", etc

        Returns:
            (classification, lead_id)
        """
        if not self.persona:
            await self.initialize()

        # 1. Checar whitelist
        known_contact = await self._check_whitelist(username, platform)

        if known_contact.is_known and known_contact.skip_ai_analysis:
            # É conhecido, não precisa scrape nem IA
            return LeadClassification(
                classification=known_contact.auto_classify_as or "PESSOAL",
                icp_score=0,
                confidence=1.0,
                reasoning=f"Contato conhecido: {known_contact.contact_type}",
                match_keywords=[],
                red_flags=[],
                qualification_signals=[],
                score_breakdown={},
                suggested_response=f"Resposta pessoal para {known_contact.contact_type}",
                next_steps=f"Ver notas: {known_contact.notes}"
            ), None

        # 2. Scrape profile do Instagram
        print(f"🔍 Scraping perfil: @{username}")
        profile = await self._scrape_profile(username)

        # 3. Classificar com IA usando a persona do tenant
        print(f"🤖 Classificando com IA (Persona V{self.persona.version})")
        classification = await self._classify_with_ai(profile, message)

        # 4. Salvar no banco
        lead_id = await self._save_classification(
            username=username,
            message=message,
            platform=platform,
            profile=profile,
            classification=classification,
            known_contact_id=known_contact.id if known_contact.is_known else None
        )

        print(f"✅ Lead salvo: {classification.classification} (Score: {classification.icp_score}/100)")

        return classification, lead_id


    async def _check_whitelist(self, username: str, platform: str) -> KnownContact:
        """Verifica se username está na whitelist do tenant"""
        # Cache
        cache_key = f"{platform}:{username}"
        if cache_key in self.whitelist_cache:
            return self.whitelist_cache[cache_key]

        # Buscar no banco
        result = self.supabase.rpc(
            "is_known_contact",
            {
                "p_tenant_id": self.tenant_id,
                "p_platform": platform,
                "p_username": username
            }
        ).execute()

        contact = KnownContact(**result.data)
        self.whitelist_cache[cache_key] = contact
        return contact


    async def _scrape_profile(self, username: str) -> InstagramProfile:
        """Faz scrape do perfil do Instagram"""
        profile_data = await self.scraper.scrape_profile(username)

        return InstagramProfile(
            username=profile_data.get("username", username),
            full_name=profile_data.get("full_name", ""),
            bio=profile_data.get("bio", ""),
            followers_count=profile_data.get("followers_count", 0),
            following_count=profile_data.get("following_count", 0),
            posts_count=profile_data.get("posts_count", 0),
            is_verified=profile_data.get("is_verified", False),
            is_business=profile_data.get("is_business", False),
            category=profile_data.get("category"),
            website=profile_data.get("website"),
            recent_posts=profile_data.get("recent_posts", [])
        )


    async def _classify_with_ai(
        self,
        profile: InstagramProfile,
        message: str
    ) -> LeadClassification:
        """
        Classifica lead usando IA com a persona do tenant.

        A IA recebe:
        - Persona do cliente
        - ICP (Ideal Customer Profile)
        - Keywords positivas/negativas
        - Tom de voz
        - Dados do perfil do lead
        - Mensagem enviada

        Retorna:
        - Classificação (HOT/WARM/COLD/PESSOAL/SPAM)
        - Score ICP (0-100)
        - Confiança (0-1)
        - Análise detalhada
        """

        # Montar contexto do negócio do tenant
        business_context = f"""
VOCÊ É UM CLASSIFICADOR DE LEADS PARA:
{self.persona.business_type}

PRODUTO/SERVIÇO VENDIDO:
{self.persona.product_service}

PÚBLICO-ALVO IDEAL:
{self.persona.target_audience}

PROPOSTA DE VALOR:
{self.persona.value_proposition}

DORES QUE RESOLVE:
{', '.join(self.persona.main_pain_points)}

ICP - IDEAL CUSTOMER PROFILE:
- Nichos ideais: {', '.join(self.persona.ideal_niches)}
- Cargos ideais: {', '.join(self.persona.ideal_job_titles)}
- Seguidores: {self.persona.min_followers:,} - {self.persona.max_followers:,}

KEYWORDS POSITIVAS (indicam fit):
{', '.join(self.persona.positive_keywords)}

KEYWORDS NEGATIVAS (indicam não-fit):
{', '.join(self.persona.negative_keywords)}

TOM DE VOZ DA MARCA:
{self.persona.brand_voice}

ESTILO DE COMUNICAÇÃO:
{self.persona.message_style}
"""

        # Dados do lead
        lead_context = f"""
LEAD PARA ANALISAR:

Username: @{profile.username}
Nome: {profile.full_name}
Bio: {profile.bio}
Seguidores: {profile.followers_count:,}
Seguindo: {profile.following_count:,}
Posts: {profile.posts_count}
Verificado: {'Sim' if profile.is_verified else 'Não'}
Conta Business: {'Sim' if profile.is_business else 'Não'}
Categoria: {profile.category or 'N/A'}
Website: {profile.website or 'N/A'}

MENSAGEM ENVIADA:
"{message}"
"""

        # Prompt final
        prompt = f"""
{business_context}

---

{lead_context}

---

TAREFA:

Analise este lead e retorne um JSON com:

1. **classification** (string): Classificação final
   - "LEAD_HOT" (score >= 80): Fit perfeito com ICP, alto potencial
   - "LEAD_WARM" (score 50-79): Fit parcial, precisa nurturing
   - "LEAD_COLD" (score 20-49): Baixo fit, nurturing longo
   - "PESSOAL" (score 0-19): Conhecido/amigo/família
   - "SPAM" (score 0): Spammer, bot, ou irrelevante

2. **icp_score** (int 0-100): Match com ICP
   - Niche match (30 pts): perfil é de um dos nichos ideais?
   - Follower range (20 pts): seguidores dentro do range?
   - Bio keywords (25 pts): bio tem keywords positivas?
   - Business signals (15 pts): tem site, é business account, posts profissionais?
   - Engagement (10 pts): ratio following/followers saudável?

3. **confidence** (float 0-1): Confiança na classificação
   - 0.9-1.0: Alta (dados claros)
   - 0.7-0.9: Média (alguns dados faltando)
   - 0.0-0.7: Baixa (perfil vago)

4. **reasoning** (string): Justificativa da classificação (2-3 frases)

5. **match_keywords** (array): Keywords positivas encontradas

6. **red_flags** (array): Keywords negativas ou sinais ruins encontrados

7. **qualification_signals** (array): Sinais de qualificação
   Exemplos: "tem website", "bio menciona resultados", "conta business"

8. **score_breakdown** (object): Breakdown do score
   {{
     "niche_match": 0-30,
     "follower_range": 0-20,
     "bio_keywords": 0-25,
     "business_signals": 0-15,
     "engagement": 0-10
   }}

9. **suggested_response** (string): Sugestão de resposta
   - Usar o tom: {self.persona.brand_voice}
   - Estilo: {self.persona.message_style}
   - Para LEAD_HOT: pitch direto
   - Para LEAD_WARM: pergunta consultiva
   - Para LEAD_COLD: nurturing educativo
   - Para PESSOAL: resposta amigável

10. **next_steps** (string): Próximos passos recomendados

REGRAS:
- Seja RIGOROSO: apenas leads que realmente se encaixam devem ser HOT
- IGNORE se for personal trainer/fitness e o tenant vende marketing
- IGNORE se for afiliado iniciante e o tenant busca empresas
- CONSIDERE a mensagem: se ela menciona o produto/serviço, aumenta score
- Se BIO for vazia/genérica, confidence baixa

RETORNE APENAS O JSON, SEM MARKDOWN:
"""

        # Chamar IA
        response = await self.ai_model.generate_content_async(prompt)

        # Parse JSON
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif result_text.startswith("```"):
            result_text = result_text.split("```")[1].strip()

        result = json.loads(result_text)

        # Converter para dataclass
        return LeadClassification(
            classification=result["classification"],
            icp_score=result["icp_score"],
            confidence=result["confidence"],
            reasoning=result["reasoning"],
            match_keywords=result.get("match_keywords", []),
            red_flags=result.get("red_flags", []),
            qualification_signals=result.get("qualification_signals", []),
            score_breakdown=result.get("score_breakdown", {}),
            suggested_response=result["suggested_response"],
            next_steps=result["next_steps"]
        )


    async def _save_classification(
        self,
        username: str,
        message: str,
        platform: str,
        profile: InstagramProfile,
        classification: LeadClassification,
        known_contact_id: Optional[str] = None
    ) -> str:
        """Salva lead classificado no banco"""

        lead_id = self.supabase.rpc(
            "save_classified_lead",
            {
                "p_tenant_id": self.tenant_id,
                "p_persona_version": self.persona.version,
                "p_platform": platform,
                "p_username": username,
                "p_message": message,
                "p_profile_data": asdict(profile),
                "p_ai_analysis": {
                    "reasoning": classification.reasoning,
                    "match_keywords": classification.match_keywords,
                    "red_flags": classification.red_flags,
                    "qualification_signals": classification.qualification_signals,
                    "suggested_response": classification.suggested_response,
                    "next_steps": classification.next_steps
                },
                "p_classification": classification.classification,
                "p_icp_score": classification.icp_score,
                "p_confidence": classification.confidence
            }
        ).execute()

        return lead_id.data


    async def bulk_classify_inbox(
        self,
        messages: List[Dict[str, str]],
        platform: str = "instagram"
    ) -> List[Tuple[LeadClassification, str]]:
        """
        Classifica múltiplas mensagens em batch.

        Args:
            messages: Lista de {"username": str, "message": str}
            platform: Plataforma

        Returns:
            Lista de (classification, lead_id)
        """
        results = []

        for msg in messages:
            try:
                classification, lead_id = await self.classify_inbox_message(
                    username=msg["username"],
                    message=msg["message"],
                    platform=platform
                )
                results.append((classification, lead_id))

                # Rate limiting (evitar ban do Instagram)
                await asyncio.sleep(2)

            except Exception as e:
                print(f"❌ Erro ao classificar @{msg['username']}: {e}")
                continue

        return results


# ============================================
# EXEMPLO DE USO
# ============================================

async def main():
    """Exemplo de uso do classifier multi-tenant"""

    # Inicializar classifier para tenant "socialfy"
    classifier = InboxClassifierMultiTenant(tenant_slug="socialfy")
    await classifier.initialize()

    # Classificar uma mensagem
    classification, lead_id = await classifier.classify_inbox_message(
        username="mariafitness",
        message="Oi! Vi seu perfil e adorei o conteúdo sobre marketing!"
    )

    print(f"""
    ========================================
    RESULTADO DA CLASSIFICAÇÃO
    ========================================

    Classificação: {classification.classification}
    Score ICP: {classification.icp_score}/100
    Confiança: {classification.confidence:.1%}

    Análise:
    {classification.reasoning}

    Keywords Match: {', '.join(classification.match_keywords)}
    Red Flags: {', '.join(classification.red_flags)}

    Resposta Sugerida:
    {classification.suggested_response}

    Próximos Passos:
    {classification.next_steps}

    Lead ID: {lead_id}
    ========================================
    """)

    # Classificar múltiplas mensagens
    messages = [
        {"username": "agenciamarketing", "message": "Seu conteúdo é incrível!"},
        {"username": "joaopersonal", "message": "Quer trocar seguidas?"},
        {"username": "empresatecnologia", "message": "Vamos conversar sobre parceria?"}
    ]

    results = await classifier.bulk_classify_inbox(messages)

    print(f"\n✅ {len(results)} leads classificados em batch")


if __name__ == "__main__":
    asyncio.run(main())
