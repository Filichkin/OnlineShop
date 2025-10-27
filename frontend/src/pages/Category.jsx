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
        <ul className="grid grid-cols-3 gap-5 px-5">
          {filteredProducts.map((product) => (
            <li
              className="relative flex flex-col items-center justify-center group" 
              key={product.id}
            >
              <Link 
                className="relative flex flex-col items-center justify-center group"
                to={`/product/${product.id}`}
                state={{ categoryId }}
              >
                <span 
                  className="absolute z-10 text-xl font-semibold text-center text-white transition-all group-hover:text-2xl"
                >
                  {product.name} <br /> {formatPrice(product.price)}
                </span>
                <img
                  className="rounded-md"
                  src={getImageUrl(product.main_image)}
                  alt={`${product.name} - ${formatPrice(product.price)} - Click to view details`}
                />
                <div className="absolute inset-0 bg-gray-900 rounded-md opacity-40"></div>
              </Link>
              {/* Кнопка добавления в корзину */}
              <div 
                className="absolute bottom-2 right-2 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <AddToCartButton 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Category;
