# Operation Einstein - Teacher Interface

## 🏗 System Architecture (Current Phase)

The application follows a **MERN Stack** architecture (MongoDB, Express, React/Next.js, Node.js), currently split into two distinct parts within the `teacher/` directory.

```mermaid
graph TD
    User[Teacher] -->|Interacts via Browser| Frontend[Next.js Frontend (Port 3000)]
    Frontend -->|HTTP Requests (Fetch)| Backend[Express API (Port 5000)]
    Backend -->|Mongoose ODM| Database[(MongoDB Local)]
```

### Key Components
1.  **Frontend (`teacher/frontend`)**:
    *   **Framework**: Next.js (App Router).
    *   **Styling**: Tailwind CSS.
    *   **Features**: Question Creation Form (`QuestionForm.tsx`).
2.  **Backend (`teacher/`)**:
    *   **Framework**: Express.js.
    *   **Database**: MongoDB (Mongoose).
    *   **Routes**: `/api/questions` (GET, POST).
    *   **Testing**: Jest + Supertest (Integration Tests).

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18+ recommended)
*   **MongoDB** (Must be running locally on port `27017`)

### 1. Start the Backend (API)
The backend runs on port **5000**.

1.  Open a terminal.
2.  Navigate to the teacher directory:
    ```bash
    cd teacher
    ```
3.  Install dependencies (if first time):
    ```bash
    npm install
    ```
4.  Start the server:
    ```bash
    node backend/server.js
    ```
    *You should see: "MongoDB connected" and "Server running on port 5000"*

### 2. Start the Frontend (UI)
The frontend runs on port **3000**.

1.  Open a **new** terminal tab/window.
2.  Navigate to the frontend directory:
    ```bash
    cd teacher/frontend
    ```
3.  Install dependencies (if first time):
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
5.  Open your browser to [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests

**Backend Tests:**
```bash
cd teacher
npm test
```

**Frontend Tests:**
```bash
cd teacher/frontend
npm test
```
