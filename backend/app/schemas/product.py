from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.category import CategoryResponse
from app.schemas.media import MediaResponse


class ProductBase(BaseModel):
    """Базовые поля продукта"""

    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: float = Field(
        ...,
        gt=0,
        description='Цена должна быть больше 0'
        )
    category_id: int = Field(..., gt=0)


class ProductCreate(BaseModel):
    """
    Схема для создания продукта (только для документации).

    Реальный запрос использует multipart/form-data:
    - name: str (обязательно)
    - price: float (обязательно, > 0)
    - category_id: int (обязательно)
    - description: str (опционально)
    - images: List[file] (обязательно, минимум 1 файл)
    """

    name: str = Field(..., description='Название продукта')
    price: float = Field(..., gt=0, description='Цена')
    category_id: int = Field(..., description='ID категории')
    description: Optional[str] = Field(None, description='Описание')
    # images: List[UploadFile] - не указываем, т.к. Pydantic не поддерживает

    class Config:
        json_schema_extra = {
            'example': {
                'name': 'iPhone 15 Pro',
                'price': 99999.00,
                'category_id': 1,
                'description': 'Новейший смартфон от Apple'
            }
        }


class ProductResponse(ProductBase):
    """Базовый ответ с продуктом"""
    id: int

    class Config:
        from_attributes = True


class ProductDetailResponse(ProductResponse):
    """Детальная схема с изображениями и категорией"""
    images: List[MediaResponse] = []
    category: CategoryResponse

    class Config:
        from_attributes = True


class ProductListResponse(ProductResponse):
    """Схема для списка продуктов (с главным изображением)"""
    main_image: Optional[str] = None
    category: CategoryResponse

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_main_image(cls, product):
        """Добавляет главное изображение из списка"""

        main_img = next(
            (img.url for img in product.images if img.is_main),
            product.images[0].url if product.images else None
        )

        return cls(
            id=product.id,
            name=product.name,
            description=product.description,
            price=product.price,
            category_id=product.category_id,
            main_image=main_img,
            category=product.category
        )
