# Teacher Folder Technical Handoff

## Purpose

This document is a takeover-oriented technical reference for the `teacher/` folder. It is written from the current codebase state, not from older project notes.

The short version:

- The active teacher UI is a `Next.js` app in `teacher/frontend/`.
- That UI talks directly to `Supabase`, not to the local Express backend.
- There is also a separate `Express + MongoDB` backend in `teacher/backend/`, but it is legacy.
- The split is intentional: the frontend is the maintained path, and the backend is retained as old implementation/reference code.

## Supported Structure

The `teacher` folder intentionally contains two tracks:

1. `teacher/frontend/`
   The user-facing teacher portal and the supported runtime. It is a Next.js App Router app using `@supabase/supabase-js` directly from the browser.

2. `teacher/backend/`
   A standalone Express API backed by MongoDB and Mongoose. It is legacy code kept in the repo for reference and older implementation context. The current frontend does not call these routes.

The key handoff point is that this split is intended. A new maintainer should treat `teacher/frontend/` as the source of truth for current product behavior and treat `teacher/backend/` as legacy unless there is an explicit decision to revive it.

## Architecture Boundary

### Supported runtime

The runtime that matters for current development is:

`Teacher browser -> Next.js frontend -> Supabase`

Relevant files:

- `teacher/frontend/src/lib/supabase.ts`
- `teacher/frontend/src/app/page.tsx`
- `teacher/frontend/src/app/categories/[categoryId]/page.tsx`
- `teacher/frontend/src/app/classes/[classId]/page.tsx`
- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx`
- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx`

### Legacy implementation kept in repo

There is also a legacy path:

`Teacher browser -> Express backend -> MongoDB`

Relevant files:

- `teacher/backend/app.js`
- `teacher/backend/server.js`
- `teacher/backend/routes/*.js`
- `teacher/backend/models/*.js`

This path is intentionally not part of the current teacher product flow.

### Operational implication

`docker-compose.yml` only starts `teacher-frontend`; it does not start a teacher backend service. That is consistent with the intended architecture rather than an omission.

## Folder Map

### `teacher/`

- `package.json`
  Root package for backend dependencies and Jest tests.
- `connectivity-test.js`
  Small HTTP test script for the backend. It targets port `5000`, which does not match the backend default port `5001`.
- `README.md`
  Older technical reference. Useful for background, but not the operational source of truth for the current teacher runtime.

### `teacher/backend/`

- `app.js`
  Express app setup, JSON middleware, CORS, request logger, route mounting.
- `server.js`
  Mongo connection and HTTP server startup.
- `models/`
  Mongoose models for `Class`, `Quiz`, `Question`, `Response`.
- `routes/`
  CRUD and quiz utility endpoints.
- `services/ocrService.js`
  Tesseract-based OCR helper.
- `tests/`
  Jest + Supertest + mongodb-memory-server test suite.

### `teacher/frontend/`

- `src/app/`
  Next.js App Router pages.
- `src/components/`
  Teacher UI components for categories, quizzes, responses, analytics, and OCR flow.
- `src/lib/supabase.ts`
  Supabase client initialization.
- `src/app/api/scan/route.ts`
  A server-side OCR route using Tesseract. Present, but not used by the scanner page.

## Frontend Responsibilities

## 1. Dashboard and category management

The landing page renders `ClassManager`, which is actually category management rather than direct class management.

Relevant files:

- `teacher/frontend/src/app/page.tsx`
- `teacher/frontend/src/components/ClassManager.tsx`

What it does:

- Lists records from Supabase `categories`
- Creates new categories with a three-letter code
- Navigates into `/categories/[categoryId]`

## 2. Category detail and workshop creation

Relevant file:

- `teacher/frontend/src/app/categories/[categoryId]/page.tsx`

What it does:

- Loads one category and its `workshops`
- Creates workshops with generated codes like `BIO-001`
- Can clone workshop content from another workshop in the same category
- Copies assignments, questions, options, projects, and project prompts
- Deletes categories and optionally force-deletes workshops first

Important note:

- The copy flow duplicates assignments, questions, `questionoptions`, projects, and `project_questions`
- It does not copy student enrollments or learner responses

## 3. Class/workshop detail

Relevant file:

- `teacher/frontend/src/app/classes/[classId]/page.tsx`

What it does:

