# ⚔️ Backend Battle: API Performance Arena

**Backend Battle** is an interactive, high-fidelity API stress-testing and benchmarking arena. It allows developers to register competitor endpoints, simulate concurrent user loads, analyze core latency/throughput metrics in a real-time dashboard, and compete for the top ranks on a gamified leaderboard.

---

## 🏗️ Architecture & Stack

The application is structured as a decoupled backend API and frontend web client:

### 1. Backend API (`/backend`)
*   **Core Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python) for ultra-fast, asynchronous request routing.
*   **Benchmarking Engine**: Asynchronous HTTP client using `httpx` to trigger concurrent requests and track individual request logs (latencies, status codes).
*   **Datastore**: Lightweight, thread-safe in-memory database dictionary (designed for rapid local prototyping).
*   **Background Worker**: Uses FastAPI's `BackgroundTasks` to process concurrent stress runs out-of-band without blocking API responses.

### 2. Frontend App (`/frontend`)
*   **Framework**: [React Native for Web](https://necolas.github.io/react-native-web/) built on [Expo](https://expo.dev/) for cross-platform responsive rendering.
*   **Styling**: Premium custom CSS components utilizing a dual-themed palette:
    *   **Battleground Tab**: Glassmorphic dark emerald/teal dashboard (`#080C14` background, `#0D1F1A` cards, `#06B6D4` glowing accents).
    *   **Leaderboard Tab**: Sleek dark-purple gaming hall of fame (`#150E26` background, `#1E1435` cards, `#A78BFA` violet accents).
*   **Iconography**: `@expo/vector-icons` (Ionicons, FontAwesome5, MaterialCommunityIcons).

---

## 🚀 Features

### ⚡ Battleground Arena
*   **Competitor Registration**: Submit API Endpoint name, Target URL, Owner/Team, and customize payloads, methods (GET, POST, PUT, DELETE), JSON headers, concurrency (up to 50 users), and total volume (up to 200 requests).
*   **Interactive Split Layout**: Dual-column design on desktop screens. The left panel houses the deployment controller; the right panel dynamically changes to show a "Get Started" prompt, a loading state with spinner during active attacks, or a rich details scorecard once completed.
*   **Real-time Run Selection**: View recent runs list below the workbench, click any historical simulation card, and watch the dashboard update instantly to inspect that specific run's telemetry.

### 🏆 Gamified Leaderboard
*   **Dynamic Period Filters**: Toggle between **Today**, **Week**, and **Month** to filter results dynamically.
*   **3-Member Visual Podium**: Celebrates top competitors with initials-based colored circle avatars and a golden crown floating above the 1st place winner.
*   **Rank-based Visual Pills**: Unique rank card styling where Rank 1 is glowing yellow, Rank 2 is pure white, and Rank 3 is vivid orange.
*   **Rank Trajectory Trends**: Arrows indicate movement patterns (up green, down red, neutral grey) for rank rows.
*   **Sticky "You" Card**: Pins your highest-scoring submission to the bottom of the board so you can instantly track your team's rank relative to the competition.

### 📊 Info & Rules
*   Displays the custom scoring rules, performance grades (S, A, B, C, D, F), and contains a checklist for preparing the application for production scale.

---

## 💯 Scoring & Grading System

Scores are calculated out of **100 total points** based on the following algorithm:

| Dimension | Max Weight | Criteria |
| :--- | :--- | :--- |
| **Average Latency** | **40 pts** | Full 40 pts if avg latency `< 50ms`. Decays linearly to 0 pts at `3000ms`. |
| **P95 Tail Latency** | **30 pts** | Full 30 pts if P95 latency `< 100ms`. Decays linearly to 0 pts at `5000ms`. |
| **Success Rate** | **20 pts** | Measures ratio of valid status codes vs total requests. `100% success = 20 pts`. |
| **Throughput Bonus** | **10 pts** | Calculated as `RPS / 10`. Reaching `≥ 100 RPS` earns the full 10-point bonus. |

### Performance Grades
*   🏆 **S**: `90+ pts` (Legendary)
*   🟢 **A**: `80-89 pts` (Excellent)
*   🔵 **B**: `65-79 pts` (Good)
*   🟢 **C**: `50-64 pts` (Average)
*   🟠 **D**: `30-49 pts` (Slow)
*   🔴 **F**: `<30 pts` (Critical)

---

## 🛠️ How to Run Locally

### 1. Spin up the FastAPI Backend
```bash
cd backend
# (Optional) Create virtual env: python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn httpx pydantic
uvicorn main:app --reload --port 8000
```
*   The API will start at `http://localhost:8000`
*   Interactive documentation (Swagger UI) is available at `http://localhost:8000/docs`

### 2. Start the Expo Frontend
```bash
cd frontend
npm install
npx expo start --web
```
*   The web client will load at `http://localhost:8081`
*   Configure the backend base URL (if not default) by clicking the Settings gear ⚙️ icon in the header.

---

## 🔒 Production Hardening Checklist
Before deploying this application to production:
1.  **Persistent DB**: Replace the dict-based `in_memory.py` store with PostgreSQL using an async driver like `asyncpg`.
2.  **Job Queue**: Use Redis and Celery/RQ to queue and execute benchmark simulations asynchronously across workers to prevent resource exhaustion on the main API server.
3.  **Submission Rate Limiting**: Implement rate-limiting middleware (e.g., using `slowapi`) to prevent endpoint flooding attacks.
4.  **CORS Lockdowns**: Restrict backend CORS middleware origin headers strictly to the production frontend domain.
