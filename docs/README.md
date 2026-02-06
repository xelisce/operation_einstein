# Student-Side Documentation

## Overview

Operation Einstein (Student Side) has:

* **Backend API (Node.js + Express + Supabase)**: read-only endpoints that fetch workshops, assignments, questions, and options from Supabase.
* **Frontend (Next.js + React + TypeScript)**: pages for Dashboard → Workshop → Assignment. Assignment “submit” is **client-side validation + alert only** (no persistence).

---

## API Endpoints

| Method | Path                                       | Purpose                               | Supabase Tables            |
| ------ | ------------------------------------------ | ------------------------------------- | -------------------------- |
| GET    | `/api/hello`                               | Dummy endpoint                        | —                          |
| GET    | `/api/workshops`                           | List all workshops                    | `workshops`                |
| GET    | `/api/workshops/:workshopId`               | Get a workshop by ID                  | `workshops`                |
| GET    | `/api/workshops/:workshopId/assignments`   | List assignments for a workshop       | `assignments`, `workshops` |
| GET    | `/api/dashboard`                           | Dashboard data (workshops + todoList) | `workshops`, `assignments` |
| GET    | `/api/assignments/:assignmentId`           | Get an assignment by ID               | `assignments`              |
| GET    | `/api/assignments/:assignmentId/questions` | List questions for an assignment      | `questions`                |
| GET    | `/api/questions/:questionId/options`       | List options for a question           | `questionoptions`          |

---

## Data Models

| Model            | Fields                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Workshop`       | `workshopId`, `title`, `code`, `color`, `term`                                                                     |
| `Assignment`     | `assignmentId`, `workshopId`, `title`, `workshop`, `points`, `dueDate`, `type` (`"assignment"` | `"announcement"`) |
| `Question`       | `questionId`, `assignmentId`, `questionText`, `type` (`"multiple_choice"` | `"text"`), `questionOrder`             |
| `QuestionOption` | `questionOptionId`, `questionId`, `optionOrder`, `optionText`                                                      |

---

## Entity Flow

| Relationship           | Meaning                                         |
| ---------------------- | ----------------------------------------------- |
| Workshop → Assignments | A workshop contains many assignments            |
| Assignment → Questions | An assignment contains many questions           |
| Question → Options     | A question can have many options (used for MCQ) |

---

## Quickstart

### Backend

**Env vars**

* `SUPABASE_URL` (required)
* `SUPABASE_SERVICE_ROLE_KEY` (required)
* `PORT` (optional, default `4000`)
* `FRONTEND_ORIGIN` (optional, default `http://localhost:3000`)

**Run**

```bash
npm install
npm run dev
```

### Frontend

**Env var**

* `NEXT_PUBLIC_API_BASE_URL` (required, e.g. `http://localhost:4000`)

**Run**

```bash
npm install
npm run dev
```
