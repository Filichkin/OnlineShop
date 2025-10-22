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
    response_model=List[ProductListResponse],
    summary='Получить список продуктов',
    description='Получить список всех активных продуктов с фильтрацией'
)
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = Query(
        None, description='Фильтр по категории'
    ),
    search: Optional[str] = Query(
        None, description='Поиск по названию'
    ),
    min_price: Optional[float] = Query(
        None, description='Минимальная цена'
    ),
    max_price: Optional[float] = Query(
        None, description='Максимальная цена'
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """Получить список активных продуктов с фильтрацией"""
    if category_id:
        products = await product_crud.get_by_category(
            category_id=category_id,
            session=session,
            skip=skip,
            limit=limit
        )
    elif search:
        products = await product_crud.search_by_name(
            name_pattern=search,
            session=session,
            skip=skip,
            limit=limit
        )
    elif min_price is not None and max_price is not None:
        products = await product_crud.get_by_price_range(
            min_price=min_price,
            max_price=max_price,
            session=session,
            skip=skip,
            limit=limit
        )
    else:
        products = await product_crud.get_multi_active(
            session=session,
            skip=skip,
            limit=limit
        )

    # Преобразуем в ProductListResponse с главным изображением
    return [
        ProductListResponse.from_orm_with_main_image(p) for p in products
    ]


@router.get(
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Получить продукт по ID',
    description='Получить детальную информацию о продукте'
)
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить продукт по ID"""
    db_product = await product_crud.get_active(
        product_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )
    return db_product


@router.post(
    '/',
    response_model=ProductResponse,
    summary='Создать продукт',
    description='Создать новый продукт с изображениями'
)
async def create_product(
    name: str = Form(..., description='Название продукта'),
    price: float = Form(..., description='Цена продукта'),
    category_id: int = Form(..., description='ID категории'),
    description: str = Form(None, description='Описание продукта'),
    images: List[UploadFile] = File(..., description='Изображения продукта'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новый продукт"""
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
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Обновить продукт',
    description='Обновить информацию о продукте'
)
async def update_product(
    product_id: int,
    name: str = Form(None, description='Название продукта'),
    price: float = Form(None, description='Цена продукта'),
    category_id: int = Form(None, description='ID категории'),
    description: str = Form(None, description='Описание продукта'),
    images: List[UploadFile] = File(None, description='Новые изображения'),
    is_active: bool = Form(None, description='Активность продукта'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить продукт"""
    db_product = await product_crud.get(
        obj_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    # Проверяем категорию, если она изменяется
    if category_id and category_id != db_product.category_id:
        db_category = await category_crud.get_active(
            category_id=category_id,
            session=session
        )
        if not db_category:
            raise HTTPException(
                status_code=400,
                detail='Категория не найдена или неактивна'
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
    if category_id is not None:
        update_data.category_id = category_id
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

        _image_urls = await save_images(  # noqa: F841
            files=images,
            directory=Constants.PRODUCTS_DIR,
            prefix='product'
        )
        # TODO: Обновить Media записи для продукта
        # _image_urls содержит список URL новых изображений

    # Применяем обновления
    if update_data.model_dump(exclude_unset=True):
        db_product = await product_crud.update(
            db_obj=db_product,
            obj_in=update_data,
            session=session
        )

    return db_product


@router.delete(
    '/{product_id}',
    response_model=ProductDetailResponse,
    summary='Удалить продукт',
    description='Мягкое удаление продукта (установка is_active=False)'
)
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Мягкое удаление продукта"""
    db_product = await product_crud.get(
        obj_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    return await product_crud.soft_delete(
        db_obj=db_product,
        session=session
    )


@router.patch(
    '/{product_id}/restore',
    response_model=ProductDetailResponse,
    summary='Восстановить продукт',
    description='Восстановить удаленный продукт'
)
async def restore_product(
    product_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Восстановить продукт"""
    db_product = await product_crud.get(
        obj_id=product_id,
        session=session
    )
    if not db_product:
        raise HTTPException(
            status_code=404,
            detail='Продукт не найден'
        )

    return await product_crud.restore(
        db_obj=db_product,
        session=session
    )
