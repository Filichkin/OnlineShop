from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routers import main_router
from app.core.config import settings
from app.core.init_db import create_first_superuser
from app.core.limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_first_superuser()
    yield

app = FastAPI(
    title=settings.app_title,
    lifespan=lifespan,
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(main_router)
