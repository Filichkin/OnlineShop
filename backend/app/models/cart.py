from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import Constants
from app.core.db import Base, utcnow


class Cart(Base):
    """
    Shopping cart model.

    Supports both guest and authenticated users:
    - Guest users: identified by session_id
    - Authenticated users: identified by user_id (future feature)
    """

    __tablename__ = 'carts'

    # Guest session identifier (UUID string)
    session_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True
    )

    # User identifier for authenticated users (future feature)
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey('user.id', ondelete='CASCADE'),
        nullable=True,
        index=True
    )

    # Cart expiration timestamp
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: utcnow() + timedelta(
            days=Constants.CART_SESSION_LIFETIME_DAYS
        )
    )

    # Relationships
    items = relationship(
        'CartItem',
        back_populates='cart',
        cascade='all, delete-orphan',
        lazy='select'
    )

    # TODO: Add user relationship when user authentication is implemented
    # user = relationship('User', back_populates='cart')

    # Constraints
    __table_args__ = (
        # Ensure either session_id or user_id is set, but not both
        Index('ix_cart_session_id', 'session_id'),
        Index('ix_cart_user_id', 'user_id'),
        Index('ix_cart_expires_at', 'expires_at'),
    )

    def __repr__(self) -> str:
        return (
            f'Cart(id={self.id}, session_id={self.session_id}, '
            f'user_id={self.user_id}, expires_at={self.expires_at}, '
            f'items_count={len(self.items)})'
        )


class CartItem(Base):
    """
    Cart item model.

    Represents a product in the shopping cart with quantity and price.
    Price is stored at addition time to track potential price changes.
    """

    __tablename__ = 'cart_items'

    # Foreign keys
    cart_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('carts.id', ondelete='CASCADE'),
        nullable=False
    )

    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('products.id', ondelete='CASCADE'),
        nullable=False
    )

    # Item details
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=Constants.CART_ITEM_QUANTITY_DEFAULT
    )

    # Price at the time of addition (for price change tracking)
    price_at_addition: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    # Relationships
    cart = relationship('Cart', back_populates='items')
    product = relationship('Product', lazy='select')

    # Constraints
    __table_args__ = (
        # One product per cart (update quantity instead of creating
        # duplicate)
        UniqueConstraint(
            'cart_id',
            'product_id',
            name='uq_cart_product'
        ),
        Index('ix_cart_items_cart_id', 'cart_id'),
        Index('ix_cart_items_product_id', 'product_id'),
    )

    def __repr__(self) -> str:
        return (
            f'CartItem(id={self.id}, cart_id={self.cart_id}, '
            f'product_id={self.product_id}, quantity={self.quantity}, '
            f'price_at_addition={self.price_at_addition})'
        )
