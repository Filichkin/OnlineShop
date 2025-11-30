import { memo } from 'react';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';

/**
 * Мемоизированный компонент товара в корзине
 *
 * Оптимизация: обернут в React.memo для предотвращения
 * лишних ре-рендеров при изменении других товаров в корзине
 *
 * @param {Object} item - Данные товара из корзины
 * @param {Function} onQuantityChange - Обработчик изменения количества
 * @param {Function} onRemove - Обработчик удаления товара
 * @param {boolean} isUpdating - Флаг состояния обновления
 */
const CartItem = memo(({ item, onQuantityChange, onRemove, isUpdating }) => {
  const subtotal = item.price_at_addition * item.quantity;

  return (
    <li
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
        transition-all duration-200 hover:shadow-md
        ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Изображение товара */}
        <div className="flex-shrink-0">
          <img
            src={getImageUrl(item.product.main_image)}
            alt={item.product.name}
            className="w-full sm:w-24 h-24 object-cover rounded-md bg-gray-100"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/100?text=No+Image';
            }}
          />
        </div>

        {/* Информация о товаре */}
        <div className="flex-grow min-w-0">
          {/* Название и управление количеством на одной линии */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate flex-shrink min-w-0">
              {item.product.name}
            </h3>
            {/* Управление количеством */}
            <div className="flex items-center border border-gray-300 rounded-md flex-shrink-0 ml-auto">
              <button
                onClick={() => onQuantityChange(item.product.id, item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdating}
                className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Уменьшить количество"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <span className="px-4 py-1 text-center min-w-[3rem] font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
                disabled={isUpdating}
                className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Увеличить количество"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Артикул и цена */}
          <div className="text-sm text-gray-500">
            {item.product.part_number && (
              <p className="mb-1">Арт: {item.product.part_number}</p>
            )}
            <p>Цена: {formatPrice(item.price_at_addition)}</p>
          </div>
        </div>

        {/* Итого и удаление */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:min-w-[105px]">
          <div className="text-right sm:w-full">
            <p className="text-sm text-gray-500 mb-1">Итого:</p>
            <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
              {formatPrice(subtotal)}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.product.id)}
            disabled={isUpdating}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            aria-label="Удалить товар"
            title="Удалить"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
});

// Задаем displayName для лучшей отладки
CartItem.displayName = 'CartItem';

export default CartItem;
