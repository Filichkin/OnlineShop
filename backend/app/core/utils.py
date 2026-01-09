"""
Core utility functions for application-wide use.

Includes log sanitization and background task error handling.
"""
import re
from typing import Any, Callable, Coroutine
from loguru import logger


def sanitize_for_logging(user_input: str, max_length: int = 200) -> str:
    """
    Sanitize user input for safe logging.

    Prevents log injection attacks and ensures logs remain readable.

    Security measures:
    - Removes newline characters (prevents log injection)
    - Removes control characters
    - Truncates to maximum length
    - Preserves only printable ASCII and common Unicode characters

    Args:
        user_input: Raw user input string
        max_length: Maximum length of sanitized output (default: 200)

    Returns:
        Sanitized string safe for logging

    Example:
        >>> sanitize_for_logging("test\\nmalicious\\rinjection")
        'test malicious injection'
        >>> sanitize_for_logging("a" * 300)
        'aaa...(truncated)'
    """
    if not user_input:
        return ''

    # Remove newlines and carriage returns (log injection prevention)
    sanitized = user_input.replace('\n', ' ').replace('\r', ' ')

    # Remove other control characters except spaces and tabs
    sanitized = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', sanitized)

    # Collapse multiple spaces into one
    sanitized = re.sub(r'\s+', ' ', sanitized)

    # Trim whitespace
    sanitized = sanitized.strip()

    # Truncate if too long
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length] + '...(truncated)'

    return sanitized


def safe_background_task(
    func: Callable[..., Coroutine[Any, Any, None]]
) -> Callable[..., Coroutine[Any, Any, None]]:
    """
    Decorator to wrap background tasks with error handling.

    Prevents background task failures from crashing the application
    and ensures all errors are logged properly.

    Usage:
        @safe_background_task
        async def my_background_task(arg1, arg2):
            # Task implementation
            pass

    Args:
        func: Async function to wrap

    Returns:
        Wrapped function with error handling
    """
    async def wrapper(*args, **kwargs):
        try:
            await func(*args, **kwargs)
        except Exception as e:
            logger.exception(
                f'Background task {func.__name__} failed with error: {e}'
            )
            # Don't re-raise - background tasks should not crash the app

    return wrapper
