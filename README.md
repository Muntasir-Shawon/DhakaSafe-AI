# DhakaSafe AI (ঢাকা সেফ এআই)
### AI-Powered Street Theft Risk Prediction & Safer Route Recommendation for Dhaka

[![GitHub Repo](https://img.shields.io/badge/GitHub-DhakaSafe--AI-181717?logo=github&logoColor=white)](https://github.com/Muntasir-Shawon/DhakaSafe-AI)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-brightgreen?logo=vercel)](https://dhakasafe-ai-teal.vercel.app)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![ML](https://img.shields.io/badge/ML-RandomForest_XGBoost_LightGBM-FF9900)](https://scikit-learn.org/)
[![Explainable AI](https://img.shields.io/badge/XAI-TreeSHAP-purple)](https://shap.readthedocs.io/)
[![Routing](https://img.shields.io/badge/Routing-Risk_Weighted_Dijkstra-blue)](https://networkx.org/)

---

## 🌐 Live Links & Repository
- **GitHub Repository**: [https://github.com/Muntasir-Shawon/DhakaSafe-AI](https://github.com/Muntasir-Shawon/DhakaSafe-AI)
- **Live Frontend (Vercel)**: [https://dhakasafe-ai-teal.vercel.app](https://dhakasafe-ai-teal.vercel.app)
- **Live Backend API (Render · FastAPI)**: [https://dhakasafe-ai-backend.onrender.com](https://dhakasafe-ai-backend.onrender.com) — Live API Docs: [https://dhakasafe-ai-backend.onrender.com/docs](https://dhakasafe-ai-backend.onrender.com/docs)
- **Local Dev Web App**: `http://localhost:5173`
- **Local Backend API & OpenAPI Docs**: `http://127.0.0.1:8000/docs`

> *Deployment note: The frontend SPA is hosted on **Vercel**, while the FastAPI + ML backend runs on **Render** (free tier, Docker) with the frontend wired to it via the `VITE_API_BASE_URL` environment variable. Render's free instance spins down after ~15 min of inactivity and takes ~30–60s to wake on the first request after idle.*

---

## 📌 Project Overview
Pedestrians, students, and commuters across Dhaka frequently experience opportunistic snatching, handbag theft, and nighttime street robbery. Mainstream navigation tools only optimize for **distance and traffic delay**, leading users through poorly-lit or historically high-theft corridors.

**DhakaSafe AI** is an end-to-end urban decision-support platform that estimates street theft risk at the **road-segment and time-window level**, recommending risk-aware alternative paths:
1. **Fastest Route** ($\alpha = 0.0$): Standard navigation minimizing travel duration.
2. **Balanced Route** ($\alpha = 0.45$, **Recommended**): Circumvents high-theft corridors with only a negligible detour (+2.5 min for a 35–45% lower risk score).
3. **Safest Route** ($\alpha = 1.25$): Strongly favors well-lit, police-patrolled arterial roads with lowest risk.

---

## 📊 Multi-Layer Datasets
DhakaSafe AI utilizes 4 interconnected data layers:
1. **Crime Incident Dataset (`backend/app/data/dhaka_crime_incidents.csv`)**: 1,280 validated records (2023–2026) across 22+ Dhaka Thanas with full metadata: `incident_id`, `date`, `time`, `crime_type`, `location_text`, `road_name`, `area`, `thana`, `latitude`, `longitude`, `source`, `victim_type`, `weapon`, `vehicle_used`, `location_precision`, `verification_status`, and `confidence`.
2. **Dhaka Road Network Graph (`backend/app/data/dhaka_road_network.json`)**: 44 major intersections (nodes) and 54 arterial/secondary road segments (edges) with geometry, lighting conditions, bus stops, and police posts.
3. **Spatio-Temporal Master Matrix (`backend/app/data/spatio_temporal_master.csv`)**: 18,144 combinations of (Road Segment × Hour 0-23 × Day of Week × Weather) for continuous risk calibration.
4. **Spatial Clusters (`backend/app/data/dhaka_hotspots.json`)**: 12 DBSCAN and KDE cluster centers with severity metrics and radiuses.

---

## 🧠 Machine Learning & Explainability
- **Temporal Train/Test Split**: Monday–Thursday training (10,368 samples) vs Friday–Sunday evaluation (7,776 samples) to prevent temporal data leakage.
- **Model Comparison Results**:
  - **Random Forest**: **F1: 0.9721 | ROC-AUC: 0.9998 | Brier Score: 0.0057** (*Selected Best Model*)
  - **XGBoost**: F1: 0.9721 | ROC-AUC: 0.9997 | Brier Score: 0.0058
  - **LightGBM**: F1: 0.9721 | ROC-AUC: 0.9996 | Brier Score: 0.0060
  - **Logistic Regression**: F1: 0.9151 | ROC-AUC: 0.9976 | Brier Score: 0.0132
- **Calibration**: Continuous S-curve scaling to a **0–100 Risk Score** with data confidence metrics ($38\%–96\%$).
- **TreeSHAP Explainability**: Decomposes any road prediction into exact factor attributions (e.g. `+22 Night window`, `+18 Snatching surge`, `+15 Low lighting`, `-14 Police post proximity`).

---

## 🚦 Navigation Routing Engine
- **Graph Algorithm**: NetworkX Dijkstra Multi-Criteria Optimization:
  $$\text{cost}(e) = \text{travel\_time}(e) + \alpha \times \text{risk\_score}(e)$$
- **Test Demonstration** (*Dhanmondi 27 → Gulshan 2 at 11 PM on Friday*):
  - **Fastest**: 16.2 min, Risk 20/100
  - **Balanced (Recommended)**: 18.7 min (+2.5 min), Risk 18/100 (**35% lower risk**)
  - **Safest**: 21.2 min (+5.0 min), Risk 14/100 (**58% lower risk**)

---

## 💻 Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, React-Leaflet, Lucide Icons.
- **Interactive Map Visualizations**:
  - **Vibrant OpenStreetMap Default**: High-detail full color map displaying street names, water bodies, parks, and landmarks without any API keys or watermarks.
  - **Multi-Theme Switcher**: Instant switching between **🗺️ Color Map** (OSM), **🛰️ Satellite** (Esri World Imagery), and **🌙 Dark** (Canvas).
  - **High-Contrast Road Casings**: Double-stroke polyline casings ensuring risk-colored routes (green, amber, orange, red) stand out boldly against colorful map backgrounds.
- **Backend API**: FastAPI, Pydantic, Uvicorn.
- **AI / ML & GIS**: Scikit-learn, XGBoost, LightGBM, SHAP, NetworkX, Pandas, NumPy.
- **CI/CD & Deployment**: Frontend on **Vercel** (root `vercel.json`), Backend on **Render** (root `Dockerfile` + `render.yaml` blueprint), GitHub Actions (`deploy-pages.yml`).

---

## 🚀 Running Locally

### 1. Clone the Repository
```bash
git clone https://github.com/Muntasir-Shawon/DhakaSafe-AI.git
cd DhakaSafe-AI
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run_backend.py
```
Backend API will be live at: `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web application will be live at: `http://localhost:5173`

> By default the app calls the local backend at `http://127.0.0.1:8000/api`. To point it at a deployed backend, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` (e.g. `https://dhakasafe-ai-backend.onrender.com/api`).

---

## 🌍 Deployment

The frontend and backend are deployed independently.

### Frontend → Vercel
The root `vercel.json` builds the Vite app (`npm --prefix frontend run build`, output `frontend/dist`) and rewrites all routes to `index.html` (SPA fallback).

1. Import the repository at [https://vercel.com/new](https://vercel.com/new).
2. Add the environment variable **`VITE_API_BASE_URL`** and apply it to **Production** (and **Preview** / **Development** if needed):
   ```
   VITE_API_BASE_URL = https://dhakasafe-ai-backend.onrender.com/api
   ```
3. Deploy. Without this variable, the app falls back to the local backend `http://127.0.0.1:8000/api`.

### Backend → Render
The FastAPI + ML backend is containerized via the root `Dockerfile` (`python:3.11-slim` with the `libgomp1` OpenMP runtime required by scikit-learn/LightGBM/SHAP) and ships a Blueprint at `render.yaml`.

1. Create a **Web Service** (or **Blueprint**) from the repository on [https://render.com](https://render.com).
2. Set **Dockerfile Path** to `Dockerfile` and **Docker Build Context** to `.` (repo root).
3. Optionally set **Health Check Path** to `/api/health`.
4. No manual env vars are required — Render injects `PORT`, and the container listens on `${PORT:-8000}`.

---

## ⚖️ Responsible AI & Ethics Framework (Points 45–48)
- **No Demographic Profiling**: Risk is calculated strictly from road infrastructure (lighting, width, transit stops) and temporal incident history, never individual identities, ethnicity, religion, or socioeconomic groups.
- **Language Standards**: Uses "Predicted street theft risk" instead of "dangerous people" or "criminal neighborhoods".
- **Limitations Disclosed**: Reported crime $\neq$ Actual crime. Reporting biases and media attention imbalances are explicitly acknowledged.
