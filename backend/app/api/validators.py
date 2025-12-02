from typing import List, Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.crud.brand import brand_crud
from app.crud.product import product_crud


async def validate_product_exists(
    product_id: int,
    session: AsyncSession,
    must_be_active: bool = True
) -> None:
    """
    Проверяет существование продукта

    Args:
        product_id: ID продукта
        session: Сессия базы данных
        must_be_active: Должен ли продукт быть активным

    Raises:
        HTTPException: Если продукт не найден или неактивен
    """
    if must_be_active:
        product = await product_crud.get_active(
            product_id=product_id,
            session=session
        )
    else:
        product = await product_crud.get_with_status(
            product_id=product_id,
            session=session
        )

    if not product:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Продукт не найден'
        )


async def validate_product_name_unique(
    name: str,
    session: AsyncSession,
    exclude_product_id: Optional[int] = None
) -> None:
    """
    Проверяет уникальность названия продукта

    Args:
        name: Название продукта
        session: Сессия базы данных
        exclude_product_id: ID продукта для исключения из проверки
        (при обновлении)

    Raises:
        HTTPException: Если продукт с таким названием уже существует
    """
    existing_product = await product_crud.get_by_name(
        name=name,
        session=session
    )

    if (existing_product and
            (exclude_product_id is None or
             existing_product.id != exclude_product_id)):
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Продукт с таким названием уже существует'
        )


def validate_images_count(images: List[UploadFile]) -> None:
    """
    Проверяет количество загруженных изображений

    Args:
        images: Список загруженных файлов

    Raises:
        HTTPException: Если количество изображений меньше минимального
    """
    if len(images) < Constants.MIN_IMAGES_REQUIRED:
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Необходимо загрузить минимум одно изображение'
        )


async def validate_product_creation(
    name: str,
    brand_id: int,
    images: List[UploadFile],
    session: AsyncSession
) -> None:
    """
    Валидация для создания продукта

    Args:
        name: Название продукта
        brand_id: ID бренда
        images: Список изображений
        session: Сессия базы данных

    Raises:
        HTTPException: Если валидация не пройдена
    """
    # Проверяем существование бренда
    await validate_brand_exists(brand_id, session)

    # Проверяем уникальность названия продукта
    await validate_product_name_unique(name, session)

    # Проверяем количество изображений
    validate_images_count(images)


async def validate_product_update(
    product_id: int,
    name: Optional[str],
    brand_id: Optional[int],
    images: Optional[List[UploadFile]],
    session: AsyncSession
) -> None:
    """
    Валидация для обновления продукта

    Args:
        product_id: ID продукта
        name: Новое название продукта (если изменяется)
        brand_id: Новый ID бренда (если изменяется)
        images: Новые изображения (если загружаются)
        session: Сессия базы данных

    Raises:
        HTTPException: Если валидация не пройдена
    """
    # Проверяем существование продукта
    await validate_product_exists(product_id, session, must_be_active=False)

    # Если бренд изменяется, проверяем его существование
    if brand_id is not None:
        await validate_brand_exists(brand_id, session)

    # Если название изменяется, проверяем уникальность
    if name:
        await validate_product_name_unique(
            name, session, exclude_product_id=product_id
        )

    # Если загружаются новые изображения, проверяем их количество
    if images:
        validate_images_count(images)


async def validate_brand_exists(
    brand_id: int,
    session: AsyncSession,
    must_be_active: bool = True
) -> None:
    """
    Проверяет существование бренда

    Args:
        brand_id: ID бренда
        session: Сессия базы данных
        must_be_active: Должен ли бренд быть активным

    Raises:
        HTTPException: Если бренд не найден или неактивен
    """
    brand = await brand_crud.get(
        obj_id=brand_id,
        session=session
    )

    if not brand:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Бренд не найден'
        )

    if must_be_active and not brand.is_active:
        raise HTTPException(
            status_code=Constants.HTTP_404_NOT_FOUND,
            detail='Бренд не найден'
        )


async def validate_brand_name_unique(
    name: str,
    session: AsyncSession,
    exclude_brand_id: Optional[int] = None
) -> None:
    """
    Проверяет уникальность названия бренда

    Args:
        name: Название бренда
        session: Сессия базы данных
        exclude_brand_id: ID бренда для исключения из проверки
        (при обновлении)

    Raises:
        HTTPException: Если бренд с таким названием уже существует
    """
    existing_brand = await brand_crud.get_by_name(
        name=name,
        session=session
    )

    if (existing_brand and
            (exclude_brand_id is None or
             existing_brand.id != exclude_brand_id)):
        raise HTTPException(
            status_code=Constants.HTTP_400_BAD_REQUEST,
            detail='Бренд с таким названием уже существует'
        )


async def validate_brand_creation(
    name: str,
    session: AsyncSession
) -> None:
    """
    Валидация для создания бренда

    Args:
        name: Название бренда
        session: Сессия базы данных

    Raises:
        HTTPException: Если валидация не пройдена
    """
    await validate_brand_name_unique(name, session)


async def validate_brand_update(
    brand_id: int,
    name: Optional[str],
    session: AsyncSession
) -> None:
    """
    Валидация для обновления бренда

    Args:
        brand_id: ID бренда
        name: Новое название бренда (если изменяется)
        session: Сессия базы данных

    Raises:
        HTTPException: Если валидация не пройдена
    """
    # Проверяем существование бренда (не требуем активности для обновления)
    await validate_brand_exists(brand_id, session, must_be_active=False)

    # Если название изменяется, проверяем уникальность
    if name:
        await validate_brand_name_unique(
            name, session, exclude_brand_id=brand_id
        )
