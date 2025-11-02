import { useState, useEffect } from 'react';

/**
 * LoginModal компонент для входа/регистрации пользователя
 *
 * Поддерживает три режима:
 * - login: Вход в систему
 * - register: Регистрация нового пользователя
 * - recovery: Восстановление пароля
 *
 * @param {boolean} isOpen - Флаг открытия модального окна
 * @param {function} onClose - Функция закрытия модального окна
 */
function LoginModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'recovery'
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // Сброс формы при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setFormData({
        emailOrPhone: '',
        password: '',
        confirmPassword: '',
        name: '',
      });
    }
  }, [isOpen]);

  // Закрытие модального окна при нажатии Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Предотвращение скролла body когда модальное окно открыто
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: Интеграция с backend API
    console.log('Form submitted:', { mode, formData });

    // Временно закрываем модальное окно после отправки
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
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
          {/* Title */}
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900 mb-6">
            {mode === 'login' && 'Вход'}
            {mode === 'register' && 'Регистрация'}
            {mode === 'recovery' && 'Восстановление пароля'}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - только для регистрации */}
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите ваше имя"
                  required
                />
              </div>
            )}

            {/* Email or Phone */}
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'recovery' ? 'Email или телефон' : 'Email или телефон'}
              </label>
              <input
                type="text"
                id="emailOrPhone"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com или +7 900 000-00-00"
                required
              />
            </div>

            {/* Password - не отображается в режиме восстановления */}
            {mode !== 'recovery' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите пароль"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Confirm Password - только для регистрации */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Повторите пароль"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
            >
              {mode === 'login' && 'Войти'}
              {mode === 'register' && 'Зарегистрироваться'}
              {mode === 'recovery' && 'Восстановить пароль'}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 space-y-2">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => setMode('recovery')}
                  className="block w-full text-sm text-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
                >
                  Забыли пароль?
                </button>
                <button
                  onClick={() => setMode('register')}
                  className="block w-full text-sm text-center text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
                >
                  Нет аккаунта? Зарегистрируйтесь
                </button>
              </>
            )}

            {(mode === 'register' || mode === 'recovery') && (
              <button
                onClick={() => setMode('login')}
                className="block w-full text-sm text-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline"
              >
                Вернуться к входу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
