# Order API Quick Reference Guide

## Base URL
```
http://localhost:8000
```

## Authentication
All order endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Create Order from Cart

**Endpoint:** `POST /orders/`

**Description:** Creates a new order from the user's current cart items. Cart is automatically cleared after successful order creation.

**Request Body:**
```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "city": "Москва",
  "postal_code": "101000",
  "address": "ул. Ленина, д. 1, кв. 10",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "notes": "Пожалуйста, позвоните за 30 минут"
}
```

**Field Validation:**
- `first_name`: Required, 1-50 characters, trimmed
- `last_name`: Required, 1-50 characters, trimmed
- `city`: Required, 1-100 characters, trimmed
- `postal_code`: Required, 5-10 digits only
- `address`: Required, 1-255 characters, trimmed
- `phone`: Required, format: +7XXXXXXXXXX (12 chars)
- `email`: Required, valid email format, max 320 chars
- `notes`: Optional, max 500 characters

**Success Response (201):**
```json
{
  "message": "Order created successfully",
  "order_id": 1,
  "total_price": 15999.50
}
```

**Error Responses:**
- `400 Bad Request`: Cart is empty or validation failed
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example cURL:**
```bash
curl -X POST "http://localhost:8000/orders/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Иван",
    "last_name": "Иванов",
    "city": "Москва",
    "postal_code": "101000",
    "address": "ул. Ленина, д. 1, кв. 10",
    "phone": "+79001234567",
    "email": "ivan@example.com"
  }'
```

---

### 2. Get User Orders

**Endpoint:** `GET /orders/`

**Description:** Retrieves all orders for the authenticated user, sorted by creation date (newest first).

**Query Parameters:**
- `skip` (optional): Number of records to skip, default: 0
- `limit` (optional): Maximum records to return, default: 100

**Success Response (200):**
```json
[
  {
    "id": 1,
    "status": "created",
    "total_items": 5,
    "total_price": 15999.50,
    "created_at": "2025-11-05T10:30:00Z"
  },
  {
    "id": 2,
    "status": "confirmed",
    "total_items": 3,
    "total_price": 8500.00,
    "created_at": "2025-11-04T15:20:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "http://localhost:8000/orders/?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Order Details

**Endpoint:** `GET /orders/{order_id}`

**Description:** Retrieves complete information about a specific order, including all items.

**Path Parameters:**
- `order_id`: Order ID (integer)

**Success Response (200):**
```json
{
  "id": 1,
  "user_id": 5,
  "status": "created",
  "first_name": "Иван",
  "last_name": "Иванов",
  "city": "Москва",
  "postal_code": "101000",
  "address": "ул. Ленина, д. 1, кв. 10",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "notes": "Пожалуйста, позвоните за 30 минут",
  "total_items": 5,
  "total_price": 15999.50,
  "items": [
    {
      "id": 1,
      "product_id": 10,
      "quantity": 2,
      "price_at_purchase": 5999.99,
      "product_name": "Smartphone X Pro",
      "subtotal": 11999.98,
      "product": {
        "id": 10,
        "name": "Smartphone X Pro",
        "price": 5999.99,
        "main_image": "/media/products/smartphone.jpg",
        "part_number": "SPX-001"
      },
      "created_at": "2025-11-05T10:30:00Z",
      "updated_at": "2025-11-05T10:30:00Z"
    },
    {
      "id": 2,
      "product_id": 15,
      "quantity": 3,
      "price_at_purchase": 1333.17,
      "product_name": "USB Cable Type-C",
      "subtotal": 3999.51,
      "product": {
        "id": 15,
        "name": "USB Cable Type-C",
        "price": 1333.17,
        "main_image": "/media/products/cable.jpg",
        "part_number": "USBC-002"
      },
      "created_at": "2025-11-05T10:30:00Z",
      "updated_at": "2025-11-05T10:30:00Z"
    }
  ],
  "created_at": "2025-11-05T10:30:00Z",
  "updated_at": "2025-11-05T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Order doesn't exist or user doesn't own it

**Example cURL:**
```bash
curl -X GET "http://localhost:8000/orders/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Cancel Order

**Endpoint:** `DELETE /orders/{order_id}`

**Description:** Cancels an order. Only allowed for orders with status: `created`, `updated`, or `confirmed`.

**Path Parameters:**
- `order_id`: Order ID (integer)

**Success Response (200):**
```json
{
  "message": "Order canceled successfully",
  "order_id": 1,
  "status": "canceled"
}
```

**Error Responses:**
- `400 Bad Request`: Order status doesn't allow cancellation
  ```json
  {
    "detail": "Order with status \"shipped\" cannot be canceled. Only orders with status \"created\", \"updated\", or \"confirmed\" can be canceled."
  }
  ```
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Order doesn't exist or user doesn't own it

**Example cURL:**
```bash
curl -X DELETE "http://localhost:8000/orders/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Order Status Workflow

```
created → updated → confirmed → shipped
   ↓         ↓          ↓
        canceled
```

**Cancellation Rules:**
- ✅ Can cancel: `created`, `updated`, `confirmed`
- ❌ Cannot cancel: `shipped`, `canceled`

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request (validation error, empty cart, invalid status) |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Not found (order doesn't exist or access denied) |
| 422 | Unprocessable entity (invalid request format) |
| 500 | Internal server error |

---

## Testing Workflow

### Complete Order Flow Example:

1. **Add items to cart:**
```bash
# Add product to cart
curl -X POST "http://localhost:8000/cart/items" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}'
```

2. **View cart:**
```bash
curl -X GET "http://localhost:8000/cart/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Create order from cart:**
```bash
curl -X POST "http://localhost:8000/orders/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Иван",
    "last_name": "Иванов",
    "city": "Москва",
    "postal_code": "101000",
    "address": "ул. Ленина, д. 1, кв. 10",
    "phone": "+79001234567",
    "email": "ivan@example.com"
  }'
```

4. **Verify cart is cleared:**
```bash
curl -X GET "http://localhost:8000/cart/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

5. **Get order details:**
```bash
curl -X GET "http://localhost:8000/orders/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

6. **Cancel order (if needed):**
```bash
curl -X DELETE "http://localhost:8000/orders/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration Notes

### Frontend Integration:

1. **Before creating order:**
   - Ensure user is authenticated
   - Validate cart is not empty
   - Show order form with all required fields
   - Validate phone and email format on frontend

2. **After successful order creation:**
   - Clear local cart state
   - Redirect to order confirmation page
   - Show order ID and total
   - Optionally send confirmation email

3. **Order list page:**
   - Implement pagination
   - Show order status with appropriate styling
   - Allow clicking to view details
   - Show cancellation button based on status

4. **Order details page:**
   - Show all order information
   - Display items with product images
   - Show cancellation button if status allows
   - Link to products (if still available)

---

## Important Notes

1. **Cart Clearing:** The cart is automatically cleared after successful order creation. Ensure your frontend handles this.

2. **Price Snapshots:** Order items store `price_at_purchase` to preserve the price even if product prices change later.

3. **Product Names:** Order items store `product_name` to preserve the name even if the product is deleted or renamed.

4. **Ownership Validation:** Users can only access their own orders. Attempting to access another user's order will return 404.

5. **Status Transitions:** Currently, only cancellation is implemented for users. Status updates (confirmed, shipped) would typically be admin operations.

---

## API Documentation

For interactive API documentation, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide:
- Complete API schema
- Try-it-out functionality
- Request/response examples
- Authentication setup

---

## Support

For issues or questions:
1. Check server logs at `/backend/logs/`
2. Verify authentication token is valid
3. Ensure database migrations are applied
4. Check API documentation at `/docs`
