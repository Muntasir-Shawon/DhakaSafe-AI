"""
DhakaSafe AI - FastAPI Application Server
Entrypoint for all AI risk prediction, routing, analytics, and data pipeline APIs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import PROJECT_NAME, VERSION, API_PREFIX
from app.core.ethics import ETHICS_DISCLOSURE
from app.api import (
    routes_navigation,
    routes_risk,
    routes_incidents,
    routes_analytics,
    routes_nlp
)

app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description="AI-Powered Street Theft Risk Prediction & Safer Route Recommendation for Dhaka"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(routes_navigation.router, prefix=API_PREFIX)
app.include_router(routes_risk.router, prefix=API_PREFIX)
app.include_router(routes_incidents.router, prefix=API_PREFIX)
app.include_router(routes_analytics.router, prefix=API_PREFIX)
app.include_router(routes_nlp.router, prefix=API_PREFIX)

@app.get("/")
def root():
    return {
        "name": PROJECT_NAME,
        "version": VERSION,
        "status": "online",
        "documentation": "/docs",
        "ethics": ETHICS_DISCLOSURE
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "project": PROJECT_NAME,
        "version": VERSION,
        "components": {
            "ml_model": "Random Forest / Calibrated S-Curve Scorer",
            "explainability": "SHAP Factor Attribution",
            "routing_engine": "NetworkX Risk-Weighted Dijkstra",
            "nlp_pipeline": "Bangla & English News Extractor"
        },
        "ethics": ETHICS_DISCLOSURE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
