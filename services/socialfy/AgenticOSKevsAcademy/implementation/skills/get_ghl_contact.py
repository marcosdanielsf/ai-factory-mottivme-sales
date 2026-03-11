"""
Skill: get_ghl_contact
======================
Busca contato completo no GHL e extrai informações importantes,
especialmente o username do Instagram.

Uso:
    from skills.get_ghl_contact import get_ghl_contact

    result = await get_ghl_contact(
        contact_id="abc123",
        location_id="loc_xyz",
        api_key="pit-xxx"
    )

    # result.data = {
    #     "contact_id": "abc123",
    #     "instagram_username": "dra.marilia.santos",
    #     "profile_photo": "https://...",
    #     "full_name": "Dra Marilia Santos",
    #     "tags": ["tag1", "tag2"],
    #     "source": "instagram",
    #     "ig_sid": "1386946543118614"
    # }

LIMITAÇÃO: Quando o GHL armazena o nome real (ex: "Dra Marcella Araujo")
em vez do username do Instagram no firstName, não é possível extrair o
username automaticamente. O igSid (Instagram Scoped ID) não pode ser
resolvido sem o Graph API token do Facebook/Instagram. Nesses casos,
o username precisa ser preenchido manualmente como custom field no GHL,
ou capturado no webhook do n8n quando a DM chega.
"""

import os
import httpx
from typing import Dict, Any, Optional

from . import skill, logger

# GHL API Config
GHL_API_URL = "https://services.leadconnectorhq.com"  # v2


def _get_ghl_headers(api_key: str) -> Dict[str, str]:
    """Headers para API GHL v2."""
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Version": "2021-07-28"
    }


def _is_instagram_contact(contact: Dict) -> bool:
    """Detecta se o contato veio do Instagram usando múltiplos sinais."""
    for attr_key in ("attributionSource", "lastAttributionSource"):
        attr = contact.get(attr_key) or {}
        medium = (attr.get("medium") or "").lower()
        source = (attr.get("source") or "").lower()
        if "instagram" in medium or "instagram" in source:
            return True
        if attr.get("igSid"):
            return True

    photo = (contact.get("profilePhoto") or "").lower()
    if "cdninstagram" in photo or "instagram.com" in photo:
        return True

    tags = contact.get("tags") or []
    for tag in tags:
        if "instagram" in (tag or "").lower():
            return True

    return False


def _extract_instagram_username(contact: Dict) -> Optional[str]:
    """
    Extrai o username do Instagram do contato.

    Prioridade:
    1. Custom field com 'instagram' no key (mais confiável)
    2. firstName sem espaços (quando é o username do IG)
    3. fullNameLowerCase sem espaços
    4. firstName com ponto ou underscore (padrão de username)
    """
    if not contact:
        return None

    # 1. Campo customizado 'instagram' (fonte mais confiável)
    custom_fields = contact.get("customFields") or []
    for field in custom_fields:
        if isinstance(field, dict):
            field_id = (field.get("id") or "").lower()
            field_key = (field.get("key") or "").lower()
            if "instagram" in field_id or "instagram" in field_key:
                value = field.get("value")
                if value:
                    return value.lstrip("@").strip().lower()

    # 2. Se é contato Instagram e firstName parece username
    is_ig = _is_instagram_contact(contact)

    if is_ig:
        first_name = contact.get("firstName") or ""
        full_name_lower = contact.get("fullNameLowerCase") or ""

        if first_name and " " not in first_name:
            return first_name.lower().strip()

        if full_name_lower and " " not in full_name_lower:
            return full_name_lower.strip()

    # 3. firstName com ponto ou underscore (padrão de username)
    first_name = contact.get("firstName") or ""
    if first_name and " " not in first_name and not first_name[0].isdigit():
        if "." in first_name or "_" in first_name:
            return first_name.lower().strip()

    return None


@skill(
    name="get_ghl_contact",
    description="Busca contato no GHL e extrai username do Instagram"
)
async def get_ghl_contact(
    contact_id: str,
    api_key: str,
    location_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Busca contato completo no GHL.

    Args:
        contact_id: ID do contato no GHL
        api_key: GHL API key (Private Integration Token)
        location_id: ID da location (opcional)

    Returns:
        Dict com dados do contato e username do Instagram extraído
    """
    if not contact_id:
        return {"error": "contact_id é obrigatório", "contact_id": None}

    if not api_key:
        return {"error": "api_key é obrigatório", "contact_id": contact_id}

    headers = _get_ghl_headers(api_key)
    url = f"{GHL_API_URL}/contacts/{contact_id}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(url, headers=headers)

            if response.status_code == 404:
                return {"error": "Contato não encontrado", "contact_id": contact_id, "status_code": 404}

            if response.status_code == 401:
                return {"error": "API key inválida ou sem permissão", "contact_id": contact_id, "status_code": 401}

            if response.status_code != 200:
                return {
                    "error": f"Erro na API GHL: {response.status_code}",
                    "contact_id": contact_id,
                    "status_code": response.status_code,
                    "response_text": response.text[:500]
                }

            data = response.json()
            contact = data.get("contact") or {}

            attribution = contact.get("attributionSource") or {}
            last_attribution = contact.get("lastAttributionSource") or {}

            instagram_username = _extract_instagram_username(contact)
            ig_sid = attribution.get("igSid") or last_attribution.get("igSid")
            is_ig = _is_instagram_contact(contact)

            result = {
                "contact_id": contact_id,
                "instagram_username": instagram_username,
                "is_instagram_contact": is_ig,
                "profile_photo": contact.get("profilePhoto"),
                "full_name": contact.get("firstName"),
                "last_name": contact.get("lastName"),
                "email": contact.get("email"),
                "phone": contact.get("phone"),
                "tags": contact.get("tags") or [],
                "source": attribution.get("medium") or last_attribution.get("medium"),
                "ig_sid": ig_sid,
                "country": contact.get("country"),
                "date_added": contact.get("dateAdded"),
                "custom_fields": contact.get("customFields") or [],
                "raw_attribution": attribution
            }

            if instagram_username:
                logger.info(f"Username Instagram extraído: @{instagram_username}")
            elif is_ig:
                logger.warning(
                    f"Contato Instagram sem username extraível: {contact_id} | "
                    f"firstName={contact.get('firstName')} | igSid={ig_sid} | "
                    f"Solução: adicionar username como custom field no GHL"
                )

            return result

        except httpx.TimeoutException:
            return {"error": "Timeout ao buscar contato no GHL", "contact_id": contact_id}
        except Exception as e:
            logger.error(f"Erro ao buscar contato: {e}", exc_info=True)
            return {"error": f"Erro: {str(e)}", "contact_id": contact_id}
