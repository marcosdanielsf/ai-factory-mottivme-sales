"""
LinkedIn DM Agent - Automated B2B Outreach System
==================================================
Sends connection requests and personalized messages using Playwright browser automation.
Stores all data in Supabase for tracking and analytics.

Usage:
    python linkedin_dm_agent.py                      # Run with default settings
    python linkedin_dm_agent.py --login-only         # Just login and save session
    python linkedin_dm_agent.py --headless           # Run without browser window
    python linkedin_dm_agent.py --mode connection    # Send connection requests only
    python linkedin_dm_agent.py --mode message       # Send messages to connections only
    python linkedin_dm_agent.py --limit 20           # Limit actions this run

Exit Codes:
    0 = Success
    1 = Error (login failed, blocked, or fatal error)

Rate Limits:
    - Connections: 20/day, 100/week (conservative)
    - Messages: 50/day
    - Delay: 45-90s between connections, 60-120s between messages

Framework: ii (Information + Implementation)
"""

import os
import sys
import json
import random
import asyncio
import logging
import argparse
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from dotenv import load_dotenv
import requests

# Stealth mode
try:
    from playwright_stealth import stealth_async
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False
    stealth_async = None

# Paths
BASE_DIR = Path(__file__).parent.parent

# Load environment from project root
load_dotenv(BASE_DIR / ".env")

# ============================================
# CONFIGURATION
# ============================================
SESSIONS_DIR = BASE_DIR / "sessions"
LOGS_DIR = BASE_DIR / "logs"
SESSIONS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bfumywvwubvernvhjehk.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# LinkedIn
LINKEDIN_EMAIL = os.getenv("LINKEDIN_EMAIL")
LINKEDIN_PASSWORD = os.getenv("LINKEDIN_PASSWORD")
SESSION_PATH = SESSIONS_DIR / "linkedin_session.json"

# Rate Limits (CONSERVATIVE - LinkedIn is aggressive)
MAX_CONNECTIONS_PER_DAY = int(os.getenv("LINKEDIN_CONN_PER_DAY", 20))
MAX_CONNECTIONS_PER_WEEK = int(os.getenv("LINKEDIN_CONN_PER_WEEK", 100))
MAX_MESSAGES_PER_DAY = int(os.getenv("LINKEDIN_MSG_PER_DAY", 50))

# Delays (LinkedIn detects patterns)
MIN_CONN_DELAY = int(os.getenv("LINKEDIN_CONN_DELAY_MIN", 45))
MAX_CONN_DELAY = int(os.getenv("LINKEDIN_CONN_DELAY_MAX", 90))
MIN_MSG_DELAY = int(os.getenv("LINKEDIN_MSG_DELAY_MIN", 60))
MAX_MSG_DELAY = int(os.getenv("LINKEDIN_MSG_DELAY_MAX", 120))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / f"linkedin_dm_{date.today()}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("LinkedInDMAgent")


# ============================================
# DATA CLASSES
# ============================================

class ActionMode(Enum):
    CONNECTION = "connection"
    MESSAGE = "message"
    HYBRID = "hybrid"


class BlockType(Enum):
    NONE = "none"
    CAPTCHA = "captcha"
    RATE_LIMITED = "rate_limited"
    CONNECTION_LIMIT = "connection_limit"
    ACCOUNT_RESTRICTED = "account_restricted"
    PROFILE_NOT_FOUND = "profile_not_found"
    UNKNOWN = "unknown"


@dataclass
class LinkedInLead:
    id: int
    linkedin_url: str
    full_name: Optional[str] = None
    headline: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    connections_count: Optional[int] = None
    source: Optional[str] = None
    icp_score: Optional[int] = None
    priority: Optional[str] = None
    is_connection: bool = False

    @property
    def first_name(self) -> str:
        if self.full_name:
            # Remove títulos comuns
            name = self.full_name
            for title in ["Dr.", "Dra.", "Prof.", "Eng.", "Sr.", "Sra."]:
                name = name.replace(title, "").strip()
            return name.split()[0] if name else ""
        return ""
    
    @property
    def username(self) -> str:
        """Extrai username da URL"""
        if "/in/" in self.linkedin_url:
            return self.linkedin_url.split("/in/")[-1].split("/")[0].split("?")[0]
        return ""


@dataclass
class ActionResult:
    lead_id: int
    linkedin_url: str
    action_type: str  # 'connection' or 'message'
    success: bool
    note_or_message: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)


