from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.validators import (
    validate_brand_creation,
    validate_brand_exists,
    validate_brand_update
)
from app.core.constants import Constants
from app.core.db import get_async_session
from app.core.limiter import limiter
from app.core.storage import save_image, delete_image_file
from app.core.user import current_superuser
from app.crud.brand import brand_crud
from app.models.user import User
from app.schemas.brand import (
    BrandCreate,
    BrandResponse,
    BrandUpdate
)


router = APIRouter()


@router.get(
    '/',
    response_model=List[BrandResponse],
    summary='Получить список брендов',
    description='Получить список брендов с фильтрацией'
)
async def get_brands(
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
    """Получить список брендов с фильтрацией"""
    return await brand_crud.get_multi(
        session=session,
        skip=skip,
        limit=limit,
        is_active=is_active
    )


@router.get(
    '/{brand_id}',
    response_model=BrandResponse,
    summary='Получить бренд по ID',
    description='Получить информацию о бренде'
)
async def get_brand(
    brand_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Получить бренд по ID"""
    # Проверяем существование бренда
    await validate_brand_exists(brand_id, session)

    # Получаем бренд
    db_brand = await brand_crud.get(
        obj_id=brand_id,
        session=session
    )
    return db_brand


@router.post(
    '/',
    response_model=BrandResponse,
    summary='Создать бренд',
    description='Создать новый бренд'
)
@limiter.limit(Constants.RATE_LIMIT_BRAND_CREATE)
async def create_brand(
    request: Request,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    is_active: str = Form('true'),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Создать новый бренд"""
    # Валидируем создание бренда
    await validate_brand_creation(name, session)

    # Конвертируем is_active из строки в boolean
    is_active_bool = is_active.lower() in ('true', '1', 'yes')

    # Обрабатываем пустые строки как None
    description_value = (
        description if description and description.strip() else None
    )

    # Сохраняем изображение если файл загружен
    image_url = None
    if image and image.filename:
        image_url = await save_image(
            file=image,
            directory=Constants.BRANDS_DIR,
            prefix='brand'
        )

    # Создаем объект BrandCreate из данных формы
    brand_in = BrandCreate(
        name=name,
        description=description_value,
        image=image_url,
        is_active=is_active_bool
    )

    return await brand_crud.create(
        obj_in=brand_in,
        session=session
    )


@router.patch(
    '/{brand_id}',
    response_model=BrandResponse,
    summary='Обновить бренд',
    description='Обновить информацию о бренде'
)
@limiter.limit(Constants.RATE_LIMIT_BRAND_UPDATE)
async def update_brand(
    request: Request,
    brand_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    is_active: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Обновить бренд"""
    # Валидируем обновление бренда
    if name is not None:
        await validate_brand_update(brand_id, name, session)

    # Получаем бренд для обновления
    db_brand = await brand_crud.get(
        obj_id=brand_id,
        session=session
    )

    # Конвертируем is_active из строки в boolean если передан
    is_active_bool = None
    if is_active is not None:
        is_active_bool = is_active.lower() in ('true', '1', 'yes')

    # Обрабатываем пустые строки как None
    description_value = (
        description if description and description.strip() else None
    )

    # Сохраняем новое изображение если файл загружен
    image_url = None
    if image and image.filename:
        # Удаляем старое изображение если оно есть
        if db_brand.image:
            await delete_image_file(db_brand.image)

        # Сохраняем новое изображение
        image_url = await save_image(
            file=image,
            directory=Constants.BRANDS_DIR,
            prefix='brand'
        )

    # Создаем объект BrandUpdate из данных формы
    brand_in = BrandUpdate(
        name=name,
        description=description_value,
        image=image_url,
        is_active=is_active_bool
    )

    return await brand_crud.update(
        db_obj=db_brand,
        obj_in=brand_in,
        session=session
    )


@router.delete(
    '/{brand_id}',
    response_model=BrandResponse,
    summary='Удалить бренд',
    description='Мягкое удаление бренда (установка is_active=False)'
)
async def delete_brand(
    brand_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Мягкое удаление бренда"""
    # Проверяем существование бренда (не требуем активности для удаления)
    await validate_brand_exists(brand_id, session, must_be_active=False)

    # Получаем бренд для удаления
    db_brand = await brand_crud.get(
        obj_id=brand_id,
        session=session
    )

    return await brand_crud.soft_delete(
        db_obj=db_brand,
        session=session
    )


@router.patch(
    '/{brand_id}/restore',
    response_model=BrandResponse,
    summary='Восстановить бренд',
    description='Восстановить удаленный бренд'
)
async def restore_brand(
    brand_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_superuser)
):
    """Восстановить бренд"""
    # Проверяем существование бренда (не требуем активности для восстановления)
    await validate_brand_exists(brand_id, session, must_be_active=False)

    # Получаем бренд для восстановления
    db_brand = await brand_crud.get(
        obj_id=brand_id,
        session=session
    )

    return await brand_crud.restore(
        db_obj=db_brand,
        session=session
    )
