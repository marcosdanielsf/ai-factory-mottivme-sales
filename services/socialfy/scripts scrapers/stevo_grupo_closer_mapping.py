#!/usr/bin/env python3
"""
MOTTIVME - Criar Grupo VIP com Closer via Stevo API

Mapping de Locations/Closers:
- Cada Location ID tem um número de closer associado
- O SDR (IA) agenda e o grupo é criado com o closer

Autor: Marcos Daniels - MOTTIVME
Data: 2026-01-11
"""

import requests
import json

# ============ CONFIGURAÇÕES ============
STEVO_BASE_URL = "https://smv2-2.stevo.chat"
STEVO_API_KEY = "1768108453277bwfTzN4uG8h9Hng5"
INSTANCE_NAME = "marcosdaniels"

# Mapping de Closers por Location ID
CLOSERS_MAPPING = {
    "sNwLyynZWP6jEtBy1ubf": {
        "location_name": "Dr. Luiz / Instituto Amar",
        "closer_number": "5518997096638",
        "sdr_agent": "hallen-notification",
        "sdr_name": "Isabella Delduco"
    },
    "Bgi2hFMgiLLoRlOO0K5b": {
        "location_name": "Marina & Gustavo Couto Atendimento",
        "closer_number": "551619453067",
        "sdr_agent": "marinacouto",
        "sdr_name": "Marina Couto"
    },
    "cd1uyzpJox6XPt4Vct8Y": {
        "location_name": "Marcos Daniel",
        "closer_number": "5511936180422",
        "sdr_agent": "marcosdaniels",
        "sdr_name": "Marcos Daniel"
    },
    "uEh9LDrdLpKH1oruwxZ4": {
        "location_name": "André Rosa",
        "closer_number": "5519085905623",
        "sdr_agent": "andre-rosa",
        "sdr_name": "André Rosa"
    },
    "mHuN6v75KQc3lwmBd6mV": {
        "location_name": "Milton e Adriana Financial",
        "closer_number": "551619081973",
        "sdr_agent": "milton",
        "sdr_name": "Milton"
    }
}


def formatar_numero(phone):
    """Remove +, parênteses, traços e espaços do número"""
    import re
    return re.sub(r'[^\d]', '', phone)


