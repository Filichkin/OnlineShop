from typing import Optional

from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.crud.base import CRUDBase
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class CRUDProduct(CRUDBase):
    """CRUD операции для продуктов"""

    def __init__(self):
        super().__init__(Product)

    async def get_active(
        self,
        product_id: int,
        session: AsyncSession,
    ) -> Optional[Product]:
        """Получить активный продукт по ID"""
        result = await session.execute(
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.category)
            )
            .where(
                Product.id == product_id,
                Product.is_active.is_(True)
            )
        )
        return result.scalars().first()

    async def get_multi_active(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
    ):
        """Получить список активных продуктов"""
        result = await session.execute(
            select(Product)
            .where(Product.is_active.is_(True))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_category(
        self,
        category_id: int,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
    ):
        """Получить активные продукты по категории"""
        result = await session.execute(
            select(Product)
            .where(
                Product.category_id == category_id,
                Product.is_active.is_(True)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_name(
        self,
        name: str,
        session: AsyncSession,
    ) -> Optional[Product]:
        """Получить продукт по имени"""
        result = await session.execute(
            select(Product).where(Product.name == name)
        )
        return result.scalars().first()

    async def search_by_name(
        self,
        name_pattern: str,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
    ):
        """Поиск активных продуктов по части имени"""
        result = await session.execute(
            select(Product)
            .where(
                Product.name.ilike(f'%{name_pattern}%'),
                Product.is_active.is_(True)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_price_range(
        self,
        min_price: float,
        max_price: float,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
    ):
        """Получить активные продукты в диапазоне цен"""
        result = await session.execute(
            select(Product)
            .where(
                Product.price >= min_price,
                Product.price <= max_price,
                Product.is_active.is_(True)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(
        self,
        obj_in: ProductCreate,
        session: AsyncSession,
    ) -> Product:
        """Создать новый продукт"""
        obj_in_data = obj_in.model_dump()
        db_obj = Product(**obj_in_data)
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db_obj: Product,
        obj_in: ProductUpdate,
        session: AsyncSession,
    ) -> Product:
        """Обновить продукт"""
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
        db_obj: Product,
        session: AsyncSession,
    ) -> Product:
        """Мягкое удаление продукта (установка is_active=False)"""
        db_obj.is_active = False
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def restore(
        self,
        db_obj: Product,
        session: AsyncSession,
    ) -> Product:
        """Восстановить продукт (установка is_active=True)"""
        db_obj.is_active = True
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj


product_crud = CRUDProduct()
