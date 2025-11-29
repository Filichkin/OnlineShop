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

CSRF_TOKEN_LENGTH = 32
CSRF_COOKIE_NAME = 'csrf_token'
CSRF_HEADER_NAME = 'X-CSRF-Token'


def generate_csrf_token() -> str:
    """
    Generate a cryptographically secure random CSRF token.

    Uses secrets module to generate URL-safe random token.

    Returns:
        Random CSRF token string
    """
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


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
        key=CSRF_COOKIE_NAME,
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
    csrf_token_cookie: Optional[str] = Cookie(None, alias=CSRF_COOKIE_NAME)
) -> None:
    """
    Verify CSRF token for state-changing operations.

    Validates that the CSRF token in the cookie matches the token
    in the request header. Only applied to non-safe HTTP methods
    (POST, PUT, PATCH, DELETE).

    Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF protection
    as they should not have side effects.

    IMPORTANT: For anonymous users (session_id cookie only),
    CSRF protection is relaxed as session_id provides some protection.
    Only authenticated users (with access_token) MUST have CSRF token.

    Args:
        request: FastAPI request object
        csrf_token_cookie: CSRF token from cookie

    Raises:
        HTTPException: 403 if CSRF verification fails for authenticated users
    """
    # Exempt safe methods from CSRF check
    if request.method in ('GET', 'HEAD', 'OPTIONS'):
        logger.debug(
            f'CSRF проверка пропущена для безопасного метода: '
            f'{request.method}'
        )
        return

    # Check if user is authenticated (has access_token cookie)
    access_token = request.cookies.get('access_token')

    # If user is authenticated, CSRF token is REQUIRED
    if access_token:
        csrf_token_header = request.headers.get(CSRF_HEADER_NAME)

        if not csrf_token_cookie or not csrf_token_header:
            logger.warning(
                f'CSRF токен отсутствует для аутентифицированного '
                f'пользователя: {request.method} {request.url.path}'
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='CSRF token missing'
            )

        # Verify CSRF tokens match
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
    else:
        # For anonymous users, CSRF is optional
        # They are protected by session_id cookie which has SameSite protection
        logger.debug(
            f'CSRF проверка пропущена для анонимного пользователя: '
            f'{request.method} {request.url.path}'
        )

