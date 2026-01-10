import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils';

/**
 * OrderCard - карточка заказа
 */
function OrderCard({ order }) {
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

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <h3 className="font-semibold text-gray-900">
          Заказ {order.order_number}
        </h3>
        <span className={`px-3 py-1 text-sm rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        Дата: {new Date(order.created_at).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
      <p className="text-sm text-gray-600">
        Товаров: {order.total_items} шт.
      </p>
      <p className="text-sm font-semibold text-gray-900">
        Сумма: {formatPrice(order.total_price)}
      </p>
      <Link
        to={`/order/${order.id}`}
        className="mt-3 inline-block text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors focus:outline-none focus:underline"
      >
        Подробнее →
      </Link>
    </div>
  );
}

export default OrderCard;
