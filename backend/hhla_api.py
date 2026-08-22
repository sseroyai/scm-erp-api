import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def fetch_hhla_eta(vessel_name_full: str):
    """
    Mock function to fetch scheduled arrival time from HHLA for a given vessel.
    """
    if not vessel_name_full:
        return None
        
    # Extract pure vessel name (e.g., "ONE TRIBUTE 031W" -> "ONE TRIBUTE")
    # Removing the last word if it looks like a voyage number (digits followed by optional letter)
    vessel_name = re.sub(r'\s+[0-9]+[a-zA-Z]*$', '', vessel_name_full).strip()
    
    logger.info(f"[HHLA API] Querying vessel schedule for: '{vessel_name}' (Original: '{vessel_name_full}')")
    
    # In a real scenario, this would use httpx.AsyncClient() to hit coast.hhla.de
    # async with httpx.AsyncClient() as client:
    #     res = await client.get(f"https://coast.hhla.de/api/vessel?name={vessel_name}")
    #     data = res.json()
    #     ...
    
    # MOCK implementation based on requirements
    if vessel_name.upper() == "ONE TRIBUTE":
        # Returning mocked datetime
        return datetime.fromisoformat("2026-08-31T09:00:00")
    elif vessel_name.upper() == "ONE TRIUMPH":
        return datetime.fromisoformat("2026-09-09T06:00:00")
    elif vessel_name.upper() == "ONE INTELLIGENCE":
        return datetime.fromisoformat("2026-08-13T06:30:00")
        
    return None

def fetch_hhla_eta_sync(vessel_name_full: str):
    """Synchronous version for background tasks using normal sync sqlalchemy sessions."""
    if not vessel_name_full:
        return None
        
    vessel_name = re.sub(r'\s+[0-9]+[a-zA-Z]*$', '', vessel_name_full).strip()
    logger.info(f"[HHLA API] Querying vessel schedule for: '{vessel_name}' (Original: '{vessel_name_full}')")
    
    if vessel_name.upper() == "ONE TRIBUTE":
        return datetime.fromisoformat("2026-08-31T09:00:00")
    elif vessel_name.upper() == "ONE TRIUMPH":
        return datetime.fromisoformat("2026-09-09T06:00:00")
    elif vessel_name.upper() == "ONE INTELLIGENCE":
        return datetime.fromisoformat("2026-08-13T06:30:00")
        
    return None
