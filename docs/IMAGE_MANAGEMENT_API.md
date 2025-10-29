# API для управления изображениями продуктов

## Обзор

Реализована полноценная система управления изображениями продуктов с 
возможностью добавления, удаления, установки главного изображения и 
изменения порядка отображения.

## Эндпоинты

### 1. Получить все изображения продукта

```http
GET /api/products/{product_id}/images
```

**Описание:** Получить список всех изображений продукта, 
отсортированных по полю `order`.

**Параметры:**
- `product_id` (path, integer) - ID продукта

**Ответ:** `200 OK`
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "media/products/product_1_0_abc123.jpg",
    "media_type": "product",
    "order": 0,
    "is_main": true,
    "product_id": 1,
    "category_id": null
  }
]
```

---

### 2. Добавить изображения к продукту

```http
POST /api/products/{product_id}/images
Content-Type: multipart/form-data
```

**Описание:** Добавить одно или несколько изображений к продукту.

**Параметры:**
- `product_id` (path, integer) - ID продукта
- `images` (form-data, file[]) - Массив файлов изображений

**Ответ:** `200 OK`
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "media/products/product_1_2_def456.jpg",
    "media_type": "product",
    "order": 2,
    "is_main": false,
    "product_id": 1,
    "category_id": null
  }
]
```

**Ошибки:**
- `400` - Не загружено ни одного изображения
- `404` - Продукт не найден

---

### 3. Установить главное изображение

```http
PUT /api/products/{product_id}/images/main
Content-Type: application/json
```

**Описание:** Установить указанное изображение как главное для продукта.
Автоматически снимает флаг `is_main` с остальных изображений продукта.

**Параметры:**
- `product_id` (path, integer) - ID продукта

**Тело запроса:**
```json
{
  "media_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Ответ:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "url": "media/products/product_1_0_abc123.jpg",
  "media_type": "product",
  "order": 0,
  "is_main": true,
  "product_id": 1,
  "category_id": null
}
```

**Ошибки:**
- `404` - Продукт или изображение не найдено
- `404` - Изображение не принадлежит указанному продукту

---

### 4. Удалить изображения

```http
DELETE /api/products/{product_id}/images
Content-Type: application/json
```

**Описание:** Удалить одно или несколько изображений продукта.
Удаляет как записи из БД, так и файлы с диска.

**Параметры:**
- `product_id` (path, integer) - ID продукта

**Тело запроса:**
```json
{
  "media_ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "123e4567-e89b-12d3-a456-426614174001"
  ]
}
```

**Ответ:** `200 OK`
```json
{
  "deleted_count": 2,
  "message": "Удалено изображений: 2"
}
```

**Ошибки:**
- `400` - Попытка удалить все изображения продукта (должно остаться 
  хотя бы одно)
- `404` - Продукт или изображения не найдены
- `404` - Некоторые изображения не принадлежат продукту

---

### 5. Изменить порядок изображений

```http
PUT /api/products/{product_id}/images/reorder
Content-Type: application/json
```

**Описание:** Изменить порядок отображения изображений продукта.

**Параметры:**
- `product_id` (path, integer) - ID продукта

**Тело запроса:**
```json
{
  "order_updates": [
    {
      "media_id": "123e4567-e89b-12d3-a456-426614174000",
      "order": 0
    },
    {
      "media_id": "123e4567-e89b-12d3-a456-426614174001",
      "order": 1
    }
  ]
}
```

**Ответ:** `200 OK`
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "media/products/product_1_0_abc123.jpg",
    "media_type": "product",
    "order": 0,
    "is_main": true,
    "product_id": 1,
    "category_id": null
  }
]
```

**Ошибки:**
- `404` - Продукт не найден
- `404` - Некоторые изображения не найдены или не принадлежат продукту

---

## CRUD операции

Создан отдельный CRUD модуль `app/crud/media.py` с методами:

- `get_product_images()` - получить все изображения продукта
- `get_by_id()` - получить изображение по ID
- `get_main_image()` - получить главное изображение продукта
- `set_main_image()` - установить главное изображение
- `add_images()` - добавить несколько изображений
- `delete_images()` - удалить изображения
- `reorder_images()` - изменить порядок изображений

## Схемы данных

Созданы следующие Pydantic схемы в `app/schemas/media.py`:

- `SetMainImageRequest` - запрос на установку главного изображения
- `DeleteImagesRequest` - запрос на удаление изображений
- `DeleteImagesResponse` - ответ на удаление изображений
- `ImageOrderUpdate` - обновление порядка одного изображения
- `ReorderImagesRequest` - запрос на изменение порядка изображений

## Безопасность

- Все операции с файлами проходят валидацию размера и типа
- Используется безопасная генерация имен файлов
- Проверка принадлежности изображений к продукту
- Защита от удаления всех изображений продукта
- Автоматическая очистка файлов при ошибках сохранения в БД

## Пример использования (JavaScript/React)

### Получить изображения продукта

```javascript
const images = await fetch(`/api/products/${productId}/images`)
  .then(res => res.json());
```

### Добавить изображения

```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('images', file);
});

const newImages = await fetch(`/api/products/${productId}/images`, {
  method: 'POST',
  body: formData,
}).then(res => res.json());
```

### Установить главное изображение

```javascript
await fetch(`/api/products/${productId}/images/main`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ media_id: imageId }),
});
```

### Удалить изображения

```javascript
await fetch(`/api/products/${productId}/images`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ media_ids: [imageId1, imageId2] }),
});
```

### Изменить порядок изображений

```javascript
await fetch(`/api/products/${productId}/images/reorder`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_updates: [
      { media_id: imageId1, order: 0 },
      { media_id: imageId2, order: 1 },
    ],
  }),
});
```

## Структура файлов

```
backend/
├── app/
│   ├── crud/
│   │   ├── media.py          # CRUD для изображений
│   │   └── __init__.py       # Экспорт media_crud
│   ├── schemas/
│   │   ├── media.py          # Схемы для работы с изображениями
│   │   └── __init__.py       # Экспорт схем
│   └── api/
│       └── endpoints/
│           └── product.py    # Эндпоинты управления изображениями
```

## Тестирование

Для тестирования API можно использовать встроенную документацию Swagger:

```
http://localhost:8000/docs
```

В разделе "products" вы найдете все новые эндпоинты для управления 
изображениями.

