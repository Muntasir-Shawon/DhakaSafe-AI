"""
DhakaSafe AI - Risk-Aware Road-Constrained Routing Engine
- Computes genuine street-constrained navigation paths using NetworkX DiGraph + OpenStreetMap.
- Generates 3 distinct route choices (Fastest, Balanced, Safest).
- High-precision road geometries: guarantees polylines strictly follow actual roads.
- Zero straight-line interpolation across buildings, lakes, or airfields.
- Full offline fallback using graph-embedded OSM road geometries.
"""

import os
import json
import itertools
import networkx as nx
from typing import Dict, Any, List, Optional, Tuple
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from ml.risk_predictor import predict_road_risk, get_road_network
from routing.osrm_client import get_osrm_waypoints_route, snap_to_nearest_node

def build_graph(hour: int = 22, day_of_week: str = "Friday", rain: int = 0) -> nx.DiGraph:
    net = get_road_network()
    G = nx.DiGraph()

    for nid, ninfo in net["nodes"].items():
        G.add_node(nid, **ninfo)

    for edge in net["edges"]:
        u = edge["from_node"]
        v = edge["to_node"]
        rid = edge["road_id"]

        pred = predict_road_risk(rid, hour=hour, day_of_week=day_of_week, rain=rain)
        risk = pred["risk_score"]
        t_min = edge.get("typical_travel_time_min", 2.0)
        length_m = edge.get("length_meters", 1000)

        edge_attrs = {
            "road_id": rid,
            "road_name": edge["road_name"],
            "travel_time_min": t_min,
            "length_meters": length_m,
            "risk_score": risk,
            "risk_level": pred["risk_level"],
            "risk_color": pred["risk_color"],
            "lighting_condition": edge.get("lighting_condition", "Medium"),
            "police_stations_nearby": edge.get("police_stations_nearby", 0),
            "commercial_density": edge.get("commercial_density", "Medium"),
            "coordinates": edge["coordinates"],
            "area": edge.get("area", ""),
            "thana": edge.get("thana", "")
        }

        # Forward edge (u -> v)
        G.add_edge(u, v, **edge_attrs)

        # Reverse edge (v -> u) with coordinates reversed to maintain driving order
        rev_attrs = dict(edge_attrs)
        rev_attrs["coordinates"] = list(reversed(edge["coordinates"]))
        G.add_edge(v, u, **rev_attrs)

    return G

