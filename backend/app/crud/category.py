from typing import Optional

from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.product import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CRUDCategory(CRUDBase):
    """CRUD операции для категорий"""

    def __init__(self):
        super().__init__(Category)

    async def get_by_name(
        self,
        name: str,
        session: AsyncSession,
    ) -> Optional[Category]:
        """Получить категорию по имени"""
        result = await session.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalars().first()

    async def get_active(
        self,
        category_id: int,
        session: AsyncSession,
    ) -> Optional[Category]:
        """Получить активную категорию по ID"""
        result = await session.execute(
            select(Category).where(
                Category.id == category_id,
                Category.is_active.is_(True)
            )
        )
        return result.scalars().first()

    async def get_multi_active(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ):
        """Получить список активных категорий"""
        result = await session.execute(
            select(Category)
            .where(Category.is_active.is_(True))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(
        self,
        obj_in: CategoryCreate,
        session: AsyncSession,
    ) -> Category:
        """Создать новую категорию"""
        obj_in_data = obj_in.model_dump()
        db_obj = Category(**obj_in_data)
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db_obj: Category,
        obj_in: CategoryUpdate,
        session: AsyncSession,
    ) -> Category:
        """Обновить категорию"""
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
        db_obj: Category,
        session: AsyncSession,
    ) -> Category:
        """Мягкое удаление категории (установка is_active=False)"""
        db_obj.is_active = False
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def restore(
        self,
        db_obj: Category,
        session: AsyncSession,
    ) -> Category:
        """Восстановить категорию (установка is_active=True)"""
        db_obj.is_active = True
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj


category_crud = CRUDCategory()
