from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.core.constants import Constants
from app.models.order import OrderStatus
from app.schemas.validators import (
    validate_email,
    validate_phone,
    validate_postal_code,
)


class UserInOrder(BaseModel):
    """Minimal user information for order responses."""

    id: int
    email: str
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    """Schema for creating order item from cart item."""

    product_id: int
    quantity: int
    price_at_purchase: float
    product_name: str

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating new order from cart."""

    # Customer shipping information
    first_name: str = Field(
        ...,
        min_length=Constants.FIRST_NAME_MIN_LEN,
        max_length=Constants.FIRST_NAME_MAX_LEN,
        description='Customer first name'
    )

    last_name: str = Field(
        ...,
        min_length=Constants.FIRST_NAME_MIN_LEN,
        max_length=Constants.LAST_NAME_MAX_LEN,
        description='Customer last name'
    )

    city: str = Field(
        ...,
        min_length=1,
        max_length=Constants.CITY_MAX_LEN,
        description='City'
    )

    postal_code: str = Field(
        ...,
        min_length=Constants.POSTAL_CODE_MIN_LEN,
        max_length=Constants.POSTAL_CODE_MAX_LEN,
        description='Postal code'
    )

    address: str = Field(
        ...,
        min_length=1,
        max_length=Constants.ADDRESS_MAX_LEN,
        description='Delivery address'
    )

    phone: str = Field(
        ...,
        min_length=Constants.PHONE_MIN_LEN,
        max_length=Constants.PHONE_MAX_LEN,
        description='Contact phone number'
    )

    email: str = Field(
        ...,
        max_length=Constants.EMAIL_MAX_LEN,
        description='Contact email'
    )

    notes: Optional[str] = Field(
        None,
        max_length=Constants.ORDER_NOTES_MAX_LEN,
        description='Optional order notes'
    )

    @field_validator('phone')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate phone number format."""
        return validate_phone(v)

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """Validate email format."""
        return validate_email(v)

    @field_validator('postal_code')
    @classmethod
    def validate_postal_code_format(cls, v: str) -> str:
        """Validate postal code format."""
        return validate_postal_code(v)

    @field_validator('first_name', 'last_name', 'city', 'address')
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        """Validate field is not empty or whitespace."""
        if not v or not v.strip():
            raise ValueError('Field cannot be empty or whitespace')
        return v.strip()

    class Config:
        json_schema_extra = {
            'example': {
                'first_name': 'Иван',
                'last_name': 'Иванов',
                'city': 'Москва',
                'postal_code': '101000',
                'address': 'ул. Ленина, д. 1, кв. 10',
                'phone': '+79001234567',
                'email': 'ivan@example.com',
                'notes': 'Пожалуйста, позвоните за 30 минут'
            }
        }


class ProductInOrder(BaseModel):
    """Minimal product information for order responses."""

    id: int
    name: str
    price: float
    main_image: Optional[str] = None
    part_number: str

    class Config:
        from_attributes = True


class OrderItemResponse(BaseModel):
    """Schema for order item in responses."""

    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product_name: str
    subtotal: float = Field(
        description='Quantity * price_at_purchase'
    )
    product: Optional[ProductInOrder] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Complete order response with all items."""

    id: int
    order_number: str
    user_id: int
    status: OrderStatus
    first_name: str
    last_name: str
    city: str
    postal_code: str
    address: str
    phone: str
    email: str
    notes: Optional[str] = None
    total_items: int
    total_price: float
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True


class OrderListItem(BaseModel):
    """Brief order information for order list."""

    id: int
    order_number: str
    status: OrderStatus
    total_items: int
    total_price: float
    created_at: datetime
    user_id: int
    user: Optional[UserInOrder] = None

    class Config:
        from_attributes = True
        use_enum_values = True


class OrderListResponse(BaseModel):
    """Response schema for list of orders with pagination info."""

    orders: List[OrderListItem]
    total: int

    class Config:
        json_schema_extra = {
            'example': {
                'orders': [
                    {
                        'id': 1,
                        'order_number': 'OR2500001',
                        'status': 'created',
                        'total_items': 3,
                        'total_price': 15999.50,
                        'created_at': '2025-01-15T10:30:00',
                        'user_id': 5
                    }
                ],
                'total': 1
            }
        }


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""

    status: OrderStatus = Field(
        ...,
        description='New order status'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'status': 'confirmed'
            }
        }


class OrderCancelResponse(BaseModel):
    """Response after canceling order."""

    message: str = Field(
        default='Order canceled successfully',
        description='Success message'
    )
    order_id: int = Field(
        description='ID of the canceled order'
    )
    status: OrderStatus

    class Config:
        use_enum_values = True
        json_schema_extra = {
            'example': {
                'message': 'Order canceled successfully',
                'order_id': 1,
                'status': 'canceled'
            }
        }


class OrderCreateResponse(BaseModel):
    """Response after creating order."""

    message: str = Field(
        default='Order created successfully',
        description='Success message'
    )
    order_id: int = Field(
        description='ID of the created order'
    )
    order_number: str = Field(
        description='Unique order number'
    )
    total_price: float = Field(
        description='Total order price'
    )

    class Config:
        json_schema_extra = {
            'example': {
                'message': 'Order created successfully',
                'order_id': 1,
                'order_number': 'OR2500001',
                'total_price': 15999.50
            }
        }
