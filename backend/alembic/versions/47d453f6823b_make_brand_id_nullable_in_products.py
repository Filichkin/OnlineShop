"""make_brand_id_nullable_in_products

Revision ID: 47d453f6823b
Revises: 3fa48eb3d8aa
Create Date: 2025-11-26 20:07:55.979095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47d453f6823b'
down_revision: Union[str, Sequence[str], None] = '3fa48eb3d8aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make brand_id nullable in products table."""
    op.alter_column(
        'products',
        'brand_id',
        existing_type=sa.Integer(),
        nullable=True
    )


def downgrade() -> None:
    """Revert brand_id to non-nullable in products table."""
    op.alter_column(
        'products',
        'brand_id',
        existing_type=sa.Integer(),
        nullable=False
    )
