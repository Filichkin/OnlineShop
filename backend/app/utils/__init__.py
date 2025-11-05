"""Utility modules for the application."""

from app.utils.email import (
    send_order_confirmation_email,
    send_order_status_update_email,
)
from app.utils.order_number import generate_order_number

__all__ = [
    'generate_order_number',
    'send_order_confirmation_email',
    'send_order_status_update_email',
]
