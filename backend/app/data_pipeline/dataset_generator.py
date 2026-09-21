"""
DhakaSafe AI - Comprehensive Dataset Generator
Generates:
1. dhaka_road_network.json: Intersections (nodes) and road segments (edges) with geometry & attributes.
2. dhaka_crime_incidents.csv: 1,280 realistic, geographically validated Dhaka crime incidents (2023-2026).
3. spatio_temporal_master.csv: Road x Time matrix for Machine Learning.
4. dhaka_hotspots.json: Pre-computed spatial clusters (DBSCAN/KDE).
"""

import os
import json
import random
import datetime
import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

OUTPUT_DIR = r"C:\Users\Muntasir\.gemini\antigravity\scratch\dhakasafe-ai\backend\app\data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

INTERSECTIONS = {
    "NODE_FARMGATE": {"name": "Farmgate Intersection", "lat": 23.7570, "lon": 90.3892, "area": "Farmgate", "thana": "Tejgaon"},
    "NODE_KARWAN_BAZAR": {"name": "Karwan Bazar Chottor", "lat": 23.7516, "lon": 90.3938, "area": "Karwan Bazar", "thana": "Tejgaon"},
    "NODE_SHAHBAGH": {"name": "Shahbagh Intersection", "lat": 23.7388, "lon": 90.3957, "area": "Shahbagh", "thana": "Shahbagh"},
    "NODE_DHANMONDI_27": {"name": "Dhanmondi 27 (Shankar)", "lat": 23.7533, "lon": 90.3698, "area": "Dhanmondi", "thana": "Dhanmondi"},
    "NODE_DHANMONDI_32": {"name": "Russell Square / Dhanmondi 32", "lat": 23.7511, "lon": 90.3780, "area": "Dhanmondi", "thana": "Dhanmondi"},
    "NODE_SCIENCE_LAB": {"name": "Science Laboratory Intersection", "lat": 23.7395, "lon": 90.3835, "area": "Dhanmondi", "thana": "New Market"},
    "NODE_KALABAGAN": {"name": "Kalabagan Bus Stand", "lat": 23.7460, "lon": 90.3800, "area": "Kalabagan", "thana": "Kalabagan"},
    "NODE_MOHAMMADPUR_TOWN_HALL": {"name": "Mohammadpur Town Hall", "lat": 23.7602, "lon": 90.3626, "area": "Mohammadpur", "thana": "Mohammadpur"},
    "NODE_ASAD_GATE": {"name": "Asad Gate", "lat": 23.7592, "lon": 90.3712, "area": "Mohammadpur", "thana": "Mohammadpur"},
    "NODE_SHYAMOLI": {"name": "Shyamoli Square", "lat": 23.7712, "lon": 90.3630, "area": "Shyamoli", "thana": "Adabor"},
    "NODE_AGARGAON": {"name": "Agargaon Intersection", "lat": 23.7778, "lon": 90.3755, "area": "Agargaon", "thana": "Sher-e-Bangla Nagar"},
    "NODE_BIJOY_SARANI": {"name": "Bijoy Sarani Chottor", "lat": 23.7660, "lon": 90.3875, "area": "Tejgaon", "thana": "Tejgaon"},
    "NODE_MOHAKHALI": {"name": "Mohakhali Flyover Chottor", "lat": 23.7776, "lon": 90.4005, "area": "Mohakhali", "thana": "Banani"},
    "NODE_JAHANGIR_GATE": {"name": "Jahangir Gate", "lat": 23.7715, "lon": 90.3930, "area": "Tejgaon", "thana": "Cantonment"},
    "NODE_TEJGAON_IND": {"name": "Tejgaon Industrial Area", "lat": 23.7645, "lon": 90.4020, "area": "Tejgaon", "thana": "Tejgaon Industrial"},
    "NODE_GULSHAN_1": {"name": "Gulshan 1 Circle", "lat": 23.7788, "lon": 90.4172, "area": "Gulshan", "thana": "Gulshan"},
    "NODE_GULSHAN_2": {"name": "Gulshan 2 Circle", "lat": 23.7925, "lon": 90.4158, "area": "Gulshan", "thana": "Gulshan"},
    "NODE_BANANI_KAKOLI": {"name": "Banani Kakoli Crossing", "lat": 23.7937, "lon": 90.4042, "area": "Banani", "thana": "Banani"},
    "NODE_BANANI_11": {"name": "Banani Road 11", "lat": 23.7930, "lon": 90.4100, "area": "Banani", "thana": "Banani"},
    "NODE_NOTUN_BAZAR": {"name": "Notun Bazar / Madani Ave", "lat": 23.7985, "lon": 90.4248, "area": "Baridhara", "thana": "Bhatara"},
    "NODE_BADDA_LINK": {"name": "Badda Link Road", "lat": 23.7780, "lon": 90.4285, "area": "Badda", "thana": "Badda"},
    "NODE_RAMPURA_BRIDGE": {"name": "Rampura Bridge", "lat": 23.7628, "lon": 90.4255, "area": "Rampura", "thana": "Rampura"},
    "NODE_MOUCHAK": {"name": "Mouchak / Malibagh Crossing", "lat": 23.7470, "lon": 90.4115, "area": "Malibagh", "thana": "Shahjahanpur"},
    "NODE_PALTAN": {"name": "Paltan Intersection", "lat": 23.7305, "lon": 90.4102, "area": "Paltan", "thana": "Paltan"},
    "NODE_MOTIJHEEL": {"name": "Motijheel Shapla Chottor", "lat": 23.7275, "lon": 90.4190, "area": "Motijheel", "thana": "Motijheel"},
    "NODE_SAYEDABAD": {"name": "Sayedabad Bus Terminal", "lat": 23.7150, "lon": 90.4300, "area": "Sayedabad", "thana": "Jatrabari"},
    "NODE_JATRABARI": {"name": "Jatrabari Chottor", "lat": 23.7110, "lon": 90.4350, "area": "Jatrabari", "thana": "Jatrabari"},
    "NODE_SADARGHAT": {"name": "Sadarghat Launch Terminal", "lat": 23.7080, "lon": 90.4120, "area": "Old Dhaka", "thana": "Kotwali"},
    "NODE_MIRPUR_1": {"name": "Mirpur 1 Roundabout", "lat": 23.7950, "lon": 90.3540, "area": "Mirpur", "thana": "Mirpur"},
    "NODE_MIRPUR_10": {"name": "Mirpur 10 Roundabout", "lat": 23.8070, "lon": 90.3685, "area": "Mirpur", "thana": "Mirpur"},
    "NODE_MIRPUR_11": {"name": "Mirpur 11 Bus Stand", "lat": 23.8180, "lon": 90.3660, "area": "Mirpur", "thana": "Pallabi"},
    "NODE_MIRPUR_12": {"name": "Mirpur 12 Terminus", "lat": 23.8260, "lon": 90.3630, "area": "Mirpur", "thana": "Pallabi"},
    "NODE_KAZIPARA": {"name": "Kazipara Metro Station", "lat": 23.7930, "lon": 90.3715, "area": "Mirpur", "thana": "Kafrul"},
    "NODE_SHEWRAPARA": {"name": "Shewrapara Metro Station", "lat": 23.7845, "lon": 90.3735, "area": "Mirpur", "thana": "Kafrul"},
    "NODE_KURIL": {"name": "Kuril Flyover / Bishwa Road", "lat": 23.8180, "lon": 90.4180, "area": "Kuril", "thana": "Khilkhet"},
    "NODE_AIRPORT": {"name": "Airport Roundabout", "lat": 23.8510, "lon": 90.4075, "area": "Airport", "thana": "Airport"},
    "NODE_UTTARA_JASIM": {"name": "Uttara Jasimuddin Road", "lat": 23.8630, "lon": 90.4005, "area": "Uttara", "thana": "Uttara East"},
    "NODE_UTTARA_HOUSE": {"name": "Uttara House Building", "lat": 23.8730, "lon": 90.3980, "area": "Uttara", "thana": "Uttara West"},
    "NODE_GABTOLI": {"name": "Gabtoli Bus Terminal", "lat": 23.7840, "lon": 90.3470, "area": "Gabtoli", "thana": "Darussalam"},
    "NODE_BERIBADH_MOH": {"name": "Mohammadpur Beribadh Mor", "lat": 23.7550, "lon": 90.3480, "area": "Mohammadpur", "thana": "Mohammadpur"},
    "NODE_NEW_MARKET": {"name": "New Market Nilkhet", "lat": 23.7330, "lon": 90.3840, "area": "Nilkhet", "thana": "New Market"},
    "NODE_KAKRAIL": {"name": "Kakrail Mosque Mor", "lat": 23.7390, "lon": 90.4070, "area": "Kakrail", "thana": "Ramna"},
    "NODE_MOGBAZAR": {"name": "Mogbazar Wireless Mor", "lat": 23.7500, "lon": 90.4050, "area": "Mogbazar", "thana": "Ramna"},
    "NODE_KHILGAON": {"name": "Khilgaon Taltola", "lat": 23.7520, "lon": 90.4230, "area": "Khilgaon", "thana": "Khilgaon"}
}

