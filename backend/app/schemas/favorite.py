from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ProductInFavorite(BaseModel):
    '''Minimal product information for favorite responses.'''

    id: int
    name: str
    price: float
    main_image: Optional[str] = None
    part_number: str

    class Config:
        from_attributes = True


class FavoriteItemResponse(BaseModel):
    '''Schema for favorite item in responses.'''

    id: int
    product_id: int
    product: ProductInFavorite
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteResponse(BaseModel):
    '''Complete favorite list response with all items.'''

    id: int
    session_id: Optional[str] = None
    items: List[FavoriteItemResponse] = []
    total_items: int = Field(
        description='Total number of items in favorites'
    )
    expires_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FavoriteItemAddResponse(BaseModel):
    '''Response after adding item to favorites.'''

    message: str = Field(
        default='Item added to favorites',
        description='Success message'
    )
    product_id: int = Field(
        description='ID of the added product'
    )
    item: FavoriteItemResponse

    class Config:
        json_schema_extra = {
            'example': {
                'message': 'Item added to favorites',
                'product_id': 1,
                'item': {
                    'id': 1,
                    'product_id': 1,
                    'product': {
                        'id': 1,
                        'name': 'Product Name',
                        'price': 999.99,
                        'main_image': '/media/products/image.jpg',
                        'part_number': 'PN-12345'
                    },
                    'created_at': '2025-01-01T00:00:00Z'
                }
            }
        }


class FavoriteItemDeleteResponse(BaseModel):
    '''Response after removing item from favorites.'''

    message: str = Field(
        default='Item removed from favorites',
        description='Success message'
    )
    product_id: int = Field(
        description='ID of the removed product'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'message': 'Item removed from favorites',
                'product_id': 1
            }
        }
