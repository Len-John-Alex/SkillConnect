# SkillConnect Deployment Guide 🚀

This guide walks you through deploying **SkillConnect** to production with a **free and modern cloud architecture**:

- **Database**: [Neon](https://neon.tech) or [Supabase](https://supabase.com) (Serverless PostgreSQL, free tier)
- **Backend API**: [Render](https://render.com) or [Railway](https://railway.app) (Node.js & Express, free/low tier)
- **Frontend SPA**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (React + Vite, global CDN, free tier)

---

## Architecture Overview

```mermaid
flowchart LR
    User[User Browser]
    Vercel["Frontend (Vercel / Netlify)\nReact 18 + Vite\n(https://skillconnect.vercel.app)"]
    Render["Backend API (Render / Railway)\nNode.js + Express\n(https://skillconnect-api.onrender.com)"]
    Neon["Database (Neon / Supabase)\nPostgreSQL 15+\n(Managed SSL)"]

    User -->|Views Pages| Vercel
    User -->|API & Auth Requests| Render
    Render -->|Queries & Transactions| Neon
```

---

## Step 1: Provision Managed PostgreSQL (Neon / Supabase)

1. Sign up for a free account at [neon.tech](https://neon.tech) (or [supabase.com](https://supabase.com)).
2. Create a new project (e.g. `skillconnect-prod`).
3. Copy your connection string from the dashboard. It will look like:
   ```text
   postgresql://alex:AbCdEf123456@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this string — you will use it as `DATABASE_URL`.

---

## Step 2: Deploy Backend to Render

1. Push your repository to **GitHub** (or GitLab).
2. Go to [render.com](https://render.com) and click **New +** → **Web Service**.
3. Connect your repository.
4. Configure the service settings:
   - **Name**: `skillconnect-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:

| Variable | Recommended Value | Notes |
|----------|-------------------|-------|
| `NODE_ENV` | `production` | Enables production optimizations & security |
| `PORT` | `5000` | Render will automatically bind or map this port |
| `DATABASE_URL` | `postgresql://...` | Connection string from Step 1 |
| `JWT_SECRET` | *(64 random characters)* | Access token signing secret |
| `JWT_REFRESH_SECRET` | *(64 random characters)* | Refresh token signing secret |
| `CLIENT_URL` | `https://your-app.vercel.app` | Allowed CORS frontend URL (set after Step 3, or use your temporary Vercel domain) |
| `COOKIE_SECURE` | `true` | Required for HTTPS cookies in production |
| `COOKIE_SAME_SITE` | `none` | Required for cross-origin cookie authentication (Vercel frontend to Render backend) |
| `INSTITUTION_INVITE_CODE` | `INST_2026_SKILLCONNECT` | Code required for institution account registration |

6. Click **Create Web Service**. Wait for the deployment to finish and copy your live backend URL (e.g., `https://skillconnect-api.onrender.com`).

---

## Step 3: Run Migrations and Seed Demo Data

Once the backend is connected to the database, apply the schema and seed data.

### Option A: From Render Web Shell
1. In your Render Dashboard, go to your Web Service → **Shell**.
2. Run:
   ```bash
   npm run db:migrate
   npm run db:seed:demo
   ```

### Option B: From Your Local Machine
From your local terminal, point to the remote database URL:
```bash
# In the server/ directory:
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require" NODE_ENV=production npm run db:migrate
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require" NODE_ENV=production npm run db:seed:demo
```

---

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:

| Name | Value | Description |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://skillconnect-api.onrender.com/api` | Full URL to your Render API with `/api` suffix |

5. Click **Deploy**.
6. When deployment finishes, copy your live frontend URL (e.g., `https://skillconnect.vercel.app`).

---

## Step 5: Connect CORS & Cookies

Now that you have your live frontend URL:
1. Return to **Render** → `skillconnect-api` → **Environment**.
2. Set `CLIENT_URL` to your exact Vercel frontend URL:
   ```text
   CLIENT_URL=https://skillconnect.vercel.app
   ```
3. Ensure:
   ```text
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=none
   ```
4. Render will automatically redeploy the backend with the new CORS origin.

---

## Verification Checklist

- [ ] Open frontend URL: `https://your-app.vercel.app`
- [ ] Log in with student demo account:
  - Email: `arun.sharma@student.iitb.ac.in`
  - Password: `Password123!`
- [ ] Check Network tab:
  - Auth cookie (`refreshToken`) received with `SameSite=None; Secure`.
  - API calls to `/api/...` succeed with HTTP 200/201.
- [ ] Test direct navigation: Refresh the page while on `/student/skills` (verifies `vercel.json` SPA rewrite works without 404).
- [ ] Log in with company demo account:
  - Email: `hr@techcorp.example.com`
  - Password: `Password123!`
- [ ] View opportunities and check applicants list.

---

## Alternative: Single-Server VPS (Docker Compose)

If you prefer deploying everything on a single virtual server (DigitalOcean Droplet, AWS EC2, or Hetzner):

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: skillconnect
      POSTGRES_PASSWORD: strong_db_password_here
      POSTGRES_DB: skillconnect
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: always
    environment:
      PORT: 5000
      NODE_ENV: production
      DATABASE_URL: postgresql://skillconnect:strong_db_password_here@db:5432/skillconnect
      JWT_SECRET: your_jwt_secret_here_replace_me
      JWT_REFRESH_SECRET: your_refresh_secret_here_replace_me
      CLIENT_URL: https://yourdomain.com
      COOKIE_SECURE: "true"
      COOKIE_SAME_SITE: "lax"
    depends_on:
      - db

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
      - "443:443"

volumes:
  postgres_data:
```
