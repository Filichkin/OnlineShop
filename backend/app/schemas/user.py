from datetime import date
from typing import Optional
import re

from fastapi_users import schemas
from pydantic import (
    ConfigDict,
    EmailStr,
    Field,
    field_validator
)

from app.core.constants import Constants
from app.core.messages import Messages


class UserRead(schemas.BaseUser[int]):
    """
    Schema for reading user data.

    Returns all user information except password.
    """
    first_name: str
    phone: str
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    city: Optional[str] = None
    telegram_id: Optional[str] = None
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(schemas.BaseUserCreate):
    """
    Schema for user registration.

    Required fields:
    - first_name
    - phone
    - email
    - password

    All other fields are optional and can be updated later.
    """
    first_name: str = Field(
        ...,
        min_length=Constants.FIRST_NAME_MIN_LEN,
        max_length=Constants.FIRST_NAME_MAX_LEN,
        description='User first name'
    )
    phone: str = Field(
        ...,
        min_length=Constants.PHONE_MIN_LEN,
        max_length=Constants.PHONE_MAX_LEN,
        description='Phone number in format +7XXXXXXXXXX'
    )

    @field_validator('first_name')
    @classmethod
    def validate_first_name(cls, v: str) -> str:
        """Validate first name is not empty and has valid characters."""
        if not v or not v.strip():
            raise ValueError(Messages.FIRST_NAME_REQUIRED)
        # Remove leading/trailing whitespace
        v = v.strip()
        if len(v) < Constants.FIRST_NAME_MIN_LEN:
            raise ValueError(Messages.FIRST_NAME_TOO_SHORT)
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format."""
        if not v:
            raise ValueError(Messages.PHONE_REQUIRED)
        # Remove whitespace
        v = v.strip()
        if not re.match(Constants.PHONE_PATTERN, v):
            raise ValueError(Messages.INVALID_PHONE_FORMAT)
        return v


class UserUpdate(schemas.BaseUserUpdate):
    """
    Schema for updating user profile.

    All fields are optional. Users can update:
    - first_name
    - last_name
    - phone
    - date_of_birth
    - city
    - telegram_id
    - address
    - email

    Password updates should use separate endpoint.
    """
    first_name: Optional[str] = Field(
        None,
        min_length=Constants.FIRST_NAME_MIN_LEN,
        max_length=Constants.FIRST_NAME_MAX_LEN
    )
    last_name: Optional[str] = Field(
        None,
        max_length=Constants.LAST_NAME_MAX_LEN
    )
    phone: Optional[str] = Field(
        None,
        min_length=Constants.PHONE_MIN_LEN,
        max_length=Constants.PHONE_MAX_LEN
    )
    date_of_birth: Optional[date] = None
    city: Optional[str] = Field(
        None,
        max_length=Constants.CITY_MAX_LEN
    )
    telegram_id: Optional[str] = Field(
        None,
        min_length=Constants.TELEGRAM_ID_MIN_LEN,
        max_length=Constants.TELEGRAM_ID_MAX_LEN
    )
    address: Optional[str] = Field(
        None,
        max_length=Constants.ADDRESS_MAX_LEN
    )

    @field_validator('first_name')
    @classmethod
    def validate_first_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate first name if provided."""
        if v is not None:
            v = v.strip()
            if len(v) < Constants.FIRST_NAME_MIN_LEN:
                raise ValueError(Messages.FIRST_NAME_TOO_SHORT)
        return v

    @field_validator('last_name')
    @classmethod
    def validate_last_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate last name if provided."""
        if v is not None:
            v = v.strip()
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number format if provided."""
        if v is not None:
            v = v.strip()
            if not re.match(Constants.PHONE_PATTERN, v):
                raise ValueError(Messages.INVALID_PHONE_FORMAT)
        return v

    @field_validator('telegram_id')
    @classmethod
    def validate_telegram_id(
        cls,
        v: Optional[str]
    ) -> Optional[str]:
        """Validate Telegram ID format if provided."""
        if v is not None:
            v = v.strip()
            if not re.match(Constants.TELEGRAM_PATTERN, v):
                raise ValueError(Messages.INVALID_TELEGRAM_FORMAT)
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(
        cls,
        v: Optional[date]
    ) -> Optional[date]:
        """Validate date of birth is not in future."""
        if v is not None:
            from datetime import date as dt_date
            if v > dt_date.today():
                raise ValueError(Messages.INVALID_DATE_OF_BIRTH)
        return v


class UserLogin(schemas.BaseModel):
    """
    Schema for user login.

    Allows login with either email or phone + password.
    """
    email_or_phone: str = Field(
        ...,
        description='Email address or phone number (+7XXXXXXXXXX)'
    )
    password: str = Field(
        ...,
        min_length=Constants.USER_PASSWORD_MIN_LEN
    )

    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(schemas.BaseModel):
    """
    Schema for password reset request.

    User provides email to receive password reset instructions.
    """
    email: EmailStr = Field(
        ...,
        description='Email address for password reset'
    )

    model_config = ConfigDict(from_attributes=True)


class PasswordResetConfirm(schemas.BaseModel):
    """
    Schema for confirming password reset.

    Not used if we send new password via email,
    but included for future token-based reset.
    """
    token: str = Field(
        ...,
        description='Password reset token'
    )
    new_password: str = Field(
        ...,
        min_length=Constants.USER_PASSWORD_MIN_LEN
    )

    model_config = ConfigDict(from_attributes=True)
