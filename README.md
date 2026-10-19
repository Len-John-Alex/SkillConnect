# SkillConnect — Presentation Ready ✅

SkillConnect is an academia-industry collaboration and skill-mapping platform connecting students, companies, and institutions.

---

## Quick Start

```bash
# Terminal 1 - Backend (port 5000)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

**Requirements:**
- Node.js 18+
- PostgreSQL 14+ (running on localhost:5432, database `skillconnect`)
- Environment variables from `.env.example` copied to `.env`

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `arun.sharma@student.iitb.ac.in` | `Password123!` |
| Company | `hr@techcorp.example.com` | `Password123!` |
| Institution | `test.institution2@example.com` | `Password123!` |

---

## Recommended Demo Sequence

1. **Student Dashboard** — Login as Arun Sharma
   - Overview: Profile, skills, applications, projects
   - Skill Passport: View/add skills with proficiency levels
   - Opportunities: Browse 2 open opportunities with skill requirements
   - **Skill Gap Analysis**: Select "Full-Stack Intern" → See matched (JavaScript L4, React L3, Node.js L3) vs required (JS L3, React L3, Node.js L2) → 100% match
   - Learning Roadmap: View recommended resources for skill gaps
   - Applications: Apply to "Full-Stack Intern" with cover letter
   - Projects: View "E-commerce Platform" project

2. **Company Dashboard** — Login as TechCorp
   - Overview: Stats, recent opportunities, applications
   - My Opportunities: View created opportunities
   - Applicants: View Arun's application with skill matching
   - Update status: `pending` → `shortlisted` → `accepted`

3. **Student Dashboard** — Return to Arun Sharma
   - Applications: See status updated to "accepted"

4. **Institution Dashboard** — Login as Test Institution
   - Placeholder dashboard (analytics endpoints not implemented)

---

## Verified Data

| Entity | Count | Notes |
|--------|-------|-------|
| Students | 5 | 3 seeded + 2 test |
| Companies | 3 | 2 seeded + 1 test |
| Skills | 12 | Across 8 categories |
| Open Opportunities | 2 | With skill requirements |
| Learning Resources | 5 | Linked to skills |
| Applications | 1 | Status: accepted |

---

## Known Limitations

- Institution analytics: Backend endpoints not implemented; dashboard shows placeholder
- File uploads: Not implemented (resumes, project assets)
- Email notifications: Not implemented
- Real-time features: Not implemented
- Admin panel: Not implemented
- Institution registration requires invite code (not demonstrated)

---

## Commands

```bash
# Backend
cd server
npm run dev        # Development server
npm test           # Run 74 tests
npm run db:migrate # Apply migrations

# Frontend
cd client
npm run dev        # Development server
npm run build      # Production build (306 kB / 83 kB gzipped)
```

---

## Environment

Copy `.env.example` to `.env` in both `server/` and `client/`:

**server/.env**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/skillconnect
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=another_32_char_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

**client/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Restart Without Data Loss

The database persists across restarts. To restore demo state:
1. Ensure PostgreSQL is running
2. Start backend: `cd server && npm run dev`
3. Start frontend: `cd client && npm run dev`
4. Use demo credentials above

No database reset needed — all seed data persists.