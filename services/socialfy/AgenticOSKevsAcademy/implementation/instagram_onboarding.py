#!/usr/bin/env python3
"""
📱 INSTAGRAM ONBOARDING API
===========================
Endpoints for connecting Instagram accounts via session_id.

Features:
- Validate session_id against Instagram API
- Encrypt session before storing
- List/delete connected accounts
- Re-validate existing sessions

Security:
- Session IDs are encrypted with Fernet before storage
- Tenant isolation (each tenant sees only their accounts)
- Audit logging for all operations

Endpoints:
    POST   /api/instagram/connect           - Connect new Instagram account
    GET    /api/instagram/accounts          - List connected accounts
    DELETE /api/instagram/accounts/{username} - Remove account
    POST   /api/instagram/accounts/{username}/validate - Re-validate session

Usage:
    # Include in main api_server.py:
    from instagram_onboarding import router as instagram_onboarding_router
    app.include_router(instagram_onboarding_router)
"""

import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Header, Request, Depends
from pydantic import BaseModel, Field
import requests

from dotenv import load_dotenv

load_dotenv()

# Import encryption module
try:
    from encryption import encrypt_value, decrypt_value, is_encryption_configured, EncryptionError
except ImportError:
    from implementation.encryption import encrypt_value, decrypt_value, is_encryption_configured, EncryptionError

# ============================================
# CONFIGURATION
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "socialfy-secret-2024")

logger = logging.getLogger(__name__)

# ============================================
# PYDANTIC MODELS
# ============================================

class InstagramConnectRequest(BaseModel):
    """Request to connect an Instagram account"""
    session_id: str = Field(..., description="Instagram sessionid cookie value")
    tenant_id: Optional[str] = Field(None, description="Tenant ID (optional, can come from header)")


class InstagramConnectResponse(BaseModel):
    """Response after connecting Instagram account"""
    success: bool
    username: str
    user_id_ig: Optional[str] = None
    full_name: Optional[str] = None
    followers: int = 0
    following: int = 0
    is_business: bool = False
    is_verified: bool = False
    profile_pic_url: Optional[str] = None
    message: str = ""
    error: Optional[str] = None


class InstagramAccountInfo(BaseModel):
    """Info about a connected Instagram account"""
    id: str
    username: str
    user_id_ig: Optional[str] = None
    full_name: Optional[str] = None
    profile_pic_url: Optional[str] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    is_business: bool = False
    is_verified: bool = False
    status: str
    last_validated_at: Optional[str] = None
    created_at: str


class InstagramAccountsListResponse(BaseModel):
    """Response listing connected accounts"""
    success: bool
    accounts: List[InstagramAccountInfo] = []
    count: int = 0
    error: Optional[str] = None


class InstagramValidateResponse(BaseModel):
    """Response after validating a session"""
    success: bool
    username: str
    status: str
    is_valid: bool
    followers: Optional[int] = None
    error: Optional[str] = None


class InstagramDeleteResponse(BaseModel):
    """Response after deleting an account"""
    success: bool
    username: str
    message: str
    error: Optional[str] = None


# ============================================
# INSTAGRAM SESSION VALIDATOR
# ============================================

