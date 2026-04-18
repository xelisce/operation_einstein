# Operation Einstein — Student Portal (Handover Documentation)

## 1. Project Overview

Operation Einstein is a science workshop platform for students. Through the student portal, students can:

- Log in or register an account
- View their enrolled workshops on a dashboard
- Complete assignments (multiple-choice and free-text questions)
- Maintain a multi-day project journal with rich-text editing
- Export their journal as a PDF (which is automatically emailed to the admin)

### Architecture

```
[Next.js Frontend :3001] ──> [Express Backend :3002] ──> [Supabase (PostgreSQL)]
```

- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS 4)
- **Backend**: Node.js + Express 5, REST API
- **Database**: Supabase (managed PostgreSQL with REST client)
- **Auth**: Custom JWT-based (bcrypt password hashing, 7-day tokens)
- **Email**: Resend API (for PDF report delivery)
- **Containerization**: Docker Compose

---

## 2. Repository Structure

```
student/
├── frontend/                # Next.js app (port 3001)
│   ├── app/
│   │   ├── page.tsx         # Login / Register gateway
│   │   ├── layout.tsx       # Root layout (fonts, metadata)
│   │   ├── globals.css      # Tailwind base styles
│   │   ├── useAuth.ts       # Auth state hook
│   │   ├── lib/
│   │   │   └── auth.ts      # Token storage, JWT decode, authFetch helper
│   │   ├── models/
│   │   │   └── types.ts     # TypeScript type definitions for all entities
│   │   ├── components/
│   │   │   ├── BackButton.tsx
│   │   │   └── LogoutButton.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Student dashboard (workshops + to-do list)
│   │   ├── workshops/
│   │   │   └── [workshopId]/
│   │   │       └── page.tsx # Workshop detail (assignments + projects)
│   │   ├── assignments/
│   │   │   └── [assignmentId]/
│   │   │       ├── page.tsx                 # Assignment questions view
│   │   │       └── submitAssignmentButton.tsx # Client-side submit logic
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx           # Multi-day journal with PDF export
│   │   │       ├── richTextEditor.tsx # Quill.js wrapper component
│   │   │       └── print.css          # PDF export styles
│   │   └── test/
│   │       └── page.tsx       # Debug page (shows auth user info)
│   ├── public/               # Static assets (logo.jpg, etc.)
│   ├── Dockerfile
│   └── .env.local            # Frontend environment variables
│
├── backend/                  # Express API server (port 3002)
│   ├── src/
│   │   ├── index.js          # All route definitions and server startup
│   │   ├── supabaseClient.js # Supabase client initialization
│   │   └── authMiddleware.js # JWT verification middleware
│   ├── Dockerfile
│   └── .env                  # Backend environment variables
│
└── README.md                 # This file
```

---

## 3. Getting Started

### Prerequisites

- Node.js 18+
- npm
- Docker & Docker Compose (optional, for containerized setup)
- A Supabase project with the required tables (see Section 4)

### Environment Variables

**Backend** (`student/backend/.env`):

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (Set to `3002`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) |
| `FRONTEND_ORIGIN` | No | CORS origin for frontend (Set to `http://localhost:3001` for student frontend) |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT tokens |
| `RESEND_API_KEY` | Yes | Resend API key for sending PDF reports via email |
| `ADMIN_EMAIL` | Yes | Email address that receives exported PDF reports |

