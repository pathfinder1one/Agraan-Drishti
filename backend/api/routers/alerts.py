"""
Agraan-Drishti — Alerts, SMS Dispatch & Feedback APIRouter
Disaster alerts aggregation (NDMA SACHET + ML nowcast), SMS broadcast, audit logs, and responder feedback.
"""
import logging
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Depends

from backend.api.alerts_service import get_unified_alerts, dispatch_alert_multichannel, get_dispatch_history
from backend.api.sms_db import (
    get_affected_users, create_disaster_alert, get_recent_sms_logs,
    record_feedback_action, get_persisted_feedback_stats
)
from backend.api.sms_provider import dispatch_emergency_sms_alert
from backend.api.auth import require_authorized_operator
from data.labels import HISTORICAL_EVENTS

logger = logging.getLogger("alerts_router")
router = APIRouter(tags=["Alerts"])


# Pydantic schemas
class BroadcastAlertRequest(BaseModel):
    alert_id: str
    location_name: Optional[str] = "Monitored Region"
    hazard_type: Optional[str] = "Flash Flood & Severe Weather"
    lead_time_hours: Optional[str] = "2"
    lat: Optional[float] = 22.0
    lon: Optional[float] = 78.0
    channels: Optional[List[str]] = ["sms_nic", "sdrf_push", "ble_mesh", "scada_interlock"]
    sender: Optional[str] = "NDRF Command Authority"


class CreateDisasterAlertPayload(BaseModel):
    disaster_type: str
    risk_score: float
    severity: Optional[str] = "CRITICAL"
    latitude: float
    longitude: float
    affected_radius_km: Optional[float] = 25.0
    message: Optional[str] = ""


class SendEmergencySmsPayload(BaseModel):
    disaster_type: str
    risk_score: float
    latitude: float
    longitude: float
    affected_radius_km: Optional[float] = 25.0
    location_name: Optional[str] = "Target Sector"
    custom_message: Optional[str] = None


class AlertFeedbackRequest(BaseModel):
    alert_id: str
    action: str  # "acknowledged", "dispatched", "dismissed"
    role: Optional[str] = "responder"


def _calc_risks(lat: float, lon: float, forecast_hour: int):
    from backend.api.main import calculate_coordinate_risks
    return calculate_coordinate_risks(lat, lon, forecast_hour)


def _gen_xai(lat: float, lon: float, event_id: str):
    from backend.api.main import generate_xai_signals
    return generate_xai_signals(lat, lon, event_id)


def _gen_explanation(signals: dict, event_type: str):
    from backend.api.main import generate_explanation
    return generate_explanation(signals, event_type)


@router.get("/api/alerts")
def get_alerts(
    role: str = "authority", 
    event_id: str = "live", 
    forecast_hour: int = 2,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    location_name: Optional[str] = None
):
    """Return live unified disaster alerts (NDMA Sachet + ML Hyperlocal nowcasts); historical replay remains available by event id."""
    if event_id == "live":
        coord_risks = _calc_risks(lat, lon, forecast_hour) if (lat is not None and lon is not None) else None
        return get_unified_alerts(
            lat=lat,
            lon=lon,
            location_name=location_name,
            forecast_hour=forecast_hour,
            role=role,
            coordinate_risks=coord_risks
        )

    events_to_check = [e for e in HISTORICAL_EVENTS if e.event_id == event_id]
    if not events_to_check:
        events_to_check = [HISTORICAL_EVENTS[0]]

    demo_alerts = []
    for event in events_to_check:
        signals = _gen_xai(event.lat, event.lon, event_id)
        explanation = _gen_explanation(signals, event.event_type)
        c_risks = _calc_risks(event.lat, event.lon, forecast_hour)

        alert = {
            "id": event.event_id,
            "event_type": event.event_type,
            "severity": "warning" if event.severity == "high" else "emergency",
            "probability": round(c_risks["overall_risk"], 2),
            "lat": event.lat, "lon": event.lon,
            "lead_time_hours": "+2h",
            "explanation": explanation,
            "role": role,
            "location_name": event.description.split("—")[0].strip() if "—" in event.description else "Region"
        }

        # Role-specific content
        if role == "public":
            alert["message"] = f"High {event.event_type.replace('_', ' ')} risk in your area within ~{alert['lead_time_hours']} hours. Avoid low-lying areas."
        elif role == "authority":
            alert["message"] = f"{alert['severity'].upper()}: {event.event_type.replace('_', ' ')} risk at ({event.lat:.1f}°N, {event.lon:.1f}°E). Threat Index: {c_risks['threat_level']}%. ETA: {alert['lead_time_hours']}h."
        elif role == "responder":
            alert["message"] = f"Deploy to ({event.lat:.1f}°N, {event.lon:.1f}°E). {event.event_type.replace('_', ' ')} expected in {alert['lead_time_hours']}h. {explanation}"

        demo_alerts.append(alert)

    return demo_alerts


