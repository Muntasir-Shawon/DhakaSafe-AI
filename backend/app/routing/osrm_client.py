"""
DhakaSafe AI - OSRM Road Routing Client & Snapping Utility
- Connects to OpenStreetMap / OSRM for street-constrained routing geometry.
- Provides nearest road/node coordinate snapping for markers.
- In-memory cache for ultra-fast responses.
- Resilient fallback if remote routing service is unavailable.
"""

import json
import math
import urllib.request
import urllib.error
from typing import List, Tuple, Optional, Dict, Any

_GEOMETRY_CACHE: Dict[str, Tuple[List[List[float]], float, float]] = {}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def snap_to_nearest_node(lat: float, lon: float, nodes: Dict[str, Any]) -> Tuple[str, float, float, float]:
    best_node_id = None
    min_dist = float('inf')
    best_lat = lat
    best_lon = lon

    for nid, ndata in nodes.items():
        nlat = ndata['lat']
        nlon = ndata['lon']
        d = haversine_distance(lat, lon, nlat, nlon)
        if d < min_dist:
            min_dist = d
            best_node_id = nid
            best_lat = nlat
            best_lon = nlon

    return best_node_id, best_lat, best_lon, min_dist

def get_osrm_waypoints_route(
    waypoints: List[Tuple[float, float]],
    timeout_sec: float = 3.5
) -> Optional[Tuple[List[List[float]], float, float]]:
    if len(waypoints) < 2:
        return None

    cache_key = ";".join([f"{round(lat, 5)},{round(lon, 5)}" for lat, lon in waypoints])
    if cache_key in _GEOMETRY_CACHE:
        return _GEOMETRY_CACHE[cache_key]

    coords_param = ";".join([f"{lon:.6f},{lat:.6f}" for lat, lon in waypoints])
    url = f"https://router.project-osrm.org/route/v1/driving/{coords_param}?overview=full&geometries=geojson"

    req = urllib.request.Request(url, headers={"User-Agent": "DhakaSafe-AI-Router/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                route = data["routes"][0]
                leaflet_coords = [[round(pt[1], 6), round(pt[0], 6)] for pt in route["geometry"]["coordinates"]]
                dist_m = float(route["distance"])
                dur_s = float(route["duration"])
                res = (leaflet_coords, dist_m, dur_s)
                _GEOMETRY_CACHE[cache_key] = res
                return res
    except Exception:
        pass

    return None
