from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.core.db import get_async_session
from app.core.storage import save_images, delete_image_files
from app.crud.media import media_crud
from app.crud.product import product_crud
from app.models.brand import Brand
from app.models.media import Media, MediaType
from app.models.product import Category
from app.schemas.media import (
    DeleteImagesRequest,
    DeleteImagesResponse,
    MediaResponse,
    ReorderImagesRequest,
    SetMainImageRequest,
)
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
        None, description='Фильтр по статусу активности (None = все продукты)'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить список продуктов с фильтрацией"""
    logger.debug(
        f'Запрос списка продуктов: category_id={category_id}, '
        f'search={search}, min_price={min_price}, max_price={max_price}, '
        f'skip={skip}, limit={limit}, is_active={is_active}'
    )

    # Validate price range if both are provided
    if min_price is not None and max_price is not None:
        if min_price > max_price:
            logger.warning(
                f'Неверный диапазон цен: min_price={min_price} > '
                f'max_price={max_price}'
            )
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='min_price cannot be greater than max_price'
            )

    if category_id:
        logger.debug(f'Загрузка продуктов для категории: {category_id}')
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
            logger.warning('Пустая строка поиска отклонена')
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='Search string cannot be empty or whitespace only'
            )

        logger.debug(f'Поиск продуктов по запросу: "{search}"')
        products = await product_crud.search_by_name(
            name_pattern=search,
            session=session,
            skip=skip,
            limit=limit,
            is_active=is_active
        )
    elif min_price is not None and max_price is not None:
        logger.debug(
            f'Поиск продуктов в диапазоне цен: '
            f'{min_price}-{max_price}'
        )
        products = await product_crud.get_by_price_range(
            min_price=min_price,
            max_price=max_price,
            session=session,
            skip=skip,
            limit=limit,
            is_active=is_active
        )
    else:
        logger.debug('Загрузка всех продуктов')
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

    # Загружаем бренды для всех продуктов одним запросом
    # Фильтруем None значения для продуктов без бренда
    brand_ids = list(set(
        p.brand_id for p in products if p.brand_id is not None
    ))
    brands_dict = {}
    if brand_ids:
        brands = await session.execute(
            select(Brand)
            .where(Brand.id.in_(brand_ids))
        )
        brands_dict = {
            brand.id: brand for brand in brands.scalars().all()
        }

    # Преобразуем в ProductListResponse с главным изображением
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
            category=categories_dict.get(p.category_id),
            brand=brands_dict.get(p.brand_id)
        ) for p in products
    ]
    logger.info(f'Возвращено продуктов: {len(result)}')
    return result


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
    logger.debug(
        f'Запрос продукта: product_id={product_id}, '
        f'is_active={is_active}'
    )

    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=is_active
    )
    if not db_product:
        logger.warning(f'Продукт не найден: product_id={product_id}')
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    logger.info(
        f'Продукт получен: id={db_product.id}, '
        f'name={db_product.name}'
    )
    return db_product


# ==================== Image Management Endpoints ====================


@router.get(
    '/{product_id}/images',
    response_model=List[MediaResponse],
    summary='Получить все изображения продукта',
    description='Получить список всех изображений продукта'
)
async def get_product_images(
    product_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить все изображения продукта"""
    logger.debug(f'Запрос изображений продукта: product_id={product_id}')

    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        logger.warning(
            f'Продукт не найден при запросе изображений: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    images = await media_crud.get_product_images(
        product_id=product_id,
        session=session
    )
    logger.info(
        f'Получено изображений продукта: product_id={product_id}, '
        f'count={len(images)}'
    )
    return images


