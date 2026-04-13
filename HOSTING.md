# Free hosting + Android APK (all phones)

This stack uses **free tiers** only. Expect **cold starts** on Render (first request after ~15 minutes idle can take ~30–60 seconds).

### Render still has a free tier (if the UI looks “paid”)

Render’s **Free** plan is limited (sleep after idle, hobby use) but **does not require a paid subscription** for those instances. If you only see paid prices:

1. When creating each **Web Service** or **Blueprint**, open the **Instance type** / **Plan** dropdown and choose **`Free`** (not Starter/Standard).
2. Some **workspaces** show paid defaults—scroll for **Free** or create a **personal** workspace.
3. A **credit card** is sometimes asked for verification even on Free; that does not automatically charge you, but read Render’s billing page before confirming.

Official summary: [Render — Deploy for Free](https://render.com/free).

### If you cannot use Render at all — other free options

Your app needs **(1) Node API**, **(2) Python AI**, **(3) static frontend**, plus **MongoDB Atlas** (free). Fully free “one click” for all three is rare; typical patterns:

| Approach | Notes |
|----------|--------|
| **[Fly.io](https://fly.io/docs/)** | Free resource allowance; you deploy with `fly.toml` / CLI. Fits small Node + Python apps; may need two apps (API + AI). |
| **[Koyeb](https://www.koyeb.com/)** | Free tier with limits; deploy from GitHub. |
| **[Railway](https://railway.app/)** | Often **trial credit**, not forever-free—check current terms. |
| **[Oracle Cloud “Always Free”](https://www.oracle.com/cloud/free/)** | Two small VMs forever-free; **you** install Docker/Node/Python (advanced, but no monthly bill if you stay in limits). |
| **Frontend only** | **[Cloudflare Pages](https://pages.cloudflare.com/)** or **[Vercel](https://vercel.com/)** — free static hosting. Build with `VITE_API_URL=https://your-api-url` pointing wherever your API lives. |

**Mobile APK:** unchanged — set `EXPO_PUBLIC_API_URL` in `mobile/eas.json` to whatever **public HTTPS** URL your API has (Render, Fly.io, etc.), then `eas build`.

---

## What you provide vs what is automatic

| You provide | Why |
|-------------|-----|
| **GitHub account** + this repo pushed to **`main`** | Render deploys from Git; `render.yaml` must be at the **repo root**. |
| **MongoDB Atlas** connection string | Only value Render **asks for during Blueprint setup** (`MONGODB_URI`). Needed so users and complaints persist (Render disk is not permanent). |
| **Render.com account** (free) | Where services run. Sign up with GitHub or email. |

| Automatic in `render.yaml` (no typing unless you rename services) | |
|-------------------------------------------------------------------|---|
| **`JWT_SECRET`** | Render generates a random value. |
| **`AI_SERVICE_URL`** | Wired from the AI service (private `host:port`); backend code adds `http://`. |
| **`FRONTEND_URL`** | `https://kumbh-frontend.onrender.com` (CORS for the dashboard). |
| **`VITE_API_URL`** | `https://kumbh-backend.onrender.com` (frontend talks to the API over HTTPS). |

**Optional later (paste in Render → `kumbh-backend` → Environment):** X / Facebook / Instagram keys from `backend/.env.example` if you want live social ingestion.

---

## 0. GitHub → Render (first time)

1. Push this project to a GitHub repo (default branch **`main`**).
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. **New** → **Blueprint** → **Connect** your GitHub account if asked (authorize Render).
4. Pick the repository and branch **`main`**. Render should detect **`render.yaml`** at the root.
5. When the form shows **environment variables**, enter **`MONGODB_URI`** = your full Atlas URI (see below).
6. Click **Apply** / deploy and wait until all services show **Live**.

If Render says the Blueprint is invalid, confirm the file is named exactly **`render.yaml`** in the **root** of the repo (not inside `backend/`).

---

## 1. MongoDB Atlas (free)

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas) (M0 free).
2. Create a database user and allow network access (`0.0.0.0/0` for simplicity, or Render’s egress IPs in production).
3. Copy the **connection string** (SRV), e.g. `mongodb+srv://user:pass@cluster.../kumbh-complaints?retryWrites=true&w=majority`.

You will paste this into Render as **`MONGODB_URI`** when the Blueprint asks (variable is `sync: false` in `render.yaml`).

## 2. Render (free) — web dashboard + API + AI

1. Push this repo to GitHub.
2. In [Render](https://render.com) → **New** → **Blueprint** → connect the repo and select `render.yaml`.
3. When prompted, set **`MONGODB_URI`** to your Atlas string.
4. Deploy. Wait for all three services to go **Live**.

**URLs (fixed names in `render.yaml`):**

| Service | Public URL |
|--------|------------|
| Dashboard | `https://kumbh-frontend.onrender.com` |
| Backend API | `https://kumbh-backend.onrender.com` |
| AI service | internal + `https://kumbh-ai-service.onrender.com` (AI is called server-to-server) |

If you **rename** a service in Render, update `render.yaml` and any `https://...` values so they stay consistent.

**Optional env vars** (Render dashboard → `kumbh-backend`): social API keys (`X_BEARER_TOKEN`, etc.) as in `backend/.env.example`.

**Notes**

- Free web services **spin down** after inactivity; first load wakes them up.
- Ephemeral disk: don’t rely on local JSON files on the server—use **Atlas** for real data.

## 3. Mobile app (Android APK for “all phones”)

The app must call the **public HTTPS** backend (not `localhost`).

1. In `mobile/eas.json`, **`public-apk`** / **`production`** already use  
   `EXPO_PUBLIC_API_URL`: `https://kumbh-backend.onrender.com`  
   If your backend URL differs, change it to match **exactly** (no trailing slash).
2. Install [EAS CLI](https://docs.expo.dev/build/setup/) and log in: `eas login`.
3. From the `mobile` folder:  
   `npm run apk`  
   (or `eas build --platform android --profile public-apk`).
4. Download the **APK** from the Expo build page and share it.
5. On each Android device: allow **Install from unknown sources** / **Install unknown apps** for the browser or file app you use to open the APK.

**Expo / EAS:** free tier has **limited** build minutes per month; enough for testing and small projects.

### iPhones

- A **.apk** is Android-only.
- For iOS you need an **Apple Developer** account ($/year) for App Store or TestFlight, or use **Expo Go** in development. Production iOS builds are not “free” in the same way as sideloading an APK.

## 4. Smoke test after deploy

1. Open `https://kumbh-frontend.onrender.com` — login / register.
2. Open `https://kumbh-backend.onrender.com/health` — should return JSON with `"status":"ok"`.
3. Install the APK on a phone (mobile data or Wi‑Fi) and sign in.

If the web app loads but API calls fail, check **CORS**: `FRONTEND_URL` on the backend must match the dashboard origin (`https://kumbh-frontend.onrender.com` in this Blueprint).
