/**
 * Validation utilities for user authentication and profile forms
 */

/**
 * Validates phone number in format +7XXXXXXXXXX (exactly 12 characters)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+7\d{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * Must be at least 8 characters with letter, digit, and special character
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну букву');
  }

  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы один специальный символ');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculates password strength (0-100)
 * @param {string} password - Password to check
 * @returns {number} Strength score 0-100
 */
export const getPasswordStrength = (password) => {
  let strength = 0;

  if (!password) return 0;

  // Length check
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (password.length >= 16) strength += 10;

  // Character variety checks
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;

  return Math.min(strength, 100);
};

/**
 * Validates Telegram ID format (@username, 6-33 characters)
 * @param {string} telegramId - Telegram ID to validate
 * @returns {boolean} True if valid
 */
export const isValidTelegramId = (telegramId) => {
  if (!telegramId) return true; // Optional field
  const telegramRegex = /^@[a-zA-Z0-9_]{5,32}$/;
  return telegramRegex.test(telegramId);
};

/**
 * Validates date is not in the future
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid
 */
export const isValidBirthDate = (dateString) => {
  if (!dateString) return true; // Optional field
  const date = new Date(dateString);
  const now = new Date();
  return date <= now;
};

/**
 * Formats phone number by automatically adding +7 prefix if needed
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 8, replace with 7
  if (cleaned.startsWith('8')) {
    cleaned = '7' + cleaned.substring(1);
  }

  // If doesn't start with 7, add 7 at the beginning
  if (!cleaned.startsWith('7')) {
    cleaned = '7' + cleaned;
  }

  // Limit to 11 digits (7 + 10)
  cleaned = cleaned.substring(0, 11);

  // Add + prefix
  return '+' + cleaned;
};

/**
 * Detects if input is phone or email
 * @param {string} input - User input
 * @returns {'phone' | 'email' | 'unknown'} Detected type
 */
export const detectInputType = (input) => {
  if (!input) return 'unknown';

  // Check if it looks like a phone number (starts with + or contains only digits and spaces/dashes)
  if (/^[\+\d\s\-()]+$/.test(input)) {
    return 'phone';
  }

  // Check if it looks like an email
  if (input.includes('@')) {
    return 'email';
  }

  return 'unknown';
};

/**
 * Validates first name
 * @param {string} name - First name to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateFirstName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Имя обязательно для заполнения' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Имя не может быть длиннее 50 символов' };
  }

  return { isValid: true, error: '' };
};

/**
 * Get password strength label and color
 * @param {number} strength - Strength score (0-100)
 * @returns {object} { label: string, color: string }
 */
export const getPasswordStrengthLabel = (strength) => {
  if (strength < 30) {
    return { label: 'Слабый', color: 'text-red-600' };
  }
  if (strength < 60) {
    return { label: 'Средний', color: 'text-yellow-600' };
  }
  if (strength < 85) {
    return { label: 'Хороший', color: 'text-blue-600' };
  }
  return { label: 'Отличный', color: 'text-green-600' };
};

/**
 * Validates postal code (6 digits for Russian postal codes)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} True if valid
 */
export const isValidPostalCode = (postalCode) => {
  const postalCodeRegex = /^\d{6}$/;
  return postalCodeRegex.test(postalCode);
};

/**
 * Validates last name
 * @param {string} lastName - Last name to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateLastName = (lastName) => {
  if (!lastName || lastName.trim().length === 0) {
    return { isValid: false, error: 'Фамилия обязательна для заполнения' };
  }

  if (lastName.length > 50) {
    return { isValid: false, error: 'Фамилия не может быть длиннее 50 символов' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validates city name
 * @param {string} city - City name to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateCity = (city) => {
  if (!city || city.trim().length === 0) {
    return { isValid: false, error: 'Город обязателен для заполнения' };
  }

  if (city.length > 100) {
    return { isValid: false, error: 'Город не может быть длиннее 100 символов' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validates address
 * @param {string} address - Address to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateAddress = (address) => {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: 'Адрес обязателен для заполнения' };
  }

  if (address.length < 10) {
    return { isValid: false, error: 'Адрес слишком короткий (минимум 10 символов)' };
  }

  if (address.length > 255) {
    return { isValid: false, error: 'Адрес не может быть длиннее 255 символов' };
  }

  return { isValid: true, error: '' };
};