**Frontend** (`student/frontend/.env.local`):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API base URL (e.g. `http://localhost:3002`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (for direct client use if needed) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_TEACHER_URL` | Yes | URL of the teacher frontend app (e.g. `http://localhost:3000`) |

### Running Locally (Without Docker)

```bash
# Terminal 1 — Backend
cd student/backend
npm install
npm run dev         

# Terminal 2 — Frontend
cd student/frontend
npm install
npm run dev          
```

---

## 4. Supabase Schema

### Tables

**`profiles`** — User accounts

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | NO | — | User ID (set during registration, no auto-generate) |
| `email` | text | YES | — | User email address |
| `role` | text | YES | — | `"student"` or `"teacher"` |
| `name` | text | YES | — | Display name |
| `password_hash` | text | YES | — | bcrypt hash of the user's password |

**`categories`** — Workshop categories

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | Category identifier (PK) |
| `name` | text | NO | — | Category display name |
| `code` | text | NO | — | Short code |
| `created_at` | timestamptz | YES | `now()` | Timestamp when created |

**`enrollments`** — Which students are in which workshops

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | Enrollment identifier (PK) |
| `workshop_id` | uuid | YES | `gen_random_uuid()` | FK → `workshops.workshop_id` |
| `student_id` | uuid | YES | — | FK → `profiles.id` |

**`workshops`** — Workshop metadata

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `workshop_id` | uuid | NO | `gen_random_uuid()` | Workshop identifier (PK) |
| `title` | text | NO | — | Display name |
| `code` | text | NO | — | Short code (e.g. "SCI101") |
| `color` | text | NO | — | UI theme color |
| `term` | text | NO | — | Academic term (e.g. "2026 Term 1") |
| `category_id` | uuid | YES | — | FK → `categories.id` |
| `workshop_date` | date | YES | — | Date of the workshop |

**`assignments`** — Tasks within a workshop

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `assignment_id` | uuid | NO | `gen_random_uuid()` | Assignment identifier (PK) |
| `workshop_id` | uuid | NO | `gen_random_uuid()` | FK → `workshops.workshop_id` |
| `title` | text | NO | — | Assignment title |
| `points` | integer | NO | `0` | Point value |
| `due_date` | text | NO | — | Due date string |
| `assignment_type` | text | NO | — | `"assignment"` or `"announcement"` |

**`questions`** — Questions within an assignment

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `question_id` | uuid | NO | `gen_random_uuid()` | Question identifier (PK) |
| `assignment_id` | uuid | NO | — | FK → `assignments.assignment_id` |
| `question_text` | text | NO | — | The question prompt |
| `type` | text | NO | — | `"multiple_choice"` or `"text"` |
| `question_order` | integer | NO | — | Display order |
| `correct_answer` | text | YES | — | Correct answer key (used by teacher side for grading) |
| `points` | numeric | YES | — | Points for this specific question |

**`questionoptions`** — Options for MCQ questions

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `questionoption_id` | uuid | NO | `gen_random_uuid()` | Option identifier (PK) |
| `question_id` | uuid | NO | — | FK → `questions.question_id` |
| `option_order` | integer | NO | — | Display order |
| `option_text` | text | NO | — | Option label |

**`responses`** — Student answers to assignment questions

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `response_id` | uuid | NO | `gen_random_uuid()` | Response identifier (PK) |
| `question_id` | uuid | NO | — | FK → `questions.question_id` |
| `student_id` | uuid | NO | — | FK → `profiles.id` |
| `answer_text` | text | NO | — | The student's answer |
| `created_at` | timestamptz | YES | `now()` | Timestamp when submitted |

**`projects`** — Multi-day journal projects

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `project_id` | uuid | NO | `gen_random_uuid()` | Project identifier (PK) |
| `title` | text | NO | — | Project title |
| `workshop_id` | uuid | NO | `gen_random_uuid()` | FK → `workshops.workshop_id` |

**`project_questions`** — Daily prompts within a project

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `question_id` | uuid | NO | `gen_random_uuid()` | Question identifier (PK) |
| `project_id` | uuid | NO | — | FK → `projects.project_id` |
| `prompt` | text | NO | — | The day's focus/prompt text |
| `position` | integer | NO | `0` | Day order (Day 1, Day 2, ...) |

**`project_responses`** — Student journal entries

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `response_id` | uuid | NO | `gen_random_uuid()` | Response identifier (PK) |
| `project_id` | uuid | NO | — | FK → `projects.project_id` |
| `question_id` | uuid | NO | — | FK → `project_questions.question_id` |
| `content_html` | text | NO | `''` | HTML content from Quill editor |
| `content_delta` | jsonb | YES | — | Quill delta representation |
| `student_id` | uuid | NO | — | FK → `profiles.id` |

**Unique constraint on `project_responses`**: `(question_id, student_id)` — used for upsert.

### Entity Relationships

```
profiles ─┬── enrollments ──── workshops ──── categories
           │                        │
           │                        ├── assignments ──── questions ──── questionoptions
           │                        │                        │
           │                        │                        └── responses (student answers)
           │                        │
           │                        └── projects ──── project_questions
           │                                             │
           └────────────────────────────────── project_responses (journal entries)
```

---

## 5. Authentication System

### Registration (`POST /api/auth/register`)

1. Client sends `{email, password, role}` to the backend
2. Backend checks `profiles` for existing email (returns 409 if found)
3. Generates a UUID, hashes the password with bcrypt (10 salt rounds)
4. Inserts into `profiles`
5. Signs a JWT with `{sub: id, email, role}`, 7-day expiry
6. Returns `{token, role}`

### Login (`POST /api/auth/login`)

1. Client sends `{email, password}`
2. Backend fetches `profiles` row by email
3. Verifies password against stored bcrypt hash
4. Signs and returns JWT

### Token Flow

```
Login/Register
  → JWT stored in localStorage as "oe_token"
  → getUser() decodes JWT payload client-side (base64 decode of middle segment)
  → Checks expiry, returns {id, email, role}
  → authFetch() attaches "Authorization: Bearer <token>" header to requests
  → Backend authenticate middleware verifies JWT with JWT_SECRET
  → Attaches req.user = {sub, email, role}
```

### Role-Based Routing

- After login, if `role === "teacher"` the frontend redirects to `NEXT_PUBLIC_TEACHER_URL`
- If `role === "student"` the frontend redirects to `/dashboard`
- The dashboard endpoint (`GET /api/dashboard`) requires authentication — it uses `req.user.sub` to look up the student's enrollments

---

## 6. API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/hello` | Health check / dummy endpoint |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/register` | Register a new account |
| `GET` | `/api/workshops` | List all workshops |
| `GET` | `/api/workshops/:workshopId` | Get a single workshop |
| `GET` | `/api/workshops/:workshopId/assignments` | List assignments for a workshop |
| `GET` | `/api/workshops/:workshopId/projects` | List projects for a workshop |
| `GET` | `/api/assignments/:assignmentId` | Get an assignment by ID |
| `GET` | `/api/assignments/:assignmentId/questions` | List questions for an assignment |
| `GET` | `/api/questions/:questionId/options` | List MCQ options for a question |
| `GET` | `/api/projects/:projectId` | Get a project by ID |
| `GET` | `/api/projects/:projectId/questions` | List daily prompts for a project |
| `GET` | `/api/dashboard` | Get student's enrolled workshops + to-do assignments |
| `POST` | `/api/assignments/:assignmentId/responses` | Submit answers to assignment questions |
| `POST` | `/api/projects/:projectId/responses` | Save/update journal entries (upsert) |
| `GET` | `/api/projects/:projectId/responses` | Get student's saved journal entries |
| `POST` | `/api/email/send-report` | Email a PDF file to admin (multipart/form-data) |

---

## 7. Frontend Pages & Routes

| Route | Type | Description |
|---|---|---|
| `/` | Client component | Auth gateway (login/register form). Redirects to `/dashboard` or teacher app based on role. Also handles logout via `?action=logout` query param. |
| `/dashboard` | Client component | Student dashboard. Shows enrolled workshop cards and a to-do sidebar with upcoming assignments. Requires auth. |
| `/workshops/[workshopId]` | Server component | Workshop detail page. Lists assignments and projects. No auth required (data is public). |
| `/assignments/[assignmentId]` | Server component | Renders questions (MCQ as radio buttons, text as textareas). The submit button is a client component that reads DOM state and POSTs answers. |
| `/projects/[projectId]` | Client component | Multi-day journal editor. Day selector sidebar + Quill.js rich text editor. Save button upserts to backend. Export button generates PDF and emails it. |
| `/test` | Client component | Debug page showing current auth user info |

### Key Frontend Modules

- **`app/lib/auth.ts`** — `getToken()`, `setToken()`, `clearToken()`, `getUser()` (client-side JWT decode), `authFetch()` (fetch with Bearer token)
- **`app/useAuth.ts`** — React hook wrapping `getUser()`, returns `{user, loading}`
- **`app/models/types.ts`** — TypeScript interfaces: `Workshop`, `Assignment`, `Question`, `QuestionOption`, `QuestionResponse`, `Project`, `ProjectQuestion`, `ProjectResponseRow`
- **`app/components/BackButton.tsx`** — Navigation helper (uses `router.back()` or pushes to a given href)
- **`app/components/LogoutButton.tsx`** — Clears token and navigates to `/`

---

## 8. Assignment Flow (End-to-End)

1. Student opens a workshop page → sees list of assignments
2. Clicks an assignment → server component fetches the assignment, its questions, and MCQ options
3. Questions render in order: text questions get a `<textarea name="q_{questionId}">`, MCQ questions get radio buttons `<input type="radio" name="q_{questionId}" value="{optionText}">`
4. Student fills in answers
5. Clicks "Submit Assignment" button (client component)
6. **Validation**: iterates all questions, queries the DOM for each textarea/radio group to confirm every question has an answer. Alerts if not.
7. **Collection**: reads all answers from the DOM into `{questionId, answerText}[]`
8. **Submission**: POSTs to `/api/assignments/:id/responses` with auth token
9. Backend inserts into `responses` table
10. On success, alerts and redirects back to the workshop page

---

## 9. Project Journal Flow (End-to-End)

### Loading

1. Student opens a project → client component fetches project metadata, daily prompts (`project_questions`), and any previously saved responses (`project_responses`)
2. Previous answers populate the editor state (keyed by `projectQuestionId`)
3. A day-selector sidebar shows dots indicating which days have content

### Editing

1. Each day uses `RichTextEditor` — a Quill.js wrapper with toolbar: headers, bold/italic/underline, lists, image upload
2. Image uploads convert to base64 data URIs (max 5MB) and embed directly in the Quill content
3. On every text change, the component calls `onChange({html, delta})` which updates local React state

### Saving

1. Click "Save" → POSTs all day entries to `/api/projects/:id/responses`
2. Backend uses Supabase `upsert` with `onConflict: "question_id,student_id"` so students can re-save and update existing entries
3. Save status indicator shows "Saved" or "Save failed" for 3 seconds

### PDF Export

1. Click "Export PDF" → dynamically imports `jspdf` and `html2canvas`
2. Builds a styled HTML string from all day entries (prompt + answer HTML)
3. Renders it in a hidden iframe at 794px width (A4 dimensions)
4. `html2canvas` rasterizes the iframe body at 2x scale
5. `jsPDF` splits the canvas into A4 pages (210mm x 297mm with 10mm margins)
6. Downloads the PDF to the student's machine
7. **Also** uploads the PDF blob via `FormData` to `/api/email/send-report`
8. Backend uses Resend to email the PDF as an attachment to `ADMIN_EMAIL`

---

## 10. External Services

### Supabase

- **Access pattern**: Backend uses the **service role key** (full admin access, bypasses RLS). All DB queries go through `@supabase/supabase-js` client initialized in `supabaseClient.js`.
- **Important**: The service role key is sensitive — never expose it to the frontend. The frontend's `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also currently set to the service role key (should be the anon key in production).

### Resend (Email)

- **Purpose**: Sends PDF reports to the admin email
- **API key**: Set via `RESEND_API_KEY` in backend `.env`
- **From address**: `onboarding@resend.dev` (Resend sandbox domain — only sends to verified emails in dev mode)
- **To address**: Set via `ADMIN_EMAIL` in backend `.env`

---

## 11. Deployment

There are two approaches: **self-hosting** (Docker on a VPS or local server) and **cloud services** (Vercel for frontend + Render for backend). Both approaches use Supabase as the hosted database.

---

### Option A: Self-Hosting (Docker Compose on a VPS)

The entire system (student + teacher) is orchestrated via `docker-compose.yml` at the project root.

#### Prerequisites

- A server (VPS, bare metal, or local machine) with Docker and Docker Compose installed
- Domain names pointing to your server (optional but recommended for HTTPS)
- Supabase project already set up with the required tables (see Section 4)

#### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd operation_einstein

# 2. Create the shared Docker network (first time only)
docker network create shared-network

# 3. Set environment variables
#    Edit student/backend/.env with production values
#    Edit student/frontend/.env.local with production values
#    (See Section 3 for full variable reference)

# 4. Build and start all services
docker-compose up -d --build
```

#### Port Mapping

| Service | Internal Port | Host Port | URL |
|---|---|---|---|
| student-backend | 3002 | 3002 | `http://your-server:3002` |
| student-frontend | 3001 | 3001 | `http://your-server:3001` |
| teacher-frontend | 3000 | 3000 | `http://your-server:3000` |

#### Production Dockerfiles (Optimized)

The current Dockerfiles run `npm run dev` (development mode). For production, update them:

**Backend** — change the CMD to use `start` instead of `dev`:
```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]       # runs "node src/index.js"
```

**Frontend** — use a multi-stage build:
```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3001
CMD ["npm", "start"]       # runs "next start -p 3001"
```

#### Setting Up Nginx Reverse Proxy (Recommended)

Use Nginx as a reverse proxy to route traffic to each service by domain name.

**Nginx config** (`nginx.conf`):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Student Frontend
server {
    listen 80;
    server_name oe.example.com www.oe.example.com;

    location /_next/webpack-hmr {
        proxy_pass http://student-frontend:3001/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://student-frontend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}

# Student Backend API
server {
    listen 80;
    server_name oeapi.example.com www.oeapi.example.com;

    client_max_body_size 20M;

    location /api {
        proxy_pass http://student-backend:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Teacher Frontend
server {
    listen 80;
    server_name teacher.example.com www.teacher.example.com;

    location /_next/webpack-hmr {
        proxy_pass http://teacher-frontend:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://teacher-frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Key points about this config:

- The `map` block at the top is required for the `$connection_upgrade` variable used in WebSocket proxying (Next.js HMR hot-reload needs this)
- `/_next/webpack-hmr` locations handle Next.js development hot module replacement over WebSockets
- `client_max_body_size 20M` on the API server block allows PDF uploads up to 20MB
- `proxy_read_timeout 86400` keeps long-lived WebSocket connections alive (1 day)
- Replace `example.com` with your actual domain

Add the Nginx service to `docker-compose.yml`:

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - shared-network
    depends_on:
      - student-frontend
      - student-backend
      - teacher-frontend
```

**For HTTPS**, use Certbot to generate free TLS certificates:

```bash
# Install certbot on the host
sudo apt install certbot

# Or run certbot in a Docker container alongside nginx
# See: https://github.com/nginxinc/nginx-certbot
```

Alternatively, replace the `nginx:alpine` image with an Nginx + Certbot image (e.g. `jonasal/nginx-certbot`) and add certificate directives to each server block:

```nginx
server {
    listen 443 ssl;
    server_name oe.example.com;

    ssl_certificate /etc/letsencrypt/live/oe.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oe.example.com/privkey.pem;

    # ... same location blocks as above
}
```

---

### Option B: Cloud Deployment (Vercel + Render)

This approach deploys the frontend and backend separately to managed cloud platforms. Supabase remains the hosted database.

#### Architecture

```
[Vercel — Student Frontend] ──> [Render — Express Backend] ──> [Supabase]
[Vercel — Teacher Frontend] ──> [Render — Express Backend] ──> [Supabase]
```

#### Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and create an account
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---|---|
| **Root Directory** | `student/backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (Starter) or paid |

5. Add environment variables in Render's dashboard:

| Key | Value |
|---|---|
| `PORT` | (Render auto-assigns — do not set, or set to `10000`) |
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `JWT_SECRET` | a strong random string (generate with `openssl rand -hex 32`) |
| `FRONTEND_ORIGIN` | your Vercel frontend URL (e.g. `https://student.yourdomain.com`) |
| `RESEND_API_KEY` | your Resend API key |
| `ADMIN_EMAIL` | admin email address |

6. Deploy — Render will give you a URL like `https://oe-student-backend.onrender.com`

**Note**: Render free tier spins down after 15 minutes of inactivity. First request after idle takes ~30 seconds to cold-start.

#### Step 2: Deploy Student Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and create an account
2. Click **Add New → Project**
3. Import your GitHub repository
4. Configure the project:

| Setting | Value |
|---|---|
| **Root Directory** | `student/frontend` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Output Directory** | (default, leave blank) |

5. Add environment variables in Vercel's dashboard:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://oe-student-backend.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase **anon** key (not service role) |
| `NEXT_PUBLIC_TEACHER_URL` | your teacher frontend URL |

6. Deploy — Vercel will give you a URL like `https://oe-student.vercel.app`

#### Step 3: Deploy Teacher Frontend to Vercel

Repeat the same process as Step 2, but with:

| Setting | Value |
|---|---|
| **Root Directory** | `teacher/frontend` |

And set its own environment variables (see `teacher/frontend/.env.local` for reference). The `NEXT_PUBLIC_API_BASE_URL` should point to the same Render backend deployed in Step 1.

#### Step 4: Update CORS on Backend

After deploying, ensure the backend's `FRONTEND_ORIGIN` in Render includes the Vercel frontend URLs. If both student and teacher frontends need access, update the CORS configuration in `student/backend/src/index.js`:

```js
// Replace the single origin with an array-based approach
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_TEACHER,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
```

#### Custom Domains (Optional)

- **Vercel**: Go to Project Settings → Domains → add your custom domain (e.g. `student.yourdomain.com`). Vercel handles SSL automatically.
- **Render**: Go to your web service → Settings → Custom Domains. Add your domain (e.g. `api.student.yourdomain.com`). You'll need to add a CNAME record at your DNS provider.

---

### Production Checklist (Applies to Both)

- [ ] Replace Supabase service role key on the frontend with the anon key
- [ ] Set a strong `JWT_SECRET` (generate with `openssl rand -hex 32`)
- [ ] Configure Resend with a verified custom domain (not `onboarding@resend.dev`)
- [ ] Update `FRONTEND_ORIGIN` to the production student frontend URL
- [ ] Update `NEXT_PUBLIC_API_BASE_URL` to the production backend URL
- [ ] Update `NEXT_PUBLIC_TEACHER_URL` to the production teacher frontend URL
- [ ] Enable Supabase RLS policies and update backend to use anon key + proper auth context
- [ ] Set up HTTPS (automatic with Vercel/Render, use Caddy/Nginx for self-hosting)
- [ ] Remove or protect the `/test` debug page
- [ ] Rotate any secrets that were committed to the repository

---

## 12. Known Limitations

1. **No grading or feedback system** — Students can submit responses, but there's no mechanism for teachers to grade or provide feedback through the student portal.

2. **Images stored as base64** — The Quill editor embeds uploaded images as base64 data URIs directly in the HTML content. This bloats the database and PDFs. A production system should upload images to Supabase Storage and store URLs instead.

3. **Resend sandbox domain** — Uses `onboarding@resend.dev` which only sends to verified email addresses. Must be replaced with a custom domain for production.

4. **No tests** — There are no unit or integration tests for either the frontend or backend.
---

## 13. Contact & Handover Notes

- **Supabase project** — ensure project ownership is transferred to the incoming team via Supabase dashboard → Project Settings → General → Transfer Project
- **Resend account** — tied to the API key in backend `.env`; transfer ownership or regenerate the key
- **Docker network**: `shared-network` must exist before running `docker-compose up` (self-hosting only)
- **Teacher frontend**: lives in `teacher/frontend/` and is documented separately
- **Root `package.json`**: contains shared dependencies (`@supabase/supabase-js`, `lucide-react`, `tailwind-merge`, `clsx`) — these are duplicates of what's in the frontend `package.json`
- **GitHub repository** — ensure the incoming team has admin access to the repo, or transfer ownership
