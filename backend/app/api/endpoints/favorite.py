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

from app.core.config import settings
from app.core.constants import Constants
from app.core.db import get_async_session
from app.crud.favorite import favorite_crud
from app.schemas.favorite import (
    FavoriteItemAddResponse,
    FavoriteItemDeleteResponse,
    FavoriteItemResponse,
    FavoriteResponse,
)


router = APIRouter()


def get_or_create_session_id(
    session_id: Optional[str] = Cookie(
        None,
        alias=Constants.SESSION_COOKIE_NAME
    )
) -> str:
    '''
    Get existing session_id from cookie or create new one.

    Args:
        session_id: Session ID from cookie

    Returns:
        Session ID (existing or newly generated)
    '''
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id


def set_session_cookie(response: Response, session_id: str) -> None:
    '''
    Set session_id cookie in response WITHOUT SameSite restriction.

    This allows cookies to work across different ports on localhost
    (frontend on :5173, backend on :8000).

    Args:
        response: FastAPI response object
        session_id: Session ID to set
    '''
    # Set cookie for 30 days (same as favorite lifetime)
    max_age = (
        Constants.FAVORITE_SESSION_LIFETIME_DAYS * 24 * 60 * 60
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
    response_model=FavoriteResponse,
    summary='Get favorite list',
    description='Get current favorite list with all items'
)
async def get_favorites(
    response: Response,
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    '''
    Get or create favorite list for current session.

    Returns favorite list with all items, including product details.
    '''
    favorite = await favorite_crud.get_or_create_for_session(
        session_id,
        session
    )

    # Set session cookie if it's a new session
    set_session_cookie(response, session_id)

    # Calculate total items
    total_items = len(favorite.items)

    # Build response with enriched favorite items
    favorite_items_response = []
    for item in favorite.items:
        # Get main image for product
        main_image = None
        if item.product.images:
            main_image = next(
                (img.url for img in item.product.images if img.is_main),
                item.product.images[0].url if item.product.images else None
            )

        favorite_items_response.append(
            FavoriteItemResponse(
                id=item.id,
                product_id=item.product_id,
                product={
                    'id': item.product.id,
                    'name': item.product.name,
                    'price': item.product.price,
                    'main_image': main_image,
                    'part_number': item.product.part_number
                },
                created_at=item.created_at
            )
        )

    return FavoriteResponse(
        id=favorite.id,
        session_id=favorite.session_id,
        items=favorite_items_response,
        total_items=total_items,
        expires_at=favorite.expires_at,
        created_at=favorite.created_at,
        updated_at=favorite.updated_at
    )


@router.post(
    '/{product_id}',
    response_model=FavoriteItemAddResponse,
    status_code=status.HTTP_201_CREATED,
    summary='Add item to favorites',
    description='Add product to favorite list'
)
async def add_to_favorites(
    product_id: int,
    response: Response,
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    '''
    Add product to favorites.

    Raises 404 if product not found or 409 if already in favorites.
    '''
    favorite = await favorite_crud.get_or_create_for_session(
        session_id,
        session
    )

    # Set session cookie
    set_session_cookie(response, session_id)

    try:
        favorite_item = await favorite_crud.add_item(
            favorite=favorite,
            product_id=product_id,
            session=session
        )
    except ValueError as e:
        error_message = str(e)
        if 'already in favorites' in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message
            )

    # Get main image for product
    main_image = None
    if favorite_item.product.images:
        main_image = next(
            (img.url for img in favorite_item.product.images if img.is_main),
            (favorite_item.product.images[0].url
             if favorite_item.product.images else None)
        )

    item_response = FavoriteItemResponse(
        id=favorite_item.id,
        product_id=favorite_item.product_id,
        product={
            'id': favorite_item.product.id,
            'name': favorite_item.product.name,
            'price': favorite_item.product.price,
            'main_image': main_image,
            'part_number': favorite_item.product.part_number
        },
        created_at=favorite_item.created_at
    )

    return FavoriteItemAddResponse(
        message='Item added to favorites',
        product_id=product_id,
        item=item_response
    )


@router.delete(
    '/{product_id}',
    response_model=FavoriteItemDeleteResponse,
    summary='Remove item from favorites',
    description='Remove a specific product from favorites'
)
async def remove_from_favorites(
    product_id: int,
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    '''
    Remove product from favorites.

    Raises 404 if favorite list or item not found.
    '''
    favorite = await favorite_crud.get_by_session(session_id, session)

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Favorite list not found'
        )

    removed = await favorite_crud.remove_item(
        favorite=favorite,
        product_id=product_id,
        session=session
    )

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Product {product_id} not found in favorites'
        )

    return FavoriteItemDeleteResponse(
        message='Item removed from favorites',
        product_id=product_id
    )
