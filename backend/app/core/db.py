from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import Boolean, Column, DateTime, Integer, event, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import (
    declarative_base,
    declared_attr,
    mapped_column,
    Mapped,
    sessionmaker
)

from app.core.config import get_async_db_url
from app.core.constants import Constants


def utcnow() -> datetime:
    """Возвращает текущее UTC-время с tzinfo."""
    return datetime.now(timezone.utc)


class PreBase:

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    id = Column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )


Base = declarative_base(cls=PreBase)

# Create engine with proper connection pool configuration
engine = create_async_engine(
    get_async_db_url(),
    # Connection pool settings for production
    pool_size=Constants.DB_POOL_SIZE,
    max_overflow=Constants.DB_MAX_OVERFLOW,
    pool_timeout=Constants.DB_POOL_TIMEOUT,
    pool_recycle=Constants.DB_POOL_RECYCLE,
    # Enable connection health checks
    pool_pre_ping=True,
    # Echo SQL queries in development (set to False in production)
    echo=False,
)

# Configure session factory with proper settings for async operations
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    # Don't expire objects on commit for async sessions
    expire_on_commit=False,
    # Enable autoflush for better control
    autoflush=True,
)


# Add statement timeout event listener
@event.listens_for(engine.sync_engine, "connect")
def set_statement_timeout(dbapi_connection, connection_record):
    """
    Set statement timeout for PostgreSQL connections.

    Prevents long-running queries from blocking resources.
    Timeout is set to 30 seconds by default.

    Args:
        dbapi_connection: Database connection
        connection_record: Connection record
    """
    cursor = dbapi_connection.cursor()
    # Set statement timeout to 30 seconds (30000 milliseconds)
    cursor.execute("SET statement_timeout = '30000'")
    cursor.close()
    logger.debug('Statement timeout set to 30 seconds for database connection')


async def get_async_session():
    """
    Dependency for getting async database sessions

    Yields:
        AsyncSession: Database session

    Note:
        Session is automatically closed after use
    """
    async with AsyncSessionLocal() as async_session:
        yield async_session