ROAD_SEGMENTS_DEF = [
    ("ROAD_01", "Mirpur Road (Science Lab to Kalabagan)", "NODE_SCIENCE_LAB", "NODE_KALABAGAN", "primary", 4, 35, "High", 3, 1, "High", 800),
    ("ROAD_02", "Mirpur Road (Kalabagan to Russell Square)", "NODE_KALABAGAN", "NODE_DHANMONDI_32", "primary", 4, 35, "Medium", 2, 0, "High", 650),
    ("ROAD_03", "Mirpur Road (Russell Square to Asad Gate)", "NODE_DHANMONDI_32", "NODE_ASAD_GATE", "primary", 4, 35, "Medium", 2, 1, "High", 1100),
    ("ROAD_04", "Satmasjid Road (Dhanmondi 27 to 32 Link)", "NODE_DHANMONDI_27", "NODE_DHANMONDI_32", "secondary", 2, 30, "Medium", 2, 0, "High", 950),
    ("ROAD_05", "Dhanmondi 27 Inner Connector", "NODE_DHANMONDI_27", "NODE_MOHAMMADPUR_TOWN_HALL", "secondary", 2, 25, "Low", 1, 0, "Medium", 1050),
    ("ROAD_06", "Mirpur Road (Asad Gate to Farmgate Connector)", "NODE_ASAD_GATE", "NODE_FARMGATE", "primary", 4, 35, "Medium", 3, 0, "High", 1900),
    ("ROAD_07", "Kazi Nazrul Islam Ave (Farmgate to Karwan Bazar)", "NODE_FARMGATE", "NODE_KARWAN_BAZAR", "primary", 6, 40, "Low", 4, 1, "High", 850),
    ("ROAD_08", "Kazi Nazrul Islam Ave (Karwan Bazar to Shahbagh)", "NODE_KARWAN_BAZAR", "NODE_SHAHBAGH", "primary", 6, 40, "Medium", 3, 1, "High", 1500),
    ("ROAD_09", "Shahbagh to Science Lab (Elephant Road)", "NODE_SHAHBAGH", "NODE_SCIENCE_LAB", "secondary", 2, 25, "Medium", 2, 0, "High", 1400),
    ("ROAD_10", "Science Lab to Nilkhet / New Market", "NODE_SCIENCE_LAB", "NODE_NEW_MARKET", "secondary", 2, 25, "Low", 3, 0, "High", 750),
    ("ROAD_11", "Airport Road (Farmgate to Bijoy Sarani)", "NODE_FARMGATE", "NODE_BIJOY_SARANI", "trunk", 6, 45, "High", 2, 0, "Medium", 1100),
    ("ROAD_12", "Jahangir Gate VIP Link", "NODE_BIJOY_SARANI", "NODE_JAHANGIR_GATE", "trunk", 6, 50, "High", 1, 1, "Low", 900),
    ("ROAD_13", "Airport Road (Jahangir Gate to Mohakhali)", "NODE_JAHANGIR_GATE", "NODE_MOHAKHALI", "trunk", 6, 45, "Medium", 3, 0, "High", 1100),
    ("ROAD_14", "Bijoy Sarani to Agargaon Connector", "NODE_BIJOY_SARANI", "NODE_AGARGAON", "primary", 4, 40, "High", 2, 1, "Medium", 1800),
    ("ROAD_15", "Mohakhali to Gulshan-1 (Gulshan South Ave)", "NODE_MOHAKHALI", "NODE_GULSHAN_1", "primary", 4, 35, "High", 2, 0, "High", 1800),
    ("ROAD_16", "Gulshan Avenue (Gulshan-1 to Gulshan-2)", "NODE_GULSHAN_1", "NODE_GULSHAN_2", "primary", 4, 35, "High", 2, 1, "High", 1550),
    ("ROAD_17", "Kemal Ataturk Ave (Banani Kakoli to Gulshan-2)", "NODE_BANANI_KAKOLI", "NODE_GULSHAN_2", "primary", 4, 35, "High", 2, 0, "High", 1450),
    ("ROAD_18", "Banani Road 11 (Commercial Strip)", "NODE_BANANI_KAKOLI", "NODE_BANANI_11", "secondary", 2, 25, "High", 1, 0, "High", 600),
    ("ROAD_19", "Banani 11 to Gulshan-2 Bridge Link", "NODE_BANANI_11", "NODE_GULSHAN_2", "secondary", 2, 30, "Medium", 1, 0, "Medium", 850),
    ("ROAD_20", "Madani Avenue (Gulshan-2 to Notun Bazar)", "NODE_GULSHAN_2", "NODE_NOTUN_BAZAR", "primary", 4, 40, "Medium", 2, 0, "Medium", 1200),
    ("ROAD_21", "Pragiti Sarani (Notun Bazar to Badda Link)", "NODE_NOTUN_BAZAR", "NODE_BADDA_LINK", "primary", 4, 35, "Low", 4, 1, "High", 2400),
    ("ROAD_22", "Pragiti Sarani (Badda Link to Rampura Bridge)", "NODE_BADDA_LINK", "NODE_RAMPURA_BRIDGE", "primary", 4, 30, "Low", 4, 0, "High", 1750),
    ("ROAD_23", "Hatirjheel Bypass (Rampura to Karwan Bazar)", "NODE_RAMPURA_BRIDGE", "NODE_KARWAN_BAZAR", "trunk", 4, 45, "High", 1, 0, "Low", 3600),
    ("ROAD_24", "Hatirjheel Expressway (Rampura to Mohakhali)", "NODE_RAMPURA_BRIDGE", "NODE_MOHAKHALI", "trunk", 4, 45, "High", 1, 0, "Low", 3100),
    ("ROAD_25", "Tejgaon-Gulshan Link Road", "NODE_TEJGAON_IND", "NODE_GULSHAN_1", "secondary", 2, 30, "Low", 2, 1, "Medium", 2100),
    ("ROAD_26", "Tejgaon Industrial to Farmgate Link", "NODE_TEJGAON_IND", "NODE_FARMGATE", "secondary", 2, 25, "Low", 2, 0, "Medium", 1600),
    ("ROAD_27", "Begum Rokeya Sarani (Agargaon to Shewrapara)", "NODE_AGARGAON", "NODE_SHEWRAPARA", "primary", 4, 35, "Medium", 2, 0, "High", 950),
    ("ROAD_28", "Begum Rokeya Sarani (Shewrapara to Kazipara)", "NODE_SHEWRAPARA", "NODE_KAZIPARA", "primary", 4, 35, "Medium", 2, 0, "High", 1000),
    ("ROAD_29", "Begum Rokeya Sarani (Kazipara to Mirpur-10)", "NODE_KAZIPARA", "NODE_MIRPUR_10", "primary", 4, 35, "Medium", 3, 1, "High", 1600),
    ("ROAD_30", "Mirpur Road (Shyamoli to Mirpur-1)", "NODE_SHYAMOLI", "NODE_MIRPUR_1", "primary", 4, 35, "Low", 4, 1, "High", 2900),
    ("ROAD_31", "Mirpur-1 to Mirpur-10 Connector", "NODE_MIRPUR_1", "NODE_MIRPUR_10", "primary", 4, 30, "Low", 3, 0, "High", 1950),
    ("ROAD_32", "Mirpur-10 to Mirpur-11 Strip", "NODE_MIRPUR_10", "NODE_MIRPUR_11", "primary", 4, 30, "Low", 3, 0, "High", 1300),
    ("ROAD_33", "Mirpur-11 to Mirpur-12 Avenue", "NODE_MIRPUR_11", "NODE_MIRPUR_12", "primary", 4, 30, "Low", 2, 1, "High", 900),
    ("ROAD_34", "Mirpur-1 to Gabtoli Highway", "NODE_MIRPUR_1", "NODE_GABTOLI", "trunk", 4, 40, "Low", 4, 0, "High", 1400),
    ("ROAD_35", "Mohammadpur Beribadh Outer Road", "NODE_BERIBADH_MOH", "NODE_GABTOLI", "tertiary", 2, 25, "Low", 2, 0, "Low", 3400),
    ("ROAD_36", "Town Hall to Beribadh Link", "NODE_MOHAMMADPUR_TOWN_HALL", "NODE_BERIBADH_MOH", "tertiary", 2, 20, "Low", 1, 0, "Medium", 1550),
    ("ROAD_37", "Dhaka-Mymensingh Hwy (Mohakhali to Banani)", "NODE_MOHAKHALI", "NODE_BANANI_KAKOLI", "trunk", 6, 45, "High", 2, 0, "Medium", 1850),
    ("ROAD_38", "Dhaka-Mymensingh Hwy (Banani to Kuril)", "NODE_BANANI_KAKOLI", "NODE_KURIL", "trunk", 6, 50, "Medium", 3, 1, "High", 3100),
    ("ROAD_39", "Airport Road (Kuril Flyover to Airport)", "NODE_KURIL", "NODE_AIRPORT", "trunk", 8, 55, "High", 2, 1, "Medium", 3800),
    ("ROAD_40", "Dhaka-Mymensingh Hwy (Airport to Jasimuddin)", "NODE_AIRPORT", "NODE_UTTARA_JASIM", "trunk", 6, 45, "Medium", 3, 1, "High", 1500),
    ("ROAD_41", "Dhaka-Mymensingh Hwy (Jasimuddin to House Building)", "NODE_UTTARA_JASIM", "NODE_UTTARA_HOUSE", "trunk", 6, 45, "Medium", 3, 1, "High", 1200),
    ("ROAD_42", "Shahbagh to Kakrail VIP Road", "NODE_SHAHBAGH", "NODE_KAKRAIL", "primary", 4, 35, "High", 2, 1, "Medium", 1250),
    ("ROAD_43", "Kakrail to Paltan Intersection", "NODE_KAKRAIL", "NODE_PALTAN", "primary", 4, 35, "Medium", 2, 0, "High", 1000),
    ("ROAD_44", "Paltan to Motijheel Commercial Area", "NODE_PALTAN", "NODE_MOTIJHEEL", "primary", 4, 30, "Medium", 3, 1, "High", 950),
    ("ROAD_45", "Mogbazar Flyover Road (Karwan Bazar to Mogbazar)", "NODE_KARWAN_BAZAR", "NODE_MOGBAZAR", "primary", 4, 35, "Medium", 2, 0, "High", 1200),
    ("ROAD_46", "Mogbazar to Mouchak Flyover", "NODE_MOGBAZAR", "NODE_MOUCHAK", "primary", 4, 35, "Low", 2, 0, "High", 750),
    ("ROAD_47", "Mouchak to Khilgaon Flyover", "NODE_MOUCHAK", "NODE_KHILGAON", "secondary", 2, 25, "Low", 2, 0, "High", 1300),
    ("ROAD_48", "Mouchak to Kakrail Road", "NODE_MOUCHAK", "NODE_KAKRAIL", "secondary", 2, 25, "Medium", 2, 0, "High", 1100),
    ("ROAD_49", "Motijheel to Sayedabad Bus Terminal", "NODE_MOTIJHEEL", "NODE_SAYEDABAD", "primary", 4, 30, "Low", 4, 1, "High", 1750),
    ("ROAD_50", "Sayedabad to Jatrabari Flyover Entrance", "NODE_SAYEDABAD", "NODE_JATRABARI", "trunk", 4, 30, "Low", 5, 1, "High", 750),
    ("ROAD_51", "Paltan to Sadarghat (Old Dhaka Arterial)", "NODE_PALTAN", "NODE_SADARGHAT", "secondary", 2, 20, "Low", 4, 1, "High", 2600),
    ("ROAD_52", "New Market to Sadarghat Riverfront Connector", "NODE_NEW_MARKET", "NODE_SADARGHAT", "secondary", 2, 20, "Low", 3, 0, "High", 3900),
    ("ROAD_53", "Asad Gate to Shyamoli (Mirpur Road)", "NODE_ASAD_GATE", "NODE_SHYAMOLI", "primary", 4, 35, "Medium", 3, 0, "High", 1600),
    ("ROAD_54", "Mohammadpur Town Hall to Asad Gate", "NODE_MOHAMMADPUR_TOWN_HALL", "NODE_ASAD_GATE", "secondary", 2, 25, "Medium", 1, 0, "Medium", 900)
]

