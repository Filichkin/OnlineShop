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

    # Security Constants
    SECRET_MIN_LENGTH = 32
    DB_PASSWORD_MIN_LENGTH = 5
    SUPERUSER_PASSWORD_MIN_LENGTH = 12

    # Validation Constants
    USER_PASSWORD_MIN_LEN = 8
    NAME_MIN_LEN = 1
    NAME_MAX_LEN = 100
    PRODUCT_NAME_MIN_LEN = 1
    PRODUCT_NAME_MAX_LEN = 200
    PRODUCT_DESCRIPTION_MAX_LEN = 2000
    PRICE_MIN_VALUE = 0
    PRICE_MAX_VALUE = 1000000.0  # Maximum price to prevent abuse
    CATEGORY_ID_MIN_VALUE = 0
    SEARCH_STRING_MAX_LENGTH = 200

    # HTTP Status Codes
    HTTP_200_OK = 200
    HTTP_400_BAD_REQUEST = 400
    HTTP_404_NOT_FOUND = 404
    HTTP_413_PAYLOAD_TOO_LARGE = 413
    HTTP_422_UNPROCESSABLE_ENTITY = 422

    # Pagination Defaults
    DEFAULT_SKIP = 0
    DEFAULT_LIMIT = 100
    MAX_LIMIT = 1000  # Maximum items per page to prevent abuse

    # Media Constants
    MEDIA_ORDER_DEFAULT = 0
    MIN_IMAGES_REQUIRED = 1
    FIRST_IMAGE_INDEX = 0

    # File Upload Security
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    MIN_IMAGE_SIZE = 10  # 10 bytes minimum to prevent empty files
    ALLOWED_MIME_TYPES = {
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
    }

    # JWT Token Lifetime (seconds)
    JWT_TOKEN_LIFETIME = 3600

    # Database Port
    POSTGRES_PORT = 5432

    # Database Connection Pool Settings
    DB_POOL_SIZE = 20
    DB_MAX_OVERFLOW = 10
    DB_POOL_TIMEOUT = 30
    DB_POOL_RECYCLE = 3600  # Recycle connections after 1 hour

    # File Storage
    UPLOAD_DIR = Path('media')
    PRODUCTS_DIR = UPLOAD_DIR / 'products'
    CATEGORIES_DIR = UPLOAD_DIR / 'categories'
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

    # Rate Limiting
    RATE_LIMIT_CATEGORY_CREATE = "10/minute"
    RATE_LIMIT_CATEGORY_UPDATE = "20/minute"
    RATE_LIMIT_PRODUCT_CREATE = "5/minute"
    RATE_LIMIT_PRODUCT_UPDATE = "10/minute"
