"""add_order_number_to_orders

Revision ID: b30a83cab0a7
Revises: 15a6987b0faf
Create Date: 2025-11-05 11:29:04.960813

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b30a83cab0a7'
down_revision: Union[str, Sequence[str], None] = '15a6987b0faf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema.

    Add order_number field to orders table with unique constraint.
    Generate order numbers for existing orders.
    """
    # Add order_number column (nullable first for existing data)
    op.add_column(
        'orders',
        sa.Column('order_number', sa.String(length=9), nullable=True)
    )

    # Generate order numbers for existing orders
    # This uses PostgreSQL-specific syntax
    connection = op.get_bind()

    # Get all existing orders ordered by created_at
    result = connection.execute(
        sa.text(
            '''
            SELECT id, EXTRACT(YEAR FROM created_at) as year
            FROM orders
            ORDER BY created_at
            '''
        )
    )

    orders = result.fetchall()

    # Generate order numbers for existing orders
    year_counters = {}  # Track counters per year
    for order_id, order_year in orders:
        year_suffix = str(int(order_year))[-2:]  # Last 2 digits

        if year_suffix not in year_counters:
            year_counters[year_suffix] = 1
        else:
            year_counters[year_suffix] += 1

        order_number = f'OR{year_suffix}{year_counters[year_suffix]:05d}'

        connection.execute(
            sa.text(
                'UPDATE orders SET order_number = :order_number '
                'WHERE id = :order_id'
            ),
            {'order_number': order_number, 'order_id': order_id}
        )

    # Now make the column NOT NULL and add unique constraint
    op.alter_column(
        'orders',
        'order_number',
        nullable=False,
        existing_type=sa.String(length=9)
    )

    # Create unique index
    op.create_index(
        'ix_order_number',
        'orders',
        ['order_number'],
        unique=True
    )


def downgrade() -> None:
    """
    Downgrade schema.

    Remove order_number field from orders table.
    """
    # Drop unique index
    op.drop_index('ix_order_number', table_name='orders')

    # Drop order_number column
    op.drop_column('orders', 'order_number')