# ============================================
# IMPORT TEMPLATES
# ============================================
try:
    sys.path.insert(0, str(BASE_DIR / "config"))
    from linkedin_dm_templates import (
        get_connection_template, get_followup_template,
        render_template, truncate_connection_note,
        extract_first_name, calculate_icp_score,
        extract_company_from_headline, extract_title_from_headline
    )
    TEMPLATES_AVAILABLE = True
except ImportError:
    TEMPLATES_AVAILABLE = False
    logger.warning("Templates not available - using fallback")

# Fallback templates
FALLBACK_CONNECTION_NOTE = "Oi {first_name}! Vi seu perfil e achei interessante. Vamos conectar?"
FALLBACK_MESSAGE = """Oi {first_name}, obrigado por conectar!

Vi que você trabalha com {specialty}. Tenho interesse na área e adoraria trocar uma ideia.

Abs!"""


# ============================================
# SUPABASE CLIENT
# ============================================

class LinkedInSupabaseDB:
    """Supabase operations for LinkedIn agent"""

    def __init__(self):
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self.run_id: Optional[int] = None

    def _request(self, method: str, endpoint: str, params: dict = None, data: dict = None):
        """Make request to Supabase REST API"""
        url = f"{self.base_url}/{endpoint}"
        try:
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
        except Exception as e:
            logger.error(f"Supabase error: {e}")
            return []

    def ensure_tables_exist(self):
        """Create tables if they don't exist (via RPC or skip)"""
        # Tables should be created via migration
        # This is just a safety check
        try:
            self._request("GET", "linkedin_leads", params={"limit": 1})
            logger.info("✅ LinkedIn tables verified")
        except:
            logger.warning("⚠️ LinkedIn tables may not exist - run migrations")

    def start_run(self, mode: str, account: str) -> int:
        """Start a new agent run"""
        result = self._request("POST", "linkedin_dm_runs", data={
            'mode': mode,
            'account_used': account,
            'status': 'running'
        })
        self.run_id = result[0]['id'] if result else None
        logger.info(f"Started run #{self.run_id} (mode: {mode})")
        return self.run_id

    def end_run(self, connections_sent: int, messages_sent: int, failed: int, skipped: int, 
                status: str = 'completed', error_log: str = None):
        """End the current run"""
        if not self.run_id:
            return

        self._request("PATCH", "linkedin_dm_runs",
            params={"id": f"eq.{self.run_id}"},
            data={
                'ended_at': datetime.now().isoformat(),
                'connections_sent': connections_sent,
                'messages_sent': messages_sent,
                'failed': failed,
                'skipped': skipped,
                'status': status,
                'error_log': error_log
            }
        )
        logger.info(f"Ended run #{self.run_id} - Conn: {connections_sent}, Msg: {messages_sent}")

    def get_leads_for_connection(self, limit: int = 20) -> List[LinkedInLead]:
        """Get leads that haven't received connection request"""
        # Get leads
        leads_data = self._request("GET", "linkedin_leads", params={"select": "*", "limit": str(limit * 2)})
        
        # Get already contacted
        contacted = self._request("GET", "linkedin_connections_sent", params={"select": "linkedin_url"})
        contacted_urls = {r['linkedin_url'] for r in contacted}

        leads = []
        for lead_data in leads_data:
            if lead_data['linkedin_url'] not in contacted_urls:
                leads.append(LinkedInLead(
                    id=lead_data['id'],
                    linkedin_url=lead_data['linkedin_url'],
                    full_name=lead_data.get('full_name'),
                    headline=lead_data.get('headline'),
                    company=lead_data.get('company'),
                    title=lead_data.get('title'),
                    location=lead_data.get('location'),
                    industry=lead_data.get('industry'),
                    connections_count=lead_data.get('connections_count'),
                    source=lead_data.get('source'),
                    icp_score=lead_data.get('icp_score'),
                    priority=lead_data.get('priority'),
                    is_connection=False
                ))
                if len(leads) >= limit:
                    break

        logger.info(f"Found {len(leads)} leads for connection requests")
        return leads

    def get_connections_for_message(self, limit: int = 30) -> List[LinkedInLead]:
        """Get accepted connections that haven't received message"""
        # Get accepted connections
        accepted = self._request("GET", "linkedin_connections_sent", 
            params={"select": "*", "status": "eq.accepted"})
        
        # Get already messaged
        messaged = self._request("GET", "linkedin_messages_sent", params={"select": "linkedin_url"})
        messaged_urls = {r['linkedin_url'] for r in messaged}

        # Get lead details
        leads = []
        for conn in accepted:
            if conn['linkedin_url'] not in messaged_urls:
                # Fetch lead details
                lead_data = self._request("GET", "linkedin_leads",
                    params={"linkedin_url": f"eq.{conn['linkedin_url']}", "limit": "1"})
                
                if lead_data:
                    ld = lead_data[0]
                    leads.append(LinkedInLead(
                        id=ld['id'],
                        linkedin_url=ld['linkedin_url'],
                        full_name=ld.get('full_name'),
                        headline=ld.get('headline'),
                        company=ld.get('company'),
                        title=ld.get('title'),
                        industry=ld.get('industry'),
                        is_connection=True
                    ))
                    if len(leads) >= limit:
                        break

        logger.info(f"Found {len(leads)} connections to message")
        return leads

    def record_connection_sent(self, result: ActionResult, account: str):
        """Record a connection request sent"""
        self._request("POST", "linkedin_connections_sent", data={
            'lead_id': result.lead_id,
            'linkedin_url': result.linkedin_url,
            'connection_note': result.note_or_message,
            'status': 'pending' if result.success else 'failed',
            'account_used': account
        })

    def record_message_sent(self, result: ActionResult, template: str, account: str):
        """Record a message sent"""
        self._request("POST", "linkedin_messages_sent", data={
            'lead_id': result.lead_id,
            'linkedin_url': result.linkedin_url,
            'message_sent': result.note_or_message,
            'template_used': template,
            'status': 'sent' if result.success else 'failed',
            'account_used': account
        })

    def get_connections_sent_today(self, account: str) -> int:
        """Get count of connections sent today"""
        today = date.today().isoformat()
        headers = self.headers.copy()
        headers["Prefer"] = "count=exact"

        response = requests.get(
            f"{self.base_url}/linkedin_connections_sent",
            headers=headers,
            params={
                "select": "*",
                "account_used": f"eq.{account}",
                "sent_at": f"gte.{today}T00:00:00"
            },
            timeout=30
        )
        content_range = response.headers.get("content-range", "*/0")
        return int(content_range.split("/")[1]) if "/" in content_range else 0

    def get_connections_sent_this_week(self, account: str) -> int:
        """Get count of connections sent this week"""
        week_start = (datetime.now() - timedelta(days=7)).isoformat()
        headers = self.headers.copy()
        headers["Prefer"] = "count=exact"

        response = requests.get(
            f"{self.base_url}/linkedin_connections_sent",
            headers=headers,
            params={
                "select": "*",
                "account_used": f"eq.{account}",
                "sent_at": f"gte.{week_start}"
            },
            timeout=30
        )
        content_range = response.headers.get("content-range", "*/0")
        return int(content_range.split("/")[1]) if "/" in content_range else 0

    def get_messages_sent_today(self, account: str) -> int:
        """Get count of messages sent today"""
        today = date.today().isoformat()
        headers = self.headers.copy()
        headers["Prefer"] = "count=exact"

        response = requests.get(
            f"{self.base_url}/linkedin_messages_sent",
            headers=headers,
            params={
                "select": "*",
                "account_used": f"eq.{account}",
                "sent_at": f"gte.{today}T00:00:00"
            },
            timeout=30
        )
        content_range = response.headers.get("content-range", "*/0")
        return int(content_range.split("/")[1]) if "/" in content_range else 0

    def update_lead_from_profile(self, lead_id: int, profile_data: dict):
        """Update lead with scraped profile data"""
        self._request("PATCH", "linkedin_leads",
            params={"id": f"eq.{lead_id}"},
            data={
                'full_name': profile_data.get('full_name'),
                'headline': profile_data.get('headline'),
                'company': profile_data.get('company'),
                'title': profile_data.get('title'),
                'location': profile_data.get('location'),
                'connections_count': profile_data.get('connections_count'),
                'updated_at': datetime.now().isoformat()
            }
        )

    def mark_connection_accepted(self, linkedin_url: str):
        """Mark a connection as accepted"""
        self._request("PATCH", "linkedin_connections_sent",
            params={"linkedin_url": f"eq.{linkedin_url}"},
            data={
                'status': 'accepted',
                'accepted_at': datetime.now().isoformat()
            }
        )


