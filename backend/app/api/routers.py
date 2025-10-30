from fastapi import APIRouter

from app.api.endpoints import (
    brand_router,
    cart_router,
    category_router,
    product_router,
    user_router
)
from app.core.config import Constants


main_router = APIRouter()

main_router.include_router(user_router)
main_router.include_router(
    category_router,
    prefix=Constants.CATEGORIES_PREFIX,
    tags=Constants.CATEGORIES_TAGS
)
main_router.include_router(
    product_router,
    prefix=Constants.PRODUCTS_PREFIX,
    tags=Constants.PRODUCTS_TAGS
)
main_router.include_router(
    brand_router,
    prefix=Constants.BRANDS_PREFIX,
    tags=Constants.BRANDS_TAGS
)
main_router.include_router(
    cart_router,
    prefix=Constants.CART_PREFIX,
    tags=Constants.CART_TAGS
)
