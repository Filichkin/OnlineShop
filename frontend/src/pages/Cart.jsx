import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../api';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';

function Cart() {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [operationError, setOperationError] = useState(null);

  // Загрузка корзины при монтировании компонента
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await cartAPI.getCart();
      setCartData(data);
    } catch (err) {
      console.error('Ошибка при загрузке корзины:', err);
      setError(err.message || 'Не удалось загрузить корзину');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    // Сохраняем предыдущее значение для возможного отката
    const previousQuantity = cartData.items.find(
      item => item.product.id === productId
    )?.quantity;

    // Добавляем товар в список обновляющихся
    setUpdatingItems(prev => new Set(prev).add(productId));

    // Оптимистичное обновление UI
    setCartData(prevData => ({
      ...prevData,
      items: prevData.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ),
    }));

    try {
      await cartAPI.updateItem(productId, newQuantity);
    } catch (err) {
      console.error('Ошибка при обновлении количества:', err);

      // Откатываем изменения в UI
      setCartData(prevData => ({
        ...prevData,
        items: prevData.items.map(item =>
          item.product.id === productId
            ? { ...item, quantity: previousQuantity }
            : item
        ),
      }));

      // Показываем сообщение об ошибке
      setOperationError(err.message || 'Не удалось обновить количество товара');
      setTimeout(() => setOperationError(null), 4000);
    } finally {
      // Убираем товар из списка обновляющихся
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    // Сохраняем удаляемый товар для возможного отката
    const removedItem = cartData.items.find(item => item.product.id === productId);

    // Добавляем товар в список обновляющихся
    setUpdatingItems(prev => new Set(prev).add(productId));

    // Оптимистичное удаление из UI
    setCartData(prevData => ({
      ...prevData,
      items: prevData.items.filter(item => item.product.id !== productId),
    }));

    try {
      await cartAPI.removeItem(productId);
      // Успешно удалено - убираем из обновляющихся
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } catch (err) {
      console.error('Ошибка при удалении товара:', err);

      // Откатываем удаление - возвращаем товар
      if (removedItem) {
        setCartData(prevData => ({
          ...prevData,
          items: [...prevData.items, removedItem],
        }));
      }

      // Показываем сообщение об ошибке
      setOperationError(err.message || 'Не удалось удалить товар из корзины');
      setTimeout(() => setOperationError(null), 4000);

      // Убираем из обновляющихся в случае ошибки
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить корзину?')) {
      return;
    }

    // Сохраняем текущие товары для возможного отката
    const previousItems = [...cartData.items];

    // Оптимистичное очищение UI
    setCartData({ items: [] });

    try {
      await cartAPI.clearCart();
    } catch (err) {
      console.error('Ошибка при очистке корзины:', err);

      // Откатываем изменения
      setCartData({ items: previousItems });

      // Показываем сообщение об ошибке
      setOperationError(err.message || 'Не удалось очистить корзину');
      setTimeout(() => setOperationError(null), 4000);
    }
  };

  const handleSubmit = () => {
    // Переход на страницу оформления заказа (будет создана позже)
    navigate('/checkout');
  };

  // Вычисление общей суммы
  const totalPrice = cartData?.items.reduce(
    (sum, item) => sum + item.price_at_addition * item.quantity,
    0
  ) || 0;

  // Вычисление общего количества товаров
  const totalQuantity = cartData?.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  ) || 0;


  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-5 py-16">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <svg
            className="animate-spin h-12 w-12 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600 text-lg">Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
            onClick={fetchCart}
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
      {/* Toast notification for operation errors */}
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

      {cartData?.items.length === 0 ? (
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
              {cartData.items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  Очистить корзину
                </button>
              )}
            </div>

            <ul className="space-y-4">
              {cartData.items.map(item => {
                const isUpdating = updatingItems.has(item.product.id);
                const subtotal = item.price_at_addition * item.quantity;

                return (
                  <li
                    key={item.product.id}
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
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h3>
                          {/* Управление количеством */}
                          <div className="flex items-center border border-gray-300 rounded-md flex-shrink-0">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
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
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
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
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Итого:</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatPrice(subtotal)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          disabled={isUpdating}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
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
              })}
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
