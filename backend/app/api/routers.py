from fastapi import APIRouter

from app.api.endpoints import (
    brand_router,
    brand_products_router,
    cart_router,
    catalog_router,
    favorite_router,
    order_router,
    product_router,
    user_router
)
from app.core.config import Constants


main_router = APIRouter()

main_router.include_router(user_router)
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
# Вложенный роутер для продуктов конкретного бренда
main_router.include_router(
    brand_products_router,
    prefix=f'{Constants.BRANDS_PREFIX}/{{brand_slug}}/products',
    tags=['brand-products']
)
# Роутер для каталога всех продуктов
main_router.include_router(
    catalog_router,
    prefix=Constants.CATALOG_PREFIX,
    tags=Constants.CATALOG_TAGS
)
main_router.include_router(
    cart_router,
    prefix=Constants.CART_PREFIX,
    tags=Constants.CART_TAGS
)
main_router.include_router(
    favorite_router,
    prefix=Constants.FAVORITES_PREFIX,
    tags=Constants.FAVORITES_TAGS
)
main_router.include_router(
    order_router,
    prefix=Constants.ORDERS_PREFIX,
    tags=Constants.ORDERS_TAGS
)
