from datetime import timedelta
from typing import Optional

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.core.db import utcnow
from app.models import Favorite, FavoriteItem, Product


class CRUDFavorite:
    """CRUD operations for favorite list."""

    async def get_by_session(
        self,
        session_id: str,
        session: AsyncSession
    ) -> Optional[Favorite]:
        """
        Get favorite list by session_id.

        Args:
            session_id: Guest session identifier
            session: Database session

        Returns:
            Favorite object or None if not found
        """
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
        """
        Get existing favorite list or create new one for guest session.

        Args:
            session_id: Guest session identifier
            session: Database session

        Returns:
            Favorite object
        """
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
        """
        Add product to favorite list.

        Args:
            favorite: Favorite object
            product_id: Product ID to add
            session: Database session

        Returns:
            FavoriteItem object

        Raises:
            ValueError: If product not found, inactive, or already in favorites
        """
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
        """
        Remove item from favorites.

        Args:
            favorite: Favorite object
            product_id: Product ID to remove
            session: Database session

        Returns:
            True if item was removed, False if not found
        """
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
        """
        Check if product is in favorites.

        Args:
            favorite: Favorite object
            product_id: Product ID to check
            session: Database session

        Returns:
            True if product is in favorites, False otherwise
        """
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
        """
        Delete expired guest favorite lists.

        This method should be called periodically by a background task.

        Args:
            session: Database session

        Returns:
            Number of favorite lists deleted
        """
        current_time = utcnow()
        result = await session.execute(
            delete(Favorite).where(Favorite.expires_at < current_time)
        )
        await session.commit()
        return result.rowcount

    # TODO: Methods for authenticated users (future feature)

    async def get_by_user(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Optional[Favorite]:
        """
        Get favorite list by user_id.

        Args:
            user_id: User identifier
            session: Database session

        Returns:
            Favorite object or None if not found
        """
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

    async def get_or_create_for_user(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Favorite:
        """
        Get existing favorite list or create new one for authenticated user.

        Args:
            user_id: User identifier
            session: Database session

        Returns:
            Favorite object
        """
        favorite = await self.get_by_user(user_id, session)

        if favorite is None:
            expires_at = utcnow() + timedelta(
                days=Constants.FAVORITE_SESSION_LIFETIME_DAYS
            )
            favorite = Favorite(
                user_id=user_id,
                expires_at=expires_at
            )
            session.add(favorite)
            await session.commit()
            await session.refresh(
                favorite,
                attribute_names=['items']
            )

        return favorite

    async def merge_favorites(
        self,
        session_favorite: Favorite,
        user_favorite: Favorite,
        session: AsyncSession
    ) -> Favorite:
        """
        Merge guest favorites into user favorites on login.

        Args:
            session_favorite: Guest favorite (from session)
            user_favorite: User favorite (authenticated)
            session: Database session

        Returns:
            Merged favorite list
        """
        # Check if session favorite exists
        if not session_favorite:
            return user_favorite

        # Eagerly load all items to avoid lazy loading issues
        await session.refresh(session_favorite, attribute_names=['items'])
        await session.refresh(user_favorite, attribute_names=['items'])

        # Get all items from session favorite (copy list to avoid modification during iteration)
        session_items = list(session_favorite.items)

        if not session_items:
            # No items to merge, delete empty session favorite
            await session.delete(session_favorite)
            await session.commit()
            return user_favorite

        for session_item in session_items:
            # Check if product exists in user favorites
            user_item_result = await session.execute(
                select(FavoriteItem)
                .where(
                    FavoriteItem.favorite_id == user_favorite.id,
                    FavoriteItem.product_id == session_item.product_id
                )
            )
            user_item = user_item_result.scalars().first()

            if user_item:
                # Product already in user favorites, delete session item
                await session.delete(session_item)
            else:
                # Product doesn't exist in user favorites, move it by updating favorite_id via SQL
                await session.execute(
                    update(FavoriteItem)
                    .where(FavoriteItem.id == session_item.id)
                    .values(favorite_id=user_favorite.id)
                )

        # Commit all changes to favorite items
        await session.commit()

        # Delete empty session favorite (only if it has no items left)
        # First, check if session favorite still has items
        await session.refresh(session_favorite, attribute_names=['items'])
        if not session_favorite.items or len(session_favorite.items) == 0:
            await session.delete(session_favorite)
            await session.commit()

        # Reload user favorite with all items
        result = await session.execute(
            select(Favorite)
            .where(Favorite.id == user_favorite.id)
            .options(
                selectinload(Favorite.items)
                .selectinload(FavoriteItem.product)
                .selectinload(Product.images)
            )
        )
        merged_favorite = result.scalars().first()
        return merged_favorite or user_favorite


favorite_crud = CRUDFavorite()
