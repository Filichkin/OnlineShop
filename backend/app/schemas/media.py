# app/schemas/media.py
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field

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


class SetMainImageRequest(BaseModel):
    """Схема для установки главного изображения"""
    media_id: UUID = Field(..., description='ID изображения')

    class Config:
        json_schema_extra = {
            'example': {
                'media_id': '123e4567-e89b-12d3-a456-426614174000'
            }
        }


class DeleteImagesRequest(BaseModel):
    """Схема для удаления изображений"""
    media_ids: List[UUID] = Field(
        ...,
        min_length=1,
        description='Список ID изображений для удаления'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'media_ids': [
                    '123e4567-e89b-12d3-a456-426614174000',
                    '123e4567-e89b-12d3-a456-426614174001'
                ]
            }
        }


class ImageOrderUpdate(BaseModel):
    """Схема для обновления порядка одного изображения"""
    media_id: UUID = Field(..., description='ID изображения')
    order: int = Field(..., ge=0, description='Новый порядок изображения')


class ReorderImagesRequest(BaseModel):
    """Схема для изменения порядка изображений"""
    order_updates: List[ImageOrderUpdate] = Field(
        ...,
        min_length=1,
        description='Список обновлений порядка изображений'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'order_updates': [
                    {
                        'media_id': '123e4567-e89b-12d3-a456-426614174000',
                        'order': 0
                    },
                    {
                        'media_id': '123e4567-e89b-12d3-a456-426614174001',
                        'order': 1
                    }
                ]
            }
        }


class DeleteImagesResponse(BaseModel):
    """Ответ на удаление изображений"""
    deleted_count: int = Field(
        ...,
        description='Количество удаленных изображений'
    )
    message: str

    class Config:
        json_schema_extra = {
            'example': {
                'deleted_count': 2,
                'message': 'Удалено изображений: 2'
            }
        }
