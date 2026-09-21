"""
DhakaSafe AI - NLP News Extraction Pipeline (Bangla & English)
Corresponds to Points 10-12 in project specification:
Extracts structured crime incident information from unstructured news reports.
"""

import re
from typing import Dict, Any, Optional

CRIME_KEYWORDS_EN = {
    "snatching": "Snatching",
    "snatch": "Snatching",
    "snatched": "Snatching",
    "mugging": "Mugging",
    "mugged": "Mugging",
    "robbery": "Robbery",
    "robbed": "Robbery",
    "looted": "Robbery",
    "theft": "Theft",
    "stolen": "Theft",
    "pickpocket": "Pickpocketing",
    "pickpocketed": "Pickpocketing"
}

CRIME_KEYWORDS_BN = {
    "ছিনতাই": "Snatching",
    "ছিনতাইকারী": "Snatching",
    "ছিনতাইয়ের": "Snatching",
    "ডাকাতি": "Robbery",
    "ডাকাত": "Robbery",
    "লুট": "Robbery",
    "লুণ্ঠন": "Robbery",
    "চুরি": "Theft",
    "চোরাই": "Theft",
    "পকেটমার": "Pickpocketing"
}

DHAKA_LOCATIONS_EN = [
    ("Farmgate", "Tejgaon", "INTERSECTION"),
    ("Karwan Bazar", "Tejgaon", "AREA"),
    ("Shahbagh", "Shahbagh", "INTERSECTION"),
    ("Dhanmondi 27", "Dhanmondi", "ROAD"),
    ("Dhanmondi 32", "Dhanmondi", "ROAD"),
    ("Dhanmondi", "Dhanmondi", "AREA"),
    ("Russell Square", "Dhanmondi", "INTERSECTION"),
    ("Science Lab", "New Market", "INTERSECTION"),
    ("Kalabagan", "Kalabagan", "AREA"),
    ("Mohammadpur Town Hall", "Mohammadpur", "INTERSECTION"),
    ("Asad Gate", "Mohammadpur", "INTERSECTION"),
    ("Mohammadpur Beribadh", "Mohammadpur", "ROAD"),
    ("Mohammadpur", "Mohammadpur", "AREA"),
    ("Shyamoli Square", "Adabor", "INTERSECTION"),
    ("Shyamoli", "Adabor", "AREA"),
    ("Agargaon", "Sher-e-Bangla Nagar", "AREA"),
    ("Bijoy Sarani", "Tejgaon", "INTERSECTION"),
    ("Mohakhali", "Banani", "INTERSECTION"),
    ("Gulshan 1", "Gulshan", "INTERSECTION"),
    ("Gulshan 2", "Gulshan", "INTERSECTION"),
    ("Gulshan", "Gulshan", "AREA"),
    ("Banani Kakoli", "Banani", "INTERSECTION"),
    ("Banani 11", "Banani", "ROAD"),
    ("Banani", "Banani", "AREA"),
    ("Baridhara", "Bhatara", "AREA"),
    ("Notun Bazar", "Bhatara", "INTERSECTION"),
    ("Badda Link Road", "Badda", "ROAD"),
    ("Badda", "Badda", "AREA"),
    ("Rampura Bridge", "Rampura", "INTERSECTION"),
    ("Rampura", "Rampura", "AREA"),
    ("Mouchak", "Shahjahanpur", "INTERSECTION"),
    ("Malibagh", "Shahjahanpur", "AREA"),
    ("Paltan", "Paltan", "INTERSECTION"),
    ("Motijheel", "Motijheel", "AREA"),
    ("Sayedabad", "Jatrabari", "INTERSECTION"),
    ("Jatrabari", "Jatrabari", "AREA"),
    ("Sadarghat", "Kotwali", "AREA"),
    ("Mirpur 10", "Mirpur", "INTERSECTION"),
    ("Mirpur 1", "Mirpur", "INTERSECTION"),
    ("Mirpur 11", "Pallabi", "ROAD"),
    ("Mirpur 12", "Pallabi", "ROAD"),
    ("Mirpur", "Mirpur", "AREA"),
    ("Kazipara", "Kafrul", "ROAD"),
    ("Shewrapara", "Kafrul", "ROAD"),
    ("Kuril Flyover", "Khilkhet", "INTERSECTION"),
    ("Kuril", "Khilkhet", "AREA"),
    ("Airport", "Airport", "AREA"),
    ("Uttara Jasimuddin", "Uttara East", "ROAD"),
    ("Uttara House Building", "Uttara West", "INTERSECTION"),
    ("Uttara", "Uttara East", "AREA"),
    ("Gabtoli", "Darussalam", "AREA"),
    ("Nilkhet", "New Market", "AREA"),
    ("New Market", "New Market", "AREA"),
    ("Kakrail", "Ramna", "AREA"),
    ("Mogbazar", "Ramna", "AREA"),
    ("Khilgaon", "Khilgaon", "AREA")
]

