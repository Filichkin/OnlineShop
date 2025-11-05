"""add_order_and_order_items_tables

Revision ID: 15a6987b0faf
Revises: c5aa825dd064
Create Date: 2025-11-05 11:02:36.684550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '15a6987b0faf'
down_revision: Union[str, Sequence[str], None] = 'c5aa825dd064'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Note: order_status enum type should already exist or will be created
    # automatically by SQLAlchemy when the first table using it is created.
    # If it already exists, we skip creation.

    # Create orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'created',
                'updated',
                'confirmed',
                'shipped',
                'canceled',
                name='order_status',
                create_type=False
            ),
            nullable=False
        ),
        sa.Column('first_name', sa.String(length=50), nullable=False),
        sa.Column('last_name', sa.String(length=50), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('postal_code', sa.String(length=10), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=12), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('total_items', sa.Integer(), nullable=False),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['user.id'],
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_order_user_id', 'orders', ['user_id'])
    op.create_index('ix_order_status', 'orders', ['status'])
    op.create_index('ix_order_created_at', 'orders', ['created_at'])

    # Create order_items table
    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('price_at_purchase', sa.Float(), nullable=False),
        sa.Column('product_name', sa.String(length=200), nullable=False),
        sa.ForeignKeyConstraint(
            ['order_id'],
            ['orders.id'],
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['product_id'],
            ['products.id'],
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        'ix_order_items_order_id',
        'order_items',
        ['order_id']
    )
    op.create_index(
        'ix_order_items_product_id',
        'order_items',
        ['product_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop order_items table
    op.drop_index('ix_order_items_product_id', table_name='order_items')
    op.drop_index('ix_order_items_order_id', table_name='order_items')
    op.drop_table('order_items')

    # Drop orders table
    op.drop_index('ix_order_created_at', table_name='orders')
    op.drop_index('ix_order_status', table_name='orders')
    op.drop_index('ix_order_user_id', table_name='orders')
    op.drop_table('orders')

    # Drop order_status enum type
    op.execute('DROP TYPE order_status')
