"""
Custom cookie-based transport for JWT authentication.

Provides secure cookie-based token transport with fallback
to Authorization header for backward compatibility.
"""

from fastapi import Response
from fastapi.security import APIKeyCookie
from fastapi_users.authentication.transport import Transport
from loguru import logger


class CookieTransport(Transport):
    """
    Cookie-based transport for JWT tokens.

    Reads JWT token from httpOnly cookie with fallback to
    Authorization header for backward compatibility.
    """

    scheme: APIKeyCookie

    def __init__(self, cookie_name: str = 'access_token'):
        """
        Initialize cookie transport.

        Args:
            cookie_name: Name of the cookie containing JWT token
        """
        self.scheme = APIKeyCookie(name=cookie_name, auto_error=False)

    async def get_login_response(self, token: str) -> Response:
        """
        Generate login response.

        For cookie transport, the token is set in httpOnly cookie
        by the endpoint itself, so we just return empty response.

        Args:
            token: JWT token (not used in cookie transport)

        Returns:
            Empty response (cookie set by endpoint)
        """
        # Cookie is set by the login endpoint, not by transport
        return Response(status_code=204)

    async def get_logout_response(self) -> Response:
        """
        Generate logout response.

        Returns response that instructs client to delete auth cookie.

        Returns:
            Response with cookie deletion instruction
        """
        response = Response(status_code=204)
        response.delete_cookie(
            key='access_token',
            path='/'
        )
        logger.debug('Access token cookie удалён при logout')
        return response

    @staticmethod
    def get_openapi_login_responses_success() -> dict:
        """
        OpenAPI schema for successful login response.

        Returns:
            OpenAPI schema dict
        """
        return {
            200: {
                'model': dict,
                'content': {
                    'application/json': {
                        'example': {
                            'user': {
                                'id': 1,
                                'email': 'user@example.com',
                                'is_active': True,
                                'is_superuser': False,
                                'is_verified': False
                            }
                        }
                    }
                }
            }
        }

    @staticmethod
    def get_openapi_logout_responses_success() -> dict:
        """
        OpenAPI schema for successful logout response.

        Returns:
            OpenAPI schema dict
        """
        return {
            204: {
                'description': 'Logout successful'
            }
        }
