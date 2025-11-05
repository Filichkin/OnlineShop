# Favorites API Documentation

## Overview

API для управления избранными товарами пользователей. Поддерживает работу с гостевыми сессиями через cookies.

## Base URL

```
http://localhost:8000/api/favorites
```

## Endpoints

### 1. Get Favorite List

Получить список всех избранных товаров текущего пользователя/сессии.

**Endpoint:** `GET /favorites/`

**Response:** `200 OK`

```json
{
  "id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "id": 1,
      "product_id": 123,
      "product": {
        "id": 123,
        "name": "Product Name",
        "price": 999.99,
        "main_image": "/media/products/image.jpg",
        "part_number": "PN-12345"
      },
      "created_at": "2025-11-01T18:00:00Z"
    }
  ],
  "total_items": 1,
  "expires_at": "2025-12-01T18:00:00Z",
  "created_at": "2025-11-01T18:00:00Z",
  "updated_at": "2025-11-01T18:00:00Z"
}
```

---

### 2. Add to Favorites

Добавить товар в избранное.

**Endpoint:** `POST /favorites/{product_id}`

**Path Parameters:**
- `product_id` (integer, required) - ID товара для добавления

**Response:** `201 Created`

```json
{
  "message": "Item added to favorites",
  "product_id": 123,
  "item": {
    "id": 1,
    "product_id": 123,
    "product": {
      "id": 123,
      "name": "Product Name",
      "price": 999.99,
      "main_image": "/media/products/image.jpg",
      "part_number": "PN-12345"
    },
    "created_at": "2025-11-01T18:00:00Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - Товар не найден или неактивен
- `409 Conflict` - Товар уже в избранном

---

### 3. Remove from Favorites

Удалить товар из избранного.

**Endpoint:** `DELETE /favorites/{product_id}`

**Path Parameters:**
- `product_id` (integer, required) - ID товара для удаления

**Response:** `200 OK`

```json
{
  "message": "Item removed from favorites",
  "product_id": 123
}
```

**Error Responses:**

- `404 Not Found` - Список избранного или товар не найден

---

## Authentication

API использует cookie-based сессии. Cookie `session_id` устанавливается автоматически при первом запросе.

**Cookie Parameters:**
- Name: `session_id`
- Type: UUID string
- Max Age: 30 days
- HttpOnly: true
- SameSite: lax

---

## Error Handling

Все ошибки возвращаются в формате:

```json
{
  "detail": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## Features

- **Session-based:** Работает для гостевых пользователей через session_id
- **Auto-creation:** Список избранного создается автоматически при первом запросе
- **Duplicate prevention:** Невозможно добавить один товар дважды
- **Product validation:** Проверка существования и активности товара
- **Automatic cleanup:** Устаревшие сессии автоматически удаляются (30 дней)
- **Future-ready:** Готовность к интеграции с пользовательской аутентификацией

---

## Integration Example (Frontend)

### React/TypeScript Example

```typescript
// Add to favorites
const addToFavorites = async (productId: number) => {
  try {
    const response = await fetch(`/api/favorites/${productId}`, {
      method: 'POST',
      credentials: 'include' // Important for cookies
    });

    if (!response.ok) {
      if (response.status === 409) {
        console.log('Already in favorites');
      }
      throw new Error('Failed to add to favorites');
    }

    const data = await response.json();
    console.log('Added to favorites:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Remove from favorites
const removeFromFavorites = async (productId: number) => {
  try {
    const response = await fetch(`/api/favorites/${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to remove from favorites');
    }

    const data = await response.json();
    console.log('Removed from favorites:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get favorites list
const getFavorites = async () => {
  try {
    const response = await fetch('/api/favorites/', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};
```

---

## Database Schema

### favorites table
- `id` (integer, primary key)
- `session_id` (string, indexed, nullable)
- `user_id` (uuid, indexed, nullable, FK to user.id)
- `expires_at` (timestamp with timezone)
- `created_at` (timestamp with timezone)
- `updated_at` (timestamp with timezone)
- `is_active` (boolean)

### favorite_items table
- `id` (integer, primary key)
- `favorite_id` (integer, FK to favorites.id, CASCADE)
- `product_id` (integer, FK to products.id, CASCADE)
- `created_at` (timestamp with timezone)
- `updated_at` (timestamp with timezone)
- `is_active` (boolean)

**Constraints:**
- Unique constraint on (favorite_id, product_id)
- Indexes on favorite_id, product_id for performance

---

## Testing

Use the FastAPI interactive docs at `http://localhost:8000/docs` to test the API endpoints.

Or use curl:

```bash
# Get favorites
curl -X GET http://localhost:8000/api/favorites/ \
  -H "Cookie: session_id=YOUR_SESSION_ID"

# Add to favorites
curl -X POST http://localhost:8000/api/favorites/1 \
  -H "Cookie: session_id=YOUR_SESSION_ID"

# Remove from favorites
curl -X DELETE http://localhost:8000/api/favorites/1 \
  -H "Cookie: session_id=YOUR_SESSION_ID"
```

---

## Notes

- Session cookie is set automatically on first request
- Favorite lists expire after 30 days of inactivity
- Only active products can be added to favorites
- The API follows the same architecture pattern as the Cart API for consistency
