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
    request: Request,
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
        request: FastAPI request object
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

    logger.info(
        f'Попытка регистрации: email={user_create.email}, '
        f'phone={user_create.phone}, ip={request.client.host}'
    )

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
        logger.bind(user_id=user.id).info(
            f'Пользователь успешно зарегистрирован: {user.email}'
        )
    except UserAlreadyExists:
        logger.warning(
            f'Ошибка регистрации: пользователь с таким email или '
            f'телефоном уже существует ({user_create.email})'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='User with this email or phone already exists'
        )
    except Exception as e:
        logger.error(
            f'Ошибка при регистрации пользователя {user_create.email}: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Merge session cart and favorites into new user account
    await merge_session_data(user.id, session_id, session)

    # Generate JWT token
    strategy = get_jwt_strategy()
    token = await strategy.write_token(user)

    # SECURITY: Delete session cookie to prevent session fixation attacks
    # User is now authenticated via JWT, no longer needs anonymous session
    # This ensures old session cannot be hijacked after authentication
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
    request: Request,
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
    logger.info(
        f'Попытка входа: {credentials.email_or_phone}, '
        f'ip={request.client.host}'
    )
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
    request: Request,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Request password reset.

    Generates new password and sends it via email.

    Security: Uses constant-time response to prevent email enumeration
    through timing attacks. Always returns success message regardless
    of whether email exists.
    """
    import asyncio

    logger.info(
        f'Запрос сброса пароля: email={request_data.email}, '
        f'ip={request.client.host}'
    )

    # Find user by email
    result = await session.execute(
        select(User).where(User.email == request_data.email)
    )
    user = result.scalars().first()

    if user:
        # Generate new password
        new_password = generate_password_by_pattern()

        # Hash new password
        from fastapi_users.password import PasswordHelper
        password_helper = PasswordHelper()
        user.hashed_password = password_helper.hash(new_password)

        try:
            await session.commit()
        except Exception as e:
            await session.rollback()
            # Log error but don't reveal to user
            logger.error(
                f'Failed to update password for user {user.email}: {e}',
                exc_info=True
            )
            # Still return success to prevent timing attack
            return {
                'message': Messages.PASSWORD_RESET_EMAIL_SENT
            }

        # Send email with new password
        try:
            await email_service.send_password_reset_email(
                to_email=user.email,
                new_password=new_password,
                user_name=user.first_name
            )
            logger.bind(user_id=user.id).info(
                f'Email сброса пароля отправлен: {user.email}'
            )
        except Exception as e:
            # Log error but don't reveal to user
            logger.bind(user_id=user.id).exception(
                f'Ошибка отправки email сброса пароля '
                f'для {user.email}: {e}'
            )
    else:
        # Perform dummy operations to match timing of real reset
        # This prevents timing attacks that could enumerate valid emails
        generate_password_by_pattern()  # Generate password (not used)

        from fastapi_users.password import PasswordHelper
        password_helper = PasswordHelper()
        password_helper.hash('dummy_password_for_timing')  # Hash operation

        # Simulate database commit time
        await asyncio.sleep(0.01)

    # Always return success - don't reveal if email exists
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
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get current authenticated user profile.

    Returns all user information except password.
    """
    logger.bind(user_id=user.id).debug(
        f'Запрос профиля пользователя: {user.email}'
    )
    # Ensure user data is refreshed from database
    await session.refresh(user)
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
    logger.bind(user_id=user.id).info(
        f'Попытка обновления профиля пользователя: {user.email}'
    )

    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)

    try:
        # Check for phone uniqueness if updating phone
        if 'phone' in update_data and update_data['phone'] != user.phone:
            result = await session.execute(
                select(User).where(User.phone == update_data['phone'])
            )
            existing_user = result.scalars().first()
            if existing_user:
                logger.warning(
                    f'User {user.id} attempted to use existing phone number'
                )
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
                logger.warning(
                    f'User {user.id} attempted to use existing Telegram ID'
                )
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
        logger.bind(user_id=user.id).info(
            f'Профиль пользователя успешно обновлен: {user.email}'
        )
        return user

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        await session.rollback()
        logger.bind(user_id=user.id).exception(
            f'Ошибка обновления профиля пользователя {user.id}: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to update user profile'
        )
