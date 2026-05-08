# CCMS · AI Judgment Intelligence Platform — Backend API

A production-ready Node.js + Express REST API that powers the **CCMS** frontend — a Government Court Case Management System with AI-driven judgment analysis, human verification workflows, and deadline tracking.

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Runtime      | Node.js 18+                             |
| Framework    | Express 4                               |
| Database     | PostgreSQL 14+ via Sequelize 6 ORM      |
| Auth         | JWT (access + refresh tokens), bcrypt   |
| File upload  | Multer (PDF / image)                    |
| Security     | Helmet, CORS, express-rate-limit        |
| Validation   | express-validator                       |

---

## Project Structure

```
ccms-backend/
├── server.js                 ← Entry point
├── .env.example              ← Copy to .env and fill in values
├── config/
│   └── db.js                 ← Sequelize connection + sync
├── middleware/
│   ├── auth.js               ← JWT authenticate, authorize, optionalAuth
│   ├── errorHandler.js       ← validate, notFound, globalError
│   └── upload.js             ← Multer config (PDF / images)
├── models/
│   ├── index.js              ← All models + associations
│   ├── User.js
│   ├── Case.js
│   ├── Extraction.js         ← AI-extracted judgment data
│   ├── ActionPlan.js         ← AI-generated action plan
│   ├── QueueItem.js          ← Human verification queue
│   └── VerifiedRecord.js     ← Approved, trusted records
├── routes/
│   ├── auth.js               ← /api/auth/*
│   ├── cases.js              ← /api/cases/*
│   ├── upload.js             ← /api/upload/*
│   ├── extraction.js         ← /api/extraction/*
│   ├── actionplan.js         ← /api/actionplan/*
│   ├── verification.js       ← /api/verification/*
│   ├── verified.js           ← /api/verified/*
│   └── admin.js              ← /api/admin/*
├── uploads/                  ← Uploaded PDFs (git-ignored)
└── utils/
    └── seed.js               ← Seeds all mock data from app.js
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- Create a database: `createdb ccms_db`

### 2. Install & configure
```bash
cd ccms-backend
npm install
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, etc.
```

### 3. Run
```bash
# Development (auto-restarts, syncs schema)
npm run dev

# Production
npm start

# Seed with mock data (mirrors app.js hard-coded arrays)
npm run seed
```

---

## API Reference

### Auth  `/api/auth`

| Method | Path                  | Auth | Description                         |
|--------|-----------------------|------|-------------------------------------|
| POST   | `/signup`             | —    | Register (pending admin approval)   |
| POST   | `/signin`             | —    | Login → access + refresh tokens     |
| POST   | `/refresh`            | —    | Rotate tokens                       |
| POST   | `/logout`             | ✅   | Invalidate refresh token            |
| POST   | `/forgot-password`    | —    | Request password reset email        |
| GET    | `/me`                 | ✅   | Current user profile                |

### Cases  `/api/cases`

| Method | Path          | Auth | Description                             |
|--------|---------------|------|-----------------------------------------|
| GET    | `/`           | ✅   | List with search, filter, pagination    |
| GET    | `/stats`      | ✅   | Dashboard counters                      |
| GET    | `/:id`        | ✅   | Single case + all nested data           |
| POST   | `/`           | ✅🔒 | Create case manually (admin/nodal)      |
| PATCH  | `/:id`        | ✅   | Update status / action type             |
| DELETE | `/:id`        | ✅🔒 | Soft-delete (admin only)                |

### Upload  `/api/upload`

| Method | Path                    | Auth | Description                        |
|--------|-------------------------|------|------------------------------------|
| POST   | `/judgment`             | ✅   | Upload PDF + metadata, trigger AI  |
| GET    | `/status/:caseId`       | ✅   | Poll extraction progress           |
| GET    | `/document/:filename`   | ✅   | Serve uploaded PDF                 |

### Extraction  `/api/extraction`

| Method | Path                            | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| GET    | `/`                             | ✅   | List all extractions     |
| GET    | `/:caseId`                      | ✅   | Full extraction for case |
| PATCH  | `/:extractionId/field`          | ✅   | Correct a single field   |
| GET    | `/:extractionId/edits`          | ✅   | Full edit audit trail    |

### Action Plan  `/api/actionplan`

| Method | Path                | Auth | Description              |
|--------|---------------------|------|--------------------------|
| GET    | `/`                 | ✅   | List all plans           |
| GET    | `/:caseId`          | ✅   | Plan for a case          |
| PATCH  | `/:planId`          | ✅   | Edit plan sections       |
| POST   | `/:planId/export`   | ✅   | Request PDF export       |

### Verification  `/api/verification`

| Method | Path                            | Auth | Description                        |
|--------|---------------------------------|------|------------------------------------|
| GET    | `/queue`                        | ✅   | Pending queue (filterable)         |
| GET    | `/queue/:itemId`                | ✅   | Item + extraction + action plan    |
| POST   | `/queue/:itemId/approve`        | ✅   | Approve → creates VerifiedRecord   |
| POST   | `/queue/:itemId/reject`         | ✅   | Reject with mandatory reason       |
| POST   | `/queue/:itemId/flag`           | ✅   | Flag for senior review             |

### Verified Records  `/api/verified`

| Method | Path            | Auth | Description                           |
|--------|-----------------|------|---------------------------------------|
| GET    | `/`             | ✅   | Paginated, searchable, filterable     |
| GET    | `/deadlines`    | ✅   | Upcoming deadlines for dashboard      |
| GET    | `/:id`          | ✅   | Single verified record                |

### Admin  `/api/admin`  *(admin role only)*

| Method | Path                       | Description                   |
|--------|----------------------------|-------------------------------|
| GET    | `/users`                   | List all users                |
| PATCH  | `/users/:id/activate`      | Approve pending account       |
| PATCH  | `/users/:id/role`          | Change user role              |
| DELETE | `/users/:id`               | Deactivate user               |

---

## User Roles

| Role             | Description                                   |
|------------------|-----------------------------------------------|
| `admin`          | Full access + user management                 |
| `nodal_officer`  | Approve/reject queue, manage cases            |
| `legal_officer`  | Upload, edit extractions, verify queue        |
| `secretary`      | Approve/reject queue, read-only otherwise     |
| `viewer`         | Read-only access                              |

---

## Connecting to the Frontend

Replace `sessionStorage` / mock data calls in `app.js` with `fetch` calls:

```js
// Sign in
const res = await fetch('http://localhost:5000/api/auth/signin', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({ email, password }),
});
const { data } = await res.json();
sessionStorage.setItem('ccms_token', data.accessToken);
sessionStorage.setItem('ccms_user',  JSON.stringify(data.user));

// Authenticated request helper
async function api(path, opts = {}) {
  const token = sessionStorage.getItem('ccms_token');
  return fetch(`http://localhost:5000${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  }).then(r => r.json());
}

// Fetch cases for the dashboard
const { data } = await api('/api/cases?limit=20&order=DESC');
```

---

## Wiring in Your AI Extraction Service

In `routes/upload.js`, replace the `callAIExtractionService` stub:

```js
async function callAIExtractionService(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await fetch(process.env.AI_ENDPOINT, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
    body:    formData,
  });

  return response.json();
  // Must return: { confidence, caseDetails, parties, directions, timelines, rawText }
}
```

---

## Seeded Test Accounts

| Email              | Password      | Role            |
|--------------------|---------------|-----------------|
| admin@ccms.gov.in  | Admin@12345   | admin           |
| spatel@gov.in      | Legal@12345   | legal_officer   |
| rkumar@gov.in      | Nodal@12345   | nodal_officer   |