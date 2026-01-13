# Operation Einstein: Technical Architecture & Developer Guide

## 1. Executive Summary

**Operation Einstein** is a scalable Learning Management System (LMS) engineered for resource-constrained educational environments. This document serves as the comprehensive technical reference for the **Teacher Interface**, a full-stack application designed to facilitate digital assessment management, classroom organization, and performance tracking.

The system is built on a **Modular Monolith** architecture using the **MERN Stack** (MongoDB, Express, React/Next.js, Node.js), prioritizing maintainability, type safety (via Mongoose/TypeScript), and rapid deployment via Docker.

---

## 2. System Architecture

### 2.1 High-Level Design
The application operates as two distinct services (Frontend and Backend) communicating via a RESTful API over HTTP.

```mermaid
graph TD
    User[Teacher] -->|HTTPS/Browser| CDN[Next.js Frontend (Port 3000)]
    
    subgraph "Client Layer (Next.js)"
        CDN -->|SSR/CSR| Pages[App Router Pages]
        Pages -->|Fetch API| API_Client[API Integration Layer]
    end

    API_Client -->|JSON/HTTP| Gateway[Express API Gateway (Port 5001)]

    subgraph "Server Layer (Node.js)"
        Gateway -->|Middleware| CORS[CORS / Body Parser]
        CORS -->|Routing| Router[Express Router]
        
        Router -->|Controller| ClassCtrl[Class Controller]
        Router -->|Controller| QuizCtrl[Quiz Controller]
        Router -->|Controller| OCRCtrl[OCR Controller]
        
        OCRCtrl -->|Buffer| Tesseract[Tesseract.js WASM Engine]
    end
    
    subgraph "Persistence Layer"
        ClassCtrl -->|Mongoose| ODM[Object Document Mapper]
        QuizCtrl -->|Mongoose| ODM
        ODM -->|TCP/IP| DB[(MongoDB Docker Container)]
    end
```

### 2.2 Key Architectural Decisions
*   **Split Repos Pattern (Monorepo):** Both frontend and backend reside in `teacher/`, but manage dependencies independently (`teacher/package.json` vs `teacher/frontend/package.json`). This allows for independent scaling and deployment pipelines.
*   **Stateless REST API:** The backend is fully stateless. Authentication (future scope) and state are managed via tokens/IDs, making the backend horizontally scalable.
*   **Server-Side Rendering (SSR) + Client Hydration:** Next.js App Router is utilized. Pages are Server Components by default (SEO/Performance), using Client Components (`'use client'`) only for interactive islands (Forms, Lists).

---

## 3. Directory Structure & Codebase Map

### 3.1 Backend (`teacher/`)
The backend is a Node.js/Express application structured around **Resources** (Classes, Quizzes).

*   **`server.js`**: Application entry point. Bootstraps MongoDB connection and binds the HTTP server to Port 5001. Handles graceful shutdowns.
*   **`app.js`**: Express App Factory. Configures global middleware (CORS, JSON Parser, Request Logging) and mounts Route Controllers.
*   **`models/` (Data Layer)**:
    *   `Class.js`: Aggregate root for Students.
    *   `Quiz.js`: Entity linking Class to Questions.
    *   `Question.js`: Atomic assessment unit.
    *   `Response.js`: Transactional record of student activity.
*   **`routes/` (Controller Layer)**:
    *   `classes.js`: Handles `/api/classes` (CRUD + Student Roster mutation).
    *   `quizzes.js`: Handles `/api/quizzes` (CRUD + Simulation logic).
    *   `upload.js`: Handles `/api/upload` (Multipart/form-data processing).
*   **`services/` (Business Logic)**:
    *   `ocrService.js`: Pure function module that wraps the Tesseract.js worker lifecycle (Initialize -> Recognize -> Terminate).

### 3.2 Frontend (`teacher/frontend/`)
The frontend is a Next.js 14 application using the **App Router**.

