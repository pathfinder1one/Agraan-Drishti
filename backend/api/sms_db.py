"""
DisasterGuard AI — Emergency SMS Alert System Database
SQLite-backed persistence for:
1. Registered users (phone, GPS location, SMS consent)
2. Disaster alerts (type, risk score, severity, center coords, radius)
3. SMS delivery audit logs (message, provider ID, delivery status)
"""

import sqlite3
import os
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional

DB_PATH = Path(__file__).parent.parent / "emergency_alerts.db"


def get_db_connection() -> sqlite3.Connection:
    """Create a connection with row factory for dict-like access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

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

    # Seed default demonstration user if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO users (name, phone_number, latitude, longitude, location_name, sms_enabled, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("Harshit", "+919876543210", 28.6139, 77.2090, "New Delhi, Delhi", 1, now))
        cursor.execute("""
        INSERT INTO users (name, phone_number, latitude, longitude, location_name, sms_enabled, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("Chirag", "+919812345678", 30.28, 78.98, "Rudraprayag, Uttarakhand", 1, now))
        cursor.execute("""
        INSERT INTO users (name, phone_number, latitude, longitude, location_name, sms_enabled, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("SDRF Quick Response Unit", "+919998887770", 30.73, 79.06, "Kedarnath Dham Corridor", 1, now))
        cursor.execute("""
        INSERT INTO users (name, phone_number, latitude, longitude, location_name, sms_enabled, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("Priya Sharma", "+919123456780", 28.75, 77.50, "Muradnagar / Hindon, UP", 1, now))

    conn.commit()
    conn.close()


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    R = 6371.0  # Earth's radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def register_user(name: str, phone_number: str, latitude: float, longitude: float, location_name: str = "", sms_enabled: bool = True) -> Dict[str, Any]:
    """Register or update a user with GPS location and SMS consent."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    phone_clean = phone_number.strip().replace(" ", "")

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

    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    conn.close()
    return user


def login_user(phone_number: str) -> Optional[Dict[str, Any]]:
    """Look up an existing user by phone number."""
    conn = get_db_connection()
    cursor = conn.cursor()
    phone_clean = phone_number.strip().replace(" ", "")
    cursor.execute("SELECT * FROM users WHERE phone_number = ? OR phone_number LIKE ?", 
                   (phone_clean, f"%{phone_clean[-10:]}%"))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def get_all_users() -> List[Dict[str, Any]]:
    """Return all registered users."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def get_affected_users(center_lat: float, center_lon: float, radius_km: float) -> List[Dict[str, Any]]:
    """Find all registered users with SMS enabled within the radius of an alert."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE sms_enabled = 1")
    all_active = [dict(r) for r in cursor.fetchall()]
    conn.close()

    affected = []
    for u in all_active:
        dist = haversine_distance_km(center_lat, center_lon, u["latitude"], u["longitude"])
        if dist <= radius_km:
            u_copy = dict(u)
            u_copy["distance_km"] = round(dist, 2)
            affected.append(u_copy)

    affected.sort(key=lambda x: x["distance_km"])
    return affected


def create_disaster_alert(disaster_type: str, risk_score: float, severity: str, 
                          latitude: float, longitude: float, affected_radius_km: float, 
                          message: str) -> Dict[str, Any]:
    """Create a persistent disaster alert record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO disaster_alerts (disaster_type, risk_score, severity, latitude, longitude, affected_radius_km, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (disaster_type, risk_score, severity, latitude, longitude, affected_radius_km, message, now))
    alert_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM disaster_alerts WHERE id = ?", (alert_id,))
    alert = dict(cursor.fetchone())
    conn.close()
    return alert


def log_sms(alert_id: Optional[int], user_id: Optional[int], phone_number: str, 
            message: str, provider_message_id: str, status: str) -> Dict[str, Any]:
    """Write an entry to the SMS delivery audit log."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO sms_logs (alert_id, user_id, phone_number, message, provider_message_id, status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (alert_id, user_id, phone_number, message, provider_message_id, status, now))
    log_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM sms_logs WHERE id = ?", (log_id,))
    entry = dict(cursor.fetchone())
    conn.close()
    return entry


def get_recent_sms_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """Return the most recent SMS delivery audit records."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sms_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


# Auto-initialize database on import
init_db()
