from typing import Optional

from pydantic import EmailStr
from pydantic_settings import BaseSettings

from app.core.constants import Constants


class Settings(BaseSettings):
    app_title: str = 'Ecom Market'
    description: str = 'Приложение для интернет-магазина'
    secret: str = 'SECRET'
    first_superuser_email: Optional[EmailStr] = None
    first_superuser_password: Optional[str] = None
    jwt_token_lifetime: int = Constants.JWT_TOKEN_LIFETIME

    postgres_port: int
    postgres_password: str
    postgres_user: str
    postgres_db: str
    postgres_host: str

    class Config:
        env_file = '../infra/.env'
        extra = 'ignore'  # Игнорировать дополнительные поля


settings = Settings()


def get_async_db_url() -> str:
    """Возвращает асинхронный URL для подключения к БД"""
    return (
        f'postgresql+asyncpg://{settings.postgres_user}:'
        f'{settings.postgres_password}@'
        f'{settings.postgres_host}:{settings.postgres_port}/'
        f'{settings.postgres_db}'
    )
