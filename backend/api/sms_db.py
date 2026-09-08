"""
Agraan AI — Unified Emergency Database & Operational Ledger
Thread-safe SQLite persistence for:
1. Registered citizens & responders (phone, GPS location, SMS consent)
2. Disaster alerts (type, risk score, severity, center coords, radius)
3. SMS delivery audit logs (message, provider ID, delivery status)
4. Citizen ground reports (crowdsourced verification feed)
5. Multi-channel dispatch audit ledger (persisted across server restarts)
6. Alert feedback & fatigue telemetry stats
"""

import sqlite3
import os
import json
import math
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional

DB_PATH = Path(__file__).parent.parent / "emergency_alerts.db"


def get_db_connection() -> sqlite3.Connection:
    """Create a thread-safe connection with row factory and WAL mode."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # High-concurrency performance and reliability pragmas
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


@contextmanager
def get_db_context():
    """Context manager for automatic commit, rollback on error, and clean closure."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        yield cursor, conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize all database tables and seed baseline demonstration telemetry if empty."""
    with get_db_context() as (cursor, conn):
        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL UNIQUE,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_name TEXT,
            sms_enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """)

        # 2. Disaster alerts table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS disaster_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_type TEXT NOT NULL,
            risk_score REAL NOT NULL,
            severity TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            affected_radius_km REAL NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)

        # 3. SMS logs table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sms_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id INTEGER,
            user_id INTEGER,
            phone_number TEXT NOT NULL,
            message TEXT NOT NULL,
            provider_message_id TEXT,
            status TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            FOREIGN KEY(alert_id) REFERENCES disaster_alerts(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        # 4. Ground Reports table (Crowdsourced citizen reports persisted)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ground_reports (
            id TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            location_name TEXT NOT NULL,
            hazard_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            reporter_role TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            model_match TEXT NOT NULL,
            verified INTEGER NOT NULL DEFAULT 1
        )
        """)

        # 5. Dispatch Audit Ledger table (Multi-channel broadcasts persisted)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS dispatch_audit_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dispatch_id TEXT NOT NULL UNIQUE,
            timestamp TEXT NOT NULL,
            alert_id TEXT,
            location_name TEXT NOT NULL,
            lat REAL,
            lon REAL,
            channels_used TEXT NOT NULL,
            total_recipients INTEGER NOT NULL,
            status TEXT NOT NULL,
            mesh_packet_hash TEXT,
            channels_receipt TEXT NOT NULL
        )
        """)

        # 6. Alert Feedback Stats table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alert_feedback_stats (
            action TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0
        )
        """)

        # Seed demonstration users if table is empty
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            now = datetime.now(timezone.utc).isoformat()
            demo_users = [
                ("Harshit", "+919876543210", 28.6139, 77.2090, "New Delhi, Delhi", 1, now),
                ("Chirag", "+919812345678", 30.28, 78.98, "Rudraprayag, Uttarakhand", 1, now),
                ("SDRF Quick Response Unit", "+919998887770", 30.73, 79.06, "Kedarnath Dham Corridor", 1, now),
                ("Priya Sharma", "+919123456780", 28.75, 77.50, "Muradnagar / Hindon, UP", 1, now),
            ]
            cursor.executemany("""
            INSERT INTO users (name, phone_number, latitude, longitude, location_name, sms_enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, demo_users)

        # Seed demonstration ground reports if empty
        cursor.execute("SELECT COUNT(*) FROM ground_reports")
        if cursor.fetchone()[0] == 0:
            demo_reports = [
                (
                    "rep_101", 30.73, 79.06, "Rudraprayag Valley, Kedarnath Route", "flash_flood", "extreme",
                    "Mandakini river level rising rapidly near bridge, heavy rain since 40 mins.",
                    "Gram Pradhan / Patroller", "2026-09-03T02:45:00Z", "CONFIRMED_CRITICAL", 1
                ),
                (
                    "rep_102", 30.38, 79.22, "Chamoli Highway Block", "cloudburst", "severe",
                    "Intense torrential downpour with minor rockfall on NH-58.",
                    "Citizen Commuter", "2026-09-03T03:10:00Z", "HIGH_CORRELATION", 1
                )
            ]
            cursor.executemany("""
            INSERT INTO ground_reports (id, lat, lon, location_name, hazard_type, severity, description, reporter_role, timestamp, model_match, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, demo_reports)

        # Seed initial dispatch ledger if empty
        cursor.execute("SELECT COUNT(*) FROM dispatch_audit_ledger")
        if cursor.fetchone()[0] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute("""
            INSERT INTO dispatch_audit_ledger (
                dispatch_id, timestamp, alert_id, location_name, lat, lon,
                channels_used, total_recipients, status, mesh_packet_hash, channels_receipt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "DSP-2026-IND-00194", now_iso, "ALT-GOV-INIT", "NDRF HQ, New Delhi", 28.6139, 77.2090,
                json.dumps(["sms_nic", "sdrf_push", "ble_mesh", "scada_interlock"]),
                24500, "DELIVERED", "0x8f2a11b9c3e4567d",
                json.dumps({
                    "sms_nic": {"status": "DELIVERED", "recipients": 18200},
                    "sdrf_push": {"status": "ACKNOWLEDGED", "units": 4},
                    "ble_mesh": {"status": "BROADCAST", "hops": 12},
                    "scada_interlock": {"status": "ARMED", "actuators": 8}
                })
            ))

        # Seed feedback stats if empty
        cursor.execute("SELECT COUNT(*) FROM alert_feedback_stats")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
            INSERT INTO alert_feedback_stats (action, count) VALUES (?, ?)
            """, [("acknowledged", 18), ("dispatched", 12), ("dismissed", 3)])


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


# ==========================================
# User Registry Methods
# ==========================================

def register_user(name: str, phone_number: str, latitude: float, longitude: float, location_name: str = "", sms_enabled: bool = True) -> Dict[str, Any]:
    """Register or update a user with GPS location and SMS consent."""
    phone_clean = phone_number.strip().replace(" ", "")
    now = datetime.now(timezone.utc).isoformat()
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT id FROM users WHERE phone_number = ?", (phone_clean,))
        row = cursor.fetchone()
        if row:
            user_id = row["id"]
            cursor.execute("""
            UPDATE users 
            SET name = ?, latitude = ?, longitude = ?, location_name = ?, sms_enabled = ?
            WHERE id = ?
            """, (name, latitude, longitude, location_name, 1 if sms_enabled else 0, user_id))
        else:
            cursor.execute("""
            INSERT INTO users (name, phone_number, latitude, longitude, location_name, sms_enabled, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (name, phone_clean, latitude, longitude, location_name, 1 if sms_enabled else 0, now))
            user_id = cursor.lastrowid

        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return dict(cursor.fetchone())


def login_user(phone_number: str) -> Optional[Dict[str, Any]]:
    """Look up an existing user by phone number."""
    phone_clean = phone_number.strip().replace(" ", "")
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT * FROM users WHERE phone_number = ? OR phone_number LIKE ?", 
                       (phone_clean, f"%{phone_clean[-10:]}%"))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def get_all_users() -> List[Dict[str, Any]]:
    """Return all registered users."""
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT * FROM users ORDER BY id DESC")
        return [dict(r) for r in cursor.fetchall()]


def get_affected_users(center_lat: float, center_lon: float, radius_km: float) -> List[Dict[str, Any]]:
    """Find all registered users with SMS enabled within the radius of an alert."""
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT * FROM users WHERE sms_enabled = 1")
        all_active = [dict(r) for r in cursor.fetchall()]

    affected = []
    for u in all_active:
        dist = haversine_distance_km(center_lat, center_lon, u["latitude"], u["longitude"])
        if dist <= radius_km:
            u_copy = dict(u)
            u_copy["distance_km"] = round(dist, 2)
            affected.append(u_copy)

    affected.sort(key=lambda x: x["distance_km"])
    return affected


# ==========================================
# Disaster Alert & SMS Log Methods
# ==========================================

def create_disaster_alert(disaster_type: str, risk_score: float, severity: str, 
                          latitude: float, longitude: float, affected_radius_km: float, 
                          message: str) -> Dict[str, Any]:
    """Create a persistent disaster alert record."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db_context() as (cursor, conn):
        cursor.execute("""
        INSERT INTO disaster_alerts (disaster_type, risk_score, severity, latitude, longitude, affected_radius_km, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (disaster_type, risk_score, severity, latitude, longitude, affected_radius_km, message, now))
        alert_id = cursor.lastrowid
        cursor.execute("SELECT * FROM disaster_alerts WHERE id = ?", (alert_id,))
        return dict(cursor.fetchone())


def log_sms(alert_id: Optional[int], user_id: Optional[int], phone_number: str, 
            message: str, provider_message_id: str, status: str) -> Dict[str, Any]:
    """Write an entry to the SMS delivery audit log."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db_context() as (cursor, conn):
        cursor.execute("""
        INSERT INTO sms_logs (alert_id, user_id, phone_number, message, provider_message_id, status, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (alert_id, user_id, phone_number, message, provider_message_id, status, now))
        log_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sms_logs WHERE id = ?", (log_id,))
        return dict(cursor.fetchone())


def get_recent_sms_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """Return the most recent SMS delivery audit records."""
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT * FROM sms_logs ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(r) for r in cursor.fetchall()]


# ==========================================
# Ground Reports Persistence Methods
# ==========================================

def save_ground_report(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """Persist a new citizen or responder ground report into SQLite."""
    with get_db_context() as (cursor, conn):
        cursor.execute("""
        INSERT INTO ground_reports (id, lat, lon, location_name, hazard_type, severity, description, reporter_role, timestamp, model_match, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_data["id"],
            float(report_data["lat"]),
            float(report_data["lon"]),
            report_data.get("location_name", "Field Observation"),
            report_data["hazard_type"],
            report_data["severity"],
            report_data["description"],
            report_data.get("reporter_role", "Citizen Commuter"),
            report_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            report_data.get("model_match", "CORRELATED"),
            1 if report_data.get("verified", True) else 0
        ))
        cursor.execute("SELECT * FROM ground_reports WHERE id = ?", (report_data["id"],))
        res = dict(cursor.fetchone())
        res["verified"] = bool(res["verified"])
        return res


def get_persisted_ground_reports(lat: Optional[float] = None, lon: Optional[float] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Query ground reports from SQLite with optional geographical proximity filtering."""
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT * FROM ground_reports ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]

    for r in rows:
        r["verified"] = bool(r["verified"])

    if lat is not None and lon is not None:
        return [r for r in rows if abs(r["lat"] - lat) < 1.5 and abs(r["lon"] - lon) < 1.5]
    return rows


def get_ground_reports_count_near(lat: float, lon: float, radius_deg: float = 1.0) -> int:
    """Return the count of reports within a coordinate box."""
    with get_db_context() as (cursor, conn):
        cursor.execute("""
        SELECT COUNT(*) FROM ground_reports
        WHERE ABS(lat - ?) < ? AND ABS(lon - ?) < ?
        """, (lat, radius_deg, lon, radius_deg))
        return cursor.fetchone()[0]


# ==========================================
# Dispatch Audit Ledger Persistence Methods
# ==========================================

def save_dispatch_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Persist a multi-channel emergency broadcast record into SQLite."""
    coords = record.get("coordinates", {})
    with get_db_context() as (cursor, conn):
        cursor.execute("""
        INSERT OR REPLACE INTO dispatch_audit_ledger (
            dispatch_id, timestamp, alert_id, location_name, lat, lon,
            channels_used, total_recipients, status, mesh_packet_hash, channels_receipt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record["dispatch_id"],
            record.get("timestamp", datetime.now(timezone.utc).isoformat()),
            record.get("alert_id"),
            record["location_name"],
            coords.get("lat") if isinstance(coords, dict) else None,
            coords.get("lon") if isinstance(coords, dict) else None,
            json.dumps(record.get("channels_used", [])),
            int(record.get("total_recipients", 0)),
            record.get("status", "DISPATCHED"),
            record.get("mesh_packet_hash"),
            json.dumps(record.get("channels_receipt", {}))
        ))
        cursor.execute("SELECT * FROM dispatch_audit_ledger WHERE dispatch_id = ?", (record["dispatch_id"],))
        row = dict(cursor.fetchone())
        # Restore JSON fields
        row["channels_used"] = json.loads(row["channels_used"])
        row["channels_receipt"] = json.loads(row["channels_receipt"])
        row["coordinates"] = {"lat": row["lat"], "lon": row["lon"]}
        return row


def get_persisted_dispatch_history(limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieve persisted dispatch audit records."""
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT * FROM dispatch_audit_ledger ORDER BY id DESC LIMIT ?", (limit,))
        raw_rows = [dict(r) for r in cursor.fetchall()]

    result = []
    for row in raw_rows:
        try:
            row["channels_used"] = json.loads(row["channels_used"])
        except Exception:
            pass
        try:
            row["channels_receipt"] = json.loads(row["channels_receipt"])
        except Exception:
            pass
        row["coordinates"] = {"lat": row["lat"], "lon": row["lon"]}
        result.append(row)
    return result


# ==========================================
# Alert Feedback Stats Persistence Methods
# ==========================================

def record_feedback_action(action: str) -> Dict[str, Any]:
    """Increment feedback action counter in SQLite and return updated stats."""
    valid_actions = {"acknowledged", "dispatched", "dismissed"}
    act = action.lower().strip()
    if act not in valid_actions:
        act = "acknowledged"

    with get_db_context() as (cursor, conn):
        cursor.execute("""
        INSERT INTO alert_feedback_stats (action, count)
        VALUES (?, 1)
        ON CONFLICT(action) DO UPDATE SET count = count + 1
        """, (act,))

    return get_persisted_feedback_stats()


def get_persisted_feedback_stats() -> Dict[str, Any]:
    """Return all feedback stats from SQLite."""
    with get_db_context() as (cursor, conn):
        cursor.execute("SELECT action, count FROM alert_feedback_stats")
        stats = {r["action"]: r["count"] for r in cursor.fetchall()}

    # Ensure all baseline keys exist
    for key in ["acknowledged", "dispatched", "dismissed"]:
        if key not in stats:
            stats[key] = 0

    total = sum(stats.values())
    fatigue_index = round(stats.get("dismissed", 0) / max(total, 1), 2)
    return {
        "stats": stats,
        "total_responses": total,
        "fatigue_index": fatigue_index,
        "operator_alertness_grade": "OPTIMAL" if fatigue_index < 0.25 else ("MODERATE_FATIGUE" if fatigue_index < 0.5 else "HIGH_FATIGUE")
    }


# Auto-initialize database schema on import
init_db()
