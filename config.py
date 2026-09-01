"""
Central configuration for the AI Disaster Command Map.
Shared across data pipeline, model training, backend API, etc.
"""
from pathlib import Path

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "dataset_weather"
ATMOSPHERIC_DIR = DATA_DIR / "Atmospheric_variable"
SURFACE_DIR = DATA_DIR / "Surface_variables"
CONSTANTS_DIR = DATA_DIR / "Constants"
MODEL_DIR = PROJECT_ROOT / "checkpoints"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

MODEL_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# ──────────────────────────────────────────────
# Grid (IMDAA 0.108° -> ~12km High-Res)
# ──────────────────────────────────────────────
GRID_SIZE = 32
GRID_RESOLUTION = 0.108
LAT_MIN, LAT_MAX = 5.04, 38.52
LON_MIN, LON_MAX = 65.04, 98.52
YEAR_START, YEAR_END = 1990, 2020

# ──────────────────────────────────────────────
# Pressure Levels (hPa)
# ──────────────────────────────────────────────
PRESSURE_LEVELS_ALL = [50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 850, 925, 1000]
PRESSURE_LEVELS_SELECTED = [200, 500, 700, 850, 925]

# Physical constants
GRAVITY = 9.81
Rd = 287.05
Rv = 461.5
Cp = 1005.7
Lv = 2.5e6
EPSILON = Rd / Rv

# ──────────────────────────────────────────────
# Features
# ──────────────────────────────────────────────
FEATURE_CHANNELS = [
    "cape", "cin", "iwv", "iwv_rate", "convergence",
    "wind_shear", "mslp_gradient", "precip", "t2m_anomaly", "rh_column",
]
NUM_FEATURES = len(FEATURE_CHANNELS)

# ──────────────────────────────────────────────
# Model
# ──────────────────────────────────────────────
SEQ_LEN = 6
HIDDEN_DIM = 64
NUM_CONVLSTM_LAYERS = 2
ATTENTION_HEADS = 4
KERNEL_SIZE = 3
BATCH_SIZE = 8
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-5
NUM_EPOCHS = 50
EARLY_STOP_PATIENCE = 10

LOSS_WEIGHT_THUNDERSTORM = 1.0
LOSS_WEIGHT_CLOUDBURST = 1.0
LOSS_WEIGHT_FLASHFLOOD = 1.5

# ──────────────────────────────────────────────
# Alerts
# ──────────────────────────────────────────────
ALERT_THRESHOLDS = {
    "watch":     {"thunderstorm": 0.50, "cloudburst": 0.50, "flash_flood": 0.40, "persistence": 1},
    "warning":   {"thunderstorm": 0.70, "cloudburst": 0.70, "flash_flood": 0.60, "persistence": 2},
    "emergency": {"thunderstorm": 0.85, "cloudburst": 0.85, "flash_flood": 0.75, "persistence": 2, "multi_signal": True},
}

# ──────────────────────────────────────────────
# Forecast & Events
# ──────────────────────────────────────────────
FORECAST_HOURS = [0, 1, 2, 3, 4, 6]
TIMESTEP_HOURS = 6
EVENT_TYPES = ["thunderstorm", "cloudburst", "flash_flood"]
NUM_EVENT_TYPES = len(EVENT_TYPES)

# ──────────────────────────────────────────────
# XAI Thresholds
# ──────────────────────────────────────────────
CAPE_THRESHOLDS = {"marginal": 500, "moderate": 1000, "high": 2500, "extreme": 4000}
IWV_RATE_THRESHOLD = 5.0
CONVERGENCE_THRESHOLD = 1e-5
SHEAR_THRESHOLD = 15.0

# ──────────────────────────────────────────────
# API
# ──────────────────────────────────────────────
API_HOST = "0.0.0.0"
API_PORT = 8000
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
