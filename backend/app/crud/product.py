from typing import Optional, Dict, Any

from fastapi.encoders import jsonable_encoder
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.crud.base import CRUDBase
from app.models.brand import Brand
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

    # ========== Методы для работы с brand slug ==========

    async def create_for_brand(
        self,
        brand_id: int,
        obj_in: Dict[str, Any],
        session: AsyncSession,
    ) -> Product:
        """
        Создать продукт с привязкой к бренду

        Args:
            brand_id: ID бренда (получается из brand_slug)
            obj_in: Данные продукта (словарь)
            session: Сессия БД

        Returns:
            Product: Созданный продукт
        """
        obj_in['brand_id'] = brand_id
        db_obj = Product(**obj_in)
        session.add(db_obj)
        await session.commit()
        await session.refresh(db_obj)
        return db_obj

    async def get_by_brand_slug(
        self,
        brand_slug: str,
        product_id: int,
        session: AsyncSession,
        is_active: Optional[bool] = None,
    ) -> Optional[Product]:
        """
        Получить продукт бренда по slug бренда и ID продукта

        Args:
            brand_slug: Slug бренда
            product_id: ID продукта
            session: Сессия БД
            is_active: Фильтр по статусу активности

        Returns:
            Optional[Product]: Продукт или None
        """
        query = (
            select(Product)
            .join(Brand, Product.brand_id == Brand.id)
            .where(
                Brand.slug == brand_slug,
                Product.id == product_id
            )
            .options(
                selectinload(Product.images),
                selectinload(Product.brand)
            )
        )

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        result = await session.execute(query)
        return result.scalars().first()

    async def get_multi_by_brand_slug(
        self,
        brand_slug: str,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        is_active: Optional[bool] = None,
        sort_by: str = 'created_at',
        sort_order: str = 'desc',
    ):
        """
        Получить список продуктов бренда по slug

        Args:
            brand_slug: Slug бренда
            session: Сессия БД
            skip: Пропустить элементов
            limit: Вернуть элементов
            is_active: Фильтр по статусу
            sort_by: Поле для сортировки (name, price, created_at)
            sort_order: Порядок сортировки (asc, desc)

        Returns:
            List[Product]: Список продуктов
        """
        query = (
            select(Product)
            .join(Brand, Product.brand_id == Brand.id)
            .where(Brand.slug == brand_slug)
        )

        if is_active is not None:
            query = query.where(Product.is_active.is_(is_active))

        # Применяем сортировку
        if sort_by == 'name':
            order_col = Product.name
        elif sort_by == 'price':
            order_col = Product.price
        else:  # created_at по умолчанию
            order_col = Product.created_at

        if sort_order == 'asc':
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        result = await session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_multi_for_catalog(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        brand_slug: Optional[str] = None,
        search: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_active: Optional[bool] = True,
        sort_by: str = 'created_at',
        sort_order: str = 'desc',
    ):
        """
        Получить продукты для каталога с расширенными фильтрами

        Args:
            session: Сессия БД
            skip: Пропустить элементов
            limit: Вернуть элементов
            brand_slug: Фильтр по slug бренда
            search: Поиск по названию, артикулу, описанию
            min_price: Минимальная цена
            max_price: Максимальная цена
            is_active: Фильтр по статусу
            sort_by: Поле для сортировки
            sort_order: Порядок сортировки

        Returns:
            List[Product]: Список продуктов
        """
        query = select(Product).join(Brand, Product.brand_id == Brand.id)

        # Применяем фильтры
        filters = []

        if is_active is not None:
            filters.append(Product.is_active.is_(is_active))

        if brand_slug:
            filters.append(Brand.slug == brand_slug)

        if search:
            # Escape LIKE wildcards
            escaped_search = (
                search
                .replace('\\', '\\\\')
                .replace('%', '\\%')
                .replace('_', '\\_')
            )
            search_filter = or_(
                Product.name.ilike(f'%{escaped_search}%', escape='\\'),
                Product.part_number.ilike(f'%{escaped_search}%', escape='\\'),
                Product.description.ilike(f'%{escaped_search}%', escape='\\')
            )
            filters.append(search_filter)

        if min_price is not None:
            filters.append(Product.price >= min_price)

        if max_price is not None:
            filters.append(Product.price <= max_price)

        if filters:
            query = query.where(and_(*filters))

        # Применяем сортировку
        if sort_by == 'name':
            order_col = Product.name
        elif sort_by == 'price':
            order_col = Product.price
        else:  # created_at по умолчанию
            order_col = Product.created_at

        if sort_order == 'asc':
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        result = await session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all()


product_crud = CRUDProduct()
