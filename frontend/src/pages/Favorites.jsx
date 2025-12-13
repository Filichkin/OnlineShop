import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchFavorites,
  selectFavoriteItems,
  selectFavoritesIsLoading,
  selectFavoritesError,
  selectFavoritesIsLoaded,
  selectFavoritesIsUnauthorized,
  selectFavoritesIsGuest,
} from '../store/slices/favoritesSlice';
import ProductCard from '../components/ProductCard';

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
  const isUnauthorized = useSelector(selectFavoritesIsUnauthorized);
  const isGuest = useSelector(selectFavoritesIsGuest);

  // Загрузка избранного при первом монтировании (только если еще не загружено)
  useEffect(() => {
    // Don't fetch from API if user is a guest (using localStorage)
    if (!isLoaded && !isLoading && !isUnauthorized && !isGuest) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isLoaded, isLoading, isUnauthorized, isGuest]);

  // Состояние загрузки с skeleton screen
  if (isLoading && !isLoaded) {
    return (
      <div className="py-10">
        <div className="container px-3 sm:px-3 md:px-6 lg:px-12 xl:px-[75px] 2xl:px-[150px]">
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
        <div className="container">
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

  if (isUnauthorized && !isGuest) {
    return (
      <div className="py-10">
        <div className="container px-3 sm:px-3 md:px-6 lg:px-12 xl:px-[75px] 2xl:px-[150px]">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center max-w-md mx-auto">
            <svg
              className="w-12 h-12 text-blue-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0-1.105-.895-2-2-2s-2 .895-2 2a2 2 0 004 0zm0 0v1a3 3 0 01-3 3m5-4h3.75a2.25 2.25 0 012.25 2.25V17a2.25 2.25 0 01-2.25 2.25H9m3-8a3 3 0 013-3h3a3 3 0 013 3v1"
              />
            </svg>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Войдите, чтобы увидеть избранное</h2>
            <p className="text-blue-700 mb-6">
              Сессия истекла. Авторизуйтесь через иконку профиля или вернитесь в каталог, чтобы продолжить покупки.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/profile"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Перейти к авторизации
              </Link>
              <Link
                to="/"
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                Каталог товаров
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container px-3 sm:px-3 md:px-6 lg:px-12 xl:px-[75px] 2xl:px-[150px]">
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
                className="inline-block px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Перейти к покупкам
              </Link>
            </div>
          </div>
        ) : (
          // Список избранных товаров
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(product) => console.log('Добавление товара в корзину:', product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