*   **`src/app/` (Routing Layer)**:
    *   `page.tsx`: **Home Route**. Renders the Class Dashboard.
    *   `classes/[classId]/page.tsx`: **Dynamic Route**. Fetches Class data and renders the Class Detail View (Tabs: Quizzes/Students).
    *   `classes/[classId]/quizzes/[quizId]/page.tsx`: **Dynamic Route**. Fetches Quiz data and renders the Workstation (Question Form + Response Viewer).
*   **`src/components/` (UI Library)**:
    *   `ClassManager.tsx`: Interactive grid for Class management.
    *   `QuestionForm.tsx`: Complex form handling text input, select dropdowns, and **File Uploads** for OCR.
    *   `ResponseViewer.tsx`: Data grid component for visualizing student performance.

---

## 4. Data Dictionary (Schema Reference)

### 4.1 Class Object
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | E.g., "Mathematics 101" |
| `grade` | Number | No | Grade level (e.g., 5) |
| `students` | Array | No | Array of Student Objects `{ name, studentId }` |
| `createdAt` | Date | Yes | Auto-generated timestamp |

### 4.2 Quiz Object
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | E.g., "Midterm Exam" |
| `description`| String | No | Optional context |
| `classId` | ObjectId | Yes | Reference to Parent Class |

### 4.3 Question Object
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `text` | String | Yes | The question content |
| `type` | Enum | Yes | `['text', 'multiple-choice', 'scale']` |
| `options` | Array | Conditional | Required if type is `multiple-choice` |
| `quizId` | ObjectId | Yes | Reference to Parent Quiz |

### 4.4 Response Object
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `quizId` | ObjectId | Yes | Reference to Quiz |
| `questionId` | ObjectId | Yes | Reference to Question |
| `studentId` | String | Yes | The ID of the student who answered |
| `answer` | String | Yes | The actual response text |

---

## 5. API Reference (Internal)

Base URL: `http://localhost:5001`

### 5.1 OCR Service
*   **Endpoint:** `POST /api/upload`
*   **Content-Type:** `multipart/form-data`
*   **Body:** Key: `image`, Value: `[File]`
*   **Process:**
    1.  Middleware `multer` intercepts request, streams file to `./uploads`.
    2.  Controller passes file path to `ocrService`.
    3.  `ocrService` spins up Tesseract worker, processes image, returns text.
    4.  Controller cleans up (deletes) temp file.
    5.  Returns JSON `{ text: "..." }`.

### 5.2 Simulation Engine
*   **Endpoint:** `POST /api/quizzes/:id/simulate`
*   **Process:**
    1.  Fetches `Class` (via Quiz) to get full Student Roster.
    2.  Fetches all `Questions` for the Quiz.
    3.  Iterates `Students` × `Questions`.
    4.  Generates randomized valid answers (e.g., picks a random Option from `question.options`).
    5.  Performs bulk insert (`Response.insertMany`) for performance.

---

## 6. Operational Guide

### 6.1 Environment Setup
1.  **Docker (MongoDB):**
    The system requires a MongoDB instance. Run via Docker:
    ```bash
    docker run -d -p 27017:27017 --name mongo-einstein mongo:latest
    ```
2.  **Node Environment:**
    Ensure Node.js v18+ is installed (`node -v`).

### 6.2 Installation & Startup

**Backend Service:**
```bash
cd teacher
npm install
# Starts server on Port 5001
node backend/server.js
```

**Frontend Service:**
```bash
cd teacher/frontend
npm install
# Starts Dev Server on Port 3000 with Hot Reload
npm run dev
```

### 6.3 Test Protocols
The project strictly adheres to **Test-Driven Development (TDD)**. Tests are co-located in `tests/` folders.

**Backend Integration Tests (Jest + Supertest):**
These tests spin up an **In-Memory MongoDB Server** (`mongodb-memory-server`) to ensure isolation. They do NOT touch the real database.
```bash
cd teacher
npm test
```

**Frontend Component Tests (Jest + React Testing Library):**
These tests render components in a virtual DOM and assert on accessibility roles and text content.
```bash
cd teacher/frontend
npm test
```