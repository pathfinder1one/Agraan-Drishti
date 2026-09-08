"""
Agraan-Drishti — Authentication & Registered Users APIRouter
Subscriber registration, login, JWT token issuance, and protected subscriber roster.
"""
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends

from backend.api.sms_db import register_user, login_user, get_all_users
from backend.api.auth import require_authorized_operator, create_access_token

router = APIRouter(tags=["Auth & Users"])


class UserRegisterPayload(BaseModel):
    name: str
    phone_number: str
    latitude: float
    longitude: float
    location_name: Optional[str] = ""
    sms_enabled: Optional[bool] = True


class UserLoginPayload(BaseModel):
    phone_number: str


@router.post("/api/users/register")
def api_register_user(payload: UserRegisterPayload):
    """Register a citizen or first-responder for location-aware emergency SMS alerts."""
    try:
        user = register_user(
            name=payload.name,
            phone_number=payload.phone_number,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_name=payload.location_name or "",
            sms_enabled=payload.sms_enabled if payload.sms_enabled is not None else True
        )
        token = create_access_token({
            "sub": str(user["id"]),
            "phone": user["phone_number"],
            "name": user["name"],
            "role": "citizen"
        })
        return {
            "status": "success",
            "message": "User registered successfully for emergency alert network",
            "user": user,
            "access_token": token,
            "token_type": "bearer"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/api/users/login")
def api_login_user(payload: UserLoginPayload):
    """Log in existing registered user by mobile number."""
    user = login_user(payload.phone_number)
    if user:
        token = create_access_token({
            "sub": str(user["id"]),
            "phone": user["phone_number"],
            "name": user["name"],
            "role": "citizen"
        })
        return {
            "status": "success",
            "user": user,
            "access_token": token,
            "token_type": "bearer"
        }
    return {
        "status": "not_found",
        "message": "No emergency subscription found with this phone number. Please register."
    }


@router.get("/api/auth/guest-token")
def api_guest_token():
    """Issue an operational authorization token for command centre guest sessions."""
    token = create_access_token({
        "sub": "guest_operator_999",
        "name": "Emergency Operations Guest",
        "phone": "+919876543210",
        "role": "operator"
    })
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "role": "operator"
    }


@router.get("/api/users")
def api_get_users(_auth: dict = Depends(require_authorized_operator)):
    """Retrieve all registered emergency subscribers (requires operator authorization)."""
    users = get_all_users()
    return {"status": "success", "count": len(users), "users": users}
