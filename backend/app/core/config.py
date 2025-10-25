from typing import Optional

from pydantic import EmailStr, field_validator, ValidationInfo
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

    @field_validator('secret')
    @classmethod
    def validate_secret(cls, v: str, info: ValidationInfo) -> str:
        """Validate that secret is strong enough"""
        if not v or v == 'SECRET':
            raise ValueError(
                'SECRET must be set in environment variables. '
                'Do not use default value.'
            )

        if len(v) < Constants.SECRET_MIN_LENGTH:
            raise ValueError(
                f'SECRET must be at least {Constants.SECRET_MIN_LENGTH} '
                f'characters long. Current length: {len(v)}'
            )

        # Check for common weak patterns
        weak_patterns = [
            'password', 'secret', '12345', 'qwerty',
            'admin', 'root', 'test'
        ]
        if any(pattern in v.lower() for pattern in weak_patterns):
            raise ValueError(
                'SECRET contains common weak patterns. '
                'Use a cryptographically secure random string.'
            )

        return v

    @field_validator('postgres_password')
    @classmethod
    def validate_postgres_password(cls, v: str, info: ValidationInfo) -> str:
        """Validate database password strength"""
        if len(v) < Constants.DB_PASSWORD_MIN_LENGTH:
            raise ValueError(
                f'POSTGRES_PASSWORD must be at least '
                f'{Constants.DB_PASSWORD_MIN_LENGTH} characters long'
            )
        return v

    @field_validator('first_superuser_password')
    @classmethod
    def validate_superuser_password(
        cls,
        v: Optional[str],
        info: ValidationInfo
    ) -> Optional[str]:
        """Validate superuser password strength"""
        # Skip validation if not set (will be handled by database init)
        if v is None:
            return v

        # Minimum length requirement
        if len(v) < Constants.SUPERUSER_PASSWORD_MIN_LENGTH:
            raise ValueError(
                f'FIRST_SUPERUSER_PASSWORD must be at least '
                f'{Constants.SUPERUSER_PASSWORD_MIN_LENGTH} characters long. '
                f'Current length: {len(v)}'
            )

        # Check for common weak passwords
        weak_passwords = [
            'password', 'admin', 'superuser', 'root',
            '12345', '123456', '1234567', '12345678',
            'qwerty', 'letmein', 'welcome', 'monkey',
            'dragon', 'master', 'sunshine', 'princess'
        ]
        if v.lower() in weak_passwords:
            raise ValueError(
                'FIRST_SUPERUSER_PASSWORD is too weak. '
                'Do not use common passwords. '
                'Use a strong, unique password with mixed characters.'
            )

        # Check for weak patterns
        weak_patterns = [
            'password', 'admin', '12345', 'qwerty', 'test', 'user'
        ]
        if any(pattern in v.lower() for pattern in weak_patterns):
            raise ValueError(
                'FIRST_SUPERUSER_PASSWORD contains common weak patterns. '
                'Use a strong password without common words or sequences.'
            )

        return v

    class Config:
        env_file = '../infra/.env'
        extra = 'ignore'


settings = Settings()


def get_async_db_url() -> str:
    """Возвращает асинхронный URL для подключения к БД"""
    return (
        f'postgresql+asyncpg://{settings.postgres_user}:'
        f'{settings.postgres_password}@'
        f'{settings.postgres_host}:{settings.postgres_port}/'
        f'{settings.postgres_db}'
    )
