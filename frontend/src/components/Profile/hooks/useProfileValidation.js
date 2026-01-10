import { useState } from 'react';
import { isValidPhone, isValidTelegramId, isValidBirthDate } from '../../../utils/validation';

/**
 * Hook для валидации формы профиля
 */
export function useProfileValidation() {
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = (profileData) => {
    const errors = {};

    // First name is required
    if (!profileData.first_name || profileData.first_name.trim().length === 0) {
      errors.first_name = 'Имя обязательно для заполнения';
    } else if (profileData.first_name.length > 50) {
      errors.first_name = 'Имя не может быть длиннее 50 символов';
    }

    // Phone is required and must be valid
    if (!profileData.phone) {
      errors.phone = 'Телефон обязателен';
    } else if (!isValidPhone(profileData.phone)) {
      errors.phone = 'Неверный формат телефона (+7XXXXXXXXXX)';
    }

    // Last name is optional but has max length
    if (profileData.last_name && profileData.last_name.length > 50) {
      errors.last_name = 'Фамилия не может быть длиннее 50 символов';
    }

    // Telegram ID validation (optional)
    if (profileData.telegram_id && !isValidTelegramId(profileData.telegram_id)) {
      errors.telegram_id = 'Неверный формат Telegram ID (должен начинаться с @ и содержать 6-33 символа)';
    }

    // Date of birth validation (optional, must not be in future)
    if (profileData.date_of_birth && !isValidBirthDate(profileData.date_of_birth)) {
      errors.date_of_birth = 'Дата рождения не может быть в будущем';
    }

    // City max length
    if (profileData.city && profileData.city.length > 100) {
      errors.city = 'Город не может быть длиннее 100 символов';
    }

    // Address max length
    if (profileData.address && profileData.address.length > 255) {
      errors.address = 'Адрес не может быть длиннее 255 символов';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const clearAllErrors = () => {
    setValidationErrors({});
  };

  return { validationErrors, validateForm, clearFieldError, clearAllErrors };
}
