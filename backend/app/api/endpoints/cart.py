import uuid
from typing import Optional

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Request,
    Response,
    status
)
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import Constants
from app.core.csrf import verify_csrf_token
from app.core.db import get_async_session
from app.core.limiter import limiter
from app.core.user import current_user_optional
from app.crud.cart import cart_crud
from app.models.user import User
from app.schemas.cart import (
    CartClearResponse,
    CartItemCreate,
    CartItemDeleteResponse,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
    CartSummary,
)


router = APIRouter()


def get_or_create_session_id(
    session_id: Optional[str] = Cookie(
        None,
        alias=Constants.SESSION_COOKIE_NAME
    )
) -> str:
    """
    Get existing session_id from cookie or create new one.

    Validates that session_id is a valid UUID format to prevent
    injection attacks and ensure data integrity.

    SECURITY: Invalid session IDs are rejected instead of silently
    creating new ones to prevent session fixation attacks.

    Args:
        session_id: Session ID from cookie

    Returns:
        Session ID (existing or newly generated)

    Raises:
        HTTPException: 400 if session_id format is invalid
    """
    if session_id:
        try:
            # Validate that session_id is a valid UUID
            uuid.UUID(session_id)
            return session_id
        except ValueError:
            # Don't log the session_id to prevent log injection
            logger.warning('Invalid session_id format received')
            # Reject invalid session ID with clear error
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Invalid session ID format'
            )

    # No session_id provided, generate new one
    return str(uuid.uuid4())


def set_session_cookie(response: Response, session_id: str) -> None:
    """
    Set session_id cookie in response with security flags.

    Also generates and sets CSRF token for anonymous users.

    Security features:
    - httponly: Prevents JavaScript access (XSS protection)
    - secure: HTTPS only in production (set via environment)
    - samesite: CSRF protection
    - max_age: Cookie expires after configured lifetime

    Args:
        response: FastAPI response object
        session_id: Session ID to set
    """
    from app.core.csrf import generate_csrf_token, set_csrf_cookie

    # Set cookie for 30 days (same as cart lifetime)
    max_age = (
        Constants.CART_SESSION_LIFETIME_DAYS * 24 * 60 * 60
    )

    # Determine if secure flag should be enabled
    # In production with HTTPS, secure=True; in development, secure=False
    is_production = settings.environment == 'production'
    secure_flag = settings.cookie_secure and is_production

    # Cookie parameters with security flags
    response.set_cookie(
        key=Constants.SESSION_COOKIE_NAME,
        value=session_id,
        max_age=max_age,
        httponly=settings.cookie_httponly,
        path='/',
        secure=secure_flag,
        samesite=settings.cookie_samesite,
    )

    # Generate and set CSRF token for session (for anonymous users)
    csrf_token = generate_csrf_token()
    set_csrf_cookie(response, csrf_token)


