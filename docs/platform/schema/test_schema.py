import sqlite3
from pathlib import Path
from datetime import datetime, timezone

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript(Path("docs/platform/schema/saas-foundation.sql").read_text(encoding="utf-8"))
tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
required={"organizations","organization_members","plan_catalog","organization_subscriptions","execution_jobs","artifact_metadata","usage_counters","operational_audit"}
assert required <= tables, (required-tables)
now=datetime.now(timezone.utc).isoformat()
db.execute("INSERT INTO organizations(id,name,owner_user_id,created_at,updated_at) VALUES(?,?,?,?,?)",("t1","Test Org","owner",now,now))
db.execute("INSERT INTO organization_members(organization_id,user_id,role,created_at) VALUES(?,?,?,?)",("t1","owner","owner",now))
try:
    db.execute("INSERT INTO organization_members(organization_id,user_id,role,created_at) VALUES(?,?,?,?)",("t1","bad","superuser",now))
    raise AssertionError("invalid role accepted")
except sqlite3.IntegrityError: pass
assert db.execute("SELECT billing_enabled,monthly_price_minor FROM plan_catalog WHERE code='developer'").fetchone()==(0,0)
db.execute("INSERT INTO execution_jobs(id,organization_id,requester_id,operation,idempotency_key,created_at) VALUES(?,?,?,?,?,?)",("job1","t1","owner","javascript","req1",now))
try:
    db.execute("INSERT INTO execution_jobs(id,organization_id,requester_id,operation,idempotency_key,created_at) VALUES(?,?,?,?,?,?)",("job2","t1","owner","javascript","req1",now))
    raise AssertionError("duplicate request accepted")
except sqlite3.IntegrityError: pass
try:
    db.execute("INSERT INTO execution_jobs(id,organization_id,requester_id,operation,idempotency_key,created_at) VALUES(?,?,?,?,?,?)",("job3","nonexistent","owner","javascript","req2",now))
    raise AssertionError("nonexistent tenant accepted")
except sqlite3.IntegrityError: pass
print("SaaS schema constraints PASS (tenants, roles, idempotency, references and billing disabled)")
