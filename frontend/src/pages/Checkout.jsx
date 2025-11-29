import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartIsLoaded, fetchCart } from '../store/slices/cartSlice';
import { ordersAPI } from '../api';
import { formatPrice } from '../utils/formatPrice';
import {
  validateFirstName,
  validateLastName,
  validateCity,
  validateAddress,
  isValidPostalCode,
  isValidPhone,
  isValidEmail,
  formatPhoneNumber,
} from '../utils/validation';
import LoginModal from '../components/LoginModal';
import { sanitizeText } from '../utils/sanitize';
import { logger } from '../utils/logger';

/**
 * Checkout page component
 *
 * Features:
 * - Pre-fills form with user profile data if available
 * - Validates all required fields
 * - Shows cart summary with items and total price
 * - Redirects to login if user is not authenticated
 * - Creates order and navigates to success page
 * - Clears cart automatically on backend after successful order
 */
function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector(selectCartItems);
  const cartIsLoaded = useSelector(selectCartIsLoaded);

  // Local state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [rateLimitTimer, setRateLimitTimer] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    city: '',
    postal_code: '',
    address: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Load cart if not loaded
  useEffect(() => {
    if (!cartIsLoaded) {
      dispatch(fetchCart());
    }
  }, [cartIsLoaded, dispatch]);

  // Check authentication and show login modal if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  // Pre-fill form with user data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        city: user.city || prev.city,
        address: user.address || prev.address,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (cartIsLoaded && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartIsLoaded, cartItems.length, navigate]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price_at_addition * item.quantity, 0);
  }, [cartItems]);

  // Calculate total quantity
  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Rate limit timer countdown
  useEffect(() => {
    if (rateLimitTimer > 0) {
      const timer = setTimeout(() => {
        setRateLimitTimer(rateLimitTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitTimer === 0) {
      setIsRateLimited(false);
      setRateLimitTimer(null);
    }
  }, [rateLimitTimer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Format phone number
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    // First name validation
    const firstNameValidation = validateFirstName(formData.first_name);
    if (!firstNameValidation.isValid) {
      errors.first_name = firstNameValidation.error;
    }

    // Last name validation
    const lastNameValidation = validateLastName(formData.last_name);
    if (!lastNameValidation.isValid) {
      errors.last_name = lastNameValidation.error;
    }

    // City validation
    const cityValidation = validateCity(formData.city);
    if (!cityValidation.isValid) {
      errors.city = cityValidation.error;
    }

    // Postal code validation
    if (!formData.postal_code) {
      errors.postal_code = 'Индекс обязателен для заполнения';
    } else if (!isValidPostalCode(formData.postal_code)) {
      errors.postal_code = 'Индекс должен содержать 6 цифр';
    }

    // Address validation
    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.isValid) {
      errors.address = addressValidation.error;
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = 'Телефон обязателен для заполнения';
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Неверный формат телефона (+7XXXXXXXXXX)';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email обязателен для заполнения';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Неверный формат email';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Check if cart is not empty
    if (cartItems.length === 0) {
      setSubmitError('Корзина пуста. Добавьте товары перед оформлением заказа.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare order data (only send fields that backend expects)
      const orderData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        city: formData.city.trim(),
        postal_code: formData.postal_code.trim(),
        address: formData.address.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
      };

      // Add notes only if provided
      if (formData.notes && formData.notes.trim()) {
        orderData.notes = formData.notes.trim();
      }

      // Create order
      const response = await ordersAPI.createOrder(orderData);

      // Navigate to success page with order data
      navigate('/order-success', {
        state: {
          orderNumber: response.order_number,
          orderId: response.order_id,
          totalPrice: response.total_price,
          email: formData.email,
        },
        replace: true, // Don't allow going back to checkout
      });
    } catch (error) {
      logger.error('Order submission error:', error);

      // Handle rate limiting (429 error)
      if (error.status === 429 || error.message?.includes('Слишком много заказов')) {
        setIsRateLimited(true);
        // Extract retry-after from error or default to 60 seconds
        const retryAfterMatch = error.message?.match(/через (\d+)/);
        const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60;
        setRateLimitTimer(retryAfter);
      }

      setSubmitError(error.message || 'Произошла ошибка при оформлении заказа. Попробуйте снова.');
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
    // If user is still not authenticated after closing modal, redirect to cart
    if (!isAuthenticated) {
      navigate('/cart');
    }
  };

  // Show loading state while cart is loading
  if (!cartIsLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Загрузка данных корзины...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="mb-8 text-2xl font-semibold text-left text-gray-700">Оформление заказа</h1>

        {/* Error notification */}
        {submitError && (
          <div
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-md"
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
                <h3 className="text-sm font-semibold text-red-800 mb-1">Ошибка оформления заказа</h3>
                <p className="text-sm text-red-700">{sanitizeText(submitError)}</p>
              </div>
              <button
                onClick={() => setSubmitError(null)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <section className="lg:col-span-2" aria-labelledby="checkout-form-heading">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 id="checkout-form-heading" className="text-xl font-semibold text-gray-800 mb-6">
                Данные для доставки
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Иван"
                    disabled={isSubmitting}
                    aria-invalid={validationErrors.first_name ? 'true' : 'false'}
                    aria-describedby={validationErrors.first_name ? 'first_name-error' : undefined}
                  />
                  {validationErrors.first_name && (
                    <p id="first_name-error" className="mt-1 text-sm text-red-600">
                      {validationErrors.first_name}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Иванов"
                    disabled={isSubmitting}
                    aria-invalid={validationErrors.last_name ? 'true' : 'false'}
                    aria-describedby={validationErrors.last_name ? 'last_name-error' : undefined}
                  />
                  {validationErrors.last_name && (
                    <p id="last_name-error" className="mt-1 text-sm text-red-600">
                      {validationErrors.last_name}
                    </p>
                  )}
                </div>

                {/* City and Postal Code - 2 columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Город <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        validationErrors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Москва"
                      disabled={isSubmitting}
                      aria-invalid={validationErrors.city ? 'true' : 'false'}
                      aria-describedby={validationErrors.city ? 'city-error' : undefined}
                    />
                    {validationErrors.city && (
                      <p id="city-error" className="mt-1 text-sm text-red-600">
                        {validationErrors.city}
                      </p>
                    )}
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                      Индекс <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      maxLength={6}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        validationErrors.postal_code ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123456"
                      disabled={isSubmitting}
                      aria-invalid={validationErrors.postal_code ? 'true' : 'false'}
                      aria-describedby={validationErrors.postal_code ? 'postal_code-error' : undefined}
                    />
                    {validationErrors.postal_code && (
                      <p id="postal_code-error" className="mt-1 text-sm text-red-600">
                        {validationErrors.postal_code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                      validationErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ул. Примерная, д. 1, кв. 10"
                    disabled={isSubmitting}
                    aria-invalid={validationErrors.address ? 'true' : 'false'}
                    aria-describedby={validationErrors.address ? 'address-error' : undefined}
                  />
                  {validationErrors.address && (
                    <p id="address-error" className="mt-1 text-sm text-red-600">
                      {validationErrors.address}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Укажите улицу, дом, квартиру</p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+7 900 000-00-00"
                    disabled={isSubmitting}
                    aria-invalid={validationErrors.phone ? 'true' : 'false'}
                    aria-describedby={validationErrors.phone ? 'phone-error' : undefined}
                  />
                  {validationErrors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600">
                      {validationErrors.phone}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Формат: +7XXXXXXXXXX</p>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                    disabled={isSubmitting}
                    aria-invalid={validationErrors.email ? 'true' : 'false'}
                    aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  />
                  {validationErrors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600">
                      {validationErrors.email}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Детали заказа будут отправлены на этот адрес</p>
                </div>

                {/* Notes (optional) */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Примечания
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                    placeholder="Дополнительные пожелания к заказу (необязательно)"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">Например, время доставки или особые пожелания</p>
                </div>

                {/* Submit button for mobile - hidden on desktop */}
                <button
                  type="submit"
                  disabled={isSubmitting || isRateLimited || cartItems.length === 0}
                  className="lg:hidden w-full px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  aria-label={isRateLimited ? `Подождите ${rateLimitTimer} секунд` : undefined}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Оформление...
                    </span>
                  ) : isRateLimited && rateLimitTimer ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Подождите {rateLimitTimer} сек
                    </span>
                  ) : (
                    'Оформить заказ'
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Order Summary */}
          <section className="lg:col-span-1" aria-labelledby="order-summary-heading">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 id="order-summary-heading" className="text-xl font-semibold text-gray-800 mb-4">
                Ваш заказ
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-3 pb-3 border-b border-gray-200">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={item.product.main_image || 'https://via.placeholder.com/64?text=No+Image'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Количество: {item.quantity}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.price_at_addition * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary totals */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Товаров:</span>
                  <span className="text-lg text-gray-800">{totalQuantity} шт.</span>
                </div>
                <div className="flex justify-between items-baseline font-bold text-xl pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Итого:</span>
                  <span className="text-gray-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Submit button for desktop */}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isRateLimited || cartItems.length === 0}
                className="hidden lg:block w-full mt-6 px-6 py-3 text-base font-semibold text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                aria-label={isRateLimited ? `Подождите ${rateLimitTimer} секунд` : undefined}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Оформление...
                  </span>
                ) : isRateLimited && rateLimitTimer ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Подождите {rateLimitTimer} сек
                  </span>
                ) : (
                  'Оформить заказ'
                )}
              </button>

              {/* Info message */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs text-blue-800">
                    После оформления заказа детали будут отправлены на указанный email
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={handleLoginModalClose} />
    </>
  );
}

export default Checkout;
