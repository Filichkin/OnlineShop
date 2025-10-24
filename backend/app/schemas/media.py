# app/schemas/media.py
from uuid import UUID

from pydantic import BaseModel

from app.core.constants import Constants
from app.models.media import MediaType


class MediaBase(BaseModel):
    url: str
    media_type: MediaType
    order: int = Constants.MEDIA_ORDER_DEFAULT
    is_main: bool = False

    class Config:
        json_schema_extra = {
            'example': {
                'url': '/uploads/products/product_1_0_abc123.jpg',
                'media_type': MediaType.PRODUCT,
                'order': 0,
                'is_main': True
            }
        }


class MediaCreate(MediaBase):
    """Схема для создания Media (обычно не используется напрямую)"""
    product_id: int | None = None
    category_id: int | None = None

    class Config:
        json_schema_extra = {
            'example': {
                'url': '/uploads/products/product_5_0_def456.jpg',
                'media_type': MediaType.PRODUCT,
                'order': 0,
                'is_main': True,
                'product_id': 5,
                'category_id': None
            }
        }


class MediaResponse(MediaBase):
    id: UUID
    product_id: int | None = None
    category_id: int | None = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            'example': {
                'id': 1,
                'url': '/uploads/products/product_5_0_abc123.jpg',
                'media_type': MediaType.PRODUCT,
                'order': 0,
                'is_main': True,
                'product_id': 5,
                'category_id': None
            }
        }
