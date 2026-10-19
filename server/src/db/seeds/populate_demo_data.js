'use strict';

/**
 * server/src/db/seeds/populate_demo_data.js
 *
 * Comprehensive mock data generator for SkillConnect.
 * Seeds realistic Institutions, Skills, Companies, Students, Skills Passports,
 * Opportunities, Opportunity Requirements, Applications across all statuses,
 * Student Projects, Learning Resources, and Skill Progress.
 *
 * Password for ALL generated demo accounts: Password123!
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Standard bcrypt hash for "Password123!" at cost 10
const DEMO_PASSWORD_HASH = '$2b$10$qSf642N9FW84uxuZuilplOKnDF15jnQutdOU6VVfaNmja0S24QAqK';

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting SkillConnect comprehensive mock data generation...');
    await client.query('BEGIN');

    // ────────────────────────────────────────────────────────────────
    // 1. INSTITUTIONS (6 premier universities)
    // ────────────────────────────────────────────────────────────────
    const institutions = [
      { id: '00000000-0000-0000-0000-000000000001', name: 'IIT Bombay', location: 'Mumbai, Maharashtra', description: 'Premier engineering and research institute in India' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'IIT Delhi', location: 'New Delhi', description: 'Top-ranked technical university with world-class faculty' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'BITS Pilani', location: 'Pilani, Rajasthan', description: 'Autonomous institute of science, technology, and entrepreneurship' },
      { id: '00000000-0000-0000-0000-000000000004', name: 'IIIT Hyderabad', location: 'Hyderabad, Telangana', description: 'Renowned computer science research institute known for AI and systems' },
      { id: '00000000-0000-0000-0000-000000000005', name: 'IIT Madras', location: 'Chennai, Tamil Nadu', description: 'National leader in technological innovation and incubation' },
      { id: '00000000-0000-0000-0000-000000000006', name: 'NIT Trichy', location: 'Tiruchirappalli, Tamil Nadu', description: 'Top-ranked National Institute of Technology with distinguished alumni' },
    ];

    for (const inst of institutions) {
      await client.query(`
        INSERT INTO institutions (id, name, location, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          location = EXCLUDED.location,
          description = EXCLUDED.description
      `, [inst.id, inst.name, inst.location, inst.description]);
    }
    console.log(`✅ Seeded ${institutions.length} Institutions`);

    // ────────────────────────────────────────────────────────────────
    // 2. SKILLS (48 skills across 8 categories)
    // ────────────────────────────────────────────────────────────────
    const skills = [
      { id: '10000000-0000-0000-0000-000000000001', name: 'Python', category: 'Programming' },
      { id: '10000000-0000-0000-0000-000000000002', name: 'JavaScript', category: 'Programming' },
      { id: '10000000-0000-0000-0000-000000000003', name: 'React', category: 'Frontend' },
      { id: '10000000-0000-0000-0000-000000000004', name: 'Node.js', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000005', name: 'PostgreSQL', category: 'Database' },
      { id: '10000000-0000-0000-0000-000000000006', name: 'Machine Learning', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000007', name: 'Data Analysis', category: 'Data Science' },
      { id: '10000000-0000-0000-0000-000000000008', name: 'Communication', category: 'Soft Skills' },
      { id: '10000000-0000-0000-0000-000000000009', name: 'Team Leadership', category: 'Soft Skills' },
      { id: '10000000-0000-0000-0000-000000000010', name: 'Docker', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000011', name: 'REST API Design', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000012', name: 'SQL', category: 'Database' },
      { id: '10000000-0000-0000-0000-000000000013', name: 'TypeScript', category: 'Programming' },
      { id: '10000000-0000-0000-0000-000000000014', name: 'Next.js', category: 'Frontend' },
      { id: '10000000-0000-0000-0000-000000000015', name: 'Tailwind CSS', category: 'Frontend' },
      { id: '10000000-0000-0000-0000-000000000016', name: 'HTML5/CSS3', category: 'Frontend' },
      { id: '10000000-0000-0000-0000-000000000017', name: 'Vue.js', category: 'Frontend' },
      { id: '10000000-0000-0000-0000-000000000018', name: 'Redux', category: 'Frontend' },
      { id: '10000000-0000-0000-0000-000000000019', name: 'Go', category: 'Programming' },
      { id: '10000000-0000-0000-0000-000000000020', name: 'Express', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000021', name: 'Django', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000022', name: 'FastAPI', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000023', name: 'Spring Boot', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000024', name: 'GraphQL', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000025', name: 'Microservices', category: 'Backend' },
      { id: '10000000-0000-0000-0000-000000000026', name: 'MongoDB', category: 'Database' },
      { id: '10000000-0000-0000-0000-000000000027', name: 'Redis', category: 'Database' },
      { id: '10000000-0000-0000-0000-000000000028', name: 'MySQL', category: 'Database' },
      { id: '10000000-0000-0000-0000-000000000029', name: 'Kubernetes', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000030', name: 'AWS', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000031', name: 'Google Cloud', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000032', name: 'CI/CD Pipelines', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000033', name: 'Terraform', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000034', name: 'Linux', category: 'DevOps' },
      { id: '10000000-0000-0000-0000-000000000035', name: 'Deep Learning', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000036', name: 'PyTorch', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000037', name: 'TensorFlow', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000038', name: 'Natural Language Processing', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000039', name: 'Computer Vision', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000040', name: 'Pandas & NumPy', category: 'Data Science' },
      { id: '10000000-0000-0000-0000-000000000041', name: 'Generative AI & LLMs', category: 'AI/ML' },
      { id: '10000000-0000-0000-0000-000000000042', name: 'Network Security', category: 'Cybersecurity' },
      { id: '10000000-0000-0000-0000-000000000043', name: 'Ethical Hacking', category: 'Cybersecurity' },
      { id: '10000000-0000-0000-0000-000000000044', name: 'Jest', category: 'Testing' },
      { id: '10000000-0000-0000-0000-000000000045', name: 'Cypress', category: 'Testing' },
      { id: '10000000-0000-0000-0000-000000000046', name: 'Agile / Scrum', category: 'Soft Skills' },
      { id: '10000000-0000-0000-0000-000000000047', name: 'Problem Solving', category: 'Soft Skills' },
      { id: '10000000-0000-0000-0000-000000000048', name: 'Product Thinking', category: 'Soft Skills' },
    ];

    for (const s of skills) {
      await client.query(`
        INSERT INTO skills (id, name, category)
        VALUES ($1, $2, $3)
        ON CONFLICT (name, category) DO UPDATE SET id = EXCLUDED.id
      `, [s.id, s.name, s.category]);
    }
    console.log(`✅ Seeded ${skills.length} Skills in Catalog`);

    // ────────────────────────────────────────────────────────────────
    // 3. COMPANIES & PROFILES (8 companies)
    // ────────────────────────────────────────────────────────────────
    const companies = [
      {
        id: '20000000-0000-0000-0000-000000000004',
        name: 'TechCorp Recruiting',
        email: 'hr@techcorp.example.com',
        company_name: 'TechCorp',
        description: 'Global enterprise software leader building developer productivity tools and scalable SaaS.',
        website: 'https://techcorp.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        name: 'DataWave Talent Team',
        email: 'talent@datawave.example.com',
        company_name: 'DataWave',
        description: 'Advanced data intelligence company building end-to-end ML pipelines and generative AI solutions.',
        website: 'https://datawave.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        name: 'CloudScale Careers',
        email: 'careers@cloudscale.example.com',
        company_name: 'CloudScale Solutions',
        description: 'Cloud infrastructure specialists pioneering Kubernetes orchestration and multi-region reliability.',
        website: 'https://cloudscale.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000007',
        name: 'FinEdge Hiring Team',
        email: 'hiring@finedge.example.com',
        company_name: 'FinEdge Technologies',
        description: 'High-frequency FinTech engineering real-time payment rails and distributed banking systems.',
        website: 'https://finedge.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000008',
        name: 'NextGen Mobility Talent',
        email: 'talent@nextgenmobility.example.com',
        company_name: 'NextGen Mobility',
        description: 'Next-generation autonomous mobility, computer vision telemetry, and electric fleet software.',
        website: 'https://nextgenmobility.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000009',
        name: 'CyberShield Recruiting',
        email: 'jobs@cybershield.example.com',
        company_name: 'CyberShield Labs',
        description: 'Cybersecurity research firm providing automated vulnerability detection and zero-trust security.',
        website: 'https://cybershield.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000010',
        name: 'HealthPulse Talent',
        email: 'recruiting@healthpulse.example.com',
        company_name: 'HealthPulse Informatics',
        description: 'HealthTech innovator creating clinical analytics and privacy-preserving biomedical ML systems.',
        website: 'https://healthpulse.example.com'
      },
      {
        id: '20000000-0000-0000-0000-000000000011',
        name: 'EduVerse People Ops',
        email: 'people@eduverse.example.com',
        company_name: 'EduVerse Interactive',
        description: 'Interactive EdTech platform creating virtual laboratories and personalized student curricula.',
        website: 'https://eduverse.example.com'
      },
    ];

    for (const c of companies) {
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, 'company')
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash
      `, [c.id, c.name, c.email, DEMO_PASSWORD_HASH]);

      await client.query(`
        INSERT INTO company_profiles (user_id, company_name, description, website)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          description = EXCLUDED.description,
          website = EXCLUDED.website
      `, [c.id, c.company_name, c.description, c.website]);
    }
    console.log(`✅ Seeded ${companies.length} Companies & Profiles`);

    // ────────────────────────────────────────────────────────────────
    // 4. INSTITUTION USERS
    // ────────────────────────────────────────────────────────────────
    const institutionUsers = [
      {
        id: 'dc505bdc-18e6-482d-9362-c2837822d2f2',
        name: 'IIT Bombay Career Center',
        email: 'test.institution2@example.com',
        role: 'institution'
      },
      {
        id: '20000000-0000-0000-0000-000000000020',
        name: 'IIT Delhi Placement Office',
        email: 'placement@iitd.ac.in',
        role: 'institution'
      }
    ];

    for (const iu of institutionUsers) {
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
      `, [iu.id, iu.name, iu.email, DEMO_PASSWORD_HASH, iu.role]);
    }
    console.log(`✅ Seeded ${institutionUsers.length} Institution Admin Users`);

    // ────────────────────────────────────────────────────────────────
    // 5. STUDENTS & PROFILES (11 students across institutes)
    // ────────────────────────────────────────────────────────────────
    const students = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        name: 'Arun Sharma',
        email: 'arun.sharma@student.iitb.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000001', // IIT Bombay
        degree: 'B.Tech',
        branch: 'Computer Science and Engineering',
        graduation_year: 2026,
        bio: 'Passionate about full-stack engineering, modern web performance, and open source development.'
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        name: 'Priya Nair',
        email: 'priya.nair@student.iitd.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000002', // IIT Delhi
        degree: 'M.Tech',
        branch: 'Data Science & Artificial Intelligence',
        graduation_year: 2025,
        bio: 'Focused on NLP, multimodal deep learning research, and building reproducible data pipelines.'
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@student.bits.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000003', // BITS Pilani
        degree: 'B.Tech',
        branch: 'Electrical & Computer Engineering',
        graduation_year: 2027,
        bio: 'Interested in distributed systems, Go microservices, and container infrastructure.'
      },
      {
        id: '20000000-0000-0000-0000-000000000012',
        name: 'Ananya Sen',
        email: 'ananya.sen@student.iiith.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000004', // IIIT Hyderabad
        degree: 'B.Tech',
        branch: 'Computer Science and Engineering',
        graduation_year: 2026,
        bio: 'Specializing in concurrent Go systems, distributed consensus algorithms, and database internals.'
      },
      {
        id: '20000000-0000-0000-0000-000000000013',
        name: 'Vikram Aditya',
        email: 'vikram.aditya@student.iitm.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000005', // IIT Madras
        degree: 'M.Tech',
        branch: 'Artificial Intelligence & Robotics',
        graduation_year: 2025,
        bio: 'Computer vision researcher working on edge inference, autonomous navigation, and generative diffusion models.'
      },
      {
        id: '20000000-0000-0000-0000-000000000014',
        name: 'Sneha Kulkarni',
        email: 'sneha.kulkarni@student.nitt.edu',
        institution_id: '00000000-0000-0000-0000-000000000006', // NIT Trichy
        degree: 'B.Tech',
        branch: 'Information Technology',
        graduation_year: 2026,
        bio: 'Certified AWS Solutions Architect, automated CI/CD advocate, and infrastructure-as-code practitioner.'
      },
      {
        id: '20000000-0000-0000-0000-000000000015',
        name: 'Kavya Patel',
        email: 'kavya.patel@student.iitb.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000001', // IIT Bombay
        degree: 'B.Tech',
        branch: 'Computer Science and Engineering',
        graduation_year: 2027,
        bio: 'Frontend enthusiast obsessed with polished UI/UX, micro-interactions, Next.js, and design tokens.'
      },
      {
        id: '20000000-0000-0000-0000-000000000016',
        name: 'Aditya Verma',
        email: 'aditya.verma@student.iitd.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000002', // IIT Delhi
        degree: 'Dual Degree',
        branch: 'Computer Science and Engineering',
        graduation_year: 2025,
        bio: 'Full-stack software developer with deep interest in real-time WebSockets, streaming analytics, and Node.js.'
      },
      {
        id: '20000000-0000-0000-0000-000000000017',
        name: 'Neha Deshmukh',
        email: 'neha.deshmukh@student.bits.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000003', // BITS Pilani
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduation_year: 2026,
        bio: 'Security researcher, CTF enthusiast, and Linux power user with a passion for zero-trust defenses.'
      },
      {
        id: '20000000-0000-0000-0000-000000000018',
        name: 'Rahul Sundaram',
        email: 'rahul.sundaram@student.iitm.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000005', // IIT Madras
        degree: 'B.Tech',
        branch: 'Data Science & Engineering',
        graduation_year: 2026,
        bio: 'Data pipeline craftsman with solid command of SQL, PostgreSQL optimization, Redis caches, and Kafka streams.'
      },
      {
        id: '20000000-0000-0000-0000-000000000019',
        name: 'Meera Iyer',
        email: 'meera.iyer@student.iiith.ac.in',
        institution_id: '00000000-0000-0000-0000-000000000004', // IIIT Hyderabad
        degree: 'B.Tech',
        branch: 'Computer Science and Engineering',
        graduation_year: 2027,
        bio: 'Building cross-platform interactive apps with React, React Native, and accessible Tailwind styling.'
      },
    ];

    for (const s of students) {
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, 'student')
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash
      `, [s.id, s.name, s.email, DEMO_PASSWORD_HASH]);

      await client.query(`
        INSERT INTO student_profiles (user_id, institution_id, degree, branch, graduation_year, bio)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          institution_id = EXCLUDED.institution_id,
          degree = EXCLUDED.degree,
          branch = EXCLUDED.branch,
          graduation_year = EXCLUDED.graduation_year,
          bio = EXCLUDED.bio
      `, [s.id, s.institution_id, s.degree, s.branch, s.graduation_year, s.bio]);
    }
    console.log(`✅ Seeded ${students.length} Students & Profiles`);

    // ────────────────────────────────────────────────────────────────
    // 6. STUDENT SKILLS (Skill Passports)
    // ────────────────────────────────────────────────────────────────
    const studentSkillsData = [
      // Arun Sharma (Full Stack Engineer)
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000002', level: 4 }, // JS
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000003', level: 4 }, // React
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000004', level: 3 }, // Node
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000005', level: 3 }, // Postgres
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000011', level: 4 }, // REST API
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000013', level: 3 }, // TypeScript
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000015', level: 4 }, // Tailwind
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000008', level: 4 }, // Communication

      // Priya Nair (AI & Data Scientist)
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000001', level: 5 }, // Python
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000006', level: 5 }, // ML
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000007', level: 4 }, // Data Analysis
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000035', level: 4 }, // Deep Learning
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000036', level: 5 }, // PyTorch
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000038', level: 4 }, // NLP
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000040', level: 5 }, // Pandas
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000012', level: 4 }, // SQL

      // Rohan Mehta (Backend & Cloud)
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000001', level: 4 }, // Python
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000004', level: 3 }, // Node
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000010', level: 3 }, // Docker
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000034', level: 4 }, // Linux
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000005', level: 3 }, // Postgres
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000019', level: 2 }, // Go

      // Ananya Sen (Go & Distributed Systems)
      { student: '20000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000019', level: 5 }, // Go
      { student: '20000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000025', level: 4 }, // Microservices
      { student: '20000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000010', level: 4 }, // Docker
      { student: '20000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000029', level: 3 }, // Kubernetes
      { student: '20000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000027', level: 4 }, // Redis
      { student: '20000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000011', level: 4 }, // REST API

      // Vikram Aditya (Vision & Robotics)
      { student: '20000000-0000-0000-0000-000000000013', skill: '10000000-0000-0000-0000-000000000001', level: 5 }, // Python
      { student: '20000000-0000-0000-0000-000000000013', skill: '10000000-0000-0000-0000-000000000006', level: 5 }, // ML
      { student: '20000000-0000-0000-0000-000000000013', skill: '10000000-0000-0000-0000-000000000036', level: 5 }, // PyTorch
      { student: '20000000-0000-0000-0000-000000000013', skill: '10000000-0000-0000-0000-000000000039', level: 5 }, // Computer Vision
      { student: '20000000-0000-0000-0000-000000000013', skill: '10000000-0000-0000-0000-000000000041', level: 4 }, // Generative AI

      // Sneha Kulkarni (DevOps & AWS)
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000010', level: 5 }, // Docker
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000029', level: 4 }, // Kubernetes
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000030', level: 5 }, // AWS
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000032', level: 4 }, // CI/CD
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000033', level: 4 }, // Terraform
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000034', level: 5 }, // Linux

      // Kavya Patel (Frontend Lead)
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000002', level: 5 }, // JS
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000003', level: 5 }, // React
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000013', level: 4 }, // TypeScript
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000014', level: 4 }, // Next.js
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000015', level: 5 }, // Tailwind
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000016', level: 5 }, // HTML/CSS

      // Aditya Verma (Full Stack & Systems)
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000002', level: 4 }, // JS
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000013', level: 4 }, // TypeScript
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000003', level: 4 }, // React
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000004', level: 4 }, // Node
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000020', level: 4 }, // Express
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000005', level: 3 }, // Postgres
      { student: '20000000-0000-0000-0000-000000000016', skill: '10000000-0000-0000-0000-000000000027', level: 3 }, // Redis

      // Neha Deshmukh (Cybersecurity)
      { student: '20000000-0000-0000-0000-000000000017', skill: '10000000-0000-0000-0000-000000000042', level: 5 }, // Net Sec
      { student: '20000000-0000-0000-0000-000000000017', skill: '10000000-0000-0000-0000-000000000043', level: 4 }, // Ethical Hacking
      { student: '20000000-0000-0000-0000-000000000017', skill: '10000000-0000-0000-0000-000000000034', level: 4 }, // Linux
      { student: '20000000-0000-0000-0000-000000000017', skill: '10000000-0000-0000-0000-000000000001', level: 3 }, // Python
      { student: '20000000-0000-0000-0000-000000000017', skill: '10000000-0000-0000-0000-000000000010', level: 3 }, // Docker

      // Rahul Sundaram (Data Engineer)
      { student: '20000000-0000-0000-0000-000000000018', skill: '10000000-0000-0000-0000-000000000012', level: 5 }, // SQL
      { student: '20000000-0000-0000-0000-000000000018', skill: '10000000-0000-0000-0000-000000000005', level: 4 }, // Postgres
      { student: '20000000-0000-0000-0000-000000000018', skill: '10000000-0000-0000-0000-000000000001', level: 4 }, // Python
      { student: '20000000-0000-0000-0000-000000000018', skill: '10000000-0000-0000-0000-000000000027', level: 4 }, // Redis
      { student: '20000000-0000-0000-0000-000000000018', skill: '10000000-0000-0000-0000-000000000040', level: 4 }, // Pandas

      // Meera Iyer (Interactive UI)
      { student: '20000000-0000-0000-0000-000000000019', skill: '10000000-0000-0000-0000-000000000002', level: 4 }, // JS
      { student: '20000000-0000-0000-0000-000000000019', skill: '10000000-0000-0000-0000-000000000003', level: 4 }, // React
      { student: '20000000-0000-0000-0000-000000000019', skill: '10000000-0000-0000-0000-000000000015', level: 4 }, // Tailwind
      { student: '20000000-0000-0000-0000-000000000019', skill: '10000000-0000-0000-0000-000000000016', level: 4 }, // HTML
    ];

    for (const item of studentSkillsData) {
      await client.query(`
        INSERT INTO student_skills (student_id, skill_id, proficiency_level)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, skill_id) DO UPDATE SET
          proficiency_level = EXCLUDED.proficiency_level
      `, [item.student, item.skill, item.level]);
    }
    console.log(`✅ Seeded ${studentSkillsData.length} Student Skills across all Passports`);

    // ────────────────────────────────────────────────────────────────
    // 7. OPPORTUNITIES (18 across companies, types, and locations)
    // ────────────────────────────────────────────────────────────────
    const opportunities = [
      {
        id: '30000000-0000-0000-0000-000000000001',
        company_id: '20000000-0000-0000-0000-000000000004', // TechCorp
        title: 'Full-Stack Developer Intern',
        description: 'Collaborate with the core team to architect scalable frontend components and Node.js microservices. Gain hands-on exposure to CI/CD and production telemetry.',
        opportunity_type: 'internship',
        location: 'Bangalore (Hybrid)',
        deadline: '2026-12-31',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        company_id: '20000000-0000-0000-0000-000000000005', // DataWave
        title: 'Data Science & NLP Intern',
        description: 'Build automated feature stores, fine-tune transformer models on enterprise corpora, and deploy reproducible ML evaluation benchmarks.',
        opportunity_type: 'internship',
        location: 'Remote',
        deadline: '2026-11-30',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        company_id: '20000000-0000-0000-0000-000000000006', // CloudScale
        title: 'Cloud Infrastructure & SRE Intern',
        description: 'Design zero-downtime deployment pipelines using Kubernetes and Terraform. Implement automated canary rollouts and Prometheus alerts.',
        opportunity_type: 'internship',
        location: 'Hyderabad (Hybrid)',
        deadline: '2026-12-15',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        company_id: '20000000-0000-0000-0000-000000000007', // FinEdge
        title: 'High-Frequency FinTech Backend Engineer',
        description: 'Join our payment engineering division to develop ultra-low latency settlement microservices in Go and PostgreSQL.',
        opportunity_type: 'full_time',
        location: 'Mumbai (On-site)',
        deadline: '2027-01-15',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        company_id: '20000000-0000-0000-0000-000000000008', // NextGen Mobility
        title: 'Autonomous Robotics Perception Intern',
        description: 'Train edge neural networks on LiDAR and camera streams. Optimize real-time obstacle detection algorithms for electric transport vehicles.',
        opportunity_type: 'internship',
        location: 'Bangalore (On-site)',
        deadline: '2026-12-20',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000006',
        company_id: '20000000-0000-0000-0000-000000000009', // CyberShield
        title: 'Associate Security Analyst',
        description: 'Conduct automated penetration assessments, evaluate web vulnerability signatures, and monitor enterprise zero-trust telemetry.',
        opportunity_type: 'full_time',
        location: 'Pune (Hybrid)',
        deadline: '2027-02-01',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000007',
        company_id: '20000000-0000-0000-0000-000000000004', // TechCorp
        title: 'Frontend Engineer — Design Systems',
        description: 'Craft accessible, high-performance UI components with React, TypeScript, and Tailwind CSS for millions of global developers.',
        opportunity_type: 'full_time',
        location: 'Remote',
        deadline: '2027-01-30',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000008',
        company_id: '20000000-0000-0000-0000-000000000010', // HealthPulse
        title: 'GenAI & Clinical NLP Specialist',
        description: 'Develop privacy-preserving generative AI pipelines that synthesize clinical summaries and extract biomedical ontology entities.',
        opportunity_type: 'project',
        location: 'Remote',
        deadline: '2026-11-25',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000009',
        company_id: '20000000-0000-0000-0000-000000000011', // EduVerse
        title: 'Interactive Web & Simulation Developer',
        description: 'Build web-based interactive STEM simulation modules using React, Next.js, and canvas graphics.',
        opportunity_type: 'part_time',
        location: 'Bangalore (Hybrid)',
        deadline: '2026-12-10',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000010',
        company_id: '20000000-0000-0000-0000-000000000006', // CloudScale
        title: 'Kubernetes Platform Engineer',
        description: 'Maintain high-availability distributed EKS/GKE clusters, automate service mesh policies, and streamline multi-tenant security.',
        opportunity_type: 'full_time',
        location: 'Hyderabad (On-site)',
        deadline: '2027-03-01',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000011',
        company_id: '20000000-0000-0000-0000-000000000005', // DataWave
        title: 'Senior Data Pipeline Architect',
        description: 'Design petabyte-scale streaming pipelines with Kafka, PostgreSQL, and Redis. Ensure real-time schema validation and zero data loss.',
        opportunity_type: 'full_time',
        location: 'Bangalore (Hybrid)',
        deadline: '2027-01-31',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000012',
        company_id: '20000000-0000-0000-0000-000000000007', // FinEdge
        title: 'API & Microservices Architecture Intern',
        description: 'Implement distributed tracing, OpenAPI contracts, and Redis caching layers for high-throughput ledger banking microservices.',
        opportunity_type: 'internship',
        location: 'Mumbai (Hybrid)',
        deadline: '2026-12-15',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000013',
        company_id: '20000000-0000-0000-0000-000000000010', // HealthPulse
        title: 'Healthcare Analytics Data Contractor',
        description: 'Audit EHR data schemas, build HIPAA-compliant ETL transformations, and generate clinical outcome metric dashboards.',
        opportunity_type: 'contract',
        location: 'Delhi NCR (Remote)',
        deadline: '2026-11-20',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000014',
        company_id: '20000000-0000-0000-0000-000000000008', // NextGen Mobility
        title: 'Embedded Telemetry & IoT Contributor',
        description: 'Contribute to lightweight C++/Python telemetry daemons streaming vehicular diagnostics over low-bandwidth cellular channels.',
        opportunity_type: 'project',
        location: 'Chennai (On-site)',
        deadline: '2026-12-25',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000015',
        company_id: '20000000-0000-0000-0000-000000000011', // EduVerse
        title: 'Junior Next.js / TypeScript Developer',
        description: 'Develop responsive student learning dashboards with Next.js App Router, SSR caching, and real-time quiz updates.',
        opportunity_type: 'internship',
        location: 'Remote',
        deadline: '2026-12-30',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000016',
        company_id: '20000000-0000-0000-0000-000000000009', // CyberShield
        title: 'Cloud Penetration Testing Intern',
        description: 'Analyze IAM privilege escalation vulnerabilities in AWS/GCP workloads and automate policy compliance validations.',
        opportunity_type: 'internship',
        location: 'Pune (On-site)',
        deadline: '2026-12-18',
        status: 'open'
      },
      {
        id: '30000000-0000-0000-0000-000000000017',
        company_id: '20000000-0000-0000-0000-000000000004', // TechCorp
        title: 'Principal React Architect (Closed)',
        description: 'Spearheaded our frontend monorepo consolidation and enterprise web app rendering engine.',
        opportunity_type: 'full_time',
        location: 'Bangalore (On-site)',
        deadline: '2026-08-30',
        status: 'closed'
      },
      {
        id: '30000000-0000-0000-0000-000000000018',
        company_id: '20000000-0000-0000-0000-000000000005', // DataWave
        title: 'Summer 2026 AI Fellowship (Closed)',
        description: 'Competitive 8-week accelerated fellowship conducting fundamental research on self-supervised learning representations.',
        opportunity_type: 'internship',
        location: 'Remote',
        deadline: '2026-06-30',
        status: 'closed'
      },
    ];

    for (const o of opportunities) {
      await client.query(`
        INSERT INTO opportunities (id, company_id, title, description, opportunity_type, location, deadline, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          opportunity_type = EXCLUDED.opportunity_type,
          location = EXCLUDED.location,
          deadline = EXCLUDED.deadline,
          status = EXCLUDED.status
      `, [o.id, o.company_id, o.title, o.description, o.opportunity_type, o.location, o.deadline, o.status]);
    }
    console.log(`✅ Seeded ${opportunities.length} Opportunities across multiple types & statuses`);

    // ────────────────────────────────────────────────────────────────
    // 8. OPPORTUNITY SKILLS (Requirements with proficiency & importance)
    // ────────────────────────────────────────────────────────────────
    const oppSkillsData = [
      // 1. Full-Stack Intern (TechCorp)
      { opp: '30000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000002', req: 3, imp: 3 }, // JS
      { opp: '30000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000003', req: 3, imp: 3 }, // React
      { opp: '30000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000004', req: 2, imp: 2 }, // Node
      { opp: '30000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000005', req: 2, imp: 2 }, // Postgres
      { opp: '30000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000011', req: 3, imp: 2 }, // REST API

      // 2. Data Science & NLP Intern (DataWave)
      { opp: '30000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000001', req: 4, imp: 3 }, // Python
      { opp: '30000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000006', req: 3, imp: 3 }, // ML
      { opp: '30000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000036', req: 3, imp: 3 }, // PyTorch
      { opp: '30000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000038', req: 3, imp: 2 }, // NLP

      // 3. Cloud & SRE Intern (CloudScale)
      { opp: '30000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000010', req: 3, imp: 3 }, // Docker
      { opp: '30000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000029', req: 2, imp: 3 }, // K8s
      { opp: '30000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000034', req: 3, imp: 2 }, // Linux
      { opp: '30000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000032', req: 2, imp: 2 }, // CI/CD

      // 4. FinTech Backend (FinEdge)
      { opp: '30000000-0000-0000-0000-000000000004', skill: '10000000-0000-0000-0000-000000000019', req: 4, imp: 3 }, // Go
      { opp: '30000000-0000-0000-0000-000000000004', skill: '10000000-0000-0000-0000-000000000005', req: 4, imp: 3 }, // Postgres
      { opp: '30000000-0000-0000-0000-000000000004', skill: '10000000-0000-0000-0000-000000000027', req: 3, imp: 2 }, // Redis
      { opp: '30000000-0000-0000-0000-000000000004', skill: '10000000-0000-0000-0000-000000000025', req: 3, imp: 3 }, // Microservices

      // 5. Autonomous Robotics (NextGen)
      { opp: '30000000-0000-0000-0000-000000000005', skill: '10000000-0000-0000-0000-000000000001', req: 4, imp: 3 }, // Python
      { opp: '30000000-0000-0000-0000-000000000005', skill: '10000000-0000-0000-0000-000000000039', req: 4, imp: 3 }, // CV
      { opp: '30000000-0000-0000-0000-000000000005', skill: '10000000-0000-0000-0000-000000000036', req: 4, imp: 3 }, // PyTorch

      // 6. Associate Security Analyst (CyberShield)
      { opp: '30000000-0000-0000-0000-000000000006', skill: '10000000-0000-0000-0000-000000000042', req: 4, imp: 3 }, // Net Sec
      { opp: '30000000-0000-0000-0000-000000000006', skill: '10000000-0000-0000-0000-000000000043', req: 3, imp: 3 }, // Ethical Hacking
      { opp: '30000000-0000-0000-0000-000000000006', skill: '10000000-0000-0000-0000-000000000034', req: 3, imp: 2 }, // Linux

      // 7. Frontend Design Systems (TechCorp)
      { opp: '30000000-0000-0000-0000-000000000007', skill: '10000000-0000-0000-0000-000000000003', req: 4, imp: 3 }, // React
      { opp: '30000000-0000-0000-0000-000000000007', skill: '10000000-0000-0000-0000-000000000013', req: 4, imp: 3 }, // TS
      { opp: '30000000-0000-0000-0000-000000000007', skill: '10000000-0000-0000-0000-000000000015', req: 4, imp: 3 }, // Tailwind
      { opp: '30000000-0000-0000-0000-000000000007', skill: '10000000-0000-0000-0000-000000000016', req: 4, imp: 2 }, // HTML/CSS

      // 8. GenAI & Clinical NLP (HealthPulse)
      { opp: '30000000-0000-0000-0000-000000000008', skill: '10000000-0000-0000-0000-000000000001', req: 4, imp: 3 }, // Python
      { opp: '30000000-0000-0000-0000-000000000008', skill: '10000000-0000-0000-0000-000000000038', req: 4, imp: 3 }, // NLP
      { opp: '30000000-0000-0000-0000-000000000008', skill: '10000000-0000-0000-0000-000000000041', req: 4, imp: 3 }, // GenAI

      // 9. Interactive Web Simulation (EduVerse)
      { opp: '30000000-0000-0000-0000-000000000009', skill: '10000000-0000-0000-0000-000000000002', req: 3, imp: 3 }, // JS
      { opp: '30000000-0000-0000-0000-000000000009', skill: '10000000-0000-0000-0000-000000000003', req: 3, imp: 3 }, // React
      { opp: '30000000-0000-0000-0000-000000000009', skill: '10000000-0000-0000-0000-000000000015', req: 3, imp: 2 }, // Tailwind

      // 10. Kubernetes Platform Engineer (CloudScale)
      { opp: '30000000-0000-0000-0000-000000000010', skill: '10000000-0000-0000-0000-000000000029', req: 4, imp: 3 }, // K8s
      { opp: '30000000-0000-0000-0000-000000000010', skill: '10000000-0000-0000-0000-000000000030', req: 4, imp: 3 }, // AWS
      { opp: '30000000-0000-0000-0000-000000000010', skill: '10000000-0000-0000-0000-000000000033', req: 4, imp: 3 }, // Terraform

      // 11. Senior Data Pipeline Architect (DataWave)
      { opp: '30000000-0000-0000-0000-000000000011', skill: '10000000-0000-0000-0000-000000000012', req: 5, imp: 3 }, // SQL
      { opp: '30000000-0000-0000-0000-000000000011', skill: '10000000-0000-0000-0000-000000000005', req: 4, imp: 3 }, // Postgres
      { opp: '30000000-0000-0000-0000-000000000011', skill: '10000000-0000-0000-0000-000000000027', req: 4, imp: 2 }, // Redis

      // 12. Microservices Architecture Intern (FinEdge)
      { opp: '30000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000019', req: 3, imp: 3 }, // Go
      { opp: '30000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000025', req: 3, imp: 3 }, // Microservices
      { opp: '30000000-0000-0000-0000-000000000012', skill: '10000000-0000-0000-0000-000000000011', req: 3, imp: 2 }, // REST API
    ];

    for (const item of oppSkillsData) {
      await client.query(`
        INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency, importance)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (opportunity_id, skill_id) DO UPDATE SET
          required_proficiency = EXCLUDED.required_proficiency,
          importance = EXCLUDED.importance
      `, [item.opp, item.skill, item.req, item.imp]);
    }
    console.log(`✅ Seeded ${oppSkillsData.length} Opportunity Requirements`);

    // ────────────────────────────────────────────────────────────────
    // 9. APPLICATIONS (24 applications across all 5 statuses)
    // ────────────────────────────────────────────────────────────────
    const applications = [
      // TechCorp - Full Stack Developer Intern (opp 1)
      {
        id: '40000000-0000-0000-0000-000000000001',
        opp: '30000000-0000-0000-0000-000000000001',
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        status: 'accepted',
        cover_letter: 'Dear TechCorp Recruiting Team,\n\nI have spent the past 2 years building full-stack web applications using React, Node.js, and PostgreSQL. At IIT Bombay, I spearheaded our department portal and built multiple open-source utilities. I am thrilled by TechCorp\'s mission to advance developer productivity and would love to contribute my full-stack skillset.'
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        opp: '30000000-0000-0000-0000-000000000001',
        student: '20000000-0000-0000-0000-000000000015', // Kavya Patel
        status: 'shortlisted',
        cover_letter: 'Hi TechCorp,\n\nAs a frontend specialist at IIT Bombay, I have built production design systems in React and TypeScript. I have deep knowledge of DOM performance and REST API consumption, and I am excited to tackle full-stack challenges with your team.'
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        opp: '30000000-0000-0000-0000-000000000001',
        student: '20000000-0000-0000-0000-000000000016', // Aditya Verma
        status: 'pending',
        cover_letter: 'Greetings,\n\nI am a dual-degree student at IIT Delhi with extensive full-stack experience across TypeScript, Express, and PostgreSQL. I recently implemented a real-time collaborative workspace that handled concurrent edits with low latency.'
      },
      {
        id: '40000000-0000-0000-0000-000000000004',
        opp: '30000000-0000-0000-0000-000000000001',
        student: '20000000-0000-0000-0000-000000000003', // Rohan Mehta
        status: 'rejected',
        cover_letter: 'Hello,\n\nI am passionate about backend development with Node.js and Python. Looking to gain full-stack industry experience with the product team at TechCorp.'
      },

      // DataWave - Data Science & NLP Intern (opp 2)
      {
        id: '40000000-0000-0000-0000-000000000005',
        opp: '30000000-0000-0000-0000-000000000002',
        student: '20000000-0000-0000-0000-000000000002', // Priya Nair
        status: 'accepted',
        cover_letter: 'Dear DataWave Team,\n\nAs an M.Tech student at IIT Delhi focusing on deep learning and NLP, I have published research on transformer quantization. My PyTorch and data analysis experience directly matches your ML feature store roadmap.'
      },
      {
        id: '40000000-0000-0000-0000-000000000006',
        opp: '30000000-0000-0000-0000-000000000002',
        student: '20000000-0000-0000-0000-000000000013', // Vikram Aditya
        status: 'shortlisted',
        cover_letter: 'Hello,\n\nI am researching computer vision and multimodal models at IIT Madras. I have fine-tuned PyTorch vision-language models and would love to bring multimodal NLP capabilities to DataWave.'
      },
      {
        id: '40000000-0000-0000-0000-000000000007',
        opp: '30000000-0000-0000-0000-000000000002',
        student: '20000000-0000-0000-0000-000000000018', // Rahul Sundaram
        status: 'pending',
        cover_letter: 'Dear DataWave,\n\nMy core strength is building scalable data pipelines and managing SQL feature tables. Excited about connecting reliable data pipelines to your NLP training jobs.'
      },

      // CloudScale - Cloud & SRE Intern (opp 3)
      {
        id: '40000000-0000-0000-0000-000000000008',
        opp: '30000000-0000-0000-0000-000000000003',
        student: '20000000-0000-0000-0000-000000000014', // Sneha Kulkarni
        status: 'accepted',
        cover_letter: 'Dear CloudScale Team,\n\nI am an AWS Certified Solutions Architect with deep experience in Docker, Kubernetes, and Terraform. I automated blue-green deployments for multiple student software projects at NIT Trichy.'
      },
      {
        id: '40000000-0000-0000-0000-000000000009',
        opp: '30000000-0000-0000-0000-000000000003',
        student: '20000000-0000-0000-0000-000000000012', // Ananya Sen
        status: 'shortlisted',
        cover_letter: 'Hi CloudScale,\n\nI develop microservices in Go and manage local Kubernetes clusters for benchmarking distributed latency. Cloud infrastructure reliability is my core focus.'
      },
      {
        id: '40000000-0000-0000-0000-000000000010',
        opp: '30000000-0000-0000-0000-000000000003',
        student: '20000000-0000-0000-0000-000000000003', // Rohan Mehta
        status: 'pending',
        cover_letter: 'Hello,\n\nI have set up Docker and Linux container workflows for university research projects. Looking forward to mastering production Kubernetes at CloudScale.'
      },

      // FinEdge - FinTech Backend Engineer (opp 4)
      {
        id: '40000000-0000-0000-0000-000000000011',
        opp: '30000000-0000-0000-0000-000000000004',
        student: '20000000-0000-0000-0000-000000000012', // Ananya Sen
        status: 'accepted',
        cover_letter: 'Dear FinEdge Team,\n\nI have authored high-concurrency Go services using Goroutines and PostgreSQL ACID transactions. High-frequency FinTech infrastructure requires precise memory management and low-latency serialization—challenges I thrive on.'
      },
      {
        id: '40000000-0000-0000-0000-000000000012',
        opp: '30000000-0000-0000-0000-000000000004',
        student: '20000000-0000-0000-0000-000000000018', // Rahul Sundaram
        status: 'shortlisted',
        cover_letter: 'Greetings,\n\nI bring strong SQL optimization, Redis caching expertise, and relational data architecture skills needed for financial ledger integrity.'
      },

      // NextGen Mobility - Robotics Intern (opp 5)
      {
        id: '40000000-0000-0000-0000-000000000013',
        opp: '30000000-0000-0000-0000-000000000005',
        student: '20000000-0000-0000-0000-000000000013', // Vikram Aditya
        status: 'shortlisted',
        cover_letter: 'Dear NextGen Mobility,\n\nAt IIT Madras, my research focuses on zero-shot object detection and sensor fusion for mobile robots. Excited to work on edge vehicle perception algorithms.'
      },
      {
        id: '40000000-0000-0000-0000-000000000014',
        opp: '30000000-0000-0000-0000-000000000005',
        student: '20000000-0000-0000-0000-000000000002', // Priya Nair
        status: 'pending',
        cover_letter: 'Hi Team,\n\nI have deep experience with PyTorch and computer vision pipelines for structured medical imaging that can cross over to vehicle camera segmentation.'
      },

      // CyberShield - Security Analyst (opp 6)
      {
        id: '40000000-0000-0000-0000-000000000015',
        opp: '30000000-0000-0000-0000-000000000006',
        student: '20000000-0000-0000-0000-000000000017', // Neha Deshmukh
        status: 'shortlisted',
        cover_letter: 'Dear CyberShield Labs,\n\nI actively participate in national CTF competitions and have reported multiple responsible disclosure vulnerabilities. I am well-versed in network defense and threat signature modeling.'
      },

      // TechCorp - Frontend Engineer Design Systems (opp 7)
      {
        id: '40000000-0000-0000-0000-000000000016',
        opp: '30000000-0000-0000-0000-000000000007',
        student: '20000000-0000-0000-0000-000000000015', // Kavya Patel
        status: 'shortlisted',
        cover_letter: 'Dear TechCorp Design Systems Team,\n\nI authored a headless React design system used by multiple collegiate hackathons. Component accessibility (WCAG), token management, and sub-millisecond render trees are my craft.'
      },
      {
        id: '40000000-0000-0000-0000-000000000017',
        opp: '30000000-0000-0000-0000-000000000007',
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        status: 'pending',
        cover_letter: 'Hi,\n\nApplying my React and Tailwind CSS proficiency to TechCorp\'s frontend platforms. I enjoy creating responsive, polished interfaces that scale.'
      },

      // HealthPulse - GenAI & Clinical NLP (opp 8)
      {
        id: '40000000-0000-0000-0000-000000000018',
        opp: '30000000-0000-0000-0000-000000000008',
        student: '20000000-0000-0000-0000-000000000002', // Priya Nair
        status: 'pending',
        cover_letter: 'Dear HealthPulse,\n\nI have worked on biomedical Named Entity Recognition (NER) models and evaluation sets. Very enthusiastic about your clinical summarization project.'
      },

      // EduVerse - Interactive Web Simulation (opp 9)
      {
        id: '40000000-0000-0000-0000-000000000019',
        opp: '30000000-0000-0000-0000-000000000009',
        student: '20000000-0000-0000-0000-000000000019', // Meera Iyer
        status: 'pending',
        cover_letter: 'Hello EduVerse,\n\nI love building educational apps that make abstract science concepts intuitive. Looking forward to designing engaging canvas and React simulations.'
      },

      // CloudScale - Kubernetes Platform Engineer (opp 10)
      {
        id: '40000000-0000-0000-0000-000000000020',
        opp: '30000000-0000-0000-0000-000000000010',
        student: '20000000-0000-0000-0000-000000000014', // Sneha Kulkarni
        status: 'shortlisted',
        cover_letter: 'Dear Hiring Manager,\n\nWith extensive Terraform infrastructure provisioning and multi-AZ AWS configurations, I can immediately assist your Kubernetes platform engineering initiatives.'
      },

      // Arun's withdrawn application
      {
        id: '40000000-0000-0000-0000-000000000021',
        opp: '30000000-0000-0000-0000-000000000006', // CyberShield
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        status: 'withdrawn',
        cover_letter: 'Withdrawn by student to focus on full-stack application track.'
      },

      // Additional applications to showcase full workflow
      {
        id: '40000000-0000-0000-0000-000000000022',
        opp: '30000000-0000-0000-0000-000000000015', // Junior Next.js
        student: '20000000-0000-0000-0000-000000000019', // Meera Iyer
        status: 'pending',
        cover_letter: 'Excited about Next.js and frontend engineering at EduVerse.'
      },
      {
        id: '40000000-0000-0000-0000-000000000023',
        opp: '30000000-0000-0000-0000-000000000016', // Cloud Pentesting
        student: '20000000-0000-0000-0000-000000000017', // Neha Deshmukh
        status: 'pending',
        cover_letter: 'Applying automated cloud security scanners and IAM privilege audit techniques.'
      },
      {
        id: '40000000-0000-0000-0000-000000000024',
        opp: '30000000-0000-0000-0000-000000000012', // Microservices Intern
        student: '20000000-0000-0000-0000-000000000012', // Ananya Sen
        status: 'pending',
        cover_letter: 'Keen to optimize distributed Go microservices and OpenAPI contracts.'
      },
    ];

    for (const a of applications) {
      await client.query(`
        INSERT INTO applications (id, opportunity_id, student_id, status, cover_letter)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (opportunity_id, student_id) DO UPDATE SET
          status = EXCLUDED.status,
          cover_letter = EXCLUDED.cover_letter
      `, [a.id, a.opp, a.student, a.status, a.cover_letter]);
    }
    console.log(`✅ Seeded ${applications.length} Applications across all statuses`);

    // Ensure EVERY opportunity in the database has applicants so no opportunity appears empty during demos
    const { rows: emptyOpps } = await client.query(`
      SELECT o.id, o.title
      FROM opportunities o
      LEFT JOIN applications a ON a.opportunity_id = o.id
      GROUP BY o.id, o.title
      HAVING count(a.id) = 0
    `);

    const demoStudents = [
      { id: '20000000-0000-0000-0000-000000000001', name: 'Arun Sharma' },
      { id: '20000000-0000-0000-0000-000000000002', name: 'Priya Nair' },
      { id: '20000000-0000-0000-0000-000000000003', name: 'Rohan Mehta' },
      { id: '20000000-0000-0000-0000-000000000012', name: 'Ananya Sen' },
      { id: '20000000-0000-0000-0000-000000000015', name: 'Kavya Patel' },
      { id: '20000000-0000-0000-0000-000000000016', name: 'Aditya Verma' },
    ];

    const demoStatuses = ['pending', 'shortlisted', 'accepted'];

    for (const opp of emptyOpps) {
      for (let i = 0; i < 2; i++) {
        const student = demoStudents[(opp.title.length + i) % demoStudents.length];
        const status = demoStatuses[i % demoStatuses.length];
        await client.query(`
          INSERT INTO applications (opportunity_id, student_id, status, cover_letter)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (opportunity_id, student_id) DO NOTHING
        `, [
          opp.id,
          student.id,
          status,
          `Hello,\n\nI am very excited to apply for ${opp.title}. My coursework and technical projects align well with the responsibilities outlined in the description. Looking forward to discussing how I can contribute to your engineering goals.`
        ]);
      }
    }
    if (emptyOpps.length > 0) {
      console.log(`✅ Added mock applicants to ${emptyOpps.length} previously empty opportunities`);
    }

    // ────────────────────────────────────────────────────────────────
    // 10. STUDENT PROJECTS (16 showcase portfolio projects)
    // ────────────────────────────────────────────────────────────────
    const projects = [
      {
        id: '50000000-0000-0000-0000-000000000001',
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        title: 'E-commerce Platform & Checkout Engine',
        description: 'Full-stack e-commerce engine with React 18, Node.js microservices, PostgreSQL transactions, and Stripe webhook handling.',
        url: 'https://github.com/arun/ecommerce-engine'
      },
      {
        id: '50000000-0000-0000-0000-000000000002',
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        title: 'Real-Time Collaborative Code Editor',
        description: 'Web-based multi-user code workspace featuring Operational Transformation (OT) synchronization via WebSockets and syntax highlighting.',
        url: 'https://github.com/arun/collab-code'
      },
      {
        id: '50000000-0000-0000-0000-000000000003',
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        title: 'Developer Productivity CLI',
        description: 'Node.js command-line utility for automating git branch hygiene, changelog creation, and semantic version bumps.',
        url: 'https://github.com/arun/dev-cli'
      },
      {
        id: '50000000-0000-0000-0000-000000000004',
        student: '20000000-0000-0000-0000-000000000002', // Priya Nair
        title: 'Biomedical Named Entity Extractor',
        description: 'Fine-tuned BioBERT model extracting genes, chemical compounds, and adverse drug reactions with 92.4% F1 accuracy.',
        url: 'https://github.com/priya/biomed-ner'
      },
      {
        id: '50000000-0000-0000-0000-000000000005',
        student: '20000000-0000-0000-0000-000000000002', // Priya Nair
        title: 'Financial Sentiment Time-Series Analyzer',
        description: 'End-to-end Python pipeline extracting market sentiment from financial earnings calls and predicting volatility correlations.',
        url: 'https://github.com/priya/earnings-sentiment'
      },
      {
        id: '50000000-0000-0000-0000-000000000006',
        student: '20000000-0000-0000-0000-000000000003', // Rohan Mehta
        title: 'Distributed Background Worker Pool',
        description: 'Fault-tolerant job scheduler written in Go with Redis Pub/Sub, dead-letter queues, and automatic retry backoff.',
        url: 'https://github.com/rohan/go-worker-pool'
      },
      {
        id: '50000000-0000-0000-0000-000000000007',
        student: '20000000-0000-0000-0000-000000000012', // Ananya Sen
        title: 'High-Throughput Key-Value Store in Go',
        description: 'LSM-tree storage engine implementing append-only write logs, SSTable compaction, and sub-millisecond p99 read latency.',
        url: 'https://github.com/ananya/lsm-kv-store'
      },
      {
        id: '50000000-0000-0000-0000-000000000008',
        student: '20000000-0000-0000-0000-000000000013', // Vikram Aditya
        title: 'Edge Object Detection with TensorRT',
        description: 'Lightweight YOLOv8 model quantized to INT8 running at 65 FPS on Jetson Orin Nano for robot obstacle avoidance.',
        url: 'https://github.com/vikram/robotics-tensorrt'
      },
      {
        id: '50000000-0000-0000-0000-000000000009',
        student: '20000000-0000-0000-0000-000000000014', // Sneha Kulkarni
        title: 'Multi-Region AWS Infrastructure with Terraform',
        description: 'Complete Infrastructure-as-Code repository provisioning VPC peering, auto-scaling EKS clusters, and CloudFront distributions.',
        url: 'https://github.com/sneha/terraform-aws-blueprint'
      },
      {
        id: '50000000-0000-0000-0000-000000000010',
        student: '20000000-0000-0000-0000-000000000015', // Kavya Patel
        title: 'Aura UI: Accessible React Design System',
        description: 'Headless, fully accessible design system with 35+ components, strict WCAG AAA color contrast, and Figma design tokens.',
        url: 'https://github.com/kavya/aura-design-system'
      },
      {
        id: '50000000-0000-0000-0000-000000000011',
        student: '20000000-0000-0000-0000-000000000016', // Aditya Verma
        title: 'Real-Time IoT Telemetry Streamer',
        description: 'High-throughput Node.js WebSocket broker managing 10,000 concurrent sensor feeds with Redis buffering.',
        url: 'https://github.com/aditya/iot-telemetry'
      },
      {
        id: '50000000-0000-0000-0000-000000000012',
        student: '20000000-0000-0000-0000-000000000017', // Neha Deshmukh
        title: 'Automated IAM Privilege Escalation Scanner',
        description: 'Python security auditing tool identifying over-permissive AWS IAM policies and lateral movement pathways.',
        url: 'https://github.com/neha/iam-hunter'
      },
      {
        id: '50000000-0000-0000-0000-000000000013',
        student: '20000000-0000-0000-0000-000000000018', // Rahul Sundaram
        title: 'Streaming Analytics Pipeline with Kafka & PostgreSQL',
        description: 'Automated change data capture (CDC) streaming pipeline transforming real-time event logs into analytical marts.',
        url: 'https://github.com/rahul/streaming-etl'
      },
      {
        id: '50000000-0000-0000-0000-000000000014',
        student: '20000000-0000-0000-0000-000000000019', // Meera Iyer
        title: 'Campus Schedule & Event Navigator',
        description: 'React Native mobile app with offline synchronization helping 2,500+ university students navigate campus classes.',
        url: 'https://github.com/meera/campus-navigator'
      },
      {
        id: '50000000-0000-0000-0000-000000000015',
        student: '20000000-0000-0000-0000-000000000001', // Arun Sharma
        title: 'GraphQL Gateway for Microservices',
        description: 'Federated GraphQL supergraph merging customer, inventory, and payment microservices into a unified query schema.',
        url: 'https://github.com/arun/graphql-gateway'
      },
      {
        id: '50000000-0000-0000-0000-000000000016',
        student: '20000000-0000-0000-0000-000000000002', // Priya Nair
        title: 'Clinical Knowledge Graph Embeddings',
        description: 'Graph Neural Network (GNN) learning entity representations across PubMed knowledge graphs for drug repurposing.',
        url: 'https://github.com/priya/clinical-kg'
      },
    ];

    for (const p of projects) {
      await client.query(`
        INSERT INTO projects (id, student_id, title, description, project_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          project_url = EXCLUDED.project_url
      `, [p.id, p.student, p.title, p.description, p.url]);
    }
    console.log(`✅ Seeded ${projects.length} Student Showcase Projects`);

    // ────────────────────────────────────────────────────────────────
    // 11. LEARNING RESOURCES (30 curated resources)
    // ────────────────────────────────────────────────────────────────
    const learningResources = [
      { skill: '10000000-0000-0000-0000-000000000001', title: 'Python Official Documentation & Tutorials', type: 'article', url: 'https://docs.python.org/3/' },
      { skill: '10000000-0000-0000-0000-000000000001', title: 'Harvard CS50P — Python Programming', type: 'course', url: 'https://cs50.harvard.edu/python/' },
      { skill: '10000000-0000-0000-0000-000000000002', title: 'Modern JavaScript from the Beginning', type: 'course', url: 'https://javascript.info' },
      { skill: '10000000-0000-0000-0000-000000000003', title: 'React Official Documentation & Guides', type: 'article', url: 'https://react.dev' },
      { skill: '10000000-0000-0000-0000-000000000003', title: 'Full Stack Open — Deep Dive Into React', type: 'course', url: 'https://fullstackopen.com/en/' },
      { skill: '10000000-0000-0000-0000-000000000004', title: 'Node.js Design Patterns (3rd Edition)', type: 'book', url: 'https://www.nodejsdesignpatterns.com' },
      { skill: '10000000-0000-0000-0000-000000000005', title: 'PostgreSQL Tutorial & Performance Tuning', type: 'article', url: 'https://www.postgresqltutorial.com' },
      { skill: '10000000-0000-0000-0000-000000000006', title: 'Fast.ai — Practical Deep Learning for Coders', type: 'course', url: 'https://course.fast.ai' },
      { skill: '10000000-0000-0000-0000-000000000007', title: 'Kaggle: Learn Data Analysis & Micro-Courses', type: 'course', url: 'https://www.kaggle.com/learn' },
      { skill: '10000000-0000-0000-0000-000000000010', title: 'Docker Official Get-Started Guide', type: 'tool', url: 'https://docs.docker.com/get-started/' },
      { skill: '10000000-0000-0000-0000-000000000011', title: 'Designing Web APIs — Specification & Contracts', type: 'book', url: 'https://nordicapis.com/ebooks/' },
      { skill: '10000000-0000-0000-0000-000000000012', title: 'SQLBolt — Interactive Lessons to Learn SQL', type: 'tool', url: 'https://sqlbolt.com' },
      { skill: '10000000-0000-0000-0000-000000000013', title: 'TypeScript Handbook & Deep Dive', type: 'article', url: 'https://www.typescriptlang.org/docs/' },
      { skill: '10000000-0000-0000-0000-000000000014', title: 'Next.js Official Learn Course', type: 'course', url: 'https://nextjs.org/learn' },
      { skill: '10000000-0000-0000-0000-000000000015', title: 'Tailwind CSS Documentation & Showcase', type: 'article', url: 'https://tailwindcss.com/docs' },
      { skill: '10000000-0000-0000-0000-000000000019', title: 'Go by Example — Hands-On Go Programming', type: 'article', url: 'https://gobyexample.com' },
      { skill: '10000000-0000-0000-0000-000000000025', title: 'Designing Data-Intensive Applications (DDIA)', type: 'book', url: 'https://dataintensive.net' },
      { skill: '10000000-0000-0000-0000-000000000027', title: 'Redis University: RU101 Introduction to Redis', type: 'course', url: 'https://university.redis.com' },
      { skill: '10000000-0000-0000-0000-000000000029', title: 'Kubernetes Up & Running (O\'Reilly)', type: 'book', url: 'https://kubernetes.io/docs/tutorials/' },
      { skill: '10000000-0000-0000-0000-000000000030', title: 'AWS Skill Builder: Cloud Practitioner Essentials', type: 'course', url: 'https://explore.skillbuilder.aws' },
      { skill: '10000000-0000-0000-0000-000000000032', title: 'GitHub Actions: CI/CD Pipeline Automation', type: 'article', url: 'https://docs.github.com/en/actions' },
      { skill: '10000000-0000-0000-0000-000000000033', title: 'HashiCorp Terraform Tutorials & Cert Prep', type: 'course', url: 'https://developer.hashicorp.com/terraform/tutorials' },
      { skill: '10000000-0000-0000-0000-000000000034', title: 'The Linux Command Line (William Shotts)', type: 'book', url: 'https://linuxcommand.org/tlcl.php' },
      { skill: '10000000-0000-0000-0000-000000000036', title: 'Deep Learning with PyTorch: 60-Minute Blitz', type: 'article', url: 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html' },
      { skill: '10000000-0000-0000-0000-000000000038', title: 'Hugging Face NLP Course', type: 'course', url: 'https://huggingface.co/learn/nlp-course' },
      { skill: '10000000-0000-0000-0000-000000000039', title: 'Stanford CS231n: Deep Learning for Computer Vision', type: 'course', url: 'http://cs231n.stanford.edu/' },
      { skill: '10000000-0000-0000-0000-000000000041', title: 'Generative AI with Large Language Models (Coursera)', type: 'course', url: 'https://www.deeplearning.ai/courses/' },
      { skill: '10000000-0000-0000-0000-000000000042', title: 'OWASP Top 10 Security Risks & Mitigations', type: 'article', url: 'https://owasp.org/www-project-top-ten/' },
      { skill: '10000000-0000-0000-0000-000000000044', title: 'Testing JavaScript with Jest & React Testing Library', type: 'video', url: 'https://jestjs.io/docs/getting-started' },
      { skill: '10000000-0000-0000-0000-000000000046', title: 'Agile Manifesto & Scrum Guide in Practice', type: 'article', url: 'https://scrumguides.org' },
    ];

    for (const r of learningResources) {
      await client.query(`
        INSERT INTO learning_resources (skill_id, title, resource_type, resource_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [r.skill, r.title, r.type, r.url]);
    }
    console.log(`✅ Seeded ${learningResources.length} Learning Roadmap Resources`);

    // ────────────────────────────────────────────────────────────────
    // 12. SKILL PROGRESS (Tracking learning goals across students)
    // ────────────────────────────────────────────────────────────────
    const skillProgressData = [
      // Arun Sharma
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000010', status: 'in_progress' }, // Docker
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000005', status: 'in_progress' }, // Postgres
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000011', status: 'completed' },   // REST API
      { student: '20000000-0000-0000-0000-000000000001', skill: '10000000-0000-0000-0000-000000000006', status: 'not_started' }, // ML

      // Priya Nair
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000035', status: 'completed' },   // Deep Learning
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000036', status: 'completed' },   // PyTorch
      { student: '20000000-0000-0000-0000-000000000002', skill: '10000000-0000-0000-0000-000000000010', status: 'in_progress' }, // Docker

      // Rohan Mehta
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000019', status: 'in_progress' }, // Go
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000025', status: 'in_progress' }, // Microservices
      { student: '20000000-0000-0000-0000-000000000003', skill: '10000000-0000-0000-0000-000000000034', status: 'completed' },   // Linux

      // Sneha Kulkarni
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000033', status: 'completed' },   // Terraform
      { student: '20000000-0000-0000-0000-000000000014', skill: '10000000-0000-0000-0000-000000000029', status: 'in_progress' }, // K8s

      // Kavya Patel
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000014', status: 'completed' },   // Next.js
      { student: '20000000-0000-0000-0000-000000000015', skill: '10000000-0000-0000-0000-000000000013', status: 'in_progress' }, // TypeScript
    ];

    for (const sp of skillProgressData) {
      await client.query(`
        INSERT INTO skill_progress (student_id, skill_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id, skill_id) DO UPDATE SET
          status = EXCLUDED.status
      `, [sp.student, sp.skill, sp.status]);
    }
    console.log(`✅ Seeded ${skillProgressData.length} Student Learning Progress Records`);

    await client.query('COMMIT');
    console.log('\n🎉 ALL MOCK DATA SEEDED SUCCESSFULLY!\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during mock data seeding:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