DHAKA_LOCATIONS_BN = [
    ("ফার্মগেট", "Farmgate", "Tejgaon", "INTERSECTION"),
    ("কারওয়ান বাজার", "Karwan Bazar", "Tejgaon", "AREA"),
    ("শাহবাগ", "Shahbagh", "Shahbagh", "INTERSECTION"),
    ("ধানমন্ডি ২৭", "Dhanmondi 27", "Dhanmondi", "ROAD"),
    ("ধানমন্ডি ৩২", "Dhanmondi 32", "Dhanmondi", "ROAD"),
    ("ধানমন্ডি", "Dhanmondi", "Dhanmondi", "AREA"),
    ("রাসেল স্কয়ার", "Russell Square", "Dhanmondi", "INTERSECTION"),
    ("সায়েন্স ল্যাব", "Science Lab", "New Market", "INTERSECTION"),
    ("কলাবাগান", "Kalabagan", "Kalabagan", "AREA"),
    ("মোহাম্মদপুর টাউন হল", "Mohammadpur Town Hall", "Mohammadpur", "INTERSECTION"),
    ("আসাদ গেট", "Asad Gate", "Mohammadpur", "INTERSECTION"),
    ("মোহাম্মদপুর বেড়িবাঁধ", "Mohammadpur Beribadh", "Mohammadpur", "ROAD"),
    ("মোহাম্মদপুর", "Mohammadpur", "Mohammadpur", "AREA"),
    ("শ্যামলী", "Shyamoli", "Adabor", "AREA"),
    ("আগারগাঁও", "Agargaon", "Sher-e-Bangla Nagar", "AREA"),
    ("বিজয় সরণি", "Bijoy Sarani", "Tejgaon", "INTERSECTION"),
    ("মহাখালী", "Mohakhali", "Banani", "INTERSECTION"),
    ("গুলশান ১", "Gulshan 1", "Gulshan", "INTERSECTION"),
    ("গুলশান ২", "Gulshan 2", "Gulshan", "INTERSECTION"),
    ("গুলশান", "Gulshan", "Gulshan", "AREA"),
    ("বনানী কাকলী", "Banani Kakoli", "Banani", "INTERSECTION"),
    ("বনানী", "Banani", "Banani", "AREA"),
    ("বারিধারা", "Baridhara", "Bhatara", "AREA"),
    ("নতুন বাজার", "Notun Bazar", "Bhatara", "INTERSECTION"),
    ("বাড্ডা", "Badda", "Badda", "AREA"),
    ("রামপুরা ব্রিজ", "Rampura Bridge", "Rampura", "INTERSECTION"),
    ("রামপুরা", "Rampura", "Rampura", "AREA"),
    ("মৌচাক", "Mouchak", "Shahjahanpur", "INTERSECTION"),
    ("মালিবাগ", "Malibagh", "Shahjahanpur", "AREA"),
    ("পল্টন", "Paltan", "Paltan", "INTERSECTION"),
    ("মতিঝিল", "Motijheel", "Motijheel", "AREA"),
    ("সায়েদাবাদ", "Sayedabad", "Jatrabari", "INTERSECTION"),
    ("যাত্রাবাড়ী", "Jatrabari", "Jatrabari", "AREA"),
    ("সদরঘাট", "Sadarghat", "Kotwali", "AREA"),
    ("মিরপুর ১০", "Mirpur 10", "Mirpur", "INTERSECTION"),
    ("মিরপুর ১", "Mirpur 1", "Mirpur", "INTERSECTION"),
    ("মিরপুর ১১", "Mirpur 11", "Pallabi", "ROAD"),
    ("মিরপুর ১২", "Mirpur 12", "Pallabi", "ROAD"),
    ("মিরপুর", "Mirpur", "Mirpur", "AREA"),
    ("কাজীপুর", "Kazipara", "Kafrul", "ROAD"),
    ("শেওড়াপাড়া", "Shewrapara", "Kafrul", "ROAD"),
    ("কুড়িল ফ্লাইওভার", "Kuril Flyover", "Khilkhet", "INTERSECTION"),
    ("কুড়িল", "Kuril", "Khilkhet", "AREA"),
    ("বিমানবন্দর", "Airport", "Airport", "AREA"),
    ("উত্তরা জসীমউদ্দীন", "Uttara Jasimuddin", "Uttara East", "ROAD"),
    ("উত্তরা", "Uttara", "Uttara East", "AREA"),
    ("গাবতলী", "Gabtoli", "Darussalam", "AREA"),
    ("নিউমার্কেট", "New Market", "New Market", "AREA"),
    ("কাকরাইল", "Kakrail", "Ramna", "AREA"),
    ("মগবাজার", "Mogbazar", "Ramna", "AREA"),
    ("খিলগাঁও", "Khilgaon", "Khilgaon", "AREA")
]

