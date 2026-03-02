# Operation Einstein: Teacher Interface (Technical Reference)

## 1. Executive Summary

**Operation Einstein** is a modern Learning Management System (LMS) designed for resource-constrained environments. The Teacher Interface enables educators to manage classrooms, digitize physical assessments via OCR, and track student performance.

The system has been architected as a **Serverless Application** using **Next.js 14** and **Supabase (PostgreSQL)**, ensuring scalability, real-time data capabilities, and minimal operational overhead.

---

## 2. Technical Stack

*   **Frontend Framework:** Next.js 14 (App Router, React Server Components).
*   **Styling:** Tailwind CSS.
*   **Database & Auth:** Supabase (PostgreSQL).
*   **Image Processing:**
    *   **Cropping:** `react-image-crop` (Client-side Canvas).
    *   **OCR:** `tesseract.js` (Client-side WASM).
*   **Language:** TypeScript.

---

## 3. System Architecture

The application operates as a single Next.js monolith communicating directly with the Supabase Cloud Database.

```mermaid
graph TD
    Teacher[Teacher Browser] -->|HTTPS| NextJS[Next.js App (Vercel/Local)]
    
    subgraph "Client Side Logic"
        NextJS -->|WASM| Tesseract[Tesseract OCR Engine]
        NextJS -->|Canvas API| Cropper[Image Cropper]
    end

    subgraph "Cloud Infrastructure"
        NextJS -->|Supabase JS Client| Postgres[(Supabase Database)]
    end
```

### 3.1 Data Schema (PostgreSQL)

The database relies on normalized tables with Foreign Key relationships.

| Table | Primary Key | Foreign Keys | Description |
| :--- | :--- | :--- | :--- |
| **`workshops`** | `workshop_id` (uuid) | - | Equivalent to "Classes". Stores title, code. |
| **`profiles`** | `id` (uuid) | `id` -> `auth.users` | Global registry of users/students (ID, Name, Role). |
| **`enrollments`** | `id` (uuid) | `workshop_id`, `student_id` | Many-to-Many link between Workshops and Profiles. |
| **`assignments`** | `assignment_id` (uuid) | `workshop_id` | Equivalent to "Quizzes". |
| **`questions`** | `question_id` (uuid) | `assignment_id` | The questions in a quiz. |
| **`responses`** | `response_id` (uuid) | `question_id`, `student_id` | Student answers. |

---

## 4. Feature Implementation Details

### 4.1 "Scan & Grade" (OCR Workflow)
This feature allows teachers to grade handwritten papers digitally.

1.  **Upload:** Teacher selects a photo of a student's worksheet.
2.  **Crop:** Using `react-image-crop`, the teacher draws a box around the specific answer.
3.  **Process (Client-Side):**
    *   The browser extracts the pixel data from the cropped region using HTML5 Canvas.
    *   The data is passed to `Tesseract.js` running in a WebWorker.
    *   Tesseract returns the raw text string.
4.  **Save:** The teacher verifies the text and clicks "Save". The app inserts a row into the `responses` table via Supabase.

### 4.2 Class Management
*   **Dashboard:** Fetches all `workshops`.
*   **Roster:** The "Students" tab in a class fetches `enrollments` joined with `profiles` to show names and IDs.
*   **Enrolment:** Teachers can enrol existing students by providing their UUID (from the `profiles` table).

---

## 5. Developer Guide

### 5.1 Prerequisites
*   **Node.js** (v18+)
*   **Supabase Account:** You need a project URL and Anon Key.

### 5.2 Installation

1.  **Clone & Install:**
    ```bash
    cd teacher/frontend
    npm install
    ```

2.  **Environment Configuration:**
    Create a file named `.env.local` in `teacher/frontend/`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

### 5.3 Database Setup (SQL)
Run these commands in the Supabase SQL Editor if tables are missing:

```sql
-- Ensure responses table exists
create table public.responses (
  response_id uuid not null default gen_random_uuid (),
  question_id uuid not null references questions(question_id),
  student_id text not null,
  answer_text text not null,
  created_at timestamp with time zone default now(),
  constraint responses_pkey primary key (response_id)
);
```

---

## 6. Directory Structure

*   `src/app/`: Next.js Pages (Routes).
    *   `page.tsx`: Dashboard.
    *   `classes/[classId]/`: Class Detail (Quizzes/Students tabs).
    *   `classes/[classId]/quizzes/[quizId]/`: Quiz Detail (Question Creator).
    *   `classes/[classId]/quizzes/[quizId]/scan/`: **Scanner Interface**.
*   `src/components/`: Reusable UI.
    *   `ClassManager`: Workshop list/create.
    *   `QuestionForm`: Quiz question creator.
    *   `ResponseViewer`: Grading table.
*   `src/lib/`:
    *   `supabase.ts`: Initialized Supabase client.
