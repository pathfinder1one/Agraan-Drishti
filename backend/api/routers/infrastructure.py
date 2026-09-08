"""
Agraan-Drishti — Infrastructure & SCADA APIRouter
Automated Machine-to-Machine (M2M) Infrastructure Triggering, SCADA Interlocks, and Operator Overrides.
"""
import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from backend.api.dynamic_infrastructure import get_dynamic_infrastructure, ping_scada_target
from backend.api.auth import require_authorized_operator

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure"])

# In-memory interlock override state tracker
M2M_OVERRIDE_STATE = {"aborted": False, "manual_override": False, "last_updated": None}


def _get_coordinate_risks(lat: float, lon: float, forecast_hour: int):
    """Retrieve risks dynamically from the centralized engine."""
    from backend.api.main import calculate_coordinate_risks
    return calculate_coordinate_risks(lat, lon, forecast_hour)


@router.get("/m2m-interlocks/{lat}/{lon}")
def get_m2m_interlocks(lat: float, lon: float, forecast_hour: int = 1):
    """
    Automatic Machine-to-Machine (M2M) Infrastructure Triggering & SCADA Interlocks.
    Dispatches automated webhook payloads and hardware signals to critical infrastructure
    dynamically resolved based on exact reverse-geocoded coordinates.
    """
    coord_data = _get_coordinate_risks(lat, lon, forecast_hour)
    composite_risk = coord_data["overall_risk"]
    
    # Dynamic regional infrastructure mapping from reverse geocoding
    targets = get_dynamic_infrastructure(lat, lon, composite_risk, M2M_OVERRIDE_STATE["aborted"])
    is_active = composite_risk > 0.35 and not M2M_OVERRIDE_STATE["aborted"]

    return {
        "lat": lat,
        "lon": lon,
        "forecast_hour": forecast_hour,
        "composite_risk": round(composite_risk * 100, 1),
        "interlock_triggered": is_active,
        "aborted_by_operator": M2M_OVERRIDE_STATE["aborted"],
        "override_window_seconds": 60,
        "trigger_timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
        "targets": targets,
        "transparency_framework": {
            "tier": "SIMULATED SCADA PAYLOAD / WEBHOOK READY",
            "one_concern_safeguard": "Unlike One Concern's unvalidated proprietary black-box claims, Agraan AI uses open industrial standards (MQTT/IEC-60870) paired with a strict 60s Human-in-the-Loop abort override before physical actuation.",
            "production_prerequisite": "Requires optical isolation barrier (Data Diode) & CWC/NHAI authority gateway authorization."
        }
    }


@router.post("/m2m-test-ping")
def post_m2m_test_ping(payload: dict):
    """Test SCADA node ping handshake with sub-50ms roundtrip verification."""
    target_id = payload.get("target_id", "hydro_sluice_gate")
    lat = float(payload.get("lat", 28.75))
    lon = float(payload.get("lon", 77.50))
    return ping_scada_target(target_id, lat, lon)


@router.post("/m2m-override")
def post_m2m_override(payload: Optional[dict] = None, _auth: dict = Depends(require_authorized_operator)):
    """Toggle manual abort or resume of automated M2M interlocks (Requires authorized operator)."""
    action = payload.get("action", "toggle") if payload else "toggle"
    if action == "abort":
        M2M_OVERRIDE_STATE["aborted"] = True
    elif action == "resume":
        M2M_OVERRIDE_STATE["aborted"] = False
    else:
        M2M_OVERRIDE_STATE["aborted"] = not M2M_OVERRIDE_STATE["aborted"]
    M2M_OVERRIDE_STATE["last_updated"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return {"status": "ok", "aborted": M2M_OVERRIDE_STATE["aborted"]}
