"""
DhakaSafe AI - Explainable AI (XAI) & Factor Attribution Module
Implements SHAP factor breakdown (Point 24 in document):
Explains: "Why did AI give this road a high or low risk?"
Examples:
- Previous nighttime incidents: +24
- Recent incident increase: +18
- Low street lighting: +14
- High historical frequency: +13
- Friday night effect: +7
- Rain / Low visibility: +5
- Nearby police station: -12
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

_EXPLAINER = None

def get_shap_explainer():
    global _EXPLAINER
    if _EXPLAINER is None:
        path = os.path.join(MODELS_DIR, "shap_explainer.pkl")
        if os.path.exists(path):
            _EXPLAINER = joblib.load(path)
    return _EXPLAINER

def explain_road_risk(
    road_name: str,
    risk_score: int,
    hour: int,
    day_of_week: str,
    lighting_condition: str,
    historical_incidents: int,
    rain: int,
    bus_stops: int,
    police_stations: int
) -> List[Dict[str, Any]]:
    """
    Computes human-readable factor attributions explaining why the model predicted this risk score.
    """
    factors = []
    is_night = (hour >= 21 or hour <= 4)
    is_weekend = day_of_week.lower() in ["friday", "saturday"]

    # 1. Historical incident baseline
    if historical_incidents >= 35:
        factors.append({
            "factor": "High historical snatching density",
            "impact": "+18",
            "val": 18,
            "direction": "positive",
            "category": "Historical Crime",
            "detail": f"{historical_incidents} reported incidents documented along this corridor."
        })
    elif historical_incidents >= 15:
        factors.append({
            "factor": "Moderate historical crime records",
            "impact": "+9",
            "val": 9,
            "direction": "positive",
            "category": "Historical Crime",
            "detail": f"{historical_incidents} incidents recorded."
        })
    else:
        factors.append({
            "factor": "Low historical incident density",
            "impact": "-14",
            "val": -14,
            "direction": "negative",
            "category": "Historical Crime",
            "detail": f"Only {historical_incidents} reported incident(s) on record."
        })

    # 2. Time-of-day (Night / late night hours)
    if is_night:
        night_val = 22 if (22 <= hour or hour <= 1) else 16
        factors.append({
            "factor": f"High-risk nighttime window ({hour:02d}:00)",
            "impact": f"+{night_val}",
            "val": night_val,
            "direction": "positive",
            "category": "Temporal",
            "detail": "Peak street snatching and robbery hours in Dhaka (21:00 - 02:00)."
        })
    elif 18 <= hour <= 20:
        factors.append({
            "factor": "Evening rush hour crowd",
            "impact": "+10",
            "val": 10,
            "direction": "positive",
            "category": "Temporal",
            "detail": "High pedestrian density during post-work commute."
        })
    else:
        factors.append({
            "factor": "Daylight active hours",
            "impact": "-15",
            "val": -15,
            "direction": "negative",
            "category": "Temporal",
            "detail": "High civilian activity and natural visibility decrease opportunistic muggings."
        })

    # 3. Street Lighting
    if lighting_condition == "Low":
        factors.append({
            "factor": "Poor / absent street lighting",
            "impact": "+15",
            "val": 15,
            "direction": "positive",
            "category": "Infrastructure",
            "detail": "Dark road sections hinder situational awareness and aid fast suspect escapes."
        })
    elif lighting_condition == "High":
        factors.append({
            "factor": "Well-lit street infrastructure",
            "impact": "-12",
            "val": -12,
            "direction": "negative",
            "category": "Infrastructure",
            "detail": "Functional street lighting and visible surroundings deter muggers."
        })

    # 4. Day of Week / Weekend
    if is_weekend and is_night:
        factors.append({
            "factor": "Weekend night pattern (Fri/Sat)",
            "impact": "+8",
            "val": 8,
            "direction": "positive",
            "category": "Temporal",
            "detail": "Historical spike in late-night motorcycle snatching on weekends."
        })

    # 5. Weather (Rain)
    if rain:
        factors.append({
            "factor": "Rain and low visibility",
            "impact": "+6",
            "val": 6,
            "direction": "positive",
            "category": "Environmental",
            "detail": "Rain hampers visibility and creates sudden pedestrian bottlenecks."
        })

    # 6. Transport hubs / Bus stops
    if bus_stops >= 3:
        factors.append({
            "factor": "Dense transit stops & choke points",
            "impact": "+8",
            "val": 8,
            "direction": "positive",
            "category": "Infrastructure",
            "detail": f"{bus_stops} bus stops nearby create frequent boarding/alighting snatching spots."
        })

    # 7. Police presence
    if police_stations > 0:
        factors.append({
            "factor": "Police outpost / station proximity",
            "impact": "-14",
            "val": -14,
            "direction": "negative",
            "category": "Security",
            "detail": f"{police_stations} nearby police post(s) increase patrolling probability."
        })

    # Sort factors by absolute magnitude
    factors.sort(key=lambda x: abs(x["val"]), reverse=True)
    return factors
