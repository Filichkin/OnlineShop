from datetime import timedelta
from typing import Optional

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import Constants
from app.core.db import utcnow
from app.models import Cart, CartItem, Product


class CRUDCart:
    """CRUD operations for shopping cart."""

    async def get_by_session(
        self,
        session_id: str,
        session: AsyncSession
    ) -> Optional[Cart]:
        """
        Get cart by session_id.

        Args:
            session_id: Guest session identifier
            session: Database session

        Returns:
            Cart object or None if not found
        """
        result = await session.execute(
            select(Cart)
            .where(Cart.session_id == session_id)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def get_or_create_for_session(
        self,
        session_id: str,
        session: AsyncSession
    ) -> Cart:
        """
        Get existing cart or create new one for guest session.

        Args:
            session_id: Guest session identifier
            session: Database session

        Returns:
            Cart object
        """
        cart = await self.get_by_session(session_id, session)

        if cart is None:
            expires_at = utcnow() + timedelta(
                days=Constants.CART_SESSION_LIFETIME_DAYS
            )
            cart = Cart(
                session_id=session_id,
                expires_at=expires_at
            )
            session.add(cart)
            try:
                await session.commit()
                await session.refresh(
                    cart,
                    attribute_names=['items']
                )
            except Exception as e:
                await session.rollback()
                raise

        return cart

    async def add_item(
        self,
        cart: Cart,
        product_id: int,
        quantity: int,
        session: AsyncSession
    ) -> CartItem:
        """
        Add product to cart or update quantity if already exists.

        Args:
            cart: Cart object
            product_id: Product ID to add
            quantity: Quantity to add
            session: Database session

        Returns:
            CartItem object

        Raises:
            ValueError: If product not found or inactive
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

        # Check if item already in cart
        item_result = await session.execute(
            select(CartItem)
            .where(
                CartItem.cart_id == cart.id,
                CartItem.product_id == product_id
            )
            .options(
                selectinload(CartItem.product)
                .selectinload(Product.images)
            )
        )
        existing_item = item_result.scalars().first()

        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + quantity
            if new_quantity > Constants.MAX_CART_ITEM_QUANTITY:
                new_quantity = Constants.MAX_CART_ITEM_QUANTITY

            existing_item.quantity = new_quantity
            try:
                await session.commit()
                await session.refresh(existing_item)
            except Exception:
                await session.rollback()
                raise
            return existing_item

        # Create new cart item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            price_at_addition=product.price
        )
        session.add(cart_item)
        try:
            await session.commit()
            # Refresh cart_item and eagerly load product with images
            await session.refresh(cart_item)
            result = await session.execute(
                select(CartItem)
                .where(CartItem.id == cart_item.id)
                .options(
                    selectinload(CartItem.product)
                    .selectinload(Product.images)
                )
            )
            cart_item = result.scalars().first()
        except Exception:
            await session.rollback()
            raise
        return cart_item

    async def update_item_quantity(
        self,
        cart: Cart,
        product_id: int,
        quantity: int,
        session: AsyncSession
    ) -> Optional[CartItem]:
        """
        Update cart item quantity.

        Args:
            cart: Cart object
            product_id: Product ID
            quantity: New quantity
            session: Database session

        Returns:
            Updated CartItem or None if not found
        """
        result = await session.execute(
            select(CartItem)
            .where(
                CartItem.cart_id == cart.id,
                CartItem.product_id == product_id
            )
            .options(
                selectinload(CartItem.product)
                .selectinload(Product.images)
            )
        )
        cart_item = result.scalars().first()

        if not cart_item:
            return None

        cart_item.quantity = quantity
        try:
            await session.commit()
            await session.refresh(cart_item)
        except Exception:
            await session.rollback()
            raise
        return cart_item

    async def remove_item(
        self,
        cart: Cart,
        product_id: int,
        session: AsyncSession
    ) -> bool:
        """
        Remove item from cart.

        Args:
            cart: Cart object
            product_id: Product ID to remove
            session: Database session

        Returns:
            True if item was removed, False if not found
        """
        result = await session.execute(
            delete(CartItem)
            .where(
                CartItem.cart_id == cart.id,
                CartItem.product_id == product_id
            )
        )
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        return result.rowcount > 0

    async def clear_cart(
        self,
        cart: Cart,
        session: AsyncSession
    ) -> int:
        """
        Remove all items from cart.

        Args:
            cart: Cart object
            session: Database session

        Returns:
            Number of items removed
        """
        result = await session.execute(
            delete(CartItem).where(CartItem.cart_id == cart.id)
        )
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        return result.rowcount

    async def cleanup_expired_carts(
        self,
        session: AsyncSession
    ) -> int:
        """
        Delete expired guest carts.

        This method should be called periodically by a background task.

        Args:
            session: Database session

        Returns:
            Number of carts deleted
        """
        current_time = utcnow()
        result = await session.execute(
            delete(Cart).where(Cart.expires_at < current_time)
        )
        await session.commit()
        return result.rowcount

    # TODO: Methods for authenticated users (future feature)

    async def get_by_user(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Optional[Cart]:
        """
        Get cart by user_id.

        Args:
            user_id: User identifier
            session: Database session

        Returns:
            Cart object or None if not found
        """
        result = await session.execute(
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def get_by_user_locked(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Optional[Cart]:
        """
        Get cart by user_id with row-level lock to prevent race conditions.

        This method uses SELECT FOR UPDATE to acquire an exclusive lock on
        the cart row, preventing concurrent order creation from the same cart.

        Should be used in transaction when creating orders to ensure
        cart is not modified by concurrent requests.

        Args:
            user_id: User identifier
            session: Database session

        Returns:
            Cart object with exclusive lock or None if not found
        """
        result = await session.execute(
            select(Cart)
            .where(Cart.user_id == user_id)
            .with_for_update()
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def get_or_create_for_user(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Cart:
        """
        Get existing cart or create new one for authenticated user.

        Args:
            user_id: User identifier
            session: Database session

        Returns:
            Cart object
        """
        cart = await self.get_by_user(user_id, session)

        if cart is None:
            expires_at = utcnow() + timedelta(
                days=Constants.CART_SESSION_LIFETIME_DAYS
            )
            cart = Cart(
                user_id=user_id,
                expires_at=expires_at
            )
            session.add(cart)
            try:
                await session.commit()
                await session.refresh(
                    cart,
                    attribute_names=['items']
                )
            except Exception:
                await session.rollback()
                raise

        return cart

    async def merge_carts(
        self,
        session_cart: Cart,
        user_cart: Cart,
        session: AsyncSession
    ) -> Cart:
        """
        Merge guest cart into user cart on login.

        Args:
            session_cart: Guest cart (from session)
            user_cart: User cart (authenticated)
            session: Database session

        Returns:
            Merged cart (user cart with items from both carts)
        """
        # Check if session cart exists and has items
        if not session_cart:
            return user_cart

        # Eagerly load all items to avoid lazy loading issues
        await session.refresh(session_cart, attribute_names=['items'])
        await session.refresh(user_cart, attribute_names=['items'])

        # Get all items from session cart
        # (copy list to avoid modification during iteration)
        session_items = list(session_cart.items)

        if not session_items:
            # No items to merge, delete empty session cart
            await session.delete(session_cart)
            await session.commit()
            return user_cart

        for session_item in session_items:
            # Check if product exists in user cart
            user_item_result = await session.execute(
                select(CartItem)
                .where(
                    CartItem.cart_id == user_cart.id,
                    CartItem.product_id == session_item.product_id
                )
            )
            user_item = user_item_result.scalars().first()

            if user_item:
                # Product exists in user cart,
                # update quantity and delete session item
                new_quantity = user_item.quantity + session_item.quantity
                if new_quantity > Constants.MAX_CART_ITEM_QUANTITY:
                    new_quantity = Constants.MAX_CART_ITEM_QUANTITY
                user_item.quantity = new_quantity
                # Delete the session item as we've merged it into user item
                await session.delete(session_item)
            else:
                # Product doesn't exist in user cart,
                # move it by updating cart_id via SQL
                await session.execute(
                    update(CartItem)
                    .where(CartItem.id == session_item.id)
                    .values(cart_id=user_cart.id)
                )

        # Commit all changes to cart items
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise

        # Delete empty session cart (only if it has no items left)
        # First, check if session cart still has items
        await session.refresh(session_cart, attribute_names=['items'])
        if not session_cart.items or len(session_cart.items) == 0:
            await session.delete(session_cart)
            try:
                await session.commit()
            except Exception:
                await session.rollback()
                raise

        # Reload user cart with all items
        result = await session.execute(
            select(Cart)
            .where(Cart.id == user_cart.id)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.product)
                .selectinload(Product.images)
            )
        )
        merged_cart = result.scalars().first()
        return merged_cart or user_cart


cart_crud = CRUDCart()