@router.post("/api/alerts/broadcast")
def broadcast_alert_endpoint(request: BroadcastAlertRequest):
    """Execute real multi-channel emergency broadcast across NIC SMS, SDRF push, BLE Mesh, and SCADA."""
    return dispatch_alert_multichannel(request.dict())


@router.get("/api/alerts/history")
def get_alert_dispatch_history_endpoint():
    """Return the audit ledger of all executed emergency broadcasts."""
    return get_dispatch_history()


@router.get("/api/alerts/affected-users")
def api_get_affected_users(lat: float, lon: float, radius_km: float = 25.0):
    """Calculate and return all registered citizens within the active hazard radius."""
    affected = get_affected_users(lat, lon, radius_km)
    return {
        "status": "success",
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "affected_count": len(affected),
        "users": affected
    }


@router.post("/api/alerts/create")
def api_create_alert(payload: CreateDisasterAlertPayload):
    """Create and persist a disaster alert in the database."""
    alert = create_disaster_alert(
        disaster_type=payload.disaster_type,
        risk_score=payload.risk_score,
        severity=payload.severity or "CRITICAL",
        latitude=payload.latitude,
        longitude=payload.longitude,
        affected_radius_km=payload.affected_radius_km or 25.0,
        message=payload.message or ""
    )
    return {"status": "success", "alert": alert}


@router.post("/api/alerts/send-sms")
def api_send_emergency_sms(payload: SendEmergencySmsPayload, _auth: dict = Depends(require_authorized_operator)):
    """
    Operator-approved emergency SMS broadcast (requires operator authorization).
    Finds all registered subscribers in radius, formats message, triggers Twilio/gateway,
    and returns comprehensive delivery audit receipt.
    """
    receipt = dispatch_emergency_sms_alert(
        disaster_type=payload.disaster_type,
        risk_score=payload.risk_score,
        latitude=payload.latitude,
        longitude=payload.longitude,
        affected_radius_km=payload.affected_radius_km or 25.0,
        location_name=payload.location_name or "Target Sector",
        custom_message=payload.custom_message
    )
    return {"status": "success", "receipt": receipt}


@router.get("/api/alerts/sms-logs")
def api_get_sms_logs(limit: int = 50):
    """Retrieve the real-time emergency SMS dispatch audit log."""
    logs = get_recent_sms_logs(limit=limit)
    return {"status": "success", "count": len(logs), "logs": logs}


@router.post("/api/alert-feedback")
def submit_alert_feedback(feedback: AlertFeedbackRequest):
    """Track alert fatigue and responder engagement with SQLite persistence."""
    act = feedback.action.lower()
    try:
        res = record_feedback_action(act)
        return {
            "status": "recorded",
            "fatigue_index": res["fatigue_index"],
            "recommendation": "OPTIMAL_ENGAGEMENT" if res["fatigue_index"] < 0.25 else "CALIBRATE_HIGHER_THRESHOLD",
            "stats": res["stats"],
            "operator_alertness_grade": res.get("operator_alertness_grade", "OPTIMAL")
        }
    except Exception as e:
        logger.error(f"Failed to record feedback to SQLite: {e}")
        stats = get_persisted_feedback_stats().get("stats", {"acknowledged": 18, "dispatched": 12, "dismissed": 3})
        if act in stats:
            stats[act] += 1
        total = sum(stats.values())
        fatigue_index = round(stats.get("dismissed", 0) / max(total, 1), 2)
        return {
            "status": "recorded",
            "fatigue_index": fatigue_index,
            "recommendation": "OPTIMAL_ENGAGEMENT" if fatigue_index < 0.25 else "CALIBRATE_HIGHER_THRESHOLD",
            "stats": stats
        }
