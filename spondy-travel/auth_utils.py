import secrets
from datetime import datetime, timedelta
from typing import Optional

# Simple in-memory token store (in production, use a database or Redis)
_token_store: dict = {}


def generate_token(user_id: int, role: str) -> str:
    """Generate a simple secure token for the user."""
    token = secrets.token_urlsafe(32)
    _token_store[token] = {
        "user_id": user_id,
        "role": role,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=7)
    }
    return token


def validate_token(token: str) -> Optional[dict]:
    """Validate token and return user info if valid."""
    if token not in _token_store:
        return None
    
    token_data = _token_store[token]
    
    # Check if token expired
    if datetime.utcnow() > token_data["expires_at"]:
        del _token_store[token]
        return None
    
    return token_data


def revoke_token(token: str) -> bool:
    """Revoke a token."""
    if token in _token_store:
        del _token_store[token]
        return True
    return False
