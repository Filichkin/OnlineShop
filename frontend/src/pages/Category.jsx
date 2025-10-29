import { Link, useLoaderData, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import AddToCartButton from "../UI/AddToCartButton";
import { getImageUrl, formatPrice } from "../utils";

function Category() {
  const { products, categoryId } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : Infinity;

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    return products.filter((product) => product.price <= maxPrice);
  }, [products, maxPrice]);

  const categoryName = products.length > 0 ? products[0].category?.name : "Категория";

  function handleChange(e) {
    const value = e.target.value;
    setSearchParams(value ? { maxPrice: value } : {});
  }

  function handleAddToCart(product) {
    console.log('Добавление товара в корзину:', product);
    // Здесь будет логика добавления товара в корзину
  }

  return (
    <div className="px-6 py-10">
      <h1 className="mb-6 text-3xl font-semibold text-center">{categoryName}</h1>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="maxPrice">
          Фильтр по цене
        </label>
        <input
          className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          type="number"
          id="maxPrice"
          placeholder="Введите максимальную стоимость"
          value={searchParams.get("maxPrice") || ""}
          onChange={handleChange}
          min="0"
          step="1"
        />
      </div>
      {filteredProducts.length === 0 ? (
        <p className="text-xl font-bold text-center text-gray-500">
          Продукты не найдены
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              {/* Изображение товара */}
              <Link 
                to={`/product/${product.id}`}
                state={{ categoryId }}
                className="block w-full aspect-square overflow-hidden bg-gray-100"
              >
                <img
                  src={getImageUrl(product.main_image)}
                  alt={product.name}
                  className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
                />
              </Link>
              
              {/* Информация о товаре */}
              <div className="flex flex-col flex-grow p-4 border-t border-gray-200">
                <Link 
                  to={`/product/${product.id}`}
                  state={{ categoryId }}
                  className="hover:text-blue-600 transition-colors"
                >
                  <h3 className="text-base font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>
                </Link>
                
                {/* Цена и кнопка */}
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
                    {formatPrice(product.price)}
                  </span>
                  <AddToCartButton 
                    product={product} 
                    onAddToCart={handleAddToCart}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Category;
