"""Order number generation utility."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order


async def generate_order_number(session: AsyncSession) -> str:
    """
    Generate unique order number in format OR{YY}{NNNNN}.

    Format:
        - OR: Prefix for 'Order'
        - YY: Last 2 digits of current year (e.g., 25 for 2025)
        - NNNNN: Sequential 5-digit number (00001, 00002, etc.)

    Numbers are sequential within each year and reset each year.

    Args:
        session: Database session

    Returns:
        str: Generated order number (e.g., 'OR2500001')

    Example:
        >>> order_number = await generate_order_number(session)
        >>> print(order_number)
        'OR2500001'
    """
    current_year = datetime.now().year
    year_suffix = str(current_year)[-2:]  # Last 2 digits of year

    # Get the highest order number for the current year
    # Order numbers follow pattern: OR{YY}{NNNNN}
    year_prefix = f'OR{year_suffix}'

    # Query for orders from current year
    result = await session.execute(
        select(Order.order_number)
        .where(Order.order_number.like(f'{year_prefix}%'))
        .order_by(Order.order_number.desc())
        .limit(1)
    )
    last_order_number = result.scalar()

    if last_order_number:
        # Extract the sequential number part (last 5 digits)
        last_sequence = int(last_order_number[-5:])
        new_sequence = last_sequence + 1
    else:
        # First order of the year
        new_sequence = 1

    # Format: OR + YY + 5-digit zero-padded number
    order_number = f'{year_prefix}{new_sequence:05d}'

    return order_number
