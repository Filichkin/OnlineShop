from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable

from app.core.db import Base
from app.core.constants import Constants


class User(SQLAlchemyBaseUserTable[int], Base):
    """
    User model with extended profile information.

    Inherits from SQLAlchemyBaseUserTable which provides:
    - id: Integer primary key
    - email: String(320), unique, not nullable
    - hashed_password: String(1024), not nullable
    - is_active: Boolean, default True
    - is_superuser: Boolean, default False
    - is_verified: Boolean, default False
    """

    # Required fields
    first_name: Mapped[str] = mapped_column(
        String(Constants.FIRST_NAME_MAX_LEN),
        nullable=False,
        index=True
    )

    phone: Mapped[str] = mapped_column(
        String(Constants.PHONE_MAX_LEN),
        nullable=False,
        unique=True,
        index=True
    )

    # Optional fields
    last_name: Mapped[Optional[str]] = mapped_column(
        String(Constants.LAST_NAME_MAX_LEN),
        nullable=True,
        index=True
    )

    date_of_birth: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )

    city: Mapped[Optional[str]] = mapped_column(
        String(Constants.CITY_MAX_LEN),
        nullable=True
    )

    telegram_id: Mapped[Optional[str]] = mapped_column(
        String(Constants.TELEGRAM_ID_MAX_LEN),
        nullable=True,
        unique=True
    )

    address: Mapped[Optional[str]] = mapped_column(
        String(Constants.ADDRESS_MAX_LEN),
        nullable=True
    )

    # Password reset token fields
    reset_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )

    reset_token_expiry: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )

    def __repr__(self) -> str:
        return (
            f'User(id={self.id}, email={self.email}, '
            f'first_name={self.first_name}, phone={self.phone})'
        )
