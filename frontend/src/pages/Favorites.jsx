import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchFavorites,
  selectFavoriteItems,
  selectFavoritesIsLoading,
  selectFavoritesError,
  selectFavoritesIsLoaded,
} from '../store/slices/favoritesSlice';
import { getImageUrl, formatPrice } from '../utils';
import AddToCartButton from '../UI/AddToCartButton';
import FavoriteButton from '../UI/FavoriteButton';

/**
 * Страница избранных товаров
 *
 * ОПТИМИЗАЦИИ:
 * 1. Использует Redux для глобального state management - избранное загружается один раз
 * 2. Skeleton screen для улучшения UX при загрузке
 * 3. Переиспользует компонент ProductCard из Category
 */
function Favorites() {
  const dispatch = useDispatch();

  // Redux state
  const items = useSelector(selectFavoriteItems);
  const isLoading = useSelector(selectFavoritesIsLoading);
  const error = useSelector(selectFavoritesError);
  const isLoaded = useSelector(selectFavoritesIsLoaded);

  // Загрузка избранного при первом монтировании (только если еще не загружено)
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isLoaded, isLoading]);

  // Состояние загрузки с skeleton screen
  if (isLoading && !isLoaded) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 text-2xl font-semibold text-left text-gray-700">Избранное</h1>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
              >
                <div className="w-full aspect-square bg-gray-200"></div>
                <div className="flex flex-col flex-grow p-3 border-t border-gray-200 gap-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Состояние ошибки загрузки
  if (error && !isLoaded) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Ошибка загрузки</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => dispatch(fetchFavorites())}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-2xl font-semibold text-left text-gray-700">
          Избранное {items.length > 0 && `(${items.length})`}
        </h1>

        {items.length === 0 ? (
          // Пустое избранное
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <svg
              className="w-24 h-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Избранное пусто</h2>
              <p className="text-gray-500 mb-6">
                Добавляйте понравившиеся товары в избранное, нажимая на иконку сердца
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Перейти к покупкам
              </Link>
            </div>
          </div>
        ) : (
          // Список избранных товаров
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((product) => (
              <div
                key={product.id}
                className="relative flex flex-col bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                {/* Кнопка избранного в правом верхнем углу */}
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton product={product} />
                </div>

                {/* Изображение товара */}
                <Link
                  to={`/product/${product.id}`}
                  className="block w-full aspect-square overflow-hidden bg-gray-100"
                >
                  <img
                    src={getImageUrl(product.main_image)}
                    alt={product.name}
                    className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
                  />
                </Link>

                {/* Информация о товаре */}
                <div className="flex flex-col flex-grow p-3 border-t border-gray-200">
                  <Link
                    to={`/product/${product.id}`}
                    className="hover:text-blue-600 transition-colors block"
                  >
                    <h3
                      className="text-sm font-semibold text-gray-800 mb-2"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.25rem',
                        maxHeight: '2.5rem'
                      }}>
                      {product.name}
                    </h3>
                  </Link>

                  {/* Артикул */}
                  {product.part_number && (
                    <p className="text-xs text-gray-500 mb-3">
                      Арт: {product.part_number}
                    </p>
                  )}

                  {/* Цена и кнопка */}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                      {formatPrice(product.price)}
                    </span>
                    <AddToCartButton
                      product={product}
                      className="px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
