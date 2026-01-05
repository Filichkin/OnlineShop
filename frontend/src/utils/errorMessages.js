/**
 * User-Friendly Error Messages
 *
 * Converts technical error messages and status codes
 * into user-friendly Russian messages
 */

/**
 * Error message mapping
 * Maps error codes, messages, and statuses to user-friendly messages
 */
const ERROR_MESSAGES = {
  // Network errors
  'Failed to fetch': 'Проблема с подключением к интернету. Проверьте соединение.',
  'Network error': 'Не удалось связаться с сервером. Попробуйте позже.',
  'NetworkError': 'Проблема с сетевым подключением. Проверьте интернет.',
  'Load failed': 'Ошибка загрузки данных. Попробуйте обновить страницу.',

  // Authentication errors
  'Токен не найден': 'Необходимо войти в систему',
  'Сессия истекла': 'Ваша сессия истекла. Войдите снова.',
  'Неверный логин или пароль': 'Неверный логин или пароль. Проверьте введенные данные.',
  'Пользователь не найден': 'Пользователь с такими данными не найден.',

  // Authorization errors
  'Недостаточно прав': 'У вас недостаточно прав для выполнения этой операции.',
  'Доступ запрещен': 'Доступ к этому ресурсу запрещен.',

  // Validation errors
  'Неверные данные': 'Введены некорректные данные. Проверьте форму.',
  'Обязательное поле': 'Заполните все обязательные поля.',
  'Некорректный email': 'Введите корректный email адрес.',
  'Некорректный телефон': 'Введите корректный номер телефона.',

  // Resource errors
  'Не найдено': 'Запрашиваемый ресурс не найден.',
  'Товар не найден': 'Товар не найден или был удален.',
  'Категория не найдена': 'Категория не найдена.',
  'Бренд не найден': 'Бренд не найден.',
  'Заказ не найден': 'Заказ не найден.',

  // Server errors
  'Ошибка сервера': 'Ошибка сервера. Мы уже работаем над исправлением.',
  'Сервер недоступен': 'Сервер временно недоступен. Попробуйте через несколько минут.',
  'Внутренняя ошибка': 'Произошла внутренняя ошибка сервера.',

  // Cart errors
  'Товар уже в корзине': 'Этот товар уже добавлен в корзину.',
  'Корзина пуста': 'Ваша корзина пуста.',
  'Недостаточно товара': 'Недостаточное количество товара на складе.',

  // Favorites errors
  'Товар уже в избранном': 'Этот товар уже в избранном.',

  // Order errors
  'Ошибка создания заказа': 'Не удалось создать заказ. Попробуйте еще раз.',
  'Ошибка оплаты': 'Ошибка при обработке платежа. Попробуйте другой способ оплаты.',

  // CSRF errors
  'CSRF': 'Ошибка безопасности. Обновите страницу и попробуйте снова.',

  // Timeout errors
  'timeout': 'Превышено время ожидания ответа. Попробуйте еще раз.',
  'Timeout': 'Время ожидания истекло. Проверьте соединение и попробуйте снова.',
};

/**
 * HTTP Status Code Messages
 */
const STATUS_MESSAGES = {
  400: 'Некорректный запрос. Проверьте введенные данные.',
  401: 'Необходимо войти в систему.',
  403: 'Недостаточно прав для выполнения операции.',
  404: 'Запрашиваемые данные не найдены.',
  409: 'Конфликт данных. Возможно, ресурс уже существует.',
  422: 'Ошибка валидации данных. Проверьте правильность заполнения полей.',
  429: 'Слишком много запросов. Подождите немного и попробуйте снова.',
  500: 'Ошибка сервера. Мы уже работаем над исправлением.',
  502: 'Сервер временно недоступен. Попробуйте позже.',
  503: 'Сервер временно недоступен. Попробуйте через несколько минут.',
  504: 'Превышено время ожидания ответа от сервера.',
};

