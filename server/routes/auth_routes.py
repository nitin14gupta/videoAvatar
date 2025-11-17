import os
import time
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from email_validator import validate_email, EmailNotValidError
from utils.auth_utils import hash_password, verify_password, create_jwt, generate_reset_code
from utils.email_service import email_service
from db.config import get_supabase_client


auth_router = APIRouter()


# Pydantic models for request validation
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResetRequestRequest(BaseModel):
    email: EmailStr


class ResetVerifyRequest(BaseModel):
    email: EmailStr
    code: str


class ResetConfirmRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


def _get_users_table():
    # Expect a table named 'users' with columns: id (uuid/text), name, email (unique), password_hash
    return get_supabase_client().table("users")


def _get_reset_table():
    # Table: password_resets with columns: email, code, expires_at (epoch seconds)
    return get_supabase_client().table("password_resets")


def _get_verification_table():
    # Table: email_verifications with columns: email, code, expires_at (epoch seconds)
    return get_supabase_client().table("email_verifications")


@auth_router.post("/register")
async def register(request: RegisterRequest):
    name = request.name.strip()
    email = request.email.strip().lower()
    password = request.password

    if not name or not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="name, email, password are required"
        )

    try:
        validate_email(email)
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    users = _get_users_table()
    # Check if exists
    exists = users.select("id").eq("email", email).execute()
    if exists.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Generate verification code
    code = generate_reset_code()
    expires_at = int(time.time()) + 15 * 60  # 15 minutes
    
    # Store verification data
    verifications = _get_verification_table()
    verifications.upsert({
        "email": email, 
        "code": code, 
        "expires_at": expires_at,
        "name": name,
        "password_hash": hash_password(password)
    }).execute()

    # Send verification email
    sent = email_service.send_verification_code(email, code, name)
    return {"ok": True, "sent": bool(sent), "message": "Verification code sent to your email"}


@auth_router.post("/login")
async def login(request: LoginRequest):
    email = request.email.strip().lower()
    password = request.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email and password are required"
        )

    try:
        validate_email(email)
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    users = _get_users_table()
    res = users.select("id,name,email,password_hash").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user = res.data[0]
    if not verify_password(password, user.get("password_hash") or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_jwt({"sub": user.get("id") or user.get("email"), "email": user.get("email")})

    # Optional: login notification (best-effort)
    try:
        email_service.send_login_notification_email(email, login_time=time.strftime("%Y-%m-%d %H:%M:%S"))
    except Exception:
        pass

    return {"token": token, "user": {"id": user.get("id"), "name": user.get("name"), "email": user.get("email")}}


@auth_router.post("/reset/request")
async def request_reset(request: ResetRequestRequest):
    email = request.email.strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email is required"
        )
    try:
        validate_email(email)
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    users = _get_users_table()
    res = users.select("id").eq("email", email).limit(1).execute()
    if not res.data:
        # Don't reveal user existence
        return {"ok": True}

    code = generate_reset_code()
    expires_at = int(time.time()) + 10 * 60  # 10 minutes
    resets = _get_reset_table()
    # Upsert by email
    resets.upsert({"email": email, "code": code, "expires_at": expires_at}).execute()

    sent = email_service.send_password_reset_code(email, code)
    return {"ok": True, "sent": bool(sent)}


@auth_router.post("/reset/verify")
async def verify_reset(request: ResetVerifyRequest):
    email = request.email.strip().lower()
    code = request.code.strip()
    if not email or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email and code are required"
        )

    resets = _get_reset_table()
    res = resets.select("code,expires_at").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code"
        )
    rec = res.data[0]
    if rec.get("code") != code or int(rec.get("expires_at", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )
    return {"ok": True}


@auth_router.post("/reset/confirm")
async def confirm_reset(request: ResetConfirmRequest):
    email = request.email.strip().lower()
    code = request.code.strip()
    new_password = request.new_password
    if not email or not code or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email, code, new_password are required"
        )

    resets = _get_reset_table()
    res = resets.select("code,expires_at").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code"
        )
    rec = res.data[0]
    if rec.get("code") != code or int(rec.get("expires_at", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )

    users = _get_users_table()
    pw_hash = hash_password(new_password)
    upd = users.update({"password_hash": pw_hash}).eq("email", email).execute()
    # Best-effort: delete used code
    try:
        resets.delete().eq("email", email).execute()
    except Exception:
        pass

    try:
        email_service.send_password_changed_email(email)
    except Exception:
        pass

    if upd.data is None:
        # Some drivers return None on update success; still return ok
        return {"ok": True}
    return {"ok": True}


@auth_router.post("/verify/email")
async def verify_email(request: VerifyEmailRequest):
    email = request.email.strip().lower()
    code = request.code.strip()
    
    if not email or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email and code are required"
        )

    verifications = _get_verification_table()
    res = verifications.select("code,expires_at,name,password_hash").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    rec = res.data[0]
    if rec.get("code") != code or int(rec.get("expires_at", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

    # Create user account
    users = _get_users_table()
    created = users.insert({
        "name": rec.get("name"), 
        "email": email, 
        "password_hash": rec.get("password_hash")
    }).execute()
    
    if not created.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )

    # Clean up verification record
    try:
        verifications.delete().eq("email", email).execute()
    except Exception:
        pass

    # Send welcome email
    try:
        email_service.send_welcome_email(email, rec.get("name"))
    except Exception:
        pass

    user = created.data[0]
    token = create_jwt({"sub": user.get("id") or user.get("email"), "email": email})
    return {"token": token, "user": {"id": user.get("id"), "name": rec.get("name"), "email": email}}


@auth_router.post("/verify/resend")
async def resend_verification(request: ResendVerificationRequest):
    email = request.email.strip().lower()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email is required"
        )

    try:
        validate_email(email)
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    verifications = _get_verification_table()
    res = verifications.select("code,expires_at,name").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending verification found"
        )

    # Generate new code
    code = generate_reset_code()
    expires_at = int(time.time()) + 15 * 60  # 15 minutes
    
    # Update verification record
    verifications.update({
        "code": code,
        "expires_at": expires_at
    }).eq("email", email).execute()

    # Send verification email
    sent = email_service.send_verification_code(email, code, res.data[0].get("name"))
    return {"ok": True, "sent": bool(sent), "message": "New verification code sent to your email"}

