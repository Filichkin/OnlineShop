// Use empty string to make relative URLs work with proxy
const API_BASE_URL = '';

/**
 * Формирует полный URL для изображения
 * @param {string} imagePath - относительный путь к изображению (например, 'media/products/image.jpg')
 * @returns {string} - полный URL к изображению
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Убираем начальный слэш если он есть, чтобы избежать двойных слэшей
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${API_BASE_URL}/${cleanPath}`;
};

