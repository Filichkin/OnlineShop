from enum import Enum
from typing import Optional

from sqlalchemy import (
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import Constants
from app.core.db import Base


class OrderStatus(str, Enum):
    """Order status enumeration."""

    CREATED = 'created'
    UPDATED = 'updated'
    CONFIRMED = 'confirmed'
    SHIPPED = 'shipped'
    CANCELED = 'canceled'


class Order(Base):
    """
    Order model.

    Represents a completed order from user's cart.
    Stores customer shipping information and order status.
    """

    __tablename__ = 'orders'

    # User identifier for authenticated users
    user_id: Mapped[int] = mapped_column(
        ForeignKey('user.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Order status
    status: Mapped[OrderStatus] = mapped_column(
        SQLAlchemyEnum(
            OrderStatus,
            name='order_status',
            values_callable=lambda obj: [e.value for e in obj]
        ),
        nullable=False,
        default=OrderStatus.CREATED,
        index=True
    )

    # Customer information
    first_name: Mapped[str] = mapped_column(
        String(Constants.FIRST_NAME_MAX_LEN),
        nullable=False
    )

    last_name: Mapped[str] = mapped_column(
        String(Constants.LAST_NAME_MAX_LEN),
        nullable=False
    )

    city: Mapped[str] = mapped_column(
        String(Constants.CITY_MAX_LEN),
        nullable=False
    )

    postal_code: Mapped[str] = mapped_column(
        String(Constants.POSTAL_CODE_MAX_LEN),
        nullable=False
    )

    address: Mapped[str] = mapped_column(
        String(Constants.ADDRESS_MAX_LEN),
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(Constants.PHONE_MAX_LEN),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(Constants.EMAIL_MAX_LEN),
        nullable=False
    )

    # Order totals (calculated at order creation)
    total_items: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    total_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    # Optional notes
    notes: Mapped[Optional[str]] = mapped_column(
        String(Constants.ORDER_NOTES_MAX_LEN),
        nullable=True
    )

    # Relationships
    items = relationship(
        'OrderItem',
        back_populates='order',
        cascade='all, delete-orphan',
        lazy='select'
    )

    user = relationship('User', backref='orders')

    # Indexes
    __table_args__ = (
        Index('ix_order_user_id', 'user_id'),
        Index('ix_order_status', 'status'),
        Index('ix_order_created_at', 'created_at'),
    )

    def __repr__(self) -> str:
        return (
            f'Order(id={self.id}, user_id={self.user_id}, '
            f'status={self.status}, total_price={self.total_price})'
        )


class OrderItem(Base):
    """
    Order item model.

    Represents a product in an order with quantity and price at purchase.
    Price is stored to preserve order history even if product price changes.
    """

    __tablename__ = 'order_items'

    # Foreign keys
    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('orders.id', ondelete='CASCADE'),
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
        nullable=False
    )

    # Price at the time of order (for price history preservation)
    price_at_purchase: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    # Product name snapshot (in case product is deleted/renamed)
    product_name: Mapped[str] = mapped_column(
        String(Constants.PRODUCT_NAME_MAX_LEN),
        nullable=False
    )

    # Relationships
    order = relationship('Order', back_populates='items')
    product = relationship('Product', lazy='select')

    # Indexes
    __table_args__ = (
        Index('ix_order_items_order_id', 'order_id'),
        Index('ix_order_items_product_id', 'product_id'),
    )

    def __repr__(self) -> str:
        return (
            f'OrderItem(id={self.id}, order_id={self.order_id}, '
            f'product_id={self.product_id}, quantity={self.quantity}, '
            f'price_at_purchase={self.price_at_purchase})'
        )
