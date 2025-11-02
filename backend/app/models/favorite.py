from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import Constants
from app.core.db import Base, utcnow


class Favorite(Base):
    '''
    Favorite list model.

    Supports both guest and authenticated users:
    - Guest users: identified by session_id
    - Authenticated users: identified by user_id
    '''

    __tablename__ = 'favorites'

    # Guest session identifier (UUID string)
    session_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True
    )

    # User identifier for authenticated users
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('user.id', ondelete='CASCADE'),
        nullable=True,
        index=True
    )

    # Favorite expiration timestamp
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: utcnow() + timedelta(
            days=Constants.FAVORITE_SESSION_LIFETIME_DAYS
        )
    )

    # Relationships
    items = relationship(
        'FavoriteItem',
        back_populates='favorite',
        cascade='all, delete-orphan',
        lazy='select'
    )

    # Constraints
    __table_args__ = (
        # Ensure either session_id or user_id is set, but not both
        Index('ix_favorite_session_id', 'session_id'),
        Index('ix_favorite_user_id', 'user_id'),
        Index('ix_favorite_expires_at', 'expires_at'),
    )

    def __repr__(self) -> str:
        return (
            f'Favorite(id={self.id}, session_id={self.session_id}, '
            f'user_id={self.user_id}, expires_at={self.expires_at}, '
            f'items_count={len(self.items)})'
        )


class FavoriteItem(Base):
    '''
    Favorite item model.

    Represents a product in the favorite list.
    Unlike cart items, favorite items don't have quantity or price tracking.
    '''

    __tablename__ = 'favorite_items'

    # Foreign keys
    favorite_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('favorites.id', ondelete='CASCADE'),
        nullable=False
    )

    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('products.id', ondelete='CASCADE'),
        nullable=False
    )

    # Relationships
    favorite = relationship('Favorite', back_populates='items')
    product = relationship('Product', lazy='select')

    # Constraints
    __table_args__ = (
        # One product per favorite list (prevent duplicates)
        UniqueConstraint(
            'favorite_id',
            'product_id',
            name='uq_favorite_product'
        ),
        Index('ix_favorite_items_favorite_id', 'favorite_id'),
        Index('ix_favorite_items_product_id', 'product_id'),
    )

    def __repr__(self) -> str:
        return (
            f'FavoriteItem(id={self.id}, favorite_id={self.favorite_id}, '
            f'product_id={self.product_id})'
        )
