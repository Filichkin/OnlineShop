from pydantic import BaseModel, Field
from typing import Optional

from app.schemas.media import MediaResponse


class CategoryBase(BaseModel):
    """Базовые поля категории"""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = Field(default=True)


class CategoryCreate(BaseModel):
    """
    Схема для создания категории (только для документации).

    Реальный запрос использует multipart/form-data:
    - name: str (обязательно)
    - description: str (опционально)
    - image: file (обязательно)
    """

    name: str = Field(..., description='Название категории')
    description: Optional[str] = Field(None, description='Описание категории')


class CategoryUpdate(BaseModel):
    """Схема для обновления категории"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

    class Config:
        json_schema_extra = {
            'example': {
                'name': 'Электроника',
                'description': 'Гаджеты и техника'
            }
        }


class CategoryResponse(CategoryBase):
    """Схема ответа с основной информацией"""

    id: int
    image_url: str

    class Config:
        from_attributes = True


class CategoryDetailResponse(CategoryResponse):
    """Детальная схема с медиа-объектом"""

    image: Optional[MediaResponse] = None

    class Config:
        from_attributes = True
