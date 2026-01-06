from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status
)
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.core.csrf import verify_csrf_token
from app.core.db import get_async_session
from app.core.limiter import limiter
from app.core.user import current_superuser, current_user
from app.crud.cart import cart_crud
from app.crud.order import order_crud
from app.models.order import OrderStatus
from app.models.user import User
from app.schemas.order import (
    OrderCancelResponse,
    OrderCreate,
    OrderCreateResponse,
    OrderItemResponse,
    OrderListItem,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
    ProductInOrder,
)
from app.utils import (
    send_order_confirmation_email,
    send_order_status_update_email
)


router = APIRouter()


@router.post(
    '/',
    response_model=OrderCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary='Create order from cart',
    description='Create new order from current user cart'
)
@limiter.limit('10/hour')
async def create_order(
    order_data: OrderCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Create order from user's cart.

    Requirements:
    - User must be authenticated
    - Cart must not be empty
    - All cart items must have valid products

    Process:
    1. Validates cart is not empty
    2. Creates order with customer information
    3. Converts cart items to order items
    4. Clears cart after successful order creation

    Returns order ID and total price.
    """
    logger.bind(user_id=user.id).info(
        'Попытка создания заказа пользователем'
    )

    # Get user's cart with row-level lock to prevent race conditions
    # This ensures no concurrent order creation from the same cart
    cart = await cart_crud.get_by_user_locked(user.id, session)

    if not cart or not cart.items:
        logger.bind(user_id=user.id).warning(
            'Попытка создания заказа с пустой корзиной'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Cannot create order from empty cart'
        )

    # Create order from cart
    try:
        order = await order_crud.create_from_cart(
            user_id=user.id,
            cart_items=cart.items,
            order_data=order_data.model_dump(),
            session=session,
            send_email=False  # Don't send email synchronously
        )

        # Clear cart after successful order creation
        await cart_crud.clear_cart(cart=cart, session=session)

        # Send confirmation email in background (non-blocking)
        background_tasks.add_task(
            send_order_confirmation_email,
            order
        )

        logger.bind(user_id=user.id).info(
            f'Заказ создан успешно: order_id={order.id}, '
            f'total_price={order.total_price}'
        )

        return OrderCreateResponse(
            message='Order created successfully',
            order_id=order.id,
            order_number=order.order_number,
            total_price=order.total_price
        )
    except ValueError as e:
        await session.rollback()
        logger.bind(user_id=user.id).warning(
            f'Ошибка создания заказа: {str(e)}'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await session.rollback()
        logger.bind(user_id=user.id).exception(
            f'Неожиданная ошибка при создании заказа: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to create order'
        )


@router.get(
    '/',
    response_model=List[OrderListItem],
    summary='Get user orders',
    description='Get all orders for current user'
)
async def get_user_orders(
    skip: int = 0,
    limit: int = Constants.DEFAULT_LIMIT,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get all orders for authenticated user.

    Returns list of orders ordered by creation date (newest first).
    Supports pagination with skip and limit parameters.
    """
    logger.bind(user_id=user.id).debug(
        f'Запрос списка заказов: skip={skip}, limit={limit}'
    )

    orders = await order_crud.get_user_orders(
        user_id=user.id,
        session=session,
        skip=skip,
        limit=limit
    )

    logger.bind(user_id=user.id).info(
        f'Возвращено заказов: {len(orders)}'
    )

    # Convert to list response
    orders_list = [
        OrderListItem(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            total_items=order.total_items,
            total_price=order.total_price,
            created_at=order.created_at,
            user_id=order.user_id
        )
        for order in orders
    ]

    return orders_list


@router.get(
    '/{order_id}',
    response_model=OrderResponse,
    summary='Get order details',
    description='Get detailed information about specific order'
)
async def get_order_details(
    order_id: int,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get detailed order information.

    Returns complete order with all items and customer information.
    Regular users can only access their own orders.
    Superusers can access any order.
    """
    logger.bind(user_id=user.id).debug(
        f'Запрос деталей заказа: order_id={order_id}'
    )

    # Superuser can access any order
    if user.is_superuser:
        order = await order_crud.get_by_id(
            order_id=order_id,
            session=session
        )
    else:
        # Regular user can only access their own orders
        order = await order_crud.get_by_id_and_user(
            order_id=order_id,
            user_id=user.id,
            session=session
        )

    if not order:
        logger.bind(user_id=user.id).warning(
            f'Заказ не найден или не принадлежит пользователю: '
            f'order_id={order_id}'
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Order {order_id} not found'
        )

    # Build response with enriched order items
    order_items_response = []
    for item in order.items:
        # Get main image for product (if product still exists)
        main_image = None
        product_data = None

        if item.product:
            if item.product.images:
                main_image = next(
                    (img.url for img in item.product.images if img.is_main),
                    (item.product.images[0].url
                     if item.product.images else None)
                )

            product_data = ProductInOrder(
                id=item.product.id,
                name=item.product.name,
                price=item.product.price,
                main_image=main_image,
                part_number=item.product.part_number
            )

        order_items_response.append(
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_purchase=item.price_at_purchase,
                product_name=item.product_name,
                subtotal=item.quantity * item.price_at_purchase,
                product=product_data,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        )

    logger.bind(user_id=user.id).info(
        f'Возвращены детали заказа: order_id={order_id}'
    )

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        status=order.status,
        first_name=order.first_name,
        last_name=order.last_name,
        city=order.city,
        postal_code=order.postal_code,
        address=order.address,
        phone=order.phone,
        email=order.email,
        notes=order.notes,
        total_items=order.total_items,
        total_price=order.total_price,
        items=order_items_response,
        created_at=order.created_at,
        updated_at=order.updated_at
    )


@router.delete(
    '/{order_id}',
    response_model=OrderCancelResponse,
    summary='Cancel order',
    description='Cancel order (only if status allows)'
)
async def cancel_order(
    order_id: int,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Cancel order.

    Requirements:
    - User must own the order
    - Order status must be: created, updated, or confirmed
    - Already canceled or shipped orders cannot be canceled

    Returns updated order status.
    """
    logger.bind(user_id=user.id).info(
        f'Попытка отмены заказа: order_id={order_id}'
    )

    # Get order and verify ownership
    order = await order_crud.get_by_id_and_user(
        order_id=order_id,
        user_id=user.id,
        session=session
    )

    if not order:
        logger.bind(user_id=user.id).warning(
            f'Заказ не найден или не принадлежит пользователю: '
            f'order_id={order_id}'
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Order {order_id} not found'
        )

    # Try to cancel order
    try:
        canceled_order = await order_crud.cancel_order(
            order=order,
            session=session
        )

        logger.bind(user_id=user.id).info(
            f'Заказ отменен успешно: order_id={order_id}'
        )

        return OrderCancelResponse(
            message='Order canceled successfully',
            order_id=canceled_order.id,
            status=canceled_order.status
        )
    except ValueError as e:
        logger.bind(user_id=user.id).warning(
            f'Ошибка отмены заказа: {str(e)}'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await session.rollback()
        logger.bind(user_id=user.id).exception(
            f'Неожиданная ошибка при отмене заказа: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to cancel order'
        )


# ============ SUPERUSER ENDPOINTS ============


@router.get(
    '/admin/all',
    response_model=OrderListResponse,
    summary='Get all orders (superuser only)',
    description='Get all orders from all users with optional filtering'
)
async def get_all_orders(
    skip: int = Query(
        0,
        ge=0,
        description='Number of records to skip'
    ),
    limit: int = Query(
        Constants.DEFAULT_LIMIT,
        ge=1,
        le=Constants.MAX_LIMIT,
        description='Maximum records to return'
    ),
    status: Optional[OrderStatus] = Query(
        None,
        description='Filter by order status'
    ),
    user: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get all orders from all users (superuser only).

    Supports pagination and filtering by status.
    Returns list of orders ordered by creation date (newest first).
    """
    logger.bind(user_id=user.id).info(
        f'Superuser запрашивает все заказы: skip={skip}, '
        f'limit={limit}, status={status}'
    )

    orders = await order_crud.get_all_orders(
        session=session,
        skip=skip,
        limit=limit,
        status=status
    )

    # Get total count using efficient COUNT query
    total = await order_crud.get_orders_count(
        session=session,
        status=status
    )

    logger.bind(user_id=user.id).info(
        f'Возвращено заказов: {len(orders)} из {total}'
    )

    # Convert to list response
    orders_list = [
        OrderListItem(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            total_items=order.total_items,
            total_price=order.total_price,
            created_at=order.created_at,
            user_id=order.user_id
        )
        for order in orders
    ]

    return OrderListResponse(orders=orders_list, total=total)


@router.patch(
    '/admin/{order_id}/status',
    response_model=OrderResponse,
    summary='Update order status (superuser only)',
    description='Update status of any order'
)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    user: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Update order status (superuser only).

    Allows superuser to change order status to any value.
    """
    logger.bind(user_id=user.id).info(
        f'Superuser обновляет статус заказа: order_id={order_id}, '
        f'new_status={status_update.status}'
    )

    # Get order
    order = await order_crud.get_by_id(
        order_id=order_id,
        session=session
    )

    if not order:
        logger.bind(user_id=user.id).warning(
            f'Заказ не найден: order_id={order_id}'
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Order {order_id} not found'
        )

    # Update status
    try:
        old_status = order.status.value
        updated_order = await order_crud.update_status(
            order=order,
            new_status=status_update.status,
            session=session,
            send_notification=False  # Don't send email synchronously
        )

        # Send status update email in background (non-blocking)
        if old_status != updated_order.status.value:
            background_tasks.add_task(
                send_order_status_update_email,
                updated_order,
                old_status
            )

        logger.bind(user_id=user.id).info(
            f'Статус заказа обновлен: order_id={order_id}, '
            f'new_status={updated_order.status}'
        )

        # Build response with enriched order items
        order_items_response = []
        for item in updated_order.items:
            main_image = None
            product_data = None

            if item.product:
                if item.product.images:
                    main_image = next(
                        (
                            img.url
                            for img in item.product.images
                            if img.is_main
                        ),
                        (
                            item.product.images[0].url
                            if item.product.images else None
                        )
                    )

                product_data = ProductInOrder(
                    id=item.product.id,
                    name=item.product.name,
                    price=item.product.price,
                    main_image=main_image,
                    part_number=item.product.part_number
                )

            order_items_response.append(
                OrderItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price_at_purchase=item.price_at_purchase,
                    product_name=item.product_name,
                    subtotal=item.quantity * item.price_at_purchase,
                    product=product_data,
                    created_at=item.created_at,
                    updated_at=item.updated_at
                )
            )

        return OrderResponse(
            id=updated_order.id,
            order_number=updated_order.order_number,
            user_id=updated_order.user_id,
            status=updated_order.status,
            first_name=updated_order.first_name,
            last_name=updated_order.last_name,
            city=updated_order.city,
            postal_code=updated_order.postal_code,
            address=updated_order.address,
            phone=updated_order.phone,
            email=updated_order.email,
            notes=updated_order.notes,
            total_items=updated_order.total_items,
            total_price=updated_order.total_price,
            items=order_items_response,
            created_at=updated_order.created_at,
            updated_at=updated_order.updated_at
        )

    except Exception as e:
        await session.rollback()
        logger.bind(user_id=user.id).exception(
            f'Ошибка обновления статуса заказа: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to update order status'
        )
