from typing import Optional

from pydantic import BaseModel, Field


class BrandBase(BaseModel):
    """Базовые поля бренда"""

    name: str = Field(..., min_length=1, max_length=100)
    is_active: bool = Field(default=True)


class BrandCreate(BrandBase):
    """Схема для создания бренда"""

    class Config:
        json_schema_extra = {
            'example': {
                'name': 'Apple'
            }
        }


class BrandUpdate(BaseModel):
    """Схема для обновления бренда"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

    class Config:
        json_schema_extra = {
            'example': {
                'name': 'Samsung',
                'is_active': True
            }
        }


class BrandResponse(BrandBase):
    """Схема ответа с информацией о бренде"""

    id: int

    class Config:
        from_attributes = True
