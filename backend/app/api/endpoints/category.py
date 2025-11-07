from enum import Enum
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
)
from loguru import logger
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
from app.models.media import Media
from app.models.brand import Brand
from app.models.user import User
from app.schemas.category import (
    CategoryDetailResponse,
    CategoryResponse
)
from app.schemas.product import (
    ProductDetailResponse,
    ProductListResponse
)


class ProductSortBy(str, Enum):
    """Варианты сортировки продуктов"""
    PRICE_ASC = 'price_asc'
    PRICE_DESC = 'price_desc'
    NAME_ASC = 'name_asc'
    NAME_DESC = 'name_desc'


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
    logger.debug(
        f'Запрос списка категорий: skip={skip}, limit={limit}, '
        f'is_active={is_active}'
    )

    categories = await category_crud.get_multi_with_status(
        session=session,
        skip=skip,
        limit=limit,
        is_active=is_active
    )

    logger.info(f'Возвращено категорий: {len(categories)}')
    return categories


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
    logger.debug(
        f'Запрос категории: category_id={category_id}, '
        f'is_active={is_active}'
    )

    # Проверяем существование и активность категории
    await validate_category_exists(category_id, session, must_be_active=True)

    # Получаем категорию с изображением
    db_category = await category_crud.get_with_status(
        category_id=category_id,
        session=session,
        is_active=is_active
    )

    logger.info(
        f'Категория получена: id={db_category.id}, '
        f'name={db_category.name}'
    )
    return db_category


