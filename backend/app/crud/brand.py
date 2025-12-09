from typing import Optional
import re

from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.crud.base import CRUDBase
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate


class CRUDBrand(CRUDBase):
    """CRUD операции для брендов"""

    def __init__(self):
        super().__init__(Brand)

    @staticmethod
    def generate_slug(name: str) -> str:
        """
        Генерация slug из названия бренда

        Args:
            name: Название бренда

        Returns:
            str: Сгенерированный slug (lowercase, только буквы/цифры/дефисы)
        """
        # Преобразуем в нижний регистр
        slug = name.lower()
        # Убираем все, кроме букв, цифр, пробелов и дефисов
        slug = re.sub(r'[^\w\s-]', '', slug)
        # Заменяем пробелы и множественные дефисы на один дефис
        slug = re.sub(r'[-\s]+', '-', slug)
        # Убираем дефисы в начале и конце
        slug = slug.strip('-')
        return slug

    async def get_by_name(
        self,
        name: str,
        session: AsyncSession,
    ) -> Optional[Brand]:
        """Получить бренд по имени"""
        result = await session.execute(
            select(Brand).where(Brand.name == name)
        )
        return result.scalars().first()

    async def get_by_slug(
        self,
        slug: str,
        session: AsyncSession,
    ) -> Optional[Brand]:
        """Получить бренд по slug"""
        result = await session.execute(
            select(Brand).where(Brand.slug == slug)
        )
        return result.scalars().first()

    async def get_multi(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        is_active: Optional[bool] = None,
    ):
        """Получить список брендов с опциональной фильтрацией по статусу"""
        query = select(Brand)

        if is_active is not None:
            query = query.where(Brand.is_active.is_(is_active))

        result = await session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def create(
        self,
        obj_in: BrandCreate,
        session: AsyncSession,
    ) -> Brand:
        """Создать новый бренд"""
        obj_in_data = obj_in.model_dump()
        db_obj = Brand(**obj_in_data)
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db_obj: Brand,
        obj_in: BrandUpdate,
        session: AsyncSession,
    ) -> Brand:
        """Обновить бренд"""
        obj_data = jsonable_encoder(db_obj)
        update_data = obj_in.model_dump(exclude_unset=True)

        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])

        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def soft_delete(
        self,
        db_obj: Brand,
        session: AsyncSession,
    ) -> Brand:
        """Мягкое удаление бренда (установка is_active=False)"""
        db_obj.is_active = False
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def restore(
        self,
        db_obj: Brand,
        session: AsyncSession,
    ) -> Brand:
        """Восстановить бренд (установка is_active=True)"""
        db_obj.is_active = True
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj


brand_crud = CRUDBrand()
