"""add_slug_to_brand

Revision ID: c1d2e3f4a5b6
Revises: bb47d2f2661b
Create Date: 2025-12-09 00:00:00.000000

"""
from typing import Sequence, Union
import re

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'bb47d2f2661b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def slugify(text: str) -> str:
    """Generate slug from text"""
    text = text.lower()
    # Replace spaces and special chars with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def upgrade() -> None:
    """Upgrade schema - add slug field to brands table"""

    # Add slug column (nullable first to populate existing rows)
    op.add_column('brands', sa.Column('slug', sa.String(), nullable=True))

    # Populate slug for existing brands using name
    connection = op.get_bind()
    brands = connection.execute(sa.text("SELECT id, name FROM brands")).fetchall()

    for brand in brands:
        slug = slugify(brand.name)
        if not slug:
            slug = f"brand-{brand.id}"
        connection.execute(
            sa.text("UPDATE brands SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": brand.id}
        )

    # Make slug non-nullable and add unique constraint + index
    op.alter_column('brands', 'slug', nullable=False)
    op.create_unique_constraint('uq_brands_slug', 'brands', ['slug'])
    op.create_index('ix_brands_slug', 'brands', ['slug'])


def downgrade() -> None:
    """Downgrade schema - remove slug field from brands table"""
    op.drop_index('ix_brands_slug', table_name='brands')
    op.drop_constraint('uq_brands_slug', 'brands', type_='unique')
    op.drop_column('brands', 'slug')