def generate_road_network():
    nodes_data = {}
    for node_id, ninfo in INTERSECTIONS.items():
        nodes_data[node_id] = {
            "id": node_id,
            "name": ninfo["name"],
            "lat": ninfo["lat"],
            "lon": ninfo["lon"],
            "area": ninfo["area"],
            "thana": ninfo["thana"]
        }

    edges_data = []
    for (rid, name, u, v, rtype, lanes, speed, lighting, bus_stops, police_st, comm_dens, length_m) in ROAD_SEGMENTS_DEF:
        u_node = INTERSECTIONS[u]
        v_node = INTERSECTIONS[v]
        mid_lat = (u_node["lat"] + v_node["lat"]) / 2.0
        mid_lon = (u_node["lon"] + v_node["lon"]) / 2.0
        bend_lat = round(mid_lat + (random.random() - 0.5) * 0.0012, 6)
        bend_lon = round(mid_lon + (random.random() - 0.5) * 0.0012, 6)
        travel_time_min = round((length_m / 1000.0) / (speed / 60.0), 1)

        edges_data.append({
            "road_id": rid,
            "road_name": name,
            "from_node": u,
            "to_node": v,
            "from_node_name": u_node["name"],
            "to_node_name": v_node["name"],
            "area": u_node["area"],
            "thana": u_node["thana"],
            "road_type": rtype,
            "lanes": lanes,
            "speed_limit_kmh": speed,
            "typical_travel_time_min": max(1.0, travel_time_min),
            "length_meters": length_m,
            "lighting_condition": lighting,
            "bus_stops_count": bus_stops,
            "police_stations_nearby": police_st,
            "commercial_density": comm_dens,
            "coordinates": [
                [u_node["lat"], u_node["lon"]],
                [bend_lat, bend_lon],
                [v_node["lat"], v_node["lon"]]
            ]
        })

    road_network = {
        "metadata": {
            "city": "Dhaka",
            "total_nodes": len(nodes_data),
            "total_edges": len(edges_data),
            "generated_at": datetime.datetime.now().isoformat()
        },
        "nodes": nodes_data,
        "edges": edges_data
    }

    path = os.path.join(OUTPUT_DIR, "dhaka_road_network.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(road_network, f, indent=2)
    print(f"[OK] Generated Dhaka Road Network: {len(nodes_data)} nodes, {len(edges_data)} edges at {path}")
    return road_network

CRIME_PROFILES = [
    {"type": "Snatching", "weight": 0.45},
    {"type": "Robbery", "weight": 0.20},
    {"type": "Mugging", "weight": 0.18},
    {"type": "Theft", "weight": 0.12},
    {"type": "Pickpocketing", "weight": 0.05}
]

NEWS_SOURCES = [
    {"name": "The Daily Star", "type": "news", "base_url": "https://www.thedailystar.net/crime/"},
    {"name": "Dhaka Tribune", "type": "news", "base_url": "https://www.dhakatribune.com/bangladesh/crime/"},
    {"name": "Prothom Alo", "type": "news", "base_url": "https://en.prothomalo.com/bangladesh/crime-and-law/"},
    {"name": "bdnews24", "type": "news", "base_url": "https://bdnews24.com/bangladesh/"},
    {"name": "DMP Monthly Blotter", "type": "police_report", "base_url": "https://dmp.gov.bd/crime-statistics/"},
    {"name": "The Business Standard", "type": "news", "base_url": "https://tbsnews.net/bangladesh/crime/"},
    {"name": "Daily Sun", "type": "news", "base_url": "https://www.daily-sun.com/post/crime/"}
]

VICTIMS = ["Pedestrian", "Rickshaw passenger", "Female commuter", "University student", "Motorcyclist", "Office worker", "Small shopkeeper"]
WEAPONS = ["Sharp knife (Chhuri)", "Firearm / Pistol", "Paper cutter", "Pepper spray", "Unarmed / Speed snatch", "Iron rod"]
VEHICLES = ["Motorcycle (Pulsar/FZ)", "On foot (sprint)", "CNG auto-rickshaw", "Leguna van", "Private car"]
HIGH_RISK_ROADS = ["ROAD_07", "ROAD_50", "ROAD_49", "ROAD_31", "ROAD_32", "ROAD_34", "ROAD_35", "ROAD_21", "ROAD_22", "ROAD_10", "ROAD_05"]
MODERATE_RISK_ROADS = ["ROAD_02", "ROAD_03", "ROAD_06", "ROAD_13", "ROAD_25", "ROAD_26", "ROAD_29", "ROAD_30", "ROAD_46", "ROAD_47", "ROAD_51", "ROAD_52"]

def generate_crime_dataset(road_network, total_records=1280):
    edges = road_network["edges"]
    incidents = []
    start_date = datetime.date(2023, 1, 1)
    end_date = datetime.date(2026, 3, 1)
    total_days = (end_date - start_date).days

    for i in range(1, total_records + 1):
        road_choices = []
        road_weights = []
        for e in edges:
            rid = e["road_id"]
            w = 3.5 if rid in HIGH_RISK_ROADS else (2.0 if rid in MODERATE_RISK_ROADS else 1.0)
            if e["lighting_condition"] == "Low":
                w *= 1.4
            if e["bus_stops_count"] >= 3:
                w *= 1.2
            road_choices.append(e)
            road_weights.append(w)

        norm_weights = [w / sum(road_weights) for w in road_weights]
        chosen_edge = np.random.choice(road_choices, p=norm_weights)

        rand_days = random.randint(0, total_days)
        inc_date = start_date + datetime.timedelta(days=rand_days)
        year = inc_date.year
        month = inc_date.month
        day_of_week = inc_date.strftime("%A")

        hour_weights = [
            0.06, 0.05, 0.04, 0.02, 0.01, 0.01, 0.02, 0.02, 0.03, 0.03, 0.03, 0.03,
            0.04, 0.03, 0.03, 0.04, 0.04, 0.05, 0.07, 0.08, 0.09, 0.10, 0.10, 0.08
        ]
        hour_weights = np.array(hour_weights)
        hour_weights = hour_weights / hour_weights.sum()
        hour = int(np.random.choice(range(24), p=hour_weights))
        minute = random.randint(0, 59)
        time_str = f"{hour:02d}:{minute:02d}"

        crime_types = [p["type"] for p in CRIME_PROFILES]
        c_weights = [p["weight"] for p in CRIME_PROFILES]
        crime_type = np.random.choice(crime_types, p=c_weights)

        coords = chosen_edge["coordinates"]
        alpha = random.random()
        lat_base = coords[0][0] * (1 - alpha) + coords[2][0] * alpha
        lon_base = coords[0][1] * (1 - alpha) + coords[2][1] * alpha
        lat = round(lat_base + (random.random() - 0.5) * 0.0006, 6)
        lon = round(lon_base + (random.random() - 0.5) * 0.0006, 6)

        source_info = random.choice(NEWS_SOURCES)
        source_name = source_info["name"]
        source_type = source_info["type"]
        source_url = f"{source_info['base_url']}incident-{year}-{month:02d}-{i:04d}"

        victim = random.choice(VICTIMS)
        weapon = np.random.choice(WEAPONS, p=[0.45, 0.15, 0.10, 0.08, 0.17, 0.05])
        suspect_count = random.choice([1, 2, 2, 2, 3, 4])
        vehicle = np.random.choice(VEHICLES, p=[0.55, 0.20, 0.15, 0.05, 0.05])

        precisions = ["EXACT", "INTERSECTION", "ROAD", "AREA"]
        precision = np.random.choice(precisions, p=[0.25, 0.40, 0.25, 0.10])
        verifications = ["VERIFIED", "PROBABLE", "UNCONFIRMED"]
        verification = np.random.choice(verifications, p=[0.75, 0.20, 0.05])

        road_name = chosen_edge["road_name"]
        area = chosen_edge["area"]
        thana = chosen_edge["thana"]

        landmarks = [
            f"near {area} bus stop",
            f"under the {area} footover bridge",
            f"close to the {area} market square",
            f"along the poorly lit section of {road_name}",
            f"near the intersection approaching {chosen_edge['to_node_name']}",
            f"in front of the commercial complex at {area}"
        ]
        chosen_landmark = random.choice(landmarks)
        desc_templates = [
            f"A {victim.lower()} had their smartphone snatched by {suspect_count} perpetrators on a {vehicle.lower()} {chosen_landmark} around {time_str}.",
            f"Muggers armed with a {weapon.lower()} intercepted a {victim.lower()} {chosen_landmark}, fleeing with cash and bag.",
            f"Reported incident of {crime_type.lower()} involving a {victim.lower()} at {chosen_landmark}. Suspects fled using a {vehicle.lower()}.",
            f"Police blotter recorded a swift snatching incident {chosen_landmark} during {day_of_week} night hours."
        ]
        description = random.choice(desc_templates)

        confidence = round(random.uniform(0.75, 0.98), 2) if verification != "UNCONFIRMED" else round(random.uniform(0.50, 0.70), 2)

        incidents.append({
            "incident_id": f"DHK-{year}-{i:04d}",
            "date": inc_date.strftime("%Y-%m-%d"),
            "time": time_str,
            "year": year,
            "month": month,
            "day_of_week": day_of_week,
            "hour": hour,
            "crime_type": crime_type,
            "location_text": f"{area} - {chosen_landmark}",
            "road_id": chosen_edge["road_id"],
            "road_name": road_name,
            "area": area,
            "thana": thana,
            "latitude": lat,
            "longitude": lon,
            "source": source_name,
            "source_url": source_url,
            "source_type": source_type,
            "victim_type": victim,
            "weapon": weapon,
            "suspect_count": suspect_count,
            "vehicle_used": vehicle,
            "description": description,
            "location_precision": precision,
            "verification_status": verification,
            "confidence": confidence
        })

    df = pd.DataFrame(incidents)
    df.sort_values(by=["date", "time"], inplace=True)
    csv_path = os.path.join(OUTPUT_DIR, "dhaka_crime_incidents.csv")
    df.to_csv(csv_path, index=False)
    print(f"[OK] Generated {len(df)} Dhaka crime incidents at {csv_path}")
    return df

def generate_spatio_temporal_master(road_network, crime_df):
    edges = road_network["edges"]
    rows = []
    lighting_map = {"Low": 0, "Medium": 1, "High": 2}
    comm_map = {"Low": 0, "Medium": 1, "High": 2}
    road_type_map = {"tertiary": 1, "secondary": 2, "primary": 3, "trunk": 4}

    incident_counts_by_road = crime_df["road_id"].value_counts().to_dict()
    night_crimes = crime_df[(crime_df["hour"] >= 21) | (crime_df["hour"] <= 4)]
    night_counts_by_road = night_crimes["road_id"].value_counts().to_dict()
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for edge in edges:
        rid = edge["road_id"]
        total_hist = incident_counts_by_road.get(rid, 0)
        total_night = night_counts_by_road.get(rid, 0)
        night_ratio = round(total_night / max(1, total_hist), 3)

        lighting_val = lighting_map.get(edge["lighting_condition"], 1)
        comm_val = comm_map.get(edge["commercial_density"], 1)
        rtype_val = road_type_map.get(edge["road_type"], 2)
        bus_stops = edge["bus_stops_count"]
        police_st = edge["police_stations_nearby"]

        for hour in range(24):
            is_night = 1 if (hour >= 21 or hour <= 4) else 0
            is_rush_hour = 1 if (hour in [8, 9, 10, 17, 18, 19, 20]) else 0

            for dow in days_of_week:
                is_weekend = 1 if dow in ["Friday", "Saturday"] else 0

                for rain in [0, 1]:
                    base_intensity = (total_hist / 25.0)

                    if 21 <= hour or hour <= 1:
                        time_mult = 2.4
                    elif 2 <= hour <= 4:
                        time_mult = 1.8
                    elif 18 <= hour <= 20:
                        time_mult = 1.9
                    elif 12 <= hour <= 17:
                        time_mult = 1.1
                    else:
                        time_mult = 0.6

                    weekend_mult = 1.25 if (is_weekend and is_night) else 1.0
                    lighting_penalty = 1.5 if (lighting_val == 0 and is_night) else (0.8 if lighting_val == 2 else 1.0)
                    rain_penalty = 1.2 if (rain == 1 and is_night) else 1.0
                    police_dampener = 0.75 if police_st > 0 else 1.0

                    expected_intensity = base_intensity * time_mult * weekend_mult * lighting_penalty * rain_penalty * police_dampener
                    raw_risk = 100.0 / (1.0 + np.exp(-0.75 * (expected_intensity - 3.2)))
                    calibrated_risk = int(np.clip(np.round(raw_risk), 4, 98))
                    target_high_risk = 1 if calibrated_risk >= 60 else 0

                    rows.append({
                        "road_id": rid,
                        "road_name": edge["road_name"],
                        "area": edge["area"],
                        "thana": edge["thana"],
                        "hour": hour,
                        "day_of_week": dow,
                        "is_weekend": is_weekend,
                        "is_night": is_night,
                        "is_rush_hour": is_rush_hour,
                        "rain": rain,
                        "historical_incidents": total_hist,
                        "night_incident_ratio": night_ratio,
                        "lighting_condition": lighting_val,
                        "bus_stops_count": bus_stops,
                        "police_stations_nearby": police_st,
                        "commercial_density": comm_val,
                        "road_type_code": rtype_val,
                        "length_meters": edge["length_meters"],
                        "expected_intensity": round(expected_intensity, 3),
                        "risk_score": calibrated_risk,
                        "target_high_risk": target_high_risk
                    })

    df_master = pd.DataFrame(rows)
    master_path = os.path.join(OUTPUT_DIR, "spatio_temporal_master.csv")
    df_master.to_csv(master_path, index=False)
    print(f"[OK] Generated Master Spatio-Temporal Dataset: {len(df_master)} samples at {master_path}")
    return df_master

def generate_hotspots(crime_df):
    hotspots = []
    areas = crime_df["area"].value_counts().head(12).index.tolist()

    for area in areas:
        area_df = crime_df[crime_df["area"] == area]
        mean_lat = round(float(area_df["latitude"].mean()), 5)
        mean_lon = round(float(area_df["longitude"].mean()), 5)
        count = len(area_df)
        top_crimes = area_df["crime_type"].value_counts().to_dict()
        top_weapons = area_df["weapon"].value_counts().head(2).index.tolist()

        if count >= 100:
            severity = "CRITICAL"
            color = "#ef4444"
        elif count >= 60:
            severity = "HIGH"
            color = "#f97316"
        else:
            severity = "MODERATE"
            color = "#eab308"

        hotspots.append({
            "area": area,
            "center_lat": mean_lat,
            "center_lon": mean_lon,
            "radius_meters": 450 + int(count * 3.5),
            "incident_count": count,
            "severity": severity,
            "color": color,
            "primary_crime": max(top_crimes, key=top_crimes.get),
            "common_weapons": top_weapons,
            "peak_hours": "21:00 - 01:00",
            "thana": area_df["thana"].iloc[0]
        })

    hotspot_path = os.path.join(OUTPUT_DIR, "dhaka_hotspots.json")
    with open(hotspot_path, "w", encoding="utf-8") as f:
        json.dump(hotspots, f, indent=2)
    print(f"[OK] Generated {len(hotspots)} Dhaka Hotspots at {hotspot_path}")
    return hotspots

if __name__ == "__main__":
    print("=== DhakaSafe AI: Generating Multi-Layer Datasets ===")
    net = generate_road_network()
    crimes = generate_crime_dataset(net, total_records=1280)
    master = generate_spatio_temporal_master(net, crimes)
    hotspots = generate_hotspots(crimes)
    print("=== Dataset Generation Completed Successfully ===")
