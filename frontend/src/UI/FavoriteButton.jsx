import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleFavorite,
  selectIsFavorite,
  selectIsUpdatingFavorite,
} from '../store/slices/favoritesSlice';

/**
 * Кнопка добавления/удаления товара из избранного
 *
 * ОПТИМИЗАЦИЯ: Интегрирована с Redux для автоматического обновления
 * состояния избранного во всем приложении (Header badge, Favorites page)
 *
 * ПОВЕДЕНИЕ:
 * - Если товар НЕ в избранном: показывает контур сердца (серый)
 * - Если товар В избранном: показывает заполненное сердце (светло-черный)
 * - Анимация при наведении и клике
 * - Показывает loading состояние
 *
 * @param {Object} product - Объект товара с id
 * @param {string} className - Дополнительные CSS классы
 */
function FavoriteButton({ product, className = "" }) {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  // Получаем состояние избранного из Redux
  const isFavorite = useSelector(selectIsFavorite(product.id));
  const isUpdating = useSelector(selectIsUpdatingFavorite(product.id));

  // Переключение состояния избранного
  const handleToggleFavorite = async (e) => {
    // Предотвращаем всплытие события (чтобы не сработал клик на карточке товара)
    e.preventDefault();
    e.stopPropagation();

    if (isUpdating) return;

    setError(null);

    try {
      // Вызываем Redux action для переключения избранного
      await dispatch(toggleFavorite(product.id)).unwrap();
    } catch (err) {
      console.error('Ошибка при переключении избранного:', err);
      setError(err?.message || 'Не удалось обновить избранное');

      // Сбрасываем ошибку через 3 секунды
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleFavorite}
        disabled={isUpdating}
        className={`
          group relative p-1.5 rounded-full transition-all duration-200
          hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'bg-red-50' : ''}
          ${className}
        `}
        aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        title={error ? error : isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      >
        {isUpdating ? (
          // Loading spinner
          <svg
            className="w-6 h-6 text-gray-400 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : error ? (
          // Error icon
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : isFavorite ? (
          // Filled heart (в избранном) - светло-черный цвет
          <svg
            className="w-6 h-6 text-gray-700 transition-transform duration-200 group-hover:scale-110"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          // Outline heart (не в избранном) - серый контур
          <svg
            className="w-6 h-6 text-gray-400 transition-all duration-200 group-hover:text-gray-600 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>

      {/* Tooltip с ошибкой */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-xs text-white bg-red-600 rounded whitespace-nowrap z-10 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}

export default FavoriteButton;
