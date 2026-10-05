# SkyLink — Scalable Production URL Shortener

A production-ready, high-throughput full-stack URL shortener system built with **Spring Boot 3 (Java 21)**, **PostgreSQL**, **Redis**, and a modern **React 18 + Vite + TypeScript + Tailwind CSS** frontend.

---

## 🚀 Architecture Overview

```mermaid
flowchart TD
    Client["Client / Browser"]
    Frontend["React 18 + TypeScript UI\n(Vite @ port 5173)"]
    Backend["Spring Boot 3 API / Redirect\n(@ port 8080)"]
    Redis[("Redis Cache\n(Key: url:{shortCode})")]
    Postgres[("PostgreSQL 16\n(Table: urls)")]
    AsyncPool["Async Thread Pool\n(@Async Click Counter)"]

    Client -->|User UI Interaction| Frontend
    Frontend -->|REST APIs| Backend
    Client -->|GET /s/{shortCode}| Backend
    
    Backend -->|1. Check Cache| Redis
    Redis -.->|Cache Hit| Backend
    Backend -.->|2. Cache Miss: Query DB| Postgres
    Backend -->|3. Populate Cache| Redis
    Backend -->|4. Non-blocking Task| AsyncPool
    AsyncPool -->|Atomic Increment| Postgres
    Backend -->|5. HTTP 302 Location| Client
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Spring Boot 3.3.5, Java 21
- **Data Persistence:** Spring Data JPA + PostgreSQL Driver + HikariCP
- **Caching Layer:** Spring Data Redis (Cache-aside pattern with TTL support)
- **Validation:** Spring Boot Starter Validation + Apache Commons Validator
- **Async Execution:** Spring `@EnableAsync` with configured `ThreadPoolTaskExecutor`
- **Observability:** Spring Boot Actuator (`/actuator/health`)
- **Testing:** JUnit 5, Mockito, Spring MVC Test, Testcontainers

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS (Modern dark glassmorphic design system)
- **Forms & Validation:** React Hook Form + Zod (`@hookform/resolvers`)
- **Routing:** React Router DOM v6
- **Data Visualization:** Recharts (Click volume telemetry)
- **QR Code Generation:** `react-qr-code` with PNG download exporter
- **HTTP Client:** Axios with centralized error handling

### Infrastructure & DevOps
- **Containerization:** Docker Compose for PostgreSQL 16 Alpine and Redis 7 Alpine
- **Configuration:** Environment variable overrides with `.env.example`

---

## 🌟 Key Features

1. **Deterministic Base62 Encoding:**
   - Database auto-increment `id` is mapped bijectively to `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`.
   - Guaranteed collision-free with fixed minimum padding length (6–8 chars).
2. **Custom Vanity Aliases:**
   - Allows user-defined short codes (`/s/launch`, `/s/docs`) with uniqueness check and DB constraint protection.
3. **Sub-Millisecond Redis Caching:**
   - Redirect lookups first query Redis key `url:{shortCode}`.
   - If present, original URL is returned immediately; cache miss loads from PostgreSQL and hydrates Redis with the remaining TTL.
4. **Asynchronous Click Telemetry:**
   - Click counter increments and `lastAccessedDate` updates are dispatched to a background thread pool (`@Async`), adding zero latency to client redirects.
5. **Configurable TTL & Expiration:**
   - Optional time-to-live in days. Expired links are automatically rejected in both cache and database query layers.
6. **Built-in QR Code Generator:**
   - Every shortened link generates a scannable QR code with instant 1-click PNG download.

---

## 📋 Prerequisites

- **Java 21** (JDK 21+)
- **Node.js 20+** and npm
- **Docker Desktop** (or standalone Docker & Docker Compose)
- Maven 3.9+ (or use the included `./mvnw` / `mvnw.cmd` wrapper)

---

## ⚡ Quick Start / Local Setup

### Step 1: Start PostgreSQL and Redis via Docker

```bash
docker compose up -d
```

Verify containers are healthy:
```bash
docker compose ps
```

### Step 2: Configure Environment (Optional)

Copy `.env.example` if you need custom credentials (defaults already match Docker Compose):
```bash
cp .env.example .env
```

### Step 3: Run the Backend (Spring Boot)

Using Maven Wrapper on macOS/Linux:
```bash
./mvnw spring-boot:run
```

On Windows (Command Prompt / PowerShell):
```powershell
.\mvnw.cmd spring-boot:run
```

The Spring Boot backend will start on **`http://localhost:8080`**.
Health check: `http://localhost:8080/actuator/health`