/**
 * Get user-friendly error message
 *
 * @param {string|Error|Object} error - Error object, message, or status code
 * @returns {string} User-friendly error message
 *
 * @example
 * getUserFriendlyError('Failed to fetch')
 * // => 'Проблема с подключением к интернету. Проверьте соединение.'
 *
 * getUserFriendlyError({ status: 404 })
 * // => 'Запрашиваемые данные не найдены.'
 *
 * getUserFriendlyError(new Error('Network error'))
 * // => 'Не удалось связаться с сервером. Попробуйте позже.'
 */
export const getUserFriendlyError = (error) => {
  // Handle null or undefined
  if (!error) {
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }

  // Handle error object with status code
  if (typeof error === 'object' && error.status) {
    const statusCode = parseInt(error.status, 10);
    if (STATUS_MESSAGES[statusCode]) {
      return STATUS_MESSAGES[statusCode];
    }
  }

  // Handle numeric status code
  if (typeof error === 'number') {
    return STATUS_MESSAGES[error] || 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  }

  // Extract message from Error object
  let errorMessage = error;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error.message) {
    errorMessage = error.message;
  }

  // Convert to string
  errorMessage = String(errorMessage);

  // Check for exact match in ERROR_MESSAGES
  if (ERROR_MESSAGES[errorMessage]) {
    return ERROR_MESSAGES[errorMessage];
  }

  // Check for partial match (case-insensitive)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return message;
    }
  }

  // Check for status code in message (e.g., "Error 404")
  const statusMatch = errorMessage.match(/\b(\d{3})\b/);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10);
    if (STATUS_MESSAGES[statusCode]) {
      return STATUS_MESSAGES[statusCode];
    }
  }

  // Return original message if it's already user-friendly (in Russian)
  if (/[а-яА-ЯёЁ]/.test(errorMessage)) {
    return errorMessage;
  }

  // Default fallback message
  return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
};

/**
 * Get error message with additional context
 *
 * @param {string|Error|Object} error - Error object, message, or status code
 * @param {string} context - Additional context (e.g., 'при загрузке товаров')
 * @returns {string} User-friendly error message with context
 *
 * @example
 * getUserFriendlyErrorWithContext('Failed to fetch', 'при загрузке товаров')
 * // => 'Ошибка при загрузке товаров: Проблема с подключением к интернету.'
 */
export const getUserFriendlyErrorWithContext = (error, context) => {
  const message = getUserFriendlyError(error);
  if (context) {
    return `Ошибка ${context}: ${message}`;
  }
  return message;
};

/**
 * Check if error is a network error
 *
 * @param {string|Error|Object} error - Error to check
 * @returns {boolean} True if error is network-related
 */
export const isNetworkError = (error) => {
  if (!error) return false;

  const errorMessage = String(error.message || error).toLowerCase();
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('load failed') ||
    errorMessage.includes('timeout')
  );
};

/**
 * Check if error is an authentication error
 *
 * @param {string|Error|Object} error - Error to check
 * @returns {boolean} True if error is authentication-related
 */
export const isAuthError = (error) => {
  if (!error) return false;

  if (typeof error === 'object' && error.status === 401) {
    return true;
  }

  const errorMessage = String(error.message || error).toLowerCase();
  return (
    errorMessage.includes('токен') ||
    errorMessage.includes('сессия') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication')
  );
};

/**
 * Check if error is an authorization error
 *
 * @param {string|Error|Object} error - Error to check
 * @returns {boolean} True if error is authorization-related
 */
export const isAuthorizationError = (error) => {
  if (!error) return false;

  if (typeof error === 'object' && error.status === 403) {
    return true;
  }

  const errorMessage = String(error.message || error).toLowerCase();
  return (
    errorMessage.includes('прав') ||
    errorMessage.includes('доступ') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('authorization')
  );
};

export default {
  getUserFriendlyError,
  getUserFriendlyErrorWithContext,
  isNetworkError,
  isAuthError,
  isAuthorizationError,
};
