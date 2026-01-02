import { useLoaderData, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import useDebounce from "../hooks/useDebounce";
import { typography, effects, inputStyles, labelStyles } from "../styles/designSystem";

function Brand() {
  const loaderData = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Валидация данных из loader с безопасными fallback значениями
  const products = Array.isArray(loaderData?.products) ? loaderData.products : [];
  const brandId = loaderData?.brandId;

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

  const brandName = products.length > 0 && products[0].brand?.name
    ? products[0].brand.name
    : "Бренд";

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
      <div className="container px-3 sm:px-3 md:px-6 lg:px-12 xl:px-[75px] 2xl:px-[150px]">
        <h1 className={`capitalize mb-3 ${typography.fontSize['2xl']} ${typography.fontWeight.semibold} ${typography.fontFamily} text-left ${typography.textColor.dark}`}>Продукция {brandName}</h1>

        {/* Контейнер для фильтров и сортировки */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Фильтр по артикулу */}
          <div className="max-w-xs">
            <label className={labelStyles.base} htmlFor="partNumber">
              Поиск по артикулу
            </label>
            <input
              className={`${inputStyles.base} ${typography.fontFamily} w-full`}
              type="text"
              id="partNumber"
              placeholder="Введите артикул"
              value={partNumberValue}
              onChange={handlePartNumberChange}
              autoComplete="off"
            />
          </div>

          {/* Поиск по названию */}
          <div className="max-w-xs">
            <label className={labelStyles.base} htmlFor="searchByName">
              Поиск по названию
            </label>
            <input
              className={`${inputStyles.base} ${typography.fontFamily} w-full`}
              type="text"
              id="searchByName"
              placeholder="Введите часть названия"
              value={nameSearchValue}
              onChange={handleNameSearchChange}
              autoComplete="off"
            />
          </div>

          {/* Фильтр по цене */}
          <div className="max-w-xs">
            <label className={labelStyles.base} htmlFor="maxPrice">
              Фильтр по цене
            </label>
            <input
              className={`${inputStyles.base} ${typography.fontFamily} w-full`}
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
          <div className="md:col-span-1 lg:col-span-1 max-w-xs">
            <label className={labelStyles.base} htmlFor="sortBy">
              Сортировка
            </label>
            <select
              className={`${inputStyles.select} ${typography.fontFamily} w-full`}
              id="sortBy"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
              <option value="name_asc">По наименованию</option>
            </select>
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <p className={`${typography.fontSize.xl} ${typography.fontWeight.semibold} ${typography.fontFamily} text-center ${typography.textColor.tertiary}`}>
            Продукты не найдены
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                brandId={brandId}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Brand;
