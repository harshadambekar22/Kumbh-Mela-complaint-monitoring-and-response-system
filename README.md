# AI Social Media Complaint -> Task Conversion System (Kumbh Mela)

Full-stack monorepo:
- `frontend` (React + Vite + Tailwind + Leaflet + Chart.js)
- `backend` (Node + Express + MongoDB/Mongoose + JWT auth)
- `ai-service` (FastAPI + spaCy rule-based NLP + confidence/review)
- `mobile` (Expo React Native app for Android + iOS)

## Core Features Implemented
- Authentication + role-based access (`admin`, `operator`, `department_officer`)
- Complaint workflow: assignment, comments timeline, SLA due time, escalation flags
- Bulk actions and drag-drop status board
- Search/filter + saved views
- Alerts + analytics summary + department performance
- Ingestion APIs + dedupe/spam filtering + review state/confidence
- Map geofences + clustered markers
- Audit logs endpoint
- Docker + docker-compose + CI workflow + Render blueprint

## Accounts
- Create your first account from the sign-in screen.
- The first registered user is promoted to `admin`.

## Local Run

### 1) AI Service
```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8001
```

### 2) Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### 3) Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### 4) Mobile (Android + iOS)
```bash
cd mobile
npm install
npx expo start
```

Set mobile API URL before running:

```bash
# Android emulator default
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000

# iOS simulator default
EXPO_PUBLIC_API_URL=http://localhost:5000

# Physical phone (same Wi-Fi)
EXPO_PUBLIC_API_URL=http://<your-laptop-ip>:5000
```

### 5) Build Direct APK (install on phone)
```bash
cd mobile
npm install
npx eas login
npx eas build --platform android --profile preview
```

After build completes, EAS will give a download link for `.apk`.

Notes:
- In `mobile/eas.json`, set `EXPO_PUBLIC_API_URL` to your backend URL/IP before building.
- For local backend testing on phone, use laptop LAN IP like `http://192.168.x.x:5000`.

### 6) Auto APK Build on Git Push (GitHub Actions)

This repo now includes workflow: `.github/workflows/mobile-apk.yml`

It triggers when:
- you push to `main`/`master` with changes in `mobile/**`, or
- you run it manually from GitHub Actions.

Required one-time GitHub setup:
1. Create Expo access token (`npx expo login` -> `npx expo whoami` -> create token in Expo account settings).
2. Add repository secret:
   - Name: `EXPO_TOKEN`
   - Value: your Expo access token

Workflow behavior:
- installs mobile dependencies
- runs EAS cloud build for Android preview profile (`apk`)
- starts build without waiting (`--no-wait`)

You can track and download the generated APK from your Expo EAS builds dashboard.

## Backend Environment (`backend/.env`)
```bash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kumbh-complaints
AI_SERVICE_URL=http://127.0.0.1:8001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=change-me
JWT_EXPIRES_IN=12h
```

## Key APIs
- Auth
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- Complaints
  - `POST /api/complaints/ingest`
  - `POST /api/complaints/process`
  - `GET /api/complaints` (search/filter/pagination)
  - `PATCH /api/complaints/:id/status`
  - `PATCH /api/complaints/:id/assign`
  - `POST /api/complaints/:id/comments`
  - `PATCH /api/complaints/bulk`
  - `POST /api/complaints/:id/review`
  - `GET /api/complaints/analytics/summary`
  - `GET /api/complaints/alerts`
  - `GET /api/complaints/saved-views`
  - `POST /api/complaints/saved-views`
- Audit
  - `GET /api/audit` (admin only)
- AI
  - `POST /analyze`
  - `POST /feedback`

## Docker
```bash
docker compose up --build
```
Frontend: `http://localhost:4173`

## Render
- `render.yaml` included for Blueprint deploy.
- Set `MONGODB_URI` secret on backend service.
