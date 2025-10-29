# 🚀 Быстрый старт: Управление изображениями продуктов

## Что было добавлено?

Полноценная система управления изображениями продуктов с возможностью:
- Добавления новых изображений
- Установки главного изображения
- Удаления изображений
- Изменения порядка отображения (drag & drop)

## 📝 Для использования в проекте

### 1. Backend готов к работе ✅

Все эндпоинты уже созданы и доступны по адресу:

```
http://localhost:8000/api/products/{product_id}/images
```

Запустите backend:
```bash
cd backend
uvicorn app.main:app --reload
```

Документация API: http://localhost:8000/docs

### 2. Добавьте компонент в админ-панель

**Шаг 1:** Компонент уже создан в:
```
frontend/src/components/admin/ProductImageManager.jsx
```

**Шаг 2:** Импортируйте компонент в нужное место:

```jsx
import ProductImageManager from '../components/admin/ProductImageManager';
```

**Шаг 3:** Используйте компонент:

```jsx
import { useState } from 'react';
import ProductImageManager from './components/admin/ProductImageManager';

const YourAdminComponent = () => {
  const [selectedProductId, setSelectedProductId] = useState(null);

  return (
    <>
      {/* Кнопка для открытия менеджера изображений */}
      <button onClick={() => setSelectedProductId(productId)}>
        📸 Управление изображениями
      </button>

      {/* Модальное окно */}
      {selectedProductId && (
        <ProductImageManager
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </>
  );
};
```

### 3. Готово! 🎉

Теперь у вас есть полноценная система управления изображениями.

## 🎮 Как использовать?

1. **Открыть менеджер:**
   - Нажмите кнопку "Управление изображениями" рядом с продуктом

2. **Добавить изображения:**
   - Нажмите "Добавить изображения"
   - Выберите один или несколько файлов
   - Изображения загрузятся автоматически

3. **Установить главное изображение:**
   - Нажмите "Сделать главным" под нужным изображением
   - Главное изображение отмечено зеленым бейджем

4. **Удалить изображения:**
   - Отметьте изображения чекбоксами
   - Нажмите "Удалить выбранные"
   - Подтвердите действие

5. **Изменить порядок:**
   - Просто перетаскивайте изображения мышкой
   - Порядок сохранится автоматически

## 🔍 Проверка работы

### Backend

Откройте: http://localhost:8000/docs

Найдите раздел "products" - там будет 5 новых эндпоинтов:
- GET `/api/products/{product_id}/images`
- POST `/api/products/{product_id}/images`
- PUT `/api/products/{product_id}/images/main`
- DELETE `/api/products/{product_id}/images`
- PUT `/api/products/{product_id}/images/reorder`

### Frontend

Проверьте, что файл существует:
```
frontend/src/components/admin/ProductImageManager.jsx
```

## 📚 Дополнительная документация

- `IMAGE_MANAGEMENT_API.md` - полное описание API
- `IMAGE_MANAGER_INTEGRATION.md` - варианты интеграции
- `IMAGE_MANAGEMENT_SUMMARY.md` - технические детали

## ⚙️ Настройка

Если backend работает на другом порту, измените URL в компоненте:

```jsx
// В ProductImageManager.jsx
const API_URL = 'http://localhost:YOUR_PORT/api';
```

## 🐛 Частые проблемы

**Проблема:** Изображения не загружаются
**Решение:** Проверьте, что backend запущен и доступен по адресу

**Проблема:** CORS ошибки
**Решение:** Убедитесь, что CORS настроен в backend для вашего frontend домена

**Проблема:** Нельзя удалить последнее изображение
**Решение:** Это защита - продукт должен иметь хотя бы одно изображение

## 📊 Статус

✅ Backend - готов
✅ Frontend компонент - готов
✅ Документация - готова
✅ Тестирование - пройдено
✅ Code style (PEP 8) - соблюден

## 🎯 Следующие шаги

1. Запустите backend
2. Запустите frontend
3. Откройте админ-панель
4. Добавьте кнопку для управления изображениями
5. Протестируйте все функции

---

**Готово к использованию!** 🚀

