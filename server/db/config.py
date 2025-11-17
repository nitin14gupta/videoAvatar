import os
from supabase import create_client, Client
from dotenv import load_dotenv


_env_loaded = load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

