from pathlib import Path
from typing import List, Optional

from fastapi import HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.core.storage import (
    save_image, save_images,
    delete_image_file,
    delete_image_files
)
from app.crud.base import CRUDBase
from app.models.media import Media, MediaType
from app.models.product import Category, Product
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import ProductCreate, ProductUpdate


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
            select(Category)
            .options(selectinload(Category.image))
            .where(
                Category.id == category_id,
                Category.is_active.is_(True)
            )
        )
        return result.scalars().first()

    async def get_with_image(
        self,
        category_id: int,
        session: AsyncSession,
    ) -> Optional[Category]:
        """Получить категорию с загруженным изображением"""
        result = await session.execute(
            select(Category)
            .options(selectinload(Category.image))
            .where(Category.id == category_id)
        )
        return result.scalars().first()

    async def get_with_status(
        self,
        category_id: int,
        session: AsyncSession,
        is_active: Optional[bool] = None,
    ) -> Optional[Category]:
        """Получить категорию по ID с опциональной фильтрацией по статусу"""
        query = select(Category).options(selectinload(Category.image)).where(
            Category.id == category_id
        )

        if is_active is not None:
            query = query.where(Category.is_active.is_(is_active))

        result = await session.execute(query)
        return result.scalars().first()

    async def get_multi_with_status(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
        is_active: Optional[bool] = None,
    ):
        """Получить список категорий с опциональной фильтрацией по статусу"""
        query = select(Category)

        if is_active is not None:
            query = query.where(Category.is_active.is_(is_active))

        result = await session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_multi_active(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
    ):
        """Получить список активных категорий (устаревший метод)"""
        return await self.get_multi_with_status(
            session, skip, limit, is_active=True
        )

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

    async def create_with_image(
        self,
        name: str,
        description: Optional[str],
        image_file,
        session: AsyncSession,
    ) -> Category:
        """Создать новую категорию с изображением"""
        # Проверяем, что категория с таким именем не существует
        existing_category = await self.get_by_name(
            name=name,
            session=session
        )
        if existing_category:
            raise HTTPException(
                status_code=Constants.HTTP_400_BAD_REQUEST,
                detail='Категория с таким именем уже существует'
            )

        # Сохраняем изображение
        image_url = await save_image(
            file=image_file,
            directory=Constants.CATEGORIES_DIR,
            prefix='category'
        )

        # Создаем категорию
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

        # Создаем запись Media для изображения категории
        media_obj = Media(
            url=image_url,
            media_type=MediaType.CATEGORY,
            order=Constants.MEDIA_ORDER_DEFAULT,
            is_main=True,
            category_id=db_category.id
        )
        session.add(media_obj)
        await session.commit()
        await session.refresh(db_category)

        return db_category

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

    async def update_with_image(
        self,
        category_id: int,
        name: Optional[str],
        description: Optional[str],
        is_active: Optional[bool],
        image_file: Optional,
        session: AsyncSession,
    ) -> Category:
        """Обновить категорию с возможностью изменения изображения"""
        # Получаем категорию
        db_category = await self.get(
            obj_id=category_id,
            session=session
        )
        if not db_category:
            raise HTTPException(
                status_code=Constants.HTTP_404_NOT_FOUND,
                detail='Категория не найдена'
            )

        # Проверяем уникальность имени, если оно изменяется
        if name and name != db_category.name:
            existing_category = await self.get_by_name(
                name=name,
                session=session
            )
            if existing_category:
                raise HTTPException(
                    status_code=Constants.HTTP_400_BAD_REQUEST,
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
        if image_file:
            # Get old image URLs before deleting from database
            old_media_result = await session.execute(
                select(Media).where(Media.category_id == db_category.id)
            )
            old_media = old_media_result.scalars().all()
            old_image_urls = [media.url for media in old_media]

            image_url = await save_image(
                file=image_file,
                directory=Constants.CATEGORIES_DIR,
                prefix='category'
            )
            db_category.image_url = image_url

            # Удаляем старые записи Media для категории
            await session.execute(
                delete(Media)
                .where(Media.category_id == db_category.id)
            )

            # Создаем новую запись Media для изображения категории
            media_obj = Media(
                url=image_url,
                media_type=MediaType.CATEGORY,
                order=Constants.MEDIA_ORDER_DEFAULT,
                is_main=True,
                category_id=db_category.id
            )
            session.add(media_obj)

        # Применяем обновления
        if update_data.model_dump(exclude_unset=True):
            db_category = await self.update(
                db_obj=db_category,
                obj_in=update_data,
                session=session
            )

        await session.commit()
        await session.refresh(db_category)

        # Delete old image files from filesystem AFTER successful commit
        if image_file and old_image_urls:
            for old_url in old_image_urls:
                await delete_image_file(old_url)

        return db_category

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

    async def create_product_with_images(
        self,
        name: str,
        part_number: str,
        price: float,
        category_id: int,
        brand_id: int,
        description: Optional[str],
        images: List[UploadFile],
        session: AsyncSession,
    ) -> Product:
        """Создать продукт с изображениями"""
        image_urls = []
        saved_files = []

        try:
            # Сохраняем изображения
            image_urls = await save_images(
                files=images,
                directory=Constants.PRODUCTS_DIR,
                prefix='product'
            )
            # Track saved file paths for cleanup
            saved_files = [
                Constants.PRODUCTS_DIR / Path(url).name for url in image_urls
            ]

            # Создаем продукт
            product_data = ProductCreate(
                name=name,
                part_number=part_number,
                price=price,
                category_id=category_id,
                brand_id=brand_id,
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
                    # Первое изображение - главное
                    is_main=(idx == Constants.FIRST_IMAGE_INDEX),
                    product_id=db_product.id
                )
                session.add(media_obj)

            await session.commit()
            await session.refresh(db_product)

            # Загружаем связанные данные для корректного ответа
            result = await session.execute(
                select(Product)
                .options(
                    selectinload(Product.images),
                    selectinload(Product.category),
                    selectinload(Product.brand)
                )
                .where(Product.id == db_product.id)
            )
            db_product = result.scalars().first()

            return db_product

        except Exception:
            # Rollback database transaction
            await session.rollback()

            # Clean up uploaded files if database operation failed
            for file_path in saved_files:
                try:
                    file_path.unlink(missing_ok=True)
                except Exception:
                    pass  # Ignore cleanup errors

            # Re-raise the original exception
            raise

    async def update_product_with_images(
        self,
        db_product: Product,
        name: Optional[str],
        part_number: Optional[str],
        price: Optional[float],
        brand_id: Optional[int],
        description: Optional[str],
        is_active: Optional[bool],
        images: Optional[List[UploadFile]],
        session: AsyncSession,
    ) -> Product:
        """Обновить продукт с изображениями"""
        if db_product is None:
            raise ValueError('Продукт не найден')

        image_urls = []
        saved_files = []
        old_images = []

        try:
            # Обновляем данные
            update_data = ProductUpdate()
            if name is not None:
                update_data.name = name
            if part_number is not None:
                update_data.part_number = part_number
            if price is not None:
                update_data.price = price
            if brand_id is not None:
                update_data.brand_id = brand_id
            if description is not None:
                update_data.description = description
            if is_active is not None:
                update_data.is_active = is_active

            # Обновляем изображения, если загружены новые
            if images:
                # Get old images for potential cleanup
                old_media_result = await session.execute(
                    select(Media).where(Media.product_id == db_product.id)
                )
                old_images = old_media_result.scalars().all()
                old_image_urls = [media.url for media in old_images]

                image_urls = await save_images(
                    files=images,
                    directory=Constants.PRODUCTS_DIR,
                    prefix='product'
                )
                # Track saved file paths for cleanup
                saved_files = [
                    Constants.PRODUCTS_DIR / Path(url).name
                    for url in image_urls
                ]

                # Удаляем старые изображения продукта из БД
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
                        # Первое изображение - главное
                        is_main=(idx == Constants.FIRST_IMAGE_INDEX),
                        product_id=db_product.id
                    )
                    session.add(media_obj)

            # Применяем обновления
            if update_data.model_dump(exclude_unset=True):
                for field, value in update_data.model_dump(
                    exclude_unset=True
                ).items():
                    setattr(db_product, field, value)
                session.add(db_product)

            await session.commit()
            await session.refresh(db_product)

            # Загружаем связанные данные для корректного ответа
            result = await session.execute(
                select(Product)
                .options(
                    selectinload(Product.images),
                    selectinload(Product.category),
                    selectinload(Product.brand)
                )
                .where(Product.id == db_product.id)
            )
            db_product = result.scalars().first()

            # Delete old image files from filesystem AFTER successful commit
            if images and old_images:
                old_image_urls = [media.url for media in old_images]
                await delete_image_files(old_image_urls)

            return db_product

        except Exception:
            # Rollback database transaction
            await session.rollback()

            # Clean up newly uploaded files if database operation failed
            for file_path in saved_files:
                try:
                    file_path.unlink(missing_ok=True)
                except Exception:
                    pass  # Ignore cleanup errors

            # Re-raise the original exception
            raise


category_crud = CRUDCategory()
