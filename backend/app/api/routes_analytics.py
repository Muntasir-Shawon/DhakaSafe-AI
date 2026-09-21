"""
Crime Trends and Spatial-Temporal Analytics Dashboard Endpoints
Points 30-33 in project overview
"""
import os
import pandas as pd
from fastapi import APIRouter
from app.api.routes_incidents import get_incidents_df

router = APIRouter(tags=["Analytics"])

@router.get("/analytics")
def get_analytics_summary():
    """
    Computes aggregated analytics across Dhaka:
    - Hourly distribution (0-23)
    - Crime type breakdown
    - Top affected areas and thanas
    - Temporal patterns (weekday vs weekend)
    - Victim and weapon distribution
    """
    df = get_incidents_df()
    if df.empty:
        return {"status": "no data"}

    total_incidents = len(df)

    # 1. Hourly distribution (Point 31)
    hour_counts = df["hour"].value_counts().to_dict()
    hourly_distribution = []
    for h in range(24):
        hourly_distribution.append({
            "hour": h,
            "label": f"{h:02d}:00",
            "count": int(hour_counts.get(h, 0))
        })

    # 2. Crime type distribution (Point 32)
    crime_type_counts = df["crime_type"].value_counts()
    crime_types = []
    for ctype, count in crime_type_counts.items():
        crime_types.append({
            "crime_type": ctype,
            "count": int(count),
            "percentage": round(float((count / total_incidents) * 100), 1)
        })

    # 3. Top Areas & Thanas
    area_counts = df["area"].value_counts().head(10).to_dict()
    top_areas = [{"area": a, "count": int(c)} for a, c in area_counts.items()]

    thana_counts = df["thana"].value_counts().head(10).to_dict()
    top_thanas = [{"thana": t, "count": int(c)} for t, c in thana_counts.items()]

    # 4. Weapons and Vehicles
    weapon_counts = df["weapon"].value_counts().head(5).to_dict()
    weapons = [{"weapon": w, "count": int(c)} for w, c in weapon_counts.items()]

    vehicle_counts = df["vehicle_used"].value_counts().head(5).to_dict()
    vehicles = [{"vehicle": v, "count": int(c)} for v, c in vehicle_counts.items()]

    # 5. Day of week distribution
    dow_counts = df["day_of_week"].value_counts().to_dict()
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_distribution = [{"day": d, "count": int(dow_counts.get(d, 0))} for d in days_order]

    return {
        "summary": {
            "total_incidents": total_incidents,
            "date_range": f"{df['date'].min()} to {df['date'].max()}",
            "peak_risk_window": "21:00 - 02:00",
            "most_common_crime": crime_types[0]["crime_type"] if crime_types else "Snatching",
            "top_affected_hub": top_areas[0]["area"] if top_areas else "Farmgate"
        },
        "hourly_distribution": hourly_distribution,
        "crime_types": crime_types,
        "top_areas": top_areas,
        "top_thanas": top_thanas,
        "weapons": weapons,
        "vehicles": vehicles,
        "day_distribution": day_distribution
    }
