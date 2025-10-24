import enum
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    Integer,
    ForeignKey,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


from app.core.db import Base


class MediaType(str, enum.Enum):
    PRODUCT = 'product'
    CATEGORY = 'category'


class Media(Base):
    __tablename__ = 'media'

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    url = Column(String, nullable=False)
    media_type = Column(Enum(MediaType), nullable=False)
    order = Column(Integer, default=0)
    is_main = Column(Boolean, default=False)
    product_id = Column(
        Integer,
        ForeignKey('products.id', ondelete='CASCADE'),
        nullable=True
        )
    category_id = Column(
        Integer,
        ForeignKey('categories.id', ondelete='CASCADE'),
        nullable=True
        )
    product = relationship(
        'Product',
        back_populates='images'
        )
    category = relationship(
        'Category',
        back_populates='image',
        uselist=False
        )

    def __repr__(self):
        return (
            f'Media(id={self.id}, product_id={self.product_id}, '
            f'category_id={self.category_id}, '
            f'url={self.url}, '
            f'media_type={self.media_type}, '
            f'order={self.order}, '
            f'is_main={self.is_main})'
        )
