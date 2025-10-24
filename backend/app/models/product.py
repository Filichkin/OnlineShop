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

    image = relationship(
        'Media',
        back_populates='category',
        uselist=False,
        lazy='select'
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
    description: Mapped[Optional[str]] = mapped_column(String)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('categories.id'),
        nullable=False
    )

    category = relationship(
        'Category',
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
            f'category_id={self.category_id})'
        )
