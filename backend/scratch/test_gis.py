import math

GIS_HUBS = [
    # Himalayan Belt
    {"id": "RUDRAPRAYAG", "name": "Rudraprayag", "state": "Uttarakhand", "lat": 30.28, "lon": 78.98,
     "river": "Alaknanda-Mandakini Confluence", "dam": "Tehri / Srinagar Hydro Dam Sluice Gates",
     "rail": "Northern Railway Rishikesh-Karnaprayag Line Interlocking",
     "highway": "NH-107 Rudraprayag-Kedarnath Highway & VMS Displays",
     "substation": "PTCUL 220/33 kV Mandakini Valley Islanding Substation",
     "terrain": "Himalayan Alpine Ridge", "elevation": 895, "flow": 850},
    {"id": "DEHRADUN", "name": "Dehradun / Rishikesh", "state": "Uttarakhand", "lat": 30.31, "lon": 78.03,
     "river": "Ganga & Song River Basin", "dam": "Dakpathar & Pashulok Barrage Sluice Gates",
     "rail": "Northern Railway Dehradun-Haridwar Section Auto-Signaling",
     "highway": "NH-7 Dehradun-Rishikesh Expressway & VMS Displays",
     "substation": "PTCUL 220/132 kV Majra State Grid Substation",
     "terrain": "Sub-Himalayan Doon Valley", "elevation": 640, "flow": 620},
    {"id": "SHIMLA", "name": "Shimla / Kullu", "state": "Himachal Pradesh", "lat": 31.10, "lon": 77.17,
     "river": "Sutlej & Beas Basin", "dam": "Bhakra Nangal & Kol Dam Sluice Gates",
     "rail": "Northern Railway Kalka-Shimla Hill Rail Interlocking",
     "highway": "NH-5 Shimla-Kullu Highway & Mountain VMS Displays",
     "substation": "HPSEBL 220/66 kV Totu Transmission Substation",
     "terrain": "Himalayan Ridge Corridor", "elevation": 2200, "flow": 740},
    {"id": "SRINAGAR", "name": "Srinagar / Kashmir", "state": "Jammu and Kashmir", "lat": 34.08, "lon": 74.79,
     "river": "Jhelum River & Dal Lake Spill Channel", "dam": "Uri-II & Lower Jhelum Barrage Sluice Gates",
     "rail": "Northern Railway Baramulla-Udhampur Line Auto-Interlocking",
     "highway": "NH-44 Srinagar-Jammu Trans-Himalayan Expressway VMS",
     "substation": "JKPDD 220/132 kV Alusteng Ring Grid Substation",
     "terrain": "Kashmir Intermontane Valley", "elevation": 1585, "flow": 550},
    {"id": "LEH", "name": "Leh / Ladakh", "state": "Ladakh", "lat": 34.15, "lon": 77.57,
     "river": "Indus River Basin", "dam": "Nimoo Bazgo & Chutak Hydro Dam Sluice Gates",
     "rail": "Strategic Bilaspur-Manali-Leh Survey Sector Rail Link",
     "highway": "NH-1 Leh-Srinagar Highway & Zojila Pass ITS Displays",
     "substation": "POWERGRID 220/66 kV Phyang Substation Ladakh",
     "terrain": "High-Altitude Cold Desert Plateau", "elevation": 3500, "flow": 280},

    # NCR / Gangetic Plains
    {"id": "DELHI", "name": "New Delhi / NCR", "state": "Delhi", "lat": 28.61, "lon": 77.20,
     "river": "Yamuna Floodplain Drainage Basin", "dam": "Wazirabad, ITO & Okhla Yamuna Barrage Gates",
     "rail": "Northern Railway Delhi Division Interlocking & Rapid Transit",
     "highway": "Ring Road, Outer Ring Road & DND Flyway Overhead VMS",
     "substation": "Delhi Transco (DTL) 400/220 kV Maharani Bagh Grid Substation",
     "terrain": "Indo-Gangetic Urban Floodplain", "elevation": 216, "flow": 720},
    {"id": "GHAZIABAD", "name": "Ghaziabad / Muradnagar", "state": "Uttar Pradesh", "lat": 28.75, "lon": 77.50,
     "river": "Hindon River & Upper Ganga Canal", "dam": "Hindon Barrage & Upper Ganga Canal Regulators",
     "rail": "Northern Railway Moradabad Division & Delhi-Meerut RRTS Interlocking",
     "highway": "NH-34 / Delhi-Meerut Expressway & Eastern Peripheral VMS",
     "substation": "UPPTCL 400/220 kV Muradnagar State Grid Substation",
     "terrain": "Indo-Gangetic Alluvial Plain", "elevation": 214, "flow": 420},
    {"id": "LUCKNOW", "name": "Lucknow / Awadh", "state": "Uttar Pradesh", "lat": 26.84, "lon": 80.94,
     "river": "Gomti River Basin", "dam": "Gomti Barrage & Sarda Canal Regulators",
     "rail": "Northern & North Eastern Railway Lucknow Division Interlocking",
     "highway": "Purvanchal Expressway & Shaheed Path VMS Displays",
     "substation": "UPPTCL 400/220 kV Sarojini Nagar Grid Substation",
     "terrain": "Indo-Gangetic Central Basin", "elevation": 123, "flow": 480},
    {"id": "VARANASI", "name": "Varanasi / Prayagraj", "state": "Uttar Pradesh", "lat": 25.31, "lon": 82.97,
     "river": "Ganga-Varuna-Assi Confluence", "dam": "Ganga River Regulators & Rihand Hydro Reservoir Gates",
     "rail": "North Eastern & Northern Railway Varanasi Division Interlocking",
     "highway": "NH-19 Delhi-Kolkata Golden Quadrilateral VMS Displays",
     "substation": "UPPTCL 400/220 kV Shivpur Grid Substation",
     "terrain": "Middle Gangetic Basin", "elevation": 81, "flow": 1100},
    {"id": "PATNA", "name": "Patna / Magadh", "state": "Bihar", "lat": 25.59, "lon": 85.13,
     "river": "Ganga-Son-Gandak Confluence", "dam": "Farakka Upstream Regulators & Valmikinagar Barrage",
     "rail": "East Central Railway Danapur Division KAVACH Interlocking",
     "highway": "NH-31 Patna-Bhakhtiyarpur Highway & Loknayak Ganga Path VMS",
     "substation": "BSPTCL 400/220 kV Khagaul Grid Substation",
     "terrain": "Gangetic Alluvial Floodplain", "elevation": 53, "flow": 1350},

    # Western India
    {"id": "MUMBAI", "name": "Mumbai Metropolitan Region", "state": "Maharashtra", "lat": 19.07, "lon": 72.87,
     "river": "Mithi River & Coastal Creek Outfalls", "dam": "Mithi River Pumping & Stormwater Outfall Sluices",
     "rail": "Central & Western Railway Suburban Automatic Interlocking",
     "highway": "Western Express Highway & Mumbai Coastal Road Matrix Displays",
     "substation": "Tata Power / MSETCL 110/33 kV Dharavi Receiving Station",
     "terrain": "Coastal Lowland Estuary", "elevation": 14, "flow": 340},
    {"id": "PUNE", "name": "Pune / Western Ghats", "state": "Maharashtra", "lat": 18.52, "lon": 73.85,
     "river": "Mula-Mutha River Basin", "dam": "Khadakwasla, Panshet & Varasgaon Dam Spillways",
     "rail": "Central Railway Pune Division Automatic Block Signaling",
     "highway": "Mumbai-Pune Expressway & NH-48 Bypass Matrix Displays",
     "substation": "MSETCL 400/220 kV Lonikand Grid Substation",
     "terrain": "Deccan Highland Plateau", "elevation": 560, "flow": 460},
    {"id": "AHMEDABAD", "name": "Ahmedabad / Gandhinagar", "state": "Gujarat", "lat": 23.02, "lon": 72.57,
     "river": "Sabarmati River Basin", "dam": "Dharoi Dam & Vasna Barrage Sluice Gates",
     "rail": "Western Railway Ahmedabad Division Automatic Interlocking",
     "highway": "NE-1 Ahmedabad-Vadodara Expressway & SG Highway VMS",
     "substation": "GETCO 400/220 kV Pirana Grid Substation",
     "terrain": "Gujarat Alluvial Coastal Plain", "elevation": 53, "flow": 390},
    {"id": "JAIPUR", "name": "Jaipur / Marwar", "state": "Rajasthan", "lat": 26.91, "lon": 75.78,
     "river": "Dravyavati & Banas River Basin", "dam": "Bisalpur Dam Spillway & Regulator Sluice Gates",
     "rail": "North Western Railway Jaipur Division Auto-Signaling",
     "highway": "NH-48 Delhi-Jaipur Highway & Ring Road Matrix Displays",
     "substation": "RRVPNL 400/220 kV Heerapura Grid Substation",
     "terrain": "Semi-Arid Aravalli Foothills", "elevation": 431, "flow": 260},

    # Southern India
    {"id": "BENGALURU", "name": "Bengaluru / Mysuru", "state": "Karnataka", "lat": 12.97, "lon": 77.59,
     "river": "Vrishabhavathi-Arkavathi / Cauvery Basin", "dam": "Krishnarajasagara (KRS) Dam & Thippagondanahalli Regulators",
     "rail": "South Western Railway Bengaluru Division KAVACH Interlocking",
     "highway": "Bengaluru-Mysuru Expressway & NICE Ring Road Matrix Displays",
     "substation": "KPTCL 400/220 kV Peenya Major Transmission Substation",
     "terrain": "Deccan South Plateau", "elevation": 920, "flow": 310},
    {"id": "CHENNAI", "name": "Chennai / Coromandel Coast", "state": "Tamil Nadu", "lat": 13.08, "lon": 80.27,
     "river": "Adyar, Cooum & Kosasthalaiyar River Basin", "dam": "Chembarambakkam, Poondi & Red Hills Sluice Regulators",
     "rail": "Southern Railway Chennai Division Suburban Auto-Interlocking",
     "highway": "Chennai Bypass, Outer Ring Road & OMR Matrix Displays",
     "substation": "TANTRANSCO 400/230 kV Sriperumbudur Transmission Substation",
     "terrain": "Coromandel Coastal Plain", "elevation": 7, "flow": 410},
    {"id": "HYDERABAD", "name": "Hyderabad / Telangana", "state": "Telangana", "lat": 17.38, "lon": 78.48,
     "river": "Musi River Basin & Hussain Sagar Catchment", "dam": "Osman Sagar & Himayat Sagar Reservoir Sluice Gates",
     "rail": "South Central Railway Secunderabad Division Interlocking",
     "highway": "Nehru Outer Ring Road (ORR) 8-Lane Expressway VMS Matrix",
     "substation": "TSTRANSCO 400/220 kV Mamidipally Grid Substation",
     "terrain": "Deccan Crystalline Plateau", "elevation": 542, "flow": 350},
    {"id": "KOCHI", "name": "Kochi / Wayanad / Kerala Coast", "state": "Kerala", "lat": 9.93, "lon": 76.26,
     "river": "Periyar & Muvattupuzha River Basin", "dam": "Idukki Arch Dam & Bhoothathankettu Barrage Sluices",
     "rail": "Southern Railway Thiruvananthapuram Division Auto-Interlocking",
     "highway": "NH-66 Kochi Bypass & Seaport-Airport Road ITS Displays",
     "substation": "KSEBL 220/110 kV Kalamassery Major Transmission Substation",
     "terrain": "Western Ghats Coastal Plain", "elevation": 4, "flow": 680},

    # Eastern & Northeastern India
    {"id": "KOLKATA", "name": "Kolkata / Lower Bengal", "state": "West Bengal", "lat": 22.57, "lon": 88.36,
     "river": "Hooghly River & Ganges Delta", "dam": "Hooghly Lock Gates & Durgapur Barrage Spillways",
     "rail": "Eastern & South Eastern Railway Howrah/Sealdah Division Auto-Interlocking",
     "highway": "NH-19 / Kona Expressway & Vidyasagar Setu Overhead VMS",
     "substation": "WBSETCL 400/220 kV Subhashgram Grid Substation",
     "terrain": "Bengal Deltaic Lowlands", "elevation": 9, "flow": 1250},
    {"id": "BHUBANESWAR", "name": "Bhubaneswar / Cuttack", "state": "Odisha", "lat": 20.29, "lon": 85.82,
     "river": "Mahanadi & Kuakhai River Basin", "dam": "Hirakud Dam & Naraj Barrage Spillways",
     "rail": "East Coast Railway Khurda Road Division Auto-Signaling",
     "highway": "NH-16 Bhubaneswar-Cuttack Express Corridor VMS Displays",
     "substation": "OPTCL 400/220 kV Mendhasal Grid Substation",
     "terrain": "East Coastal Alluvial Plain", "elevation": 45, "flow": 980},
    {"id": "GUWAHATI", "name": "Guwahati / Assam Valley", "state": "Assam", "lat": 26.14, "lon": 91.73,
     "river": "Brahmaputra River Valley Basin", "dam": "Kurichu & Umiam Hydro Dam Regulators",
     "rail": "Northeast Frontier Railway Lumding Division Interlocking",
     "highway": "NH-27 East-West Corridor & Guwahati Bypass VMS Displays",
     "substation": "AEGCL 220/132 kV Sarusajai Grid Substation",
     "terrain": "Brahmaputra Alluvial Basin", "elevation": 55, "flow": 1800}
]

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def resolve_hub(lat, lon):
    best_hub = None
    min_dist = float('inf')
    for h in GIS_HUBS:
        d = haversine_km(lat, lon, h["lat"], h["lon"])
        if d < min_dist:
            min_dist = d
            best_hub = h
    return best_hub, round(min_dist, 1)

# Test cases:
test_coords = [
    ("Kedarnath / Rudraprayag", 30.73, 79.06),
    ("Ghaziabad / Muradnagar", 28.75, 77.50),
    ("Mumbai Nariman Point", 18.92, 72.82),
    ("Bangalore Whitefield", 12.97, 77.75),
    ("Patna Gandhi Maidan", 25.61, 85.14),
    ("Guwahati Brahmaputra", 26.18, 91.75),
    ("Kochi Infopark", 9.99, 76.35),
    ("Jaipur Pink City", 26.92, 75.82)
]

for label, lat, lon in test_coords:
    hub, dist = resolve_hub(lat, lon)
    print(f"[{label} ({lat}, {lon})]: Matched {hub['name']}, {hub['state']} ({dist} km away)")
    print(f"  -> Dam: {hub['dam']}")
    print(f"  -> Rail: {hub['rail']}")
    print(f"  -> Highway: {hub['highway']}")
    print(f"  -> Substation: {hub['substation']}")
    print()