def find_routes(
    origin_node: Optional[str] = None,
    dest_node: Optional[str] = None,
    hour: int = 22,
    day_of_week: str = "Friday",
    rain: int = 0,
    origin_coords: Optional[Tuple[float, float]] = None,
    dest_coords: Optional[Tuple[float, float]] = None
) -> Dict[str, Any]:
    G = build_graph(hour=hour, day_of_week=day_of_week, rain=rain)
    net = get_road_network()
    nodes_dict = net["nodes"]

    snapped_origin_pt = None
    snapped_dest_pt = None

    # Handle coordinate snapping if provided
    if origin_coords:
        snapped_orig_id, o_lat, o_lon, _ = snap_to_nearest_node(origin_coords[0], origin_coords[1], nodes_dict)
        origin_node = snapped_orig_id
        snapped_origin_pt = [o_lat, o_lon]

    if dest_coords:
        snapped_dst_id, d_lat, d_lon, _ = snap_to_nearest_node(dest_coords[0], dest_coords[1], nodes_dict)
        dest_node = snapped_dst_id
        snapped_dest_pt = [d_lat, d_lon]

    if not origin_node or origin_node not in G:
        origin_node = "NODE_DHANMONDI_27"
    if not dest_node or dest_node not in G:
        dest_node = "NODE_GULSHAN_2"

    if origin_node not in G:
        raise ValueError(f"Origin node '{origin_node}' not found in road network")
    if dest_node not in G:
        raise ValueError(f"Destination node '{dest_node}' not found in road network")

    # Generate candidate simple paths (up to 15 paths)
    try:
        candidate_paths = list(itertools.islice(nx.shortest_simple_paths(G, origin_node, dest_node, weight="travel_time_min"), 15))
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        candidate_paths = []

    if not candidate_paths:
        return {"origin_node": origin_node, "destination_node": dest_node, "routes": []}

    # Evaluate each candidate path on real road metrics
    evaluated = []
    for p in candidate_paths:
        t = sum(G[p[j]][p[j+1]]["travel_time_min"] for j in range(len(p)-1))
        d = sum(G[p[j]][p[j+1]]["length_meters"] for j in range(len(p)-1))
        r = sum(G[p[j]][p[j+1]]["risk_score"] * G[p[j]][p[j+1]]["length_meters"] for j in range(len(p)-1)) / max(1, d)
        max_r = max(G[p[j]][p[j+1]]["risk_score"] for j in range(len(p)-1))
        low_light = sum(1 for j in range(len(p)-1) if G[p[j]][p[j+1]].get("lighting_condition") == "Low")
        police = sum(G[p[j]][p[j+1]].get("police_stations_nearby", 0) for j in range(len(p)-1))

        # Balanced trade-off score
        balanced_score = t + 0.45 * ((r / 15.0) ** 1.35)
        # Safest priority score (penalizes risk and darkness, rewards police)
        safest_score = r + 0.15 * t + (low_light * 4.0) - (police * 1.5)

        evaluated.append({
            "nodes": p,
            "time": t,
            "dist": d,
            "avg_risk": r,
            "max_risk": max_r,
            "low_light": low_light,
            "police": police,
            "balanced_score": balanced_score,
            "safest_score": safest_score
        })

    # 1. Fastest Route: strictly minimum travel time
    p_fastest = evaluated[0]["nodes"]

    # 2. Balanced Route: optimal trade-off (best balanced_score)
    # Pick a distinct road corridor from fastest if viable (detour <= 4.5 min or <= 30%)
    sorted_by_balanced = sorted(evaluated, key=lambda x: x["balanced_score"])
    p_balanced = sorted_by_balanced[0]["nodes"]
    if p_balanced == p_fastest and len(sorted_by_balanced) > 1:
        for cand in sorted_by_balanced[1:]:
            if (cand["time"] - evaluated[0]["time"]) <= max(4.0, evaluated[0]["time"] * 0.30):
                p_balanced = cand["nodes"]
                break

    # 3. Safest Route: minimum safest_score (favors lowest risk & highest security)
    sorted_by_safest = sorted(evaluated, key=lambda x: (x["safest_score"], x["avg_risk"]))
    p_safest = sorted_by_safest[0]["nodes"]
    if (p_safest == p_fastest or p_safest == p_balanced) and len(sorted_by_safest) > 1:
        for cand in sorted_by_safest:
            if cand["nodes"] != p_fastest and cand["nodes"] != p_balanced:
                p_safest = cand["nodes"]
                break

    paths = [
        ("fastest", "Fastest Route", "Fastest", p_fastest, 0.0, "#3b82f6", False, "Direct shortest travel time using main corridors."),
        ("balanced", "Balanced Route", "Balanced", p_balanced, 0.45, "#06b6d4", True, "Recommended: Proven balance of low theft risk with minimal detour."),
        ("safest", "Safest Route", "Safest", p_safest, 1.25, "#10b981", False, "Maximal safety prioritization: Strongly favors well-lit, police-patrolled arterial roads.")
    ]

    routes_out = []
    fastest_time = 0.0
    fastest_risk = 0.0

    for idx, (mode_id, name, label, path_nodes, alpha, color, is_rec, desc) in enumerate(paths):
        total_time = 0.0
        total_dist_m = 0
        total_risk_weighted = 0.0
        max_risk = 0
        segments = []
        graph_coords = []
        waypoints = []

        for i in range(len(path_nodes)):
            nid = path_nodes[i]
            ndata = G.nodes[nid]
            waypoints.append((ndata["lat"], ndata["lon"]))

        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i+1]
            edata = G[u][v]

            t_seg = edata["travel_time_min"]
            r_seg = edata["risk_score"]
            dist_seg = edata["length_meters"]

            total_time += t_seg
            total_dist_m += dist_seg
            total_risk_weighted += (r_seg * dist_seg)
            if r_seg > max_risk:
                max_risk = r_seg

            coords = list(edata["coordinates"])
            if u == edata.get("to_node"):
                coords = list(reversed(coords))

            segments.append({
                "road_id": edata["road_id"],
                "road_name": edata["road_name"],
                "from_node": u,
                "to_node": v,
                "travel_time_min": t_seg,
                "length_meters": dist_seg,
                "risk_score": r_seg,
                "risk_level": edata["risk_level"],
                "risk_color": edata["risk_color"],
                "lighting_condition": edata["lighting_condition"],
                "coordinates": coords
            })

            for pt in coords:
                if not graph_coords or graph_coords[-1] != pt:
                    graph_coords.append(pt)

        # Attempt to get real end-to-end continuous OSM geometry
        osrm_res = get_osrm_waypoints_route(waypoints, timeout_sec=2.5)

        if osrm_res:
            final_path_coords = osrm_res[0]
            # Use real road distance & time from OSRM multi-waypoint
            total_km = round(osrm_res[1] / 1000.0, 2)
            total_time_min = round(max(total_time * 0.9, osrm_res[2] / 60.0), 1)
        else:
            # Full seamless graph-constrained fallback
            final_path_coords = graph_coords
            total_km = round(total_dist_m / 1000.0, 2)
            total_time_min = round(total_time, 1)

        avg_risk = int(round(total_risk_weighted / max(1, total_dist_m)))

        if mode_id == "fastest":
            fastest_time = total_time_min
            fastest_risk = avg_risk
            risk_reduction_pct = 0
            extra_mins = 0.0
        else:
            diff_risk = fastest_risk - avg_risk
            risk_reduction_pct = max(0, int(round((diff_risk / max(1, fastest_risk)) * 100))) if fastest_risk > 0 else 0
            extra_mins = round(max(0.0, total_time_min - fastest_time), 1)

        if avg_risk >= 75:
            overall_level = "VERY HIGH"
        elif avg_risk >= 55:
            overall_level = "HIGH"
        elif avg_risk >= 35:
            overall_level = "MEDIUM"
        else:
            overall_level = "LOW"

        routes_out.append({
            "id": mode_id,
            "label": label,
            "name": name,
            "description": desc,
            "color": color,
            "is_recommended": is_rec,
            "total_time_min": total_time_min,
            "total_distance_km": total_km,
            "average_risk_score": avg_risk,
            "max_risk_score": max_risk,
            "overall_risk_level": overall_level,
            "risk_reduction_pct": risk_reduction_pct,
            "extra_time_min": extra_mins,
            "node_count": len(path_nodes),
            "segments_count": len(segments),
            "path_coordinates": final_path_coords,
            "segments": segments
        })

    origin_pt = snapped_origin_pt or [G.nodes[origin_node]["lat"], G.nodes[origin_node]["lon"]]
    dest_pt = snapped_dest_pt or [G.nodes[dest_node]["lat"], G.nodes[dest_node]["lon"]]

    return {
        "origin_node": origin_node,
        "destination_node": dest_node,
        "origin_name": G.nodes[origin_node]["name"],
        "destination_name": G.nodes[dest_node]["name"],
        "origin_coords": origin_pt,
        "destination_coords": dest_pt,
        "hour": hour,
        "day_of_week": day_of_week,
        "rain": bool(rain),
        "routes": routes_out
    }
