import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { categoriesAPI } from "../api";
import AddToCartButton from "../UI/AddToCartButton";
import ErrorBoundary from "../components/ErrorBoundary";
import { getImageUrl, formatPrice } from "../utils";

function ProductDetails() {
  const { productId } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryId = location.state?.categoryId;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!categoryId) {
          throw new Error('Не указан ID категории');
        }

        const productData = await categoriesAPI.getCategoryProduct(categoryId, productId);
        setProduct(productData);
      } catch (err) {
        console.error('Ошибка загрузки продукта:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [categoryId, productId]);

  function handleAddToCart(product) {
    console.log('Добавление товара в корзину:', product);
    // Здесь будет логика добавления товара в корзину
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-semibold text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorBoundary />;
  }

  if (!product) {
    return (
      <div className="px-6 py-10">
        <p className="text-xl font-bold text-center text-red-500">Продукт не найден</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <h1 className="mb-6 text-3xl font-semibold text-center">Информация о товаре</h1>
      <div className="flex flex-col items-center p-6 bg-white rounded-md shadow-md">
        <h2 className="mb-2 text-xl font-semibold">
          {product.name}
        </h2>
        {product.description && (
          <p className="mb-4 text-gray-600">{product.description}</p>
        )}
        <p className="text-lg text-gray-700 mb-4">Цена: {formatPrice(product.price)}</p>
        
        {/* Отображаем все изображения продукта */}
        <div className="flex flex-wrap gap-4 mb-6">
          {product.images && product.images.length > 0 ? (
            product.images.map((image, index) => (
              <img 
                key={image.id || index}
                className="w-40 h-40 rounded object-cover" 
                src={getImageUrl(image.url)} 
                alt={`${product.name} - изображение ${index + 1}`}
              />
            ))
          ) : (
            <p className="text-gray-500">Изображения отсутствуют</p>
          )}
        </div>

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
    </div>
  );
}

export default ProductDetails;
