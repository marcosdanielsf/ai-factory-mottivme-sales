#!/usr/bin/env python3
"""
Auth Middleware for AgenticOS API
=================================
Provides JWT validation and tenant isolation for FastAPI endpoints.

This module integrates with Supabase Auth to:
1. Validate JWT tokens from Authorization header
2. Extract user information from the token
3. Resolve tenant_id for multi-tenant data isolation
4. Enforce plan limits (max_leads, max_messages_per_day, etc)

Usage:
    from auth_middleware import get_current_user, get_current_tenant, TenantContext

    @app.get("/api/leads")
    async def list_leads(tenant: TenantContext = Depends(get_current_tenant)):
        # tenant.id, tenant.company_name, tenant.plan_limits available
        return {"tenant_id": tenant.id}
"""

import os
import logging
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import Depends, HTTPException, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from jwt import PyJWKClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("auth_middleware")

# =============================================================================
# CONFIGURATION
# =============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # Optional: for local validation

# Supabase JWKS URL for JWT validation
SUPABASE_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else None

# API keys that bypass JWT validation (for n8n webhooks, internal services)
INTERNAL_API_KEYS = [
    os.getenv("API_SECRET_KEY", "socialfy-secret-2024"),
    os.getenv("N8N_API_KEY"),  # Add n8n key if exists
]
INTERNAL_API_KEYS = [k for k in INTERNAL_API_KEYS if k]  # Remove None values

# Security scheme
security = HTTPBearer(auto_error=False)


# =============================================================================
# MODELS
# =============================================================================

class UserContext(BaseModel):
    """Authenticated user context"""
    id: str  # Supabase user UUID
    email: str
    role: str  # 'authenticated', 'service_role', etc
    metadata: Dict[str, Any] = {}
    
    class Config:
        extra = "allow"


class TenantContext(BaseModel):
    """Tenant context with plan limits"""
    id: str  # Tenant UUID
    user_id: str
    company_name: Optional[str] = None
    slug: Optional[str] = None
    plan: str = "free"
    plan_limits: Dict[str, Any] = {
        "max_leads": 100,
        "max_messages_per_day": 50,
        "max_accounts": 1,
        "features": ["basic_scraping"]
    }
    status: str = "active"
    settings: Dict[str, Any] = {}
    ghl_location_id: Optional[str] = None
    
    class Config:
        extra = "allow"

    def can_add_leads(self, current_count: int) -> bool:
        """Check if tenant can add more leads based on plan"""
        max_leads = self.plan_limits.get("max_leads", 100)
        return current_count < max_leads
    
    def has_feature(self, feature: str) -> bool:
        """Check if tenant has access to a feature"""
        features = self.plan_limits.get("features", [])
        return feature in features


# =============================================================================
# JWT VALIDATION
# =============================================================================

@lru_cache(maxsize=1)
def get_jwks_client():
    """Get cached JWKS client for JWT validation"""
    if not SUPABASE_JWKS_URL:
        return None
    return PyJWKClient(SUPABASE_JWKS_URL)


def validate_jwt_token(token: str) -> Dict[str, Any]:
    """
    Validate a Supabase JWT token.
    
    Returns decoded payload if valid, raises HTTPException if invalid.
    """
    try:
        # Option 1: Validate using JWKS (recommended)
        jwks_client = get_jwks_client()
        if jwks_client:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
            return payload
        
        # Option 2: Validate using shared secret (fallback)
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
            return payload
        
        # Option 3: FAIL if no validation method available
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: No JWT validation method available"
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"JWT validation error: {e}")
        raise HTTPException(status_code=401, detail="Token validation failed")


def is_internal_api_key(api_key: str) -> bool:
    """Check if the API key is a valid internal key"""
    return api_key in INTERNAL_API_KEYS


# =============================================================================
# SUPABASE CLIENT HELPERS
# =============================================================================

def get_tenant_by_user_id(user_id: str) -> Optional[Dict]:
    """Fetch tenant data from Supabase by user_id"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tenants",
            headers=headers,
            params={"user_id": f"eq.{user_id}", "select": "*"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data[0] if data else None
        else:
            logger.error(f"Failed to fetch tenant: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching tenant: {e}")
        return None


def create_tenant_for_user(user_id: str, email: str, company_name: str = None) -> Optional[Dict]:
    """Create a new tenant for a user (called during signup)"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Generate slug from company name or email
        slug_source = company_name or email.split("@")[0]
        slug = slug_source.lower().replace(" ", "-").replace("@", "-")[:50]
        
        tenant_data = {
            "user_id": user_id,
            "company_name": company_name or f"Empresa de {email}",
            "slug": slug,
            "plan": "free",
            "status": "active",
            "settings": {
                "timezone": "America/Sao_Paulo",
                "language": "pt-BR"
            }
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/tenants",
            headers=headers,
            json=tenant_data,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            return result[0] if isinstance(result, list) else result
        else:
            logger.error(f"Failed to create tenant: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error creating tenant: {e}")
        return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Fetch user data from Supabase auth"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        return None
        
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return None


# =============================================================================
# FASTAPI DEPENDENCIES
# =============================================================================

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_api_key: str = Header(None, alias="X-API-Key")
) -> UserContext:
    """
    Dependency to get the current authenticated user.
    
    Supports both:
    1. Bearer token (JWT from Supabase Auth)
    2. X-API-Key header (for internal services/n8n)
    
    Returns UserContext with user information.
    Raises HTTPException 401 if not authenticated.
    """
    
    # Option 1: Check X-API-Key for internal services
    if x_api_key and is_internal_api_key(x_api_key):
        logger.debug("Authenticated via internal API key")
        return UserContext(
            id="service",
            email="service@internal",
            role="service_role",
            metadata={"auth_method": "api_key"}
        )
    
    # Option 2: Check Bearer token
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    
    # Validate JWT
    payload = validate_jwt_token(token)
    
    # Extract user info from payload
    user_id = payload.get("sub")
    email = payload.get("email", "")
    role = payload.get("role", "authenticated")
    user_metadata = payload.get("user_metadata", {})
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
    
    return UserContext(
        id=user_id,
        email=email,
        role=role,
        metadata=user_metadata
    )


