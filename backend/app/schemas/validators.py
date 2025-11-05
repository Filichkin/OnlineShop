from datetime import date
from typing import Optional
import re

from app.core.constants import Constants
from app.core.messages import Messages


def validate_first_name(value: str) -> str:
    """
    Валидация имени пользователя (обязательное поле).

    Args:
        value: Имя пользователя

    Returns:
        Очищенное имя пользователя

    Raises:
        ValueError: Если имя невалидно
    """
    if not value or not value.strip():
        raise ValueError(Messages.FIRST_NAME_REQUIRED)
    # Remove leading/trailing whitespace
    value = value.strip()
    if len(value) < Constants.FIRST_NAME_MIN_LEN:
        raise ValueError(Messages.FIRST_NAME_TOO_SHORT)
    return value


def validate_first_name_optional(value: Optional[str]) -> Optional[str]:
    """
    Валидация имени пользователя (опциональное поле).

    Args:
        value: Имя пользователя или None

    Returns:
        Очищенное имя пользователя или None

    Raises:
        ValueError: Если имя невалидно
    """
    if value is not None:
        value = value.strip()
        if len(value) < Constants.FIRST_NAME_MIN_LEN:
            raise ValueError(Messages.FIRST_NAME_TOO_SHORT)
    return value


def validate_phone(value: str) -> str:
    """
    Валидация номера телефона (обязательное поле).

    Args:
        value: Номер телефона

    Returns:
        Очищенный номер телефона

    Raises:
        ValueError: Если номер телефона невалиден
    """
    if not value:
        raise ValueError(Messages.PHONE_REQUIRED)
    # Remove whitespace
    value = value.strip()
    if not re.match(Constants.PHONE_PATTERN, value):
        raise ValueError(Messages.INVALID_PHONE_FORMAT)
    return value


def validate_phone_optional(value: Optional[str]) -> Optional[str]:
    """
    Валидация номера телефона (опциональное поле).

    Args:
        value: Номер телефона или None

    Returns:
        Очищенный номер телефона или None

    Raises:
        ValueError: Если номер телефона невалиден
    """
    if value is not None:
        value = value.strip()
        if not re.match(Constants.PHONE_PATTERN, value):
            raise ValueError(Messages.INVALID_PHONE_FORMAT)
    return value


def validate_last_name_optional(value: Optional[str]) -> Optional[str]:
    """
    Валидация фамилии пользователя (опциональное поле).

    Args:
        value: Фамилия пользователя или None

    Returns:
        Очищенная фамилия пользователя или None
    """
    if value is not None:
        value = value.strip()
    return value


def validate_telegram_id_optional(value: Optional[str]) -> Optional[str]:
    """
    Валидация Telegram ID (опциональное поле).

    Args:
        value: Telegram ID или None

    Returns:
        Очищенный Telegram ID или None

    Raises:
        ValueError: Если Telegram ID невалиден
    """
    if value is not None:
        value = value.strip()
        if not re.match(Constants.TELEGRAM_PATTERN, value):
            raise ValueError(Messages.INVALID_TELEGRAM_FORMAT)
    return value


def validate_date_of_birth_optional(value: Optional[date]) -> Optional[date]:
    """
    Валидация даты рождения (опциональное поле).

    Args:
        value: Дата рождения или None

    Returns:
        Дата рождения или None

    Raises:
        ValueError: Если дата рождения невалидна
    """
    if value is not None:
        from datetime import date as dt_date
        if value > dt_date.today():
            raise ValueError(Messages.INVALID_DATE_OF_BIRTH)
    return value


def validate_email(value: str) -> str:
    """
    Валидация email адреса (обязательное поле).

    Args:
        value: Email адрес

    Returns:
        Очищенный email адрес

    Raises:
        ValueError: Если email невалиден
    """
    if not value:
        raise ValueError('Email is required')
    # Remove whitespace
    value = value.strip()
    if not re.match(Constants.EMAIL_PATTERN, value):
        raise ValueError('Invalid email format')
    return value


def validate_postal_code(value: str) -> str:
    """
    Валидация почтового индекса (обязательное поле).

    Args:
        value: Почтовый индекс

    Returns:
        Очищенный почтовый индекс

    Raises:
        ValueError: Если индекс невалиден
    """
    if not value:
        raise ValueError('Postal code is required')
    # Remove whitespace
    value = value.strip()
    if not re.match(Constants.POSTAL_CODE_PATTERN, value):
        raise ValueError('Invalid postal code format. Use 5-10 digits')
    return value