VEHICLE_PATTERNS = {
    "motorcycle": "Motorcycle",
    "bike": "Motorcycle",
    "মোটরসাইকেল": "Motorcycle",
    "বাইক": "Motorcycle",
    "cng": "CNG Auto-rickshaw",
    "সিএনজি": "CNG Auto-rickshaw",
    "leguna": "Leguna",
    "লেগুনা": "Leguna",
    "car": "Private Car",
    "গাড়ি": "Private Car",
    "রিকশা": "Rickshaw",
    "rickshaw": "Rickshaw",
    "on foot": "On foot",
    "দৌড়ে": "On foot"
}

WEAPON_PATTERNS = {
    "knife": "Sharp Knife (Chhuri)",
    "chhuri": "Sharp Knife (Chhuri)",
    "ছুরির": "Sharp Knife (Chhuri)",
    "ছুরি": "Sharp Knife (Chhuri)",
    "firearm": "Firearm / Pistol",
    "pistol": "Firearm / Pistol",
    "gun": "Firearm / Pistol",
    "অস্ত্র": "Firearm / Pistol",
    "পিস্তল": "Firearm / Pistol",
    "blade": "Paper Cutter / Blade",
    "ব্লেড": "Paper Cutter / Blade",
    "rod": "Iron Rod",
    "রড": "Iron Rod",
    "pepper spray": "Pepper Spray"
}

VICTIM_PATTERNS = {
    "pedestrian": "Pedestrian",
    "পথচারী": "Pedestrian",
    "commuter": "Commuter",
    "যাত্রী": "Commuter",
    "rickshaw passenger": "Rickshaw Passenger",
    "student": "Student",
    "শিক্ষার্থী": "Student",
    "ছাত্র": "Student",
    "ছাত্রী": "Student",
    "woman": "Female Commuter",
    "নারী": "Female Commuter",
    "motorcyclist": "Motorcyclist"
}

