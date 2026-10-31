-- REA Studio SaaS foundation -- draft for controlled migration, NOT auto-applied.
-- Additive to existing D1 schema. Never activate billing from this file.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS organization_members (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (organization_id,user_id)
);
CREATE INDEX IF NOT EXISTS org_members_by_user ON organization_members(user_id,organization_id);
CREATE TABLE IF NOT EXISTS plan_catalog (
  code TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  jobs_month INTEGER NOT NULL CHECK(jobs_month>=0),
  max_artifact_bytes INTEGER NOT NULL CHECK(max_artifact_bytes>=0),
  billing_enabled INTEGER NOT NULL DEFAULT 0 CHECK(billing_enabled=0),
  monthly_price_minor INTEGER NOT NULL DEFAULT 0 CHECK(monthly_price_minor=0)
);
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  organization_id TEXT PRIMARY KEY NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES plan_catalog(code),
  state TEXT NOT NULL DEFAULT 'evaluation' CHECK(state IN ('evaluation','inactive')),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS execution_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL,
  project_id TEXT,
  operation TEXT NOT NULL CHECK(operation IN ('javascript','android-package','managed-artifact','managed-members','artifact','network-har','network-saz','network-qlog','browser-page')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed','cancelled')),
  input_artifact_id TEXT,
  result_artifact_id TEXT,
  idempotency_key TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 4),
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  error_code TEXT,
  UNIQUE(organization_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS execution_jobs_by_tenant ON execution_jobs(organization_id,status,created_at);
CREATE TABLE IF NOT EXISTS artifact_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id TEXT,
  sha256 TEXT NOT NULL CHECK(length(sha256)=64),
  bytes INTEGER NOT NULL CHECK(bytes BETWEEN 0 AND 67108864),
  mime_type TEXT NOT NULL,
  private_object_key TEXT NOT NULL UNIQUE,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK(scan_status IN ('pending','clean','quarantined','rejected')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS artifact_expiry ON artifact_metadata(expires_at);
CREATE TABLE IF NOT EXISTS usage_counters (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_month TEXT NOT NULL,
  completed_jobs INTEGER NOT NULL DEFAULT 0 CHECK(completed_jobs>=0),
  stored_bytes INTEGER NOT NULL DEFAULT 0 CHECK(stored_bytes>=0),
  PRIMARY KEY (organization_id,period_month)
);
CREATE TABLE IF NOT EXISTS operational_audit (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  created_at TEXT NOT NULL,
  detail_redacted TEXT
);
CREATE INDEX IF NOT EXISTS operational_audit_tenant ON operational_audit(organization_id,created_at);
INSERT OR IGNORE INTO plan_catalog(code,display_name,jobs_month,max_artifact_bytes) VALUES
  ('evaluation','Avaliação',10,10485760),('developer','Desenvolvimento',50,67108864);
