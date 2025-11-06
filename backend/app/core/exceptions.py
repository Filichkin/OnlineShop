from enum import Enum
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from pydantic import BaseModel


class AuthErrorCode(str, Enum):
    """
    Enumeration of authentication error codes.

    Used to provide standardized error codes for different
    authentication failures.
    """
    TOKEN_EXPIRED = 'token_expired'
    TOKEN_INVALID = 'token_invalid'
    TOKEN_MISSING = 'token_missing'
    USER_INACTIVE = 'user_inactive'
    CREDENTIALS_INVALID = 'credentials_invalid'


class AuthErrorDetail(BaseModel):
    """
    Structured error detail for authentication failures.

    Provides consistent error response format with error code,
    message, and optional additional details.
    """
    error_code: AuthErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            'example': {
                'error_code': 'token_expired',
                'message': 'JWT token has expired',
                'details': {'expired_at': '2025-11-06T12:00:00Z'}
            }
        }


class TokenExpiredException(HTTPException):
    """
    Exception raised when JWT token has expired.

    Returns 401 Unauthorized with WWW-Authenticate header
    indicating token expiration.
    """
    def __init__(
        self,
        detail: str = 'JWT token has expired',
        headers: Optional[Dict[str, str]] = None
    ):
        custom_headers = {
            'WWW-Authenticate': (
                'Bearer error=\'invalid_token\', '
                'error_description=\'The access token has expired\''
            )
        }
        if headers:
            custom_headers.update(headers)

        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers=custom_headers
        )


class TokenInvalidException(HTTPException):
    """
    Exception raised when JWT token is invalid.

    Returns 401 Unauthorized with WWW-Authenticate header
    indicating token invalidity (malformed, signature mismatch, etc.).
    """
    def __init__(
        self,
        detail: str = 'JWT token is invalid',
        headers: Optional[Dict[str, str]] = None
    ):
        custom_headers = {
            'WWW-Authenticate': (
                'Bearer error=\'invalid_token\', '
                'error_description=\'The access token is invalid\''
            )
        }
        if headers:
            custom_headers.update(headers)

        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers=custom_headers
        )


class TokenMissingException(HTTPException):
    """
    Exception raised when JWT token is missing.

    Returns 401 Unauthorized with WWW-Authenticate header
    indicating that authentication is required.
    """
    def __init__(
        self,
        detail: str = 'Authentication required',
        headers: Optional[Dict[str, str]] = None
    ):
        custom_headers = {
            'WWW-Authenticate': (
                'Bearer realm=\'api\', '
                'error=\'missing_token\', '
                'error_description=\'No authentication token provided\''
            )
        }
        if headers:
            custom_headers.update(headers)

        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers=custom_headers
        )


class UserInactiveException(HTTPException):
    """
    Exception raised when user account is inactive.

    Returns 401 Unauthorized with WWW-Authenticate header
    indicating that the user account has been deactivated.
    """
    def __init__(
        self,
        detail: str = 'User account is inactive',
        headers: Optional[Dict[str, str]] = None
    ):
        custom_headers = {
            'WWW-Authenticate': (
                'Bearer error=\'insufficient_scope\', '
                'error_description=\'User account is not active\''
            )
        }
        if headers:
            custom_headers.update(headers)

        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers=custom_headers
        )
