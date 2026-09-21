"""
Crime Incidents Querying and Hotspot Endpoints
"""
import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any

router = APIRouter(tags=["Crime Incidents"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
_INCIDENTS_DF = None
_HOTSPOTS = None

def get_incidents_df():
    global _INCIDENTS_DF
    if _INCIDENTS_DF is None:
        csv_path = os.path.join(DATA_DIR, "dhaka_crime_incidents.csv")
        if os.path.exists(csv_path):
            _INCIDENTS_DF = pd.read_csv(csv_path)
        else:
            _INCIDENTS_DF = pd.DataFrame()
    return _INCIDENTS_DF

def get_hotspots():
    global _HOTSPOTS
    if _HOTSPOTS is None:
        h_path = os.path.join(DATA_DIR, "dhaka_hotspots.json")
        if os.path.exists(h_path):
            with open(h_path, "r", encoding="utf-8") as f:
                _HOTSPOTS = json.load(f)
        else:
            _HOTSPOTS = []
    return _HOTSPOTS

@router.get("/incidents")
def list_incidents(
    crime_type: Optional[str] = None,
    area: Optional[str] = None,
    thana: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200)
):
    """
    Search and filter historical validated crime incidents.
    """
    df = get_incidents_df()
    if df.empty:
        return {"total": 0, "page": page, "page_size": page_size, "incidents": []}

    filtered = df
    if crime_type and crime_type.lower() != "all":
        filtered = filtered[filtered["crime_type"].str.lower() == crime_type.lower()]
    if area and area.lower() != "all":
        filtered = filtered[filtered["area"].str.lower() == area.lower()]
    if thana and thana.lower() != "all":
        filtered = filtered[filtered["thana"].str.lower() == thana.lower()]
    if search:
        s = search.lower()
        filtered = filtered[
            filtered["description"].str.lower().str.contains(s, na=False) |
            filtered["location_text"].str.lower().str.contains(s, na=False) |
            filtered["road_name"].str.lower().str.contains(s, na=False)
        ]

    total = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_df = filtered.iloc[start_idx:end_idx]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "incidents": page_df.to_dict(orient="records")
    }

@router.get("/hotspots")
def list_hotspots():
    """
    Returns spatial clusters (DBSCAN/KDE clusters) with high incident concentrations.
    """
    return {"hotspots": get_hotspots()}