### Step 4: Run the Frontend (React + Vite)

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run backend unit and controller slice tests:
```bash
# Linux/macOS
./mvnw test

# Windows
.\mvnw.cmd test
```

Run frontend type check & production build:
```bash
cd frontend
npm run build
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/shorten` | Shorten a long URL | `{ "longUrl": "...", "ttlDays": 7, "customAlias": "promo" }` |
| `GET` | `/s/{shortCode}` | Public redirect to destination (HTTP 302) | None |
| `GET` | `/api/urls` | List all shortened URLs | None |
| `GET` | `/api/analytics/{shortCode}` | Retrieve click analytics for a code | None |
| `DELETE` | `/api/{shortCode}` | Delete URL and evict from cache | None |

---

### Example API Requests

#### 1. Shorten a URL
```bash
curl -X POST http://localhost:8080/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://spring.io/projects/spring-boot",
    "ttlDays": 30,
    "customAlias": "spring-boot"
  }'
```

**Response (HTTP 201 Created):**
```json
{
  "shortUrl": "http://localhost:8080/s/spring-boot",
  "shortCode": "spring-boot",
  "longUrl": "https://spring.io/projects/spring-boot",
  "expiresAt": "2026-11-04T16:00:00"
}
```

#### 2. Test Redirect
```bash
curl -i http://localhost:8080/s/spring-boot
```

**Response (HTTP 302 Found):**
```http
HTTP/1.1 302 Found
Location: https://spring.io/projects/spring-boot
Cache-Control: no-cache, no-store, max-age=0
```

#### 3. Fetch Click Analytics
```bash
curl http://localhost:8080/api/analytics/spring-boot
```

**Response (HTTP 200 OK):**
```json
{
  "shortCode": "spring-boot",
  "longUrl": "https://spring.io/projects/spring-boot",
  "clickCount": 14,
  "createdAt": "2026-10-05T16:00:00",
  "expiresAt": "2026-11-04T16:00:00",
  "lastAccessedAt": "2026-10-05T16:45:12"
}
```

---

## 📂 Project Structure

```
├── .env.example
├── docker-compose.yml          # PostgreSQL 16 & Redis 7 services
├── pom.xml                     # Spring Boot 3 dependencies & build
├── src
│   ├── main
│   │   ├── java/com/example/urlshortener
│   │   │   ├── config/         # AppProperties, AppConfig, CorsConfig
│   │   │   ├── controller/     # UrlController, RedirectController
│   │   │   ├── dto/            # Request and Response DTOs
│   │   │   ├── entity/         # Url JPA entity with DB indexes
│   │   │   ├── exception/      # Custom exceptions & GlobalExceptionHandler
│   │   │   ├── repository/     # UrlRepository (JPA & atomic query updates)
│   │   │   ├── service/        # Base62Encoder, UrlCacheService, ClickCountService, UrlShortenerService
│   │   │   └── UrlShortenerApplication.java
│   │   └── resources
│   │       └── application.yml # Database, Redis, and app properties
│   └── test
│       └── java/com/example/urlshortener
│           ├── controller/     # MockMvc controller slice tests
│           └── service/        # Base62 and Service unit tests
└── frontend
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src
        ├── api/                # Axios API client & error handling
        ├── components/         # Navbar, UrlForm, CopyButton, QR Code
        ├── pages/              # HomePage, DashboardPage, AnalyticsPage
        ├── types.ts            # TypeScript interfaces
        └── index.css           # Custom dark theme & glassmorphism
```
