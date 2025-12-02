import enum
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Enum,
    Integer,
    ForeignKey,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import Constants
from app.core.db import Base


class MediaType(str, enum.Enum):
    PRODUCT = 'product'
    BRAND = 'brand'


class Media(Base):
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    url: Mapped[str] = mapped_column(String, nullable=False)
    media_type: Mapped[MediaType] = mapped_column(
        Enum(MediaType), nullable=False
    )
    order: Mapped[int] = mapped_column(
        Integer, default=Constants.MEDIA_ORDER_DEFAULT
    )
    is_main: Mapped[bool] = mapped_column(Boolean, default=False)

    # Product relationship (optional)
    product_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey('products.id', ondelete='CASCADE'),
        nullable=True,
        index=True
    )
    product = relationship(
        'Product',
        back_populates='images'
    )

    # Brand relationship (optional)
    brand_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey('brands.id', ondelete='CASCADE'),
        nullable=True,
        index=True
    )
    brand = relationship(
        'Brand',
        back_populates='images'
    )

    def __repr__(self):
        return (
            f'Media(id={self.id}, '
            f'product_id={self.product_id}, '
            f'brand_id={self.brand_id}, '
            f'url={self.url}, '
            f'media_type={self.media_type}, '
            f'order={self.order}, '
            f'is_main={self.is_main})'
        )
