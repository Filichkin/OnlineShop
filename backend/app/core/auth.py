"""
Custom authentication module for email/phone login.

Provides custom authentication strategy that allows users to login
with either email or phone number.
"""
import re
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Response, status
from fastapi_users.authentication import Strategy
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import Constants
from app.core.db import get_async_session
from app.core.messages import Messages
from app.core.user import get_jwt_strategy
from app.crud.cart import cart_crud
from app.crud.favorite import favorite_crud
from app.models.user import User
from app.schemas.user import UserLogin


async def authenticate_user(
    email_or_phone: str,
    password: str,
    session: AsyncSession
) -> Optional[User]:
    """
    Authenticate user by email or phone number.

    Args:
        email_or_phone: Email address or phone number
        password: User password
        session: Database session

    Returns:
        User object if authentication successful, None otherwise
    """
    # Determine if input is email or phone
    is_phone = re.match(Constants.PHONE_PATTERN, email_or_phone)

    # Query user by email or phone
    if is_phone:
        stmt = select(User).where(User.phone == email_or_phone)
    else:
        stmt = select(User).where(User.email == email_or_phone)

    result = await session.execute(stmt)
    user = result.scalars().first()

    if not user:
        return None

    # Verify password
    from fastapi_users.password import PasswordHelper
    password_helper = PasswordHelper()

    verified, updated_password_hash = (
        password_helper.verify_and_update(
            password,
            user.hashed_password
        )
    )

    if not verified:
        return None

    # Update password hash if needed (e.g., algorithm changed)
    if updated_password_hash is not None:
        user.hashed_password = updated_password_hash
        await session.commit()

    return user


async def merge_session_data(
    user_id: int,
    session_id: Optional[str],
    session: AsyncSession
) -> None:
    """
    Merge anonymous cart and favorites into user account on login.

    Args:
        user_id: Authenticated user ID (integer)
        session_id: Anonymous session ID (from cookie)
        session: Database session
    """
    if not session_id:
        return

    # Get or create user cart and favorites
    user_cart = await cart_crud.get_or_create_for_user(
        user_id,
        session
    )
    user_favorite = await favorite_crud.get_or_create_for_user(
        user_id,
        session
    )

    # Get session cart and favorites
    session_cart = await cart_crud.get_by_session(session_id, session)
    session_favorite = await favorite_crud.get_by_session(
        session_id,
        session
    )

    # Merge if session data exists and has items
    if session_cart:
        # Check if cart has items by checking length
        # Load items if needed
        cart_items_count = len(session_cart.items) if session_cart.items else 0
        if cart_items_count > 0:
            await cart_crud.merge_carts(session_cart, user_cart, session)
        else:
            # Cart exists but is empty, delete it
            from sqlalchemy import delete
            from app.models.cart import Cart
            await session.execute(
                delete(Cart).where(Cart.id == session_cart.id)
            )
            await session.commit()

    if session_favorite:
        # Check if favorite has items by checking length
        # Load items if needed
        fav_items_count = (
            len(session_favorite.items) if session_favorite.items else 0
        )
        if fav_items_count > 0:
            await favorite_crud.merge_favorites(
                session_favorite,
                user_favorite,
                session
            )
        else:
            # Favorite exists but is empty, delete it
            from sqlalchemy import delete
            from app.models.favorite import Favorite
            await session.execute(
                delete(Favorite).where(Favorite.id == session_favorite.id)
            )
            await session.commit()


async def login_user(
    credentials: UserLogin,
    response: Response,
    session_id: Optional[str] = Cookie(
        None,
        alias=Constants.SESSION_COOKIE_NAME
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Custom login endpoint that supports email or phone authentication.

    Also merges anonymous cart and favorites into user account.

    Args:
        credentials: User login credentials (email/phone + password)
        response: FastAPI response object
        session_id: Anonymous session ID from cookie
        session: Database session

    Returns:
        Authentication token and user data

    Raises:
        HTTPException: If authentication fails
    """
    # Authenticate user
    user = await authenticate_user(
        credentials.email_or_phone,
        credentials.password,
        session
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=Messages.INVALID_CREDENTIALS
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User account is not active'
        )

    # Merge session cart and favorites
    await merge_session_data(user.id, session_id, session)

    # Generate JWT token
    strategy: Strategy = get_jwt_strategy()
    token = await strategy.write_token(user)

    # Clear session cookie (user is now authenticated)
    response.delete_cookie(
        key=Constants.SESSION_COOKIE_NAME,
        path='/'
    )

    return {
        'access_token': token,
        'token_type': 'bearer',
        'user': {
            'id': user.id,
            'email': user.email,
            'phone': user.phone,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_of_birth': (
                user.date_of_birth.isoformat() if user.date_of_birth else None
            ),
            'city': user.city,
            'telegram_id': user.telegram_id,
            'address': user.address,
            'is_active': user.is_active,
            'is_superuser': user.is_superuser,
            'is_verified': user.is_verified
        }
    }
