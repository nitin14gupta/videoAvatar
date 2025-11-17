import os
import time
import bcrypt
import jwt
from typing import Dict, Any, Optional
from dotenv import load_dotenv


load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "change-me")
# 100 days in seconds by default; can be overridden via env JWT_ACCESS_TOKEN_EXPIRES
DEFAULT_EXP_SECONDS = 100 * 24 * 60 * 60
JWT_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", str(DEFAULT_EXP_SECONDS)))


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_jwt(payload: Dict[str, Any]) -> str:
    exp = int(time.time()) + JWT_EXPIRES
    token = jwt.encode({**payload, "exp": exp}, JWT_SECRET, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])  # type: ignore
        return decoded  # type: ignore
    except Exception:
        return None


def generate_reset_code() -> str:
    # 6-digit numeric code
    import random
    return f"{random.randint(100000, 999999)}"


