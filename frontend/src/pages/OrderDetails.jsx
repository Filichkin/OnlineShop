import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils';
import { logger } from '../utils/logger';

/**
 * OrderDetails page component
 *
 * Displays detailed information about a specific order
 * Allows cancellation of orders with appropriate status
 */
function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersAPI.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      logger.error('Error loading order details:', err);
      setError(err || 'Не удалось загрузить детали заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить этот заказ?')) {
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      await ordersAPI.cancelOrder(orderId);
      // Reload order to get updated status
      await loadOrderDetails();
    } catch (err) {
      logger.error('Error cancelling order:', err);
      setCancelError(err || 'Не удалось отменить заказ');
    } finally {
      setCancelling(false);
    }
  };

  const statusColors = {
    created: 'bg-blue-100 text-blue-800',
    updated: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-purple-100 text-purple-800',
    shipped: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    created: 'Создан',
    updated: 'Обновлен',
    confirmed: 'Подтвержден',
    shipped: 'Отправлен',
    canceled: 'Отменен',
  };

  // Check if order can be cancelled
  const canCancel = order && ['created', 'updated', 'confirmed'].includes(order.status);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Загрузка деталей заказа...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadOrderDetails}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Попробовать снова
            </button>
            <Link
              to="/profile?tab=orders"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Назад к заказам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/profile?tab=orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад к заказам
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Заказ {order.order_number}
            </h1>
            <p className="text-gray-600">
              Создан: {new Date(order.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabels[order.status] || order.status}
            </span>
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Отменяем...' : 'Отменить заказ'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Error */}
      {cancelError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded-md">
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
              <h3 className="text-sm font-semibold text-red-800 mb-1">Ошибка отмены заказа</h3>
              <p className="text-sm text-red-700">{cancelError}</p>
            </div>
            <button
              onClick={() => setCancelError(null)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Товары в заказе ({order.total_items} шт.)
            </h2>

            <ul className="space-y-4">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.product ? (
                      <Link to={`/product/${item.product.id}`}>
                        <img
                          src={getImageUrl(item.product.main_image)}
                          alt={item.product_name}
                          className="w-full sm:w-24 h-24 object-cover rounded-md bg-gray-100"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                      </Link>
                    ) : (
                      <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    {item.product ? (
                      <Link
                        to={`/product/${item.product.id}`}
                        className="block mb-1"
                      >
                        <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {item.product_name}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {item.product_name}
                      </h3>
                    )}

                    {item.product && item.product.part_number && (
                      <p className="text-sm text-gray-500 mb-2">
                        Арт: {item.product.part_number}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Количество: <span className="font-medium">{item.quantity} шт.</span>
                      </span>
                      <span className="text-gray-600">
                        Цена: <span className="font-medium">{formatPrice(item.price_at_purchase)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Order Summary and Shipping Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Итого</h2>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline pb-3 border-b border-gray-200">
                <span className="text-gray-600">Товары:</span>
                <span className="text-lg text-gray-800">{order.total_items} шт.</span>
              </div>

              <div className="flex justify-between items-baseline font-bold text-2xl pt-2">
                <span className="text-gray-900">Сумма:</span>
                <span className="text-red-600">{formatPrice(order.total_price)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о доставке</h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Получатель:</span>
                <span className="text-gray-900 font-medium">
                  {order.first_name} {order.last_name}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Телефон:</span>
                <span className="text-gray-900 font-medium">{order.phone}</span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Email:</span>
                <span className="text-gray-900 font-medium">{order.email}</span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Город:</span>
                <span className="text-gray-900 font-medium">{order.city}</span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Индекс:</span>
                <span className="text-gray-900 font-medium">{order.postal_code}</span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Адрес:</span>
                <span className="text-gray-900 font-medium">{order.address}</span>
              </div>

              {order.notes && (
                <div>
                  <span className="text-gray-500 block mb-1">Примечания:</span>
                  <span className="text-gray-900">{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Info */}
          {canCancel && (
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded-md">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Вы можете отменить этот заказ
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Отмена возможна только для заказов со статусом "Создан", "Обновлен" или "Подтвержден".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
