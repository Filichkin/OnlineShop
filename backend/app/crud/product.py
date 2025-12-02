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

    async def get_with_status(
        self,
        product_id: int,
        session: AsyncSession,
        is_active: Optional[bool] = None,
    ) -> Optional[Product]:
        """Получить продукт по ID с опциональной фильтрацией по статусу"""
        query = select(Product).options(
            selectinload(Product.images),
            selectinload(Product.brand)
        ).where(Product.id == product_id)

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        result = await session.execute(query)
        return result.scalars().first()

    async def get_multi(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        is_active: Optional[bool] = None,
    ):
        """Получить список продуктов с опциональной фильтрацией по статусу"""
        query = select(Product)

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        result = await session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all()

    # Оставляем старые методы для обратной совместимости
    async def get_active(
        self,
        product_id: int,
        session: AsyncSession,
    ) -> Optional[Product]:
        """Получить активный продукт по ID (устаревший метод)"""
        return await self.get_with_status(product_id, session, is_active=True)

    async def get_with_relations(
        self,
        product_id: int,
        session: AsyncSession,
    ) -> Optional[Product]:
        """Получить продукт по ID с загруженными связанными данными"""
        return await self.get_with_status(product_id, session, is_active=None)

    async def get_multi_active(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
    ):
        """Получить список активных продуктов (устаревший метод)"""
        return await self.get_multi(session, skip, limit, is_active=True)

    async def get_by_brand(
        self,
        brand_id: int,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        is_active: Optional[bool] = None,
        sort_by: str = 'price_asc',
    ):
        """
        Получить продукты по бренду
        с опциональной фильтрацией по статусу и сортировкой

        Args:
            brand_id: ID бренда
            session: Сессия БД
            skip: Количество элементов для пропуска
            limit: Количество элементов для возврата
            is_active: Фильтр по статусу активности
            sort_by: Тип сортировки (price_asc, price_desc, name_asc, name_desc)
        """
        query = select(Product).where(Product.brand_id == brand_id)

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        # Применяем сортировку
        if sort_by == 'price_desc':
            query = query.order_by(Product.price.desc())
        elif sort_by == 'name_asc':
            query = query.order_by(Product.name.asc())
        elif sort_by == 'name_desc':
            query = query.order_by(Product.name.desc())
        else:  # price_asc (по умолчанию)
            query = query.order_by(Product.price.asc())

        result = await session.execute(
            query.offset(skip).limit(limit)
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
        is_active: Optional[bool] = None,
    ):
        """
        Поиск продуктов по части имени с опциональной фильтрацией по статусу

        Escapes LIKE wildcards to prevent wildcard injection attacks
        """
        # Escape LIKE special characters (% and _) to prevent injection
        escaped_pattern = (
            name_pattern
            .replace('\\', '\\\\')  # Escape backslash first
            .replace('%', '\\%')     # Escape percent wildcard
            .replace('_', '\\_')     # Escape underscore wildcard
        )

        query = select(Product).where(
            Product.name.ilike(f'%{escaped_pattern}%', escape='\\')
        )

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        result = await session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_price_range(
        self,
        min_price: float,
        max_price: float,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        is_active: Optional[bool] = None,
    ):
        """
        Получить продукты в диапазоне цен
        с опциональной фильтрацией по статусу
        """
        query = select(Product).where(
            Product.price >= min_price,
            Product.price <= max_price
        )

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        result = await session.execute(
            query.offset(skip).limit(limit)
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