@router.get(
    '/slug/{slug}',
    response_model=CategoryDetailResponse,
    summary='Получить категорию по слагу',
    description='Получить детальную информацию о категории по слагу'
)
async def get_category_by_slug(
    slug: str,
    is_active: Optional[bool] = Query(
        True, description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить категорию по слагу"""
    logger.debug(f'Запрос категории по слагу: slug={slug}')

    db_category = await category_crud.get_with_status_by_slug(
        slug=slug,
        session=session,
        is_active=is_active
    )
    if not db_category:
        logger.warning(f'Категория не найдена по слагу: slug={slug}')
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Категория не найдена'
        )

    logger.info(
        f'Категория получена по слагу: id={db_category.id}, '
        f'name={db_category.name}, slug={slug}'
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
    icon: UploadFile = File(..., description='Иконка категории'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новую категорию"""
    logger.bind(user_id=current_user.id).info(
        f'Попытка создания категории: name={name}'
    )

    try:
        # Валидируем создание категории
        await validate_category_creation(name, session)
        logger.debug(f'Валидация пройдена для категории: name={name}')

        category = await category_crud.create_with_image(
            name=name,
            description=description,
            image_file=image,
            icon_file=icon,
            session=session
        )

        logger.bind(user_id=current_user.id).info(
            f'Категория создана: id={category.id}, name={category.name}'
        )
        return category

    except HTTPException:
        logger.bind(user_id=current_user.id).warning(
            f'Создание категории отклонено: name={name}'
        )
        raise
    except Exception as e:
        logger.bind(user_id=current_user.id).exception(
            f'Ошибка при создании категории: {e}'
        )
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail='Ошибка при создании категории'
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
    icon: UploadFile = File(None, description='Новая иконка'),
    is_active: bool = Form(None, description='Активность категории'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить категорию"""
    logger.bind(user_id=current_user.id).info(
        f'Попытка обновления категории: category_id={category_id}'
    )

    try:
        # Валидируем обновление категории
        await validate_category_update(category_id, name, session)

        category = await category_crud.update_with_image(
            category_id=category_id,
            name=name,
            description=description,
            is_active=is_active,
            image_file=image,
            icon_file=icon,
            session=session
        )

        logger.bind(user_id=current_user.id).info(
            f'Категория обновлена: id={category_id}, name={category.name}'
        )
        return category

    except HTTPException:
        logger.bind(user_id=current_user.id).warning(
            f'Обновление категории отклонено: category_id={category_id}'
        )
        raise
    except Exception as e:
        logger.bind(user_id=current_user.id).exception(
            f'Ошибка при обновлении категории: '
            f'category_id={category_id}, error={e}'
        )
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail='Ошибка при обновлении категории'
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
    logger.bind(user_id=current_user.id).info(
        f'Попытка удаления категории: category_id={category_id}'
    )

    # Проверяем существование категории
    await validate_category_exists(category_id, session, must_be_active=False)

    # Получаем категорию для удаления
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )

    result = await category_crud.soft_delete(
        db_obj=db_category,
        session=session
    )

    logger.bind(user_id=current_user.id).info(
        f'Категория удалена (мягкое): id={category_id}, '
        f'name={db_category.name}'
    )
    return result


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
    logger.bind(user_id=current_user.id).info(
        f'Попытка восстановления категории: category_id={category_id}'
    )

    # Проверяем существование категории
    await validate_category_exists(category_id, session, must_be_active=False)

    # Получаем категорию для восстановления
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )

    result = await category_crud.restore(
        db_obj=db_category,
        session=session
    )

    logger.bind(user_id=current_user.id).info(
        f'Категория восстановлена: id={category_id}, '
        f'name={db_category.name}'
    )
    return result


@router.get(
    '/{category_id}/products/',
    response_model=List[ProductListResponse],
    summary='Получить продукты категории',
    description='Получить список продуктов категории с сортировкой'
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
    is_active: Optional[bool] = Query(
        True,
        description='Фильтр по активности продуктов'
    ),
    sort_by: ProductSortBy = Query(
        ProductSortBy.PRICE_ASC,
        description='Сортировка продуктов: '
                    'price_asc - по цене от меньшей к большей, '
                    'price_desc - по цене от большей к меньшей, '
                    'name_asc - по названию А-Я, '
                    'name_desc - по названию Я-А'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукты категории с сортировкой"""
    logger.debug(
        f'Запрос продуктов категории: category_id={category_id}, '
        f'skip={skip}, limit={limit}, is_active={is_active}, '
        f'sort_by={sort_by.value}'
    )

    # Проверяем существование и активность категории
    await validate_category_exists(category_id, session, must_be_active=True)

    # Получаем продукты категории с сортировкой
    products = await product_crud.get_by_category(
        category_id=category_id,
        session=session,
        skip=skip,
        limit=limit,
        is_active=is_active,
        sort_by=sort_by.value
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

    # Получаем категорию (одна для всех продуктов)
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )

    # Преобразуем в ProductListResponse
    result = [
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
            category=db_category,
            brand=brands_dict.get(p.brand_id)
        ) for p in products
    ]

    logger.info(
        f'Возвращено продуктов категории: category_id={category_id}, '
        f'count={len(result)}'
    )
    return result


@router.get(
    '/slug/{slug}/products/',
    response_model=List[ProductListResponse],
    summary='Получить продукты категории по слагу',
    description='Получить список продуктов категории по слагу с сортировкой'
)
async def get_category_products_by_slug(
    slug: str,
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
        True,
        description='Фильтр по активности продуктов'
    ),
    sort_by: ProductSortBy = Query(
        ProductSortBy.PRICE_ASC,
        description='Сортировка продуктов: '
                    'price_asc - по цене от меньшей к большей, '
                    'price_desc - по цене от большей к меньшей, '
                    'name_asc - по названию А-Я, '
                    'name_desc - по названию Я-А'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукты категории по слагу с сортировкой"""
    logger.debug(
        f'Запрос продуктов категории по слагу: slug={slug}, '
        f'skip={skip}, limit={limit}, sort_by={sort_by.value}'
    )

    db_category = await category_crud.get_with_status_by_slug(
        slug=slug,
        session=session,
        is_active=True
    )
    if not db_category:
        logger.warning(
            f'Категория не найдена по слагу при запросе продуктов: '
            f'slug={slug}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Категория не найдена'
        )

    products = await product_crud.get_by_category(
        category_id=db_category.id,
        session=session,
        skip=skip,
        limit=limit,
        is_active=is_active,
        sort_by=sort_by.value
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

    # Преобразуем в ProductListResponse
    result = [
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
            category=db_category,
            brand=brands_dict.get(p.brand_id)
        ) for p in products
    ]

    logger.info(
        f'Возвращено продуктов по слагу: slug={slug}, '
        f'category_id={db_category.id}, count={len(result)}'
    )
    return result


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
    logger.debug(
        f'Запрос продукта категории: category_id={category_id}, '
        f'product_id={product_id}'
    )

    # Комплексная проверка существования категории, продукта и их связи
    await validate_category_and_product_relationship(
        category_id, product_id, session
    )

    # Получаем продукт
    product = await product_crud.get_active(
        product_id=product_id,
        session=session
    )

    # Получаем главное изображение
    main_image_result = await session.execute(
        select(Media)
        .where(
            Media.product_id == product_id,
            Media.is_main.is_(True)
        )
    )
    main_image = main_image_result.scalars().first()
    main_image_url = main_image.url if main_image else None

    logger.info(
        f'Продукт категории получен: category_id={category_id}, '
        f'product_id={product_id}, name={product.name}'
    )

    # Создаем ответ с main_image
    return ProductDetailResponse(
        id=product.id,
        name=product.name,
        part_number=product.part_number,
        description=product.description,
        price=product.price,
        is_active=product.is_active,
        category_id=product.category_id,
        brand_id=product.brand_id,
        images=product.images,
        main_image=main_image_url,
        category=product.category,
        brand=product.brand
    )


@router.post(
    '/{category_id}/products/',
    response_model=ProductListResponse,
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
    logger.bind(user_id=current_user.id).info(
        f'Попытка создания продукта: category_id={category_id}, '
        f'name={name}, part_number={part_number}'
    )

    try:
        # Комплексная валидация создания продукта
        await validate_product_creation(
            name, category_id, brand_id, images, session
        )
        logger.debug(
            f'Валидация пройдена для продукта: name={name}, '
            f'category_id={category_id}'
        )

        product = await category_crud.create_product_with_images(
            name=name,
            part_number=part_number,
            price=price,
            category_id=category_id,
            brand_id=brand_id,
            description=description,
            images=images,
            session=session
        )

        # Формируем ответ с главным изображением
        main_image = None
        if product.images:
            main_image = product.images[0].url

        logger.bind(user_id=current_user.id).info(
            f'Продукт создан в категории: id={product.id}, '
            f'name={product.name}, category_id={category_id}'
        )

        return ProductListResponse(
            id=product.id,
            name=product.name,
            part_number=product.part_number,
            description=product.description,
            price=product.price,
            is_active=product.is_active,
            category_id=product.category_id,
            brand_id=product.brand_id,
            main_image=main_image,
            category=product.category,
            brand=product.brand
        )
    except HTTPException:
        logger.bind(user_id=current_user.id).warning(
            f'Создание продукта отклонено: category_id={category_id}, '
            f'name={name}'
        )
        raise
    except Exception as e:
        logger.bind(user_id=current_user.id).exception(
            f'Ошибка при создании продукта: category_id={category_id}, '
            f'error={e}'
        )
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail='Внутренняя ошибка сервера при создании продукта'
        )


@router.patch(
    '/{category_id}/products/{product_id}',
    response_model=ProductListResponse,
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
    logger.bind(user_id=current_user.id).info(
        f'Попытка обновления продукта: category_id={category_id}, '
        f'product_id={product_id}'
    )

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

    product = await category_crud.update_product_with_images(
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

    # Формируем ответ с главным изображением
    main_image = None
    if product.images:
        main_image = product.images[0].url

    logger.bind(user_id=current_user.id).info(
        f'Продукт обновлен: product_id={product_id}, '
        f'category_id={category_id}, name={product.name}'
    )

    return ProductListResponse(
        id=product.id,
        name=product.name,
        part_number=product.part_number,
        description=product.description,
        price=product.price,
        is_active=product.is_active,
        category_id=product.category_id,
        brand_id=product.brand_id,
        main_image=main_image,
        category=product.category,
        brand=product.brand
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
    logger.bind(user_id=current_user.id).info(
        f'Попытка удаления продукта: category_id={category_id}, '
        f'product_id={product_id}'
    )

    # Комплексная проверка существования категории, продукта и их связи
    await validate_category_and_product_relationship(
        category_id, product_id, session
    )

    # Получаем продукт для удаления с загруженными связанными данными
    db_product = await product_crud.get_with_relations(
        product_id=product_id,
        session=session
    )

    result = await product_crud.soft_delete(
        db_obj=db_product,
        session=session
    )

    logger.bind(user_id=current_user.id).info(
        f'Продукт удален (мягкое): product_id={product_id}, '
        f'category_id={category_id}, name={db_product.name}'
    )
    return result


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
    logger.bind(user_id=current_user.id).info(
        f'Попытка восстановления продукта: category_id={category_id}, '
        f'product_id={product_id}'
    )

    # Комплексная проверка существования категории, продукта и их связи
    await validate_category_and_product_relationship(
        category_id, product_id, session
    )

    # Получаем продукт для восстановления с загруженными связанными данными
    db_product = await product_crud.get_with_relations(
        product_id=product_id,
        session=session
    )

    result = await product_crud.restore(
        db_obj=db_product,
        session=session
    )

    logger.bind(user_id=current_user.id).info(
        f'Продукт восстановлен: product_id={product_id}, '
        f'category_id={category_id}, name={db_product.name}'
    )
    return result
