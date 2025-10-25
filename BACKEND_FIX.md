# Исправление ошибки MissingGreenlet в Backend

## 🐛 Проблема
При обновлении продуктов через API возникала ошибка:
```
MissingGreenlet: greenlet_spawn has not been called; can't call await_only() here
```

## 🔍 Причина
Ошибка возникала в `ProductDetailResponse` при попытке получить доступ к связанным данным (`images` и `category`) после того, как сессия базы данных уже была закрыта.

## ✅ Решение
Добавлена загрузка связанных данных в методы CRUD операций:

### 1. `update_product_with_images` в `app/crud/category.py`
```python
# Загружаем связанные данные для корректного ответа
result = await session.execute(
    select(Product)
    .options(
        selectinload(Product.images),
        selectinload(Product.category)
    )
    .where(Product.id == db_product.id)
)
db_product = result.scalars().first()
```

### 2. `create_product_with_images` в `app/crud/category.py`
Аналогичное исправление для создания продуктов.

## 🎯 Результат
- ✅ Ошибка `MissingGreenlet` исправлена
- ✅ API корректно возвращает связанные данные
- ✅ Админ-панель работает без ошибок
- ✅ Обновление и создание продуктов функционируют правильно

## 📝 Технические детали
- Использован `selectinload` для eager loading связанных данных
- Исправление применено к методам создания и обновления продуктов
- Сессия остается активной до загрузки всех необходимых данных
