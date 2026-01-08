"""
CSRF (Cross-Site Request Forgery) protection module.

Provides token generation, validation, and cookie management
to protect against CSRF attacks.
"""
import secrets
from typing import Optional

from fastapi import Cookie, HTTPException, Request, Response, status
from loguru import logger

from app.core.config import settings
from app.core.constants import Constants


def generate_csrf_token() -> str:
    """
    Generate a cryptographically secure random CSRF token.

    Uses secrets module to generate URL-safe random token.

    Returns:
        Random CSRF token string
    """
    return secrets.token_urlsafe(Constants.CSRF_TOKEN_LENGTH)


def set_csrf_cookie(response: Response, token: str) -> None:
    """
    Set CSRF token in cookie with appropriate security flags.

    The CSRF token cookie is NOT httpOnly because JavaScript needs
    to read it and send it in request headers for validation.

    Args:
        response: FastAPI response object
        token: CSRF token to set in cookie
    """
    response.set_cookie(
        key=Constants.CSRF_COOKIE_NAME,
        value=token,
        httponly=False,  # JavaScript must read this for header
        secure=settings.secure_cookies,
        samesite='lax',
        max_age=settings.access_token_expire_minutes * 60,
        path='/',
    )
    logger.debug('CSRF token cookie установлен')


async def verify_csrf_token(
    request: Request,
    csrf_token_cookie: Optional[str] = Cookie(
        None,
        alias=Constants.CSRF_COOKIE_NAME
        )
) -> None:
    """
    Verify CSRF token for state-changing operations.

    Validates that the CSRF token in the cookie matches the token
    in the request header. Only applied to non-safe HTTP methods
    (POST, PUT, PATCH, DELETE).

    Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF protection
    as they should not have side effects.

    SECURITY: ALL state-changing operations require CSRF token,
    including for anonymous users. CSRF token is generated when
    creating session cookie.

    Args:
        request: FastAPI request object
        csrf_token_cookie: CSRF token from cookie

    Raises:
        HTTPException: 403 if CSRF verification fails
    """
    # Exempt safe methods from CSRF check
    if request.method in ('GET', 'HEAD', 'OPTIONS'):
        logger.debug(
            f'CSRF проверка пропущена для безопасного метода: '
            f'{request.method}'
        )
        return

    # CSRF token is REQUIRED for ALL state-changing operations
    csrf_token_header = request.headers.get(Constants.CSRF_HEADER_NAME)

    if not csrf_token_cookie or not csrf_token_header:
        logger.warning(
            f'CSRF токен отсутствует: {request.method} {request.url.path}'
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='CSRF token missing'
        )

    # Verify CSRF tokens match using constant-time comparison
    if not secrets.compare_digest(csrf_token_cookie, csrf_token_header):
        logger.warning(
            f'CSRF токен недействителен для {request.method} '
            f'{request.url.path}'
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='CSRF token invalid'
        )

    logger.debug(f'CSRF токен проверен успешно для {request.url.path}')