class InstagramSessionValidator:
    """
    Validates Instagram session IDs by making API requests.
    Uses the same approach as instagram_api_scraper.py.
    """
    
    BASE_URL = "https://i.instagram.com/api/v1"
    WEB_URL = "https://www.instagram.com"
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.headers = {
            "User-Agent": "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "X-IG-App-ID": "936619743392459",
            "X-IG-Device-ID": "android-1234567890",
            "X-IG-Connection-Type": "WIFI",
            "X-IG-Capabilities": "3brTvx0=",
            "X-IG-App-Locale": "en_US",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": f"sessionid={session_id}",
        }
        self.web_headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Cookie": f"sessionid={session_id}",
            "X-IG-App-ID": "936619743392459",
            "X-Requested-With": "XMLHttpRequest",
        }
        self.session = requests.Session()
    
    def validate_and_get_profile(self) -> Dict[str, Any]:
        """
        Validate session by fetching the logged-in user's profile.
        
        Returns:
            Dict with profile data if valid, error info if invalid
        """
        result = {
            "valid": False,
            "error": None,
            "username": None,
            "user_id_ig": None,
            "full_name": None,
            "bio": None,
            "profile_pic_url": None,
            "followers_count": 0,
            "following_count": 0,
            "posts_count": 0,
            "is_business": False,
            "is_verified": False,
            "is_private": False,
        }
        
        try:
            # Method 1: Get current user info via accounts/current_user
            url = f"{self.BASE_URL}/accounts/current_user/?edit=true"
            response = self.session.get(url, headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                
                if user and user.get("username"):
                    result.update({
                        "valid": True,
                        "username": user.get("username"),
                        "user_id_ig": str(user.get("pk")),
                        "full_name": user.get("full_name"),
                        "bio": user.get("biography"),
                        "profile_pic_url": user.get("profile_pic_url"),
                        "is_business": user.get("is_business", False),
                        "is_verified": user.get("is_verified", False),
                        "is_private": user.get("is_private", False),
                    })
                    
                    # Get follower counts from a separate endpoint
                    self._enrich_with_counts(result, user.get("username"))
                    
                    logger.info(f"✅ Session validated for @{user.get('username')}")
                    return result
            
            # Method 2: Try web profile endpoint
            url = f"{self.WEB_URL}/api/v1/accounts/current_user/web_profile_info/"
            response = self.session.get(url, headers=self.web_headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("data", {}).get("user", {})
                
                if user and user.get("username"):
                    result.update({
                        "valid": True,
                        "username": user.get("username"),
                        "user_id_ig": user.get("id"),
                        "full_name": user.get("full_name"),
                        "bio": user.get("biography"),
                        "profile_pic_url": user.get("profile_pic_url_hd") or user.get("profile_pic_url"),
                        "followers_count": user.get("edge_followed_by", {}).get("count", 0),
                        "following_count": user.get("edge_follow", {}).get("count", 0),
                        "posts_count": user.get("edge_owner_to_timeline_media", {}).get("count", 0),
                        "is_business": user.get("is_business_account", False),
                        "is_verified": user.get("is_verified", False),
                        "is_private": user.get("is_private", False),
                    })
                    
                    logger.info(f"✅ Session validated for @{user.get('username')} (web method)")
                    return result
            
            # If we get here, session is invalid
            if response.status_code == 401:
                result["error"] = "Session expired or invalid. Please get a new sessionid."
            elif response.status_code == 429:
                result["error"] = "Rate limited by Instagram. Try again later."
            elif response.status_code == 400:
                result["error"] = "Invalid session format."
            else:
                result["error"] = f"Instagram returned status {response.status_code}"
            
            logger.warning(f"❌ Session validation failed: {result['error']}")
            return result
            
        except requests.Timeout:
            result["error"] = "Request timeout. Instagram may be slow."
            return result
        except requests.RequestException as e:
            result["error"] = f"Network error: {str(e)}"
            return result
        except Exception as e:
            result["error"] = f"Validation error: {str(e)}"
            logger.error(f"Session validation exception: {e}")
            return result
    
    def _enrich_with_counts(self, result: Dict, username: str):
        """Enrich result with follower/following counts"""
        try:
            url = f"{self.WEB_URL}/api/v1/users/web_profile_info/?username={username}"
            response = self.session.get(url, headers=self.web_headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("data", {}).get("user", {})
                
                result["followers_count"] = user.get("edge_followed_by", {}).get("count", 0)
                result["following_count"] = user.get("edge_follow", {}).get("count", 0)
                result["posts_count"] = user.get("edge_owner_to_timeline_media", {}).get("count", 0)
                
                if user.get("profile_pic_url_hd"):
                    result["profile_pic_url"] = user.get("profile_pic_url_hd")
        except:
            pass  # Counts are optional, don't fail validation


# ============================================
# SUPABASE CLIENT
# ============================================

class InstagramSessionsDB:
    """Database operations for instagram_sessions table"""
    
    def __init__(self):
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    def _request(self, method: str, endpoint: str, params: dict = None, data: dict = None):
        """Make request to Supabase REST API"""
        url = f"{self.base_url}/{endpoint}"
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            params=params,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        return response.json() if response.text else []
    
    def get_session_by_username(self, tenant_id: str, username: str) -> Optional[Dict]:
        """Get session by tenant and username"""
        try:
            result = self._request("GET", "instagram_sessions", params={
                "tenant_id": f"eq.{tenant_id}",
                "username": f"eq.{username}",
                "select": "*"
            })
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error fetching session: {e}")
            return None
    
    def create_session(self, session_data: Dict) -> Optional[Dict]:
        """Create new Instagram session"""
        try:
            result = self._request("POST", "instagram_sessions", data=session_data)
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise
    
    def update_session(self, session_id: str, update_data: Dict) -> bool:
        """Update existing session"""
        try:
            self._request("PATCH", "instagram_sessions", 
                params={"id": f"eq.{session_id}"},
                data=update_data
            )
            return True
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return False
    
    def delete_session(self, tenant_id: str, username: str) -> bool:
        """Delete session by tenant and username"""
        try:
            self._request("DELETE", "instagram_sessions", params={
                "tenant_id": f"eq.{tenant_id}",
                "username": f"eq.{username}"
            })
            return True
        except Exception as e:
            logger.error(f"Error deleting session: {e}")
            return False
    
    def list_sessions(self, tenant_id: str) -> List[Dict]:
        """List all sessions for a tenant"""
        try:
            return self._request("GET", "instagram_sessions", params={
                "tenant_id": f"eq.{tenant_id}",
                "select": "id,username,user_id_ig,full_name,profile_pic_url,followers_count,following_count,is_business,is_verified,status,last_validated_at,created_at",
                "order": "created_at.desc"
            })
        except Exception as e:
            logger.error(f"Error listing sessions: {e}")
            return []
    
    def log_audit(self, session_id: str, action: str, old_status: str = None, 
                  new_status: str = None, details: Dict = None, 
                  ip_address: str = None, user_agent: str = None):
        """Log session audit event"""
        try:
            self._request("POST", "instagram_sessions_audit", data={
                "session_id": session_id,
                "action": action,
                "old_status": old_status,
                "new_status": new_status,
                "details": details,
                "ip_address": ip_address,
                "user_agent": user_agent
            })
        except Exception as e:
            logger.warning(f"Failed to log audit: {e}")


# ============================================
# DEPENDENCIES
# ============================================

async def get_tenant_id(
    request: Request,
    x_tenant_id: Optional[str] = Header(None)
) -> str:
    """
    Extract tenant_id from header or request body.
    """
    if x_tenant_id:
        return x_tenant_id
    
    # Try to get from request body (for POST requests)
    try:
        body = await request.json()
        if body.get("tenant_id"):
            return body["tenant_id"]
    except:
        pass
    
    raise HTTPException(
        status_code=400,
        detail="tenant_id is required. Pass via X-Tenant-ID header or request body."
    )


async def verify_encryption_configured():
    """Verify encryption is properly configured"""
    if not is_encryption_configured():
        raise HTTPException(
            status_code=500,
            detail="Encryption not configured. Set ENCRYPTION_KEY environment variable."
        )


# ============================================
# API ROUTER
# ============================================

router = APIRouter(
    prefix="/api/instagram",
    tags=["Instagram Onboarding"]
)


@router.post("/connect", response_model=InstagramConnectResponse)
async def connect_instagram_account(
    request_data: InstagramConnectRequest,
    request: Request,
    x_tenant_id: Optional[str] = Header(None),
    _: None = Depends(verify_encryption_configured)
):
    """
    Connect a new Instagram account by validating and storing session_id.
    
    Process:
    1. Validate session_id against Instagram API
    2. Extract profile data (username, followers, etc.)
    3. Encrypt session_id
    4. Store in database
    
    Args:
        session_id: Instagram sessionid cookie value
        tenant_id: Tenant identifier
        
    Returns:
        Account info if successful, error details if not
    """
    # Get tenant_id
    tenant_id = request_data.tenant_id or x_tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenant_id is required")
    
    session_id = request_data.session_id.strip()
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Validate minimum length (real session IDs are ~60+ chars)
    if len(session_id) < 30:
        return InstagramConnectResponse(
            success=False,
            username="",
            error="Invalid session_id format. Must be the full sessionid cookie value."
        )
    
    logger.info(f"🔗 Connecting Instagram account for tenant {tenant_id}...")
    
    # 1. Validate session against Instagram
    validator = InstagramSessionValidator(session_id)
    profile = validator.validate_and_get_profile()
    
    if not profile["valid"]:
        return InstagramConnectResponse(
            success=False,
            username="",
            error=profile.get("error", "Session validation failed")
        )
    
    username = profile["username"]
    
    # 2. Check if already connected
    db = InstagramSessionsDB()
    existing = db.get_session_by_username(tenant_id, username)
    
    if existing:
        # Update existing session
        try:
            encrypted_session = encrypt_value(session_id)
            
            db.update_session(existing["id"], {
                "session_id_encrypted": encrypted_session,
                "user_id_ig": profile["user_id_ig"],
                "full_name": profile["full_name"],
                "profile_pic_url": profile["profile_pic_url"],
                "followers_count": profile["followers_count"],
                "following_count": profile["following_count"],
                "is_business": profile["is_business"],
                "is_verified": profile["is_verified"],
                "status": "active",
                "last_validated_at": datetime.utcnow().isoformat(),
                "validation_error": None
            })
            
            # Log audit
            db.log_audit(
                session_id=existing["id"],
                action="rotated",
                old_status=existing.get("status"),
                new_status="active",
                details={"action": "session_updated"},
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent")
            )
            
            logger.info(f"✅ Updated existing session for @{username}")
            
            return InstagramConnectResponse(
                success=True,
                username=username,
                user_id_ig=profile["user_id_ig"],
                full_name=profile["full_name"],
                followers=profile["followers_count"],
                following=profile["following_count"],
                is_business=profile["is_business"],
                is_verified=profile["is_verified"],
                profile_pic_url=profile["profile_pic_url"],
                message=f"Session updated for @{username}"
            )
            
        except EncryptionError as e:
            logger.error(f"Encryption failed: {e}")
            return InstagramConnectResponse(
                success=False,
                username=username,
                error="Failed to encrypt session. Check encryption configuration."
            )
    
    # 3. Create new session
    try:
        encrypted_session = encrypt_value(session_id)
        
        new_session = db.create_session({
            "tenant_id": tenant_id,
            "username": username,
            "session_id_encrypted": encrypted_session,
            "user_id_ig": profile["user_id_ig"],
            "full_name": profile["full_name"],
            "profile_pic_url": profile["profile_pic_url"],
            "followers_count": profile["followers_count"],
            "following_count": profile["following_count"],
            "is_business": profile["is_business"],
            "is_verified": profile["is_verified"],
            "status": "active",
            "last_validated_at": datetime.utcnow().isoformat()
        })
        
        if new_session:
            # Log audit
            db.log_audit(
                session_id=new_session["id"],
                action="created",
                new_status="active",
                details={
                    "username": username,
                    "followers": profile["followers_count"]
                },
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent")
            )
        
        logger.info(f"✅ Created new session for @{username}")
        
        return InstagramConnectResponse(
            success=True,
            username=username,
            user_id_ig=profile["user_id_ig"],
            full_name=profile["full_name"],
            followers=profile["followers_count"],
            following=profile["following_count"],
            is_business=profile["is_business"],
            is_verified=profile["is_verified"],
            profile_pic_url=profile["profile_pic_url"],
            message=f"Successfully connected @{username}"
        )
        
    except EncryptionError as e:
        logger.error(f"Encryption failed: {e}")
        return InstagramConnectResponse(
            success=False,
            username=username,
            error="Failed to encrypt session. Check encryption configuration."
        )
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        return InstagramConnectResponse(
            success=False,
            username=username,
            error=f"Database error: {str(e)}"
        )


@router.get("/accounts", response_model=InstagramAccountsListResponse)
async def list_instagram_accounts(
    x_tenant_id: str = Header(..., description="Tenant ID")
):
    """
    List all connected Instagram accounts for a tenant.
    
    Returns:
        List of connected accounts with their status
    """
    logger.info(f"📋 Listing accounts for tenant {x_tenant_id}")
    
    db = InstagramSessionsDB()
    sessions = db.list_sessions(x_tenant_id)
    
    accounts = [
        InstagramAccountInfo(
            id=s["id"],
            username=s["username"],
            user_id_ig=s.get("user_id_ig"),
            full_name=s.get("full_name"),
            profile_pic_url=s.get("profile_pic_url"),
            followers_count=s.get("followers_count"),
            following_count=s.get("following_count"),
            is_business=s.get("is_business", False),
            is_verified=s.get("is_verified", False),
            status=s["status"],
            last_validated_at=s.get("last_validated_at"),
            created_at=s["created_at"]
        )
        for s in sessions
    ]
    
    return InstagramAccountsListResponse(
        success=True,
        accounts=accounts,
        count=len(accounts)
    )


@router.delete("/accounts/{username}", response_model=InstagramDeleteResponse)
async def delete_instagram_account(
    username: str,
    request: Request,
    x_tenant_id: str = Header(..., description="Tenant ID")
):
    """
    Remove a connected Instagram account.
    
    Args:
        username: Instagram username to remove
        
    Returns:
        Deletion confirmation
    """
    logger.info(f"🗑️ Deleting account @{username} for tenant {x_tenant_id}")
    
    db = InstagramSessionsDB()
    
    # Get existing to verify it exists and for audit
    existing = db.get_session_by_username(x_tenant_id, username)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail=f"Account @{username} not found for this tenant"
        )
    
    # Log audit before deletion
    db.log_audit(
        session_id=existing["id"],
        action="deleted",
        old_status=existing.get("status"),
        details={"username": username},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    # Delete
    success = db.delete_session(x_tenant_id, username)
    
    if success:
        return InstagramDeleteResponse(
            success=True,
            username=username,
            message=f"Successfully removed @{username}"
        )
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete account"
        )


@router.post("/accounts/{username}/validate", response_model=InstagramValidateResponse)
async def validate_instagram_session(
    username: str,
    request: Request,
    x_tenant_id: str = Header(..., description="Tenant ID"),
    _: None = Depends(verify_encryption_configured)
):
    """
    Re-validate an existing Instagram session.
    
    Checks if the stored session is still valid and updates status.
    
    Args:
        username: Instagram username to validate
        
    Returns:
        Validation result with updated status
    """
    logger.info(f"🔍 Validating session for @{username}")
    
    db = InstagramSessionsDB()
    
    # Get existing session
    existing = db.get_session_by_username(x_tenant_id, username)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail=f"Account @{username} not found for this tenant"
        )
    
    # Decrypt session
    try:
        session_id = decrypt_value(existing["session_id_encrypted"])
    except Exception as e:
        logger.error(f"Failed to decrypt session: {e}")
        
        # Update status to expired
        db.update_session(existing["id"], {
            "status": "expired",
            "validation_error": "Decryption failed"
        })
        
        return InstagramValidateResponse(
            success=False,
            username=username,
            status="expired",
            is_valid=False,
            error="Failed to decrypt session. May need to reconnect."
        )
    
    # Validate against Instagram
    validator = InstagramSessionValidator(session_id)
    profile = validator.validate_and_get_profile()
    
    old_status = existing.get("status")
    
    if profile["valid"]:
        # Session is valid - update profile data
        db.update_session(existing["id"], {
            "status": "active",
            "last_validated_at": datetime.utcnow().isoformat(),
            "validation_error": None,
            "followers_count": profile["followers_count"],
            "following_count": profile["following_count"],
            "full_name": profile["full_name"],
            "profile_pic_url": profile["profile_pic_url"],
            "is_business": profile["is_business"],
            "is_verified": profile["is_verified"]
        })
        
        # Log audit
        db.log_audit(
            session_id=existing["id"],
            action="validated",
            old_status=old_status,
            new_status="active",
            details={"followers": profile["followers_count"]},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        return InstagramValidateResponse(
            success=True,
            username=username,
            status="active",
            is_valid=True,
            followers=profile["followers_count"]
        )
    else:
        # Session is invalid - update status
        new_status = "expired"
        if "rate limit" in (profile.get("error") or "").lower():
            new_status = "active"  # Don't mark as expired just due to rate limit
        
        db.update_session(existing["id"], {
            "status": new_status,
            "last_validated_at": datetime.utcnow().isoformat(),
            "validation_error": profile.get("error")
        })
        
        # Log audit
        db.log_audit(
            session_id=existing["id"],
            action="expired" if new_status == "expired" else "validated",
            old_status=old_status,
            new_status=new_status,
            details={"error": profile.get("error")},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        return InstagramValidateResponse(
            success=True,  # API call succeeded, but session is invalid
            username=username,
            status=new_status,
            is_valid=False,
            error=profile.get("error")
        )


@router.get("/accounts/{username}/session", include_in_schema=False)
async def get_decrypted_session(
    username: str,
    x_tenant_id: str = Header(...),
    x_api_key: str = Header(..., description="API Secret Key"),
    _: None = Depends(verify_encryption_configured)
):
    """
    Internal endpoint to get decrypted session for automation.
    Protected by API key - not for public use.
    """
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    db = InstagramSessionsDB()
    existing = db.get_session_by_username(x_tenant_id, username)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if existing["status"] != "active":
        raise HTTPException(
            status_code=400, 
            detail=f"Session is not active. Status: {existing['status']}"
        )
    
    try:
        session_id = decrypt_value(existing["session_id_encrypted"])
        
        # Update last_used_at
        db.update_session(existing["id"], {
            "last_used_at": datetime.utcnow().isoformat()
        })
        
        return {
            "success": True,
            "username": username,
            "session_id": session_id,
            "user_id_ig": existing.get("user_id_ig")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {e}")


# ============================================
# HEALTH CHECK
# ============================================

@router.get("/health")
async def instagram_onboarding_health():
    """Health check for Instagram onboarding service"""
    return {
        "status": "healthy",
        "service": "instagram_onboarding",
        "encryption_configured": is_encryption_configured(),
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY)
    }


# ============================================
# CLI FOR TESTING
# ============================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Instagram Onboarding CLI")
    parser.add_argument("action", choices=["validate", "test"])
    parser.add_argument("--session-id", "-s", help="Session ID to validate")
    
    args = parser.parse_args()
    
    if args.action == "validate":
        if not args.session_id:
            print("❌ --session-id is required")
            exit(1)
        
        print("\n🔍 Validating Instagram session...")
        print("-" * 50)
        
        validator = InstagramSessionValidator(args.session_id)
        result = validator.validate_and_get_profile()
        
        if result["valid"]:
            print(f"✅ Session is VALID!")
            print(f"   Username: @{result['username']}")
            print(f"   User ID: {result['user_id_ig']}")
            print(f"   Name: {result['full_name']}")
            print(f"   Followers: {result['followers_count']:,}")
            print(f"   Following: {result['following_count']:,}")
            print(f"   Business: {result['is_business']}")
            print(f"   Verified: {result['is_verified']}")
        else:
            print(f"❌ Session is INVALID!")
            print(f"   Error: {result['error']}")
        
        print("-" * 50)
    
    elif args.action == "test":
        print("\n🧪 Testing Instagram Onboarding...")
        print("-" * 50)
        
        # Test encryption
        if is_encryption_configured():
            print("✅ Encryption is configured")
        else:
            print("❌ Encryption NOT configured - set ENCRYPTION_KEY")
        
        # Test Supabase
        if SUPABASE_URL and SUPABASE_KEY:
            print("✅ Supabase is configured")
        else:
            print("❌ Supabase NOT configured")
        
        print("-" * 50)
