from datetime import timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.core.db import utcnow
from app.models import Favorite, FavoriteItem, Product


class CRUDFavorite:
    '''CRUD operations for favorite list.'''

    async def get_by_session(
        self,
        session_id: str,
        session: AsyncSession
    ) -> Optional[Favorite]:
        '''
        Get favorite list by session_id.

        Args:
            session_id: Guest session identifier
            session: Database session

        Returns:
            Favorite object or None if not found
        '''
        result = await session.execute(
            select(Favorite)
            .where(Favorite.session_id == session_id)
            .options(
                selectinload(Favorite.items)
                .selectinload(FavoriteItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def get_or_create_for_session(
        self,
        session_id: str,
        session: AsyncSession
    ) -> Favorite:
        '''
        Get existing favorite list or create new one for guest session.

        Args:
            session_id: Guest session identifier
            session: Database session

        Returns:
            Favorite object
        '''
        favorite = await self.get_by_session(session_id, session)

        if favorite is None:
            expires_at = utcnow() + timedelta(
                days=Constants.FAVORITE_SESSION_LIFETIME_DAYS
            )
            favorite = Favorite(
                session_id=session_id,
                expires_at=expires_at
            )
            session.add(favorite)
            await session.commit()
            await session.refresh(
                favorite,
                attribute_names=['items']
            )

        return favorite

    async def add_item(
        self,
        favorite: Favorite,
        product_id: int,
        session: AsyncSession
    ) -> FavoriteItem:
        '''
        Add product to favorite list.

        Args:
            favorite: Favorite object
            product_id: Product ID to add
            session: Database session

        Returns:
            FavoriteItem object

        Raises:
            ValueError: If product not found, inactive, or already in favorites
        '''
        # Check if product exists and is active
        product_result = await session.execute(
            select(Product).where(
                Product.id == product_id,
                Product.is_active == True  # noqa: E712
            )
        )
        product = product_result.scalars().first()

        if not product:
            raise ValueError(
                f'Product with id {product_id} not found or inactive'
            )

        # Check if item already in favorites
        item_result = await session.execute(
            select(FavoriteItem)
            .where(
                FavoriteItem.favorite_id == favorite.id,
                FavoriteItem.product_id == product_id
            )
        )
        existing_item = item_result.scalars().first()

        if existing_item:
            raise ValueError(
                f'Product {product_id} is already in favorites'
            )

        # Create new favorite item
        favorite_item = FavoriteItem(
            favorite_id=favorite.id,
            product_id=product_id
        )
        session.add(favorite_item)
        await session.commit()

        # Refresh and eagerly load product with images
        await session.refresh(favorite_item)
        result = await session.execute(
            select(FavoriteItem)
            .where(FavoriteItem.id == favorite_item.id)
            .options(
                selectinload(FavoriteItem.product)
                .selectinload(Product.images)
            )
        )
        favorite_item = result.scalars().first()
        return favorite_item

    async def remove_item(
        self,
        favorite: Favorite,
        product_id: int,
        session: AsyncSession
    ) -> bool:
        '''
        Remove item from favorites.

        Args:
            favorite: Favorite object
            product_id: Product ID to remove
            session: Database session

        Returns:
            True if item was removed, False if not found
        '''
        result = await session.execute(
            delete(FavoriteItem)
            .where(
                FavoriteItem.favorite_id == favorite.id,
                FavoriteItem.product_id == product_id
            )
        )
        await session.commit()
        return result.rowcount > 0

    async def is_favorite(
        self,
        favorite: Favorite,
        product_id: int,
        session: AsyncSession
    ) -> bool:
        '''
        Check if product is in favorites.

        Args:
            favorite: Favorite object
            product_id: Product ID to check
            session: Database session

        Returns:
            True if product is in favorites, False otherwise
        '''
        result = await session.execute(
            select(FavoriteItem)
            .where(
                FavoriteItem.favorite_id == favorite.id,
                FavoriteItem.product_id == product_id
            )
        )
        return result.scalars().first() is not None

    async def cleanup_expired_favorites(
        self,
        session: AsyncSession
    ) -> int:
        '''
        Delete expired guest favorite lists.

        This method should be called periodically by a background task.

        Args:
            session: Database session

        Returns:
            Number of favorite lists deleted
        '''
        current_time = utcnow()
        result = await session.execute(
            delete(Favorite).where(Favorite.expires_at < current_time)
        )
        await session.commit()
        return result.rowcount

    # TODO: Methods for authenticated users (future feature)

    async def get_by_user(
        self,
        user_id: UUID,
        session: AsyncSession
    ) -> Optional[Favorite]:
        '''
        Get favorite list by user_id.

        TODO: Implement when user authentication is added.

        Args:
            user_id: User identifier
            session: Database session

        Returns:
            Favorite object or None if not found
        '''
        result = await session.execute(
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .options(
                selectinload(Favorite.items)
                .selectinload(FavoriteItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def merge_favorites(
        self,
        session_favorite: Favorite,
        user_favorite: Favorite,
        session: AsyncSession
    ) -> Favorite:
        '''
        Merge guest favorites into user favorites on login.

        TODO: Implement when user authentication is added.

        Args:
            session_favorite: Guest favorite (from session)
            user_favorite: User favorite (authenticated)
            session: Database session

        Returns:
            Merged favorite list
        '''
        # Implementation will be added with user authentication
        # Logic:
        # 1. Iterate through session_favorite items
        # 2. For each item, check if it exists in user_favorite
        # 3. If not exists, move item to user_favorite
        # 4. Delete session_favorite
        pass


favorite_crud = CRUDFavorite()
