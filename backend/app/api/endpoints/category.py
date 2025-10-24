from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Constants
from app.core.db import get_async_session
from app.core.storage import save_images
from app.core.user import current_superuser
from app.crud.category import category_crud
from app.crud.product import product_crud
from app.models.media import Media, MediaType
from app.models.product import Product
from app.models.user import User
from app.schemas.category import (
    CategoryDetailResponse,
    CategoryResponse
)
from app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductListResponse,
    ProductResponse,
    ProductUpdate
)

router = APIRouter()


@router.get(
    '/',
    response_model=List[CategoryResponse],
    summary='Получить список категорий',
    description='Получить список всех активных категорий'
)
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить список активных категорий"""
    return await category_crud.get_multi_active(
        session=session,
        skip=skip,
        limit=limit
    )


@router.get(
    '/{category_id}',
    response_model=CategoryDetailResponse,
    summary='Получить категорию по ID',
    description='Получить детальную информацию о категории'
)
async def get_category(
    category_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить категорию по ID"""
    db_category = await category_crud.get_with_image(
        category_id=category_id,
        session=session
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )
    if not db_category.is_active:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )
    return db_category


@router.post(
    '/',
    response_model=CategoryResponse,
    summary='Создать категорию',
    description='Создать новую категорию с изображением'
)
async def create_category(
    name: str = Form(..., description='Название категории'),
    description: str = Form(None, description='Описание категории'),
    image: UploadFile = File(..., description='Изображение категории'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новую категорию"""
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
async def update_category(
    category_id: int,
    name: str = Form(None, description='Название категории'),
    description: str = Form(None, description='Описание категории'),
    image: UploadFile = File(None, description='Новое изображение'),
    is_active: bool = Form(None, description='Активность категории'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить категорию"""
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
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
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
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
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
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукты категории"""
    # Проверяем существование категории
    category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
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
            category=category
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
    # Проверяем существование категории
    category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )

    # Получаем продукт
    product = await product_crud.get_active(
        product_id=product_id,
        session=session
    )
    if not product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    # Проверяем, что продукт принадлежит категории
    if product.category_id != category_id:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден в данной категории'
        )

    return product


@router.post(
    '/{category_id}/products/',
    response_model=ProductResponse,
    summary='Создать продукт в категории',
    description='Создать новый продукт в указанной категории'
)
async def create_category_product(
    category_id: int,
    name: str = Form(..., description='Название продукта'),
    price: float = Form(..., description='Цена продукта'),
    description: str = Form(None, description='Описание продукта'),
    images: List[UploadFile] = File(
        ...,
        description='Изображения продукта (можно выбрать несколько)'
        ),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новый продукт в категории"""
    # Проверяем, что категория существует и активна
    db_category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not db_category:
        raise HTTPException(
            status_code=400,
            detail='Категория не найдена или неактивна'
        )

    # Проверяем, что продукт с таким именем не существует
    existing_product = await product_crud.get_by_name(
        name=name,
        session=session
    )
    if existing_product:
        raise HTTPException(
            status_code=400,
            detail='Продукт с таким именем уже существует'
        )

    # Валидируем количество изображений
    if len(images) < 1:
        raise HTTPException(
            status_code=400,
            detail='Необходимо загрузить минимум одно изображение'
        )

    # Сохраняем изображения
    image_urls = await save_images(
        files=images,
        directory=Constants.PRODUCTS_DIR,
        prefix='product'
    )

    # Создаем продукт
    product_data = ProductCreate(
        name=name,
        price=price,
        category_id=category_id,
        description=description,
        is_active=True
    )

    # Добавляем данные продукта вручную
    product_dict = product_data.model_dump()

    # Создаем объект продукта
    db_product = Product(**product_dict)
    session.add(db_product)
    await session.commit()
    await session.refresh(db_product)

    # Создаем записи Media для изображений
    for idx, image_url in enumerate(image_urls):
        media_obj = Media(
            url=image_url,
            media_type=MediaType.PRODUCT,
            order=idx,
            is_main=(idx == 0),  # Первое изображение - главное
            product_id=db_product.id
        )
        session.add(media_obj)

    await session.commit()
    await session.refresh(db_product)

    return db_product


@router.patch(
    '/{category_id}/products/{product_id}',
    response_model=ProductDetailResponse,
    summary='Обновить продукт в категории',
    description='Обновить информацию о продукте в категории'
)
async def update_category_product(
    category_id: int,
    product_id: int,
    name: str = Form(None, description='Название продукта'),
    price: float = Form(None, description='Цена продукта'),
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
    # Проверяем существование категории
    category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )

    # Получаем продукт
    db_product = await product_crud.get(
        obj_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    # Проверяем, что продукт принадлежит категории
    if db_product.category_id != category_id:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден в данной категории'
        )

    # Проверяем уникальность имени, если оно изменяется
    if name and name != db_product.name:
        existing_product = await product_crud.get_by_name(
            name=name,
            session=session
        )
        if existing_product:
            raise HTTPException(
                status_code=400,
                detail='Продукт с таким именем уже существует'
            )

    # Обновляем данные
    update_data = ProductUpdate()
    if name is not None:
        update_data.name = name
    if price is not None:
        update_data.price = price
    if description is not None:
        update_data.description = description
    if is_active is not None:
        update_data.is_active = is_active

    # Обновляем изображения, если загружены новые
    if images:
        if len(images) < 1:
            raise HTTPException(
                status_code=400,
                detail='Необходимо загрузить минимум одно изображение'
            )

        image_urls = await save_images(
            files=images,
            directory=Constants.PRODUCTS_DIR,
            prefix='product'
        )

        # Удаляем старые изображения продукта
        await session.execute(
            delete(Media)
            .where(Media.product_id == db_product.id)
        )

        # Создаем новые записи Media для изображений
        for idx, image_url in enumerate(image_urls):
            media_obj = Media(
                url=image_url,
                media_type=MediaType.PRODUCT,
                order=idx,
                is_main=(idx == 0),  # Первое изображение - главное
                product_id=db_product.id
            )
            session.add(media_obj)

    # Применяем обновления
    if update_data.model_dump(exclude_unset=True):
        db_product = await product_crud.update(
            db_obj=db_product,
            obj_in=update_data,
            session=session
        )

    return db_product


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
    # Проверяем существование категории
    category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )

    # Получаем продукт
    db_product = await product_crud.get(
        obj_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    # Проверяем, что продукт принадлежит категории
    if db_product.category_id != category_id:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден в данной категории'
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
    # Проверяем существование категории
    category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )

    # Получаем продукт
    db_product = await product_crud.get(
        obj_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    # Проверяем, что продукт принадлежит категории
    if db_product.category_id != category_id:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден в данной категории'
        )

    return await product_crud.restore(
        db_obj=db_product,
        session=session
    )
