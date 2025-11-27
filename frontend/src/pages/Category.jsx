import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import AddToCartButton from "../UI/AddToCartButton";
import FavoriteButton from "../UI/FavoriteButton";
import { getImageUrl, formatPrice } from "../utils";
import useDebounce from "../hooks/useDebounce";

function Category() {
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Валидация данных из loader с безопасными fallback значениями
  const products = Array.isArray(loaderData?.products) ? loaderData.products : [];
  const categoryId = loaderData?.categoryId;

  // Локальное состояние для input значения (обновляется мгновенно)
  const [inputValue, setInputValue] = useState(searchParams.get("maxPrice") || "");
  const [partNumberValue, setPartNumberValue] = useState(searchParams.get("part_number") || "");
  const [nameSearchValue, setNameSearchValue] = useState(searchParams.get("search") || "");

  // Состояние для сортировки, синхронизированное с URL
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "price_asc");

  // Debounced значение для фильтрации (обновляется с задержкой)
  const debouncedInputValue = useDebounce(inputValue, 300);
  const debouncedPartNumber = useDebounce(partNumberValue.trim(), 300);
  const debouncedNameSearch = useDebounce(nameSearchValue.trim(), 300);

  // Используем debounced значение для фильтрации
  const maxPrice = debouncedInputValue ? Number(debouncedInputValue) : Infinity;

  // Memoized filtered and sorted products for performance
  const filteredProducts = useMemo(() => {
    const normalizedPartNumber = debouncedPartNumber ? debouncedPartNumber.toLowerCase() : "";
    const normalizedNameSearch = debouncedNameSearch ? debouncedNameSearch.toLowerCase() : "";

    // Сначала фильтруем по цене, артикулу и названию
    const filtered = products.filter((product) => {
      if (!product || typeof product.price !== 'number') {
        return false;
      }

      if (product.price > maxPrice) {
        return false;
      }

      if (normalizedPartNumber) {
        const productPartNumber = typeof product.part_number === 'string'
          ? product.part_number.toLowerCase()
          : '';

        if (!productPartNumber.includes(normalizedPartNumber)) {
          return false;
        }
      }

      if (normalizedNameSearch) {
        const productName = typeof product.name === 'string'
          ? product.name.toLowerCase()
          : '';

        if (!productName.includes(normalizedNameSearch)) {
          return false;
        }
      }

      return true;
    });

    // Затем сортируем
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "name_asc":
          return a.name.localeCompare(b.name, 'ru');
        case "name_desc":
          return b.name.localeCompare(a.name, 'ru');
        default:
          return a.price - b.price;
      }
    });

    return sorted;
  }, [products, maxPrice, sortBy, debouncedPartNumber, debouncedNameSearch]);

  const categoryName = products.length > 0 && products[0].category?.name
    ? products[0].category.name
    : "Категория";

  // Обработчик изменения input - обновляет локальное состояние мгновенно
  function handlePriceChange(e) {
    const value = e.target.value;
    setInputValue(value);
    // URL обновится только после debounce через useEffect ниже
  }

  function handlePartNumberChange(e) {
    setPartNumberValue(e.target.value);
  }

  function handleNameSearchChange(e) {
    setNameSearchValue(e.target.value);
  }

  // Обработчик изменения сортировки
  function handleSortChange(e) {
    const value = e.target.value;
    setSortBy(value);

    // Обновляем URL параметры, сохраняя существующие фильтры
    const newParams = {};
    if (debouncedInputValue) {
      newParams.maxPrice = debouncedInputValue;
    }
    if (debouncedPartNumber) {
      newParams.part_number = debouncedPartNumber;
    }
    if (debouncedNameSearch) {
      newParams.search = debouncedNameSearch;
    }
    newParams.sort_by = value;
    setSearchParams(newParams, { replace: true });
  }

  // Синхронизируем URL с debounced значением цены
  useEffect(() => {
    const newParams = {};
    if (debouncedInputValue) {
      newParams.maxPrice = debouncedInputValue;
    }
    if (debouncedPartNumber) {
      newParams.part_number = debouncedPartNumber;
    }
    if (debouncedNameSearch) {
      newParams.search = debouncedNameSearch;
    }
    // Сохраняем текущую сортировку при изменении фильтров
    if (sortBy && sortBy !== "price_asc") {
      newParams.sort_by = sortBy;
    }
    setSearchParams(newParams, { replace: true });
  }, [debouncedInputValue, debouncedPartNumber, debouncedNameSearch, setSearchParams, sortBy]);

  function handleAddToCart(product) {
    console.log('Добавление товара в корзину:', product);
    // Здесь будет логика добавления товара в корзину
  }

  return (
    <div className="py-10">
      <div className="container">
        <h1 className="mb-3 text-2xl font-semibold text-left text-gray-700">{categoryName}</h1>

        {/* Контейнер для фильтров и сортировки */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Фильтр по артикулу */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="partNumber">
              Фильтр по артикулу
            </label>
            <input
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              type="text"
              id="partNumber"
              placeholder="Введите артикул"
              value={partNumberValue}
              onChange={handlePartNumberChange}
              autoComplete="off"
            />
          </div>

          {/* Поиск по названию */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="searchByName">
              Поиск по названию
            </label>
            <input
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              type="text"
              id="searchByName"
              placeholder="Введите часть названия"
              value={nameSearchValue}
              onChange={handleNameSearchChange}
              autoComplete="off"
            />
          </div>

          {/* Фильтр по цене */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="maxPrice">
              Фильтр по цене
            </label>
            <input
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              type="number"
              id="maxPrice"
              placeholder="Введите максимальную стоимость"
              value={inputValue}
              onChange={handlePriceChange}
              min="0"
              step="1"
            />
          </div>

          {/* Сортировка */}
          <div className="md:col-span-1 lg:col-span-1">
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="sortBy">
              Сортировка
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
              id="sortBy"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="price_asc">Цена по возрастанию</option>
              <option value="price_desc">Цена по убыванию</option>
              <option value="name_asc">Название А-Я</option>
              <option value="name_desc">Название Я-А</option>
            </select>
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <p className="text-xl font-semibold text-center text-gray-500">
            Продукты не найдены
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredProducts.map((product) => (
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
                  state={{ categoryId }}
                  className="block aspect-square overflow-hidden mb-4 mt-14 mr-4 ml-4"
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
                    state={{ categoryId }}
                    className="hover:text-blue-600 transition-colors block"
                  >
                    <h3
                      className="text-[14px] font-[500] text-gray-900 mb-2"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.25rem',
                        maxHeight: '2.5rem',
                        textTransform: 'uppercase'
                      }}>
                      {product.name}
                    </h3>
                  </Link>

                  {/* Артикул */}
                  {product.part_number && (
                    <p className="text-xs text-gray-500 mb-3">
                      Артикул: {product.part_number}
                    </p>
                  )}

                  {/* Цена и кнопка */}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-[16px] font-semibold text-gray-800 whitespace-nowrap">
                      {formatPrice(product.price)}
                    </span>
                    <AddToCartButton
                      product={product}
                      onAddToCart={handleAddToCart}
                      size="sm"
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

export default Category;
