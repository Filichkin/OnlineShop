# app/crud/media.py
from typing import List, Optional
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.media import Media


class CRUDMedia(CRUDBase):
    """CRUD операции для медиафайлов"""

    def __init__(self):
        super().__init__(Media)

    async def get_product_images(
        self,
        product_id: int,
        session: AsyncSession,
    ) -> List[Media]:
        """Получить все изображения продукта, отсортированные по order"""
        result = await session.execute(
            select(Media)
            .where(Media.product_id == product_id)
            .order_by(Media.order, Media.id)
        )
        return result.scalars().all()

    async def get_by_id(
        self,
        media_id: UUID,
        session: AsyncSession,
    ) -> Optional[Media]:
        """Получить медиафайл по ID"""
        result = await session.execute(
            select(Media).where(Media.id == media_id)
        )
        return result.scalars().first()

    async def get_main_image(
        self,
        product_id: int,
        session: AsyncSession,
    ) -> Optional[Media]:
        """Получить главное изображение продукта"""
        result = await session.execute(
            select(Media)
            .where(
                Media.product_id == product_id,
                Media.is_main.is_(True)
            )
        )
        return result.scalars().first()

    async def set_main_image(
        self,
        media_id: UUID,
        product_id: int,
        session: AsyncSession,
    ) -> Media:
        """
        Установить изображение как главное.
        Сбрасывает флаг is_main у остальных изображений продукта.
        """
        # Сначала убираем флаг is_main у всех изображений продукта
        await session.execute(
            select(Media)
            .where(Media.product_id == product_id)
        )

        all_images = await self.get_product_images(product_id, session)
        for img in all_images:
            if img.is_main:
                img.is_main = False
                session.add(img)

        # Устанавливаем флаг для выбранного изображения
        media = await self.get_by_id(media_id, session)
        if media and media.product_id == product_id:
            media.is_main = True
            session.add(media)
            await session.commit()
            await session.refresh(media)
            return media

        raise ValueError('Изображение не найдено или не принадлежит продукту')

    async def add_images(
        self,
        images: List[Media],
        session: AsyncSession,
    ) -> List[Media]:
        """Добавить несколько изображений"""
        for image in images:
            session.add(image)

        await session.commit()

        for image in images:
            await session.refresh(image)

        return images

    async def delete_images(
        self,
        media_ids: List[UUID],
        product_id: int,
        session: AsyncSession,
    ) -> int:
        """
        Удалить изображения по списку ID.
        Возвращает количество удаленных записей.
        """
        # Проверяем, что все изображения принадлежат указанному продукту
        images = await session.execute(
            select(Media)
            .where(
                Media.id.in_(media_ids),
                Media.product_id == product_id
            )
        )
        images_list = images.scalars().all()

        if len(images_list) != len(media_ids):
            raise ValueError(
                'Некоторые изображения не найдены '
                'или не принадлежат продукту'
            )

        # Удаляем изображения
        result = await session.execute(
            delete(Media)
            .where(
                Media.id.in_(media_ids),
                Media.product_id == product_id
            )
        )

        await session.commit()
        return result.rowcount

    async def reorder_images(
        self,
        order_updates: List[tuple[UUID, int]],
        product_id: int,
        session: AsyncSession,
    ) -> List[Media]:
        """
        Изменить порядок изображений.

        Args:
            order_updates: Список кортежей (media_id, new_order)
            product_id: ID продукта
            session: Сессия БД

        Returns:
            Обновленный список изображений продукта
        """
        media_ids = [media_id for media_id, _ in order_updates]

        # Проверяем, что все изображения принадлежат продукту
        images = await session.execute(
            select(Media)
            .where(
                Media.id.in_(media_ids),
                Media.product_id == product_id
            )
        )
        images_dict = {img.id: img for img in images.scalars().all()}

        if len(images_dict) != len(media_ids):
            raise ValueError(
                'Некоторые изображения не найдены '
                'или не принадлежат продукту'
            )

        # Обновляем порядок
        for media_id, new_order in order_updates:
            img = images_dict[media_id]
            img.order = new_order
            session.add(img)

        await session.commit()

        # Возвращаем обновленный список изображений
        return await self.get_product_images(product_id, session)


media_crud = CRUDMedia()
