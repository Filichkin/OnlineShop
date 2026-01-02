import asyncio
import random
from typing import Optional

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    status
)
from fastapi_users.exceptions import UserAlreadyExists
from fastapi_users.password import PasswordHelper
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.utils import email_service, generate_password_by_pattern
from app.core.auth import login_user, merge_session_data
from app.core.constants import Constants
from app.core.csrf import verify_csrf_token
from app.core.db import get_async_session
from app.core.messages import Messages
from app.core.user import (
    auth_backend,
    current_superuser,
    current_user,
    current_user_optional,
    fastapi_users
)
from app.core.limiter import limiter
from app.core.user import get_user_db, get_user_manager, get_jwt_strategy
from app.crud.user import user_crud
from app.models.user import User
from app.schemas.user import (
    PasswordResetRequest,
    UserCreate,
    UserDetail,
    UserListItem,
    UserListResponse,
    UserLogin,
    UserRead,
    UserUpdate,
    UserUpdateAdmin
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
@limiter.limit('3/hour')
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

    # Import CSRF utilities
    from app.core.csrf import generate_csrf_token, set_csrf_cookie
    from app.core.config import settings

    # Set JWT token in httpOnly cookie
    response.set_cookie(
        key='access_token',
        value=token,
        httponly=True,  # JavaScript cannot read - prevents XSS
        secure=settings.secure_cookies,  # True in production (HTTPS only)
        samesite='lax',  # CSRF protection
        max_age=settings.access_token_expire_minutes * 60,  # in seconds
        path='/',
    )

    # Generate and set CSRF token
    csrf_token = generate_csrf_token()
    set_csrf_cookie(response, csrf_token)

    # SECURITY: Delete session cookie to prevent session fixation attacks
    # User is now authenticated via JWT, no longer needs anonymous session
    # This ensures old session cannot be hijacked after authentication
    response.delete_cookie(
        key=Constants.SESSION_COOKIE_NAME,
        path='/'
    )

    # Return user data only (no token in response body)
    return {
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
        },
        'csrf_token': csrf_token  # For backward compatibility
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
@limiter.limit('5/minute')
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
@limiter.limit('3/hour')
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

    logger.info(
        f'Запрос сброса пароля: email={request_data.email}, '
        f'ip={request.client.host}'
    )

    # Add random jitter (0-50ms) to prevent timing attacks
    jitter = random.uniform(0.0, 0.05)

    # Find user by email
    user = await user_crud.get_user_by_email(
        email=request_data.email,
        session=session
    )

    if user:
        # Generate new password
        new_password = generate_password_by_pattern()

        # Hash new password
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
            # Add jitter and return success to prevent timing attack
            await asyncio.sleep(jitter)
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
        password_helper = PasswordHelper()
        password_helper.hash('dummy_password_for_timing')  # Hash operation

        # Simulate database commit time with variability
        await asyncio.sleep(0.01)

    # Add final jitter before response to make timing unpredictable
    await asyncio.sleep(jitter)

    # Always return success - don't reveal if email exists
    return {
        'message': Messages.PASSWORD_RESET_EMAIL_SENT
    }


# Get CSRF token endpoint
@router.get(
    '/csrf-token',
    response_model=dict,
    tags=Constants.AUTH_TAGS,
    summary='Get CSRF token',
    description='Get CSRF token for authenticated user'
)
async def get_csrf_token(
    response: Response,
    user: User = Depends(current_user)
):
    """
    Get CSRF token for authenticated user.

    Generates and returns a new CSRF token, setting it in both
    cookie and response body.

    Returns:
        CSRF token in response body and cookie
    """
    from app.core.csrf import generate_csrf_token, set_csrf_cookie

    logger.bind(user_id=user.id).debug(
        'Запрос CSRF токена пользователем'
    )

    csrf_token = generate_csrf_token()
    set_csrf_cookie(response, csrf_token)

    logger.bind(user_id=user.id).info(
        'CSRF токен успешно сгенерирован'
    )

    return {
        'csrf_token': csrf_token
    }


# Logout endpoint
@router.post(
    '/auth/logout',
    response_model=dict,
    tags=Constants.AUTH_TAGS,
    summary='Logout user',
    description='Logout user and clear authentication cookies'
)
async def logout(
    response: Response,
    user: Optional[User] = Depends(current_user_optional)
):
    """
    Logout user and clear all authentication cookies.

    Removes JWT access token and CSRF token cookies.
    Available for both authenticated and anonymous users
    to allow client-side cleanup.

    Returns:
        Success message
    """
    if user:
        logger.bind(user_id=user.id).info(
            f'Пользователь выходит из системы: {user.email}'
        )
    else:
        logger.info('Анонимный пользователь выполняет logout')

    # Delete JWT cookie
    response.delete_cookie(
        key='access_token',
        path='/'
    )

    # Delete CSRF cookie
    response.delete_cookie(
        key='csrf_token',
        path='/'
    )

    logger.debug('Cookies аутентификации удалены')

    return {
        'message': 'Successfully logged out'
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
@limiter.limit('10/minute')
async def update_current_user_profile(
    user_update: UserUpdate,
    request: Request,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
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

    # Filter out fields that should not be updated by regular users
    # Email and password handled separately by fastapi-users
    update_data = {
        k: v for k, v in update_data.items()
        if k not in ['password', 'email']
    }

    if not update_data:
        logger.bind(user_id=user.id).warning(
            'Попытка обновления профиля без данных'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No fields to update'
        )

    try:
        # Check for phone uniqueness if updating phone
        if 'phone' in update_data and update_data['phone'] != user.phone:
            existing_user = await user_crud.get_user_by_phone(
                phone=update_data['phone'],
                session=session
            )
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
            existing_user = await user_crud.get_user_by_telegram_id(
                telegram_id=update_data['telegram_id'],
                session=session
            )
            if existing_user:
                logger.warning(
                    f'User {user.id} attempted to use existing Telegram ID'
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=Messages.TELEGRAM_ALREADY_EXISTS
                )

        # Update user fields using CRUD method
        user = await user_crud.update_user_fields(
            user=user,
            update_data=update_data,
            session=session
        )

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


# ============ SUPERUSER ENDPOINTS ============


@router.get(
    '/admin/users',
    response_model=UserListResponse,
    tags=Constants.USERS_TAGS,
    summary='Get all users (superuser only)',
    description='Get paginated list of all users with basic information'
)
async def get_all_users(
    skip: int = Query(
        0,
        ge=0,
        description='Number of records to skip'
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description='Maximum records to return (max 100)'
    ),
    current_user: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get all users with pagination (superuser only).

    Returns list of users with basic information:
    - id, first_name, last_name, email, city, is_active, is_superuser

    Supports pagination with skip and limit parameters.
    Default page size is 20 users.
    """
    logger.bind(user_id=current_user.id).info(
        f'Superuser запрашивает список пользователей: '
        f'skip={skip}, limit={limit}'
    )

    # Get paginated users
    users = await user_crud.get_users_paginated(
        session=session,
        skip=skip,
        limit=limit
    )

    # Get total count
    total = await user_crud.get_total_users_count(session=session)

    logger.bind(user_id=current_user.id).info(
        f'Возвращено пользователей: {len(users)} из {total}'
    )

    # Convert to list response
    users_list = [
        UserListItem(
            id=u.id,
            first_name=u.first_name,
            last_name=u.last_name,
            email=u.email,
            city=u.city,
            is_active=u.is_active,
            is_superuser=u.is_superuser
        )
        for u in users
    ]

    return UserListResponse(users=users_list, total=total)


@router.get(
    '/admin/users/{user_id}',
    response_model=UserDetail,
    tags=Constants.USERS_TAGS,
    summary='Get user details (superuser only)',
    description='Get detailed information about specific user'
)
async def get_user_details(
    user_id: int,
    current_user: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Get detailed user information (superuser only).

    Returns all user fields including:
    - Basic info: id, email, first_name, last_name, phone
    - Profile: date_of_birth, city, telegram_id, address
    - Status: is_active, is_superuser, is_verified
    """
    logger.bind(user_id=current_user.id).info(
        f'Superuser запрашивает детали пользователя: user_id={user_id}'
    )

    user = await user_crud.get_user_by_id(
        user_id=user_id,
        session=session
    )

    if not user:
        logger.bind(user_id=current_user.id).warning(
            f'Пользователь не найден: user_id={user_id}'
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'User {user_id} not found'
        )

    logger.bind(user_id=current_user.id).info(
        f'Возвращены детали пользователя: user_id={user_id}'
    )

    return UserDetail(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        phone=user.phone,
        last_name=user.last_name,
        date_of_birth=user.date_of_birth,
        city=user.city,
        telegram_id=user.telegram_id,
        address=user.address,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        is_verified=user.is_verified
    )


@router.patch(
    '/admin/users/{user_id}',
    response_model=UserDetail,
    tags=Constants.USERS_TAGS,
    summary='Update user (superuser only)',
    description='Update any user field including is_active status'
)
@limiter.limit('20/minute')
async def update_user_by_admin(
    user_id: int,
    user_update: UserUpdateAdmin,
    request: Request,
    current_user: User = Depends(current_superuser),
    session: AsyncSession = Depends(get_async_session),
    _: None = Depends(verify_csrf_token)
):
    """
    Update user by admin (superuser only).

    Admin can update any user field including:
    - Profile fields: first_name, last_name, phone, email, etc.
    - Status fields: is_active, is_superuser, is_verified

    All fields are optional. Only provided fields will be updated.
    """
    logger.bind(user_id=current_user.id).info(
        f'Superuser обновляет пользователя: user_id={user_id}'
    )

    # Get user to update
    user = await user_crud.get_user_by_id(
        user_id=user_id,
        session=session
    )

    if not user:
        logger.bind(user_id=current_user.id).warning(
            f'Пользователь не найден: user_id={user_id}'
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'User {user_id} not found'
        )

    # Get update data and filter out None values for non-nullable fields
    update_data = user_update.model_dump(exclude_unset=True)

    # Save current_user.id to avoid accessing it after session issues
    current_user_id = current_user.id

    # Remove None values for fields that have NOT NULL constraint in DB
    # Fields: first_name, phone, email, hashed_password,
    # is_active, is_superuser, is_verified
    non_nullable_fields = [
        'first_name', 'phone', 'email', 'hashed_password',
        'is_active', 'is_superuser', 'is_verified'
    ]
    for field in non_nullable_fields:
        if field in update_data and update_data[field] is None:
            del update_data[field]

    if not update_data:
        logger.bind(user_id=current_user_id).warning(
            f'Попытка обновления пользователя без данных: '
            f'user_id={user_id}'
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='No fields to update'
        )

    try:
        # Check for email uniqueness if updating email
        if 'email' in update_data and update_data['email'] != user.email:
            existing_user = await user_crud.get_user_by_email(
                email=update_data['email'],
                session=session
            )
            if existing_user:
                logger.bind(user_id=current_user_id).warning(
                    f'Попытка использовать существующий email: '
                    f'{update_data["email"]}'
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=Messages.EMAIL_ALREADY_EXISTS
                )

        # Check for phone uniqueness if updating phone
        if (
            'phone' in update_data and
            update_data['phone'] is not None and
            update_data['phone'] != user.phone
        ):
            existing_user = await user_crud.get_user_by_phone(
                phone=update_data['phone'],
                session=session
            )
            if existing_user:
                logger.bind(user_id=current_user_id).warning(
                    f'Попытка использовать существующий телефон: '
                    f'{update_data["phone"]}'
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=Messages.PHONE_ALREADY_EXISTS
                )

        # Check for telegram_id uniqueness if updating telegram_id
        if (
            'telegram_id' in update_data and
            update_data['telegram_id'] is not None and
            update_data['telegram_id'] != user.telegram_id
        ):
            existing_user = await user_crud.get_user_by_telegram_id(
                telegram_id=update_data['telegram_id'],
                session=session
            )
            if existing_user:
                logger.bind(user_id=current_user_id).warning(
                    f'Попытка использовать существующий Telegram ID: '
                    f'{update_data["telegram_id"]}'
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=Messages.TELEGRAM_ALREADY_EXISTS
                )

        # Update user fields using CRUD method
        user = await user_crud.update_user_fields(
            user=user,
            update_data=update_data,
            session=session
        )

        logger.bind(user_id=current_user_id).info(
            f'Пользователь успешно обновлен: user_id={user_id}'
        )

        return UserDetail(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            phone=user.phone,
            last_name=user.last_name,
            date_of_birth=user.date_of_birth,
            city=user.city,
            telegram_id=user.telegram_id,
            address=user.address,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            is_verified=user.is_verified
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        await session.rollback()
        logger.bind(user_id=current_user_id).exception(
            f'Ошибка обновления пользователя {user_id}: {e}'
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to update user'
        )
