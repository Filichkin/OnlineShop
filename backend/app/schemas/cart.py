from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.core.constants import Constants


class CartItemCreate(BaseModel):
    """Schema for adding a product to the cart."""

    product_id: int = Field(
        ...,
        gt=0,
        description='Product ID to add to cart'
    )
    quantity: int = Field(
        default=Constants.CART_ITEM_QUANTITY_DEFAULT,
        ge=Constants.MIN_CART_ITEM_QUANTITY,
        le=Constants.MAX_CART_ITEM_QUANTITY,
        description='Quantity of the product'
    )

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        """Validate quantity is within allowed range."""
        if v < Constants.MIN_CART_ITEM_QUANTITY:
            raise ValueError(
                f'Quantity must be at least '
                f'{Constants.MIN_CART_ITEM_QUANTITY}'
            )
        if v > Constants.MAX_CART_ITEM_QUANTITY:
            raise ValueError(
                f'Quantity cannot exceed '
                f'{Constants.MAX_CART_ITEM_QUANTITY}'
            )
        return v

    class Config:
        json_schema_extra = {
            'example': {
                'product_id': 1,
                'quantity': 2
            }
        }


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity."""

    quantity: int = Field(
        ...,
        ge=Constants.MIN_CART_ITEM_QUANTITY,
        le=Constants.MAX_CART_ITEM_QUANTITY,
        description='New quantity for the cart item'
    )

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        """Validate quantity is within allowed range."""
        if v < Constants.MIN_CART_ITEM_QUANTITY:
            raise ValueError(
                f'Quantity must be at least '
                f'{Constants.MIN_CART_ITEM_QUANTITY}'
            )
        if v > Constants.MAX_CART_ITEM_QUANTITY:
            raise ValueError(
                f'Quantity cannot exceed '
                f'{Constants.MAX_CART_ITEM_QUANTITY}'
            )
        return v

    class Config:
        json_schema_extra = {
            'example': {
                'quantity': 5
            }
        }


class ProductInCart(BaseModel):
    """Minimal product information for cart responses."""

    id: int
    name: str
    price: float
    main_image: Optional[str] = None

    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    """Schema for cart item in responses."""

    id: int
    product_id: int
    quantity: int
    price_at_addition: float
    subtotal: float = Field(
        description='Quantity * price_at_addition'
    )
    product: ProductInCart
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Complete cart response with all items."""

    id: int
    session_id: Optional[str] = None
    items: List[CartItemResponse] = []
    total_items: int = Field(
        description='Total number of items in cart'
    )
    total_price: float = Field(
        description='Total price of all items'
    )
    expires_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartSummary(BaseModel):
    """
    Brief cart information for cart icon.

    Used to display cart status without loading full cart details.
    """

    total_items: int = Field(
        description='Total quantity of all items'
    )
    total_price: float = Field(
        description='Total price of all items'
    )
    items_count: int = Field(
        description='Number of unique products in cart'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'total_items': 5,
                'total_price': 15999.50,
                'items_count': 3
            }
        }


class CartClearResponse(BaseModel):
    """Response after clearing the cart."""

    message: str = Field(
        default='Cart cleared successfully',
        description='Success message'
    )
    items_removed: int = Field(
        description='Number of items removed from cart'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'message': 'Cart cleared successfully',
                'items_removed': 5
            }
        }


class CartItemDeleteResponse(BaseModel):
    """Response after deleting a cart item."""

    message: str = Field(
        default='Item removed from cart',
        description='Success message'
    )
    product_id: int = Field(
        description='ID of the removed product'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'message': 'Item removed from cart',
                'product_id': 1
            }
        }
