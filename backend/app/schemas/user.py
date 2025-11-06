from datetime import date
from typing import Optional

from fastapi_users import schemas
from pydantic import (
    ConfigDict,
    EmailStr,
    Field,
    field_validator
)

from app.core.constants import Constants
from app.schemas.validators import (
    validate_date_of_birth_optional,
    validate_first_name,
    validate_first_name_optional,
    validate_last_name_optional,
    validate_phone,
    validate_phone_optional,
    validate_telegram_id_optional
)


class UserRead(schemas.BaseUser[int]):
    """
    Schema for reading user data.

    Returns all user information except password.
    Inherits id, email, is_active, is_superuser, is_verified from BaseUser.
    """
    first_name: str
    phone: str
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    city: Optional[str] = None
    telegram_id: Optional[str] = None
    address: Optional[str] = None
    is_superuser: bool = False

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
    def validate_first_name(cls, value: str) -> str:
        """Validate first name is not empty and has valid characters."""
        return validate_first_name(value)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, value: str) -> str:
        """Validate phone number format."""
        return validate_phone(value)


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
    def validate_first_name(cls, value: Optional[str]) -> Optional[str]:
        """Validate first name if provided."""
        return validate_first_name_optional(value)

    @field_validator('last_name')
    @classmethod
    def validate_last_name(cls, value: Optional[str]) -> Optional[str]:
        """Validate last name if provided."""
        return validate_last_name_optional(value)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        """Validate phone number format if provided."""
        return validate_phone_optional(value)

    @field_validator('telegram_id')
    @classmethod
    def validate_telegram_id(
        cls,
        value: Optional[str]
    ) -> Optional[str]:
        """Validate Telegram ID format if provided."""
        return validate_telegram_id_optional(value)

    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(
        cls,
        value: Optional[date]
    ) -> Optional[date]:
        """Validate date of birth is not in future."""
        return validate_date_of_birth_optional(value)


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
