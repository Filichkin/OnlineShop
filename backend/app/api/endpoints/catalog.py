"""
Эндпоинты для каталога продуктов (все бренды).

Маршруты: /catalog/*
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.core.db import get_async_session
from app.crud.brand import brand_crud
from app.crud.product import product_crud
from app.models.brand import Brand
from app.models.media import Media
from app.schemas.product import ProductDetailResponse, ProductListResponse


router = APIRouter()


@router.get(
    '/',
    response_model=List[ProductListResponse],
    summary='Получить каталог всех продуктов',
    description='Получить список всех продуктов с расширенными фильтрами'
)
async def get_catalog(
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
    brand_slug: Optional[str] = Query(
        None,
        description='Фильтр по slug бренда'
    ),
    search: Optional[str] = Query(
        None,
        max_length=Constants.SEARCH_STRING_MAX_LENGTH,
        description='Поиск по названию, артикулу, описанию'
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
        True,
        description='Фильтр по статусу активности (по умолчанию только активные)'
    ),
    sort_by: str = Query(
        'created_at',
        description='Поле для сортировки (name, price, created_at)'
    ),
    sort_order: str = Query(
        'desc',
        description='Порядок сортировки (asc, desc)'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить каталог всех продуктов с фильтрацией и сортировкой"""
    logger.debug(
        f'Запрос каталога продуктов: brand_slug={brand_slug}, '
        f'search={search}, min_price={min_price}, max_price={max_price}, '
        f'skip={skip}, limit={limit}, is_active={is_active}, '
        f'sort_by={sort_by}, sort_order={sort_order}'
    )

    # Валидация диапазона цен
    if min_price is not None and max_price is not None:
        if min_price > max_price:
            logger.warning(
                f'Неверный диапазон цен: min_price={min_price} > '
                f'max_price={max_price}'
            )
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='min_price не может быть больше max_price'
            )

    # Валидация поисковой строки
    if search:
        search = search.strip()
        if not search:
            logger.warning('Пустая строка поиска отклонена')
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='Поисковая строка не может быть пустой'
            )

    # Валидация slug бренда
    if brand_slug:
        brand = await brand_crud.get_by_slug(slug=brand_slug, session=session)
        if not brand:
            logger.warning(f'Бренд не найден: brand_slug={brand_slug}')
            raise HTTPException(
                status_code=Constants.HTTP_404_NOT_FOUND,
                detail=f'Бренд с slug "{brand_slug}" не найден'
            )
        if is_active and not brand.is_active:
            logger.warning(
                f'Бренд неактивен: brand_slug={brand_slug}'
            )
            raise HTTPException(
                status_code=Constants.HTTP_404_NOT_FOUND,
                detail=f'Бренд с slug "{brand_slug}" не найден'
            )

    # Валидация параметров сортировки
    if sort_by not in ['name', 'price', 'created_at']:
        logger.warning(f'Неверное поле сортировки: sort_by={sort_by}')
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='sort_by должен быть name, price или created_at'
        )

    if sort_order not in ['asc', 'desc']:
        logger.warning(f'Неверный порядок сортировки: sort_order={sort_order}')
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='sort_order должен быть asc или desc'
        )

    # Получаем продукты из каталога
    products = await product_crud.get_multi_for_catalog(
        session=session,
        skip=skip,
        limit=limit,
        brand_slug=brand_slug,
        search=search,
        min_price=min_price,
        max_price=max_price,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order
    )

    if not products:
        logger.info('Продукты не найдены с заданными фильтрами')
        return []

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

    # Загружаем бренды для всех продуктов одним запросом
    brand_ids = list(set(p.brand_id for p in products))
    brands = await session.execute(
        select(Brand)
        .where(Brand.id.in_(brand_ids))
    )
    brands_dict = {brand.id: brand for brand in brands.scalars().all()}

    # Формируем ответ
    result = [
        ProductListResponse(
            id=p.id,
            name=p.name,
            part_number=p.part_number,
            description=p.description,
            price=p.price,
            is_active=p.is_active,
            brand_id=p.brand_id,
            main_image=main_images_dict.get(p.id),
            brand=brands_dict.get(p.brand_id)
        ) for p in products
    ]

    logger.info(f'Возвращено продуктов из каталога: {len(result)}')
    return result


@router.get(
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Получить продукт из каталога по ID',
    description='Получить детальную информацию о продукте из каталога'
)
async def get_catalog_product(
    product_id: int,
    is_active: Optional[bool] = Query(
        True,
        description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукт из каталога по ID"""
    logger.debug(
        f'Запрос продукта из каталога: product_id={product_id}, '
        f'is_active={is_active}'
    )

    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=is_active
    )

    if not db_product:
        logger.warning(
            f'Продукт не найден в каталоге: product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    logger.info(
        f'Продукт получен из каталога: id={db_product.id}, '
        f'name={db_product.name}'
    )
    return db_product
