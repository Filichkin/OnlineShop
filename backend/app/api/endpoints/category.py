from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Constants
from app.core.db import get_async_session
from app.core.storage import save_image
from app.core.user import current_superuser
from app.crud.category import category_crud
from app.models.product import Category
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryDetailResponse,
    CategoryResponse,
    CategoryUpdate
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
    db_category = await category_crud.get_active(
        category_id=category_id,
        session=session
    )
    if not db_category:
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
    # Проверяем, что категория с таким именем не существует
    existing_category = await category_crud.get_by_name(
        name=name,
        session=session
    )
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail='Категория с таким именем уже существует'
        )

    # Сохраняем изображение ПЕРЕД созданием категории
    image_url = await save_image(
        file=image,
        directory=Constants.CATEGORIES_DIR,
        prefix='category'
    )

    # Создаем категорию с уже готовым image_url
    category_data = CategoryCreate(
        name=name,
        description=description,
        is_active=True
    )

    # Добавляем image_url вручную в данные категории
    category_dict = category_data.model_dump()
    category_dict['image_url'] = image_url

    # Создаем объект категории с image_url
    db_category = Category(**category_dict)
    session.add(db_category)
    await session.commit()
    await session.refresh(db_category)

    return db_category


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
    db_category = await category_crud.get(
        obj_id=category_id,
        session=session
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail='Категория не найдена'
        )

    # Проверяем уникальность имени, если оно изменяется
    if name and name != db_category.name:
        existing_category = await category_crud.get_by_name(
            name=name,
            session=session
        )
        if existing_category:
            raise HTTPException(
                status_code=400,
                detail='Категория с таким именем уже существует'
            )

    # Обновляем данные
    update_data = CategoryUpdate()
    if name is not None:
        update_data.name = name
    if description is not None:
        update_data.description = description
    if is_active is not None:
        update_data.is_active = is_active

    # Обновляем изображение, если загружено новое
    if image:
        image_url = await save_image(
            file=image,
            directory=Constants.CATEGORIES_DIR,
            prefix='category'
        )
        db_category.image_url = image_url

    # Применяем обновления
    if update_data.model_dump(exclude_unset=True):
        db_category = await category_crud.update(
            db_obj=db_category,
            obj_in=update_data,
            session=session
        )

    return db_category


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
