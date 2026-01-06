import { useEffect, useRef, useState } from 'react';
import { getImageUrl, formatPrice } from '../../utils';
import { adminOrdersAPI } from '../../api';
import { logger } from '../../utils/logger';
import { getUserFriendlyErrorWithContext } from '../../utils/errorMessages';

const OrderDetailsModal = ({ order, onClose, onStatusUpdate }) => {
  const modalRef = useRef(null);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Focus management
  useEffect(() => {
    if (modalRef.current) {
      const previouslyFocusedElement = document.activeElement;
      modalRef.current.focus();

      return () => {
        if (previouslyFocusedElement && previouslyFocusedElement.focus) {
          previouslyFocusedElement.focus();
        }
      };
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) {
      return; // No change
    }

    setUpdatingStatus(true);
    try {
      await adminOrdersAPI.updateOrderStatus(order.id, selectedStatus);

      // Notify parent component about the update
      if (onStatusUpdate) {
        onStatusUpdate(order.id, selectedStatus);
      }

      // Close modal after successful update
      onClose();
    } catch (err) {
      const friendlyError = getUserFriendlyErrorWithContext(err, 'при обновлении статуса заказа');
      alert(friendlyError);
      logger.error('Error updating order status:', err);
      // Reset to original status on error
      setSelectedStatus(order.status);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-blue-100 text-blue-800',
      updated: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-purple-100 text-purple-800',
      shipped: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      created: 'Создан',
      updated: 'Обновлен',
      confirmed: 'Подтвержден',
      shipped: 'Отправлен',
      canceled: 'Отменен',
    };
    return labels[status] || status;
  };

  const statuses = [
    { value: 'created', label: 'Создан' },
    { value: 'updated', label: 'Обновлен' },
    { value: 'confirmed', label: 'Подтвержден' },
    { value: 'shipped', label: 'Отправлен' },
    { value: 'canceled', label: 'Отменен' },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
        >
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Заказ {order.order_number}
                </h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* Status Update Section */}
                  <div className="flex items-center space-x-3">
                    <label htmlFor="status-select" className="text-sm font-medium text-gray-700">
                      Изменить статус:
                    </label>
                    <select
                      id="status-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={updatingStatus}
                      className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {selectedStatus !== order.status && (
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updatingStatus}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingStatus ? 'Сохранение...' : 'Сохранить'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onClose}
                aria-label="Закрыть"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Информация о заказчике</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Имя:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.first_name} {order.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{order.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Телефон:</span>
                    <span className="text-sm font-medium text-gray-900">{order.phone}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Адрес доставки</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <p className="text-sm text-gray-900">{order.city}, {order.postal_code}</p>
                  <p className="text-sm text-gray-900">{order.address}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Товары ({order.total_items || 0} шт.)</h4>
                {order.items && order.items.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Товар
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Цена
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Количество
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Сумма
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded object-cover"
                                    src={item.product?.main_image ? getImageUrl(item.product.main_image) : 'https://via.placeholder.com/40'}
                                    alt={item.product?.name || item.product_name}
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/40';
                                    }}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.product?.name || item.product_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.product?.part_number || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatPrice(item.price_at_purchase)} ₽</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatPrice(item.price_at_purchase * item.quantity)} ₽
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                    Нет товаров в заказе
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <span>Итого:</span>
                  <span>{formatPrice(order.total_price)} ₽</span>
                </div>
              </div>

              {/* Order History/Timeline */}
              {order.updated_at !== order.created_at && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">История заказа</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Создан:</span>
                      <span className="text-sm text-gray-900">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Последнее обновление:</span>
                      <span className="text-sm text-gray-900">{formatDate(order.updated_at)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
