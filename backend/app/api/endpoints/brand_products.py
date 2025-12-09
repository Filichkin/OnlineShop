"""
Эндпоинты для управления продуктами в рамках конкретного бренда.

Маршруты: /brands/{brand_slug}/products/*
"""

from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile
)
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.validators import (
    validate_brand_slug_exists,
    validate_product_belongs_to_brand,
    validate_product_creation_for_brand,
    validate_product_update_for_brand,
)
from app.core.constants import Constants
from app.core.db import get_async_session
from app.core.user import current_superuser
from app.core.storage import save_images, delete_image_files
from app.crud.brand import brand_crud
from app.crud.media import media_crud
from app.crud.product import product_crud
from app.models.media import Media, MediaType
from app.models.user import User
from app.schemas.product import (
    ProductDetailResponse,
    ProductListResponse,
)


router = APIRouter()


@router.get(
    '/',
    response_model=List[ProductListResponse],
    summary='Получить все продукты бренда',
    description='Получить список продуктов для конкретного бренда'
)
async def get_brand_products(
    brand_slug: str,
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
        description=(
            'Фильтр по статусу активности '
            '(по умолчанию только активные)'
            )
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
    """Получить все продукты бренда с фильтрацией и сортировкой"""
    logger.debug(
        f'Запрос продуктов бренда: brand_slug={brand_slug}, '
        f'skip={skip}, limit={limit}, is_active={is_active}, '
        f'sort_by={sort_by}, sort_order={sort_order}'
    )

    # Проверяем существование бренда
    await validate_brand_slug_exists(brand_slug, session, must_be_active=True)

    # Получаем продукты
    products = await product_crud.get_multi_by_brand_slug(
        brand_slug=brand_slug,
        session=session,
        skip=skip,
        limit=limit,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order
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

    # Получаем бренд для всех продуктов
    brand = await brand_crud.get_by_slug(slug=brand_slug, session=session)

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
            brand=brand
        ) for p in products
    ]

    logger.info(
        f'Возвращено продуктов для бренда {brand_slug}: {len(result)}'
    )
    return result


