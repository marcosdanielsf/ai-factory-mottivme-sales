#!/usr/bin/env python3
"""
Campaign Worker - Socialfy Instagram Automation
Polls Supabase for active campaigns and dispatches DMs via instagram_dm_agent.py

Usage:
    python campaign_worker.py              # Single execution
    python campaign_worker.py --daemon     # Continuous polling (every 5 min)
"""

import subprocess
import os
import sys
import json
import logging
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase")
    sys.exit(1)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bfumywvwubvernvhjehk.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))

# Tables
TABLE_CAMPAIGNS = "socialfy_campaigns"
TABLE_ACCOUNTS = "instagram_accounts"
TABLE_LEADS = "agentic_instagram_leads"  # Fallback: new_followers_detected
TABLE_DM_SENT = "agentic_instagram_dm_sent"

# Limits
MAX_DMS_PER_DAY = 200
COOLDOWN_MINUTES = 30
DEFAULT_BATCH_LIMIT = 10

# Paths
SCRIPT_DIR = Path(__file__).parent
DM_AGENT_PATH = SCRIPT_DIR / "instagram_dm_agent.py"
LOG_DIR = SCRIPT_DIR / "logs"
LOG_FILE = LOG_DIR / f"campaign_worker_{datetime.now().strftime('%Y-%m-%d')}.log"

# ============================================================================
# LOGGING SETUP
# ============================================================================

LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("campaign_worker")


# ============================================================================
# SUPABASE CLIENT
# ============================================================================

