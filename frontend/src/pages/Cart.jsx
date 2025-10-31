import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  selectCartItems,
  selectCartIsLoading,
  selectCartError,
  selectCartIsLoaded,
  selectUpdatingItems,
} from '../store/slices/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import CartItem from '../components/CartItem';
import CartSkeleton from '../components/CartSkeleton';

/**
 * Оптимизированная страница корзины
 *
 * ОПТИМИЗАЦИИ:
 * 1. Использует Redux для глобального state management - корзина загружается один раз
 * 2. useMemo для вычисления totalPrice и totalQuantity - пересчет только при изменении items
 * 3. useCallback для обработчиков событий - предотвращение ре-рендеров CartItem
 * 4. CartItem обернут в React.memo - ре-рендер только при изменении конкретного товара
 * 5. Локальное состояние operationError отделено от Redux для toast-уведомлений
 */
function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const items = useSelector(selectCartItems);
  const isLoading = useSelector(selectCartIsLoading);
  const error = useSelector(selectCartError);
  const isLoaded = useSelector(selectCartIsLoaded);
  const updatingItems = useSelector(selectUpdatingItems);

  // Локальное состояние для toast-уведомлений об ошибках операций
  const [operationError, setOperationError] = useState(null);

  // Загрузка корзины при первом монтировании (только если еще не загружена)
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      dispatch(fetchCart());
    }
  }, [dispatch, isLoaded, isLoading]);

  // Мемоизированный обработчик изменения количества
  // useCallback предотвращает ре-рендеры дочерних компонентов
  const handleQuantityChange = useCallback(
    async (productId, newQuantity) => {
      if (newQuantity < 1) return;

      try {
        await dispatch(updateQuantity({ productId, quantity: newQuantity })).unwrap();
      } catch (err) {
        console.error('Ошибка при обновлении количества:', err);
        setOperationError(err || 'Не удалось обновить количество товара');
        setTimeout(() => setOperationError(null), 4000);
      }
    },
    [dispatch]
  );

  // Мемоизированный обработчик удаления товара
  const handleRemoveItem = useCallback(
    async (productId) => {
      try {
        await dispatch(removeFromCart(productId)).unwrap();
      } catch (err) {
        console.error('Ошибка при удалении товара:', err);
        setOperationError(err || 'Не удалось удалить товар из корзины');
        setTimeout(() => setOperationError(null), 4000);
      }
    },
    [dispatch]
  );

  // Мемоизированный обработчик очистки корзины
  const handleClearCart = useCallback(async () => {
    if (!window.confirm('Вы уверены, что хотите очистить корзину?')) {
      return;
    }

    try {
      await dispatch(clearCart()).unwrap();
    } catch (err) {
      console.error('Ошибка при очистке корзины:', err);
      setOperationError(err || 'Не удалось очистить корзину');
      setTimeout(() => setOperationError(null), 4000);
    }
  }, [dispatch]);

  // Мемоизированный обработчик оформления заказа
  const handleSubmit = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  // Вычисление общей суммы с использованием useMemo
  // Пересчет только при изменении items
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price_at_addition * item.quantity, 0);
  }, [items]);

  // Вычисление общего количества товаров с использованием useMemo
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // Состояние загрузки с skeleton screen
  if (isLoading && !isLoaded) {
    return <CartSkeleton />;
  }

  // Состояние ошибки загрузки
  if (error && !isLoaded) {
    return (
      <div className="max-w-4xl mx-auto p-5 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-12 h-12 text-red-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Ошибка загрузки</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchCart())}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Toast notification для ошибок операций */}
      {operationError && (
        <div
          className="fixed top-4 right-4 z-50 max-w-md bg-red-50 border-l-4 border-red-600 p-4 rounded-md shadow-lg animate-slide-in-right"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">Ошибка операции</h3>
              <p className="text-sm text-red-700">{operationError}</p>
            </div>
            <button
              onClick={() => setOperationError(null)}
              className="text-red-600 hover:text-red-800 transition-colors"
              aria-label="Закрыть уведомление"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <h1 className="mb-8 text-3xl font-bold text-center text-gray-800">Корзина покупок</h1>

      {items.length === 0 ? (
        // Пустая корзина
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
          <svg
            className="w-24 h-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Корзина пуста</h2>
            <p className="text-gray-500 mb-6">
              Добавьте товары из каталога, чтобы начать покупки
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Перейти к покупкам
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров */}
          <section className="lg:col-span-2" aria-labelledby="cart-items-heading">
            <div className="flex items-center justify-between mb-6">
              <h2 id="cart-items-heading" className="text-xl font-semibold text-gray-800">
                Товары ({totalQuantity})
              </h2>
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  Очистить корзину
                </button>
              )}
            </div>

            <ul className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  isUpdating={updatingItems.includes(item.product.id)}
                />
              ))}
            </ul>
          </section>

          {/* Форма оформления заказа */}
          <section className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              {/* Итоговая информация */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Товары:</span>
                  <span className="text-lg text-gray-800">{totalQuantity} шт.</span>
                </div>
                <div className="flex justify-between items-baseline font-bold text-2xl pb-6 border-b border-gray-200">
                  <span className="text-gray-900">Итого:</span>
                  <span className="text-red-600">{formatPrice(totalPrice)}</span>
                </div>

                {/* Кнопка оформления заказа */}
                <button
                  onClick={handleSubmit}
                  className="w-full px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Cart;
