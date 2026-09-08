"""
Agraan AI — Unified Authentication & Authorization Layer
Provides:
1. PyJWT-based token creation and verification
2. Role-based access control for emergency operators and field personnel
3. FastAPI dependency for securing destructive and private endpoints
"""

import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Request, Header, HTTPException, status

JWT_SECRET = os.getenv("JWT_SECRET", "agraan-drishti-emergency-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Key used for machine-to-machine, automated interlocks, or quick emergency operator access
EMERGENCY_OPERATOR_KEY = os.getenv("EMERGENCY_OPERATOR_KEY", "agraan-emergency-dev-key-2026")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=JWT_EXPIRATION_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def require_authorized_operator(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_emergency_key: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    FastAPI dependency that enforces authentication.
    Accepts:
    - 'Authorization: Bearer <JWT_or_Operator_Key>'
    - 'X-Emergency-Key: <Operator_Key>'
    """
    # 1. Check direct X-Emergency-Key header
    if x_emergency_key and x_emergency_key.strip() == EMERGENCY_OPERATOR_KEY:
        return {"sub": "system_operator", "role": "operator", "auth_method": "emergency_key"}

    # 2. Check Authorization Header
    if authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            # Support operator key as bearer for simplicity in automated systems
            if token == EMERGENCY_OPERATOR_KEY:
                return {"sub": "system_operator", "role": "operator", "auth_method": "emergency_key"}

            payload = decode_access_token(token)
            if payload:
                return payload

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Access to this emergency command endpoint requires a valid Bearer token or Emergency Operator Key.",
        headers={"WWW-Authenticate": "Bearer"},
    )
