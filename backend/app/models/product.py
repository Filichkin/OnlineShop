from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String
)
from sqlalchemy.orm import relationship


from app.core.db import Base


class Category(Base):
    __tablename__ = 'categories'

    name = Column(String, nullable=False, unique=True)
    description = Column(String)
    image_url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    image = relationship(
        'Media',
        back_populates='category',
        uselist=False
    )

    products = relationship(
        'Product',
        back_populates='category'
        )


class Product(Base):
    __tablename__ = 'products'

    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    category_id = Column(
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
