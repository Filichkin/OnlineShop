from pathlib import Path
from typing import Optional

from pydantic import EmailStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_title: str = 'Ecom Market'
    description: str = 'Приложение для интернет-магазина'
    secret: str = 'SECRET'
    first_superuser_email: Optional[EmailStr] = None
    first_superuser_password: Optional[str] = None
    jwt_token_lifetime: int = 3600
    user_password_min_len: int = 8

    postgres_port: int
    postgres_password: str
    postgres_user: str
    postgres_db: str
    postgres_host: str

    class Config:
        env_file = '../infra/.env'


settings = Settings()


def get_async_db_url() -> str:
    """Возвращает асинхронный URL для подключения к БД"""
    return (
        f'postgresql+asyncpg://{settings.postgres_user}:'
        f'{settings.postgres_password}@'
        f'{settings.postgres_host}:{settings.postgres_port}/'
        f'{settings.postgres_db}'
    )


class Constants:
    AUTH_PREFIX = '/auth/jwt'
    AUTH_TAGS = ('auth',)
    REGISTER_PREFIX = '/auth'
    USERS_PREFIX = '/users'
    USERS_TAGS = ('users',)
    CATEGORIES_PREFIX = '/categories'
    CATEGORIES_TAGS = ('categories',)
    PRODUCTS_PREFIX = '/products'
    PRODUCTS_TAGS = ('products',)
    JWT_TOKEN_URL = 'auth/jwt/login'
    JWT_AUTH_BACKEND_NAME = 'jwt'
    NAME_MIN_LEN = 1
    NAME_MAX_LEN = 100

    # Директории для хранения
    UPLOAD_DIR = Path('media')
    PRODUCTS_DIR = UPLOAD_DIR / 'products'
    CATEGORIES_DIR = UPLOAD_DIR / 'categories'
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}


class Messages:
    PASSWORD_TOO_SHORT = (
        f'Password must be not less {settings.user_password_min_len}'
    )
    EMAIL_IN_PASSWORD = 'Password should`t contain email'
    USER_REGISTERED = 'User registered: '