def criar_grupo(lead_nome, lead_numero, closer_numero, location_name):
    """
    Cria grupo WhatsApp com lead e closer
    """
    url = f"{STEVO_BASE_URL}/group/create"

    # Nome curto do lead para o grupo
    lead_primeiro_nome = lead_nome.split()[0] if lead_nome else "Cliente"
    location_short = location_name.split()[0] if location_name else "MOTTIVME"

    nome_grupo = f"MOTTIVME | {lead_primeiro_nome} + {location_short}"

    payload = {
        "instanceName": INSTANCE_NAME,
        "groupName": nome_grupo,
        "participants": [
            lead_numero,
            closer_numero
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "apikey": STEVO_API_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        data = response.json()

        if data.get("message") == "success":
            grupo_jid = data["data"]["jid"]
            print(f"✅ Grupo criado: {nome_grupo}")
            print(f"   JID: {grupo_jid}")
            return {"success": True, "jid": grupo_jid, "nome": nome_grupo}
        else:
            print(f"❌ Erro ao criar grupo: {data}")
            return {"success": False, "error": data}

    except Exception as e:
        print(f"❌ Exceção ao criar grupo: {e}")
        return {"success": False, "error": str(e)}


def enviar_mensagem_grupo(grupo_jid, mensagem):
    """Envia mensagem em um grupo"""
    url = f"{STEVO_BASE_URL}/send/text"

    payload = {
        "instanceName": INSTANCE_NAME,
        "number": grupo_jid,
        "text": mensagem
    }

    headers = {
        "Content-Type": "application/json",
        "apikey": STEVO_API_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        data = response.json()

        if data.get("message") == "success":
            msg_id = data["data"]["Info"]["ID"]
            print(f"✅ Mensagem enviada (ID: {msg_id})")
            return True
        else:
            print(f"❌ Erro ao enviar mensagem: {data}")
            return False

    except Exception as e:
        print(f"❌ Exceção ao enviar mensagem: {e}")
        return False


def gerar_mensagem_apresentacao(lead_nome, location_name, sdr_nome):
    """Gera mensagem de apresentação do grupo"""
    return f"""🎯 *GRUPO EXCLUSIVO MOTTIVME*

Olá *{lead_nome}*! 👋

Criei este grupo para facilitar nossa comunicação.

Tudo será conduzido pelo time *{location_name}*.

A *{sdr_nome}* te agendou e você está em boas mãos!

Qualquer dúvida, podem usar o grupo. 🚀"""


def fluxo_completo(lead_nome, lead_phone, location_id, sdr_nome):
    """
    Executa fluxo completo baseado no Location ID do lead

    Args:
        lead_nome: Nome do lead
        lead_phone: Telefone do lead (qualquer formato)
        location_id: Location ID do GHL
        sdr_nome: Nome do SDR que agendou

    Returns:
        dict: Resultado da operação
    """
    print("=" * 50)
    print("🚀 MOTTIVME - Fluxo Grupo VIP")
    print("=" * 50)

    # Buscar closer pelo location_id
    closer_data = CLOSERS_MAPPING.get(location_id)

    if not closer_data:
        print(f"❌ Location ID não encontrado: {location_id}")
        return {"success": False, "error": "Location ID não mapeado"}

    lead_numero = formatar_numero(lead_phone)
    closer_numero = closer_data["closer_number"]
    location_name = closer_data["location_name"]

    print(f"Lead: {lead_nome} ({lead_numero})")
    print(f"Location: {location_name}")
    print(f"SDR: {sdr_nome}")
    print(f"Closer: {closer_numero}")
    print()

    # 1. Criar grupo
    print("📝 Passo 1: Criando grupo...")
    resultado_grupo = criar_grupo(
        lead_nome=lead_nome,
        lead_numero=lead_numero,
        closer_numero=closer_numero,
        location_name=location_name
    )

    if not resultado_grupo.get("success"):
        return {"success": False, "step": "criar_grupo", "error": resultado_grupo.get("error")}

    grupo_jid = resultado_grupo["jid"]

    # 2. Gerar mensagem de apresentação
    print()
    print("📝 Passo 2: Gerando mensagem de apresentação...")
    mensagem = gerar_mensagem_apresentacao(
        lead_nome=lead_nome,
        location_name=location_name,
        sdr_nome=sdr_nome
    )

    # 3. Enviar mensagem no grupo
    print()
    print("📝 Passo 3: Enviando mensagem no grupo...")
    resultado_msg = enviar_mensagem_grupo(grupo_jid, mensagem)

    if not resultado_msg:
        return {"success": False, "step": "enviar_mensagem", "error": "Falha ao enviar"}

    print()
    print("=" * 50)
    print("✅ FLUXO CONCLUÍDO COM SUCESSO!")
    print(f"   Grupo: {resultado_grupo['nome']}")
    print(f"   JID: {grupo_jid}")
    print("=" * 50)

    return {
        "success": True,
        "grupo_nome": resultado_grupo["nome"],
        "grupo_jid": grupo_jid,
        "closer_numero": closer_numero,
        "location_name": location_name
    }


# ============ FUNÇÃO PARA N8N/GHL WEBHOOK ============
def processar_webhook_ghl(webhook_body):
    """
    Processa webhook do GHL e cria grupo VIP

    Esperado no webhook_body:
    {
        "first_name": "Nome",
        "phone": "+5511999999999",
        "location": {"id": "sNwLyynZWP6jEtBy1ubf"},
        "customData": {"agente_ia": "hallen-notification"}
    }
    """
    lead_nome = webhook_body.get("first_name", "Cliente")
    lead_phone = webhook_body.get("phone", "")
    location_id = webhook_body.get("location", {}).get("id")
    agente_ia = webhook_body.get("customData", {}).get("agente_ia")

    # Buscar nome do SDR
    sdr_nome = "SDR"
    for loc_id, data in CLOSERS_MAPPING.items():
        if data["sdr_agent"] == agente_ia:
            sdr_nome = data["sdr_name"]
            break

    return fluxo_completo(
        lead_nome=lead_nome,
        lead_phone=lead_phone,
        location_id=location_id,
        sdr_nome=sdr_nome
    )


# ============ MAIN ============
if __name__ == "__main__":
    import sys

    # Exemplo de uso via linha de comando
    if len(sys.argv) > 3:
        lead_nome = sys.argv[1]
        lead_phone = sys.argv[2]
        location_id = sys.argv[3]
        sdr_nome = sys.argv[4] if len(sys.argv) > 4 else "SDR"
    else:
        # Teste com valores padrão
        lead_nome = "Kelly Cristina"
        lead_phone = "+5518996146703"
        location_id = "sNwLyynZWP6jEtBy1ubf"  # Dr. Luiz
        sdr_nome = "Isabella Delduco"

    resultado = fluxo_completo(
        lead_nome=lead_nome,
        lead_phone=lead_phone,
        location_id=location_id,
        sdr_nome=sdr_nome
    )
