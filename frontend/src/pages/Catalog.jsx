import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchCatalogProducts } from '../store/slices/productsSlice';
import { brandsAPI } from '../api';
import ProductCard from '../components/ProductCard';
import { typography, effects, inputStyles, labelStyles } from '../styles/designSystem';

const Catalog = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, error } = useSelector((state) => state.products);

  const [brands, setBrands] = useState([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Фильтры с улучшенной сортировкой
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

    setSearchParams(params, { replace: true });
  }, [dispatch, filters, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Обработчик изменения объединенной сортировки
  const handleSortChange = (value) => {
    // Парсим значение формата "field_order" (например: "price_asc")
    const [sort_by, sort_order] = value.includes('_')
      ? value.split('_')
      : [value, 'asc'];

    setFilters(prev => ({
      ...prev,
      sort_by: sort_by || 'name',
      sort_order: sort_order || 'asc'
    }));
    setCurrentPage(1);
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
    setSearchParams({}, { replace: true });
    setIsMobileFiltersOpen(false);
  };

  const hasActiveFilters = filters.search || filters.brand_slug || filters.min_price || filters.max_price;

  // Получаем текущее значение для объединенного селекта сортировки
  const currentSortValue = `${filters.sort_by}_${filters.sort_order}`;

  // Компонент фильтров (переиспользуемый для desktop и mobile)
  const FiltersContent = () => (
    <div className="flex flex-col gap-6">
      {/* Заголовок фильтров */}
      <div className="flex items-center justify-between">
        <h2 className={`${typography.fontSize.lg} ${typography.fontWeight.semibold} ${typography.textColor.primary}`}>
          Фильтры
        </h2>
        {/* Кнопка закрытия для мобильных */}
        <button
          onClick={() => setIsMobileFiltersOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-700"
          aria-label="Закрыть фильтры"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Поиск */}
      <div>
        <label htmlFor="search-input" className={labelStyles.base}>
          Поиск
        </label>
        <input
          id="search-input"
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Название или артикул..."
          className={`${inputStyles.base} ${typography.fontFamily} w-full`}
          aria-label="Поиск по названию или артикулу"
        />
      </div>

      {/* Бренд */}
      <div>
        <label htmlFor="brand-select" className={labelStyles.base}>
          Бренд
        </label>
        <select
          id="brand-select"
          value={filters.brand_slug}
          onChange={(e) => handleFilterChange('brand_slug', e.target.value)}
          className={`${inputStyles.select} ${typography.fontFamily} w-full`}
          aria-label="Фильтр по бренду"
        >
          <option value="">Все бренды</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.slug}>{brand.name}</option>
          ))}
        </select>
      </div>

      {/* Цена от */}
      <div>
        <label htmlFor="min-price-input" className={labelStyles.base}>
          Цена от
        </label>
        <input
          id="min-price-input"
          type="number"
          value={filters.min_price}
          onChange={(e) => handleFilterChange('min_price', e.target.value)}
          placeholder="0"
          min="0"
          step="1"
          className={`${inputStyles.base} ${typography.fontFamily} w-full`}
          aria-label="Минимальная цена"
        />
      </div>

      {/* Цена до */}
      <div>
        <label htmlFor="max-price-input" className={labelStyles.base}>
          Цена до
        </label>
        <input
          id="max-price-input"
          type="number"
          value={filters.max_price}
          onChange={(e) => handleFilterChange('max_price', e.target.value)}
          placeholder="99999"
          min="0"
          step="1"
          className={`${inputStyles.base} ${typography.fontFamily} w-full`}
          aria-label="Максимальная цена"
        />
      </div>

      {/* Объединенная сортировка */}
      <div>
        <label htmlFor="sort-select" className={labelStyles.base}>
          Сортировка
        </label>
        <select
          id="sort-select"
          value={currentSortValue}
          onChange={(e) => handleSortChange(e.target.value)}
          className={`${inputStyles.select} ${typography.fontFamily} w-full`}
          aria-label="Сортировка товаров"
        >
          <option value="price_asc">Цена по возрастанию</option>
          <option value="price_desc">Цена по убыванию</option>
          <option value="name_asc">Название А-Я</option>
          <option value="name_desc">Название Я-А</option>
          <option value="created_at_desc">Сначала новые</option>
          <option value="created_at_asc">Сначала старые</option>
        </select>
      </div>

      {/* Кнопка сброса фильтров */}
      {hasActiveFilters && (
        <button
          onClick={handleResetFilters}
          className={`${typography.fontSize.sm} ${typography.fontWeight.medium} text-blue-600 hover:text-blue-800 ${effects.transition.colors} text-left`}
          aria-label="Сбросить все фильтры"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );

  return (
    <div className="py-10">
      <div className="container px-3 sm:px-3 md:px- lg:px-12 xl:px-[75px] 2xl:px-[150px]">
        {/* Заголовок страницы */}
        <div className="mb-6">
          <h1 className={`${typography.fontSize['2xl']} ${typography.fontWeight.semibold} ${typography.fontFamily} ${typography.textColor.primary}`}>
            Каталог продуктов
          </h1>
          <p className={`${typography.fontSize.sm} ${typography.textColor.tertiary} mt-1`}>
            Найдите нужные товары с помощью фильтров
          </p>
        </div>

        {/* Кнопка фильтров для мобильных */}
        <div className="mb-6 md:hidden">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 bg-gray-800 text-white ${effects.rounded.DEFAULT} ${typography.fontSize.sm} ${typography.fontWeight.medium} hover:bg-gray-900 ${effects.transition.DEFAULT}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Фильтры
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {[filters.search, filters.brand_slug, filters.min_price, filters.max_price].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Layout: Фильтры слева + Продукты справа */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Фильтры - Desktop Sidebar */}
          <aside className="hidden md:block w-[280px] flex-shrink-0">
            <div className={`bg-white ${effects.rounded.lg} ${effects.shadow.DEFAULT} p-6 sticky top-6`}>
              <FiltersContent />
            </div>
          </aside>

          {/* Фильтры - Mobile Overlay */}
          {isMobileFiltersOpen && (
            <div
              className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[280px] bg-white p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <FiltersContent />
              </div>
            </div>
          )}

          {/* Продукты */}
          <main className="flex-1 min-w-0">
            {/* Информация о результатах */}
            <div className="mb-4 flex justify-between items-center">
              <div className={`${typography.fontSize.sm} ${typography.textColor.tertiary}`} role="status" aria-live="polite">
                {loading ? (
                  'Загрузка...'
                ) : (
                  `Найдено: ${products.length} ${products.length === 1 ? 'товар' : products.length < 5 ? 'товара' : 'товаров'}`
                )}
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className={`mb-6 p-4 bg-red-50 border border-red-200 ${effects.rounded.lg}`} role="alert">
                <p className={`${typography.fontSize.sm} ${typography.textColor.error}`}>{error}</p>
              </div>
            )}

            {/* Загрузка */}
            {loading && (
              <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6" role="list" aria-label="Загрузка продуктов">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`bg-white ${effects.rounded.lg} ${effects.shadow.DEFAULT} animate-pulse`} role="listitem">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-3 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Продукты - Grid как в Brand.jsx */}
            {!loading && products.length > 0 && (
              <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    linkPrefix="/catalog"
                    onAddToCart={(product) => console.log('Добавление товара в корзину:', product)}
                  />
                ))}
              </div>
            )}

            {/* Пустое состояние */}
            {!loading && products.length === 0 && (
              <div className="text-center py-12" role="status">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className={`mt-2 ${typography.fontSize.base} ${typography.fontWeight.medium} ${typography.textColor.primary}`}>
                  Продукты не найдены
                </h3>
                <p className={`mt-1 ${typography.fontSize.sm} ${typography.textColor.tertiary}`}>
                  Попробуйте изменить фильтры или сбросить их
                </p>
                {hasActiveFilters && (
                  <div className="mt-6">
                    <button
                      onClick={handleResetFilters}
                      className={`px-4 py-2 bg-gray-800 text-white ${effects.rounded.DEFAULT} ${typography.fontSize.sm} ${typography.fontWeight.medium} hover:bg-gray-900 ${effects.transition.DEFAULT}`}
                    >
                      Сбросить фильтры
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Пагинация */}
            {!loading && products.length > 0 && (
              <nav className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6" aria-label="Пагинация">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 ${typography.fontSize.sm} ${typography.fontWeight.medium} ${effects.rounded.DEFAULT} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${effects.transition.DEFAULT}`}
                    aria-label="Предыдущая страница"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={products.length < ITEMS_PER_PAGE}
                    className={`relative ml-3 inline-flex items-center px-4 py-2 ${typography.fontSize.sm} ${typography.fontWeight.medium} ${effects.rounded.DEFAULT} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${effects.transition.DEFAULT}`}
                    aria-label="Следующая страница"
                  >
                    Далее
                  </button>
                </div>

                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className={`${typography.fontSize.sm} ${typography.textColor.secondary}`}>
                      Страница <span className={typography.fontWeight.medium}>{currentPage}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white ${typography.fontSize.sm} ${typography.fontWeight.medium} text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${effects.transition.DEFAULT}`}
                        aria-label="Предыдущая страница"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white ${typography.fontSize.sm} ${typography.fontWeight.medium} text-gray-700`} aria-current="page">
                        {currentPage}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={products.length < ITEMS_PER_PAGE}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white ${typography.fontSize.sm} ${typography.fontWeight.medium} text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${effects.transition.DEFAULT}`}
                        aria-label="Следующая страница"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
