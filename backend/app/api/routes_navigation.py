"""
Navigation & Safe Route Routing Endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.routing.router import find_routes
from app.ml.risk_predictor import get_road_network

router = APIRouter(tags=["Navigation"])

class RouteRequest(BaseModel):
    origin_node: str
    destination_node: str
    hour: int = 22
    day_of_week: str = "Friday"
    rain: int = 0

@router.get("/nodes")
def get_navigation_nodes():
    """
    Returns list of all available intersection nodes with names, areas, and coordinates for routing dropdowns.
    """
    net = get_road_network()
    nodes_list = []
    for nid, data in net["nodes"].items():
        nodes_list.append({
            "id": nid,
            "name": data["name"],
            "area": data["area"],
            "thana": data["thana"],
            "lat": data["lat"],
            "lon": data["lon"]
        })
    # Sort alphabetically by area and name
    nodes_list.sort(key=lambda x: (x["area"], x["name"]))
    return {"nodes": nodes_list, "total": len(nodes_list)}

@router.post("/route")
def compute_route(req: RouteRequest):
    """
    Calculates Fastest, Balanced, and Safest routes between origin and destination.
    """
    try:
        result = find_routes(
            origin_node=req.origin_node,
            dest_node=req.destination_node,
            hour=req.hour,
            day_of_week=req.day_of_week,
            rain=req.rain
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing error: {str(e)}")
