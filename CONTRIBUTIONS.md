# Contributions by Zerui (limzerui)

This document is a **comprehensive, in-depth reference** of every contribution made by **Zerui** (GitHub: [`limzerui`](https://github.com/limzerui), email: `lim.zerui@gmail.com`) to this repository — covering the `main` branch, the `zr` feature branch (merged via PR #4), and all subsequent main-branch commits.

> **Scope:** This document covers **only** Zerui / limzerui's work. All commits by other contributors are intentionally excluded.

---

## Table of Contents

1. [Contributor Identity](#1-contributor-identity)
2. [Contribution Overview](#2-contribution-overview)
3. [Tech Stack Introduced by Zerui](#3-tech-stack-introduced-by-zerui)
4. [Commit-by-Commit Breakdown](#4-commit-by-commit-breakdown)
   - [4.1 Repository Hygiene — `.gitignore` Files](#41-repository-hygiene--gitignore-files)
   - [4.2 Backend Foundation — Express + MongoDB](#42-backend-foundation--express--mongodb)
   - [4.3 Teacher Interface (Next.js) + OCR Service](#43-teacher-interface-nextjs--ocr-service)
   - [4.4 Image Upload Route + Class & Quiz Models](#44-image-upload-route--class--quiz-models)
   - [4.5 Data Models Expansion — Response Schema](#45-data-models-expansion--response-schema)
   - [4.6 Full REST API Implementation + Comprehensive Test Suite](#46-full-rest-api-implementation--comprehensive-test-suite)
   - [4.7 Frontend — Next.js Class Dashboard](#47-frontend--nextjs-class-dashboard)
   - [4.8 Frontend — Quiz Builder, Response Viewer & Simulation UI](#48-frontend--quiz-builder-response-viewer--simulation-ui)
   - [4.9 Documentation — Architecture & Developer Guide](#49-documentation--architecture--developer-guide)
   - [4.10 Supabase Integration + Client-Side Smart Grading Scanner](#410-supabase-integration--client-side-smart-grading-scanner)
   - [4.11 Final Refactor — Express/MongoDB → Serverless Next.js/Supabase](#411-final-refactor--expressmongodb--serverless-nextjssupabase)
5. [Feature Deep-Dives](#5-feature-deep-dives)
   - [5.1 OCR Grading Pipeline](#51-ocr-grading-pipeline)
   - [5.2 Quiz Simulation Engine](#52-quiz-simulation-engine)
   - [5.3 Smart Grading Scanner (Crop + Scan + Save)](#53-smart-grading-scanner-crop--scan--save)
   - [5.4 Supabase Relational Schema Design](#54-supabase-relational-schema-design)
6. [Testing Philosophy](#6-testing-philosophy)
7. [Architecture Evolution](#7-architecture-evolution)

---

## 1. Contributor Identity

| Field | Value |
| :--- | :--- |
| **GitHub Username** | `limzerui` |
| **Display Name (in commits)** | `limzerui` and `Zerui` |
| **Email** | `lim.zerui@gmail.com` |
| **Total Commits (this repo)** | **13 feature/fix commits + 1 merge commit** |
| **Date Range** | Dec 11, 2025 → Mar 2, 2026 |
| **Branches** | `zr` (feature branch, merged via PR #4) and `main` |

---

## 2. Contribution Overview

Zerui was the **primary architect and engineer** of the entire **Teacher Interface** subsystem of Operation Einstein. This is a full-stack, production-quality application housed within the `teacher/` subdirectory. Starting from a blank slate, Zerui designed, built, tested, documented, and ultimately migrated the stack from a traditional MERN backend to a fully serverless Supabase-powered architecture.

### High-Level Impact Summary

| Area | Contribution |
| :--- | :--- |
| **Backend (Express/MongoDB)** | Designed and built the entire REST API server from scratch |
| **Mongoose Models** | `Question`, `Class`, `Quiz`, `Response` — all 4 data models |
| **REST Endpoints** | 10+ routes across 4 resource controllers |
| **OCR Service** | Integrated Tesseract.js for handwriting-to-text extraction |
| **Simulation Engine** | Built a data generation engine to simulate class quiz-taking at scale |
| **Frontend (Next.js)** | Built the complete Teacher Portal UI across 5 routes and 5 components |
| **Database Migration** | Migrated the entire data layer from MongoDB to Supabase (PostgreSQL) |
| **Smart Grading Scanner** | Built an image crop → OCR → grade-save workflow |
| **Testing** | Wrote 9+ test files covering models, routes, services, and components |
| **Documentation** | Authored the full technical README with architecture diagrams |

---

## 3. Tech Stack Introduced by Zerui

Zerui was responsible for introducing and integrating every technology in the teacher-facing side of the application.

### Backend (Phase 1)
| Technology | Version | Role |
| :--- | :--- | :--- |
| **Node.js** | v18+ | Runtime environment |
| **Express.js** | `^5.2.1` | HTTP server and routing framework |
| **Mongoose** | `^9.0.1` | MongoDB ODM (data modeling and validation) |
| **MongoDB** | Local / Docker | Primary database (Phase 1) |
| **Tesseract.js** | `^6.0.1` | OCR engine (handwriting/text extraction from images) |
| **multer** | `^2.0.2` | Multipart file upload middleware |
| **cors** | `^2.8.5` | Cross-Origin Resource Sharing middleware |

### Backend Testing
| Technology | Role |
| :--- | :--- |
| **Jest** | Test runner |
| **Supertest** | HTTP integration testing |
| **mongodb-memory-server** | In-memory MongoDB for isolated test environments |

### Frontend
| Technology | Version | Role |
| :--- | :--- |  :--- |
| **Next.js** | `16.0.10` (App Router) | React framework with SSR/CSR |
| **React** | `19.2.1` | UI component library |
| **TypeScript** | `^5` | Static typing |
| **Tailwind CSS** | `^4` | Utility-first CSS framework |
| **react-image-crop** | — | Client-side interactive image cropping |

### Database (Phase 2 — Migration)
| Technology | Role |
| :--- | :--- |
| **Supabase** | BaaS — PostgreSQL database + authentication + real-time |
| **`@supabase/supabase-js`** | Official JS client for querying Supabase |

### Frontend Testing
| Technology | Role |
| :--- | :--- |
| **Jest** | Test runner with `jsdom` environment |
| **React Testing Library** | Component rendering and accessibility assertions |
| **`@testing-library/jest-dom`** | Custom DOM matchers |

---

## 4. Commit-by-Commit Breakdown

### 4.1 Repository Hygiene — `.gitignore` Files

#### Commit: `64d0671` — `gitignore` — *Dec 11, 2025*
The very first commit in the repository by Zerui. Extended the root `.gitignore` to exclude files generated by AI development tools:
- `.gemini/` — Gemini AI workspace files
- `gha-creds-*.json` — GitHub Actions credential files
- `GEMINI.md` — Gemini context/instruction files
- `PROGRESS.md` — AI progress tracking files

This immediately showed attention to security and repository hygiene by preventing credential files from ever being accidentally committed.

#### Commit: `bec3132` — `Add .gitignore file to exclude build artifacts` — *Dec 14, 2025*
Created a dedicated `.gitignore` for the `teacher/frontend` Next.js project (`teacher/frontend/.gitignore`) covering:
- `node_modules/`, `.pnp.*`, `.yarn/`
- `/coverage`, `/.next/`, `/out/`, `/build`
- `.DS_Store`, `*.pem`
- `.env*` (all environment variable files — prevents secrets from leaking)
- `.vercel`, `*.tsbuildinfo`, `next-env.d.ts`

#### Commit: `338c49a` — `Update .gitignore to ignore all node_modules recursively` — *Dec 14, 2025*
A precision fix to the root `.gitignore`:
- Changed `/node_modules` (only root level) to `**/node_modules` (recursively all subdirectories).
- This was essential for the monorepo structure where both `teacher/` and `teacher/frontend/` each have their own `node_modules`.

---

### 4.2 Backend Foundation — Express + MongoDB

#### Commit: `36be8c8` — `Add initial backend structure` — *Dec 14, 2025*

This single commit stood up the **entire backend server from scratch** — 8 files, 5,479 lines (including `package-lock.json`).

**Files created:**

**`teacher/backend/app.js`** — Express application factory:
```js
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/questions', require('./routes/questions'));
module.exports = app;
```

**`teacher/backend/server.js`** — Entry point:
- Connects to MongoDB via Mongoose (default: `mongodb://localhost:27017/operation_einstein`)
- Starts HTTP server on `PORT` (default `5000`)
- Environment variable support (`MONGO_URI`, `PORT`)

**`teacher/backend/models/Question.js`** — First data model with full validation:
```
text        String   required
type        Enum     ['text', 'multiple-choice', 'scale']  required
options     [String] default [] — custom validator: at least 1 option if type=multiple-choice
category    String   optional
timestamps  auto     createdAt, updatedAt
```

**`teacher/backend/routes/questions.js`** — REST resource:
- `GET /api/questions` — returns all questions sorted by newest first
- `POST /api/questions` — creates a new question, returns `201` with the saved document

**`teacher/backend/tests/models/question.test.js`** — 4 test cases using MongoMemoryServer:
1. Creates and saves a valid multiple-choice question
2. Fails to save without required `text` field → `ValidationError`
3. Fails on invalid `type` enum value → `ValidationError`
4. Fails if `type=multiple-choice` but `options` array is empty → `ValidationError`

**`teacher/backend/tests/routes/questions.api.test.js`** — 2 integration tests (Supertest):
1. `POST /api/questions` → should create a new question and return `201`
2. `GET /api/questions` → should fetch all questions and return an array

**`teacher/package.json`** — Dependencies defined:
```json
{
  "express": "^5.2.1",
  "mongoose": "^9.0.1",
  "cors": "^2.8.5",
  "jest": "^29.7.0",
  "supertest": "^7.1.0",
  "mongodb-memory-server": "^10.1.4"
}
```

---

### 4.3 Teacher Interface (Next.js) + OCR Service

#### Commit: `fa21238` — `add new teacher interface with Next.js...` — *Dec 14, 2025*

A major 30-file commit (11,297 lines) that bootstrapped the entire frontend and added the OCR service to the backend.

**Backend additions:**

**`teacher/backend/services/ocrService.js`** — Tesseract.js OCR wrapper:
```js
async function scanImage(imagePath) {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();
  return text;
}
```
- Manages the full Tesseract worker lifecycle: initialize → recognize → terminate
- Accepts a file path or URL to an image
- Returns a plain text string

**`teacher/backend/tests/services/ocr.test.js`** — Mocked Tesseract test:
- Mocks `tesseract.js` module completely to avoid real OCR in CI
- Tests happy path (returns extracted text)
- Tests error handling (graceful `Error` throw)

**`teacher/connectivity-test.js`** — Local connectivity diagnostic script (HTTP GET to `/api/questions`)

**Backend middleware addition** to `app.js`:
```js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**Frontend — Next.js application bootstrapped:**

**`teacher/frontend/package.json`** — Dependencies:
- `next: 16.0.10`, `react: 19.2.1`, `react-dom: 19.2.1`
- Dev: Tailwind CSS v4, TypeScript 5, Jest 29, React Testing Library 16, `jest-environment-jsdom`

**`teacher/frontend/src/app/layout.tsx`** — Root layout with Geist Sans/Mono fonts (Google Fonts via `next/font`).

**`teacher/frontend/src/app/page.tsx`** — Initial homepage with two-panel layout: Create Question form + Question list with refresh button.

**`teacher/frontend/src/components/QuestionForm.tsx`** (100 lines):
- Controlled form with `useState` for `text`, `type`, `options`, `loading`
- Question types: Text / Multiple Choice / Scale
- For Multiple Choice: dynamically rendered options input (comma-separated)
- `POST` to `http://127.0.0.1:5001/api/questions` with proper error handling
- Loading state disables submit button

**`teacher/frontend/src/components/QuestionList.tsx`** (65 lines):
- Fetches questions from API on mount with `useEffect`
- Displays question text, type badge, ID, and options list for multiple-choice
- Handles loading, error, and empty states

**`teacher/frontend/__tests__/QuestionForm.test.tsx`** — RTL test: renders the form and verifies the submit button is present.

---

### 4.4 Image Upload Route + Class & Quiz Models

#### Commit: `a914438` — `Add upload route for image processing and create Class and Quiz models` — *Dec 16, 2025*

**`teacher/backend/models/Class.js`**:
```
name    String  required
grade   Number  optional
```
(Placeholder comment indicating future student references)

**`teacher/backend/models/Quiz.js`**:
```
title       String    required
description String    optional
classId     ObjectId  ref: 'Class'
questions   [ObjectId] ref: 'Question'
timestamps  auto
```

**`teacher/backend/routes/upload.js`** — Image upload + OCR pipeline:
- `multer` middleware configured to store uploads at `./uploads/`
- `POST /api/upload` receives a file via `multipart/form-data` (field name: `image`)
- Passes file path to `ocrService.scanImage()`
- After OCR, **deletes the temp file** from disk (cleanup)
- Returns `{ text: "..." }` JSON

**`teacher/frontend/src/components/QuestionForm.tsx`** (updated) — Added OCR auto-fill:
- New file input for "Auto-fill from Image (OCR)"
- `handleImageUpload()` POSTs to `http://127.0.0.1:5001/api/upload`
- On success, auto-populates the question text field with extracted text
- Loading state indicator while scanning

---

### 4.5 Data Models Expansion — Response Schema

#### Commit: `f536971` — `feat(backend): setup express server and mongoose data models` — *Dec 17, 2025*

**`teacher/backend/models/Class.js`** — Extended with embedded student roster:
```
students: [{ name: String, studentId: String }]
```

**`teacher/backend/models/Question.js`** — Added `quizId` reference (FK to `Quiz`):
```
quizId  ObjectId  ref: 'Quiz'
```

**`teacher/backend/models/Response.js`** — New model for student quiz answers:
```
quizId      ObjectId  ref: 'Quiz'     required
questionId  ObjectId  ref: 'Question' required
studentId   String                    required  (anonymous/pseudonymous ID)
answer      String                    required  (the actual response text)
score       Number                    optional  (for auto-graded questions)
timestamps  auto
```

**`teacher/backend/app.js`** — Registered three new route modules:
```js
app.use('/api/classes',   require('./routes/classes'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/quizzes',   require('./routes/quizzes'));
```

**`teacher/package.json`** — Added `multer` as production dependency.

---

### 4.6 Full REST API Implementation + Comprehensive Test Suite

#### Commit: `4c329b4` — `feat(backend): implement REST API endpoints, OCR service, and tests` — *Dec 17, 2025*

The most expansive backend commit, delivering all controllers and 9 test files.

#### Controllers

**`teacher/backend/routes/classes.js`** (83 lines):

| Endpoint | Description |
| :--- | :--- |
| `GET /api/classes` | List all classes, sorted newest first |
| `GET /api/classes/:id` | Get a single class by MongoDB ObjectId |
| `POST /api/classes` | Create a new class (`name`, `grade`) |
| `POST /api/classes/:id/students` | Add one student to a class roster |
| `POST /api/classes/:id/simulate-students` | Bulk-generate N mock students with auto-incremented names and timestamped IDs (`S-{timestamp}-{i}`) |

**`teacher/backend/routes/quizzes.js`** (83 lines):

| Endpoint | Description |
| :--- | :--- |
| `GET /api/quizzes?classId=...` | List all quizzes (optionally filtered by classId) |
| `POST /api/quizzes` | Create a quiz linked to a class |
| `POST /api/quizzes/:id/simulate` | **Simulation Engine** — see [5.2](#52-quiz-simulation-engine) |

**`teacher/backend/routes/responses.js`** (24 lines):

| Endpoint | Description |
| :--- | :--- |
| `GET /api/responses?quizId=...&studentId=...` | Filtered responses with populated `questionId.text` and `quizId.title` |

#### Test Suite (9 files)

| Test File | What It Tests |
| :--- | :--- |
| `tests/models/class_quiz.test.js` | Class model (create, missing name), Quiz model (create with FK, missing title) |
| `tests/models/response.test.js` | Response model — valid create + 4 required-field validation tests |
| `tests/routes/classes.api.test.js` | `POST /api/classes` (201), `GET /api/classes` |
| `tests/routes/classes_students.api.test.js` | `POST /:id/students` (adds 1 student), `POST /:id/simulate-students` (generates N) |
| `tests/routes/quizzes.api.test.js` | `POST /api/quizzes` (201 with classId FK), `GET ?classId=` filter |
| `tests/routes/quizzes_simulate.api.test.js` | Simulation: 2 students × 2 questions → 4 responses in DB |
| `tests/routes/responses.api.test.js` | `GET /api/responses?quizId=` returns all matching responses |
| `tests/routes/upload.api.test.js` | Mocked OCR: `POST /api/upload` returns mocked text |
| `tests/services/ocr.test.js` | `scanImage()` happy path + error graceful handling (Tesseract mocked) |

All backend tests use `MongoMemoryServer` — they **never touch a real database**, ensuring complete isolation.

---

### 4.7 Frontend — Next.js Class Dashboard

#### Commit: `a37fc05` — `feat(frontend): initialize next.js and class dashboard` — *Dec 17, 2025*

**`teacher/frontend/src/app/page.tsx`** — Replaced the simple question form homepage with a full Teacher Portal:
- Navbar with logo, "Operation Einstein" branding, "Teacher Portal" subtitle
- "Welcome, Teacher" avatar/greeting
- Renders `<ClassManager />` in the main content area

**`teacher/frontend/src/components/ClassManager.tsx`** (127 lines):
- Fetches all classes from `GET /api/classes` on mount
- Create class form with `Class Name` text input + `Grade Level` number input
- `POST /api/classes` on submit, re-fetches list on success
- Responsive class grid: 1 col → 2 col (md) → 3 col (lg)
- Each class card shows:
  - Book icon (SVG)
  - Grade badge
  - Class name (with hover indigo color)
  - "Manage students & quizzes" subtitle
  - Navigation via `next/link` to `/classes/[classId]`
- Empty state: dashed border with call-to-action text

---

### 4.8 Frontend — Quiz Builder, Response Viewer & Simulation UI

#### Commit: `c1a1e7a` — `feat(frontend): implement quiz builder, response viewer, and simulation UI` — *Dec 17, 2025*

Five files, 421 additions — completes the full teacher workflow.

**`teacher/frontend/src/app/classes/[classId]/page.tsx`** (221 lines):

Dynamic route page for individual class management. Features:
- Breadcrumb "Back to Dashboard" link
- Class name + grade header
- **Tabbed navigation** (CSS border-bottom active indicator):
  - **Quizzes & Assessments tab**: Quiz list with creation dates, inline "Create Quiz" form (title input → `POST /api/quizzes`), empty state
  - **Students tab**: Full class roster in a table (Name | ID), "+ Generate 20 Mock Students" button → `POST /api/classes/:id/simulate-students`
- All data fetched on mount; state shared between tabs

**`teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx`** (93 lines):

Nested dynamic route — the "Quiz Workstation":
- Breadcrumb: Class → Quiz Detail
- **"⚡ Simulate Responses"** button — calls `POST /api/quizzes/:id/simulate`, shows response count in alert, triggers re-render
- **Two-column layout** (lg screens):
  - Left: `<QuestionForm quizId={quizId} onQuestionCreated={...} />`
  - Right: `<QuestionList quizId={quizId} refreshTrigger={...} />`
- **Full-width bottom**: `<ResponseViewer quizId={quizId} refreshTrigger={...} />`
- `refreshKey` integer state — incremented after simulation/question creation to trigger child re-fetches without page reload

**`teacher/frontend/src/components/ResponseViewer.tsx`** (88 lines):

Data visualization component for student quiz results:
- Fetches `GET /api/responses?quizId={quizId}`
- Displays a pageable table: Student ID | Quiz Title | Question Text | Answer | Timestamp
- Loading state, empty state ("No student responses recorded yet.")
- Manual "Refresh" button
- Powered by MongoDB's `.populate()` — shows human-readable question text and quiz titles

**`teacher/frontend/src/components/QuestionForm.tsx`** (updated):
- Now accepts `quizId` and `onQuestionCreated` props
- Sends `quizId` with every question creation request
- Calls `onQuestionCreated()` callback to notify parent on success

**`teacher/frontend/src/components/QuestionList.tsx`** (updated):
- Now accepts `quizId` and `refreshTrigger` props
- Filters API request by `quizId`
- Re-fetches whenever `refreshTrigger` changes

---

### 4.9 Documentation — Architecture & Developer Guide

#### Commit: `974e0cd` — `docs: update project documentation and master plan` — *Dec 17, 2025*

Added 190-line `README.md` to the root: project overview, architecture, getting started guide.

#### Commit: `7b01b87` — `docs: consolidate and enhance README documentation` — *Dec 17, 2025*

Moved and substantially expanded the documentation into `teacher/README.md` (217 lines). This is a full engineering reference covering:

1. **Executive Summary** — Describes Operation Einstein as a scalable LMS for resource-constrained environments, built on MERN stack as a Modular Monolith.

2. **System Architecture** — Full Mermaid diagram showing:
   - Client layer (Next.js App Router, SSR/CSR, Fetch API)
   - Server layer (Express Gateway, CORS middleware, Router, Class/Quiz/OCR controllers)
   - Tesseract.js WASM engine
   - Persistence layer (Mongoose ODM → MongoDB Docker container)

3. **Key Architectural Decisions**:
   - Split-repo monorepo pattern (independent package managers)
   - Stateless REST API design for horizontal scalability
   - Server Components by default; Client Components only for interactive islands

4. **Directory Structure & Codebase Map** — Documents every file's purpose for both `teacher/backend` and `teacher/frontend`.

5. **Data Dictionary** — Full schema tables for all 4 entities: Class, Quiz, Question, Response (fields, types, required flags, descriptions).

6. **API Reference** — Documented OCR upload flow (5 steps) and Simulation Engine flow (5 steps).

7. **Operational Guide** — Docker MongoDB setup, installation commands, startup sequences, and test protocol descriptions (TDD, MongoMemoryServer, jest-environment-jsdom).

---

### 4.10 Supabase Integration + Client-Side Smart Grading Scanner

#### Commit: `7024b5e` — `feat: Integrate Supabase for question and workshop management, and add OCR scanning functionality with Tesseract.js` — *Jan 28, 2026*

The largest single commit by Zerui (11 files, 889 insertions, 261 deletions). This commit migrated the entire data layer from the Express/MongoDB REST API to **Supabase (PostgreSQL)** and introduced the flagship "Smart Grading Scanner" feature.

#### New: Supabase Client (`teacher/frontend/src/lib/supabase.ts`)
```ts
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
Environment variable validation with `console.error` on missing keys.

#### New: Next.js API Route — `/api/scan` (`teacher/frontend/src/app/api/scan/route.ts`)
A **server-side OCR endpoint** built directly into the Next.js application (no Express dependency):
- Accepts `POST multipart/form-data` with `image` field
- Converts `File` → `ArrayBuffer` → `Buffer`
- Runs `Tesseract.js` worker: `createWorker('eng')` → `recognize(buffer)` → `terminate()`
- Returns `{ text: "..." }` or `{ error: "..." }` with appropriate status codes

#### New: Smart Grading Scanner Page (`teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx`) — 220 lines

The flagship feature. See [Section 5.3](#53-smart-grading-scanner-crop--scan--save) for the full workflow. Key implementation details:
- **`react-image-crop`**: Interactive selection box rendered over uploaded image
- **HTML5 Canvas**: Crops the exact pixel region: `ctx.drawImage(image, x*scaleX, y*scaleY, w*scaleX, h*scaleY, 0, 0, canvas.w, canvas.h)`
- Handles `naturalWidth/naturalHeight` vs rendered `width/height` scaling correctly
- **Client-side Tesseract.js**: `createWorker('eng')` → `recognize(dataUrl)` → `terminate()`
- Fetches questions from `supabase.from('questions').select('*').eq('assignment_id', quizId)`
- Saves to `supabase.from('responses').insert([{ question_id, student_id, answer_text }])`

#### Migrated: `ClassManager.tsx` → Supabase
- `fetchClasses()` now uses `supabase.from('workshops').select('*').order('created_at')`
- Create uses `supabase.from('workshops').insert([{ title, code, color: 'blue' }])`
- Schema field changes: `name` → `title`, `grade` → `code`

#### Migrated: `QuestionForm.tsx` → Supabase
Now performs a **two-table relational insert**:
1. `supabase.from('questions').insert([{ assignment_id, question_text, type, question_order }]).select().single()`
2. `supabase.from('questionoptions').insert(opts)` where `opts` maps comma-separated options to `{ question_id, option_text, option_order }`

#### Migrated: `QuestionList.tsx` → Supabase
Two-query join strategy:
1. `supabase.from('questions').select('*').eq('assignment_id', quizId).order('question_order')`
2. `supabase.from('questionoptions').select('*').in('question_id', questionIds).order('option_order')`
3. Client-side merge: maps options onto their parent question by `question_id`

#### Migrated: `ResponseViewer.tsx` → Supabase
Complex **nested join query**:
```ts
supabase.from('responses').select(`
  *,
  questions (
    question_text,
    assignments ( title )
  )
`)
```
- Conditionally fetches `question_id`s for the current quiz to pre-filter responses
- Maps nested result to flat display structure for the table

#### Migrated: `classes/[classId]/page.tsx` → Supabase
- `workshops` table for class data
- `enrollments` table joined with `students` for roster
- `assignments` table for quizzes
- Add-quiz → `supabase.from('assignments').insert([{ workshop_id, title }])`
- Enrol student → `supabase.from('enrollments').insert([{ workshop_id, student_id }])`

#### Migrated: `classes/[classId]/quizzes/[quizId]/page.tsx` → Supabase
- Fetches quiz via `supabase.from('assignments').select('*').eq('assignment_id', quizId).single()`

---

### 4.11 Final Refactor — Express/MongoDB → Serverless Next.js/Supabase

#### Commit: `603f793` — `refactor(teacher): migrate from express/mongodb to Next.js/Supabase` — *Mar 2, 2026*

The concluding architectural migration commit.

**`teacher/README.md`** completely rewritten (132 lines) to reflect the new serverless stack:

| Section | Content |
| :--- | :--- |
| Executive Summary | LMS on Next.js 14 + Supabase (PostgreSQL), serverless architecture |
| Technical Stack | Next.js 14, Tailwind CSS, Supabase, `react-image-crop`, Tesseract.js (WASM), TypeScript |
| System Architecture | New Mermaid diagram: Teacher Browser → Next.js → Supabase PostgreSQL |
| Data Schema | Full table reference: `workshops`, `profiles`, `enrollments`, `assignments`, `questions`, `responses` |
| Feature Details | OCR Workflow (4 steps), Class Management (3 operations) |
| Developer Guide | `.env.local` setup, npm install, Supabase SQL to create `responses` table |

**`ClassManager.tsx`** fix:
- Removed manual `workshop_id: newId` (was generating `ws-${Date.now()}` string IDs)
- Now lets Supabase auto-generate a proper `gen_random_uuid()` UUID
- This fixed a schema mismatch where the table likely expected a UUID primary key

**`classes/[classId]/page.tsx`** — Enrollment logic hardened:
- Changed `students` table join to `profiles` table (correct table name in Supabase schema)
- Simplified enrolment flow: removed auto-create student path
- Enrollment now requires teacher to provide the student's existing `profiles.id` (UUID)
- If UUID not found in `profiles` → clear error message guides teacher

**`scan/page.tsx`** — UI polish:
- Added `placeholder:text-gray-500 text-gray-900` to all inputs for contrast/readability in light mode

**`ClassManager.tsx`** — Additional input contrast fixes.

**`QuestionForm.tsx`** — Input field contrast fixes.

---

## 5. Feature Deep-Dives

### 5.1 OCR Grading Pipeline

The OCR pipeline was designed in two phases:

**Phase 1 — Server-Side (Express Backend):**
```
Teacher uploads image
    → HTTP POST multipart/form-data to /api/upload
    → multer saves file to ./uploads/ directory
    → ocrService.scanImage(filePath) called
    → Tesseract.js createWorker('eng') initializes WASM engine
    → worker.recognize(filePath) returns { data: { text } }
    → worker.terminate() releases resources
    → fs.unlink(filePath) cleans up temp file
    → JSON response { text: "..." } returned to frontend
    → QuestionForm auto-fills question text field
```

**Phase 2 — Client-Side (Next.js / Supabase):**
```
Teacher uploads image to browser
    → react-image-crop renders interactive selection UI
    → Teacher draws crop box over student's answer
    → "Read Selection" button clicked:
        → Canvas.drawImage() extracts pixel data of selected region
        → Accounts for naturalWidth/naturalHeight scale factor
        → dataUrl (PNG) passed to Tesseract.js running in WebWorker (WASM)
        → Tesseract.worker.recognize(dataUrl) returns text
    → Extracted text displayed in editable textarea
    → Teacher can manually correct text if needed
    → "Save Grade" saves { question_id, student_id, answer_text } to Supabase
```

---

### 5.2 Quiz Simulation Engine

Built in `POST /api/quizzes/:id/simulate` to enable offline development and testing without real students.

**Algorithm:**
```
1. Fetch Quiz by ID
2. Fetch the linked Class (via quiz.classId)
3. Fetch all Questions where quizId === quiz._id
4. Validate: class exists, questions exist
5. DELETE all existing Response documents for this quiz (idempotent re-runs)
6. For each student in class.students:
   For each question in questions:
     Generate a random valid answer:
       multiple-choice → randomly select one of question.options[]
       scale          → random integer 1–5 (as string)
       text           → random from ['Good','Average','Needs Improvement','Excellent','N/A']
     Push { quizId, questionId, studentId, answer } to buffer
7. Response.insertMany(buffer) — single bulk database write
8. Return { message: "Simulation complete", count: N }
```

This engine allowed the team to generate realistic datasets (e.g., 20 students × 10 questions = 200 responses) instantly for UI development and demonstrations.

---

### 5.3 Smart Grading Scanner (Crop + Scan + Save)

The Smart Grading Scanner at `classes/[classId]/quizzes/[quizId]/scan` is the most complex single-page feature in the codebase. It combines three browser technologies:

**Step 1 — Image Upload**
Teacher uploads a photo of a student's physical worksheet via `<input type="file" accept="image/*">`. The image is read via `FileReader` into a base64 data URL and rendered in the browser.

**Step 2 — Precision Crop**
`react-image-crop` renders an interactive overlay on the image. The teacher draws a selection box around just the answer area (eliminating noise from the rest of the worksheet). The `onComplete` callback captures the final `PixelCrop` coordinates.

**Step 3 — Canvas Extraction**
When "Read Selection" is pressed:
```ts
const scaleX = image.naturalWidth / image.width;   // handle CSS scaling
const scaleY = image.naturalHeight / image.height;

canvas.width  = crop.width  * scaleX;
canvas.height = crop.height * scaleY;

ctx.drawImage(image,
  crop.x * scaleX, crop.y * scaleY,         // source offset
  crop.width * scaleX, crop.height * scaleY, // source size
  0, 0,                                       // dest offset
  canvas.width, canvas.height                // dest size
);
```
This produces a pixel-perfect crop that matches the teacher's selection, regardless of how the image is displayed on screen.

**Step 4 — Client-Side OCR**
`canvas.toDataURL('image/png')` is passed directly to Tesseract.js:
```ts
const worker = await createWorker('eng');
const { data: { text } } = await worker.recognize(dataUrl);
await worker.terminate();
```
The WASM OCR engine runs entirely in the browser — no file upload, no server round-trip.

**Step 5 — Verify & Save**
- Extracted text appears in an editable `<textarea>` (yellow background for visibility)
- Teacher can correct any OCR errors
- Clicking "Save Grade" calls:
  ```ts
  supabase.from('responses').insert([{
    question_id: selectedQuestion,
    student_id:  studentId,
    answer_text: extractedText
  }])
  ```

---

### 5.4 Supabase Relational Schema Design

Zerui designed the PostgreSQL schema that powers the Supabase backend. The final schema (documented in `teacher/README.md`) uses normalized tables with UUID primary keys:

```
workshops          workshop_id (uuid PK)  title, code, color
    │
    ├── enrollments    id (uuid PK)  workshop_id (FK), student_id (FK → profiles.id)
    │       │
    │   profiles       id (uuid PK, FK → auth.users)  name, role
    │
    └── assignments    assignment_id (uuid PK)  workshop_id (FK), title
            │
            └── questions  question_id (uuid PK)  assignment_id (FK), question_text, type, question_order
                    │
                    ├── questionoptions  option_id (uuid PK)  question_id (FK), option_text, option_order
                    │
                    └── responses  response_id (uuid PK)  question_id (FK), student_id (text), answer_text, created_at
```

Key design decisions:
- **UUIDs everywhere** — `gen_random_uuid()` as defaults (no auto-increment integers)
- **Supabase Auth integration** — `profiles.id` is a FK to Supabase's built-in `auth.users` table
- **Separate options table** — `questionoptions` is normalized rather than storing options as an array column, allowing per-option ordering and metadata
- **Soft student identity** — `responses.student_id` is a plain `text` column (not FK) to allow responses even before a student has a Supabase auth account

---

## 6. Testing Philosophy

Zerui established and enforced a **Test-Driven Development (TDD)** philosophy throughout the teacher interface. Tests were written alongside (and in some cases before) the feature code.

### Backend Tests
- **9 test files** covering model validation, route integration, simulation logic, and the OCR service
- Uses `MongoMemoryServer` for complete isolation — zero coupling to a running database
- Tests cover both happy paths and multiple failure/validation scenarios per model
- Supertest provides real HTTP request/response testing without needing to start a live server

### Frontend Tests
- React Testing Library + Jest + `jsdom` for component rendering
- Tests assert on accessibility roles and visible content (not implementation details)

### Test File Inventory
```
teacher/backend/tests/
├── models/
│   ├── question.test.js          (4 tests: valid create, missing text, invalid type, empty MC options)
│   ├── class_quiz.test.js        (4 tests: class create, class missing name, quiz create, quiz missing title)
│   └── response.test.js          (5 tests: valid create, missing quizId/questionId/studentId/answer)
└── routes/
    ├── questions.api.test.js     (2 tests: POST 201, GET all)
    ├── classes.api.test.js       (2 tests: POST 201, GET all)
    ├── classes_students.api.test.js  (2 tests: add student, simulate N students)
    ├── quizzes.api.test.js       (2 tests: POST 201 with classId, GET filter by classId)
    ├── quizzes_simulate.api.test.js  (1 test: 2 students × 2 questions = 4 responses)
    ├── responses.api.test.js     (1 test: GET filtered by quizId)
    └── upload.api.test.js        (1 test: file upload returns mocked OCR text)

teacher/frontend/__tests__/
└── QuestionForm.test.tsx         (1 test: form renders with submit button)
```

---

## 7. Architecture Evolution

Zerui drove the entire technical evolution of the teacher interface from inception to a production-ready serverless application.

```
Phase 1 — Foundation (Dec 11–14, 2025)
    ├── Repository scaffolding (.gitignore files)
    ├── Express + MongoDB backend
    ├── Question model + REST API
    └── Next.js frontend with QuestionForm/QuestionList

Phase 2 — Feature Completion (Dec 14–17, 2025)
    ├── OCR service (Tesseract.js, server-side)
    ├── Image upload endpoint (multer)
    ├── Class + Quiz + Response models
    ├── Full REST API (classes, quizzes, responses, upload)
    ├── Simulation Engine
    ├── Full Teacher Portal UI (Dashboard → Class → Quiz → Responses)
    └── Comprehensive test suite (9 test files, TDD)

Phase 3 — Documentation (Dec 17, 2025)
    └── Full technical README (architecture diagrams, data dictionary, API reference)

Phase 4 — Database Migration (Jan 28, 2026)
    ├── Supabase (PostgreSQL) integration
    ├── All components migrated from REST API calls to Supabase JS client
    ├── Smart Grading Scanner (react-image-crop + client-side Tesseract)
    ├── Next.js API route for server-side OCR
    └── Relational schema: workshops, profiles, enrollments, assignments, questions, questionoptions, responses

Phase 5 — Refinement (Mar 2, 2026)
    ├── Fixed UUID generation (removed manual `ws-${Date.now()}` IDs)
    ├── Fixed enrollment to use `profiles` (Supabase auth-linked) table
    ├── Removed student auto-creation (students must exist in auth system first)
    ├── Input contrast/accessibility fixes (text-gray-900, placeholder:text-gray-500)
    └── Updated README for serverless architecture
```

### Migration Rationale
The migration from Express/MongoDB to Next.js/Supabase was architecturally motivated:
- **No dedicated server needed** — Next.js API routes replace Express
- **Managed PostgreSQL** — Supabase replaces self-hosted MongoDB
- **Built-in auth** — Supabase `auth.users` links to `profiles` for real student accounts
- **Real-time capable** — Supabase Realtime subscriptions available for future live features
- **Deployment simplified** — A single `npm run dev` / `vercel deploy` is sufficient

