"""merge heads for slug support

Revision ID: f628d6c47029
Revises: 8b7cde51713d, 9f1dadd0add3
Create Date: 2025-10-30 13:09:58.159895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f628d6c47029'
down_revision: Union[str, Sequence[str], None] = ('8b7cde51713d', '9f1dadd0add3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
