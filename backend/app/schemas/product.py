from typing import List, Optional

from pydantic import BaseModel, Field

from app.core.constants import Constants
from app.schemas.brand import BrandResponse
from app.schemas.media import MediaResponse


class ProductBase(BaseModel):
    """Базовые поля продукта"""

    name: str = Field(
        ...,
        min_length=Constants.PRODUCT_NAME_MIN_LEN,
        max_length=Constants.PRODUCT_NAME_MAX_LEN
        )
    part_number: str = Field(
        ...,
        min_length=Constants.PART_NUMBER_MIN_LEN,
        max_length=Constants.PART_NUMBER_MAX_LEN
        )
    description: Optional[str] = Field(
        None,
        max_length=Constants.PRODUCT_DESCRIPTION_MAX_LEN
        )
    price: float = Field(
        ...,
        gt=Constants.PRICE_MIN_VALUE,
        description='Цена должна быть больше 0'
        )
    is_active: bool = Field(default=True)
    brand_id: int = Field(..., gt=Constants.BRAND_ID_MIN_VALUE)


class ProductCreate(BaseModel):
    """
    Схема для создания продукта (только для документации).

    Реальный запрос использует multipart/form-data:
    - name: str (обязательно)
    - part_number: str (обязательно)
    - price: float (обязательно, > 0)
    - brand_id: int (обязательно)
    - description: str (опционально)
    - images: List[file] (обязательно, минимум 1 файл)
    """

    name: str = Field(..., description='Название продукта')
    part_number: str = Field(..., description='Артикул продукта')
    price: float = Field(..., gt=0, description='Цена')
    brand_id: int = Field(..., description='ID бренда')
    description: Optional[str] = Field(None, description='Описание')
    # images: List[UploadFile] - не указываем, т.к. Pydantic не поддерживает


class ProductUpdate(BaseModel):
    """Схема для обновления продукта"""

    name: Optional[str] = Field(
        None,
        min_length=Constants.PRODUCT_NAME_MIN_LEN,
        max_length=Constants.PRODUCT_NAME_MAX_LEN
        )
    part_number: Optional[str] = Field(
        None,
        min_length=Constants.PART_NUMBER_MIN_LEN,
        max_length=Constants.PART_NUMBER_MAX_LEN
        )
    description: Optional[str] = Field(
        None,
        max_length=Constants.PRODUCT_DESCRIPTION_MAX_LEN
        )
    price: Optional[float] = Field(None, gt=Constants.PRICE_MIN_VALUE)
    is_active: Optional[bool] = None
    brand_id: Optional[int] = Field(
        None,
        gt=Constants.BRAND_ID_MIN_VALUE
        )

    class Config:
        json_schema_extra = {
            'example': {
                'name': 'iPhone 15 Pro',
                'part_number': 'APL-IP15-PRO-256',
                'price': 99999.00,
                'brand_id': 1,
                'description': 'Новейший смартфон от Apple'
            }
        }


class ProductResponse(ProductBase):
    """Базовый ответ с продуктом"""
    id: int

    class Config:
        from_attributes = True


class ProductDetailResponse(ProductResponse):
    """Детальная схема с изображениями и брендом"""
    images: List[MediaResponse] = []
    main_image: Optional[str] = None
    brand: BrandResponse

    class Config:
        from_attributes = True


class ProductListResponse(ProductResponse):
    """Схема для списка продуктов (с главным изображением)"""
    main_image: Optional[str] = None
    brand: BrandResponse

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
            part_number=product.part_number,
            description=product.description,
            price=product.price,
            brand_id=product.brand_id,
            main_image=main_img,
            brand=product.brand
        )
