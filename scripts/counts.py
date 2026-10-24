"""Live user/listing counts from Supabase (reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env).

Usage: python3 scripts/counts.py
Team members are excluded by name (edit TEAM below).
"""
import json, re, urllib.request
from datetime import datetime, timedelta, timezone

TEAM = r"hemanth|rashmimayuri|aryan"
TEST_NUMBER = "9845012345"

env = dict(
    line.strip().split("=", 1)
    for line in open(".env")
    if "=" in line and not line.lstrip().startswith("#")
)
URL, KEY = env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]


def get(path):
    req = urllib.request.Request(URL + path, headers={"apikey": KEY, "Authorization": f"Bearer {KEY}"})
    return json.load(urllib.request.urlopen(req))


users = get("/auth/v1/admin/users?per_page=1000")["users"]
listings = get("/rest/v1/listings?select=created_at,seller_whatsapp,title,data->>user_id&order=created_at.asc")
feedback = get("/rest/v1/feedback?select=id")

name = lambda u: u.get("user_metadata", {}).get("full_name") or u.get("user_metadata", {}).get("name") or ""
outside = [u for u in users if not re.search(TEAM, name(u), re.I)]
ids = {u["id"] for u in outside}
out_listings = [l for l in listings if l["user_id"] in ids]
active = {l["user_id"] for l in out_listings}
ist = timezone(timedelta(hours=5, minutes=30))

print(f"As of {datetime.now(ist):%H:%M} IST (team excluded)")
print(f"  Sign-ups:            {len(outside)}")
print(f"  With a listing:      {len(active)}")
print(f"  Listings:            {len(out_listings)}")
print(f"  No listing yet:      {', '.join(name(u) for u in outside if u['id'] not in active) or '-'}")
print(f"  Feedback (all):      {len(feedback)}")
print(f"  All sign-ups incl. team: {len(users)} | all real listings: {sum(1 for l in listings if not l['seller_whatsapp'].endswith(TEST_NUMBER))}")
