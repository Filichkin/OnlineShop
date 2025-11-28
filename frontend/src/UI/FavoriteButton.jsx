import { useDispatch, useSelector } from 'react-redux';
import {
  toggleFavorite,
  selectIsFavorite,
  selectIsUpdatingFavorite,
} from '../store/slices/favoritesSlice';
import { logger } from '../utils/logger';

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
 * @param {string} iconSize - Размер иконки (по умолчанию 'w-5 h-5')
 */
function FavoriteButton({ product, className = "", iconSize = "w-5 h-5" }) {
  const dispatch = useDispatch();

  // Получаем состояние избранного из Redux
  const isFavorite = useSelector(selectIsFavorite(product.id));
  const isUpdating = useSelector(selectIsUpdatingFavorite(product.id));

  // Переключение состояния избранного
  const handleToggleFavorite = async (e) => {
    // Предотвращаем всплытие события (чтобы не сработал клик на карточке товара)
    e.preventDefault();
    e.stopPropagation();

    // Убираем фокус с кнопки после клика, чтобы не оставался focus ring
    e.currentTarget.blur();

    if (isUpdating) return;

    try {
      // Вызываем Redux action для переключения избранного
      // Передаем полные данные продукта для поддержки гостевых пользователей с localStorage
      await dispatch(toggleFavorite({
        productId: product.id,
        productData: product  // Pass full product object for guest users
      })).unwrap();
    } catch (err) {
      logger.error('Ошибка при переключении избранного:', err);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isUpdating}
      className={`
        group relative flex items-center justify-center
        border rounded-md border-gray-200 bg-white
        transition-all duration-200
        hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className || 'w-10 h-7'}
      `}
      aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      {isUpdating ? (
        // Loading spinner
        <svg
          className={`${iconSize} text-gray-400 animate-spin`}
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
      ) : isFavorite ? (
        // Filled heart (в избранном) - светло-черный цвет
        <svg
          className={`${iconSize} transition-transform duration-200 group-hover:scale-110`}
          fill="rgb(55 65 81)"
          viewBox="0 0 24 24"
        >
          <path d="M12 21s-6-4.6-9-8.9C1.1 9 2.4 5.5 5.2 4.2c2-.9 4.4-.3 5.8 1.3L12 7l1-1.5c1.4-1.6 3.8-2.2 5.8-1.3 2.8 1.3 4.1 4.8 1.8 7.9C18 16.4 12 21 12 21z" />
        </svg>
      ) : (
        // Outline heart (не в избранном) - серый контур
        <svg
          className={`${iconSize} text-gray-500 transition-all duration-200 group-hover:text-gray-700 group-hover:scale-110`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M12 21s-6-4.6-9-8.9C1.1 9 2.4 5.5 5.2 4.2c2-.9 4.4-.3 5.8 1.3L12 7l1-1.5c1.4-1.6 3.8-2.2 5.8-1.3 2.8 1.3 4.1 4.8 1.8 7.9C18 16.4 12 21 12 21z" />
        </svg>
      )}
    </button>
  );
}

export default FavoriteButton;
