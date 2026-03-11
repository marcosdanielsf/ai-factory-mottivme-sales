"""
Cenarios E2E - SOCIAL SELLER Instagram
=======================================
3 sub-fluxos completos:
1. Novo Seguidor -> social_seller_instagram -> scheduler -> concierge
2. Visita Sincera -> social_seller_instagram -> scheduler -> concierge
3. Gatilho Social -> social_seller_instagram -> scheduler -> concierge

Cada cenario cobre as etapas:
- Social Seller: Conexao -> Ativacao -> Qualificacao -> Transicao
- Scheduler: Coleta -> Pagamento -> Comprovante -> Agendamento -> Confirmacao
- Concierge: Pre-consulta -> Pos-consulta
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum
from datetime import datetime, timezone


class SocialSellerSubFlow(Enum):
    """Sub-fluxos do Social Seller Instagram"""
    NOVO_SEGUIDOR = "novo_seguidor"
    VISITA_SINCERA = "visita_sincera"
    GATILHO_SOCIAL = "gatilho_social"


class SocialSellerStage(Enum):
    """Etapas do Social Seller"""
    CONEXAO = "conexao"
    ATIVACAO = "ativacao"
    QUALIFICACAO = "qualificacao"
    TRANSICAO = "transicao"


class SchedulerStage(Enum):
    """Etapas do Scheduler"""
    COLETA = "coleta"
    PAGAMENTO = "pagamento"
    COMPROVANTE = "comprovante"
    AGENDAMENTO = "agendamento"
    CONFIRMACAO = "confirmacao"


class ConciergeStage(Enum):
    """Etapas do Concierge"""
    PRE_CONSULTA = "pre_consulta"
    POS_CONSULTA = "pos_consulta"


class LeadTemperature(Enum):
    """Temperatura do lead no contexto Social Seller"""
    ENGAGED = "engaged"           # Responde bem, interessado
    CURIOUS = "curious"           # Curioso mas cauteloso
    SKEPTICAL = "skeptical"       # Cetico, precisa convencer
    BUSY = "busy"                 # Ocupado, respostas rapidas
    PRICE_SENSITIVE = "price_sensitive"  # Preocupado com preco


@dataclass
class SocialSellerTestTurn:
    """Um turno de conversa no teste"""
    turn_number: int
    agent_mode: str                    # social_seller_instagram, scheduler, concierge
    stage: str                         # etapa dentro do modo
    lead_message: str                  # O que o lead diz
    expected_agent_behavior: str       # Comportamento esperado do agente
    expected_keywords: List[str]       # Palavras-chave que devem aparecer
    triggers_transition: bool = False  # Se esse turno deve triggerar transicao de modo
    target_mode: Optional[str] = None  # Modo alvo se houver transicao
    context_update: Dict = field(default_factory=dict)  # Dados coletados


@dataclass
class SocialSellerLeadProfile:
    """Perfil do lead para teste de Social Seller"""
    name: str
    instagram_handle: str
    occupation: str
    age: int
    bio_snippet: str                   # Trecho da bio para personalizacao
    recent_post_theme: str             # Tema de post recente (para gatilho social)
    pain_points: List[str]
    objections: List[str]
    temperature: LeadTemperature
    backstory: str

    def to_prompt_context(self) -> str:
        """Converte perfil em contexto para prompt do lead simulado"""
        return f"""
## PERFIL DO LEAD - INSTAGRAM

**Nome:** {self.name}
**Instagram:** @{self.instagram_handle}
**Idade:** {self.age} anos
**Profissao:** {self.occupation}
**Bio:** "{self.bio_snippet}"
**Tema de post recente:** {self.recent_post_theme}

**Dores:**
{chr(10).join(f"- {p}" for p in self.pain_points)}

**Possiveis objecoes:**
{chr(10).join(f"- {o}" for o in self.objections)}

