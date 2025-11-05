from typing import List, Optional

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Order, OrderItem, OrderStatus, Product, User
from app.utils import (
    generate_order_number,
    send_order_confirmation_email,
    send_order_status_update_email,
)


class CRUDOrder:
    """CRUD operations for orders."""

    async def create_from_cart(
        self,
        user_id: int,
        cart_items: list,
        order_data: dict,
        session: AsyncSession
    ) -> Order:
        """
        Create order from cart items.

        Generates unique order number and sends confirmation email.

        Args:
            user_id: User ID
            cart_items: List of cart items to convert to order
            order_data: Dictionary with customer information
            session: Database session

        Returns:
            Created Order object

        Raises:
            ValueError: If cart is empty
        """
        if not cart_items:
            raise ValueError('Cannot create order from empty cart')

        # Generate unique order number
        order_number = await generate_order_number(session)
        logger.info(f'Generated order number: {order_number}')

        # Calculate totals
        total_items = sum(item.quantity for item in cart_items)
        total_price = sum(
            item.quantity * item.price_at_addition for item in cart_items
        )

        # Create order
        order = Order(
            user_id=user_id,
            order_number=order_number,
            status=OrderStatus.CREATED,
            first_name=order_data['first_name'],
            last_name=order_data['last_name'],
            city=order_data['city'],
            postal_code=order_data['postal_code'],
            address=order_data['address'],
            phone=order_data['phone'],
            email=order_data['email'],
            notes=order_data.get('notes'),
            total_items=total_items,
            total_price=total_price
        )
        session.add(order)
        await session.flush()

        # Create order items from cart items
        for cart_item in cart_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.price_at_addition,
                product_name=cart_item.product.name
            )
            session.add(order_item)

        try:
            await session.commit()
            await session.refresh(order, attribute_names=['items'])

            # Send confirmation email (non-blocking)
            # Don't fail order creation if email fails
            try:
                email_sent = send_order_confirmation_email(order)
                if email_sent:
                    logger.info(
                        f'Order confirmation email sent successfully '
                        f'for order {order_number}'
                    )
                else:
                    logger.warning(
                        f'Failed to send order confirmation email '
                        f'for order {order_number}'
                    )
            except Exception as e:
                logger.error(
                    f'Unexpected error sending email for order '
                    f'{order_number}: {str(e)}',
                    exc_info=True
                )

        except Exception:
            await session.rollback()
            raise

        return order

    async def get_by_id(
        self,
        order_id: int,
        session: AsyncSession
    ) -> Optional[Order]:
        """
        Get order by ID with all related data.

        Args:
            order_id: Order ID
            session: Database session

        Returns:
            Order object or None if not found
        """
        result = await session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def get_by_id_and_user(
        self,
        order_id: int,
        user_id: int,
        session: AsyncSession
    ) -> Optional[Order]:
        """
        Get order by ID and user ID with all related data.

        Args:
            order_id: Order ID
            user_id: User ID
            session: Database session

        Returns:
            Order object or None if not found
        """
        result = await session.execute(
            select(Order)
            .where(Order.id == order_id, Order.user_id == user_id)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.images)
            )
        )
        return result.scalars().first()

    async def get_user_orders(
        self,
        user_id: int,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Order]:
        """
        Get all orders for a specific user.

        Args:
            user_id: User ID
            session: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of Order objects
        """
        result = await session.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.images)
            )
        )
        return list(result.scalars().all())

    async def get_all_orders(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[OrderStatus] = None
    ) -> List[Order]:
        """
        Get all orders (superuser only).

        Args:
            session: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Optional status filter

        Returns:
            List of Order objects
        """
        query = select(Order)

        if status:
            query = query.where(Order.status == status)

        query = (
            query
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.images),
                selectinload(Order.user)
            )
        )

        result = await session.execute(query)
        return list(result.scalars().all())

    async def cancel_order(
        self,
        order: Order,
        session: AsyncSession
    ) -> Order:
        """
        Cancel order if status allows cancellation.

        Args:
            order: Order object to cancel
            session: Database session

        Returns:
            Updated Order object

        Raises:
            ValueError: If order cannot be canceled
        """
        # Check if order can be canceled
        cancellable_statuses = [
            OrderStatus.CREATED,
            OrderStatus.UPDATED,
            OrderStatus.CONFIRMED
        ]

        if order.status not in cancellable_statuses:
            raise ValueError(
                f'Order with status "{order.status}" cannot be canceled. '
                f'Only orders with status "created", "updated", or '
                f'"confirmed" can be canceled.'
            )

        if order.status == OrderStatus.CANCELED:
            raise ValueError('Order is already canceled')

        # Update order status
        order.status = OrderStatus.CANCELED
        try:
            await session.commit()
            await session.refresh(order)
        except Exception:
            await session.rollback()
            raise

        return order

    async def update_status(
        self,
        order: Order,
        new_status: OrderStatus,
        session: AsyncSession,
        send_notification: bool = True
    ) -> Order:
        """
        Update order status (admin operation).

        Args:
            order: Order object to update
            new_status: New status
            session: Database session
            send_notification: Whether to send email notification

        Returns:
            Updated Order object
        """
        old_status = order.status.value
        order.status = new_status
        try:
            await session.commit()
            await session.refresh(order)

            # Send email notification if status changed
            if send_notification and old_status != new_status.value:
                try:
                    email_sent = send_order_status_update_email(
                        order,
                        old_status
                    )
                    if email_sent:
                        logger.info(
                            f'Status update email sent for order '
                            f'{order.order_number}'
                        )
                    else:
                        logger.warning(
                            f'Failed to send status update email for order '
                            f'{order.order_number}'
                        )
                except Exception as e:
                    logger.error(
                        f'Error sending status update email for order '
                        f'{order.order_number}: {str(e)}',
                        exc_info=True
                    )
        except Exception:
            await session.rollback()
            raise

        return order

    async def check_user_owns_order(
        self,
        order_id: int,
        user_id: int,
        session: AsyncSession
    ) -> bool:
        """
        Check if user owns the order.

        Args:
            order_id: Order ID
            user_id: User ID
            session: Database session

        Returns:
            True if user owns the order, False otherwise
        """
        result = await session.execute(
            select(Order.id)
            .where(Order.id == order_id, Order.user_id == user_id)
        )
        return result.scalar() is not None


order_crud = CRUDOrder()