async def get_current_tenant(
    user: UserContext = Depends(get_current_user)
) -> TenantContext:
    """
    Dependency to get the current tenant context.
    
    Fetches tenant data from database based on authenticated user.
    Returns TenantContext with plan limits and settings.
    
    For service role (API keys), returns a special admin tenant.
    """
    
    # Service role gets admin access
    if user.role == "service_role":
        return TenantContext(
            id="admin",
            user_id="service",
            company_name="System Admin",
            plan="enterprise",
            plan_limits={
                "max_leads": 999999,
                "max_messages_per_day": 999999,
                "max_accounts": 999,
                "features": ["all"]
            },
            status="active"
        )
    
    # Fetch tenant from database
    tenant_data = get_tenant_by_user_id(user.id)
    
    if not tenant_data:
        # Auto-create tenant if doesn't exist (for existing users)
        logger.info(f"Creating tenant for user {user.id}")
        tenant_data = create_tenant_for_user(
            user_id=user.id,
            email=user.email,
            company_name=user.metadata.get("company_name")
        )
        
        if not tenant_data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create tenant. Please contact support."
            )
    
    # Check tenant status
    if tenant_data.get("status") == "suspended":
        raise HTTPException(
            status_code=403,
            detail="Your account is suspended. Please contact support."
        )
    
    return TenantContext(
        id=tenant_data.get("id"),
        user_id=user.id,
        company_name=tenant_data.get("company_name"),
        slug=tenant_data.get("slug"),
        plan=tenant_data.get("plan", "free"),
        plan_limits=tenant_data.get("plan_limits", {}),
        status=tenant_data.get("status", "active"),
        settings=tenant_data.get("settings", {}),
        ghl_location_id=tenant_data.get("ghl_location_id")
    )


async def get_optional_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_api_key: str = Header(None, alias="X-API-Key")
) -> Optional[TenantContext]:
    """
    Optional tenant dependency - returns None if not authenticated.
    Useful for endpoints that work both authenticated and anonymous.
    """
    try:
        user = await get_current_user(
            request=None,  # Not used in get_current_user
            credentials=credentials,
            x_api_key=x_api_key
        )
        return await get_current_tenant(user=user)
    except HTTPException:
        return None


# =============================================================================
# PLAN LIMIT CHECKING
# =============================================================================

def check_lead_limit(tenant: TenantContext, current_count: int):
    """
    Check if tenant can add more leads.
    Raises HTTPException 403 if limit reached.
    """
    max_leads = tenant.plan_limits.get("max_leads", 100)
    
    if current_count >= max_leads:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Lead limit reached",
                "message": f"Seu plano {tenant.plan} permite até {max_leads} leads. Faça upgrade para continuar.",
                "current": current_count,
                "limit": max_leads,
                "upgrade_url": "/pricing"
            }
        )


def check_message_limit(tenant: TenantContext, messages_today: int):
    """
    Check if tenant can send more messages today.
    Raises HTTPException 403 if limit reached.
    """
    max_messages = tenant.plan_limits.get("max_messages_per_day", 50)
    
    if messages_today >= max_messages:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Daily message limit reached",
                "message": f"Seu plano {tenant.plan} permite até {max_messages} mensagens/dia. Tente novamente amanhã.",
                "current": messages_today,
                "limit": max_messages,
                "upgrade_url": "/pricing"
            }
        )


def require_feature(tenant: TenantContext, feature: str):
    """
    Check if tenant has access to a specific feature.
    Raises HTTPException 403 if feature not available.
    """
    if not tenant.has_feature(feature) and "all" not in tenant.plan_limits.get("features", []):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Feature not available",
                "message": f"A feature '{feature}' não está disponível no plano {tenant.plan}.",
                "upgrade_url": "/pricing"
            }
        )


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_auth_header_for_supabase(user: UserContext) -> Dict[str, str]:
    """
    Get headers for Supabase requests that should be scoped to user's tenant.
    Uses service role but sets user context for RLS.
    """
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        # This header tells Supabase to execute RLS as this user
        "x-supabase-auth-user-id": user.id
    }


# =============================================================================
# TEST HELPER
# =============================================================================

if __name__ == "__main__":
    # Test JWT validation with a sample token
    import sys
    
    if len(sys.argv) > 1:
        token = sys.argv[1]
        try:
            payload = validate_jwt_token(token)
            print("✅ Token valid!")
            print(f"   User ID: {payload.get('sub')}")
            print(f"   Email: {payload.get('email')}")
            print(f"   Role: {payload.get('role')}")
        except Exception as e:
            print(f"❌ Token invalid: {e}")
    else:
        print("Usage: python auth_middleware.py <jwt_token>")
        print("\nConfiguration:")
        print(f"  SUPABASE_URL: {SUPABASE_URL[:30]}..." if SUPABASE_URL else "  SUPABASE_URL: Not set")
        print(f"  JWKS URL: {SUPABASE_JWKS_URL}")
        print(f"  Internal API keys configured: {len(INTERNAL_API_KEYS)}")
