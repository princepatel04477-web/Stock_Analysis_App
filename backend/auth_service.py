"""
Authentication service for JWT token verification and user management.
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
import requests
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL")
SUPABASE_JWT_KID = os.getenv("SUPABASE_JWT_KID")

# Cache for JWKS keys
_jwks_cache = None
_jwks_cache_timestamp = None
JWKS_CACHE_DURATION = 3600  # 1 hour


def get_jwks() -> Dict[str, Any]:
    """
    Fetch and cache JWKS (JSON Web Key Set) from Supabase.
    """
    global _jwks_cache, _jwks_cache_timestamp
    
    now = datetime.utcnow()
    
    # Return cached JWKS if still valid
    if (_jwks_cache and _jwks_cache_timestamp and 
        (now - _jwks_cache_timestamp).total_seconds() < JWKS_CACHE_DURATION):
        return _jwks_cache
    
    try:
        # Fetch JWKS from Supabase
        response = requests.get(SUPABASE_JWKS_URL, timeout=10)
        response.raise_for_status()
        jwks = response.json()
        
        # Cache the result
        _jwks_cache = jwks
        _jwks_cache_timestamp = now
        
        logger.info("JWKS fetched and cached successfully")
        return jwks
        
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        # Return cached version even if expired, or empty dict
        return _jwks_cache or {"keys": []}


def get_public_key_from_jwks(kid: str) -> Optional[str]:
    """
    Extract public key for given key ID from JWKS.
    """
    jwks = get_jwks()
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    
    logger.warning(f"No key found for kid: {kid}")
    return None


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token from Supabase and extract user information.
    """
    try:
        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing key ID"
            )
        
        # Get public key for verification
        public_key = get_public_key_from_jwks(kid)
        if not public_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: key not found"
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],  # Supabase uses ES256
            audience="authenticated",
            issuer=SUPABASE_URL
        )
        
        # Extract user information
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        return {
            "user_id": user_id,
            "email": email,
            "full_payload": payload
        }
        
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user.
    """
    return verify_jwt_token(credentials.credentials)


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency to get current user, but allow unauthenticated access.
    """
    if not credentials:
        return None
    
    try:
        return verify_jwt_token(credentials.credentials)
    except HTTPException:
        return None


# User data models (for response formatting)
class UserInfo:
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email
        
    def to_dict(self) -> Dict[str, str]:
        return {
            "user_id": self.user_id,
            "email": self.email
        }


def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)