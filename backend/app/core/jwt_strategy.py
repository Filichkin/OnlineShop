from typing import Optional

import jwt
from fastapi_users.authentication import JWTStrategy
from loguru import logger

from app.core.exceptions import (
    TokenExpiredException,
    TokenInvalidException,
)


class CustomJWTStrategy(JWTStrategy):
    """
    Custom JWT Strategy with enhanced error handling.

    Extends fastapi-users JWTStrategy to provide detailed error
    differentiation between expired tokens, invalid tokens, and
    other JWT-related errors.
    """

    async def read_token(
        self,
        token: Optional[str],
        user_manager
    ):
        """
        Read and validate JWT token.

        Decodes the JWT token and retrieves the user from database.
        Provides detailed error handling for different JWT validation
        failures.

        Args:
            token: JWT token string to decode
            user_manager: User manager instance for user lookup

        Returns:
            User object if token is valid, None if token is None

        Raises:
            TokenExpiredException: When token has expired
            TokenInvalidException: When token is malformed or invalid
        """
        if token is None:
            return None

        try:
            # Attempt to decode the JWT token
            data = jwt.decode(
                token,
                self.decode_key,
                audience=self.token_audience,
                algorithms=[self.algorithm],
            )

            # Extract user ID from token payload
            user_id = data.get('sub')

            if user_id is None:
                logger.warning(
                    'JWT token missing subject (sub) claim'
                )
                raise TokenInvalidException(
                    detail='JWT token missing required claims'
                )

            logger.debug(
                f'Successfully decoded JWT token for user ID: {user_id}'
            )

        except jwt.ExpiredSignatureError:
            # Token has expired - this is a normal scenario
            logger.info(
                'JWT token has expired. User needs to re-authenticate.'
            )
            raise TokenExpiredException()

        except jwt.InvalidTokenError as e:
            # Token is invalid (malformed, wrong signature, etc.)
            logger.warning(
                f'Invalid JWT token received: {type(e).__name__}. '
                f'Error: {str(e)}'
            )
            raise TokenInvalidException(
                detail='JWT token is invalid or malformed'
            )

        except Exception as e:
            # Unexpected error during token processing
            logger.error(
                f'Unexpected error during JWT token validation: '
                f'{type(e).__name__}. Error: {str(e)}',
                exc_info=True
            )
            raise TokenInvalidException(
                detail='Error processing authentication token'
            )

        # Token is valid, now retrieve the user from database
        try:
            parsed_id = user_manager.parse_id(user_id)
            user = await user_manager.get(parsed_id)

            if user is None:
                logger.warning(
                    f'User not found for ID: {user_id}'
                )
                return None

            logger.debug(
                f'Successfully retrieved user: {user.email}'
            )
            return user

        except Exception as e:
            # User lookup failed
            logger.error(
                f'Error retrieving user from database: '
                f'{type(e).__name__}. Error: {str(e)}',
                exc_info=True
            )
            return None
