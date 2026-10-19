-- ============================================================
--  SkillConnect — Performance Optimization Indexes
--  Migration: 002_add_indexes.sql
--  Engine: PostgreSQL ≥ 14
--
--  Apply with:
--    psql -U <user> -d skillconnect -f 002_add_indexes.sql
--
--  This file is idempotent: safe to run more than once.
-- ============================================================

-- ─── Schema version table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT        PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: skip if this migration was already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version IN ('002_add_indexes', '003_add_indexes')) THEN
    RAISE NOTICE 'Migration 002_add_indexes already applied — skipping.';
    RETURN;
  END IF;
END $$;

-- ─── 1. Skills NULL-safe & Case-insensitive Unique Index ─────────
-- In PostgreSQL, UNIQUE(name, category) allows duplicates if category is NULL.
-- This expression index prevents duplicate skill names with NULL/matching category.
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_name_coalesce_category 
  ON skills (LOWER(name), COALESCE(LOWER(category), ''));

-- ─── 2. Explicit First-column Composite PK Secondary Indexes ──────
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON student_skills (student_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_opportunity_id ON opportunity_skills (opportunity_id);

-- ─── Mark this migration as applied ──────────────────────────────
INSERT INTO schema_migrations (version)
VALUES ('002_add_indexes')
ON CONFLICT (version) DO NOTHING;

-- ─── Done ─────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ Migration 002_add_indexes applied successfully.';
END $$;
