import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart, selectCartItems, selectUpdatingItems } from '../store/slices/cartSlice';

/**
 * Кнопка добавления товара в корзину с переключением на контролы количества
 *
 * ОПТИМИЗАЦИЯ: Интегрирована с Redux для автоматического обновления
 * состояния корзины во всем приложении (Header badge, Cart page)
 *
 * ПОВЕДЕНИЕ:
 * - Если товар НЕ в корзине: показывает кнопку "Добавить"
 * - Если товар В корзине: показывает контролы количества (-, количество, +)
 *
 * @param {Object} product - Объект товара с id
 * @param {Function} onAddToCart - Опциональный callback после добавления
 * @param {number} quantity - Количество для добавления (по умолчанию 1)
 * @param {string} className - Дополнительные CSS классы
 */
function AddToCartButton({ product, onAddToCart, quantity = 1, className = "" }) {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получаем список товаров в корзине и список обновляющихся товаров
  const cartItems = useSelector(selectCartItems);
  const updatingItems = useSelector(selectUpdatingItems);

  // Проверяем, есть ли товар в корзине
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const isInCart = !!cartItem;
  const currentQuantity = cartItem ? cartItem.quantity : 0;
  const isUpdating = updatingItems.includes(product.id);

  // Добавление товара в корзину
  const handleAddToCart = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Вызываем Redux action для добавления товара в корзину
      await dispatch(addToCart({ productId: product.id, quantity })).unwrap();

      // Вызываем callback функцию если она передана (для обновления UI)
      if (onAddToCart) {
        onAddToCart(product);
      }

    } catch (err) {
      console.error('Ошибка при добавлении товара в корзину:', err);
      setError(err || 'Не удалось добавить товар в корзину');

      // Сбрасываем ошибку через 3 секунды
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Изменение количества товара в корзине
  const handleQuantityChange = async (newQuantity) => {
    if (isUpdating) return;

    // Если количество меньше 1, удаляем товар из корзины
    if (newQuantity < 1) {
      try {
        await dispatch(removeFromCart(product.id)).unwrap();
      } catch (err) {
        console.error('Ошибка при удалении товара из корзины:', err);
        setError(err || 'Не удалось удалить товар');

        // Сбрасываем ошибку через 3 секунды
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
      return;
    }

    try {
      await dispatch(updateQuantity({ productId: product.id, quantity: newQuantity })).unwrap();
    } catch (err) {
      console.error('Ошибка при обновлении количества:', err);
      setError(err || 'Не удалось обновить количество');

      // Сбрасываем ошибку через 3 секунды
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Если товар уже в корзине, показываем контролы количества
  if (isInCart) {
    return (
      <div className="relative">
        <div className={`flex items-center border border-gray-300 rounded-md bg-white py-1.5 ${className}`}>
          {/* Кнопка уменьшения количества */}
          <button
            onClick={() => handleQuantityChange(currentQuantity - 1)}
            disabled={isUpdating}
            className="px-2 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
            aria-label="Уменьшить количество"
            title="Уменьшить количество"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Отображение текущего количества */}
          <span className="px-2 flex items-center justify-center min-w-[2rem] font-medium text-sm text-gray-900">
            {currentQuantity}
          </span>

          {/* Кнопка увеличения количества */}
          <button
            onClick={() => handleQuantityChange(currentQuantity + 1)}
            disabled={isUpdating}
            className="px-2 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md"
            aria-label="Увеличить количество"
            title="Увеличить количество"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Отображение ошибки, если есть */}
        {error && (
          <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Если товар НЕ в корзине, показываем кнопку "Добавить"
  return (
    <div className="relative">
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-md flex items-center justify-center gap-2
          transition-all duration-200 font-medium text-sm
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${error
            ? 'bg-red-700 text-white focus:ring-red-600 hover:bg-red-800'
            : isLoading
              ? 'bg-gray-500 text-white cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover:shadow-lg'
          }
          ${className}
        `}
        title={error ? error : isLoading ? 'Добавление...' : 'Добавить в корзину'}
      >
        {error ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Ошибка</span>
          </>
        ) : isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Добавление...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span>Добавить</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10">
          {error}
        </div>
      )}
    </div>
  );
}

export default AddToCartButton;
