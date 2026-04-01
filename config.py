import os
from supabase import create_client
from dotenv import load_dotenv
import os
load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))
load_dotenv()
SUPABASE_URL = os.getenv("https://bvrkpzvwmsprsjqxheuf.supabase.co")
SUPABASE_KEY = os.getenv("sb_publishable_34ad_Z61-J9Z0Rvkeq47rg_05AKHjCd")
def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

print("SUPABASE_URL:", SUPABASE_URL)