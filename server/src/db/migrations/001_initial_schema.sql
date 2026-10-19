-- ============================================================
--  SkillConnect — Initial Schema
--  Migration: 001_initial_schema.sql
--  Engine: PostgreSQL ≥ 14
--
--  Apply with:
--    psql -U <user> -d skillconnect -f 001_initial_schema.sql
--
--  This file is idempotent: safe to run more than once.
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ─── Schema version table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT        PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: skip if this migration was already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_schema') THEN
    RAISE NOTICE 'Migration 001_initial_schema already applied — skipping.';
    RETURN;
  END IF;
END $$;

-- ─── Custom ENUM Types ───────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'company', 'institution', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM ('draft', 'open', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_type AS ENUM ('internship', 'project', 'full_time', 'part_time', 'contract');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('video', 'article', 'course', 'book', 'tool', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. institutions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institutions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  location     TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. users ────────────────────────────────────────────────────
--  password_hash stores the bcrypt hash — never plaintext.
CREATE TABLE IF NOT EXISTS users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  password_hash  TEXT        NOT NULL,
  role           user_role   NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ─── 3. student_profiles ─────────────────────────────────────────
--  user_id is both PK and FK — enforces a strict 1-to-1 with users.
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id          UUID NOT NULL,
  institution_id   UUID,
  degree           TEXT,
  branch           TEXT,
  graduation_year  SMALLINT CHECK (graduation_year BETWEEN 1950 AND 2100),
  bio              TEXT,

  CONSTRAINT student_profiles_pk            PRIMARY KEY (user_id),
  CONSTRAINT student_profiles_user_fk       FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
  CONSTRAINT student_profiles_institution_fk FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_institution ON student_profiles (institution_id);

-- ─── 4. company_profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_profiles (
  user_id       UUID NOT NULL,
  company_name  TEXT NOT NULL,
  description   TEXT,
  website       TEXT,

  CONSTRAINT company_profiles_pk      PRIMARY KEY (user_id),
  CONSTRAINT company_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── 5. skills ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT skills_name_category_unique UNIQUE (name, category)
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);
CREATE INDEX IF NOT EXISTS idx_skills_name     ON skills (name);

-- ─── 6. student_skills ───────────────────────────────────────────
--  Composite PK prevents duplicate skill entries per student.
--  proficiency_level: 1 (beginner) → 5 (expert).
CREATE TABLE IF NOT EXISTS student_skills (
  student_id        UUID     NOT NULL,
  skill_id          UUID     NOT NULL,
  proficiency_level SMALLINT NOT NULL DEFAULT 1
    CHECK (proficiency_level BETWEEN 1 AND 5),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_skills_pk         PRIMARY KEY (student_id, skill_id),
  CONSTRAINT student_skills_student_fk FOREIGN KEY (student_id) REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT student_skills_skill_fk   FOREIGN KEY (skill_id)   REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_skills_skill_id ON student_skills (skill_id);

-- ─── 7. opportunities ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID             NOT NULL,
  title             TEXT             NOT NULL,
  description       TEXT,
  opportunity_type  opportunity_type NOT NULL,
  location          TEXT,
  deadline          DATE,
  status            opportunity_status NOT NULL DEFAULT 'open',
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT opportunities_company_fk FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities (company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status     ON opportunities (status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline   ON opportunities (deadline);

-- ─── 8. opportunity_skills ───────────────────────────────────────
--  required_proficiency: 1–5, same scale as student_skills.
--  importance: 1 (nice-to-have) → 3 (must-have).
CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id        UUID     NOT NULL,
  skill_id              UUID     NOT NULL,
  required_proficiency  SMALLINT NOT NULL DEFAULT 1
    CHECK (required_proficiency BETWEEN 1 AND 5),
  importance            SMALLINT NOT NULL DEFAULT 1
    CHECK (importance BETWEEN 1 AND 3),

  CONSTRAINT opportunity_skills_pk             PRIMARY KEY (opportunity_id, skill_id),
  CONSTRAINT opportunity_skills_opportunity_fk FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  CONSTRAINT opportunity_skills_skill_fk       FOREIGN KEY (skill_id)       REFERENCES skills(id)        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill_id ON opportunity_skills (skill_id);

-- ─── 9. applications ─────────────────────────────────────────────
--  UNIQUE (opportunity_id, student_id) prevents duplicate applications
--  at the database level — no application-layer guard needed.
CREATE TABLE IF NOT EXISTS applications (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID               NOT NULL,
  student_id      UUID               NOT NULL,
  status          application_status NOT NULL DEFAULT 'pending',
  cover_letter    TEXT,
  applied_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT applications_opportunity_fk         FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  CONSTRAINT applications_student_fk             FOREIGN KEY (student_id)     REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT applications_no_duplicate_unique    UNIQUE (opportunity_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student_id     ON applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status         ON applications (status);

-- ─── 10. projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL,
  title        TEXT        NOT NULL,
  description  TEXT,
  project_url  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_student_fk FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_student_id ON projects (student_id);

-- ─── 11. learning_resources ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_resources (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id      UUID          NOT NULL,
  title         TEXT          NOT NULL,
  description   TEXT,
  resource_url  TEXT,
  resource_type resource_type NOT NULL DEFAULT 'other',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT learning_resources_skill_fk FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_skill_id ON learning_resources (skill_id);

-- ─── 12. skill_progress ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_progress (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID            NOT NULL,
  skill_id    UUID            NOT NULL,
  status      progress_status NOT NULL DEFAULT 'not_started',
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT skill_progress_student_fk FOREIGN KEY (student_id) REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT skill_progress_skill_fk   FOREIGN KEY (skill_id)   REFERENCES skills(id) ON DELETE CASCADE,
  CONSTRAINT skill_progress_unique     UNIQUE (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_progress_student_id ON skill_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_skill_id   ON skill_progress (skill_id);

-- ─── Mark this migration as applied ──────────────────────────────
INSERT INTO schema_migrations (version)
VALUES ('001_initial_schema')
ON CONFLICT (version) DO NOTHING;

-- ─── Done ─────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ Migration 001_initial_schema applied successfully.';
END $$;
