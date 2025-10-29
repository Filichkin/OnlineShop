# Интеграция компонента управления изображениями

## Обзор

Создан компонент `ProductImageManager` для управления изображениями продукта
в административной панели.

## Функциональность

- ✅ Просмотр всех изображений продукта
- ✅ Добавление одного или нескольких изображений
- ✅ Установка главного изображения
- ✅ Удаление одного или нескольких изображений (с подтверждением)
- ✅ Изменение порядка изображений через Drag & Drop
- ✅ Визуальная индикация главного изображения
- ✅ Множественный выбор изображений для удаления
- ✅ Обработка ошибок и состояний загрузки

## Интеграция

### Вариант 1: Кнопка в списке продуктов

Добавьте кнопку в строку таблицы продуктов:

```jsx
import { useState } from 'react';
import ProductImageManager from './components/admin/ProductImageManager';

const ProductList = () => {
  const [selectedProductId, setSelectedProductId] = useState(null);

  return (
    <div>
      <table>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>
                <button
                  onClick={() => setSelectedProductId(product.id)}
                  className='px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600'
                >
                  📸 Изображения
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedProductId && (
        <ProductImageManager
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
};
```

### Вариант 2: Вкладка в форме редактирования продукта

```jsx
import { useState } from 'react';
import ProductImageManager from './components/admin/ProductImageManager';

const ProductEditPage = ({ productId }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [showImageManager, setShowImageManager] = useState(false);

  return (
    <div>
      <div className='tabs'>
        <button onClick={() => setActiveTab('info')}>
          Основная информация
        </button>
        <button onClick={() => setShowImageManager(true)}>
          Изображения
        </button>
      </div>

      {activeTab === 'info' && (
        <div>{/* Форма редактирования продукта */}</div>
      )}

      {showImageManager && (
        <ProductImageManager
          productId={productId}
          onClose={() => setShowImageManager(false)}
        />
      )}
    </div>
  );
};
```

### Вариант 3: Отдельная страница

```jsx
import { useParams, useNavigate } from 'react-router-dom';
import ProductImageManager from './components/admin/ProductImageManager';

const ProductImagesPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  return (
    <ProductImageManager
      productId={parseInt(productId)}
      onClose={() => navigate('/admin/products')}
    />
  );
};

// В роутере:
<Route
  path='/admin/products/:productId/images'
  element={<ProductImagesPage />}
/>
```

## Использование

1. **Добавление изображений:**
   - Нажмите кнопку "Добавить изображения"
   - Выберите один или несколько файлов
   - Изображения автоматически загрузятся

2. **Установка главного изображения:**
   - Нажмите кнопку "Сделать главным" под нужным изображением
   - Главное изображение отображается с зеленым бейджем

3. **Удаление изображений:**
   - Выберите изображения с помощью чекбоксов
   - Нажмите кнопку "Удалить выбранные"
   - Подтвердите действие

4. **Изменение порядка:**
   - Перетаскивайте изображения мышкой
   - Порядок сохраняется автоматически

## Настройка

### Изменение API базового URL

Если ваш backend работает на другом порту или домене:

```jsx
const API_BASE_URL = 'http://your-domain:port/api';

// Используйте в fetch запросах:
fetch(`${API_BASE_URL}/products/${productId}/images`)
```

### Кастомизация стилей

Компонент использует Tailwind CSS. Вы можете изменить классы:

```jsx
// Изменить размер модального окна
<div className='w-full max-w-6xl'> {/* Вместо max-w-4xl */}

// Изменить размер сетки изображений
<div className='grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
```

### Обработка авторизации

Если ваш API требует токен авторизации:

```jsx
const loadImages = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `http://localhost:8000/api/products/${productId}/images`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  // ...
};
```

## Требования

- React 18+
- Tailwind CSS (для стилей)
- Backend API должен поддерживать эндпоинты из `IMAGE_MANAGEMENT_API.md`

## Возможные улучшения

1. **Превью перед загрузкой:**
   ```jsx
   const [previewUrls, setPreviewUrls] = useState([]);
   
   const handleFileSelect = (e) => {
     const files = Array.from(e.target.files);
     const urls = files.map(file => URL.createObjectURL(file));
     setPreviewUrls(urls);
   };
   ```

2. **Crop изображений:**
   - Интегрировать библиотеку `react-image-crop`
   - Позволить обрезать изображения перед загрузкой

3. **Bulk операции:**
   - Установить несколько изображений как главные (для вариаций)
   - Массовое изменение порядка

4. **Оптимизация загрузки:**
   - Показывать прогресс-бар загрузки
   - Загружать изображения параллельно

5. **Lazy loading:**
   - Загружать изображения по требованию
   - Использовать виртуализацию для больших списков

## Тестирование

```jsx
// Пример теста с React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import ProductImageManager from './ProductImageManager';

test('renders image manager', () => {
  render(<ProductImageManager productId={1} onClose={() => {}} />);
  expect(screen.getByText('Управление изображениями продукта')).toBeInTheDocument();
});
```

## Поддержка

При возникновении проблем проверьте:

1. Backend API доступен и возвращает корректные данные
2. CORS настроен правильно
3. Форматы изображений поддерживаются
4. Размеры файлов не превышают лимит

