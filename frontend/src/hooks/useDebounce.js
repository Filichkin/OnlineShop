import { useState, useEffect } from 'react';

/**
 * Custom hook для debouncing значений
 *
 * Используется для отложенного обновления значения, что позволяет
 * избежать множественных вызовов функций при быстрых изменениях input
 *
 * @param {any} value - Значение для debounce
 * @param {number} delay - Задержка в миллисекундах (по умолчанию 500ms)
 * @returns {any} - Debounced значение
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // Этот эффект выполнится только после того, как пользователь
 *   // прекратит ввод на 300ms
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Устанавливаем таймер для обновления debounced значения
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup функция: очищаем таймер при изменении value или размонтировании
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
