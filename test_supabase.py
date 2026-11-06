"""Paso 2: leer las lecturas de las últimas 24 h desde Supabase."""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not url or not key:
    raise SystemExit("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env")

# service_role salta RLS: usar solo en scripts locales/servidor, nunca en el ESP32 ni en el dashboard.
supabase = create_client(url, key)

since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

logs = (
    supabase.table("street_light_logs")
    .select("created_at, pole_a_pct, pole_b_pct")
    .gte("created_at", since)
    .order("created_at")
    .limit(1000)
    .execute()
    .data
)

alerts = (
    supabase.table("alerts")
    .select("pole, type, status, started_at, last_seen_at, resolved_at, cause")
    .gte("last_seen_at", since)
    .execute()
    .data
)

print(f"Lecturas en las últimas 24 h: {len(logs)}")
for row in logs[-5:]:
    print(row)
print(f"Alertas en las últimas 24 h: {len(alerts)}")
for row in alerts:
    print(row)
