from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routers import main_router
from app.core.config import settings
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

app.include_router(main_router)

# Mount static files
app.mount('/media', StaticFiles(directory='media'), name='media')