**Temperatura:** {self.temperature.value}
**Historia:** {self.backstory}
"""


@dataclass
class SocialSellerTestScenario:
    """Cenario completo de teste para Social Seller"""
    name: str
    description: str
    sub_flow: SocialSellerSubFlow
    trigger_context: str               # Contexto do gatilho (follow, visita, interacao)

    # Configuracao do agente
    agent_name: str = "Julia Amare"
    agent_version: Optional[str] = None

    # Perfil do lead
    lead_profile: SocialSellerLeadProfile = None

    # Fluxo esperado
    initial_mode: str = "social_seller_instagram"
    expected_mode_sequence: List[str] = field(default_factory=lambda: [
        "social_seller_instagram", "scheduler", "concierge"
    ])
    expected_outcome: str = "appointment_confirmed"

    # Turnos de teste
    turns: List[SocialSellerTestTurn] = field(default_factory=list)

    # Config
    max_turns: int = 20
    timeout_seconds: int = 300

    # Metadados
    tags: List[str] = field(default_factory=list)
    priority: str = "high"  # high, medium, low
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def get_turn_by_number(self, number: int) -> Optional[SocialSellerTestTurn]:
        """Retorna turno especifico"""
        for turn in self.turns:
            if turn.turn_number == number:
                return turn
        return None

    def get_turns_by_mode(self, mode: str) -> List[SocialSellerTestTurn]:
        """Retorna todos os turnos de um modo"""
        return [t for t in self.turns if t.agent_mode == mode]

    def get_transition_turns(self) -> List[SocialSellerTestTurn]:
        """Retorna turnos que devem triggerar transicao"""
        return [t for t in self.turns if t.triggers_transition]


# =============================================================================
# PERFIS DE LEAD PARA SOCIAL SELLER
# =============================================================================

SOCIAL_SELLER_LEAD_PROFILES = {
    LeadTemperature.ENGAGED: SocialSellerLeadProfile(
        name="Carolina",
        instagram_handle="carol.wellness",
        occupation="Personal Trainer",
        age=42,
        bio_snippet="Mae de 2 | Fitness & Bem-estar | Acredito no poder da transformacao",
        recent_post_theme="Treino funcional para mulheres 40+",
        pain_points=[
            "Ondas de calor atrapalhando treinos",
            "Cansaco mesmo dormindo bem",
            "Dificuldade de ganho muscular",
            "Alteracoes de humor afetando clientes"
        ],
        objections=[],  # Lead engajado tem poucas objecoes
        temperature=LeadTemperature.ENGAGED,
        backstory="Personal trainer que percebeu mudancas no proprio corpo aos 40+. "
                  "Ja pesquisou sobre hormonios e esta aberta a tratamento. "
                  "Quer continuar sendo referencia para suas alunas."
    ),

    LeadTemperature.CURIOUS: SocialSellerLeadProfile(
        name="Fernanda",
        instagram_handle="ferfernandes.adv",
        occupation="Advogada",
        age=47,
        bio_snippet="Direito de Familia | Mae solo | Cafe e livros",
        recent_post_theme="Equilibrio vida profissional e pessoal",
        pain_points=[
            "Insonia frequente",
            "Ansiedade aumentando",
            "Pele ressecada",
            "Esquecimentos no trabalho"
        ],
        objections=[
            "Preciso entender melhor antes de decidir",
            "Hormonio nao da cancer?",
            "Minha agenda e muito apertada"
        ],
        temperature=LeadTemperature.CURIOUS,
        backstory="Advogada bem-sucedida mas sentindo os sintomas chegando. "
                  "Curiosa sobre tratamento mas cautelosa com saude. "
                  "Precisa de informacao para tomar decisao."
    ),

    LeadTemperature.SKEPTICAL: SocialSellerLeadProfile(
        name="Sandra",
        instagram_handle="sandra.natureba",
        occupation="Nutricionista",
        age=51,
        bio_snippet="Nutri funcional | Fitoterapia | Vida natural",
        recent_post_theme="Alimentacao anti-inflamatoria",
        pain_points=[
            "Sintomas de menopausa moderados",
            "Prefere abordagem natural",
            "Ja tentou fitohormonios"
        ],
        objections=[
            "Prefiro tratamento natural",
            "Hormonio sintetico tem muitos efeitos colaterais",
            "Minha amiga fez e nao funcionou",
            "Nao confio em medicos convencionais"
        ],
        temperature=LeadTemperature.SKEPTICAL,
        backstory="Nutricionista que prefere abordagem natural. "
                  "Cetica sobre reposicao hormonal mas sintomas piorando. "
                  "Precisa de abordagem diferenciada e argumentos cientificos."
    ),

    LeadTemperature.BUSY: SocialSellerLeadProfile(
        name="Patricia",
        instagram_handle="patimkt",
        occupation="Diretora de Marketing",
        age=45,
        bio_snippet="CMO | Mkt Digital | Speaker | Mao na massa",
        recent_post_theme="Produtividade e performance",
        pain_points=[
            "Ondas de calor em reunioes importantes",
            "Cansaco extremo",
            "Brain fog afetando performance"
        ],
        objections=[
            "Nao tenho tempo para consultas longas",
            "Precisa ser rapido e pratico"
        ],
        temperature=LeadTemperature.BUSY,
        backstory="Executiva super ocupada que valoriza eficiencia. "
                  "Quer resolver logo mas odeia perder tempo. "
                  "Se demorar muito, desiste."
    ),

    LeadTemperature.PRICE_SENSITIVE: SocialSellerLeadProfile(
        name="Marcia",
        instagram_handle="marcia.professora",
        occupation="Professora",
        age=49,
        bio_snippet="Educadora | Literatura | Mae de gemeos",
        recent_post_theme="Desafios da educacao publica",
        pain_points=[
            "Sintomas intensos de menopausa",
            "Ja gasta muito com suplementos",
            "Qualidade de vida caindo"
        ],
        objections=[
            "O valor e muito alto para uma consulta",
            "Meu plano cobre ginecologista",
            "Preciso parcelar",
            "Nao tenho certeza se vale o investimento"
        ],
        temperature=LeadTemperature.PRICE_SENSITIVE,
        backstory="Professora com salario limitado mas sintomas intensos. "
                  "Precisa entender o valor do tratamento especializado. "
                  "Aberta a parcelamento se convencida."
    )
}


# =============================================================================
# CENARIO 1: NOVO SEGUIDOR
# =============================================================================

def create_novo_seguidor_scenario() -> SocialSellerTestScenario:
    """
    Cenario: Lead seguiu o perfil do Instituto.
    Fluxo: social_seller -> scheduler -> concierge
    """

    lead = SOCIAL_SELLER_LEAD_PROFILES[LeadTemperature.ENGAGED]

    turns = [
        # =====================================================================
        # SOCIAL SELLER - ETAPA CONEXAO (Turnos 1-3)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=1,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="",  # Agente inicia (follow recebido)
            expected_agent_behavior="Agradecer follow de forma personalizada, mencionar algo do perfil",
            expected_keywords=["segui", "perfil", "legal", "amei"],
            context_update={"trigger": "new_follower", "lead_name": lead.name}
        ),
        SocialSellerTestTurn(
            turn_number=2,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="Oii! Obrigada! Adorei seu conteudo sobre menopausa, muito importante falar disso!",
            expected_agent_behavior="Responder com entusiasmo, mostrar interesse no trabalho dela",
            expected_keywords=["obrigada", "trabalho", "fitness", "mulheres"],
            context_update={"lead_responded": True, "initial_sentiment": "positive"}
        ),
        SocialSellerTestTurn(
            turn_number=3,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="Sim! Trabalho principalmente com mulheres 40+, a gente ve muita mudanca nessa fase",
            expected_agent_behavior="Criar conexao, validar expertise dela, preparar para qualificacao",
            expected_keywords=["40+", "mudancas", "fase", "incrivel"],
            context_update={"occupation_confirmed": "personal_trainer", "target_audience": "40+"}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA ATIVACAO (Turnos 4-5)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=4,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="Exatamente! Muitas alunas reclamam de cansaco, ondas de calor... E eu mesma to sentindo",
            expected_agent_behavior="Ativar interesse, mostrar que entende, introduzir tema hormonios",
            expected_keywords=["sintomas", "cansaco", "calor", "comum"],
            context_update={"pain_points_identified": ["cansaco", "ondas_de_calor"], "personal_experience": True}
        ),
        SocialSellerTestTurn(
            turn_number=5,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="Serio? Voce tambem? Achei que era so eu... afeta demais meu treino",
            expected_agent_behavior="Validar experiencia, criar empatia, preparar para qualificacao",
            expected_keywords=["normal", "nao esta sozinha", "treino", "hormonios"],
            context_update={"emotional_connection": True, "training_impact": True}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA QUALIFICACAO (Turnos 6-8)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=6,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="E voces fazem o que exatamente? Vi que e clinica de hormonios...",
            expected_agent_behavior="Explicar proposta de valor, qualificar interesse real",
            expected_keywords=["reposicao", "hormonal", "especialista", "personalizado"],
            context_update={"interest_level": "high", "asked_about_service": True}
        ),
        SocialSellerTestTurn(
            turn_number=7,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Interessante! E como funciona? Precisa de muitos exames?",
            expected_agent_behavior="Explicar processo de forma simples, reduzir fricao percebida",
            expected_keywords=["consulta", "exames", "simples", "Dr", "Dra"],
            context_update={"process_interest": True, "concerns": ["exames"]}
        ),
        SocialSellerTestTurn(
            turn_number=8,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Parece muito bom! Qual o valor da consulta?",
            expected_agent_behavior="Apresentar valor com confianca, preparar para transicao",
            expected_keywords=["investimento", "R$", "valor", "inclui"],
            context_update={"asked_price": True, "qualification_complete": True}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA TRANSICAO (Turnos 9-10)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=9,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.TRANSICAO.value,
            lead_message="Ta bom! Quero agendar sim! Como faco?",
            expected_agent_behavior="Confirmar interesse, iniciar transicao para scheduler",
            expected_keywords=["perfeito", "agendar", "vou te passar", "horarios"],
            triggers_transition=True,
            target_mode="scheduler",
            context_update={"ready_to_schedule": True, "transition_reason": "lead_requested_scheduling"}
        ),
        SocialSellerTestTurn(
            turn_number=10,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.TRANSICAO.value,
            lead_message="Beleza! Pode ser!",
            expected_agent_behavior="Handoff suave para modo scheduler",
            expected_keywords=["agora", "horarios", "disponibilidade"],
            context_update={"handoff_to_scheduler": True}
        ),

        # =====================================================================
        # SCHEDULER - ETAPA COLETA (Turnos 11-12)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=11,
            agent_mode="scheduler",
            stage=SchedulerStage.COLETA.value,
            lead_message="Pode ser na proxima semana, de preferencia de manha",
            expected_agent_behavior="Coletar preferencias, oferecer opcoes de horario",
            expected_keywords=["segunda", "terca", "horario", "manha"],
            context_update={"preferred_time": "manha", "preferred_week": "proxima"}
        ),
        SocialSellerTestTurn(
            turn_number=12,
            agent_mode="scheduler",
            stage=SchedulerStage.COLETA.value,
            lead_message="Terca as 9h ficaria perfeito pra mim!",
            expected_agent_behavior="Confirmar horario, iniciar processo de pagamento",
            expected_keywords=["terca", "9h", "reservar", "garantir"],
            context_update={"selected_date": "terca", "selected_time": "09:00"}
        ),

        # =====================================================================
        # SCHEDULER - ETAPA PAGAMENTO (Turnos 13-14)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=13,
            agent_mode="scheduler",
            stage=SchedulerStage.PAGAMENTO.value,
            lead_message="Como faco o pagamento?",
            expected_agent_behavior="Explicar opcoes de pagamento, enviar link/PIX",
            expected_keywords=["pix", "cartao", "link", "pagamento"],
            context_update={"payment_info_requested": True}
        ),
        SocialSellerTestTurn(
            turn_number=14,
            agent_mode="scheduler",
            stage=SchedulerStage.PAGAMENTO.value,
            lead_message="Vou fazer por PIX agora mesmo",
            expected_agent_behavior="Confirmar aguardando pagamento, orientar sobre comprovante",
            expected_keywords=["aguardo", "comprovante", "confirmar"],
            context_update={"payment_method": "pix", "payment_initiated": True}
        ),

        # =====================================================================
        # SCHEDULER - ETAPA COMPROVANTE (Turno 15)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=15,
            agent_mode="scheduler",
            stage=SchedulerStage.COMPROVANTE.value,
            lead_message="Pronto! Paguei. Segue o comprovante aqui",
            expected_agent_behavior="Confirmar recebimento do comprovante, validar pagamento",
            expected_keywords=["recebido", "confirmado", "obrigada", "pagamento"],
            context_update={"payment_confirmed": True, "receipt_received": True}
        ),

        # =====================================================================
        # SCHEDULER - ETAPA AGENDAMENTO + CONFIRMACAO (Turnos 16-17)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=16,
            agent_mode="scheduler",
            stage=SchedulerStage.AGENDAMENTO.value,
            lead_message="Perfeito! Entao ta marcado ne?",
            expected_agent_behavior="Confirmar agendamento completo, passar detalhes",
            expected_keywords=["confirmado", "terca", "9h", "endereco", "data"],
            context_update={"appointment_confirmed": True}
        ),
        SocialSellerTestTurn(
            turn_number=17,
            agent_mode="scheduler",
            stage=SchedulerStage.CONFIRMACAO.value,
            lead_message="Obrigada! Estou ansiosa!",
            expected_agent_behavior="Transicionar para concierge, passar contexto",
            expected_keywords=["ansiosa", "preparacao", "duvidas"],
            triggers_transition=True,
            target_mode="concierge",
            context_update={"handoff_to_concierge": True, "lead_sentiment": "excited"}
        ),

        # =====================================================================
        # CONCIERGE - ETAPA PRE-CONSULTA (Turnos 18-19)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=18,
            agent_mode="concierge",
            stage=ConciergeStage.PRE_CONSULTA.value,
            lead_message="Sim, tenho algumas duvidas sim!",
            expected_agent_behavior="Acolher duvidas, preparar para consulta, aumentar show rate",
            expected_keywords=["duvida", "consulta", "preparar", "normal"],
            context_update={"pre_consultation_started": True}
        ),
        SocialSellerTestTurn(
            turn_number=19,
            agent_mode="concierge",
            stage=ConciergeStage.PRE_CONSULTA.value,
            lead_message="O que devo levar? Preciso de jejum?",
            expected_agent_behavior="Orientar preparacao, confirmar presenca",
            expected_keywords=["exames", "jejum", "documentos", "levar"],
            context_update={"preparation_questions": ["jejum", "documentos"]}
        ),

        # =====================================================================
        # CONCIERGE - ETAPA POS-CONSULTA (Turno 20)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=20,
            agent_mode="concierge",
            stage=ConciergeStage.POS_CONSULTA.value,
            lead_message="Entendido! Obrigada por todas as informacoes!",
            expected_agent_behavior="Encerrar pre-consulta, confirmar lembrete, despedir",
            expected_keywords=["lembrete", "consulta", "ate", "qualquer duvida"],
            context_update={"pre_consultation_complete": True, "show_rate_optimized": True}
        )
    ]

    return SocialSellerTestScenario(
        name="social_seller_novo_seguidor_full_flow",
        description="Cenario completo: Novo seguidor engajado passa por todo fluxo ate confirmacao de consulta",
        sub_flow=SocialSellerSubFlow.NOVO_SEGUIDOR,
        trigger_context="Lead seguiu o perfil do Instituto no Instagram ha 24h",
        agent_name="Julia Amare",
        lead_profile=lead,
        initial_mode="social_seller_instagram",
        expected_mode_sequence=["social_seller_instagram", "scheduler", "concierge"],
        expected_outcome="appointment_confirmed",
        turns=turns,
        max_turns=20,
        tags=["social_seller", "novo_seguidor", "full_flow", "happy_path", "engaged_lead"],
        priority="high"
    )


# =============================================================================
# CENARIO 2: VISITA SINCERA (AgenticOS)
# =============================================================================

def create_visita_sincera_scenario() -> SocialSellerTestScenario:
    """
    Cenario: AgenticOS visitou perfil e identificou lead qualificado.
    Lead curioso que precisa de mais informacao antes de agendar.
    """

    lead = SOCIAL_SELLER_LEAD_PROFILES[LeadTemperature.CURIOUS]

    turns = [
        # =====================================================================
        # SOCIAL SELLER - ETAPA CONEXAO (Turnos 1-3)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=1,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="",  # Agente inicia apos visita sincera
            expected_agent_behavior="Iniciar contato mencionando algo especifico do perfil da advogada",
            expected_keywords=["perfil", "advogada", "direito", "familia", "equilibrio"],
            context_update={"trigger": "visita_sincera", "lead_name": lead.name}
        ),
        SocialSellerTestTurn(
            turn_number=2,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="Oi! Obrigada pelo interesse! Sim, tento manter o equilibrio mas nao e facil kkk",
            expected_agent_behavior="Criar empatia, mostrar que entende rotina corrida",
            expected_keywords=["equilibrio", "rotina", "dificil", "entendo"],
            context_update={"lead_responded": True, "pain_point_hint": "equilibrio"}
        ),
        SocialSellerTestTurn(
            turn_number=3,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="Com certeza! Mae solo entao, tudo dobrado kkk Mas vai dando um jeito",
            expected_agent_behavior="Validar esforco, criar conexao pessoal",
            expected_keywords=["admiro", "mae solo", "forca", "guerreira"],
            context_update={"family_status": "mae_solo", "emotional_connection": True}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA ATIVACAO (Turnos 4-6)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=4,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="Aham! E agora com 47 ta ficando mais dificil ainda, to super cansada",
            expected_agent_behavior="Ativar interesse ao conectar cansaco com hormonios",
            expected_keywords=["cansaco", "idade", "normal", "hormonios"],
            context_update={"age": 47, "main_symptom": "cansaco"}
        ),
        SocialSellerTestTurn(
            turn_number=5,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="Sera? Pensei que era so estresse do trabalho... To dormindo mal tambem",
            expected_agent_behavior="Conectar sintomas, despertar curiosidade sobre tratamento",
            expected_keywords=["sintomas", "sono", "perimenopausa", "comum"],
            context_update={"symptoms": ["cansaco", "insonia"], "awareness_level": "low"}
        ),
        SocialSellerTestTurn(
            turn_number=6,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="Hmm nunca tinha pensado nisso... Minha gineco nunca falou",
            expected_agent_behavior="Diferenciar abordagem especializada, gerar interesse",
            expected_keywords=["especialista", "hormonal", "diferente", "investigar"],
            context_update={"current_doctor": "gineco_generalist", "differentiation_needed": True}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA QUALIFICACAO (Turnos 7-9)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=7,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Interessante! Mas hormonio nao tem risco de cancer? Tenho medo disso",
            expected_agent_behavior="Contornar objecao com informacao, tranquilizar",
            expected_keywords=["estudos", "seguro", "acompanhamento", "mitos"],
            context_update={"objection": "medo_cancer", "needs_education": True}
        ),
        SocialSellerTestTurn(
            turn_number=8,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Entendi... E como funciona a consulta? E muito demorada? Minha agenda e apertada",
            expected_agent_behavior="Explicar processo, mostrar praticidade",
            expected_keywords=["consulta", "tempo", "pratico", "online"],
            context_update={"concern": "tempo", "schedule_preference": "pratico"}
        ),
        SocialSellerTestTurn(
            turn_number=9,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Ah tem online? Isso facilita muito! Qual o valor?",
            expected_agent_behavior="Apresentar valor, qualificar capacidade de pagamento",
            expected_keywords=["investimento", "valor", "R$", "inclui"],
            context_update={"prefers_online": True, "asked_price": True}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA TRANSICAO (Turnos 10-11)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=10,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.TRANSICAO.value,
            lead_message="Hmm e um investimento... Mas faz sentido pelo que voce explicou. Posso pensar e depois volto?",
            expected_agent_behavior="Validar reflexao mas criar urgencia leve, oferecer proximo passo",
            expected_keywords=["pensar", "normal", "vaga", "disponibilidade"],
            context_update={"decision_stage": "considering", "needs_gentle_push": True}
        ),
        SocialSellerTestTurn(
            turn_number=11,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.TRANSICAO.value,
            lead_message="Ta bom, vamos agendar entao! Prefiro online mesmo",
            expected_agent_behavior="Confirmar agendamento, transicionar para scheduler",
            expected_keywords=["otimo", "agendar", "online", "horarios"],
            triggers_transition=True,
            target_mode="scheduler",
            context_update={"ready_to_schedule": True, "consultation_type": "online"}
        ),

        # =====================================================================
        # SCHEDULER - COLETA + PAGAMENTO (Turnos 12-14)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=12,
            agent_mode="scheduler",
            stage=SchedulerStage.COLETA.value,
            lead_message="Pode ser a noite? Tipo 19h, depois do expediente",
            expected_agent_behavior="Verificar disponibilidade, oferecer opcoes noturnas",
            expected_keywords=["noite", "19h", "disponivel", "opcoes"],
            context_update={"preferred_time": "noite", "reason": "apos_expediente"}
        ),
        SocialSellerTestTurn(
            turn_number=13,
            agent_mode="scheduler",
            stage=SchedulerStage.COLETA.value,
            lead_message="Quinta as 19h ficaria perfeito!",
            expected_agent_behavior="Confirmar horario, iniciar pagamento",
            expected_keywords=["quinta", "19h", "reservar", "pagamento"],
            context_update={"selected_date": "quinta", "selected_time": "19:00"}
        ),
        SocialSellerTestTurn(
            turn_number=14,
            agent_mode="scheduler",
            stage=SchedulerStage.PAGAMENTO.value,
            lead_message="Posso parcelar no cartao?",
            expected_agent_behavior="Confirmar opcoes de parcelamento",
            expected_keywords=["sim", "parcelas", "cartao", "x"],
            context_update={"payment_preference": "cartao_parcelado"}
        ),

        # =====================================================================
        # SCHEDULER - COMPROVANTE + CONFIRMACAO (Turnos 15-17)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=15,
            agent_mode="scheduler",
            stage=SchedulerStage.COMPROVANTE.value,
            lead_message="Pronto! Fiz em 3x. Segue comprovante",
            expected_agent_behavior="Confirmar pagamento parcelado, agradecer",
            expected_keywords=["confirmado", "3x", "recebido", "obrigada"],
            context_update={"payment_confirmed": True, "installments": 3}
        ),
        SocialSellerTestTurn(
            turn_number=16,
            agent_mode="scheduler",
            stage=SchedulerStage.AGENDAMENTO.value,
            lead_message="Otimo! Entao ta tudo certo?",
            expected_agent_behavior="Confirmar agendamento, enviar detalhes da consulta online",
            expected_keywords=["confirmado", "quinta", "link", "online"],
            context_update={"appointment_confirmed": True, "type": "online"}
        ),
        SocialSellerTestTurn(
            turn_number=17,
            agent_mode="scheduler",
            stage=SchedulerStage.CONFIRMACAO.value,
            lead_message="Perfeito! Vou anotar aqui na agenda!",
            expected_agent_behavior="Transicionar para concierge",
            expected_keywords=["anotado", "lembrete", "preparacao"],
            triggers_transition=True,
            target_mode="concierge",
            context_update={"handoff_to_concierge": True}
        ),

        # =====================================================================
        # CONCIERGE - PRE + POS CONSULTA (Turnos 18-20)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=18,
            agent_mode="concierge",
            stage=ConciergeStage.PRE_CONSULTA.value,
            lead_message="Tenho que fazer algum exame antes?",
            expected_agent_behavior="Orientar sobre exames, preparacao para consulta",
            expected_keywords=["exames", "levar", "historico", "preparacao"],
            context_update={"preparation_started": True}
        ),
        SocialSellerTestTurn(
            turn_number=19,
            agent_mode="concierge",
            stage=ConciergeStage.PRE_CONSULTA.value,
            lead_message="Ok! Vou separar os exames recentes que tenho",
            expected_agent_behavior="Confirmar, orientar sobre link da consulta",
            expected_keywords=["perfeito", "link", "acesso", "minutos antes"],
            context_update={"exams_ready": True}
        ),
        SocialSellerTestTurn(
            turn_number=20,
            agent_mode="concierge",
            stage=ConciergeStage.POS_CONSULTA.value,
            lead_message="Entendido! Obrigada por toda atencao!",
            expected_agent_behavior="Encerrar com lembrete e disponibilidade",
            expected_keywords=["lembrete", "duvidas", "ate quinta", "estamos aqui"],
            context_update={"pre_consultation_complete": True}
        )
    ]

    return SocialSellerTestScenario(
        name="social_seller_visita_sincera_curious_lead",
        description="Cenario completo: Visita sincera AgenticOS com lead curioso que precisa de mais informacao",
        sub_flow=SocialSellerSubFlow.VISITA_SINCERA,
        trigger_context="AgenticOS visitou perfil da advogada e identificou como lead qualificado",
        agent_name="Julia Amare",
        lead_profile=lead,
        initial_mode="social_seller_instagram",
        expected_mode_sequence=["social_seller_instagram", "scheduler", "concierge"],
        expected_outcome="appointment_confirmed",
        turns=turns,
        max_turns=20,
        tags=["social_seller", "visita_sincera", "curious_lead", "online_consultation", "objection_handled"],
        priority="high"
    )


# =============================================================================
# CENARIO 3: GATILHO SOCIAL
# =============================================================================

def create_gatilho_social_scenario() -> SocialSellerTestScenario:
    """
    Cenario: Lead interagiu com post/story do Instituto.
    Lead price-sensitive que precisa entender valor antes de agendar.
    """

    lead = SOCIAL_SELLER_LEAD_PROFILES[LeadTemperature.PRICE_SENSITIVE]

    turns = [
        # =====================================================================
        # SOCIAL SELLER - ETAPA CONEXAO (Turnos 1-3)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=1,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="",  # Agente inicia (lead curtiu post sobre sintomas)
            expected_agent_behavior="Agradecer interacao no post, conectar com tema",
            expected_keywords=["curtiu", "post", "sintomas", "obrigada"],
            context_update={"trigger": "gatilho_social", "interaction": "like_post", "post_theme": "sintomas_menopausa"}
        ),
        SocialSellerTestTurn(
            turn_number=2,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="Oi! Sim, achei bem interessante! Estou sentindo varias coisas descritas ali",
            expected_agent_behavior="Demonstrar empatia, perguntar mais sobre sintomas",
            expected_keywords=["sentindo", "sintomas", "conte mais", "normal"],
            context_update={"lead_responded": True, "symptom_confirmation": True}
        ),
        SocialSellerTestTurn(
            turn_number=3,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.CONEXAO.value,
            lead_message="Ondas de calor principalmente, e um cansaco que nao passa mesmo dormindo",
            expected_agent_behavior="Validar sintomas, criar conexao",
            expected_keywords=["ondas de calor", "cansaco", "classico", "perimenopausa"],
            context_update={"symptoms": ["ondas_calor", "cansaco"], "symptom_severity": "moderate"}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA ATIVACAO (Turnos 4-6)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=4,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="Ja tentei varios suplementos mas nada resolve direito... gasto muito com isso",
            expected_agent_behavior="Conectar com frustacao de gasto sem resultado",
            expected_keywords=["suplementos", "investimento", "resultado", "tratamento certo"],
            context_update={"current_solution": "suplementos", "frustration": "gasto_sem_resultado"}
        ),
        SocialSellerTestTurn(
            turn_number=5,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="E mesmo! Ja gastei um absurdo com coisas que nao funcionam...",
            expected_agent_behavior="Ativar interesse mostrando diferenca de tratamento especializado",
            expected_keywords=["diferenca", "tratamento", "especializado", "raiz do problema"],
            context_update={"pain_point": "gasto_ineficaz", "readiness": "increasing"}
        ),
        SocialSellerTestTurn(
            turn_number=6,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.ATIVACAO.value,
            lead_message="E verdade ne... Mas esses tratamentos sao muito caros, plano nao cobre...",
            expected_agent_behavior="Validar preocupacao, preparar terreno para falar de valor",
            expected_keywords=["entendo", "investimento", "custo-beneficio", "longo prazo"],
            context_update={"objection": "preco", "objection_severity": "moderate"}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA QUALIFICACAO (Turnos 7-9)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=7,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Quanto custa a consulta? Quero saber se cabe no meu orcamento",
            expected_agent_behavior="Apresentar valor com confianca, explicar o que inclui",
            expected_keywords=["R$", "investimento", "inclui", "completo"],
            context_update={"asked_price": True, "price_sensitivity": "high"}
        ),
        SocialSellerTestTurn(
            turn_number=8,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Nossa e bastante... No meu plano a gineco e de graca. Qual a diferenca?",
            expected_agent_behavior="Diferenciar claramente, mostrar valor do especialista",
            expected_keywords=["especialista", "diferenca", "protocolo", "personalizado", "acompanhamento"],
            context_update={"comparison": "plano_saude", "needs_differentiation": True}
        ),
        SocialSellerTestTurn(
            turn_number=9,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.QUALIFICACAO.value,
            lead_message="Faz sentido... E da pra parcelar? Nao tenho esse valor todo agora",
            expected_agent_behavior="Confirmar parcelamento, reduzir barreira financeira",
            expected_keywords=["sim", "parcelar", "cartao", "cabe", "orcamento"],
            context_update={"parcelamento_interest": True, "barrier_reduced": True}
        ),

        # =====================================================================
        # SOCIAL SELLER - ETAPA TRANSICAO (Turnos 10-11)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=10,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.TRANSICAO.value,
            lead_message="Hmm em 6x fica melhor... Mas nao sei se vale mesmo a pena",
            expected_agent_behavior="Usar prova social, criar urgencia leve",
            expected_keywords=["pacientes", "resultados", "vaga", "teste"],
            context_update={"decision_stage": "hesitating", "needs_social_proof": True}
        ),
        SocialSellerTestTurn(
            turn_number=11,
            agent_mode="social_seller_instagram",
            stage=SocialSellerStage.TRANSICAO.value,
            lead_message="Ta bom, vou tentar! Vamos agendar em 6x mesmo",
            expected_agent_behavior="Confirmar decisao, transicionar para scheduler",
            expected_keywords=["otimo", "decisao", "agendar", "horarios"],
            triggers_transition=True,
            target_mode="scheduler",
            context_update={"ready_to_schedule": True, "payment_plan": "6x"}
        ),

        # =====================================================================
        # SCHEDULER - COLETA (Turnos 12-13)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=12,
            agent_mode="scheduler",
            stage=SchedulerStage.COLETA.value,
            lead_message="Pode ser sabado? Trabalho a semana toda",
            expected_agent_behavior="Verificar disponibilidade sabado, oferecer horarios",
            expected_keywords=["sabado", "disponivel", "horarios", "manha", "tarde"],
            context_update={"preferred_day": "sabado", "reason": "trabalho"}
        ),
        SocialSellerTestTurn(
            turn_number=13,
            agent_mode="scheduler",
            stage=SchedulerStage.COLETA.value,
            lead_message="Sabado as 10h ficaria bom!",
            expected_agent_behavior="Confirmar horario, iniciar pagamento",
            expected_keywords=["sabado", "10h", "reservar", "garantir"],
            context_update={"selected_date": "sabado", "selected_time": "10:00"}
        ),

        # =====================================================================
        # SCHEDULER - PAGAMENTO (Turnos 14-15)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=14,
            agent_mode="scheduler",
            stage=SchedulerStage.PAGAMENTO.value,
            lead_message="Manda o link pra pagar em 6x no cartao",
            expected_agent_behavior="Enviar link de pagamento parcelado",
            expected_keywords=["link", "6x", "cartao", "seguro"],
            context_update={"payment_method": "cartao_6x", "link_sent": True}
        ),
        SocialSellerTestTurn(
            turn_number=15,
            agent_mode="scheduler",
            stage=SchedulerStage.COMPROVANTE.value,
            lead_message="Paguei! Aqui o comprovante do cartao",
            expected_agent_behavior="Confirmar pagamento, agradecer confianca",
            expected_keywords=["confirmado", "aprovado", "obrigada", "confianca"],
            context_update={"payment_confirmed": True, "installments": 6}
        ),

        # =====================================================================
        # SCHEDULER - AGENDAMENTO + CONFIRMACAO (Turnos 16-17)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=16,
            agent_mode="scheduler",
            stage=SchedulerStage.AGENDAMENTO.value,
            lead_message="Fechado entao! Qual o endereco da clinica?",
            expected_agent_behavior="Confirmar agendamento, enviar endereco e orientacoes",
            expected_keywords=["confirmado", "sabado", "endereco", "clinica"],
            context_update={"appointment_confirmed": True, "address_sent": True}
        ),
        SocialSellerTestTurn(
            turn_number=17,
            agent_mode="scheduler",
            stage=SchedulerStage.CONFIRMACAO.value,
            lead_message="Ok anotei! Obrigada!",
            expected_agent_behavior="Transicionar para concierge",
            expected_keywords=["anotado", "preparacao", "lembrete"],
            triggers_transition=True,
            target_mode="concierge",
            context_update={"handoff_to_concierge": True}
        ),

        # =====================================================================
        # CONCIERGE - PRE E POS CONSULTA (Turnos 18-20)
        # =====================================================================
        SocialSellerTestTurn(
            turn_number=18,
            agent_mode="concierge",
            stage=ConciergeStage.PRE_CONSULTA.value,
            lead_message="Preciso levar alguma coisa especifica?",
            expected_agent_behavior="Orientar sobre preparacao, exames, documentos",
            expected_keywords=["exames", "recentes", "lista", "levar"],
            context_update={"preparation_questions": True}
        ),
        SocialSellerTestTurn(
            turn_number=19,
            agent_mode="concierge",
            stage=ConciergeStage.PRE_CONSULTA.value,
            lead_message="Entendi! Vou juntar tudo que tenho aqui de exames",
            expected_agent_behavior="Confirmar, aumentar expectativa positiva",
            expected_keywords=["perfeito", "consulta", "aguardamos", "transformacao"],
            context_update={"exams_gathered": True}
        ),
        SocialSellerTestTurn(
            turn_number=20,
            agent_mode="concierge",
            stage=ConciergeStage.POS_CONSULTA.value,
            lead_message="Obrigada! To animada, espero que de certo!",
            expected_agent_behavior="Encerrar positivamente, confirmar lembrete",
            expected_keywords=["animada", "certo", "lembrete", "ate sabado"],
            context_update={"pre_consultation_complete": True, "sentiment": "optimistic"}
        )
    ]

    return SocialSellerTestScenario(
        name="social_seller_gatilho_social_price_sensitive",
        description="Cenario completo: Gatilho social (like em post) com lead price-sensitive que precisa de parcelamento",
        sub_flow=SocialSellerSubFlow.GATILHO_SOCIAL,
        trigger_context="Lead curtiu post sobre sintomas de menopausa no Instagram",
        agent_name="Julia Amare",
        lead_profile=lead,
        initial_mode="social_seller_instagram",
        expected_mode_sequence=["social_seller_instagram", "scheduler", "concierge"],
        expected_outcome="appointment_confirmed",
        turns=turns,
        max_turns=20,
        tags=["social_seller", "gatilho_social", "price_sensitive", "parcelamento", "objection_handled"],
        priority="high"
    )


# =============================================================================
# LISTA DE TODOS OS CENARIOS
# =============================================================================

def get_all_social_seller_scenarios() -> List[SocialSellerTestScenario]:
    """Retorna todos os cenarios de teste do Social Seller"""
    return [
        create_novo_seguidor_scenario(),
        create_visita_sincera_scenario(),
        create_gatilho_social_scenario()
    ]


# Cenarios exportados para uso direto
SOCIAL_SELLER_SCENARIOS = get_all_social_seller_scenarios()


# =============================================================================
# FUNCOES AUXILIARES
# =============================================================================

def get_scenario_by_subflow(sub_flow: SocialSellerSubFlow) -> Optional[SocialSellerTestScenario]:
    """Busca cenario por sub-fluxo"""
    for scenario in SOCIAL_SELLER_SCENARIOS:
        if scenario.sub_flow == sub_flow:
            return scenario
    return None


def get_scenarios_by_tag(tag: str) -> List[SocialSellerTestScenario]:
    """Busca cenarios por tag"""
    return [s for s in SOCIAL_SELLER_SCENARIOS if tag in s.tags]


def get_scenario_summary() -> Dict:
    """Retorna resumo dos cenarios disponiveis"""
    return {
        "total_scenarios": len(SOCIAL_SELLER_SCENARIOS),
        "sub_flows": [s.sub_flow.value for s in SOCIAL_SELLER_SCENARIOS],
        "scenarios": [
            {
                "name": s.name,
                "sub_flow": s.sub_flow.value,
                "total_turns": len(s.turns),
                "mode_sequence": s.expected_mode_sequence,
                "lead_temperature": s.lead_profile.temperature.value if s.lead_profile else None,
                "tags": s.tags,
                "priority": s.priority
            }
            for s in SOCIAL_SELLER_SCENARIOS
        ]
    }


# =============================================================================
# MAIN - DEMO
# =============================================================================

if __name__ == "__main__":
    import json

    print("=" * 70)
    print("SOCIAL SELLER - E2E TEST SCENARIOS")
    print("=" * 70)

    summary = get_scenario_summary()
    print(f"\nTotal de cenarios: {summary['total_scenarios']}")
    print(f"Sub-fluxos: {', '.join(summary['sub_flows'])}")

    print("\n" + "-" * 70)
    print("DETALHES DOS CENARIOS:")
    print("-" * 70)

    for scenario in SOCIAL_SELLER_SCENARIOS:
        print(f"\n[{scenario.sub_flow.value.upper()}] {scenario.name}")
        print(f"   Descricao: {scenario.description}")
        print(f"   Lead: {scenario.lead_profile.name} ({scenario.lead_profile.temperature.value})")
        print(f"   Turnos: {len(scenario.turns)}")
        print(f"   Fluxo: {' -> '.join(scenario.expected_mode_sequence)}")
        print(f"   Tags: {', '.join(scenario.tags)}")

        transitions = scenario.get_transition_turns()
        print(f"   Transicoes: {len(transitions)}")
        for t in transitions:
            print(f"      - Turno {t.turn_number}: {t.agent_mode} -> {t.target_mode}")

    print("\n" + "=" * 70)
    print("EXEMPLO DE CONVERSA - NOVO SEGUIDOR (primeiros 5 turnos)")
    print("=" * 70)

    scenario = get_scenario_by_subflow(SocialSellerSubFlow.NOVO_SEGUIDOR)
    if scenario:
        for turn in scenario.turns[:5]:
            mode_stage = f"[{turn.agent_mode}/{turn.stage}]"
            print(f"\nTurno {turn.turn_number} {mode_stage}")
            if turn.lead_message:
                print(f"   LEAD: {turn.lead_message}")
            print(f"   AGENTE DEVE: {turn.expected_agent_behavior}")
            print(f"   KEYWORDS: {', '.join(turn.expected_keywords)}")
