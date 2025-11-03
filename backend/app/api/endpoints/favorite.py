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
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import Constants
from app.core.db import get_async_session
from app.core.user import current_user_optional
from app.crud.favorite import favorite_crud
from app.models.user import User
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
    Set session_id cookie in response with security flags.

    Security features:
    - httponly: Prevents JavaScript access (XSS protection)
    - secure: HTTPS only in production (set via environment)
    - samesite: CSRF protection
    - max_age: Cookie expires after configured lifetime

    Args:
        response: FastAPI response object
        session_id: Session ID to set
    '''
    # Set cookie for 30 days (same as favorite lifetime)
    max_age = (
        Constants.FAVORITE_SESSION_LIFETIME_DAYS * 24 * 60 * 60
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


@router.get(
    '/',
    response_model=FavoriteResponse,
    summary='Get favorite list',
    description='Get current favorite list with all items'
)
async def get_favorites(
    response: Response,
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    '''
    Get or create favorite list for current user or session.

    For authenticated users: returns user's favorites (by user_id).
    For anonymous users: returns session favorites (by session_id).

    Returns favorite list with all items, including product details.
    '''
    if user:
        logger.bind(user_id=user.id).debug('Запрос избранного пользователя')
    else:
        logger.debug(f'Запрос избранного сессии: session_id={session_id}')

    # Use user favorites for authenticated users,
    # session favorites for anonymous
    if user:
        favorite = await favorite_crud.get_or_create_for_user(user.id, session)
    else:
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

    if user:
        logger.bind(user_id=user.id).info(
            f'Возвращено избранное: total_items={total_items}'
        )
    else:
        logger.info(
            f'Возвращено избранное сессии: '
            f'session_id={session_id}, total_items={total_items}'
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
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    '''
    Add product to favorites.

    For authenticated users: adds to user's favorites (by user_id).
    For anonymous users: adds to session favorites (by session_id).

    Raises 404 if product not found or 409 if already in favorites.
    '''
    if user:
        logger.bind(user_id=user.id).info(
            f'Попытка добавления в избранное: product_id={product_id}'
        )
    else:
        logger.info(
            f'Попытка добавления в избранное сессии: '
            f'product_id={product_id}, session_id={session_id}'
        )

    # Use user favorites for authenticated users,
    # session favorites for anonymous
    if user:
        favorite = await favorite_crud.get_or_create_for_user(user.id, session)
    else:
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
            if user:
                logger.bind(user_id=user.id).warning(
                    f'Продукт уже в избранном: product_id={product_id}'
                )
            else:
                logger.warning(
                    f'Продукт уже в избранном сессии: '
                    f'product_id={product_id}'
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_message
            )
        else:
            if user:
                logger.bind(user_id=user.id).warning(
                    f'Продукт не найден при добавлении в избранное: '
                    f'product_id={product_id}'
                )
            else:
                logger.warning(
                    f'Продукт не найден: product_id={product_id}'
                )
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

    if user:
        logger.bind(user_id=user.id).info(
            f'Продукт добавлен в избранное: product_id={product_id}'
        )
    else:
        logger.info(
            f'Продукт добавлен в избранное сессии: '
            f'product_id={product_id}'
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
    user: Optional[User] = Depends(current_user_optional),
    session_id: str = Depends(get_or_create_session_id),
    session: AsyncSession = Depends(get_async_session)
):
    '''
    Remove product from favorites.

    For authenticated users: removes from user's favorites (by user_id).
    For anonymous users: removes from session favorites (by session_id).

    Raises 404 if favorite list or item not found.
    '''
    if user:
        logger.bind(user_id=user.id).info(
            f'Попытка удаления из избранного: product_id={product_id}'
        )
    else:
        logger.info(
            f'Попытка удаления из избранного сессии: '
            f'product_id={product_id}'
        )

    # Use user favorites for authenticated users,
    # session favorites for anonymous
    if user:
        favorite = await favorite_crud.get_by_user(user.id, session)
    else:
        favorite = await favorite_crud.get_by_session(session_id, session)

    if not favorite:
        if user:
            logger.bind(user_id=user.id).warning(
                'Список избранного не найден'
            )
        else:
            logger.warning('Список избранного сессии не найден')
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
        if user:
            logger.bind(user_id=user.id).warning(
                f'Продукт не найден в избранном: product_id={product_id}'
            )
        else:
            logger.warning(
                f'Продукт не найден в избранном сессии: '
                f'product_id={product_id}'
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Product {product_id} not found in favorites'
        )

    if user:
        logger.bind(user_id=user.id).info(
            f'Продукт удален из избранного: product_id={product_id}'
        )
    else:
        logger.info(
            f'Продукт удален из избранного сессии: '
            f'product_id={product_id}'
        )

    return FavoriteItemDeleteResponse(
        message='Item removed from favorites',
        product_id=product_id
    )
