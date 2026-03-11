#!/usr/bin/env python3
"""
Auth Routes for AgenticOS API
=============================
FastAPI router with authentication endpoints.

Endpoints:
- POST /api/auth/signup - Create new user + tenant
- POST /api/auth/login - Login and get JWT token
- GET /api/auth/me - Get current user profile
- PATCH /api/auth/me - Update user profile
- GET /api/auth/tenant - Get tenant details
- PATCH /api/auth/tenant - Update tenant settings

Usage in api_server.py:
    from auth_routes import auth_router
    app.include_router(auth_router)
"""

import os
import logging
import requests
from typing import Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field, EmailStr
from dotenv import load_dotenv

# Local imports
from auth_middleware import (
    get_current_user,
    get_current_tenant,
    UserContext,
    TenantContext,
    create_tenant_for_user
)

load_dotenv()

logger = logging.getLogger("auth_routes")

# =============================================================================
# CONFIGURATION
# =============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# =============================================================================
# MODELS
# =============================================================================

class SignupRequest(BaseModel):
    """Request body for user signup"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: Optional[str] = None
    full_name: Optional[str] = None

class SignupResponse(BaseModel):
    """Response for successful signup"""
    success: bool
    message: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    email: Optional[str] = None
    access_token: Optional[str] = None

class LoginRequest(BaseModel):
    """Request body for login"""
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    """Response for successful login"""
    success: bool
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class UserProfileResponse(BaseModel):
    """Current user profile"""
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: Optional[str] = None
    tenant: Optional[Dict[str, Any]] = None

class UpdateProfileRequest(BaseModel):
    """Request to update user profile"""
    full_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TenantResponse(BaseModel):
    """Tenant details"""
    id: str
    company_name: Optional[str] = None
    slug: Optional[str] = None
    plan: str
    plan_limits: Dict[str, Any]
    status: str
    settings: Dict[str, Any]
    created_at: Optional[str] = None

class UpdateTenantRequest(BaseModel):
    """Request to update tenant settings"""
    company_name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class RefreshTokenRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str

class PasswordResetRequest(BaseModel):
    """Request for password reset"""
    email: EmailStr


# =============================================================================
# ROUTER
# =============================================================================

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def supabase_auth_request(endpoint: str, method: str = "POST", data: Dict = None, token: str = None):
    """Make request to Supabase Auth API"""
    url = f"{SUPABASE_URL}/auth/v1/{endpoint}"
    
    headers = {
        "apikey": SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json"
    }
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code >= 400:
            error_data = response.json() if response.text else {"message": "Unknown error"}
            logger.error(f"Supabase Auth error: {response.status_code} - {error_data}")
            return {"error": error_data, "status": response.status_code}
        
        return response.json() if response.text else {}
        
    except Exception as e:
        logger.error(f"Supabase Auth request failed: {e}")
        return {"error": str(e)}


def supabase_admin_request(endpoint: str, method: str = "GET", data: Dict = None):
    """Make admin request to Supabase (uses service role key)"""
    url = f"{SUPABASE_URL}/auth/v1/admin/{endpoint}"
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code >= 400:
            error_data = response.json() if response.text else {"message": "Unknown error"}
            return {"error": error_data, "status": response.status_code}
        
        return response.json() if response.text else {}
        
    except Exception as e:
        logger.error(f"Supabase Admin request failed: {e}")
        return {"error": str(e)}


def get_tenant_from_db(tenant_id: str) -> Optional[Dict]:
    """Fetch full tenant data from database"""
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tenants",
            headers=headers,
            params={"id": f"eq.{tenant_id}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data[0] if data else None
        return None
    except Exception as e:
        logger.error(f"Error fetching tenant: {e}")
        return None


def update_tenant_in_db(tenant_id: str, updates: Dict) -> Optional[Dict]:
    """Update tenant in database"""
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/tenants",
            headers=headers,
            params={"id": f"eq.{tenant_id}"},
            json=updates,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data[0] if data else None
        return None
    except Exception as e:
        logger.error(f"Error updating tenant: {e}")
        return None


# =============================================================================
# ENDPOINTS
# =============================================================================

@auth_router.post("/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
    """
    Create a new user account and associated tenant.
    
    This endpoint:
    1. Creates user in Supabase Auth
    2. Creates tenant record automatically (via database trigger)
    3. Returns access token for immediate use
    
    The database trigger `handle_new_user()` automatically creates
    the tenant when a new user is inserted in auth.users.
    """
    logger.info(f"Signup attempt for: {request.email}")
    
    # Build user metadata
    user_metadata = {}
    if request.company_name:
        user_metadata["company_name"] = request.company_name
    if request.full_name:
        user_metadata["full_name"] = request.full_name
    
    # Create user in Supabase Auth
    result = supabase_auth_request("signup", data={
        "email": request.email,
        "password": request.password,
        "data": user_metadata  # This goes to user_metadata
    })
    
    if "error" in result:
        error_msg = result.get("error", {})
        if isinstance(error_msg, dict):
            error_msg = error_msg.get("message", error_msg.get("msg", "Signup failed"))
        raise HTTPException(status_code=400, detail=str(error_msg))
    
    user = result.get("user", {})
    user_id = user.get("id")
    session = result.get("session", {})
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Note: Tenant is created automatically by database trigger
    # But if you need to do it manually (trigger not working):
    # tenant = create_tenant_for_user(user_id, request.email, request.company_name)
    
    logger.info(f"✅ User created: {user_id}")
    
    return SignupResponse(
        success=True,
        message="Conta criada com sucesso! Verifique seu email para confirmar.",
        user_id=user_id,
        email=request.email,
        access_token=session.get("access_token")
    )


@auth_router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login with email and password.
    
    Returns JWT access token and refresh token.
    The access token should be used in the Authorization header
    for subsequent authenticated requests.
    """
    logger.info(f"Login attempt for: {request.email}")
    
    result = supabase_auth_request("token", data={
        "email": request.email,
        "password": request.password,
        "grant_type": "password"
    })
    
    if "error" in result:
        error_msg = result.get("error", {})
        if isinstance(error_msg, dict):
            error_msg = error_msg.get("message", "Invalid credentials")
        raise HTTPException(status_code=401, detail=str(error_msg))
    
    logger.info(f"✅ Login successful: {request.email}")
    
    return LoginResponse(
        success=True,
        access_token=result.get("access_token"),
        refresh_token=result.get("refresh_token"),
        expires_in=result.get("expires_in", 3600),
        user=result.get("user", {})
    )


