"""add slug to category

Revision ID: 9f1dadd0add3
Revises: bd912a2754aa
Create Date: 2025-10-30
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9f1dadd0add3'
down_revision = 'bd912a2754aa'
branch_labels = None
depends_on = None


def _simple_slugify(name: str) -> str:
    mapping = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
        'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
        'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
        'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya'
    }
    value = (name or '').strip().lower()
    result = []
    for ch in value:
        if ch.isalnum() and ch.isascii():
            result.append(ch)
        elif ch in mapping:
            result.append(mapping[ch])
        elif ch.isalnum():
            continue
        elif ch in {' ', '_', '-'}:
            result.append('-')
    slug = ''.join(result)
    while '--' in slug:
        slug = slug.replace('--', '-')
    slug = slug.strip('-') or 'category'
    return slug


def upgrade() -> None:
    op.add_column('categories', sa.Column('slug', sa.String(), nullable=True))
    op.create_unique_constraint('uq_categories_slug', 'categories', ['slug'])

    # Backfill slug values
    conn = op.get_bind()
    categories = conn.execute(
        sa.text('SELECT id, name FROM categories')
    ).fetchall()
    used = set()
    for row in categories:
        base = _simple_slugify(row.name)
        slug = base
        i = 1
        while slug in used:
            i += 1
            slug = f'{base}-{i}'
        used.add(slug)
        stmt = sa.text(
            'UPDATE categories SET slug = :slug WHERE id = :id'
        )
        conn.execute(stmt, {'slug': slug, 'id': row.id})
    op.alter_column(
        'categories',
        'slug',
        existing_type=sa.String(),
        nullable=False
    )


def downgrade() -> None:
    op.drop_constraint('uq_categories_slug', 'categories', type_='unique')
    op.drop_column('categories', 'slug')
