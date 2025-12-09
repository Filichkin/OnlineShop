import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchCatalogProducts } from '../store/slices/productsSlice';
import { brandsAPI } from '../api';
import { getImageUrl, formatPrice } from '../utils';
import AddToCartButton from '../UI/AddToCartButton';
import FavoriteButton from '../UI/FavoriteButton';

const Catalog = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, error } = useSelector((state) => state.products);

  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand_slug: searchParams.get('brand') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || 'name',
    sort_order: searchParams.get('sort_order') || 'asc',
    skip: 0,
    limit: 24
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Загрузка брендов
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandsData = await brandsAPI.getBrands(0, 100, true);
        setBrands(brandsData);
      } catch (err) {
        console.error('Failed to load brands:', err);
      }
    };
    loadBrands();
  }, []);

  // Загрузка продуктов при изменении фильтров
  useEffect(() => {
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    dispatch(fetchCatalogProducts({
      ...filters,
      skip,
      limit: ITEMS_PER_PAGE,
      is_active: true
    }));

    // Обновляем URL с текущими фильтрами
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.brand_slug) params.brand = filters.brand_slug;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.sort_by !== 'name') params.sort_by = filters.sort_by;
    if (filters.sort_order !== 'asc') params.sort_order = filters.sort_order;

    setSearchParams(params);
  }, [dispatch, filters, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Сбросить на первую страницу при изменении фильтров
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      brand_slug: '',
      min_price: '',
      max_price: '',
      sort_by: 'name',
      sort_order: 'asc',
      skip: 0,
      limit: 24
    });
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = filters.search || filters.brand_slug || filters.min_price || filters.max_price;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-[75px] 2xl:px-[150px] py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Каталог продуктов</h1>
        <p className="text-gray-600">Найдите нужные товары с помощью фильтров</p>
      </div>

      {/* Фильтры */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Поиск */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Название или артикул..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Бренд */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Бренд
              </label>
              <select
                value={filters.brand_slug}
                onChange={(e) => handleFilterChange('brand_slug', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Все бренды</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.slug}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Цена от */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цена от
              </label>
              <input
                type="number"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Цена до */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цена до
              </label>
              <input
                type="number"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                placeholder="99999"
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Сортировка и сброс */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Сортировка:
                </label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="name">По названию</option>
                  <option value="price">По цене</option>
                  <option value="created_at">По дате добавления</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Порядок:
                </label>
                <select
                  value={filters.sort_order}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="asc">По возрастанию</option>
                  <option value="desc">По убыванию</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Результаты */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading ? (
            'Загрузка...'
          ) : (
            `Найдено: ${products.length} ${products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}`
          )}
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Загрузка */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Продукты */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              {/* Изображение */}
              <Link
                to={`/catalog/${product.id}`}
                className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-50 group"
              >
                {product.main_image ? (
                  <img
                    src={getImageUrl(product.main_image)}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Нет изображения</span>
                  </div>
                )}

                {/* Кнопка избранного */}
                <div className="absolute top-2 right-2">
                  <FavoriteButton productId={product.id} />
                </div>
              </Link>

              {/* Информация */}
              <div className="p-4 flex flex-col flex-grow">
                {/* Бренд */}
                {product.brand && (
                  <Link
                    to={`/brand/${product.brand.slug}`}
                    className="text-xs text-gray-500 hover:text-indigo-600 mb-1 inline-block"
                  >
                    {product.brand.name}
                  </Link>
                )}

                {/* Название */}
                <Link
                  to={`/catalog/${product.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-indigo-600 mb-1 line-clamp-2 min-h-[2.5rem]"
                >
                  {product.name}
                </Link>

                {/* Артикул */}
                {product.part_number && (
                  <p className="text-xs text-gray-500 mb-2">
                    Арт: {product.part_number}
                  </p>
                )}

                {/* Цена и кнопка */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                    <AddToCartButton productId={product.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пустое состояние */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Продукты не найдены</h3>
          <p className="mt-1 text-sm text-gray-500">
            Попробуйте изменить фильтры или сбросить их
          </p>
          {hasActiveFilters && (
            <div className="mt-6">
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      )}

      {/* Пагинация */}
      {!loading && products.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={products.length < ITEMS_PER_PAGE}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Страница <span className="font-medium">{currentPage}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={products.length < ITEMS_PER_PAGE}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