def get_supabase_client() -> Client:
    """Initialize Supabase client with service role key."""
    if not SUPABASE_SERVICE_KEY:
        raise ValueError(
            "SUPABASE_SERVICE_KEY not set. "
            "Export it: export SUPABASE_SERVICE_KEY='your-key'"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ============================================================================
# CAMPAIGN FUNCTIONS
# ============================================================================

def get_active_campaigns(supabase: Client) -> list:
    """
    Fetch campaigns that are:
    - status = 'active'
    - type = 'instagram_dm'
    - next_run_at < NOW() (or null)
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    
    try:
        # Query active campaigns ready to run
        response = supabase.table(TABLE_CAMPAIGNS).select("*").eq(
            "status", "active"
        ).eq(
            "type", "instagram_dm"
        ).or_(
            f"next_run_at.is.null,next_run_at.lt.{now_iso}"
        ).execute()
        
        campaigns = response.data or []
        logger.info(f"Found {len(campaigns)} active campaign(s) ready to run")
        return campaigns
        
    except Exception as e:
        logger.error(f"Error fetching campaigns: {e}")
        return []


def get_daily_dm_count(supabase: Client, account_id: str) -> int:
    """Count DMs sent today by this account."""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat()
    
    try:
        response = supabase.table(TABLE_DM_SENT).select(
            "id", count="exact"
        ).eq(
            "account_id", account_id
        ).gte(
            "sent_at", today_start
        ).execute()
        
        count = response.count or 0
        logger.debug(f"Account {account_id} sent {count} DMs today")
        return count
        
    except Exception as e:
        logger.warning(f"Error counting daily DMs: {e}")
        return 0


def get_pending_leads_count(supabase: Client, campaign_id: str) -> int:
    """Count leads that haven't received a DM yet."""
    try:
        response = supabase.table(TABLE_LEADS).select(
            "id", count="exact"
        ).eq(
            "campaign_id", campaign_id
        ).eq(
            "dm_sent", False
        ).execute()
        
        return response.count or 0
        
    except Exception as e:
        logger.warning(f"Error counting pending leads: {e}")
        return 0


def update_campaign_next_run(supabase: Client, campaign_id: str) -> bool:
    """Set next_run_at to NOW + cooldown."""
    next_run = datetime.now(timezone.utc) + timedelta(minutes=COOLDOWN_MINUTES)
    
    try:
        supabase.table(TABLE_CAMPAIGNS).update({
            "next_run_at": next_run.isoformat(),
            "last_run_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", campaign_id).execute()
        
        logger.info(f"Campaign {campaign_id} next run at {next_run.strftime('%H:%M:%S')}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating campaign next_run: {e}")
        return False


def log_campaign_execution(
    supabase: Client, 
    campaign_id: str, 
    status: str, 
    dms_sent: int = 0, 
    error: Optional[str] = None
):
    """Log campaign execution to database (optional, for monitoring)."""
    try:
        # Try to insert into a logs table if it exists
        supabase.table("socialfy_campaign_logs").insert({
            "campaign_id": campaign_id,
            "executed_at": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "dms_sent": dms_sent,
            "error": error
        }).execute()
    except Exception:
        # Table might not exist, just log locally
        pass


# ============================================================================
# DM AGENT EXECUTION
# ============================================================================

def run_dm_agent(account_id: str, limit: int, campaign_id: str) -> tuple[bool, int, str]:
    """
    Execute instagram_dm_agent.py as subprocess.
    
    Returns:
        (success: bool, dms_sent: int, error_message: str)
    """
    if not DM_AGENT_PATH.exists():
        return False, 0, f"DM agent not found at {DM_AGENT_PATH}"
    
    cmd = [
        sys.executable,
        str(DM_AGENT_PATH),
        "--account-id", account_id,
        "--limit", str(limit),
        "--campaign-id", campaign_id
    ]
    
    logger.info(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=str(SCRIPT_DIR)
        )
        
        if result.returncode == 0:
            # Try to parse output for DM count
            output = result.stdout
            logger.debug(f"Agent output: {output}")
            
            # Look for "Sent X DMs" pattern
            dms_sent = 0
            for line in output.split("\n"):
                if "sent" in line.lower() and "dm" in line.lower():
                    import re
                    match = re.search(r"(\d+)", line)
                    if match:
                        dms_sent = int(match.group(1))
                        break
            
            return True, dms_sent, ""
        else:
            error = result.stderr or result.stdout or "Unknown error"
            logger.error(f"Agent failed: {error}")
            return False, 0, error[:500]
            
    except subprocess.TimeoutExpired:
        return False, 0, "Timeout: Agent took too long"
    except Exception as e:
        return False, 0, str(e)


# ============================================================================
# MAIN PROCESS
# ============================================================================

def process_campaign(supabase: Client, campaign: dict) -> bool:
    """Process a single campaign."""
    campaign_id = campaign.get("id")
    account_id = campaign.get("account_id")
    campaign_name = campaign.get("name", "Unnamed")
    batch_limit = campaign.get("batch_limit", DEFAULT_BATCH_LIMIT)
    
    logger.info(f"=" * 60)
    logger.info(f"Processing campaign: {campaign_name} (ID: {campaign_id})")
    
    if not account_id:
        logger.error(f"Campaign {campaign_id} has no account_id")
        return False
    
    # Check daily limit
    daily_count = get_daily_dm_count(supabase, account_id)
    remaining = MAX_DMS_PER_DAY - daily_count
    
    if remaining <= 0:
        logger.warning(f"Daily limit reached for account {account_id} ({daily_count}/{MAX_DMS_PER_DAY})")
        update_campaign_next_run(supabase, campaign_id)
        return False
    
    # Check pending leads
    pending_leads = get_pending_leads_count(supabase, campaign_id)
    if pending_leads == 0:
        logger.info(f"No pending leads for campaign {campaign_id}")
        update_campaign_next_run(supabase, campaign_id)
        return True
    
    # Calculate batch size
    batch_size = min(batch_limit, remaining, pending_leads)
    logger.info(f"Sending batch of {batch_size} DMs (daily: {daily_count}/{MAX_DMS_PER_DAY}, pending: {pending_leads})")
    
    # Run DM agent
    success, dms_sent, error = run_dm_agent(account_id, batch_size, campaign_id)
    
    if success:
        logger.info(f"✓ Campaign {campaign_name}: Sent {dms_sent} DMs successfully")
        log_campaign_execution(supabase, campaign_id, "success", dms_sent)
    else:
        logger.error(f"✗ Campaign {campaign_name} failed: {error}")
        log_campaign_execution(supabase, campaign_id, "error", 0, error)
    
    # Always update next_run to prevent rapid retries
    update_campaign_next_run(supabase, campaign_id)
    
    return success


def main():
    """Main execution loop."""
    parser = argparse.ArgumentParser(description="Campaign Worker - Socialfy Instagram Automation")
    parser.add_argument("--daemon", action="store_true", help="Run continuously (poll every 5 min)")
    parser.add_argument("--interval", type=int, default=300, help="Polling interval in seconds (default: 300)")
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Campaign Worker Started")
    logger.info(f"Supabase: {SUPABASE_URL}")
    logger.info(f"DM Agent: {DM_AGENT_PATH}")
    logger.info(f"Log file: {LOG_FILE}")
    logger.info("=" * 60)
    
    try:
        supabase = get_supabase_client()
        logger.info("✓ Supabase connected")
    except Exception as e:
        logger.critical(f"Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    def run_once():
        """Single execution cycle."""
        campaigns = get_active_campaigns(supabase)
        
        if not campaigns:
            logger.info("No campaigns to process")
            return
        
        for campaign in campaigns:
            try:
                process_campaign(supabase, campaign)
            except Exception as e:
                logger.exception(f"Error processing campaign {campaign.get('id')}: {e}")
    
    if args.daemon:
        import time
        logger.info(f"Running in daemon mode (interval: {args.interval}s)")
        while True:
            try:
                run_once()
                logger.info(f"Sleeping {args.interval}s until next poll...")
                time.sleep(args.interval)
            except KeyboardInterrupt:
                logger.info("Daemon stopped by user")
                break
    else:
        run_once()
    
    logger.info("Campaign Worker finished")


if __name__ == "__main__":
    main()
