from typing import Optional

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Index,
    Integer,
    String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Product(Base):
    __tablename__ = 'products'

    name: Mapped[str] = mapped_column(String, nullable=False)
    part_number: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    price: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    brand_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('brands.id'),
        nullable=False,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default='true',
        index=True
    )

    brand = relationship(
        'Brand',
        back_populates='products'
    )
    images = relationship(
        'Media',
        back_populates='product',
        cascade='all, delete-orphan'
    )

    # Composite indexes for common query patterns
    __table_args__ = (
        Index('ix_product_brand_price', 'brand_id', 'price'),
        Index('ix_product_brand_active', 'brand_id', 'is_active'),
    )

    def __repr__(self):
        return (
            f'Product(id={self.id}, name={self.name}, '
            f'description={self.description}, '
            f'price={self.price}, '
            f'brand_id={self.brand_id})'
        )
