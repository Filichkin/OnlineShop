"""
Database initialization module.

Handles creation of initial superuser with all required fields.
"""
import contextlib

from fastapi_users.exceptions import UserAlreadyExists
from loguru import logger
from pydantic import EmailStr

from app.core.config import settings
from app.core.db import get_async_session
from app.core.user import get_user_db, get_user_manager
from app.schemas.user import UserCreate

get_async_session_context = contextlib.asynccontextmanager(get_async_session)
get_user_db_context = contextlib.asynccontextmanager(get_user_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)


async def create_user(
    email: EmailStr,
    password: str,
    first_name: str,
    phone: str,
    is_superuser: bool = False
) -> None:
    """
    Create a new user in the database.

    Args:
        email: User email address
        password: User password (will be hashed)
        first_name: User first name
        phone: User phone number in format +7XXXXXXXXXX
        is_superuser: Whether user should have superuser privileges

    Raises:
        UserAlreadyExists: If user with this email or phone already exists
    """
    try:
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(
                        UserCreate(
                            email=email,
                            password=password,
                            first_name=first_name,
                            phone=phone,
                            is_superuser=is_superuser
                        )
                    )
                    logger.info(
                        f'Пользователь создан: {user.email} '
                        f'(superuser: {is_superuser})'
                    )
    except UserAlreadyExists:
        logger.info(f'Пользователь уже существует: {email}')


async def create_first_superuser() -> None:
    """
    Create the first superuser if credentials are provided.

    Reads configuration from environment variables:
    - FIRST_SUPERUSER_EMAIL
    - FIRST_SUPERUSER_PASSWORD

    Uses default values for required fields:
    - first_name: "Администратор"
    - phone: "+79999999999" (test number)

    Note: This function is idempotent - it will not create
    duplicate users if superuser already exists.
    """
    if (
        settings.first_superuser_email is not None
        and settings.first_superuser_password is not None
    ):
        try:
            await create_user(
                email=settings.first_superuser_email,
                password=settings.first_superuser_password,
                first_name='Администратор',
                phone='+79999999999',
                is_superuser=True,
            )
            logger.info('Создание первого суперпользователя завершено')
        except Exception as e:
            logger.exception(f'Ошибка при создании суперпользователя: {e}')
            raise
    else:
        logger.warning(
            'Учетные данные суперпользователя не предоставлены '
            'в переменных окружения. Пропуск создания суперпользователя.'
        )
