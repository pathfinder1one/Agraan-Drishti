"""
Historical severe weather event labels for supervised training.
20 curated events from IMD records, news archives, and disaster reports.
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Optional
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import GRID_SIZE, LAT_MIN, LON_MIN, GRID_RESOLUTION


@dataclass
class WeatherEvent:
    event_id: str
    date: str
    lat: float
    lon: float
    event_type: str      # thunderstorm | cloudburst | flash_flood
    description: str
    source: str
    severity: str = "high"


HISTORICAL_EVENTS: List[WeatherEvent] = [
    # ── Flash Floods ──
    WeatherEvent("evt_001", "2013-06-16", 30.73, 79.07, "flash_flood",
                 "Uttarakhand floods — Kedarnath devastated", "IMD/NDMA", "extreme"),
    WeatherEvent("evt_002", "2014-09-05", 34.08, 74.80, "flash_flood",
                 "J&K floods — Srinagar inundated", "IMD/State Govt", "extreme"),
    WeatherEvent("evt_003", "2005-07-26", 19.07, 72.87, "flash_flood",
                 "Mumbai floods — 944mm in 24hrs", "IMD", "extreme"),
    WeatherEvent("evt_004", "2018-08-15", 10.85, 76.27, "flash_flood",
                 "Kerala floods — widespread flooding + landslides", "IMD/KSDMA", "extreme"),
    WeatherEvent("evt_005", "2019-08-08", 10.52, 76.21, "flash_flood",
                 "Kerala floods 2019 — Wayanad landslides", "IMD/KSDMA", "high"),
    WeatherEvent("evt_006", "2020-10-13", 17.38, 78.47, "flash_flood",
                 "Hyderabad floods — extreme rainfall", "TSDMA/IMD", "high"),
    WeatherEvent("evt_007", "2015-12-01", 13.08, 80.27, "flash_flood",
                 "Chennai floods — record rainfall", "IMD/TNSDMA", "extreme"),
    WeatherEvent("evt_008", "2019-08-05", 16.70, 73.33, "flash_flood",
                 "Kolhapur-Sangli floods — Krishna river", "IMD/MSDMA", "high"),

    # ── Cloudbursts ──
    WeatherEvent("evt_009", "2010-08-06", 34.15, 77.58, "cloudburst",
                 "Leh cloudburst — devastating Ladakh flooding", "IMD/J&K Govt", "extreme"),
    WeatherEvent("evt_010", "2013-06-17", 30.44, 79.33, "cloudburst",
                 "Kedarnath cloudburst — triggered debris flow", "IMD/NDMA", "extreme"),
    WeatherEvent("evt_011", "2017-08-02", 31.10, 77.17, "cloudburst",
                 "Shimla region cloudburst — HP", "IMD/HPSDMA", "high"),
    WeatherEvent("evt_012", "2020-07-19", 30.33, 78.03, "cloudburst",
                 "Chamoli cloudburst — Uttarakhand", "IMD/USDMA", "high"),
    WeatherEvent("evt_013", "2019-07-28", 30.92, 78.78, "cloudburst",
                 "Mori cloudburst — Uttarkashi", "IMD", "high"),
    WeatherEvent("evt_014", "2016-07-13", 31.63, 76.53, "cloudburst",
                 "Dharamshala cloudburst — Kangra, HP", "IMD/HPSDMA", "medium"),

    # ── Severe Thunderstorms ──
    WeatherEvent("evt_015", "2018-05-02", 27.18, 80.35, "thunderstorm",
                 "UP-Rajasthan dust storm + thunderstorm — 100+ deaths", "IMD", "extreme"),
    WeatherEvent("evt_016", "2016-04-21", 26.85, 80.91, "thunderstorm",
                 "UP severe thunderstorm — widespread damage", "IMD", "high"),
    WeatherEvent("evt_017", "2018-04-14", 25.61, 85.14, "thunderstorm",
                 "Bihar thunderstorm — Gaya, Aurangabad", "IMD", "high"),
    WeatherEvent("evt_018", "2020-06-23", 26.92, 70.90, "thunderstorm",
                 "Rajasthan thunderstorm — Barmer", "IMD", "medium"),
    WeatherEvent("evt_019", "1999-10-29", 20.30, 85.83, "thunderstorm",
                 "Odisha super cyclone", "IMD", "extreme"),
    WeatherEvent("evt_020", "2017-04-06", 22.57, 88.36, "thunderstorm",
                 "Kolkata Nor'wester — severe", "IMD", "high"),
]


def latlon_to_grid(lat: float, lon: float) -> tuple:
    max_row = int(round((38.52 - 5.04) / 0.108))
    max_col = int(round((98.52 - 65.04) / 0.108))
    row = max(0, min(max_row - 1, int(round((lat - LAT_MIN) / GRID_RESOLUTION))))
    col = max(0, min(max_col - 1, int(round((lon - LON_MIN) / GRID_RESOLUTION))))
    return row, col


def grid_to_latlon(row: int, col: int) -> tuple:
    return LAT_MIN + row * GRID_RESOLUTION, LON_MIN + col * GRID_RESOLUTION


def create_label_grid(event: WeatherEvent, radius_cells: int = 1) -> np.ndarray:
    grid = np.zeros((GRID_SIZE, GRID_SIZE), dtype=np.float32)
    row, col = latlon_to_grid(event.lat, event.lon)
    for dr in range(-radius_cells, radius_cells + 1):
        for dc in range(-radius_cells, radius_cells + 1):
            r, c = row + dr, col + dc
            if 0 <= r < GRID_SIZE and 0 <= c < GRID_SIZE:
                grid[r, c] = 1.0
    return grid


def create_multi_label_grids(event: WeatherEvent, radius_cells: int = 1) -> dict:
    labels = {t: np.zeros((GRID_SIZE, GRID_SIZE), dtype=np.float32)
              for t in ["thunderstorm", "cloudburst", "flash_flood"]}
    labels[event.event_type] = create_label_grid(event, radius_cells)
    return labels


def get_events_by_type(event_type=None):
    if event_type is None:
        return HISTORICAL_EVENTS
    return [e for e in HISTORICAL_EVENTS if e.event_type == event_type]


def get_event_by_id(event_id: str):
    return next((e for e in HISTORICAL_EVENTS if e.event_id == event_id), None)


def get_train_val_split(val_ratio=0.3):
    events = HISTORICAL_EVENTS.copy()
    np.random.seed(42)
    np.random.shuffle(events)
    idx = int(len(events) * (1 - val_ratio))
    return events[:idx], events[idx:]
