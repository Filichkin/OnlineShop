from typing import Optional

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.utils import email_service, generate_password_by_pattern
from app.core.auth import login_user, merge_session_data
from app.core.config import Constants
from app.core.db import get_async_session
from app.core.messages import Messages
from app.core.user import auth_backend, current_user, fastapi_users
from app.models.user import User
from app.schemas.user import (
    PasswordResetRequest,
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate
)

router = APIRouter()

# Include default fastapi-users auth router (for JWT login)
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix=Constants.AUTH_PREFIX,
    tags=Constants.AUTH_TAGS,
)
# Note: We use custom registration endpoint below instead of:
# fastapi_users.get_register_router(UserRead, UserCreate)
users_router = fastapi_users.get_users_router(UserRead, UserUpdate)
users_router.routes = [
    route for route in users_router.routes
    if route.name != 'users:delete_user'
]
router.include_router(
    users_router,
    prefix=Constants.USERS_PREFIX,
    tags=Constants.USERS_TAGS,
)


# Custom registration endpoint that returns JWT token
@router.post(
    '/auth/register',
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    tags=Constants.AUTH_TAGS,
    summary='Register new user',
    description=(
        'Register a new user account. '
        'Returns JWT token for immediate authentication.'
    )
)
async def custom_register(
    user_create: UserCreate,
    response: Response,
    session_id: Optional[str] = Cookie(
        None,
        alias=Constants.SESSION_COOKIE_NAME
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Custom registration endpoint that creates user and returns JWT token.

    Also merges anonymous session cart and favorites into new user account.

    Args:
        user_create: User registration data
        response: FastAPI response object
        session_id: Anonymous session ID from cookie
        session: Database session

    Returns:
        JWT token and user data

    Raises:
        HTTPException: If registration fails (e.g., email/phone exists)
    """
    from app.core.user import get_user_db, get_user_manager, get_jwt_strategy
    from fastapi_users.exceptions import UserAlreadyExists

    # Get user database and user manager
    user_db_gen = get_user_db(session=session)
    user_db = await anext(user_db_gen)
    user_manager_gen = get_user_manager(user_db=user_db)
    user_manager = await anext(user_manager_gen)

    try:
        # Create user using fastapi-users manager
        user = await user_manager.create(
            user_create,
            safe=True,
            request=None
        )
    except UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='User with this email or phone already exists'
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Merge session cart and favorites into new user account
    await merge_session_data(user.id, session_id, session)

    # Generate JWT token
    strategy = get_jwt_strategy()
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
            'is_active': user.is_active,
            'is_superuser': user.is_superuser,
            'is_verified': user.is_verified
        }
    }


# Custom login endpoint with email/phone support and cart/favorites merge
@router.post(
    '/auth/login',
    response_model=dict,
    tags=Constants.AUTH_TAGS,
    summary='Login with email or phone',
    description=(
        'Authenticate user with email or phone number. '
        'Merges anonymous cart and favorites into user account.'
    )
)
async def custom_login(
    credentials: UserLogin,
    response: Response,
    session_id: Optional[str] = Cookie(
        None,
        alias=Constants.SESSION_COOKIE_NAME
    ),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Custom login endpoint supporting both email and phone authentication.

    Automatically merges anonymous session cart and favorites into
    user account on successful login.
    """
    return await login_user(credentials, response, session_id, session)


# Password reset endpoints
@router.post(
    '/auth/forgot-password',
    response_model=dict,
    tags=Constants.AUTH_TAGS,
    summary='Request password reset',
    description='Send password reset email to user'
)
async def forgot_password(
    request_data: PasswordResetRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Request password reset.

    Generates new password and sends it via email.
    """
    # Find user by email
    result = await session.execute(
        select(User).where(User.email == request_data.email)
    )
    user = result.scalars().first()

    if not user:
        # Don't reveal if email exists (security best practice)
        return {
            'message': Messages.PASSWORD_RESET_EMAIL_SENT
        }

    # Generate new password
    new_password = generate_password_by_pattern()

    # Hash new password
    from fastapi_users.password import PasswordHelper
    password_helper = PasswordHelper()
    user.hashed_password = password_helper.hash(new_password)

    await session.commit()

    # Send email with new password
    email_sent = await email_service.send_password_reset_email(
        to_email=user.email,
        new_password=new_password,
        user_name=user.first_name
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to send password reset email'
        )

    return {
        'message': Messages.PASSWORD_RESET_EMAIL_SENT
    }


# Get current user profile
@router.get(
    '/users/me',
    response_model=UserRead,
    tags=Constants.USERS_TAGS,
    summary='Get current user profile',
    description='Get authenticated user profile information'
)
async def get_current_user_profile(
    user: User = Depends(current_user)
):
    """
    Get current authenticated user profile.

    Returns all user information except password.
    """
    return user


# Update current user profile
@router.patch(
    '/users/me',
    response_model=UserRead,
    tags=Constants.USERS_TAGS,
    summary='Update current user profile',
    description='Update authenticated user profile information'
)
async def update_current_user_profile(
    user_update: UserUpdate,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Update current authenticated user profile.

    All fields are optional. Only provided fields will be updated.
    """
    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)

    # Check for phone uniqueness if updating phone
    if 'phone' in update_data and update_data['phone'] != user.phone:
        result = await session.execute(
            select(User).where(User.phone == update_data['phone'])
        )
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=Messages.PHONE_ALREADY_EXISTS
            )

    # Check for telegram_id uniqueness if updating telegram_id
    if ('telegram_id' in update_data and
            update_data['telegram_id'] and
            update_data['telegram_id'] != user.telegram_id):
        result = await session.execute(
            select(User).where(
                User.telegram_id == update_data['telegram_id']
            )
        )
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=Messages.TELEGRAM_ALREADY_EXISTS
            )

    # Update user attributes
    for field, value in update_data.items():
        if field not in ['password', 'email']:  # Email handled by fastapi-users  # noqa: E501
            setattr(user, field, value)

    await session.commit()
    await session.refresh(user)

    return user
