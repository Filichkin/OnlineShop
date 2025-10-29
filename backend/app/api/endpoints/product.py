from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
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
            category=categories_dict.get(p.category_id),
            brand=brands_dict.get(p.brand_id)
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
    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    images = await media_crud.get_product_images(
        product_id=product_id,
        session=session
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
    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )

    # Проверяем количество изображений
    if not images:
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
        image_urls = await save_images(
            images,
            Constants.PRODUCTS_DIR,
            f'product_{product_id}'
        )
    except Exception as e:
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
        return saved_images
    except Exception as e:
        # Если не удалось сохранить в БД, удаляем файлы
        await delete_image_files(image_urls)
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
    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
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
        return updated_image
    except ValueError as e:
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
    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
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

        return DeleteImagesResponse(
            deleted_count=deleted_count,
            message=f'Удалено изображений: {deleted_count}'
        )
    except ValueError as e:
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
    # Проверяем существование продукта
    db_product = await product_crud.get_with_status(
        product_id=product_id,
        session=session,
        is_active=None
    )
    if not db_product:
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
        return updated_images
    except ValueError as e:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
