from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routers import main_router
from app.core.config import settings
from app.core.exceptions import (
    AuthErrorCode,
    AuthErrorDetail,
    TokenExpiredException,
    TokenInvalidException,
    TokenMissingException,
    UserInactiveException,
)
from app.core.init_db import create_first_superuser
from app.core.limiter import limiter
from app.core.logging_config import setup_logging

# Initialize logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('Запуск приложения...')
    try:
        await create_first_superuser()
        logger.info('Запуск приложения завершен успешно')
    except Exception as e:
        logger.exception(f'Ошибка при запуске приложения: {e}')
        raise
    yield
    logger.info('Остановка приложения...')

app = FastAPI(
    title=settings.app_title,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],  # Frontend URLs
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Exception handlers for authentication errors
@app.exception_handler(TokenExpiredException)
async def token_expired_exception_handler(
    request: Request,
    exc: TokenExpiredException
) -> JSONResponse:
    """
    Handle expired JWT token errors.

    Returns structured error response with appropriate headers
    indicating token expiration.
    """
    logger.info(
        f'Token expired for request: {request.url.path}'
    )
    error_detail = AuthErrorDetail(
        error_code=AuthErrorCode.TOKEN_EXPIRED,
        message='JWT token has expired. Please login again.',
        details={'path': str(request.url.path)}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_detail.model_dump(),
        headers=exc.headers
    )


@app.exception_handler(TokenInvalidException)
async def token_invalid_exception_handler(
    request: Request,
    exc: TokenInvalidException
) -> JSONResponse:
    """
    Handle invalid JWT token errors.

    Returns structured error response with appropriate headers
    indicating token invalidity.
    """
    logger.warning(
        f'Invalid token for request: {request.url.path}'
    )
    error_detail = AuthErrorDetail(
        error_code=AuthErrorCode.TOKEN_INVALID,
        message='JWT token is invalid. Please login again.',
        details={'path': str(request.url.path)}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_detail.model_dump(),
        headers=exc.headers
    )


@app.exception_handler(TokenMissingException)
async def token_missing_exception_handler(
    request: Request,
    exc: TokenMissingException
) -> JSONResponse:
    """
    Handle missing JWT token errors.

    Returns structured error response with appropriate headers
    indicating that authentication is required.
    """
    logger.info(
        f'Missing token for request: {request.url.path}'
    )
    error_detail = AuthErrorDetail(
        error_code=AuthErrorCode.TOKEN_MISSING,
        message='Authentication required. Please provide a valid token.',
        details={'path': str(request.url.path)}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_detail.model_dump(),
        headers=exc.headers
    )


@app.exception_handler(UserInactiveException)
async def user_inactive_exception_handler(
    request: Request,
    exc: UserInactiveException
) -> JSONResponse:
    """
    Handle inactive user errors.

    Returns structured error response with appropriate headers
    indicating that the user account is not active.
    """
    logger.warning(
        f'Inactive user attempted access: {request.url.path}'
    )
    error_detail = AuthErrorDetail(
        error_code=AuthErrorCode.USER_INACTIVE,
        message='User account is inactive. Please contact support.',
        details={'path': str(request.url.path)}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_detail.model_dump(),
        headers=exc.headers
    )


app.include_router(main_router)

# Mount static files
app.mount('/media', StaticFiles(directory='media'), name='media')
