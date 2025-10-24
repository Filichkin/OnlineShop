from pathlib import Path


class Constants:
    # API Prefixes and Tags
    AUTH_PREFIX = '/auth/jwt'
    AUTH_TAGS = ('auth',)
    REGISTER_PREFIX = '/auth'
    USERS_PREFIX = '/users'
    USERS_TAGS = ('users',)
    CATEGORIES_PREFIX = '/categories'
    CATEGORIES_TAGS = ('categories',)
    PRODUCTS_PREFIX = '/products'
    PRODUCTS_TAGS = ('products',)
    JWT_TOKEN_URL = 'auth/jwt/login'
    JWT_AUTH_BACKEND_NAME = 'jwt'

    # Validation Constants
    USER_PASSWORD_MIN_LEN = 8
    NAME_MIN_LEN = 1
    NAME_MAX_LEN = 100
    PRODUCT_NAME_MIN_LEN = 1
    PRODUCT_NAME_MAX_LEN = 200
    PRODUCT_DESCRIPTION_MAX_LEN = 2000
    PRICE_MIN_VALUE = 0
    CATEGORY_ID_MIN_VALUE = 0

    # HTTP Status Codes
    HTTP_200_OK = 200
    HTTP_400_BAD_REQUEST = 400
    HTTP_404_NOT_FOUND = 404

    # Pagination Defaults
    DEFAULT_SKIP = 0
    DEFAULT_LIMIT = 100

    # Media Constants
    MEDIA_ORDER_DEFAULT = 0
    MIN_IMAGES_REQUIRED = 1
    FIRST_IMAGE_INDEX = 0

    # JWT Token Lifetime (seconds)
    JWT_TOKEN_LIFETIME = 3600

    # Database Port
    POSTGRES_PORT = 5432

    # File Storage
    UPLOAD_DIR = Path('media')
    PRODUCTS_DIR = UPLOAD_DIR / 'products'
    CATEGORIES_DIR = UPLOAD_DIR / 'categories'
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
