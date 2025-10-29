from sqlalchemy import (
    Boolean,
    String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Brand(Base):
    __tablename__ = 'brands'

    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    products = relationship(
        'Product',
        back_populates='brand'
    )

    def __repr__(self):
        return (
            f'Brand(id={self.id}, name={self.name}, '
            f'is_active={self.is_active})'
        )
