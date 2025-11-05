# Superuser Order Management

This document describes the order management endpoints available for superusers.

## Overview

Superusers have extended permissions to:
- View all orders from all users
- Access any order details
- Update order status for any order

## Endpoints

### 1. Get All Orders (Admin)

**Endpoint:** `GET /orders/admin/all`

**Authentication:** Requires superuser role

**Description:** Get all orders from all users with optional filtering and pagination.

**Query Parameters:**
- `skip` (integer, default: 0) - Number of records to skip for pagination
- `limit` (integer, default: 20, max: 100) - Maximum number of records to return
- `status` (string, optional) - Filter by order status (created, updated, confirmed, shipped, canceled)

**Example Request:**
```bash
curl -X GET "http://localhost:8000/orders/admin/all?skip=0&limit=20&status=created" \
  -H "Authorization: Bearer YOUR_SUPERUSER_TOKEN"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "order_number": "OR2500001",
    "status": "created",
    "total_items": 3,
    "total_price": 15999.50,
    "created_at": "2025-11-05T10:30:00"
  },
  {
    "id": 2,
    "order_number": "OR2500002",
    "status": "confirmed",
    "total_items": 1,
    "total_price": 5999.00,
    "created_at": "2025-11-05T11:15:00"
  }
]
```

---

### 2. Get Order Details (Enhanced)

**Endpoint:** `GET /orders/{order_id}`

**Authentication:** Requires authentication

**Description:** Get detailed information about a specific order.
- Regular users can only access their own orders
- Superusers can access any order

**Path Parameters:**
- `order_id` (integer, required) - Order ID

**Example Request (Superuser):**
```bash
curl -X GET "http://localhost:8000/orders/5" \
  -H "Authorization: Bearer YOUR_SUPERUSER_TOKEN"
```

**Example Response:**
```json
{
  "id": 5,
  "order_number": "OR2500005",
  "user_id": 42,
  "status": "created",
  "first_name": "Ivan",
  "last_name": "Petrov",
  "city": "Moscow",
  "postal_code": "123456",
  "address": "Tverskaya St, 10",
  "phone": "+79991234567",
  "email": "ivan@example.com",
  "notes": "Please call before delivery",
  "total_items": 2,
  "total_price": 8999.00,
  "items": [
    {
      "id": 10,
      "product_id": 5,
      "quantity": 1,
      "price_at_purchase": 5999.00,
      "product_name": "Laptop",
      "subtotal": 5999.00,
      "product": {
        "id": 5,
        "name": "Laptop",
        "price": 5999.00,
        "main_image": "https://example.com/laptop.jpg",
        "part_number": "LAP-001"
      },
      "created_at": "2025-11-05T12:00:00",
      "updated_at": "2025-11-05T12:00:00"
    }
  ],
  "created_at": "2025-11-05T12:00:00",
  "updated_at": "2025-11-05T12:00:00"
}
```

---

### 3. Update Order Status (Admin)

**Endpoint:** `PATCH /orders/admin/{order_id}/status`

**Authentication:** Requires superuser role

**Description:** Update the status of any order. Superusers can change status to any value without restrictions.

**Path Parameters:**
- `order_id` (integer, required) - Order ID

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Available Statuses:**
- `created` - Order created
- `updated` - Order updated
- `confirmed` - Order confirmed
- `shipped` - Order shipped
- `canceled` - Order canceled

**Example Request:**
```bash
curl -X PATCH "http://localhost:8000/orders/admin/5/status" \
  -H "Authorization: Bearer YOUR_SUPERUSER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

**Example Response:**
```json
{
  "id": 5,
  "order_number": "OR2500005",
  "user_id": 42,
  "status": "confirmed",
  "first_name": "Ivan",
  "last_name": "Petrov",
  "city": "Moscow",
  "postal_code": "123456",
  "address": "Tverskaya St, 10",
  "phone": "+79991234567",
  "email": "ivan@example.com",
  "notes": "Please call before delivery",
  "total_items": 2,
  "total_price": 8999.00,
  "items": [...],
  "created_at": "2025-11-05T12:00:00",
  "updated_at": "2025-11-05T12:30:00"
}
```

---

## Differences from Regular User Endpoints

### Regular Users
- `GET /orders/` - View only their own orders
- `GET /orders/{order_id}` - Access only their own orders (403 if trying to access others')
- `DELETE /orders/{order_id}` - Cancel only orders with status: created, updated, or confirmed

### Superusers
- `GET /orders/admin/all` - View all orders from all users with filtering
- `GET /orders/{order_id}` - Access any order from any user
- `PATCH /orders/admin/{order_id}/status` - Update status of any order to any value

---

## Security

All superuser endpoints require:
1. Valid authentication token
2. User account with `is_superuser=True` flag

Attempting to access superuser endpoints without proper permissions will result in:
- **Status Code:** 403 Forbidden
- **Response:** `{"detail": "Forbidden"}`

---

## Use Cases

### 1. Order Processing
Superuser can update order status as it moves through the fulfillment pipeline:
```
created → confirmed → shipped
```

### 2. Order Management
View all pending orders:
```bash
GET /orders/admin/all?status=created&limit=50
```

### 3. Customer Support
Access customer order details for support inquiries:
```bash
GET /orders/{order_id}
```

### 4. Order Cancellation
Cancel problematic orders:
```bash
PATCH /orders/admin/{order_id}/status
Body: {"status": "canceled"}
```

---

## Logging

All superuser actions are logged with:
- User ID
- Action performed
- Order ID
- Timestamp
- Status changes

Example log entry:
```
INFO | Superuser обновляет статус заказа: order_id=5, new_status=confirmed
```

---

## API Documentation

For interactive API documentation, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
