import { useLocation, useParams } from "react-router-dom";
import { products } from "../data/data";
import AddToCartButton from "../UI/AddToCartButton";

function ProductDetails() {
  const { productId } = useParams();
  const location = useLocation();
  // const { products } = location.state || [];

  const product = products.find((p) => parseInt(p.id) === parseInt(productId, 10));

  console.log(product);

  function handleAddToCart(product) {
    console.log('Добавление товара в корзину:', product);
    // Здесь будет логика добавления товара в корзину
    // Пока просто выводим в консоль
  }

  return (
    <div className="px-6 py-10">
      {product ? (
        <>
          <h1 className="mb-6 text-3xl font-semibold text-center">Информация о товаре</h1>
          <div className="flex flex-col items-center p-6 bg-white rounded-md shadow-md">
            <h2 
              className="mb-2 text-xl font-semibold">
                {product.name}
            </h2>
            <p className="text-lg text-gray-700 mb-4">Price: {product.price}$</p>
            <img 
              className="w-40 h-40 mb-6 rounded" 
              src={product.img} alt={product.name}
            />
            <div className="flex flex-col items-center">
              <AddToCartButton 
                product={product} 
                onAddToCart={handleAddToCart}
              />
              <span className="mt-3 text-base text-gray-700 font-semibold">
                В корзину
              </span>
            </div>
          </div>
          
        </>
      ) : (
        <p className="text-xl font-bold text-center text-red-500">Not Found</p>
      )}
    </div>
  );
}

export default ProductDetails;