@router.post(
    '/{product_id}/images',
    response_model=List[MediaResponse],
    summary='Добавить изображения к продукту',
    description='Добавить одно или несколько изображений к продукту'
)
async def add_product_images(
    product_id: int,
    images: List[UploadFile] = File(
        ...,
        description='Изображения для добавления'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Добавить изображения к продукту"""
    logger.info(
        f'Начало загрузки изображений: product_id={product_id}, '
        f'count={len(images)}'
    )

    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        logger.warning(
            f'Продукт не найден при добавлении изображений: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    # Проверяем количество изображений
    if not images:
        logger.warning(
            f'Попытка загрузки пустого списка изображений: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Необходимо загрузить хотя бы одно изображение'
        )

    # Получаем текущие изображения для определения порядка
    current_images = await media_crud.get_product_images(
        product_id=product_id,
        session=session
    )
    next_order = len(current_images)

    # Сохраняем изображения на диск
    try:
        logger.debug('Сохранение файлов изображений на диск')
        image_urls = await save_images(
            images,
            Constants.PRODUCTS_DIR,
            f'product_{product_id}'
        )
        logger.debug(f'Файлы сохранены: count={len(image_urls)}')
    except Exception as e:
        logger.error(
            f'Ошибка сохранения файлов изображений: '
            f'product_id={product_id}, error={str(e)}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Ошибка сохранения изображений: {str(e)}'
        )

    # Создаем записи в БД
    media_objects = []
    for idx, url in enumerate(image_urls):
        media_obj = Media(
            url=url,
            media_type=MediaType.PRODUCT,
            order=next_order + idx,
            is_main=False,  # Новые изображения не главные по умолчанию
            product_id=product_id
        )
        media_objects.append(media_obj)

    # Сохраняем в БД
    try:
        saved_images = await media_crud.add_images(
            media_objects,
            session
        )
        logger.info(
            f'Изображения добавлены к продукту: product_id={product_id}, '
            f'count={len(saved_images)}'
        )
        return saved_images
    except Exception as e:
        # Если не удалось сохранить в БД, удаляем файлы
        logger.error(
            f'Ошибка сохранения изображений в БД: '
            f'product_id={product_id}, error={str(e)}'
        )
        await delete_image_files(image_urls)
        logger.debug('Файлы изображений удалены после ошибки БД')
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail=f'Ошибка сохранения в базу данных: {str(e)}'
        )


@router.put(
    '/{product_id}/images/main',
    response_model=MediaResponse,
    summary='Установить главное изображение',
    description='Установить указанное изображение как главное для продукта'
)
async def set_main_product_image(
    product_id: int,
    request: SetMainImageRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Установить главное изображение продукта"""
    logger.info(
        f'Установка главного изображения: product_id={product_id}, '
        f'media_id={request.media_id}'
    )

    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        logger.warning(
            f'Продукт не найден при установке главного изображения: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    try:
        updated_image = await media_crud.set_main_image(
            media_id=request.media_id,
            product_id=product_id,
            session=session
        )
        logger.info(
            f'Главное изображение установлено: product_id={product_id}, '
            f'media_id={request.media_id}'
        )
        return updated_image
    except ValueError as e:
        logger.warning(
            f'Ошибка установки главного изображения: '
            f'product_id={product_id}, media_id={request.media_id}, '
            f'error={str(e)}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete(
    '/{product_id}/images',
    response_model=DeleteImagesResponse,
    summary='Удалить изображения продукта',
    description='Удалить одно или несколько изображений продукта'
)
async def delete_product_images(
    product_id: int,
    request: DeleteImagesRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Удалить изображения продукта"""
    logger.info(
        f'Удаление изображений продукта: product_id={product_id}, '
        f'media_ids={request.media_ids}'
    )

    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        logger.warning(
            f'Продукт не найден при удалении изображений: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    # Проверяем, что не удаляем все изображения
    all_images = await media_crud.get_product_images(
        product_id=product_id,
        session=session
    )

    if len(all_images) == len(request.media_ids):
        logger.warning(
            f'Попытка удалить все изображения продукта: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Нельзя удалить все изображения продукта'
        )

    # Получаем изображения для удаления
    images_to_delete = [
        img for img in all_images
        if img.id in request.media_ids
    ]

    if not images_to_delete:
        logger.warning(
            f'Изображения для удаления не найдены: '
            f'product_id={product_id}, media_ids={request.media_ids}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Изображения не найдены'
        )

    # Удаляем из БД
    try:
        deleted_count = await media_crud.delete_images(
            media_ids=request.media_ids,
            product_id=product_id,
            session=session
        )

        # Удаляем файлы с диска
        image_urls = [img.url for img in images_to_delete]
        await delete_image_files(image_urls)

        logger.info(
            f'Изображения удалены: product_id={product_id}, '
            f'count={deleted_count}'
        )
        return DeleteImagesResponse(
            deleted_count=deleted_count,
            message=f'Удалено изображений: {deleted_count}'
        )
    except ValueError as e:
        logger.error(
            f'Ошибка удаления изображений: product_id={product_id}, '
            f'error={str(e)}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    '/{product_id}/images/reorder',
    response_model=List[MediaResponse],
    summary='Изменить порядок изображений',
    description='Изменить порядок отображения изображений продукта'
)
async def reorder_product_images(
    product_id: int,
    request: ReorderImagesRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """Изменить порядок изображений продукта"""
    logger.info(
        f'Изменение порядка изображений: product_id={product_id}, '
        f'updates_count={len(request.order_updates)}'
    )

    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        logger.warning(
            f'Продукт не найден при изменении порядка изображений: '
            f'product_id={product_id}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    # Преобразуем запрос в список кортежей
    order_updates = [
        (update.media_id, update.order)
        for update in request.order_updates
    ]

    try:
        updated_images = await media_crud.reorder_images(
            order_updates=order_updates,
            product_id=product_id,
            session=session
        )
        logger.info(
            f'Порядок изображений изменен: product_id={product_id}, '
            f'count={len(updated_images)}'
        )
        return updated_images
    except ValueError as e:
        logger.warning(
            f'Ошибка изменения порядка изображений: '
            f'product_id={product_id}, error={str(e)}'
        )
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
