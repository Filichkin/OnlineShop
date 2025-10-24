from typing import Optional

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.core.storage import save_image, delete_image_file
from app.crud.base import CRUDBase
from app.models.media import Media, MediaType
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

    async def get_multi_active(
        self,
        session: AsyncSession,
        skip: int = Constants.DEFAULT_SKIP,
        limit: int = Constants.DEFAULT_LIMIT,
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


category_crud = CRUDCategory()
