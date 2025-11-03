from typing import Optional

from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Category(Base):
    __tablename__ = 'categories'

    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(String)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    image = relationship(
        'Media',
        back_populates='category',
        uselist=False,
        lazy='select',
        primaryjoin=(
            "and_(Category.id == Media.category_id, "
            "Media.media_type == 'category')"
        )
    )

    products = relationship(
        'Product',
        back_populates='category'
    )

    def __repr__(self):
        return (
            f'Category(id={self.id}, name={self.name}, '
            f'description={self.description}, '
            f'image_url={self.image_url})'
        )


class Product(Base):
    __tablename__ = 'products'

    name: Mapped[str] = mapped_column(String, nullable=False)
    part_number: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('categories.id'),
        nullable=False,
        index=True  # Add index for foreign key queries
    )
    brand_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('brands.id'),
        nullable=False,
        index=True  # Add index for foreign key queries
    )

    category = relationship(
        'Category',
        back_populates='products'
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

    def __repr__(self):
        return (
            f'Product(id={self.id}, name={self.name}, '
            f'description={self.description}, '
            f'price={self.price}, '
            f'category_id={self.category_id}, '
            f'brand_id={self.brand_id})'
        )