@router.get(
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Получить продукт бренда по ID',
    description='Получить детальную информацию о продукте бренда'
)
async def get_brand_product(
    brand_slug: str,
    product_id: int,
    is_active: Optional[bool] = Query(
        True,
        description='Фильтр по статусу активности'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукт бренда по ID"""
    logger.debug(
        f'Запрос продукта бренда: brand_slug={brand_slug}, '
        f'product_id={product_id}, is_active={is_active}'
    )

    # Проверяем существование бренда
    await validate_brand_slug_exists(brand_slug, session, must_be_active=True)

    # Получаем продукт
    db_product = await product_crud.get_by_brand_slug(
        brand_slug=brand_slug,
        product_id=product_id,
        session=session,
        is_active=is_active
    )

    if not db_product:
        logger.warning(
            f'Продукт не найден: brand_slug={brand_slug}, '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail=f'Продукт не найден для бренда "{brand_slug}"'
        )

    logger.info(
        f'Продукт получен: brand_slug={brand_slug}, '
        f'product_id={product_id}, name={db_product.name}'
    )
    return db_product


@router.post(
    '/',
    response_model=ProductDetailResponse,
    summary='Создать продукт для бренда',
    description=(
        'Создать новый продукт для конкретного бренда (только для админов)'
    )
)
async def create_brand_product(
    brand_slug: str,
    name: str = Form(..., description='Название продукта'),
    part_number: str = Form(..., description='Артикул продукта'),
    price: float = Form(..., gt=0, description='Цена'),
    description: Optional[str] = Form(None, description='Описание'),
    is_active: bool = Form(True, description='Активность продукта'),
    images: List[UploadFile] = File(..., description='Изображения продукта'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новый продукт для бренда (только для админов)"""
    logger.info(
        f'Создание продукта для бренда: brand_slug={brand_slug}, '
        f'name={name}, user_id={current_user.id}'
    )

    # Валидация
    await validate_product_creation_for_brand(
        name=name,
        brand_slug=brand_slug,
        images=images,
        session=session
    )

    # Получаем бренд
    brand = await brand_crud.get_by_slug(slug=brand_slug, session=session)

    # Сохраняем изображения на диск
    try:
        logger.debug('Сохранение файлов изображений на диск')
        image_urls = await save_images(
            images,
            Constants.PRODUCTS_DIR,
            f'product_{name}'
        )
        logger.debug(f'Файлы сохранены: count={len(image_urls)}')
    except Exception as e:
        logger.error(
            f'Ошибка сохранения файлов изображений: '
            f'brand_slug={brand_slug}, error={str(e)}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Ошибка сохранения изображений: {str(e)}'
        )

    # Создаем продукт
    try:
        product_data = {
            'name': name,
            'part_number': part_number,
            'price': price,
            'description': description,
            'is_active': is_active,
        }

        db_product = await product_crud.create_for_brand(
            brand_id=brand.id,
            obj_in=product_data,
            session=session
        )

        # Создаем записи медиа в БД
        media_objects = []
        for idx, url in enumerate(image_urls):
            media_obj = Media(
                url=url,
                media_type=MediaType.PRODUCT,
                order=idx,
                is_main=(idx == 0),  # Первое изображение - главное
                product_id=db_product.id
            )
            media_objects.append(media_obj)

        # Сохраняем изображения в БД
        saved_images = await media_crud.add_images(media_objects, session)

        # Обновляем продукт с изображениями
        await session.refresh(db_product)

        logger.info(
            f'Продукт создан: brand_slug={brand_slug}, '
            f'product_id={db_product.id}, images_count={len(saved_images)}'
        )

        return db_product

    except Exception as e:
        # Если не удалось создать продукт, удаляем файлы
        logger.error(
            f'Ошибка создания продукта: '
            f'brand_slug={brand_slug}, error={str(e)}'
        )
        await delete_image_files(image_urls)
        logger.debug('Файлы изображений удалены после ошибки')
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Ошибка создания продукта: {str(e)}'
        )


@router.patch(
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Обновить продукт бренда',
    description='Обновить данные продукта бренда (только для админов)'
)
async def update_brand_product(
    brand_slug: str,
    product_id: int,
    name: Optional[str] = Form(None, description='Название продукта'),
    part_number: Optional[str] = Form(None, description='Артикул продукта'),
    price: Optional[float] = Form(None, gt=0, description='Цена'),
    description: Optional[str] = Form(None, description='Описание'),
    is_active: Optional[bool] = Form(None, description='Активность продукта'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить продукт бренда (только для админов)"""
    logger.info(
        f'Обновление продукта бренда: brand_slug={brand_slug}, '
        f'product_id={product_id}, user_id={current_user.id}'
    )

    # Валидация
    await validate_product_update_for_brand(
        product_id=product_id,
        brand_slug=brand_slug,
        name=name,
        images=None,
        session=session
    )

    # Получаем продукт
    db_product = await product_crud.get_by_brand_slug(
        brand_slug=brand_slug,
        product_id=product_id,
        session=session,
        is_active=None
    )

    # Обновляем только переданные поля
    update_data = {}
    if name is not None:
        update_data['name'] = name
    if part_number is not None:
        update_data['part_number'] = part_number
    if price is not None:
        update_data['price'] = price
    if description is not None:
        update_data['description'] = description
    if is_active is not None:
        update_data['is_active'] = is_active

    if not update_data:
        logger.warning(
            f'Нет данных для обновления: brand_slug={brand_slug}, '
            f'product_id={product_id}'
        )
        return db_product

    # Обновляем продукт
    for field, value in update_data.items():
        setattr(db_product, field, value)

    session.add(db_product)
    await session.commit()
    await session.refresh(db_product)

    logger.info(
        f'Продукт обновлен: brand_slug={brand_slug}, '
        f'product_id={product_id}, fields={list(update_data.keys())}'
    )

    return db_product


@router.delete(
    '/{product_id}',
    response_model=dict,
    summary='Мягкое удаление продукта бренда',
    description='Установить is_active=False для продукта (только для админов)'
)
async def soft_delete_brand_product(
    brand_slug: str,
    product_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Мягкое удаление продукта бренда (только для админов)"""
    logger.info(
        f'Мягкое удаление продукта: brand_slug={brand_slug}, '
        f'product_id={product_id}, user_id={current_user.id}'
    )

    # Проверяем, что продукт принадлежит бренду
    await validate_product_belongs_to_brand(
        product_id=product_id,
        brand_slug=brand_slug,
        session=session
    )

    # Получаем продукт
    db_product = await product_crud.get_by_brand_slug(
        brand_slug=brand_slug,
        product_id=product_id,
        session=session,
        is_active=None
    )

    if not db_product.is_active:
        logger.warning(
            f'Продукт уже удален: brand_slug={brand_slug}, '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Продукт уже удален'
        )

    # Мягкое удаление
    await product_crud.soft_delete(db_product, session)

    logger.info(
        f'Продукт удален: brand_slug={brand_slug}, product_id={product_id}'
    )

    return {
        'message': f'Продукт {product_id} успешно удален',
        'product_id': product_id
    }


@router.patch(
    '/{product_id}/restore',
    response_model=ProductDetailResponse,
    summary='Восстановить продукт бренда',
    description='Установить is_active=True для продукта (только для админов)'
)
async def restore_brand_product(
    brand_slug: str,
    product_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Восстановить удаленный продукт бренда (только для админов)"""
    logger.info(
        f'Восстановление продукта: brand_slug={brand_slug}, '
        f'product_id={product_id}, user_id={current_user.id}'
    )

    # Проверяем, что продукт принадлежит бренду
    await validate_product_belongs_to_brand(
        product_id=product_id,
        brand_slug=brand_slug,
        session=session
    )

    # Получаем продукт
    db_product = await product_crud.get_by_brand_slug(
        brand_slug=brand_slug,
        product_id=product_id,
        session=session,
        is_active=None
    )

    if db_product.is_active:
        logger.warning(
            f'Продукт уже активен: brand_slug={brand_slug}, '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Продукт уже активен'
        )

    # Восстановление
    await product_crud.restore(db_product, session)

    logger.info(
        f'Продукт восстановлен: brand_slug={brand_slug}, '
        f'product_id={product_id}'
    )

    return db_product
