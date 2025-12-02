from typing import Optional

from sqlalchemy import (
    Boolean,
    String,
    Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Brand(Base):
    __tablename__ = 'brands'

    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    products = relationship(
        'Product',
        back_populates='brand'
    )
    images = relationship(
        'Media',
        back_populates='brand',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return (
            f'Brand(id={self.id}, name={self.name}, '
            f'description={self.description}, '
            f'image={self.image}, '
            f'is_active={self.is_active})'
        )