@router.get(
    '/',
    response_model=CartResponse,
    summary='Get shopping cart',
    description='Get current shopping cart with all items'
)
async def get_cart(
    response: Response,
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get or create shopping cart for current user or session.

    For authenticated users: returns user's cart (by user_id).
    For anonymous users: returns session cart (by session_id).

    Returns cart with all items, including product details.
    """
    if user:
        logger.bind(user_id=user.id).debug('Запрос корзины пользователя')
    else:
        logger.debug(f'Запрос корзины сессии: session_id={session_id}')

    # Use user cart for authenticated users, session cart for anonymous
    if user:
        cart = await cart_crud.get_or_create_for_user(user.id, session)
    else:
        cart = await cart_crud.get_or_create_for_session(
            session_id,
            session
        )

    # Set session cookie if it's a new session
    set_session_cookie(response, session_id)

    # Calculate totals
    total_items = sum(item.quantity for item in cart.items)
    total_price = sum(
        item.quantity * item.price_at_addition for item in cart.items
    )

    # Build response with enriched cart items
    cart_items_response = []
    for item in cart.items:
        # Get main image for product
        main_image = None
        if item.product.images:
            main_image = next(
                (img.url for img in item.product.images if img.is_main),
                item.product.images[0].url if item.product.images else None
            )

        cart_items_response.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_addition=item.price_at_addition,
                subtotal=item.quantity * item.price_at_addition,
                product={
                    'id': item.product.id,
                    'name': item.product.name,
                    'price': item.product.price,
                    'main_image': main_image,
                    'part_number': item.product.part_number
                },
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        )

    if user:
        logger.bind(user_id=user.id).info(
            f'Возвращена корзина: total_items={total_items}, '
            f'total_price={total_price}'
        )
    else:
        logger.info(
            f'Возвращена корзина сессии: session_id={session_id}, '
            f'total_items={total_items}, total_price={total_price}'
        )

    return CartResponse(
        id=cart.id,
        session_id=cart.session_id,
        items=cart_items_response,
        total_items=total_items,
        total_price=total_price,
        expires_at=cart.expires_at,
        created_at=cart.created_at,
        updated_at=cart.updated_at
    )


@router.get(
    '/summary',
    response_model=CartSummary,
    summary='Get cart summary',
    description='Get brief cart information for cart icon'
)
async def get_cart_summary(
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get cart summary (total items, price, count).

    For authenticated users: returns user's cart summary (by user_id).
    For anonymous users: returns session cart summary (by session_id).

    Lightweight endpoint for cart icon badge.
    """
    if user:
        logger.bind(user_id=user.id).debug('Запрос сводки корзины')
    else:
        logger.debug('Запрос сводки корзины сессии')

    # Use user cart for authenticated users, session cart for anonymous
    if user:
        cart = await cart_crud.get_by_user(user.id, session)
    else:
        cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
        if user:
            logger.bind(user_id=user.id).debug('Корзина пуста')
        else:
            logger.debug('Корзина сессии пуста')
        return CartSummary(
            total_items=0,
            total_price=0.0,
            items_count=0
        )

    total_items = sum(item.quantity for item in cart.items)
    total_price = sum(
        item.quantity * item.price_at_addition for item in cart.items
    )
    items_count = len(cart.items)

    if user:
        logger.bind(user_id=user.id).debug(
            f'Сводка корзины: items={total_items}, price={total_price}'
        )
    else:
        logger.debug(
            f'Сводка корзины сессии: items={total_items}, '
            f'price={total_price}'
        )

    return CartSummary(
        total_items=total_items,
        total_price=total_price,
        items_count=items_count
    )


@router.post(
    '/items',
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary='Add item to cart',
    description='Add product to cart or update quantity if exists'
)
@limiter.limit('30/minute')
async def add_item_to_cart(
    item_data: CartItemCreate,
    request: Request,
    response: Response,
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Add product to cart or update quantity if already exists.

    For authenticated users: adds to user's cart (by user_id).
    For anonymous users: adds to session cart (by session_id).

    If product is already in cart, quantity will be increased.
    """
    # Use user cart for authenticated users, session cart for anonymous
    if user:
        cart = await cart_crud.get_or_create_for_user(user.id, session)
        logger.bind(user_id=user.id).debug(
            f'Добавление товара в корзину пользователя: '
            f'product_id={item_data.product_id}, qty={item_data.quantity}'
        )
    else:
        cart = await cart_crud.get_or_create_for_session(
            session_id,
            session
        )
        logger.debug(
            f'Добавление товара в корзину сессии: '
            f'product_id={item_data.product_id}, qty={item_data.quantity}'
        )

    # Set session cookie
    set_session_cookie(response, session_id)

    try:
        cart_item = await cart_crud.add_item(
            cart=cart,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            session=session
        )
        if user:
            logger.bind(user_id=user.id).info(
                f'Товар добавлен в корзину: product_id={item_data.product_id}'
            )
        else:
            logger.info(
                f'Товар добавлен в корзину сессии: '
                f'product_id={item_data.product_id}'
            )
    except ValueError as e:
        await session.rollback()
        logger.warning(f'Ошибка добавления товара в корзину: {str(e)}')
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        await session.rollback()
        logger.exception(
            f'Неожиданная ошибка при добавлении товара в корзину: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to add item to cart'
        )

    # Get main image for product
    main_image = None
    if cart_item.product.images:
        main_image = next(
            (img.url for img in cart_item.product.images if img.is_main),
            (cart_item.product.images[0].url
             if cart_item.product.images else None)
        )

    return CartItemResponse(
        id=cart_item.id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        price_at_addition=cart_item.price_at_addition,
        subtotal=cart_item.quantity * cart_item.price_at_addition,
        product={
            'id': cart_item.product.id,
            'name': cart_item.product.name,
            'price': cart_item.product.price,
            'main_image': main_image,
            'part_number': cart_item.product.part_number
        },
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at
    )


@router.patch(
    '/items/{product_id}',
    response_model=CartItemResponse,
    summary='Update cart item quantity',
    description='Update quantity of a specific cart item'
)
async def update_cart_item(
    product_id: int,
    item_data: CartItemUpdate,
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Update cart item quantity.

    For authenticated users: updates item in user's cart (by user_id).
    For anonymous users: updates item in session cart (by session_id).

    Raises 404 if cart or item not found.
    """
    if user:
        logger.bind(user_id=user.id).info(
            f'Попытка обновления товара в корзине: '
            f'product_id={product_id}, quantity={item_data.quantity}'
        )
    else:
        logger.info(
            f'Попытка обновления товара в корзине сессии: '
            f'product_id={product_id}, quantity={item_data.quantity}'
        )

    # Use user cart for authenticated users, session cart for anonymous
    if user:
        cart = await cart_crud.get_by_user(user.id, session)
    else:
        cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
        if user:
            logger.bind(user_id=user.id).warning('Корзина не найдена')
        else:
            logger.warning('Корзина сессии не найдена')
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Cart not found'
        )

    cart_item = await cart_crud.update_item_quantity(
        cart=cart,
        product_id=product_id,
        quantity=item_data.quantity,
        session=session
    )

    if not cart_item:
        if user:
            logger.bind(user_id=user.id).warning(
                f'Товар не найден в корзине: product_id={product_id}'
            )
        else:
            logger.warning(
                f'Товар не найден в корзине сессии: '
                f'product_id={product_id}'
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Product {product_id} not found in cart'
        )

    # Get main image for product
    main_image = None
    if cart_item.product.images:
        main_image = next(
            (img.url for img in cart_item.product.images if img.is_main),
            (cart_item.product.images[0].url
             if cart_item.product.images else None)
        )

    if user:
        logger.bind(user_id=user.id).info(
            f'Товар в корзине обновлен: product_id={product_id}, '
            f'quantity={cart_item.quantity}'
        )
    else:
        logger.info(
            f'Товар в корзине сессии обновлен: product_id={product_id}, '
            f'quantity={cart_item.quantity}'
        )

    return CartItemResponse(
        id=cart_item.id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        price_at_addition=cart_item.price_at_addition,
        subtotal=cart_item.quantity * cart_item.price_at_addition,
        product={
            'id': cart_item.product.id,
            'name': cart_item.product.name,
            'price': cart_item.product.price,
            'main_image': main_image,
            'part_number': cart_item.product.part_number
        },
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at
    )


@router.delete(
    '/items/{product_id}',
    response_model=CartItemDeleteResponse,
    summary='Remove item from cart',
    description='Remove a specific product from cart'
)
async def remove_cart_item(
    product_id: int,
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Remove product from cart.

    For authenticated users: removes from user's cart (by user_id).
    For anonymous users: removes from session cart (by session_id).

    Raises 404 if cart or item not found.
    """
    if user:
        logger.bind(user_id=user.id).info(
            f'Попытка удаления товара из корзины: product_id={product_id}'
        )
    else:
        logger.info(
            f'Попытка удаления товара из корзины сессии: '
            f'product_id={product_id}'
        )

    # Use user cart for authenticated users, session cart for anonymous
    if user:
        cart = await cart_crud.get_by_user(user.id, session)
    else:
        cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
        if user:
            logger.bind(user_id=user.id).warning('Корзина не найдена')
        else:
            logger.warning('Корзина сессии не найдена')
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Cart not found'
        )

    removed = await cart_crud.remove_item(
        cart=cart,
        product_id=product_id,
        session=session
    )

    if not removed:
        if user:
            logger.bind(user_id=user.id).warning(
                f'Товар не найден в корзине: product_id={product_id}'
            )
        else:
            logger.warning(
                f'Товар не найден в корзине сессии: '
                f'product_id={product_id}'
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Product {product_id} not found in cart'
        )

    if user:
        logger.bind(user_id=user.id).info(
            f'Товар удален из корзины: product_id={product_id}'
        )
    else:
        logger.info(
            f'Товар удален из корзины сессии: product_id={product_id}'
        )

    return CartItemDeleteResponse(
        message='Item removed from cart',
        product_id=product_id
    )


@router.delete(
    '/',
    response_model=CartClearResponse,
    summary='Clear cart',
    description='Remove all items from cart'
)
async def clear_cart(
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Clear all items from cart.

    For authenticated users: clears user's cart (by user_id).
    For anonymous users: clears session cart (by session_id).

    Returns 404 if cart not found.
    """
    if user:
        logger.bind(user_id=user.id).info('Попытка очистки корзины')
    else:
        logger.info('Попытка очистки корзины сессии')

    # Use user cart for authenticated users, session cart for anonymous
    if user:
        cart = await cart_crud.get_by_user(user.id, session)
    else:
        cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
        if user:
            logger.bind(user_id=user.id).warning('Корзина не найдена')
        else:
            logger.warning('Корзина сессии не найдена')
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Cart not found'
        )

    items_removed = await cart_crud.clear_cart(
        cart=cart,
        session=session
    )

    if user:
        logger.bind(user_id=user.id).info(
            f'Корзина очищена: items_removed={items_removed}'
        )
    else:
        logger.info(
            f'Корзина сессии очищена: items_removed={items_removed}'
        )

    return CartClearResponse(
        message='Cart cleared successfully',
        items_removed=items_removed
    )
