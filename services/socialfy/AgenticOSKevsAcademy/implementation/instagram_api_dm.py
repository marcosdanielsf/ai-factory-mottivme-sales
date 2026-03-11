"""
Instagram API DM Service
========================
Sends Instagram DMs via Instagrapi (no browser needed).
Uses Decodo residential proxy and Supabase for session persistence.
"""

import os
import json
import time
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class InstagramDMService:
    """
    Send DMs via Instagram's internal API using Instagrapi.

    Features:
    - Programmatic login (no manual session extraction)
    - Session persistence to Supabase
    - Decodo residential proxy support
    - Automatic session refresh on expiry
    - Rate limiting (configurable daily limit)
    """

    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        self._clients: Dict[str, Any] = {}  # cache: username -> Client

    def _get_proxy_url(self) -> Optional[str]:
        """Build proxy URL from env vars (Decodo residential)."""
        host = os.getenv("PROXY_HOST")
        port = os.getenv("PROXY_PORT")
        user = os.getenv("PROXY_USER")
        password = os.getenv("PROXY_PASS")

        if host and port:
            auth = f"{user}:{password}@" if user and password else ""
            return f"http://{auth}{host}:{port}"
        return None

    def _get_account(self, username: str) -> Optional[Dict]:
        """Fetch account credentials from Supabase."""
        if not self.supabase:
            return None

        try:
            result = self.supabase.table("instagram_accounts") \
                .select("*") \
                .eq("username", username) \
                .eq("status", "active") \
                .single() \
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching account {username}: {e}")
            return None

    def _save_session(self, username: str, session_json: dict):
        """Save session state to Supabase for persistence."""
        if not self.supabase:
            return

        try:
            self.supabase.table("instagram_accounts") \
                .update({
                    "session_json": json.dumps(session_json),
                    "last_login_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("username", username) \
                .execute()
            logger.info(f"Session saved for @{username}")
        except Exception as e:
            logger.error(f"Error saving session for {username}: {e}")

    def _update_dm_count(self, username: str):
        """Increment daily DM counter."""
        if not self.supabase:
            return

        try:
            # Use RPC or raw update
            self.supabase.table("instagram_accounts") \
                .update({
                    "dms_sent_today": self.supabase.table("instagram_accounts")
                        .select("dms_sent_today")
                        .eq("username", username)
                        .single()
                        .execute().data.get("dms_sent_today", 0) + 1,
                    "last_dm_at": datetime.now(timezone.utc).isoformat()
                }) \
                .eq("username", username) \
                .execute()
        except Exception:
            # Fallback: just update last_dm_at
            try:
                self.supabase.rpc("increment_dm_count", {"p_username": username}).execute()
            except Exception as e:
                logger.warning(f"Could not update DM count: {e}")

    def get_client(self, username: str) -> Any:
        """
        Get or create an Instagrapi Client for the given account.
        Handles login, session loading, and proxy setup.
        """
        from instagrapi import Client
        from instagrapi.exceptions import LoginRequired, ChallengeRequired

        # Return cached client if available
        if username in self._clients:
            return self._clients[username]

        account = self._get_account(username)
        if not account:
            raise ValueError(f"Account @{username} not found or not active in instagram_accounts table")

        cl = Client()

        # Set proxy (Decodo residential)
        proxy_url = self._get_proxy_url()
        if proxy_url:
            cl.set_proxy(proxy_url)
            logger.info(f"Proxy set: {proxy_url.split('@')[-1] if '@' in proxy_url else proxy_url}")

        # Set realistic device settings
        cl.set_locale("pt_BR")
        cl.set_timezone_offset(-3 * 3600)  # BRT

        # Try loading existing session
        session_json = account.get("session_json")
        if session_json:
            try:
                if isinstance(session_json, str):
                    session_json = json.loads(session_json)
                cl.set_settings(session_json)
                cl.login(account["username"], account["password"])
                logger.info(f"Session loaded for @{username}")
                self._clients[username] = cl
                return cl
            except (LoginRequired, Exception) as e:
                logger.warning(f"Saved session expired for @{username}: {e}. Fresh login...")

        # Fresh login
        try:
            cl.login(account["username"], account["password"])
            logger.info(f"Fresh login successful for @{username}")

            # Save session for next time
            self._save_session(username, cl.get_settings())

            self._clients[username] = cl
            return cl

        except ChallengeRequired as e:
            logger.error(f"2FA/Challenge required for @{username}: {e}")
            # Update status to needs_challenge
            if self.supabase:
                self.supabase.table("instagram_accounts") \
                    .update({"status": "needs_challenge"}) \
                    .eq("username", username) \
                    .execute()
            raise ValueError(f"Account @{username} needs 2FA verification. Check Instagram app.")

        except Exception as e:
            logger.error(f"Login failed for @{username}: {e}")
            raise

    def send_dm(
        self,
        from_username: str,
        to_username: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Send a DM from one account to a target user.

        Args:
            from_username: Instagram account to send from (must be in instagram_accounts table)
            to_username: Target Instagram username to DM
            message: Message text to send

        Returns:
            dict with success, user_id, thread_id, etc.
        """
        from instagrapi.exceptions import (
            UserNotFound, DirectThreadNotFound,
            FeedbackRequired, PleaseWaitFewMinutes
        )

        try:
            # Check daily limit
            account = self._get_account(from_username)
            if account:
                daily_limit = account.get("daily_limit", 50)
                sent_today = account.get("dms_sent_today", 0)
                if sent_today >= daily_limit:
                    return {
                        "success": False,
                        "error": f"Daily limit reached ({sent_today}/{daily_limit})",
                        "error_type": "rate_limit"
                    }

            # Get client (handles login/session)
            cl = self.get_client(from_username)

            # Resolve target user_id
            logger.info(f"Resolving user_id for @{to_username}...")
            try:
                user_id = cl.user_id_from_username(to_username)
            except UserNotFound:
                return {
                    "success": False,
                    "error": f"User @{to_username} not found",
                    "error_type": "user_not_found"
                }

            # Small random delay (human-like)
            import random
            delay = random.uniform(2, 5)
            time.sleep(delay)

            # Send DM
            logger.info(f"Sending DM from @{from_username} to @{to_username} (user_id: {user_id})...")
            result = cl.direct_send(message, [int(user_id)])

            # Save updated session
            self._save_session(from_username, cl.get_settings())

            # Update DM count
            self._update_dm_count(from_username)

            thread_id = getattr(result, 'thread_id', None) or (result.id if hasattr(result, 'id') else None)

            logger.info(f"DM sent successfully to @{to_username}")

            return {
                "success": True,
                "from": from_username,
                "to": to_username,
                "user_id": str(user_id),
                "thread_id": str(thread_id) if thread_id else None,
                "message_preview": message[:50] + "..." if len(message) > 50 else message
            }

        except FeedbackRequired as e:
            logger.error(f"Instagram feedback/block for @{from_username}: {e}")
            if self.supabase:
                self.supabase.table("instagram_accounts") \
                    .update({"status": "blocked"}) \
                    .eq("username", from_username) \
                    .execute()
            return {
                "success": False,
                "error": f"Account @{from_username} temporarily blocked by Instagram",
                "error_type": "blocked"
            }

        except PleaseWaitFewMinutes as e:
            logger.warning(f"Rate limited for @{from_username}: {e}")
            return {
                "success": False,
                "error": "Instagram rate limit - wait a few minutes",
                "error_type": "rate_limit"
            }

        except Exception as e:
            logger.error(f"Error sending DM: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "error_type": "unknown"
            }

    def check_session_health(self, username: str) -> Dict[str, Any]:
        """Check if a session is still valid."""
        try:
            cl = self.get_client(username)
            # Simple check: get own user info
            user_info = cl.account_info()
            return {
                "healthy": True,
                "username": username,
                "user_id": str(user_info.pk),
                "full_name": user_info.full_name
            }
        except Exception as e:
            return {
                "healthy": False,
                "username": username,
                "error": str(e)
            }


# Singleton instance
_dm_service: Optional[InstagramDMService] = None

def get_dm_service(supabase_client=None) -> InstagramDMService:
    """Get or create the singleton DM service."""
    global _dm_service
    if _dm_service is None:
        _dm_service = InstagramDMService(supabase_client)
    return _dm_service