- Loads one `workshop`
- Lists assignment-style quizzes from `assignments`
- Lists projects from `projects`
- Lists enrolled students from `enrollments` joined with `profiles`
- Creates quizzes and projects
- Enrolls students by their Supabase profile UUID
- Deletes a workshop using a manual cascade across assignments, questions, responses, options, projects, project questions, project responses, enrollments, and finally the workshop

Important note:

- Deletion is entirely application-managed. There is no transaction wrapper here, so partial cleanup is possible if a mid-sequence delete fails.

## 4. Quiz detail

Relevant file:

- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx`

What it does:

- Loads an assignment record from Supabase
- Renders:
  - `QuestionForm`
  - `QuestionList`
  - `ResponseViewer`
- Links to the OCR scan page

## 5. Question creation and editing

Relevant files:

- `teacher/frontend/src/components/QuestionForm.tsx`
- `teacher/frontend/src/components/QuestionList.tsx`

What it does:

- Creates question rows in Supabase `questions`
- Creates MCQ options in `questionoptions`
- Stores optional `correct_answer` and `points`
- Deletes questions and manually deletes related options and responses
- Calculates average numeric responses when possible

Important mismatch:

- `QuestionForm` stores MCQ type as `multiple-choice`
- `QuestionList` checks for `multiple_choice`

As written, the options list display branch in `QuestionList` will not trigger for MCQ rows created by `QuestionForm`.

## 6. OCR scan workflow

Relevant files:

- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx`
- `teacher/frontend/src/app/api/scan/route.ts`

What it does today:

- Loads questions and enrolled students from Supabase
- Lets the teacher upload an image locally
- Uses `react-image-crop` in the browser
- Uses `tesseract.js` in the browser to OCR the cropped selection
- Saves the extracted text into Supabase `responses`

Important note:

- The scanner page does OCR client-side.
- The server-side Next route `/api/scan` is not currently used by that page.
- The Express upload route `/api/upload` is also not used by the current frontend.

## 7. Analytics

Relevant files:

- `teacher/frontend/src/app/classes/[classId]/analytics/page.tsx`
- `teacher/frontend/src/components/AnswerRateCard.tsx`

What it does:

- Counts assigned students through `enrollments`
- Computes started and finished quiz rates by checking which students have responses
- Computes per-student score based on the latest response per question
- Renders a score distribution histogram using `recharts`

Scoring rule:

- If a question has no `correct_answer`, the code awards full points for that question.

## 8. Projects

Relevant file:

- `teacher/frontend/src/app/classes/[classId]/projects/[projectId]/page.tsx`

What it does:

- Loads a project
- Manages project prompts in `project_questions`
- Loads rich-text student responses from `project_responses`
- Deletes prompts and associated responses
- Deletes whole projects via manual cascade

## Supabase Data Model Assumptions

The frontend assumes the following tables exist in Supabase:

- `categories`
- `workshops`
- `assignments`
- `questions`
- `questionoptions`
- `responses`
- `profiles`
- `enrollments`
- `projects`
- `project_questions`
- `project_responses`

Likely field usage inferred from the code:

### `categories`

- `id`
- `name`
- `code`

### `workshops`

- `workshop_id`
- `title`
- `code`
- `category_id`
- `workshop_date`
- `color`
- `term`

### `assignments`

- `assignment_id`
- `workshop_id`
- `title`
- `assignment_type`
- `points`
- `due_date`

### `questions`

- `question_id`
- `assignment_id`
- `question_text`
- `type`
- `correct_answer`
- `points`
- `question_order`

### `questionoptions`

- `questionoption_id`
- `question_id`
- `option_text`
- `option_order`

### `responses`

- `response_id`
- `question_id`
- `student_id`
- `answer_text`
- `created_at`

### `profiles`

- `id`
- `name`

### `enrollments`

- `id`
- `workshop_id`
- `student_id`

### `projects`

- `project_id`
- `workshop_id`
- `title`

### `project_questions`

- `question_id`
- `project_id`
- `prompt`
- `position`

### `project_responses`

- `response_id`
- `project_id`
- `question_id`
- `student_id`
- `content_html`

## Legacy Backend Data Model

The legacy backend defines a separate MongoDB schema that does not match the Supabase schema exactly. This is mainly relevant if someone needs to inspect or extract behavior from the older implementation.

### `Class`