def extract_crime_info(text: str) -> Dict[str, Any]:
    """
    Parses an unstructured English or Bangla news snippet and extracts structured crime attributes.
    """
    text_lower = text.lower()

    # 1. Crime Type Extraction
    crime_type = "Snatching"  # default Dhaka baseline
    crime_conf = 0.70
    for kw, ctype in CRIME_KEYWORDS_EN.items():
        if kw in text_lower:
            crime_type = ctype
            crime_conf = 0.95
            break
    if crime_conf < 0.9:
        for kw, ctype in CRIME_KEYWORDS_BN.items():
            if kw in text:
                crime_type = ctype
                crime_conf = 0.96
                break

    # 2. Location & Thana Extraction
    location = "Unknown"
    thana = "Unknown"
    precision = "UNKNOWN"
    loc_conf = 0.50

    # Try English locations
    for loc_name, th, prec in DHAKA_LOCATIONS_EN:
        if loc_name.lower() in text_lower:
            location = loc_name
            thana = th
            precision = prec
            loc_conf = 0.94 if prec in ["EXACT", "INTERSECTION"] else 0.85
            break

    # If not found, try Bangla locations
    if location == "Unknown":
        for bn_name, en_name, th, prec in DHAKA_LOCATIONS_BN:
            if bn_name in text:
                location = en_name
                thana = th
                precision = prec
                loc_conf = 0.95 if prec in ["EXACT", "INTERSECTION"] else 0.86
                break

    # 3. Time extraction (HH:MM or qualitative night/evening)
    time_str = "22:00"  # default evening
    time_conf = 0.65
    time_match = re.search(r"(\b\d{1,2})[:.]?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)", text_lower)
    if time_match:
        hr = int(time_match.group(1))
        mn = int(time_match.group(2)) if time_match.group(2) else 0
        ampm = time_match.group(3).replace(".", "")
        if ampm == "pm" and hr < 12:
            hr += 12
        elif ampm == "am" and hr == 12:
            hr = 0
        time_str = f"{hr:02d}:{mn:02d}"
        time_conf = 0.93
    elif "রাত" in text or "night" in text_lower:
        time_str = "23:00"
        time_conf = 0.85
    elif "সন্ধ্যা" in text or "evening" in text_lower:
        time_str = "19:30"
        time_conf = 0.82
    elif "দুপুর" in text or "afternoon" in text_lower:
        time_str = "14:00"
        time_conf = 0.80
    elif "সকাল" in text or "morning" in text_lower:
        time_str = "08:30"
        time_conf = 0.80

    # 4. Suspect Count
    suspect_count = 2  # standard gang size in Dhaka
    suspect_match = re.search(r"(\b\d{1,2})\s*(muggers|snatchers|robbers|men|perpetrators|criminals|riders)", text_lower)
    if suspect_match:
        suspect_count = int(suspect_match.group(1))
    elif "two" in text_lower or "দুই" in text:
        suspect_count = 2
    elif "three" in text_lower or "তিন" in text:
        suspect_count = 3
    elif "four" in text_lower or "চার" in text:
        suspect_count = 4

    # 5. Vehicle Used
    vehicle = "Motorcycle"
    for v_kw, v_label in VEHICLE_PATTERNS.items():
        if v_kw in text_lower or v_kw in text:
            vehicle = v_label
            break

    # 6. Weapon
    weapon = "Sharp Knife (Chhuri)"
    for w_kw, w_label in WEAPON_PATTERNS.items():
        if w_kw in text_lower or w_kw in text:
            weapon = w_label
            break

    # 7. Victim
    victim = "Pedestrian"
    for vic_kw, vic_label in VICTIM_PATTERNS.items():
        if vic_kw in text_lower or vic_kw in text:
            victim = vic_label
            break

    overall_conf = round((crime_conf + loc_conf + time_conf) / 3.0, 2)

    return {
        "raw_text": text,
        "crime_type": crime_type,
        "location": location,
        "thana": thana,
        "time": time_str,
        "suspect_count": suspect_count,
        "vehicle_used": vehicle,
        "weapon": weapon,
        "victim_type": victim,
        "location_precision": precision,
        "extraction_confidence": overall_conf,
        "is_usable_for_road_prediction": loc_conf >= 0.70 and precision in ["EXACT", "INTERSECTION", "ROAD"]
    }