@auth_router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh the access token using a refresh token.
    """
    result = supabase_auth_request("token", data={
        "refresh_token": request.refresh_token,
        "grant_type": "refresh_token"
    })
    
    if "error" in result:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    return {
        "access_token": result.get("access_token"),
        "refresh_token": result.get("refresh_token"),
        "expires_in": result.get("expires_in", 3600)
    }


@auth_router.post("/logout")
async def logout(user: UserContext = Depends(get_current_user)):
    """
    Logout the current user (invalidates the token).
    """
    # Supabase handles token invalidation on client side
    # Server-side we just acknowledge the logout
    logger.info(f"User logged out: {user.email}")
    
    return {"success": True, "message": "Logged out successfully"}


@auth_router.post("/password-reset")
async def request_password_reset(request: PasswordResetRequest):
    """
    Request a password reset email.
    """
    result = supabase_auth_request("recover", data={
        "email": request.email
    })
    
    # Always return success to prevent email enumeration
    return {
        "success": True,
        "message": "Se o email existir, você receberá instruções para redefinir sua senha."
    }


@auth_router.get("/me", response_model=UserProfileResponse)
async def get_me(
    user: UserContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant)
):
    """
    Get the current authenticated user's profile.
    
    Returns user info and associated tenant details.
    Requires valid JWT in Authorization header.
    """
    # Get full user data from Supabase
    user_data = supabase_admin_request(f"users/{user.id}")
    
    if "error" in user_data:
        # Fallback to basic info from token
        return UserProfileResponse(
            id=user.id,
            email=user.email,
            full_name=user.metadata.get("full_name"),
            tenant={
                "id": tenant.id,
                "company_name": tenant.company_name,
                "plan": tenant.plan
            }
        )
    
    return UserProfileResponse(
        id=user_data.get("id"),
        email=user_data.get("email"),
        full_name=user_data.get("user_metadata", {}).get("full_name"),
        created_at=user_data.get("created_at"),
        tenant={
            "id": tenant.id,
            "company_name": tenant.company_name,
            "slug": tenant.slug,
            "plan": tenant.plan,
            "plan_limits": tenant.plan_limits,
            "status": tenant.status
        }
    )


@auth_router.patch("/me")
async def update_me(
    request: UpdateProfileRequest,
    user: UserContext = Depends(get_current_user)
):
    """
    Update the current user's profile.
    """
    updates = {}
    
    if request.full_name is not None:
        updates["user_metadata"] = {"full_name": request.full_name}
    
    if request.metadata:
        if "user_metadata" in updates:
            updates["user_metadata"].update(request.metadata)
        else:
            updates["user_metadata"] = request.metadata
    
    if not updates:
        return {"success": True, "message": "No updates provided"}
    
    result = supabase_admin_request(f"users/{user.id}", method="PUT", data=updates)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    logger.info(f"✅ Profile updated: {user.email}")
    
    return {"success": True, "message": "Profile updated"}


@auth_router.get("/tenant", response_model=TenantResponse)
async def get_tenant(tenant: TenantContext = Depends(get_current_tenant)):
    """
    Get the current tenant's details.
    
    Includes plan limits, settings, and status.
    """
    # Get full tenant data from database
    full_tenant = get_tenant_from_db(tenant.id)
    
    if not full_tenant:
        return TenantResponse(
            id=tenant.id,
            company_name=tenant.company_name,
            slug=tenant.slug,
            plan=tenant.plan,
            plan_limits=tenant.plan_limits,
            status=tenant.status,
            settings=tenant.settings
        )
    
    return TenantResponse(
        id=full_tenant.get("id"),
        company_name=full_tenant.get("company_name"),
        slug=full_tenant.get("slug"),
        plan=full_tenant.get("plan"),
        plan_limits=full_tenant.get("plan_limits", {}),
        status=full_tenant.get("status"),
        settings=full_tenant.get("settings", {}),
        created_at=full_tenant.get("created_at")
    )


@auth_router.patch("/tenant")
async def update_tenant(
    request: UpdateTenantRequest,
    tenant: TenantContext = Depends(get_current_tenant)
):
    """
    Update the current tenant's settings.
    
    Can update company name and settings.
    Plan changes require admin action or payment flow.
    """
    updates = {}
    
    if request.company_name is not None:
        updates["company_name"] = request.company_name
    
    if request.settings is not None:
        # Merge with existing settings
        current_settings = tenant.settings or {}
        current_settings.update(request.settings)
        updates["settings"] = current_settings
    
    if not updates:
        return {"success": True, "message": "No updates provided"}
    
    result = update_tenant_in_db(tenant.id, updates)
    
    if not result:
        raise HTTPException(status_code=400, detail="Failed to update tenant")
    
    logger.info(f"✅ Tenant updated: {tenant.id}")
    
    return {"success": True, "message": "Tenant updated", "tenant": result}


@auth_router.get("/usage")
async def get_usage(tenant: TenantContext = Depends(get_current_tenant)):
    """
    Get the current tenant's usage statistics.
    
    Shows leads count, messages sent today, and limits.
    """
    # Query lead count for this tenant
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
        }
        
        # Count leads
        leads_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/growth_leads",
            headers={**headers, "Prefer": "count=exact"},
            params={"tenant_id": f"eq.{tenant.id}", "select": "id"},
            timeout=10
        )
        
        lead_count = 0
        if leads_response.status_code == 200:
            lead_count = int(leads_response.headers.get("content-range", "0/0").split("/")[-1])
        
        # Get limits from plan
        max_leads = tenant.plan_limits.get("max_leads", 100)
        max_messages = tenant.plan_limits.get("max_messages_per_day", 50)
        
        return {
            "leads": {
                "current": lead_count,
                "limit": max_leads,
                "remaining": max(0, max_leads - lead_count),
                "percentage": min(100, (lead_count / max_leads) * 100) if max_leads > 0 else 0
            },
            "messages_today": {
                "current": 0,  # TODO: Implement message tracking
                "limit": max_messages,
                "remaining": max_messages
            },
            "plan": tenant.plan,
            "features": tenant.plan_limits.get("features", [])
        }
        
    except Exception as e:
        logger.error(f"Error getting usage: {e}")
        return {
            "leads": {"current": 0, "limit": 100, "remaining": 100},
            "messages_today": {"current": 0, "limit": 50, "remaining": 50},
            "plan": tenant.plan
        }


# =============================================================================
# VERIFICATION ENDPOINT (for testing)
# =============================================================================

@auth_router.get("/verify")
async def verify_auth(
    user: UserContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant)
):
    """
    Verify that authentication is working.
    Useful for testing the auth middleware.
    """
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        },
        "tenant": {
            "id": tenant.id,
            "company_name": tenant.company_name,
            "plan": tenant.plan
        }
    }
