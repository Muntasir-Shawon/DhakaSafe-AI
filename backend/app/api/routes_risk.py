"""
Dynamic Risk Assessment, Forecasting, and Explainability Endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.ml.risk_predictor import predict_road_risk, get_road_network, get_road_timeline
from app.ml.explainability import explain_road_risk

router = APIRouter(tags=["Risk & Forecasting"])

class RiskPredictionRequest(BaseModel):
    road_id: str
    hour: int = 22
    day_of_week: str = "Friday"
    rain: int = 0

@router.get("/roads")
def get_all_roads_with_risk(
    hour: int = Query(22, ge=0, le=23, description="Hour of the day (0-23)"),
    day_of_week: str = Query("Friday", description="Day of the week"),
    rain: int = Query(0, ge=0, le=1, description="1 if raining, 0 otherwise")
):
    """
    Returns all Dhaka road segments with their dynamic spatio-temporal risk score
    for the selected time and weather context. Powers the dynamic risk map!
    """
    net = get_road_network()
    roads = []
    for edge in net["edges"]:
        rid = edge["road_id"]
        pred = predict_road_risk(rid, hour=hour, day_of_week=day_of_week, rain=rain)
        roads.append({
            "road_id": rid,
            "road_name": edge["road_name"],
            "area": edge["area"],
            "thana": edge["thana"],
            "road_type": edge["road_type"],
            "length_meters": edge["length_meters"],
            "typical_travel_time_min": edge["typical_travel_time_min"],
            "lighting_condition": edge["lighting_condition"],
            "bus_stops_count": edge["bus_stops_count"],
            "police_stations_nearby": edge["police_stations_nearby"],
            "coordinates": edge["coordinates"],
            "risk_score": pred["risk_score"],
            "risk_level": pred["risk_level"],
            "risk_color": pred["risk_color"],
            "confidence": pred["confidence"],
            "historical_incidents": pred["historical_incidents"]
        })
    return {
        "hour": hour,
        "day_of_week": day_of_week,
        "rain": bool(rain),
        "total_roads": len(roads),
        "roads": roads
    }

@router.post("/predict-risk")
def predict_risk_and_explain(req: RiskPredictionRequest):
    """
    Predicts risk score and provides full SHAP factor attribution breakdown (Point 24).
    """
    try:
        pred = predict_road_risk(
            road_id=req.road_id,
            hour=req.hour,
            day_of_week=req.day_of_week,
            rain=req.rain
        )
        factors = explain_road_risk(
            road_name=pred["road_name"],
            risk_score=pred["risk_score"],
            hour=req.hour,
            day_of_week=req.day_of_week,
            lighting_condition=pred["lighting_condition"],
            historical_incidents=pred["historical_incidents"],
            rain=req.rain,
            bus_stops=pred["bus_stops_count"],
            police_stations=pred["police_stations_nearby"]
        )
        return {
            "prediction": pred,
            "explanation_factors": factors,
            "summary": f"AI predicted a risk score of {pred['risk_score']}/100 ({pred['risk_level']} RISK) with {pred['confidence']}% data support confidence."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/road/{road_id}/timeline")
def get_road_timeline_view(
    road_id: str,
    day_of_week: str = "Friday",
    rain: int = 0
):
    """
    Returns the 24-hour diurnal risk curve for a specific road (Point 44 in doc).
    """
    try:
        timeline = get_road_timeline(road_id=road_id, day_of_week=day_of_week, rain=rain)
        net = get_road_network()
        edges_dict = {e["road_id"]: e for e in net["edges"]}
        edge = edges_dict.get(road_id, {})
        return {
            "road_id": road_id,
            "road_name": edge.get("road_name", road_id),
            "area": edge.get("area", ""),
            "thana": edge.get("thana", ""),
            "day_of_week": day_of_week,
            "rain": bool(rain),
            "timeline": timeline
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/forecast")
def get_area_forecast(
    day_of_week: str = "Friday",
    hour: int = 23,
    rain: int = 0
):
    """
    Point 43 in document: 'What will the risk be tonight?'
    Generates area-level risk predictions for key Dhaka neighborhoods.
    """
    net = get_road_network()
    # Group roads by area
    area_roads = {}
    for edge in net["edges"]:
        area = edge["area"]
        if area not in area_roads:
            area_roads[area] = []
        area_roads[area].append(edge["road_id"])

    # Target key areas mentioned in Point 43
    target_areas = [
        "Farmgate", "Dhanmondi", "Mohammadpur", "Gulshan", "Jatrabari",
        "Mirpur", "Uttara", "Mohakhali", "Shahbagh", "Sayedabad", "Motijheel"
    ]

    forecasts = []
    for area in target_areas:
        r_ids = area_roads.get(area, [])
        if not r_ids:
            continue
        scores = []
        for rid in r_ids:
            p = predict_road_risk(rid, hour=hour, day_of_week=day_of_week, rain=rain)
            scores.append(p["risk_score"])
        avg_score = int(round(sum(scores) / len(scores)))

        if avg_score >= 75:
            lvl = "VERY HIGH"
            col = "#ef4444"
        elif avg_score >= 55:
            lvl = "HIGH"
            col = "#f97316"
        elif avg_score >= 35:
            lvl = "MEDIUM"
            col = "#eab308"
        else:
            lvl = "LOW"
            col = "#10b981"

        forecasts.append({
            "area": area,
            "predicted_risk_score": avg_score,
            "risk_level": lvl,
            "risk_color": col,
            "road_segments_evaluated": len(scores)
        })

    forecasts.sort(key=lambda x: x["predicted_risk_score"], reverse=True)
    return {
        "day_of_week": day_of_week,
        "hour": hour,
        "time_str": f"{hour:02d}:00",
        "rain": bool(rain),
        "forecasts": forecasts
    }
