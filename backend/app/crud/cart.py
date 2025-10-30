from datetime import timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, select
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
            await session.commit()
            await session.refresh(
                cart,
                attribute_names=['items']
            )

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
            .options(selectinload(CartItem.product))
        )
        existing_item = item_result.scalars().first()

        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + quantity
            if new_quantity > Constants.MAX_CART_ITEM_QUANTITY:
                new_quantity = Constants.MAX_CART_ITEM_QUANTITY

            existing_item.quantity = new_quantity
            await session.commit()
            await session.refresh(existing_item)
            return existing_item

        # Create new cart item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
            price_at_addition=product.price
        )
        session.add(cart_item)
        await session.commit()
        await session.refresh(
            cart_item,
            attribute_names=['product']
        )
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
            .options(selectinload(CartItem.product))
        )
        cart_item = result.scalars().first()

        if not cart_item:
            return None

        cart_item.quantity = quantity
        await session.commit()
        await session.refresh(cart_item)
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
        await session.commit()
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
        await session.commit()
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
        user_id: UUID,
        session: AsyncSession
    ) -> Optional[Cart]:
        """
        Get cart by user_id.

        TODO: Implement when user authentication is added.

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
            )
        )
        return result.scalars().first()

    async def merge_carts(
        self,
        session_cart: Cart,
        user_cart: Cart,
        session: AsyncSession
    ) -> Cart:
        """
        Merge guest cart into user cart on login.

        TODO: Implement when user authentication is added.

        Args:
            session_cart: Guest cart (from session)
            user_cart: User cart (authenticated)
            session: Database session

        Returns:
            Merged cart (user cart with items from both carts)
        """
        # Implementation will be added with user authentication
        # Logic:
        # 1. Iterate through session_cart items
        # 2. For each item, check if it exists in user_cart
        # 3. If exists, update quantity (sum of both)
        # 4. If not, move item to user_cart
        # 5. Delete session_cart
        pass


cart_crud = CRUDCart()
