import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCart } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/formatPrice';

/**
 * OrderSuccess page component
 *
 * Displayed after successful order creation
 * Shows order details and confirmation message
 * Cart is automatically cleared by the backend
 */
function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get order data from navigation state
  const orderData = location.state;

  // Redirect to home if no order data (direct access to page)
  useEffect(() => {
    if (!orderData || !orderData.orderNumber) {
      navigate('/', { replace: true });
    }
  }, [orderData, navigate]);

  // Reload cart (it should be empty after order creation)
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Don't render if no order data
  if (!orderData || !orderData.orderNumber) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 sm:p-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Заказ успешно оформлен!</h1>
          <p className="text-lg text-gray-600">
            Спасибо за ваш заказ. Мы начнем его обработку в ближайшее время.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Номер заказа:</span>
            <span className="text-xl font-bold text-gray-900">{orderData.orderNumber}</span>
          </div>

          {orderData.totalPrice !== undefined && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Сумма заказа:</span>
              <span className="text-xl font-bold text-red-600">{formatPrice(orderData.totalPrice)}</span>
            </div>
          )}

          {orderData.email && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Email для уведомлений:</span>
              <span className="text-base text-gray-900">{orderData.email}</span>
            </div>
          )}
        </div>

        {/* Email Notification Info */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8 rounded-md">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Проверьте вашу почту
              </h3>
              <p className="text-sm text-blue-800">
                Детали заказа отправлены на <strong>{orderData.email}</strong>.
                Проверьте папку "Спам", если письмо не пришло в течение нескольких минут.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Что дальше?</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Мы обработаем ваш заказ и свяжемся с вами для подтверждения</span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>После подтверждения заказ будет отправлен по указанному адресу</span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Вы получите уведомление о статусе доставки на указанный email</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile?tab=orders"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Мои заказы
          </Link>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            На главную
          </Link>
        </div>

        {/* Support Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Есть вопросы по заказу?{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-700 underline">
              Свяжитесь с нами
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
