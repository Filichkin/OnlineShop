import uuid
from typing import Optional

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.core.db import get_async_session
from app.crud.cart import cart_crud
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

    Args:
        session_id: Session ID from cookie

    Returns:
        Session ID (existing or newly generated)
    """
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id


def set_session_cookie(response: Response, session_id: str) -> None:
    """
    Set session_id cookie in response WITHOUT SameSite restriction.

    This allows cookies to work across different ports on localhost
    (frontend on :5173, backend on :8000).

    Args:
        response: FastAPI response object
        session_id: Session ID to set
    """
    # Set cookie for 30 days (same as cart lifetime)
    max_age = (
        Constants.CART_SESSION_LIFETIME_DAYS * 24 * 60 * 60
    )

    # Cookie parameters for same-origin requests (via proxy)
    response.set_cookie(
        key=Constants.SESSION_COOKIE_NAME,
        value=session_id,
        max_age=max_age,
        httponly=True,
        path='/',
        secure=False,  # HTTP is OK for same-origin
        samesite='lax',  # Standard protection for same-origin
    )


@router.get(
    '/',
    response_model=CartResponse,
    summary='Get shopping cart',
    description='Get current shopping cart with all items'
)
async def get_cart(
    response: Response,
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get or create shopping cart for current session.

    Returns cart with all items, including product details.
    """
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
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get cart summary (total items, price, count).

    Lightweight endpoint for cart icon badge.
    """
    cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
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
async def add_item_to_cart(
    item_data: CartItemCreate,
    response: Response,
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Add product to cart or update quantity if already exists.

    If product is already in cart, quantity will be increased.
    """
    cart = await cart_crud.get_or_create_for_session(
        session_id,
        session
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
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
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
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Update cart item quantity.

    Raises 404 if cart or item not found.
    """
    cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
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
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Remove product from cart.

    Raises 404 if cart or item not found.
    """
    cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Product {product_id} not found in cart'
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
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Clear all items from cart.

    Returns 404 if cart not found.
    """
    cart = await cart_crud.get_by_session(session_id, session)

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Cart not found'
        )

    items_removed = await cart_crud.clear_cart(
        cart=cart,
        session=session
    )

    return CartClearResponse(
        message='Cart cleared successfully',
        items_removed=items_removed
    )
