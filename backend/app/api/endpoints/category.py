from typing import List, Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.validators import (
    validate_category_and_product_relationship,
    validate_category_creation,
    validate_category_exists,
    validate_category_update,
    validate_product_creation,
    validate_product_update
)
from app.core.constants import Constants
from app.core.db import get_async_session
from app.core.limiter import limiter
from app.core.user import current_superuser
from app.crud.category import category_crud
from app.crud.product import product_crud
from app.models.brand import Brand
from app.models.media import Media
from app.models.user import User
from app.schemas.category import (
    CategoryDetailResponse,
    CategoryResponse
)
from app.schemas.product import (
    ProductDetailResponse,
    ProductListResponse,
    ProductResponse
)


router = APIRouter()


@router.get(
    '/',
    response_model=List[CategoryResponse],
    summary='Получить список категорий',
    description='Получить список категорий с фильтрацией'
)
async def get_categories(
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
    is_active: Optional[bool] = Query(
        True, description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить список категорий с фильтрацией"""
    return await category_crud.get_multi_with_status(
        session=session,
        skip=skip,
        limit=limit,
        is_active=is_active
    )


@router.get(
    '/{category_id}',
    response_model=CategoryDetailResponse,
    summary='Получить категорию по ID',
    description='Получить детальную информацию о категории'
)
async def get_category(
    category_id: int,
    is_active: Optional[bool] = Query(
        True, description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить категорию по ID"""
    # Проверяем существование и активность категории
    await validate_category_exists(category_id, session, must_be_active=True)

    # Получаем категорию с изображением
    db_category = await category_crud.get_with_status(
        category_id=category_id,
        session=session,
        is_active=is_active
    )
    return db_category


@router.post(
    '/',
    response_model=CategoryResponse,
    summary='Создать категорию',
    description='Создать новую категорию с изображением'
)
@limiter.limit(Constants.RATE_LIMIT_CATEGORY_CREATE)
async def create_category(
    request: Request,
    name: str = Form(..., description='Название категории'),
    description: str = Form(None, description='Описание категории'),
    image: UploadFile = File(..., description='Изображение категории'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новую категорию"""
    # Валидируем создание категории
    await validate_category_creation(name, session)

    return await category_crud.create_with_image(
        name=name,
        description=description,
        image_file=image,
        session=session
    )


@router.patch(
    '/{category_id}',
    response_model=CategoryResponse,
    summary='Обновить категорию',
    description='Обновить информацию о категории'
)
@limiter.limit(Constants.RATE_LIMIT_CATEGORY_UPDATE)
async def update_category(
    request: Request,
    category_id: int,
    name: str = Form(None, description='Название категории'),
    description: str = Form(None, description='Описание категории'),
    image: UploadFile = File(None, description='Новое изображение'),
    is_active: bool = Form(None, description='Активность категории'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить категорию"""
    # Валидируем обновление категории
    await validate_category_update(category_id, name, session)

    return await category_crud.update_with_image(
        category_id=category_id,
        name=name,
        description=description,
        is_active=is_active,
        image_file=image,
        session=session
    )


@router.delete(
    '/{category_id}',
    response_model=CategoryResponse,
    summary='Удалить категорию',
    description='Мягкое удаление категории (установка is_active=False)'
)
async def delete_category(
    category_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Мягкое удаление категории"""
    # Проверяем существование категории
    await validate_category_exists(category_id, session, must_be_active=False)

    # Получаем категорию для удаления
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )

    return await category_crud.soft_delete(
        db_obj=db_category,
        session=session
    )


@router.patch(
    '/{category_id}/restore',
    response_model=CategoryResponse,
    summary='Восстановить категорию',
    description='Восстановить удаленную категорию'
)
async def restore_category(
    category_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Восстановить категорию"""
    # Проверяем существование категории
    await validate_category_exists(category_id, session, must_be_active=False)

    # Получаем категорию для восстановления
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )

    return await category_crud.restore(
        db_obj=db_category,
        session=session
    )


@router.get(
    '/{category_id}/products/',
    response_model=List[ProductListResponse],
    summary='Получить продукты категории',
    description='Получить список всех активных продуктов категории'
)
async def get_category_products(
    category_id: int,
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
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукты категории"""
    # Проверяем существование и активность категории
    await validate_category_exists(category_id, session, must_be_active=True)

    # Получаем категорию для передачи в ответ
    category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )

    # Получаем продукты категории
    products = await product_crud.get_by_category(
        category_id=category_id,
        session=session,
        skip=skip,
        limit=limit
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

    # Загружаем бренды для всех продуктов одним запросом
    brand_ids = list(set(p.brand_id for p in products))
    brands = await session.execute(
        select(Brand)
        .where(Brand.id.in_(brand_ids))
    )
    brands_dict = {brand.id: brand for brand in brands.scalars().all()}

    # Преобразуем в ProductListResponse с главным изображением
    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            part_number=p.part_number,
            description=p.description,
            price=p.price,
            is_active=p.is_active,
            category_id=p.category_id,
            brand_id=p.brand_id,
            main_image=main_images_dict.get(p.id),
            category=category,
            brand=brands_dict.get(p.brand_id)
        ) for p in products
    ]


@router.get(
    '/{category_id}/products/{product_id}',
    response_model=ProductDetailResponse,
    summary='Получить продукт категории',
    description='Получить детальную информацию о продукте в категории'
)
async def get_category_product(
    category_id: int,
    product_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукт из категории"""
    # Комплексная проверка существования категории, продукта и их связи
    await validate_category_and_product_relationship(
        category_id, product_id, session
    )

    # Получаем продукт
    product = await product_crud.get_active(
        product_id=product_id,
        session=session
    )
    return product


@router.post(
    '/{category_id}/products/',
    response_model=ProductResponse,
    summary='Создать продукт в категории',
    description='Создать новый продукт в указанной категории'
)
@limiter.limit(Constants.RATE_LIMIT_PRODUCT_CREATE)
async def create_category_product(
    request: Request,
    category_id: int,
    name: str = Form(..., description='Название продукта'),
    part_number: str = Form(..., description='Артикул продукта'),
    price: float = Form(
        ...,
        ge=Constants.PRICE_MIN_VALUE,
        le=Constants.PRICE_MAX_VALUE,
        description='Цена продукта'
    ),
    brand_id: int = Form(..., description='ID бренда'),
    description: str = Form(None, description='Описание продукта'),
    images: List[UploadFile] = File(
        ...,
        description='Изображения продукта (можно выбрать несколько)'
        ),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новый продукт в категории"""
    try:
        # Комплексная валидация создания продукта
        await validate_product_creation(
            name, category_id, brand_id, images, session
        )

        return await category_crud.create_product_with_images(
            name=name,
            part_number=part_number,
            price=price,
            category_id=category_id,
            brand_id=brand_id,
            description=description,
            images=images,
            session=session
        )
    except HTTPException:
        # Перебрасываем HTTPException как есть
        raise
    except Exception as e:
        # Логируем детали ошибки для отладки
        print(f'Unexpected error creating product: {e}')
        raise HTTPException(
            status_code=500,
            detail='Внутренняя ошибка сервера при создании продукта'
        )


@router.patch(
    '/{category_id}/products/{product_id}',
    response_model=ProductDetailResponse,
    summary='Обновить продукт в категории',
    description='Обновить информацию о продукте в категории'
)
@limiter.limit(Constants.RATE_LIMIT_PRODUCT_UPDATE)
async def update_category_product(
    request: Request,
    category_id: int,
    product_id: int,
    name: str = Form(None, description='Название продукта'),
    part_number: str = Form(None, description='Артикул продукта'),
    price: float = Form(
        None,
        ge=Constants.PRICE_MIN_VALUE,
        le=Constants.PRICE_MAX_VALUE,
        description='Цена продукта'
    ),
    brand_id: int = Form(None, description='ID бренда'),
    description: str = Form(None, description='Описание продукта'),
    images: List[UploadFile] = File(
        None,
        description='Новые изображения (можно выбрать несколько)'
        ),
    is_active: bool = Form(None, description='Активность продукта'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить продукт в категории"""
    # Комплексная валидация обновления продукта
    await validate_product_update(
        product_id, category_id, name, brand_id, images, session
    )

    # Получаем продукт для обновления с загруженными связанными данными
    # В админ панели можем обновлять как активные, так и неактивные продукты
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session
    )

    return await category_crud.update_product_with_images(
        db_product=db_product,
        name=name,
        part_number=part_number,
        price=price,
        brand_id=brand_id,
        description=description,
        is_active=is_active,
        images=images,
        session=session
    )


@router.delete(
    '/{category_id}/products/{product_id}',
    response_model=ProductDetailResponse,
    summary='Удалить продукт из категории',
    description='Мягкое удаление продукта из категории'
)
async def delete_category_product(
    category_id: int,
    product_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Мягкое удаление продукта из категории"""
    # Комплексная проверка существования категории, продукта и их связи
    await validate_category_and_product_relationship(
        category_id, product_id, session
    )

    # Получаем продукт для удаления с загруженными связанными данными
    db_product = await product_crud.get_with_relations(
        product_id=product_id,
        session=session
    )

    return await product_crud.soft_delete(
        db_obj=db_product,
        session=session
    )


@router.patch(
    '/{category_id}/products/{product_id}/restore',
    response_model=ProductDetailResponse,
    summary='Восстановить продукт в категории',
    description='Восстановить удаленный продукт в категории'
)
async def restore_category_product(
    category_id: int,
    product_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Восстановить продукт в категории"""
    # Комплексная проверка существования категории, продукта и их связи
    await validate_category_and_product_relationship(
        category_id, product_id, session
    )

    # Получаем продукт для восстановления с загруженными связанными данными
    db_product = await product_crud.get_with_relations(
        product_id=product_id,
        session=session
    )

    return await product_crud.restore(
        db_obj=db_product,
        session=session
    )
