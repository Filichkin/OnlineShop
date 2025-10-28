from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.core.db import get_async_session
from app.crud.product import product_crud
from app.models.media import Media
from app.models.product import Category
from app.schemas.product import (
    ProductDetailResponse,
    ProductListResponse
)


router = APIRouter()


@router.get(
    '/',
    response_model=List[ProductListResponse],
    summary='Получить список продуктов',
    description='Получить список продуктов с фильтрацией'
)
async def get_products(
    skip: int = Query(
        Constants.DEFAULT_SKIP,
        ge=0,
        description='Количество элементов для пропуска'
    ),
    limit: int = Query(
        Constants.DEFAULT_LIMIT,
        ge=1,
        le=Constants.MAX_LIMIT,
        description='Количество элементов для возврата'
    ),
    category_id: Optional[int] = Query(
        None, description='Фильтр по категории'
    ),
    search: Optional[str] = Query(
        None,
        max_length=Constants.SEARCH_STRING_MAX_LENGTH,
        description='Поиск по названию'
    ),
    min_price: Optional[float] = Query(
        None,
        ge=Constants.PRICE_MIN_VALUE,
        le=Constants.PRICE_MAX_VALUE,
        description='Минимальная цена'
    ),
    max_price: Optional[float] = Query(
        None,
        ge=Constants.PRICE_MIN_VALUE,
        le=Constants.PRICE_MAX_VALUE,
        description='Максимальная цена'
    ),
    is_active: Optional[bool] = Query(
        True, description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить список продуктов с фильтрацией"""
    # Validate price range if both are provided
    if min_price is not None and max_price is not None:
        if min_price > max_price:
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='min_price cannot be greater than max_price'
            )

    if category_id:
        products = await product_crud.get_by_category(
            category_id=category_id,
            session=session,
            skip=skip,
            limit=limit,
            is_active=is_active
        )
    elif search:
        # Validate and sanitize search string
        search = search.strip()
        if not search:
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='Search string cannot be empty or whitespace only'
            )

        products = await product_crud.search_by_name(
            name_pattern=search,
            session=session,
            skip=skip,
            limit=limit,
            is_active=is_active
        )
    elif min_price is not None and max_price is not None:
        products = await product_crud.get_by_price_range(
            min_price=min_price,
            max_price=max_price,
            session=session,
            skip=skip,
            limit=limit,
            is_active=is_active
        )
    else:
        products = await product_crud.get_multi(
            session=session,
            skip=skip,
            limit=limit,
            is_active=is_active
        )

    # Получаем главные изображения для всех продуктов одним запросом
    product_ids = [p.id for p in products]
    main_images = await session.execute(
        select(Media)
        .where(
            Media.product_id.in_(product_ids),
            Media.is_main.is_(True)
        )
    )
    main_images_dict = {
        img.product_id: img.url
        for img in main_images.scalars().all()
    }

    # Загружаем категории для всех продуктов одним запросом
    category_ids = list(set(p.category_id for p in products))
    categories = await session.execute(
        select(Category)
        .where(Category.id.in_(category_ids))
    )
    categories_dict = {cat.id: cat for cat in categories.scalars().all()}

    # Преобразуем в ProductListResponse с главным изображением
    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            price=p.price,
            is_active=p.is_active,
            category_id=p.category_id,
            main_image=main_images_dict.get(p.id),
            category=categories_dict.get(p.category_id)
        ) for p in products
    ]


@router.get(
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Получить продукт по ID',
    description='Получить детальную информацию о продукте'
)
async def get_product(
    product_id: int,
    is_active: Optional[bool] = Query(
        True, description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукт по ID"""
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=is_active
    )
    if not db_product:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )
    return db_product
