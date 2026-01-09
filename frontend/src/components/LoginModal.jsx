import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register, login, forgotPassword, getCurrentUser, clearError, clearSuccessMessage } from '../store/slices/authSlice';
import { syncGuestCart, selectCartIsGuest } from '../store/slices/cartSlice';
import { syncGuestFavorites, selectFavoritesIsGuest } from '../store/slices/favoritesSlice';
import {
  isValidPhone,
  isValidEmail,
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthLabel,
  formatPhoneNumber,
  detectInputType,
  validateFirstName,
} from '../utils/validation';
import { sanitizeText } from '../utils/sanitize';
import { logger } from '../utils/logger';
import { useDebounceCallback } from '../hooks/useDebounceCallback';
import { getUserFriendlyError } from '../utils/errorMessages';

/**
 * LoginModal компонент для входа/регистрации пользователя
 *
 * Поддерживает три режима:
 * - login: Вход в систему
 * - register: Регистрация нового пользователя
 * - recovery: Восстановление пароля
 */
function LoginModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);
  const isCartGuest = useSelector(selectCartIsGuest);
  const isFavoritesGuest = useSelector(selectFavoritesIsGuest);

  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    identifier: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [rateLimitTimer, setRateLimitTimer] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Сброс формы при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setFormData({
        firstName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        identifier: '',
      });
      setValidationErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordStrength(0);
      setRateLimitTimer(null);
      setIsRateLimited(false);
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    }
  }, [isOpen, dispatch]);

  // Use refs to avoid memory leaks
  const onCloseRef = useRef(onClose);
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  // Закрытие после успешного действия
  useEffect(() => {
    if (successMessage && (mode === 'login' || mode === 'register')) {
      // Sync guest cart and favorites with server after successful login/registration
      // This merges guest data (from localStorage) with server data
      if (isCartGuest) {
        dispatchRef.current(syncGuestCart());
      }
      if (isFavoritesGuest) {
        dispatchRef.current(syncGuestFavorites());
      }

      // Close modal after short delay
      setTimeout(() => {
        onCloseRef.current();
      }, 1500);
    }
  }, [successMessage, mode, isCartGuest, isFavoritesGuest]);

  // Закрытие модального окна при нажатии Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Предотвращение скролла body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Обновление силы пароля при регистрации
  useEffect(() => {
    if (mode === 'register' && formData.password) {
      setPasswordStrength(getPasswordStrength(formData.password));
    }
  }, [formData.password, mode]);

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

  // Memoized input change handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    // Форматирование телефона
    if (name === 'phone' && mode === 'register') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Очистка ошибки для этого поля
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Очистка ошибки подтверждения пароля при изменении любого пароля
    if ((name === 'password' || name === 'confirmPassword') && validationErrors.confirmPassword) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  }, [mode, validationErrors]);

  // Memoized form validation to prevent unnecessary recalculations
  const validateForm = useCallback(() => {
    const errors = {};

    if (mode === 'register') {
      // Валидация имени
      const nameValidation = validateFirstName(formData.firstName);
      if (!nameValidation.isValid) {
        errors.firstName = nameValidation.error;
      }

      // Валидация телефона
      if (!formData.phone) {
        errors.phone = 'Телефон обязателен';
      } else if (!isValidPhone(formData.phone)) {
        errors.phone = 'Неверный формат телефона (+7XXXXXXXXXX)';
      }

      // Валидация email
      if (!formData.email) {
        errors.email = 'Email обязателен';
      } else if (!isValidEmail(formData.email)) {
        errors.email = 'Неверный формат email';
      }

      // Валидация пароля
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
      }

      // Валидация подтверждения пароля
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Подтвердите пароль';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Пароли не совпадают';
      }
    } else if (mode === 'login') {
      // Валидация идентификатора
      if (!formData.identifier) {
        errors.identifier = 'Введите телефон или email';
      }

      // Валидация пароля
      if (!formData.password) {
        errors.password = 'Введите пароль';
      }
    } else if (mode === 'recovery') {
      // Валидация идентификатора для восстановления
      if (!formData.identifier) {
        errors.identifier = 'Введите телефон или email';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [mode, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'register') {
        await dispatch(
          register({
            first_name: formData.firstName,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
          })
        ).unwrap();
      } else if (mode === 'login') {
        await dispatch(
          login({
            identifier: formData.identifier,
            password: formData.password,
          })
        ).unwrap();
      } else if (mode === 'recovery') {
        await dispatch(forgotPassword(formData.identifier)).unwrap();
      }
    } catch (err) {
      // Handle rate limiting (429 error)
      if (err.status === 429 || err.message?.includes('Слишком много попыток')) {
        setIsRateLimited(true);
        // Extract retry-after from error or default to 60 seconds
        const retryAfterMatch = err.message?.match(/через (\d+)/);
        const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60;
        setRateLimitTimer(retryAfter);
      }
      // Error is handled by Redux
      logger.error('Form submission error:', err);
    }
  };

  // Debounced submit handler to prevent multiple clicks
  // Security: Increased from 1000ms to 2000ms to prevent brute-force attacks
  const handleSubmitDebounced = useDebounceCallback(handleSubmit, 2000);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded z-10"
          aria-label="Закрыть"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          {/* Показываем спиннер с сообщением при успешном входе/регистрации */}
          {successMessage && (mode === 'login' || mode === 'register') ? (
            <div className="flex flex-col items-center justify-center py-12">
              {/* Спиннер */}
              <div className="relative mb-6">
                <svg className="animate-spin h-16 w-16 text-blue-600" viewBox="0 0 24 24">
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
              </div>

              {/* Сообщение */}
              <p className="text-lg font-medium text-gray-900 mb-2">
                {mode === 'login' ? 'Выполняется вход...' : 'Выполняется регистрация...'}
              </p>
              <p className="text-sm text-gray-500">
                Пожалуйста, подождите
              </p>
            </div>
          ) : (
            <>
              {/* Title */}
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900 mb-6">
                {mode === 'login' && 'Вход'}
                {mode === 'register' && 'Регистрация'}
                {mode === 'recovery' && 'Восстановление пароля'}
              </h2>

              {/* Success Message для восстановления пароля */}
              {successMessage && mode === 'recovery' && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md text-sm">
                  {successMessage}
                </div>
              )}

              {/* Error Message - don't show "Токен не найден" error */}
              {error && error !== 'Токен не найден' && !error.includes('Сессия истекла') && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
                  {sanitizeText(getUserFriendlyError(error))}
                </div>
              )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Fields */}
            {mode === 'register' && (
              <>
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Введите ваше имя"
                    autoComplete="given-name"
                    disabled={loading}
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+7 900 000-00-00"
                    autoComplete="tel"
                    disabled={loading}
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password with strength indicator */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Минимум 8 символов"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Сила пароля:</span>
                        <span className={`text-xs font-medium ${strengthInfo.color}`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength < 30
                              ? 'bg-red-500'
                              : passwordStrength < 60
                              ? 'bg-yellow-500'
                              : passwordStrength < 85
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Используйте буквы, цифры и специальные символы
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Повторите пароль <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Повторите пароль"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                  {/* Show match indicator when both passwords are filled */}
                  {formData.password && formData.confirmPassword && !validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Пароли совпадают
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Login/Recovery Identifier Field */}
            {(mode === 'login' || mode === 'recovery') && (
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  {mode === 'recovery' ? 'Email или телефон' : 'Телефон или Email'}
                </label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.identifier ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com или +7 900 000-00-00"
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  disabled={loading}
                />
                {validationErrors.identifier && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.identifier}</p>
                )}
              </div>
            )}

            {/* Password for Login */}
            {mode === 'login' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      validationErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isRateLimited}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label={isRateLimited ? `Подождите ${rateLimitTimer} секунд` : undefined}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Загрузка...
                </span>
              ) : isRateLimited && rateLimitTimer ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Подождите {rateLimitTimer} сек
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Войти'}
                  {mode === 'register' && 'Зарегистрироваться'}
                  {mode === 'recovery' && 'Восстановить пароль'}
                </>
              )}
            </button>
          </form>

              {/* Mode Switcher */}
              <div className="mt-6 space-y-2">
                {mode === 'login' && (
                  <>
                    <button
                      onClick={() => setMode('recovery')}
                      className="block w-full text-sm text-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                      disabled={loading}
                    >
                      Забыли пароль?
                    </button>
                    <button
                      onClick={() => setMode('register')}
                      className="block w-full text-sm text-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
                      disabled={loading}
                    >
                      Нет аккаунта? Зарегистрируйтесь
                    </button>
                  </>
                )}

                {(mode === 'register' || mode === 'recovery') && (
                  <button
                    onClick={() => setMode('login')}
                    className="block w-full text-sm text-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                    disabled={loading}
                  >
                    Вернуться к входу
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
