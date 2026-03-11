import urllib.request
import json

# Supabase connection
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Check if fuu_schedule_followup exists
def check_function_exists(func_name):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{func_name}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return True
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return False
        # 400 means function exists but wrong params
        if e.code == 400:
            return True
        return False

# Try to call SQL via pg_query function if exists
def try_execute_sql(sql):
    # First try if there's a query function
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    data = {"sql": sql}
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return True, response.read().decode()
    except urllib.error.HTTPError as e:
        return False, e.read().decode()

print("=== Checking prerequisites ===")
print(f"fuu_schedule_followup exists: {check_function_exists('fuu_schedule_followup')}")
print(f"fuu_cancel_followup exists: {check_function_exists('fuu_cancel_followup')}")

print("\n=== Trying SQL execution ===")
success, result = try_execute_sql("SELECT 1")
print(f"exec_sql available: {success}")
if not success:
    print("Result:", result[:200] if len(result) > 200 else result)
