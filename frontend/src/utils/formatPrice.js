/**
 * Форматирует цену в рублях с разделителями разрядов
 * @param {number} price - цена для форматирования
 * @returns {string} - отформатированная цена (например, "1 000,00 ₽")
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

