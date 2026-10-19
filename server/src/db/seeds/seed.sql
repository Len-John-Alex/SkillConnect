-- ============================================================
--  SkillConnect — Development Seed Data
--  File: seed.sql
--
--  PURPOSE: Local development only. Contains no real user data.
--  DO NOT run this against a production database.
--
--  Apply with:
--    psql -U <user> -d skillconnect -f seed.sql
--
--  This file is idempotent via ON CONFLICT DO NOTHING.
-- ============================================================

-- ─── Institutions ────────────────────────────────────────────────
INSERT INTO institutions (id, name, location, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'IIT Bombay',   'Mumbai, Maharashtra',   'Premier engineering institute in India'),
  ('00000000-0000-0000-0000-000000000002', 'IIT Delhi',    'New Delhi',              'Top-ranked technical university'),
  ('00000000-0000-0000-0000-000000000003', 'BITS Pilani',  'Pilani, Rajasthan',      'Autonomous institute of science and technology')
ON CONFLICT DO NOTHING;

-- ─── Skills ──────────────────────────────────────────────────────
INSERT INTO skills (id, name, category) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Python',             'Programming'),
  ('10000000-0000-0000-0000-000000000002', 'JavaScript',         'Programming'),
  ('10000000-0000-0000-0000-000000000003', 'React',              'Frontend'),
  ('10000000-0000-0000-0000-000000000004', 'Node.js',            'Backend'),
  ('10000000-0000-0000-0000-000000000005', 'PostgreSQL',         'Database'),
  ('10000000-0000-0000-0000-000000000006', 'Machine Learning',   'AI/ML'),
  ('10000000-0000-0000-0000-000000000007', 'Data Analysis',      'Data Science'),
  ('10000000-0000-0000-0000-000000000008', 'Communication',      'Soft Skills'),
  ('10000000-0000-0000-0000-000000000009', 'Team Leadership',    'Soft Skills'),
  ('10000000-0000-0000-0000-000000000010', 'Docker',             'DevOps'),
  ('10000000-0000-0000-0000-000000000011', 'REST API Design',    'Backend'),
  ('10000000-0000-0000-0000-000000000012', 'SQL',                'Database')
ON CONFLICT (name, category) DO NOTHING;

-- ─── Users ───────────────────────────────────────────────────────
--  password_hash below corresponds to plain-text "Password123!"
--  generated with bcrypt at cost 10. Change before any real use.
INSERT INTO users (id, name, email, password_hash, role) VALUES
  -- Students
  ('20000000-0000-0000-0000-000000000001', 'Arun Sharma',   'arun.sharma@student.iitb.ac.in',   '$2b$10$qSf642N9FW84uxuZuilplOKnDF15jnQutdOU6VVfaNmja0S24QAqK', 'student'),
  ('20000000-0000-0000-0000-000000000002', 'Priya Nair',    'priya.nair@student.iitd.ac.in',    '$2b$10$qSf642N9FW84uxuZuilplOKnDF15jnQutdOU6VVfaNmja0S24QAqK', 'student'),
  ('20000000-0000-0000-0000-000000000003', 'Rohan Mehta',   'rohan.mehta@student.bits.ac.in',   '$2b$10$qSf642N9FW84uxuZuilplOKnDF15jnQutdOU6VVfaNmja0S24QAqK', 'student'),
  -- Companies
  ('20000000-0000-0000-0000-000000000004', 'TechCorp Recruiting', 'hr@techcorp.example.com',   '$2b$10$qSf642N9FW84uxuZuilplOKnDF15jnQutdOU6VVfaNmja0S24QAqK', 'company'),
  ('20000000-0000-0000-0000-000000000005', 'DataWave India',      'talent@datawave.example.com','$2b$10$qSf642N9FW84uxuZuilplOKnDF15jnQutdOU6VVfaNmja0S24QAqK', 'company')
ON CONFLICT (email) DO NOTHING;

-- ─── Student Profiles ────────────────────────────────────────────
INSERT INTO student_profiles (user_id, institution_id, degree, branch, graduation_year, bio) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'B.Tech', 'Computer Science', 2026, 'Passionate about full-stack development and open source.'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'M.Tech', 'Data Science',     2025, 'Focused on NLP and deep learning research.'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'B.Tech', 'Electronics',      2027, 'Interested in embedded systems and backend engineering.')
ON CONFLICT (user_id) DO NOTHING;

-- ─── Company Profiles ────────────────────────────────────────────
INSERT INTO company_profiles (user_id, company_name, description, website) VALUES
  ('20000000-0000-0000-0000-000000000004', 'TechCorp',   'Leading software product company.',         'https://techcorp.example.com'),
  ('20000000-0000-0000-0000-000000000005', 'DataWave',   'Data analytics and AI solutions provider.', 'https://datawave.example.com')
ON CONFLICT (user_id) DO NOTHING;

-- ─── Student Skills ──────────────────────────────────────────────
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
  -- Arun: full-stack
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 4),  -- JavaScript
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 3),  -- React
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 3),  -- Node.js
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 2),  -- PostgreSQL
  -- Priya: data science
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 5),  -- Python
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 4),  -- ML
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 4),  -- Data Analysis
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', 3),  -- SQL
  -- Rohan: backend
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3),  -- Python
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 2),  -- Node.js
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000010', 2)   -- Docker
ON CONFLICT (student_id, skill_id) DO NOTHING;

-- ─── Opportunities ───────────────────────────────────────────────
INSERT INTO opportunities (id, company_id, title, description, opportunity_type, location, deadline, status) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000004',
   'Full-Stack Intern — React & Node',
   'Join our product team to build scalable web features.',
   'internship', 'Bangalore (Hybrid)', '2026-12-31', 'open'),

  ('30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000005',
   'Data Science Intern',
   'Work on real-world ML pipelines and dashboards.',
   'internship', 'Remote', '2026-11-30', 'open')
ON CONFLICT DO NOTHING;

-- ─── Opportunity Skills ──────────────────────────────────────────
INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency, importance) VALUES
  -- Full-Stack Intern needs JS(3), React(3), Node(2)
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 3, 3),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 3, 3),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 2, 2),
  -- Data Science Intern needs Python(4), ML(3), Data Analysis(3)
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 4, 3),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 3, 3),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 3, 2)
ON CONFLICT DO NOTHING;

-- ─── Learning Resources ──────────────────────────────────────────
INSERT INTO learning_resources (skill_id, title, resource_type, resource_url) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Python Official Docs',       'article', 'https://docs.python.org/3/'),
  ('10000000-0000-0000-0000-000000000001', 'CS50P — Python Course',      'course',  'https://cs50.harvard.edu/python/'),
  ('10000000-0000-0000-0000-000000000003', 'React Official Docs',        'article', 'https://react.dev'),
  ('10000000-0000-0000-0000-000000000006', 'fast.ai — Practical DL',     'course',  'https://course.fast.ai'),
  ('10000000-0000-0000-0000-000000000005', 'PostgreSQL Tutorial',         'article', 'https://www.postgresqltutorial.com')
ON CONFLICT DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE '🌱 Seed data inserted successfully.';
END $$;
