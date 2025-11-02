"""add_user_profile_fields

Revision ID: c5aa825dd064
Revises: 89b1a44b2544
Create Date: 2025-11-02 15:56:16.475617

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5aa825dd064'
down_revision: Union[str, Sequence[str], None] = '89b1a44b2544'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add columns as nullable first
    op.add_column(
        'user',
        sa.Column('first_name', sa.String(length=50), nullable=True)
    )
    op.add_column(
        'user',
        sa.Column('phone', sa.String(length=12), nullable=True)
    )
    op.add_column(
        'user',
        sa.Column('last_name', sa.String(length=50), nullable=True)
    )
    op.add_column(
        'user',
        sa.Column('date_of_birth', sa.Date(), nullable=True)
    )
    op.add_column(
        'user',
        sa.Column('city', sa.String(length=100), nullable=True)
    )
    op.add_column(
        'user',
        sa.Column('telegram_id', sa.String(length=33), nullable=True)
    )
    op.add_column(
        'user',
        sa.Column('address', sa.String(length=255), nullable=True)
    )

    # Update existing users with default values
    op.execute(
        """
        UPDATE "user"
        SET first_name = 'User',
            phone = '+70000000000'
        WHERE first_name IS NULL OR phone IS NULL
        """
    )

    # Make first_name and phone NOT NULL after populating data
    op.alter_column(
        'user',
        'first_name',
        existing_type=sa.String(length=50),
        nullable=False
    )
    op.alter_column(
        'user',
        'phone',
        existing_type=sa.String(length=12),
        nullable=False
    )

    # Create indexes
    op.create_index(
        op.f('ix_user_first_name'),
        'user',
        ['first_name'],
        unique=False
    )
    op.create_index(
        op.f('ix_user_last_name'),
        'user',
        ['last_name'],
        unique=False
    )
    op.create_index(
        op.f('ix_user_phone'),
        'user',
        ['phone'],
        unique=True
    )
    op.create_unique_constraint(
        'uq_user_telegram_id',
        'user',
        ['telegram_id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop constraints and indexes
    op.drop_constraint('uq_user_telegram_id', 'user', type_='unique')
    op.drop_index(op.f('ix_user_phone'), table_name='user')
    op.drop_index(op.f('ix_user_last_name'), table_name='user')
    op.drop_index(op.f('ix_user_first_name'), table_name='user')

    # Drop columns
    op.drop_column('user', 'address')
    op.drop_column('user', 'telegram_id')
    op.drop_column('user', 'city')
    op.drop_column('user', 'date_of_birth')
    op.drop_column('user', 'last_name')
    op.drop_column('user', 'phone')
    op.drop_column('user', 'first_name')
