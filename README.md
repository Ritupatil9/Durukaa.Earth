# Darukaa.Earth

A full-stack geospatial data platform for managing, visualizing, and analyzing carbon and
biodiversity restoration projects and their geographical sites.

> **Demo data notice:** the seed script creates one demonstration project ("Western Ghats
> Restoration") with synthetic, deterministic analytics values. These are illustrative sample
> figures only — **not** real environmental measurements of any actual location.

---

## Overview

Darukaa.Earth lets an administrator register/log in, create projects, draw site boundaries as
polygons directly on an interactive Mapbox map, and track each site's carbon and biodiversity
performance over time via charts. Boundaries are stored as real PostGIS `POLYGON` geometry, and
every area figure is calculated server-side from that geometry — never trusted from the browser.

## Features

- JWT authentication (register / login / `me`), passwords hashed with bcrypt
- Project CRUD, scoped to the logged-in user
- Site CRUD with polygon boundaries drawn via Mapbox GL Draw
- Server-side area calculation in hectares using PostGIS geodesic `ST_Area`
- `GET /api/sites/map` GeoJSON `FeatureCollection` endpoint powering the map
- Time-series carbon & biodiversity analytics with backend-computed summaries/deltas
- Dashboard with KPI cards + map overview
- Responsive UI (desktop → mobile), loading skeletons, empty states, confirm dialogs, toasts
- ESLint + Prettier + Husky + lint-staged (frontend), Ruff + Black + pytest (backend)
- GitHub Actions CI running against a real Postgres/PostGIS service container
- Docker Compose for one-command local startup

## Architecture

```
User → React (Vite) → Axios → REST API → FastAPI → SQLAlchemy/GeoAlchemy2 → PostgreSQL + PostGIS
User → Mapbox GL JS + Draw → GeoJSON → FastAPI → PostGIS geometry(POLYGON, 4326)
```

Deployed target architecture:

```
User → Vercel (React) → HTTPS → Render (FastAPI) → Render/managed PostgreSQL + PostGIS
```

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Mapbox GL JS, Mapbox GL Draw,
Chart.js / react-chartjs-2, ESLint, Prettier, Husky, lint-staged.

**Backend:** Python, FastAPI, SQLAlchemy 2.0, GeoAlchemy2, Pydantic v2, Alembic, python-jose
(JWT), passlib/bcrypt, Ruff, Black, pytest.

**Database:** PostgreSQL + PostGIS.

## Project Structure

```
darukaa-earth/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models (User, Project, Site, SiteAnalytics)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routes/        # FastAPI routers (auth, projects, sites, analytics, dashboard)
│   │   ├── services/      # geo.py: GeoJSON <-> PostGIS conversion, area calc
│   │   ├── dependencies/  # get_current_user auth dependency
│   │   ├── utils/         # security.py: password hashing + JWT
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── seed.py
│   ├── alembic/           # migrations
│   ├── tests/              # pytest suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # SitesMap, StatCard, modals, etc.
│   │   ├── pages/          # Login, Register, Dashboard, Projects, ProjectDetail, SiteDetail, Map
│   │   ├── layouts/        # DashboardLayout (Sidebar + Navbar)
│   │   ├── services/       # api.js + per-resource service modules
│   │   ├── context/        # AuthContext, ToastContext
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── .github/workflows/ci.yml
├── docker-compose.yml
└── .env.example
```

## Database Schema

```
users (id, name, email UNIQUE, password_hash, created_at, updated_at)
  └── projects (id, name, description, created_by → users.id, created_at, updated_at)
        └── sites (id, project_id → projects.id, name, description,
                    geometry GEOMETRY(POLYGON, 4326) [GIST index], area_hectares,
                    created_at, updated_at)
              └── site_analytics (id, site_id → sites.id, recorded_date,
                                   carbon_stock, carbon_sequestration, biodiversity_index,
                                   tree_cover_percentage, species_count, created_at)
```

Area is computed by casting the geometry to `geography` and calling `ST_Area(geom, true)`,
which is accurate on the WGS84 ellipsoid and avoids the classic mistake of treating
longitude/latitude degrees as meters.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a user, returns JWT |
| POST | `/api/auth/login` | Verify credentials, returns JWT |
| GET | `/api/auth/me` | Current user (protected) |
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/{id}` | Retrieve / update / delete a project |
| GET/POST | `/api/projects/{id}/sites` | List / create sites (GeoJSON body) |
| GET/PUT/DELETE | `/api/sites/{id}` | Retrieve / update / delete a site |
| GET | `/api/sites/map` | GeoJSON `FeatureCollection` of all owned sites |
| GET/POST | `/api/sites/{id}/analytics` | List / add analytics records |
| GET | `/api/sites/{id}/summary` | Latest KPIs + change-over-time |
| GET | `/api/dashboard/summary` | Aggregate totals for the dashboard |

Interactive docs: `http://localhost:8000/docs`.

## Environment Variables

**backend/.env** (copy from `backend/.env.example`):

```
DATABASE_URL=postgresql://darukaa:darukaa@localhost:5432/darukaa_earth
JWT_SECRET_KEY=change-this-to-a-long-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**frontend/.env** (copy from `frontend/.env.example`):

```
VITE_API_URL=http://localhost:8000/api
VITE_MAPBOX_TOKEN=your-mapbox-access-token-here
```

Get a free Mapbox token at <https://account.mapbox.com/access-tokens/>.

## Local Setup (Windows 11 / PowerShell)

### Prerequisites

- Node.js 20+, Python 3.11+, PostgreSQL 16 with the PostGIS extension available, Git.
- If you'd rather skip installing Postgres locally, use Docker Compose instead (below).

### 1. Clone / open the project

```powershell
cd darukaa-earth
code .
```

### 2. Database

Using local PostgreSQL (with PostGIS installed):

```powershell
psql -U postgres -c "CREATE USER darukaa WITH PASSWORD 'darukaa' SUPERUSER;"
psql -U postgres -c "CREATE DATABASE darukaa_earth OWNER darukaa;"
```

### 3. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000` (`/docs` for Swagger UI).

### 4. Frontend

Open a **new** terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
# edit .env and paste your Mapbox token
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 5. Log in

Seeded admin account: `admin@darukaa.earth` / `Admin@12345` — or register your own account.

## Docker Setup

```powershell
Copy-Item .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Postgres/PostGIS: `localhost:5432`

Run migrations + seed inside the backend container once it's up:

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

## Database Migrations

```powershell
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Seed Data

```powershell
python -m app.seed
```

Creates one admin user, one project ("Western Ghats Restoration"), 3 sites (Mulshi, Tamhini,
Matheran), and 5 years (2022–2026) of deterministic, clearly-synthetic analytics per site.

## Testing

Backend (requires a running PostgreSQL/PostGIS instance; the test suite truncates its own
tables between tests):

```powershell
cd backend
$env:DATABASE_URL="postgresql://darukaa:darukaa@localhost:5432/darukaa_earth_test"
pytest -v
```

Frontend (build must succeed; this is also enforced in CI):

```powershell
cd frontend
npm run build
```

## Code Quality

```powershell
# Frontend
cd frontend
npm run lint
npm run format:check

# Backend
cd backend
ruff check .
black --check .
```

## Git Hooks

Husky + lint-staged are configured at the **repo root** (`package.json`, `.husky/pre-commit`).
On every commit, staged frontend files are auto-fixed/formatted with ESLint + Prettier, and
staged backend files are checked with Ruff + Black. A failing check blocks the commit.

To enable hooks after cloning:

```powershell
npm install
```

## GitHub Actions

`.github/workflows/ci.yml` runs on every push/PR with two parallel jobs:

- **frontend**: `npm ci` → `lint` → `format:check` → `build`
- **backend**: spins up a real `postgis/postgis:16-3.4` service container → `ruff check` →
  `black --check` → `pytest`

Either job failing fails the pipeline.

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo → set **Root Directory** to `frontend`.
3. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
4. Add environment variables: `VITE_API_URL` (your Render backend URL + `/api`),
   `VITE_MAPBOX_TOKEN`.
5. Deploy.

### Backend → Render

1. **New Web Service** → connect the repo → Root Directory `backend`.
2. Runtime: Docker (uses `backend/Dockerfile`), or Python native with build command
   `pip install -r requirements.txt` and start command
   `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Add environment variables: `DATABASE_URL` (from the Render Postgres instance, see below),
   `JWT_SECRET_KEY` (generate a long random value), `JWT_ALGORITHM=HS256`,
   `ACCESS_TOKEN_EXPIRE_MINUTES=60`, `BACKEND_CORS_ORIGINS=https://<your-vercel-domain>`.

### Database → Render PostgreSQL (or any managed Postgres with PostGIS)

1. Create a Render PostgreSQL instance.
2. Connect to it (e.g. via `psql`) and run: `CREATE EXTENSION IF NOT EXISTS postgis;`
   (Render's managed Postgres supports the PostGIS extension.)
3. Copy the **External Database URL** into the backend's `DATABASE_URL` env var.
4. Run `alembic upgrade head` once (via a Render one-off job/shell, or by including it in the
   backend's start command as shown above) and, optionally, `python -m app.seed`.

**Status:** This repository is fully prepared for deployment (Dockerfiles, migrations, env var
wiring), but it has not actually been deployed from this environment — no live URL is claimed
here. Follow the steps above to deploy it yourself.

## Screenshots

Not included in this build — run the app locally (see above) to see the live dashboard, map,
and site detail pages.

## Future Improvements

- Project/site filtering and search
- Marker/polygon clustering for large numbers of sites
- CSV import/export for analytics
- Role-based access control and audit logs
- Satellite imagery basemap layer
- Spatial intersection/overlap queries between sites

This is a hackathon project.
