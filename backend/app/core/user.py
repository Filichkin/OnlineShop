import logging
from typing import Optional, Union

from fastapi import Depends, Request
from fastapi_users import (
    BaseUserManager,
    FastAPIUsers,
    IntegerIDMixin,
    InvalidPasswordException
)
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy
)
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import Constants
from app.core.messages import Messages
from app.core.db import get_async_session
from app.models.user import User
from app.schemas.user import UserCreate


async def get_user_db(
        session: AsyncSession = Depends(get_async_session)
):
    yield SQLAlchemyUserDatabase(session, User)


bearer_transport = BearerTransport(
    tokenUrl=Constants.JWT_TOKEN_URL
)


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.secret,
        lifetime_seconds=settings.jwt_token_lifetime,
    )


auth_backend = AuthenticationBackend(
    name=Constants.JWT_AUTH_BACKEND_NAME,
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):

    async def validate_password(
        self,
        password: str,
        user: Union[UserCreate, User],
    ) -> None:
        """
        Validate password strength and uniqueness.

        Ensures password doesn't contain email or phone number.
        """
        if len(password) < Constants.USER_PASSWORD_MIN_LEN:
            raise InvalidPasswordException(
                reason=Messages.PASSWORD_TOO_SHORT,
            )
        if user.email in password:
            raise InvalidPasswordException(
                reason=Messages.EMAIL_IN_PASSWORD
            )
        # Check if phone is in password (for UserCreate)
        if hasattr(user, 'phone') and user.phone in password:
            raise InvalidPasswordException(
                reason=Messages.PHONE_IN_PASSWORD
            )

    async def on_after_register(
        self,
        user: User,
        request: Optional[Request] = None
    ):
        """
        Hook called after successful user registration.

        Logs registration and can be extended for additional logic
        (e.g., sending welcome email, initializing user data).
        """
        logging.info(
            f'{Messages.USER_REGISTERED}'
            f'{user.email} (phone: {user.phone})'
        )


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)

fastapi_users = FastAPIUsers[User, int](
    get_user_manager,
    [auth_backend],
)

current_user = fastapi_users.current_user(
    active=True
)
current_superuser = fastapi_users.current_user(
    active=True,
    superuser=True
)
