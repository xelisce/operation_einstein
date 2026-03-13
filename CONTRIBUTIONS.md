# Contributions by xelisce (Zerui / limzerui)

This document provides a comprehensive breakdown of every contribution made by **xelisce** (GitHub: `xelisce`, email: `xelisce@gmail.com`) and **limzerui** (GitHub: `limzerui`, email: `lim.zerui@gmail.com`) across all branches of this repository — including the `main` branch and the `zr` feature branch (PR #4).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Contribution Summary](#2-contribution-summary)
3. [zr Branch Contributions (limzerui)](#3-zr-branch-contributions-limzerui)
   - [3.1 Repository Scaffolding](#31-repository-scaffolding)
   - [3.2 Express/MongoDB Backend — Initial Setup](#32-expressmongodb-backend--initial-setup)
   - [3.3 Express/MongoDB Backend — Teacher Interface & OCR Service](#33-expressmongodb-backend--teacher-interface--ocr-service)
   - [3.4 Express/MongoDB Backend — Class/Quiz Models & Upload Route](#34-expressmongodb-backend--classquiz-models--upload-route)
   - [3.5 Express/MongoDB Backend — Data Models & Response Schema](#35-expressmongodb-backend--data-models--response-schema)
   - [3.6 Express/MongoDB Backend — Full REST API & Test Suite](#36-expressmongodb-backend--full-rest-api--test-suite)
   - [3.7 Frontend — Next.js Initialization & Class Dashboard](#37-frontend--nextjs-initialization--class-dashboard)
   - [3.8 Frontend — Quiz Builder, Response Viewer & Simulation UI](#38-frontend--quiz-builder-response-viewer--simulation-ui)
   - [3.9 Documentation — Master Plan & README](#39-documentation--master-plan--readme)
   - [3.10 Supabase Integration & Client-Side OCR](#310-supabase-integration--client-side-ocr)
   - [3.11 Migration: Express/MongoDB → Next.js/Supabase (Refactor)](#311-migration-expressmongodb--nextjssupabase-refactor)
4. [Main Branch Contributions (xelisce)](#4-main-branch-contributions-xelisce)
   - [4.1 Repository Initialization](#41-repository-initialization)
   - [4.2 Quiz Completion Analytics Page](#42-quiz-completion-analytics-page)
   - [4.3 Separate Quiz Start/Completion Rates & Average Answer](#43-separate-quiz-startcompletion-rates--average-answer)
   - [4.4 Edit Correct Answer & Points, Delete Question, Score Distribution Graph](#44-edit-correct-answer--points-delete-question-score-distribution-graph)
   - [4.5 Edit Class Name & Delete Class](#45-edit-class-name--delete-class)
   - [4.6 Cascade Delete Class](#46-cascade-delete-class)
   - [4.7 Response Viewer Filtering & Sorting](#47-response-viewer-filtering--sorting)
5. [Files Changed Summary](#5-files-changed-summary)

---

## 1. Project Overview

**Operation Einstein** is a Learning Management System (LMS) for resource-constrained school environments. The **Teacher Interface** (`teacher/`) allows educators to:

- Manage workshops (classes) and assignments (quizzes).
- Build questions with correct-answer configuration and point values.
- Digitise handwritten student papers using client-side OCR (Tesseract.js).
- Track per-quiz analytics including start rates, completion rates, score distributions, and average answers.
- View, filter, sort, and deduplicate student response data.

The repository is a group project; this document isolates the contributions attributable to **xelisce/limzerui** only.

---

## 2. Contribution Summary

| Author | Commits | Phase |
|--------|---------|-------|
| `limzerui` (lim.zerui@gmail.com) | 14 | `zr` branch + early `main` |
| `xelisce` (xelisce@gmail.com) | 9 | `main` branch |

**Combined chronological range:** Sep 2025 – Mar 2026

---

## 3. zr Branch Contributions (limzerui)

The `zr` branch was a dedicated feature branch (named after Zerui) that delivered the entire teacher-side infrastructure before being merged into `main` via [PR #4](https://github.com/xelisce/operation_einstein/pull/4).

---

### 3.1 Repository Scaffolding

**Commit:** `64d0671` · `bec3132` — *Dec 11–14, 2025*

- Created root `.gitignore` covering `node_modules/`, `dist/`, `build/`, `.env*`, log files, OS artefacts, and editor config.
- Updated `.gitignore` to recursively ignore `node_modules` across all nested directories (teacher/backend, teacher/frontend, etc.).

---

### 3.2 Express/MongoDB Backend — Initial Setup

**Commit:** `36be8c8` — *Dec 14, 2025*

**Files introduced:**
- `teacher/backend/app.js` — Express app skeleton; CORS, JSON body parser, mounts `/api/questions` route.
- `teacher/backend/server.js` — HTTP server entry-point binding to a configurable port.
- `teacher/backend/models/Question.js` — Mongoose `Question` schema with fields: `text`, `type` (`text | multiple-choice | scale`), `options` (validated for MCQ), `category`. Timestamps enabled.
- `teacher/backend/routes/questions.js` — CRUD REST handlers: `GET /api/questions`, `POST /api/questions`.
- `teacher/package.json` / `package-lock.json` — Root workspace package file with Express, Mongoose, Cors dependencies.
- `teacher/backend/tests/models/question.test.js` — Jest unit tests for `Question` model validation (required fields, MCQ option enforcement).
- `teacher/backend/tests/routes/questions.api.test.js` — Supertest integration tests for the questions API against an in-memory MongoDB instance (`mongodb-memory-server`).

**Key design decisions:**
- In-memory MongoDB for all tests ensures full isolation with zero external dependencies.
- Validation logic is embedded in the Mongoose schema validator, not the route handler.

---

### 3.3 Express/MongoDB Backend — Teacher Interface & OCR Service

**Commit:** `fa21238` — *Dec 14, 2025*

This was a major commit establishing the full teacher-side application baseline.

**Backend additions:**
- `teacher/backend/services/ocrService.js` — Node.js OCR service using `tesseract.js` to extract text from uploaded images.
- `teacher/backend/tests/services/ocr.test.js` — Unit tests for the OCR service.
- `teacher/connectivity-test.js` — Utility script to verify MongoDB connectivity.
- Updated `teacher/backend/app.js` to add request logging middleware and update server port.
- Updated `teacher/backend/server.js` with corrected port reference.

**Frontend (Next.js) — scaffold:**
- `teacher/frontend/` — Full Next.js 14 project scaffolded with TypeScript, Tailwind CSS, ESLint, and Jest.
- `teacher/frontend/src/app/page.tsx` — Root page (initial layout).
- `teacher/frontend/src/app/layout.tsx` — Root layout with global CSS.
- `teacher/frontend/src/app/globals.css` — Tailwind CSS directives.
- `teacher/frontend/src/components/QuestionForm.tsx` — First version of the question creation form component (100 lines). Supports `text`, `multiple-choice`, and `scale` question types.
- `teacher/frontend/src/components/QuestionList.tsx` — Renders a list of questions fetched from the backend API (65 lines).
- `teacher/frontend/__tests__/QuestionForm.test.tsx` — React Testing Library unit test for `QuestionForm`.
- `teacher/frontend/jest.config.js`, `jest.setup.js`, `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` — Full Next.js toolchain configuration.

**Documentation:**
- `teacher/README.md` — Comprehensive 83-line README covering installation, environment variables, and the OCR workflow.
- `teacher/frontend/README.md` — Standard Next.js frontend README.

---

### 3.4 Express/MongoDB Backend — Class/Quiz Models & Upload Route

**Commit:** `a914438` — *Dec 16, 2025*

- `teacher/backend/models/Class.js` — Mongoose `Class` schema with `name`, `grade`, and an embedded `students` subdocument array (`name`, `studentId`).
- `teacher/backend/models/Quiz.js` — Mongoose `Quiz` schema with `title`, `classId` (FK ref to `Class`), and `status` (`draft | active | closed`).
- `teacher/backend/routes/upload.js` — `POST /api/upload` route using `multer` for file upload. Passes the uploaded image buffer to `ocrService` and returns extracted text as JSON.
- `teacher/backend/app.js` — Mounted `/api/upload` route.
- `teacher/frontend/src/components/QuestionForm.tsx` — Added image upload capability to `QuestionForm` (42 lines added), allowing teachers to scan a question from a physical paper.

---

### 3.5 Express/MongoDB Backend — Data Models & Response Schema

**Commit:** `f536971` — *Dec 17, 2025*

- `teacher/backend/models/Response.js` — Mongoose `Response` schema recording a student's answer: fields `studentId`, `quizId`, `questionId`, `answer`, `isCorrect` (boolean), timestamps.
- `teacher/backend/models/Class.js` — Extended to include a `roster` relationship.
- `teacher/backend/models/Question.js` — Extended with optional `correctAnswer` and `points` (default 1) fields to support auto-grading.
- `teacher/package.json` — Added `mongoose` dependency; updated `package-lock.json`.

---

### 3.6 Express/MongoDB Backend — Full REST API & Test Suite

**Commit:** `4c329b4` — *Dec 17, 2025*

This commit delivered all remaining REST API routes and a comprehensive test suite.

**New routes (all under `teacher/backend/routes/`):**

| File | Endpoints |
|------|-----------|
| `classes.js` | `GET /api/classes`, `GET /api/classes/:id`, `POST /api/classes`, `POST /api/classes/:id/students` |
| `quizzes.js` | `GET /api/quizzes?classId=`, `POST /api/quizzes`, `GET /api/quizzes/:id/scores` |
| `responses.js` | `POST /api/responses`, `GET /api/responses?quizId=` |

**`GET /api/quizzes/:id/scores` — Scoring Engine (highlight):**
- Fetches all enrolled students for the class.
- Fetches all questions and their `correctAnswer` / `points` config.
- Fetches all responses, ordered newest-first, and builds a *latest-response-per-student-per-question* map (deduplication).
- Computes each student's total score, handling:
  - Questions with no `correctAnswer` → full points awarded automatically.
  - `scale`-type questions → numeric comparison.
  - All other types → case-insensitive, whitespace-trimmed string comparison.
- Returns `{ results: [{ studentId, total }], maxScore }`.

**Extended `questions.js` route:**
- Added `DELETE /api/questions/:id`.

**Test suite (12 new test files using Jest + Supertest + `mongodb-memory-server`):**

| Test File | What It Tests |
|-----------|---------------|
| `tests/models/class_quiz.test.js` | Class and Quiz model validation |
| `tests/models/response.test.js` | Response model creation and fields |
| `tests/routes/classes.api.test.js` | CRUD for classes |
| `tests/routes/classes_students.api.test.js` | Enrolling students into classes |
| `tests/routes/quizzes.api.test.js` | Quiz creation and filtering by class |
| `tests/routes/quizzes_simulate.api.test.js` | Simulating quiz completion and score calculation |
| `tests/routes/responses.api.test.js` | Saving and retrieving responses |
| `tests/routes/upload.api.test.js` | Image upload endpoint |

---

### 3.7 Frontend — Next.js Initialization & Class Dashboard

**Commit:** `a37fc05` — *Dec 17, 2025*

- `teacher/frontend/src/app/page.tsx` — Redesigned root page into a full class dashboard. Renders `ClassManager` component; connects to backend API.
- `teacher/frontend/src/components/ClassManager.tsx` — 127-line reusable component for:
  - Fetching and listing all classes.
  - Creating a new class via a form (name + grade inputs).
  - Navigating to a class detail page.

---

### 3.8 Frontend — Quiz Builder, Response Viewer & Simulation UI

**Commit:** `c1a1e7a` — *Dec 17, 2025*

This was the single largest frontend commit, introducing three major UI pages and the initial `ResponseViewer` component.

**`teacher/frontend/src/app/classes/[classId]/page.tsx`** (221 lines added):
- Class detail page with tabbed navigation: **Quizzes**, **Students**.
- Quizzes tab: lists all quizzes for the class, with a "New Quiz" creation form.
- Students tab: shows enrolled student roster.
- Navigates to individual quiz pages.

**`teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx`** (93 lines added):
- Quiz detail page.
- Renders `QuestionList` to display questions for the quiz.
- Renders `ResponseViewer` to display student answers.
- "Simulate Answer" section: a form for a teacher to manually input a test response (student ID + answer selection), posting to the backend.

**`teacher/frontend/src/components/ResponseViewer.tsx`** (88 lines):
- Initial implementation of the response table component.
- Fetches from `GET /api/responses?quizId=` via the Express backend.
- Renders a sortable table: Student ID | Quiz | Question | Answer | Timestamp.
- Supports refresh via a button.

**`teacher/frontend/src/components/QuestionForm.tsx`** — Minor updates to connect to quiz creation flow.
**`teacher/frontend/src/components/QuestionList.tsx`** — Minor updates for quiz-scoped question fetching.

---

### 3.9 Documentation — Master Plan & README

**Commits:** `974e0cd`, `7b01b87` — *Dec 17, 2025*

**`974e0cd` — "docs: update project documentation and master plan":**
- Added root `README.md` (190 lines) documenting: system architecture, tech stack, feature roadmap, data models, API contract, and setup instructions.
- Updated `.gitignore`.

**`7b01b87` — "docs: consolidate and enhance README documentation":**
- Removed the root `README.md` (now superseded) and consolidated everything into `teacher/README.md` (217 lines).
- New content includes: architecture diagrams (Mermaid), PostgreSQL schema reference table, `Scan & Grade` OCR workflow walkthrough, developer setup guide with SQL snippets for Supabase table creation, and a full directory structure map.

---

### 3.10 Supabase Integration & Client-Side OCR

**Commit:** `7024b5e` — *Jan 28, 2026*

This commit replaced all MongoDB/Express data access with **Supabase (PostgreSQL)** calls inside the Next.js app, eliminating the separate Express backend for the teacher front-end.

**New file:**
- `teacher/frontend/src/lib/supabase.ts` — Initialises the Supabase JS client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

**`teacher/frontend/src/app/api/scan/route.ts`** (Next.js API route, 30 lines):
- Server-side API route receiving an image upload.
- Processes the image with Tesseract.js server-side as a fallback pathway.

**`teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx`** (220 lines — new page):
A fully self-contained **OCR Scan & Grade** page. Features:
1. **Image upload** — teacher selects a photo of a student's handwritten worksheet.
2. **Interactive crop** — `react-image-crop` allows the teacher to draw a bounding box around a specific answer area.
3. **Client-side OCR** — the cropped pixel region is extracted to an HTML5 `<canvas>`, then passed to `tesseract.js` (running as a WebWorker in the browser). No server round-trip needed.
4. **Review & save** — teacher verifies the extracted text and submits; a row is inserted into Supabase `responses` table.
5. **Student ID & question selection** dropdowns populated from live Supabase data.

**`teacher/frontend/src/app/classes/[classId]/page.tsx`** (major rewrite, 248 lines added):
- All data fetching migrated from Express `fetch()` calls to direct Supabase queries.
- **Quizzes tab:** fetches `assignments` table filtered by `workshop_id` and `assignment_type = 'assignment'`.
- **Students tab:** fetches `enrollments` joined with `profiles` to show student name + ID. Implements `POST /api/enrollments` logic via Supabase insert after profile lookup.
- **Scanner link:** each quiz row now has a "Scan" button navigating to the scan page.

**`teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx`** (58 lines rewritten):
- Replaced Express API calls with Supabase.
- Fetches questions and their options (joined from `questionoptions`).
- Calculates and displays **average numeric answer** per question using client-side aggregation.

**`teacher/frontend/src/components/ClassManager.tsx`** (91 lines rewritten):
- Replaced Express `fetch()` with `supabase.from('workshops').select(...)`.
- Class creation inserts into `workshops` table with a generated `ws-{timestamp}` ID.

**`teacher/frontend/src/components/QuestionForm.tsx`** (104 lines rewritten):
- Replaced Express POST with `supabase.from('questions').insert(...)`.
- Added `correct_answer` and `points` fields to the creation form.

**`teacher/frontend/src/components/QuestionList.tsx`** (64 lines rewritten):
- Fetches questions via Supabase with options join.
- Displays average answer badge per question.

**`teacher/frontend/src/components/ResponseViewer.tsx`** (85 lines rewritten):
- Replaced Express `fetch()` with a Supabase nested-join query:
  ```
  responses → questions (question_text, type, correct_answer → assignments (title))
  ```
- Maps nested Supabase response to a flat display structure.

---

### 3.11 Migration: Express/MongoDB → Next.js/Supabase (Refactor)

**Commit:** `603f793` — *Mar 2, 2026*

Final cleanup commit after the Supabase integration was stable.

- `teacher/frontend/src/app/classes/[classId]/page.tsx` — Removed all remaining references to the Express backend; streamlined Supabase queries.
- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx` — Minor scan page fixes.
- `teacher/frontend/src/components/ClassManager.tsx` — Further cleanup of legacy fetch calls.
- `teacher/frontend/src/components/QuestionForm.tsx` — Cleanup.
- `teacher/README.md` — Updated to reflect the serverless Supabase architecture (removed MongoDB references; replaced with PostgreSQL schema tables and Supabase setup instructions).

---

## 4. Main Branch Contributions (xelisce)

After the `zr` branch was merged, **xelisce** continued active development on `main`, delivering all teacher-side analytics features and classroom management improvements.

---

### 4.1 Repository Initialization

**Commit:** `5214669` — *Sep 18, 2025*

- Created root `.gitignore` (36 lines) and `LICENSE` (MIT, 21 lines).
- Established the repository.

---

### 4.2 Quiz Completion Analytics Page

**Commit:** `8021d96` — *Mar 3, 2026*

Introduced an entirely new **Class Analytics** page.

**New files:**
- `teacher/frontend/src/app/classes/[classId]/analytics/page.tsx` (117 lines)
- `teacher/frontend/src/components/AnswerRateCard.tsx` (152 lines)

**`analytics/page.tsx`:**
- Route: `/classes/[classId]/analytics`
- Fetches all assignments for the class from Supabase (`assignment_type = 'assignment'`).
- Renders an `AnswerRateCard` for each quiz in a 2-column responsive grid.
- "Refresh" button that cascades a `refreshTrigger` counter to all cards.
- Breadcrumb navigation back to the class page.
- "Class Analytics — Track learning engagement and completion rates" heading.

**`AnswerRateCard.tsx` (initial version):**
- Accepts `quizId`, `quizTitle`, `classId`, `refreshTrigger` as props.
- Fetches enrolled student count from `enrollments`.
- Fetches question IDs for the quiz.
- Fetches all responses for those questions.
- Computes:
  - **`startedCount`** — number of distinct students who answered at least one question.
  - **`finishedCount`** — number of distinct students who answered **all** questions.
  - **`startedRate`** — `(startedCount / enrolledCount) × 100`.
  - **`finishedRate`** — `(finishedCount / enrolledCount) × 100`.
- Colour-coded rate display using thresholds: ≥80% → green, ≥60% → yellow, <60% → orange.
- Progress bar visualization for each rate.
- Summary counts row: Assigned | Started | Finished.

**`classes/[classId]/page.tsx`** — Added "Analytics" link button navigating to the new analytics route.

---

### 4.3 Separate Quiz Start/Completion Rates & Average Answer

**Commit:** `638fa01` — *Mar 4, 2026*

Improved both the analytics page layout and the `AnswerRateCard` component.

**`analytics/page.tsx`:**
- Restructured layout from a 2-column split grid to a single full-width card labelled "Quiz analytics".
- Maintains the 2-column inner grid of `AnswerRateCard` instances.

**`AnswerRateCard.tsx`:**
- Separated `startedRate` and `finishedRate` into two distinct progress bars with individual percentage labels.
- Added colour thresholds (`YELLOW_THRESH = 60`, `GREEN_THRESH = 80`) as named constants.
- Both bars dynamically change colour class based on the thresholds.

**`QuestionList.tsx`:**
- Added `QuestionWithAverage` type extending `Question` with `average?: number` and `responseCount?: number`.
- On load, fetches all responses for the quiz from Supabase.
- For each question, collects numeric-parseable answers and computes the mean.
- Displays a green badge `Avg: {value}` next to each question when a numeric average is available.

**`QuestionForm.tsx`:**
- Minor wording and layout improvements to the question creation form.

---

### 4.4 Edit Correct Answer & Points, Delete Question, Score Distribution Graph

**Commit:** `98bef6f` — *Mar 4, 2026*

The largest xelisce commit — adding inline editing, question management, and a full score distribution chart.

**`teacher/backend/models/Question.js`:**
- Added `correctAnswer: { type: String }` (optional, for auto-grading).
- Added `points: { type: Number, default: 1 }`.

**`teacher/backend/routes/quizzes.js`:**
- New endpoint `GET /api/quizzes/:id/scores`:
  - Resolves quiz → class → enrolled students → questions → responses.
  - Deduplicates responses (latest per student per question).
  - Computes per-student scores handling: no `correctAnswer` (auto full marks), `scale` type (numeric compare), default (case-insensitive string compare).
  - Returns `{ results: [{ studentId, total }], maxScore }`.

**`teacher/frontend/package.json`:** Added `recharts` ^2.14.0 dependency.

**`AnswerRateCard.tsx`** (132 lines added):
- Added client-side **score computation** (mirrors the backend scoring engine but runs directly against Supabase):
  - Fetches `questions` with `correct_answer`, `points`, `type`.
  - Fetches `responses` for those questions (ordered newest-first).
  - Builds `latest[studentId][questionId]` deduplication map.
  - Computes totals per enrolled student.
- **Score Distribution Histogram** using Recharts `BarChart`:
  - X-axis: score (0 to maxScore).
  - Y-axis: number of students.
  - Custom tooltip showing the score value and list of students who achieved it.
  - Rendered in a `ResponsiveContainer` (300px tall, 100% wide).

**`QuestionForm.tsx`** (40 lines added):
- Added `correctAnswer` state and `points` state (default 1) to the question creation form.
- Passes `correct_answer` and `points` to the Supabase insert payload.
- UI: labelled text input for "Correct Answer (optional)" + number input for "Points (optional)".

**`QuestionList.tsx`** (114 lines added):
- Added inline edit functionality for each question:
  - "Edit" button enters edit mode for that question (`editingId` state).
  - Inline inputs for `correct_answer` (text) and `points` (number).
  - "Save" commits changes via `supabase.from('questions').update(...)`.
  - "Cancel" reverts to display mode.
- Added **delete question** functionality:
  - "Delete" button (red) calls `supabase.from('questions').delete()` for the question ID.
  - Updates local `questions` state to remove the deleted item immediately.

---

### 4.5 Edit Class Name & Delete Class

**Commit:** `f754d56` — *Mar 4, 2026*

Added workshop/class management controls to the class detail page.

**`classes/[classId]/page.tsx`** (85 lines added):
- **Inline title editing:**
  - `editingTitle` / `titleInput` state.
  - On mount, initialises `titleInput` from `classData.title`.
  - Renders editable `<input>` in place of the `<h1>` when editing; shows Save/Cancel buttons.
  - Save: calls `supabase.from('workshops').update({ title })` and updates local state.
- **Delete class button:**
  - Calls `supabase.from('workshops').delete()` with a confirmation dialog.
  - On success, navigates back to home (`router.push('/')`).
  - Uses `useRouter` from `next/navigation`.

**`scan/page.tsx`** — Minor fixes and adjustments.
**`AnswerRateCard.tsx`** — Minor cleanup.
**`QuestionForm.tsx`** — Minor cleanup.
**`QuestionList.tsx`** — Minor cleanup.

---

### 4.6 Cascade Delete Class

**Commit:** `409eb07` — *Mar 4, 2026*

Enhanced the delete class operation to perform a full **cascade delete** of all related data, preventing orphaned records.

**`classes/[classId]/page.tsx`** (49 lines added):

The `handleDeleteClass` function was extracted from inline JSX into a named async function, implementing a multi-step cascade:

```
1. Fetch all assignment IDs for this workshop_id
2. Fetch all question IDs for those assignment IDs
3. Delete responses WHERE question_id IN (question IDs)
4. Delete questionoptions WHERE question_id IN (question IDs)
5. Delete questions WHERE question_id IN (question IDs)
6. Delete assignments WHERE assignment_id IN (assignment IDs)
7. Delete enrollments WHERE workshop_id = classId
8. Delete the workshop itself WHERE workshop_id = classId
9. Navigate to home
```

Error handling wraps all steps in a try/catch; failures surface an alert with the error message.

---

### 4.7 Response Viewer Filtering & Sorting

**Commit:** `27c608f` — *Mar 4, 2026*

A major enhancement to the `ResponseViewer` component, adding interactive filtering and sorting controls.

**`ResponseViewer.tsx`** (127 lines added, 12 changed):

**New state:**
- `filterType: 'all' | 'correct' | 'wrong'` — filter responses by correctness.
- `showDuplicates: boolean` — toggle showing multiple responses from the same student for the same question.
- `sortBy: 'student' | 'question'` — sort order for the displayed table.

**Extended data model (`ResponseType`):**
- Added `question_id`, `correct_answer`, `question_type`, `is_correct` fields.

**Extended Supabase query:**
- Now fetches `question_id`, `type`, and `correct_answer` from the nested `questions` join.

**Correctness computation:**
- After fetch, each response is tagged with `is_correct`:
  - `scale` type: numeric equality (`Number(answer) === Number(correctAnswer)`).
  - All other types: normalised string equality (`trim().toLowerCase()`).
  - Responses where `correct_answer` is null are not marked correct/incorrect.

**`getFilteredResponses()`:**
1. Applies type filter (`correct` / `wrong` / `all`).
2. If `showDuplicates = false`: deduplicates by `student_id|question_id` key, keeping the first (most recent) response per pair.

**`getSortedResponses()`:**
- Sorts by `student_id` lexicographically, or by `question_text` lexicographically.

**New UI controls (rendered above the table):**
- **Filter dropdown:** "View All" / "Correct Only" / "Wrong Only".
- **Show Duplicates checkbox:** toggles deduplication.
- **Sort dropdown:** "By Student" / "By Question".

**Table enhancement:**
- Added a **Status** column showing a coloured badge: `✓ Correct` (green) or `✗ Wrong` (red) for graded questions; blank for ungraded.
- Header count now shows `displayedResponses.length` (filtered/deduped count) instead of total.
- Empty state message updated to "No student responses found for the selected filter."

---

## 5. Files Changed Summary

| File | Contributor | Changes |
|------|-------------|---------|
| `teacher/backend/app.js` | limzerui | Created + extended |
| `teacher/backend/server.js` | limzerui | Created |
| `teacher/backend/models/Question.js` | limzerui + xelisce | Created → extended with `correctAnswer`, `points` |
| `teacher/backend/models/Class.js` | limzerui | Created |
| `teacher/backend/models/Quiz.js` | limzerui | Created |
| `teacher/backend/models/Response.js` | limzerui | Created |
| `teacher/backend/routes/questions.js` | limzerui | Created + DELETE endpoint |
| `teacher/backend/routes/classes.js` | limzerui | Created |
| `teacher/backend/routes/quizzes.js` | limzerui + xelisce | Created → scoring engine added |
| `teacher/backend/routes/responses.js` | limzerui | Created |
| `teacher/backend/routes/upload.js` | limzerui | Created |
| `teacher/backend/services/ocrService.js` | limzerui | Created |
| `teacher/backend/tests/**` (8 files) | limzerui | Created |
| `teacher/frontend/src/lib/supabase.ts` | limzerui | Created |
| `teacher/frontend/src/app/page.tsx` | limzerui | Created |
| `teacher/frontend/src/app/layout.tsx` | limzerui | Created |
| `teacher/frontend/src/app/globals.css` | limzerui | Created |
| `teacher/frontend/src/app/api/scan/route.ts` | limzerui | Created |
| `teacher/frontend/src/app/classes/[classId]/page.tsx` | limzerui + xelisce | Created → Supabase migrated → edit/delete/cascade added |
| `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx` | limzerui | Created + Supabase migration |
| `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx` | limzerui | Created |
| `teacher/frontend/src/app/classes/[classId]/analytics/page.tsx` | xelisce | Created |
| `teacher/frontend/src/components/ClassManager.tsx` | limzerui | Created + Supabase migration |
| `teacher/frontend/src/components/QuestionForm.tsx` | limzerui + xelisce | Created → `correctAnswer`/`points` fields added |
| `teacher/frontend/src/components/QuestionList.tsx` | limzerui + xelisce | Created → inline edit/delete + average badge |
| `teacher/frontend/src/components/AnswerRateCard.tsx` | xelisce | Created — analytics card with rates + score histogram |
| `teacher/frontend/src/components/ResponseViewer.tsx` | limzerui + xelisce | Created → Supabase migrated → filtering/sorting added |
| `teacher/README.md` | limzerui | Created + consolidated |
| `README.md` | limzerui | Created (later removed/consolidated) |
| `.gitignore` | limzerui + xelisce | Created |
| `LICENSE` | xelisce | Created |
| `docs/README.md` | goodguyryan (student-side) | Not this contributor |