# ============================================
# LINKEDIN DM AGENT
# ============================================

class LinkedInDMAgent:
    """Automated LinkedIn outreach agent using Playwright"""

    def __init__(self, headless: bool = False, mode: ActionMode = ActionMode.CONNECTION):
        self.headless = headless
        self.mode = mode
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.db = LinkedInSupabaseDB()
        self.results: List[ActionResult] = []
        self.connections_sent = 0
        self.messages_sent = 0
        self.failed = 0
        self.skipped = 0
        self.account = LINKEDIN_EMAIL

    async def start(self):
        """Initialize browser and load session"""
        logger.info("🚀 Starting LinkedIn DM Agent...")
        logger.info(f"   Mode: {self.mode.value}")
        logger.info(f"   Headless: {self.headless}")
        logger.info(f"   Account: {self.account}")

        playwright = await async_playwright().start()

        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ]
        )

        context_options = {
            'viewport': {'width': 1280, 'height': 800},
            'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

        # Load session if exists
        if SESSION_PATH.exists():
            logger.info("📂 Loading existing session...")
            try:
                storage_state = json.loads(SESSION_PATH.read_text())
                context_options['storage_state'] = storage_state
            except Exception as e:
                logger.warning(f"Could not load session: {e}")

        self.context = await self.browser.new_context(**context_options)
        self.page = await self.context.new_page()

        # Apply stealth
        if STEALTH_AVAILABLE and stealth_async:
            await stealth_async(self.page)
            logger.info("   🥷 Stealth mode enabled")

        # Set extra headers
        await self.page.set_extra_http_headers({
            'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
        })

    async def save_session(self):
        """Save browser session"""
        try:
            storage = await self.context.storage_state()
            SESSION_PATH.write_text(json.dumps(storage, indent=2))
            logger.info(f"💾 Session saved to {SESSION_PATH}")
        except Exception as e:
            logger.error(f"Failed to save session: {e}")

    async def take_screenshot(self, name: str) -> Path:
        """Take screenshot for debugging"""
        screenshot_path = LOGS_DIR / f"linkedin_{name}_{datetime.now().strftime('%H%M%S')}.png"
        await self.page.screenshot(path=str(screenshot_path))
        logger.info(f"📸 Screenshot: {screenshot_path}")
        return screenshot_path

    async def check_for_block(self) -> tuple[bool, BlockType, str]:
        """Check if LinkedIn has blocked/restricted the account"""
        try:
            current_url = self.page.url
            page_content = await self.page.content()
            page_lower = page_content.lower()

            # CAPTCHA check - look for visible captcha elements, not just text in HTML
            captcha_selectors = [
                'iframe[src*="captcha"]',
                'div[class*="captcha"]',
                '#captcha',
                '[data-testid="captcha"]'
            ]
            for selector in captcha_selectors:
                captcha_el = await self.page.query_selector(selector)
                if captcha_el and await captcha_el.is_visible():
                    await self.take_screenshot("captcha_detected")
                    return True, BlockType.CAPTCHA, "CAPTCHA detected"
            
            # Also check if we're on a challenge page
            if '/checkpoint/' in current_url or '/challenge/' in current_url:
                await self.take_screenshot("captcha_detected")
                return True, BlockType.CAPTCHA, "Security challenge detected"

            # Profile not found (404) - check for "page not found" messages
            not_found_phrases = [
                'esta página não existe',
                'this page doesn\'t exist',
                'page not found',
                'perfil não encontrado',
                'profile not found'
            ]
            for phrase in not_found_phrases:
                if phrase in page_lower:
                    await self.take_screenshot("profile_not_found")
                    return True, BlockType.PROFILE_NOT_FOUND, "Profile not found (404)"

            # Rate limit check
            if 'you\'ve reached the weekly invitation limit' in page_lower:
                await self.take_screenshot("connection_limit")
                return True, BlockType.CONNECTION_LIMIT, "Weekly connection limit reached"

            if 'slow down' in page_lower or 'too many requests' in page_lower:
                await self.take_screenshot("rate_limited")
                return True, BlockType.RATE_LIMITED, "Rate limited by LinkedIn"

            # Account restriction - check for visible error messages only
            restriction_selectors = [
                'div[class*="error"]:has-text("restricted")',
                'div[class*="alert"]:has-text("restricted")',
                'div[class*="warning"]:has-text("limited")',
                'h1:has-text("restricted")',
                'h2:has-text("restricted")'
            ]
            for selector in restriction_selectors:
                try:
                    el = await self.page.query_selector(selector)
                    if el and await el.is_visible():
                        await self.take_screenshot("account_restricted")
                        return True, BlockType.ACCOUNT_RESTRICTED, "Account restricted"
                except:
                    pass

            return False, BlockType.NONE, ""

        except Exception as e:
            logger.error(f"Error checking block: {e}")
            return False, BlockType.UNKNOWN, str(e)

    async def login(self) -> bool:
        """Login to LinkedIn"""
        logger.info("🔐 Logging into LinkedIn...")

        try:
            await self.page.goto('https://www.linkedin.com/', wait_until='domcontentloaded', timeout=60000)
            await asyncio.sleep(3)

            # Check if already logged in
            if '/feed' in self.page.url or '/mynetwork' in self.page.url:
                try:
                    await self.page.wait_for_selector('nav', timeout=5000)
                    logger.info("✅ Already logged in!")
                    await self.save_session()
                    return True
                except:
                    pass

            # Navigate to login
            await self.page.goto('https://www.linkedin.com/login', wait_until='domcontentloaded', timeout=60000)
            await asyncio.sleep(2)

            # Fill credentials
            logger.info("   Entering credentials...")
            await self.page.fill('input#username', LINKEDIN_EMAIL)
            await asyncio.sleep(0.5)
            await self.page.fill('input#password', LINKEDIN_PASSWORD)
            await asyncio.sleep(0.5)

            # Click login
            await self.page.click('button[type="submit"]')
            await asyncio.sleep(5)

            # Check for verification
            if 'checkpoint' in self.page.url or 'challenge' in self.page.url:
                logger.warning("⚠️ Verification required! Complete manually...")
                logger.warning("   Waiting up to 2 minutes...")
                
                try:
                    await self.page.wait_for_url(
                        lambda url: 'checkpoint' not in url and 'challenge' not in url,
                        timeout=120000
                    )
                    logger.info("✅ Verification completed!")
                except:
                    logger.error("❌ Verification timeout")
                    await self.take_screenshot("verification_failed")
                    return False

            # Verify login success
            await asyncio.sleep(3)
            if '/feed' in self.page.url or await self.page.query_selector('nav'):
                logger.info("✅ Login successful!")
                await self.save_session()
                return True
            else:
                await self.take_screenshot("login_failed")
                logger.error("❌ Login verification failed")
                return False

        except Exception as e:
            logger.error(f"❌ Login error: {e}")
            await self.take_screenshot("login_error")
            return False

    def check_rate_limits(self) -> tuple[bool, str]:
        """Check if we can perform more actions"""
        if self.mode == ActionMode.CONNECTION or self.mode == ActionMode.HYBRID:
            conn_today = self.db.get_connections_sent_today(self.account)
            conn_week = self.db.get_connections_sent_this_week(self.account)

            if conn_today >= MAX_CONNECTIONS_PER_DAY:
                return False, f"Daily connection limit ({conn_today}/{MAX_CONNECTIONS_PER_DAY})"
            if conn_week >= MAX_CONNECTIONS_PER_WEEK:
                return False, f"Weekly connection limit ({conn_week}/{MAX_CONNECTIONS_PER_WEEK})"

        if self.mode == ActionMode.MESSAGE or self.mode == ActionMode.HYBRID:
            msg_today = self.db.get_messages_sent_today(self.account)
            if msg_today >= MAX_MESSAGES_PER_DAY:
                return False, f"Daily message limit ({msg_today}/{MAX_MESSAGES_PER_DAY})"

        return True, "OK"

    async def scrape_profile(self, lead: LinkedInLead) -> dict:
        """Scrape basic profile info from current page"""
        try:
            profile = {
                'full_name': None,
                'headline': None,
                'company': None,
                'location': None,
                'connections_count': None
            }

            # Name
            name_el = await self.page.query_selector('h1')
            if name_el:
                profile['full_name'] = await name_el.inner_text()

            # Headline
            headline_el = await self.page.query_selector('.text-body-medium')
            if headline_el:
                profile['headline'] = await headline_el.inner_text()

            # Extract company/title from headline
            if profile['headline'] and TEMPLATES_AVAILABLE:
                profile['company'] = extract_company_from_headline(profile['headline'])
                profile['title'] = extract_title_from_headline(profile['headline'])

            # Connections count (aproximado)
            conn_el = await self.page.query_selector('span.t-bold:has-text("connections")')
            if conn_el:
                conn_text = await conn_el.inner_text()
                # Extract number
                import re
                match = re.search(r'(\d+)', conn_text.replace(',', ''))
                if match:
                    profile['connections_count'] = int(match.group(1))

            return profile

        except Exception as e:
            logger.warning(f"Profile scrape error: {e}")
            return {}

    async def send_connection_request(self, lead: LinkedInLead, note: str) -> ActionResult:
        """Send connection request to a lead"""
        logger.info(f"🔗 Sending connection to: {lead.linkedin_url}")

        try:
            # Navigate to profile
            await self.page.goto(lead.linkedin_url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(random.uniform(4, 6))
            
            # Wait for profile to fully load
            try:
                await self.page.wait_for_selector('h1', timeout=10000)
            except:
                pass

            # Check for block
            blocked, block_type, block_msg = await self.check_for_block()
            if blocked:
                logger.error(f"⛔ Blocked: {block_msg}")
                return ActionResult(lead.id, lead.linkedin_url, 'connection', False, error=block_msg)

            # Scrape profile info
            profile_data = await self.scrape_profile(lead)
            if profile_data.get('full_name'):
                self.db.update_lead_from_profile(lead.id, profile_data)

            # Check if already connected or pending
            page_content = await self.page.content()
            if 'Pending' in page_content:
                logger.info(f"   ⏭️ Already pending connection")
                return ActionResult(lead.id, lead.linkedin_url, 'connection', False, error="Already pending")
            
            if 'Message' in page_content and 'Connect' not in page_content:
                logger.info(f"   ⏭️ Already connected")
                self.db.mark_connection_accepted(lead.linkedin_url)
                return ActionResult(lead.id, lead.linkedin_url, 'connection', False, error="Already connected")

            # Find Connect button
            connect_btn = await self.page.query_selector('button:has-text("Connect")')
            
            # If not found, try More menu
            if not connect_btn:
                more_btn = await self.page.query_selector('button:has-text("More")')
                if more_btn:
                    await more_btn.click()
                    await asyncio.sleep(1)
                    connect_btn = await self.page.query_selector('div[role="menuitem"]:has-text("Connect")')

            if not connect_btn:
                logger.warning(f"   ⚠️ Connect button not found")
                await self.take_screenshot(f"no_connect_{lead.username}")
                return ActionResult(lead.id, lead.linkedin_url, 'connection', False, error="Connect button not found")

            # Click Connect
            await connect_btn.click()
            await asyncio.sleep(2)

            # Look for "Add a note" button
            add_note_btn = await self.page.query_selector('button:has-text("Add a note")')
            if add_note_btn:
                await add_note_btn.click()
                await asyncio.sleep(1)

                # Find textarea and add note
                textarea = await self.page.query_selector('textarea[name="message"]')
                if textarea:
                    await textarea.fill(note[:300])  # Max 300 chars
                    await asyncio.sleep(0.5)

            # Click Send
            send_btn = await self.page.query_selector('button:has-text("Send")')
            if not send_btn:
                send_btn = await self.page.query_selector('button[aria-label="Send now"]')
            
            if send_btn:
                await send_btn.click()
                await asyncio.sleep(2)
                
                logger.info(f"   ✅ Connection sent to {lead.first_name or lead.username}")
                return ActionResult(lead.id, lead.linkedin_url, 'connection', True, note_or_message=note)
            else:
                await self.take_screenshot(f"no_send_{lead.username}")
                return ActionResult(lead.id, lead.linkedin_url, 'connection', False, error="Send button not found")

        except Exception as e:
            logger.error(f"   ❌ Error: {e}")
            await self.take_screenshot(f"error_{lead.username}")
            return ActionResult(lead.id, lead.linkedin_url, 'connection', False, error=str(e))

    async def send_message(self, lead: LinkedInLead, message: str) -> ActionResult:
        """Send message to an existing connection"""
        logger.info(f"💬 Sending message to: {lead.linkedin_url}")

        try:
            # Navigate to messaging
            await self.page.goto(lead.linkedin_url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(random.uniform(2, 4))

            # Check for block
            blocked, block_type, block_msg = await self.check_for_block()
            if blocked:
                logger.error(f"⛔ Blocked: {block_msg}")
                return ActionResult(lead.id, lead.linkedin_url, 'message', False, error=block_msg)

            # Click Message button
            msg_btn = await self.page.query_selector('button:has-text("Message")')
            if not msg_btn:
                logger.warning(f"   ⚠️ Not connected - can't message")
                return ActionResult(lead.id, lead.linkedin_url, 'message', False, error="Not connected")

            await msg_btn.click()
            await asyncio.sleep(2)

            # Find message input
            msg_input = await self.page.query_selector('div[role="textbox"]')
            if not msg_input:
                msg_input = await self.page.query_selector('textarea')

            if not msg_input:
                await self.take_screenshot(f"no_input_{lead.username}")
                return ActionResult(lead.id, lead.linkedin_url, 'message', False, error="Message input not found")

            # Type message
            await msg_input.click()
            await asyncio.sleep(0.5)
            await msg_input.fill(message)
            await asyncio.sleep(1)

            # Send message
            send_btn = await self.page.query_selector('button:has-text("Send")')
            if not send_btn:
                send_btn = await self.page.query_selector('button[type="submit"]')

            if send_btn:
                await send_btn.click()
                await asyncio.sleep(2)
                
                logger.info(f"   ✅ Message sent to {lead.first_name or lead.username}")
                return ActionResult(lead.id, lead.linkedin_url, 'message', True, note_or_message=message)
            else:
                # Try pressing Enter
                await msg_input.press('Enter')
                await asyncio.sleep(2)
                logger.info(f"   ✅ Message sent (via Enter) to {lead.first_name or lead.username}")
                return ActionResult(lead.id, lead.linkedin_url, 'message', True, note_or_message=message)

        except Exception as e:
            logger.error(f"   ❌ Error: {e}")
            await self.take_screenshot(f"msg_error_{lead.username}")
            return ActionResult(lead.id, lead.linkedin_url, 'message', False, error=str(e))

    def generate_connection_note(self, lead: LinkedInLead) -> str:
        """Generate personalized connection note"""
        if TEMPLATES_AVAILABLE:
            template = get_connection_template()
            variables = {
                'first_name': lead.first_name or 'você',
                'title': lead.title or 'profissional',
                'company': lead.company or 'sua empresa',
                'industry': lead.industry or 'sua área',
                'specialty': lead.title or 'sua especialidade'
            }
            note = render_template(template, variables)
            return truncate_connection_note(note, 300)
        else:
            return FALLBACK_CONNECTION_NOTE.format(first_name=lead.first_name or 'você')

    def generate_message(self, lead: LinkedInLead) -> str:
        """Generate personalized follow-up message"""
        if TEMPLATES_AVAILABLE:
            template = get_followup_template()
            variables = {
                'first_name': lead.first_name or 'você',
                'title': lead.title or 'profissional',
                'company': lead.company or 'sua empresa',
                'industry': lead.industry or 'sua área',
                'specialty': lead.title or 'sua especialidade',
                'solution': 'estratégias de crescimento',
                'pain_point': 'aquisição de clientes',
                'target_audience': 'empresas B2B',
                'benefit': 'escalar vendas'
            }
            return render_template(template, variables)
        else:
            return FALLBACK_MESSAGE.format(
                first_name=lead.first_name or 'você',
                specialty=lead.title or 'sua área'
            )

    async def run_connections(self, limit: int = 20):
        """Run connection request campaign"""
        logger.info(f"🔗 Starting connection campaign (limit: {limit})")

        # Check limits
        can_continue, limit_msg = self.check_rate_limits()
        if not can_continue:
            logger.warning(f"⚠️ {limit_msg}")
            return

        # Get leads
        leads = self.db.get_leads_for_connection(limit)
        if not leads:
            logger.info("No leads to connect with")
            return

        for i, lead in enumerate(leads):
            # Re-check limits
            can_continue, limit_msg = self.check_rate_limits()
            if not can_continue:
                logger.warning(f"⚠️ {limit_msg}")
                break

            # Generate note
            note = self.generate_connection_note(lead)

            # Send connection
            result = await self.send_connection_request(lead, note)
            self.results.append(result)

            # Record
            self.db.record_connection_sent(result, self.account)

            if result.success:
                self.connections_sent += 1
            else:
                if 'Already' in (result.error or ''):
                    self.skipped += 1
                else:
                    self.failed += 1

            # Progress
            logger.info(f"Progress: {i+1}/{len(leads)} | Sent: {self.connections_sent} | Failed: {self.failed}")

            # Delay
            if i < len(leads) - 1:
                delay = random.randint(MIN_CONN_DELAY, MAX_CONN_DELAY)
                logger.info(f"⏳ Waiting {delay}s...")
                await asyncio.sleep(delay)

    async def run_messages(self, limit: int = 30):
        """Run message campaign to existing connections"""
        logger.info(f"💬 Starting message campaign (limit: {limit})")

        # Check limits
        can_continue, limit_msg = self.check_rate_limits()
        if not can_continue:
            logger.warning(f"⚠️ {limit_msg}")
            return

        # Get connections
        leads = self.db.get_connections_for_message(limit)
        if not leads:
            logger.info("No connections to message")
            return

        for i, lead in enumerate(leads):
            # Generate message
            message = self.generate_message(lead)

            # Send message
            result = await self.send_message(lead, message)
            self.results.append(result)

            # Record
            self.db.record_message_sent(result, "followup", self.account)

            if result.success:
                self.messages_sent += 1
            else:
                if 'Not connected' in (result.error or ''):
                    self.skipped += 1
                else:
                    self.failed += 1

            # Progress
            logger.info(f"Progress: {i+1}/{len(leads)} | Sent: {self.messages_sent} | Failed: {self.failed}")

            # Delay
            if i < len(leads) - 1:
                delay = random.randint(MIN_MSG_DELAY, MAX_MSG_DELAY)
                logger.info(f"⏳ Waiting {delay}s...")
                await asyncio.sleep(delay)

    async def run_campaign(self, limit: int = 20):
        """Run campaign based on mode"""
        # Ensure logged in
        await self.page.goto('https://www.linkedin.com/feed/', wait_until='domcontentloaded')
        await asyncio.sleep(3)

        if 'login' in self.page.url:
            success = await self.login()
            if not success:
                logger.error("Login failed, aborting")
                return

        # Start run
        self.db.start_run(self.mode.value, self.account)

        try:
            if self.mode == ActionMode.CONNECTION:
                await self.run_connections(limit)
            elif self.mode == ActionMode.MESSAGE:
                await self.run_messages(limit)
            elif self.mode == ActionMode.HYBRID:
                # Split limit between connections and messages
                await self.run_connections(limit // 2)
                await self.run_messages(limit // 2)

            # Save session
            await self.save_session()

            # End run
            self.db.end_run(
                self.connections_sent,
                self.messages_sent,
                self.failed,
                self.skipped,
                'completed'
            )

        except Exception as e:
            logger.error(f"Campaign error: {e}")
            self.db.end_run(
                self.connections_sent,
                self.messages_sent,
                self.failed,
                self.skipped,
                'error',
                str(e)
            )

    async def stop(self):
        """Cleanup"""
        if self.context:
            await self.save_session()
            await self.context.close()
        if self.browser:
            await self.browser.close()
        logger.info("Agent stopped")


# ============================================
# MAIN
# ============================================

async def main():
    parser = argparse.ArgumentParser(description='LinkedIn DM Agent')
    parser.add_argument('--headless', action='store_true', help='Run without browser window')
    parser.add_argument('--login-only', action='store_true', help='Only login and save session')
    parser.add_argument('--mode', type=str, default='connection', 
                        choices=['connection', 'message', 'hybrid'],
                        help='Operation mode')
    parser.add_argument('--limit', type=int, default=20, help='Max actions this run')
    args = parser.parse_args()

    # Validate env vars
    if not LINKEDIN_EMAIL or not LINKEDIN_PASSWORD:
        logger.error("❌ Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env")
        sys.exit(1)

    if not SUPABASE_KEY:
        logger.error("❌ Set SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)

    mode = ActionMode(args.mode)
    agent = LinkedInDMAgent(headless=args.headless, mode=mode)

    try:
        await agent.start()

        if args.login_only:
            success = await agent.login()
            if success:
                logger.info("✅ Login complete. Session saved.")
                sys.exit(0)
            else:
                logger.error("❌ Login failed")
                sys.exit(1)
        else:
            await agent.run_campaign(limit=args.limit)

            # Summary
            logger.info("=" * 50)
            logger.info("📊 CAMPAIGN SUMMARY")
            logger.info("=" * 50)
            logger.info(f"   Connections sent: {agent.connections_sent}")
            logger.info(f"   Messages sent: {agent.messages_sent}")
            logger.info(f"   Failed: {agent.failed}")
            logger.info(f"   Skipped: {agent.skipped}")
            logger.info("=" * 50)

    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        await agent.stop()


if __name__ == "__main__":
    asyncio.run(main())