- `name`
- `grade`
- `students[]`
  - `name`
  - `studentId`

### `Quiz`

- `title`
- `description`
- `classId`
- `questions[]`

### `Question`

- `text`
- `type`
- `options[]`
- `correctAnswer`
- `points`
- `category`
- `quizId`

### `Response`

- `quizId`
- `questionId`
- `studentId`
- `answer`
- `score`

This is a different persistence model from the Supabase frontend. There is no adapter layer between them because the backend is not part of the active teacher flow.

## Legacy Backend API Surface

Mounted in `teacher/backend/app.js`:

- `GET /api/questions`
- `POST /api/questions`
- `POST /api/upload`
- `GET /api/classes`
- `GET /api/classes/:id`
- `POST /api/classes`
- `POST /api/classes/:id/students`
- `POST /api/classes/:id/simulate-students`
- `GET /api/responses`
- `GET /api/quizzes`
- `POST /api/quizzes`
- `POST /api/quizzes/:id/simulate`
- `GET /api/quizzes/:id/scores`

Operational notes:

- Backend default port is `5001`
- Backend default Mongo URI is `mongodb://localhost:27017/operation_einstein`
- `connectivity-test.js` still points at port `5000`

Unless the backend is deliberately revived, this API surface is reference material rather than part of day-to-day maintenance.

## Environment and Local Run Notes

## Frontend

Expected environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STUDENT_URL`

The Supabase client is created in `teacher/frontend/src/lib/supabase.ts`.

Typical local run:

```bash
cd teacher/frontend
npm install
npm run dev
```

The Dockerfile for the frontend also runs `npm run dev`, not a production build.

## Legacy backend

Expected environment variables:

- `PORT` optional, defaults to `5001`
- `MONGO_URI` optional, defaults to local MongoDB

Typical local run:

```bash
cd teacher
npm install
node backend/server.js
```

There is no backend Docker service in the repo root compose file because the backend is not part of the intended active stack.

## Testing Status

### Legacy backend tests

Backend tests exist under `teacher/backend/tests/` and cover:

- model creation and validation
- class routes
- quiz routes
- response routes
- upload route
- OCR service behavior

They use:

- `jest`
- `supertest`
- `mongodb-memory-server`

Important caveat:

- Running `npm test -- --runInBand` from `teacher/` did not complete cleanly in the current environment during this review. The suite appears to stall around test runtime setup, which is likely related to `mongodb-memory-server` behavior in this environment.

### Frontend tests

Frontend tests are minimal. At the time of review:

- `teacher/frontend/__tests__/QuestionForm.test.tsx` exists
- Running `npm test -- --runInBand` from `teacher/frontend/` failed because Jest could not resolve `jest-util` from the installed `node_modules`

That means the frontend test environment is currently not trustworthy without reinstalling dependencies and validating Node/npm compatibility.

## Recommended Takeover Order

## Immediate first pass

1. Treat `teacher/frontend/` as the active product surface.
2. Use this handoff doc to orient new maintainers to the supported-versus-legacy boundary.
3. Rebuild dependencies cleanly in `teacher/frontend/` and restore a reliable frontend test baseline.
4. Document the actual Supabase schema and RLS rules used by the teacher flows.

## Recommended ongoing posture

1. Keep the legacy backend clearly labeled as non-active code.
2. Consolidate OCR inside the supported frontend path so there is only one maintained grading flow.
3. Move destructive cascades into safer database-side operations where possible.
4. Keep documentation explicit about which files are maintained and which are reference-only.

## Files Most Worth Reading First

If a new engineer has one hour, start here:

- `teacher/frontend/src/app/categories/[categoryId]/page.tsx`
- `teacher/frontend/src/app/classes/[classId]/page.tsx`
- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/page.tsx`
- `teacher/frontend/src/app/classes/[classId]/quizzes/[quizId]/scan/page.tsx`
- `teacher/frontend/src/components/AnswerRateCard.tsx`
- `teacher/frontend/src/components/ResponseViewer.tsx`
- `teacher/frontend/src/lib/supabase.ts`

These files show the real control flow and persistence assumptions of the supported teacher system.

If someone specifically needs legacy context after that, read:

- `teacher/backend/app.js`
- `teacher/backend/routes/quizzes.js`
- `teacher/backend/server.js`

Those files are for legacy reference, not for normal teacher feature work.
