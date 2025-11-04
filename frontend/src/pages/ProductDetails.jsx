import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { categoriesAPI } from "../api";
import AddToCartButton from "../UI/AddToCartButton";
import FavoriteButton from "../UI/FavoriteButton";
import ErrorBoundary from "../components/ErrorBoundary";
import { getImageUrl, formatPrice } from "../utils";

function ProductDetails() {
  const { productId } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const categoryId = location.state?.categoryId;

  useEffect(() => {
    // AbortController для отмены запроса при размонтировании или изменении параметров
    const abortController = new AbortController();
    let isComponentMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!categoryId) {
          throw new Error('Не указан ID категории');
        }

        // Передаем signal в API запрос для возможности отмены
        const productData = await categoriesAPI.getCategoryProduct(categoryId, productId, {
          signal: abortController.signal
        });

        // Проверяем, что компонент все еще смонтирован перед обновлением state
        if (!isComponentMounted) {
          return;
        }

        // Валидация ответа API: проверяем, что данные получены и имеют правильную структуру
        if (!productData) {
          throw new Error('Не удалось получить данные о товаре');
        }

        if (!productData.id || !productData.name) {
          throw new Error('Получены некорректные данные о товаре');
        }

        setProduct(productData);

        // Устанавливаем главное изображение по умолчанию
        if (productData.main_image) {
          setSelectedImage(productData.main_image);
        } else if (Array.isArray(productData.images) && productData.images.length > 0) {
          setSelectedImage(productData.images[0]?.url || null);
        }
      } catch (err) {
        // Игнорируем ошибки отмены запроса
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          console.log('Запрос продукта был отменен');
          return;
        }

        // Проверяем, что компонент все еще смонтирован перед обновлением state
        if (!isComponentMounted) {
          return;
        }

        console.error('Ошибка загрузки продукта:', err);
        setError(err.message || 'Не удалось загрузить данные о товаре');
      } finally {
        // Проверяем, что компонент все еще смонтирован перед обновлением state
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    // Cleanup функция: отменяем запрос при размонтировании или изменении параметров
    return () => {
      isComponentMounted = false;
      abortController.abort();
    };
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

  // Собираем все изображения для галереи с валидацией данных
  const allImages = [];
  if (product.main_image) {
    allImages.push(product.main_image);
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach(img => {
      // Проверяем, что img существует и имеет url
      if (img && img.url && img.url !== product.main_image) {
        allImages.push(img.url);
      }
    });
  }

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">{product.name}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - Изображения */}
        <div className="lg:col-span-1">
          {/* Основное изображение */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <img
              src={getImageUrl(selectedImage || product.main_image)}
              alt={product.name}
              className="w-full h-auto object-contain rounded-md"
            />
          </div>

          {/* Миниатюры */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {allImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(imageUrl)}
                  className={`bg-white rounded-md p-2 border-2 transition-all hover:border-blue-500 ${
                    selectedImage === imageUrl ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={getImageUrl(imageUrl)}
                    alt={`${product.name} - изображение ${index + 1}`}
                    className="w-full h-20 object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка - Информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Блок с ценой и кнопкой */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-grow">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {product.name}
                </h2>
                
                {product.part_number && (
                  <p className="text-sm text-gray-600 mb-2">
                    Артикул: <span className="font-medium">{product.part_number}</span>
                  </p>
                )}
                
                {product.brand && (
                  <p className="text-sm text-gray-600 mb-2">
                    Бренд: <span className="font-medium">{product.brand.name}</span>
                  </p>
                )}
                
                {product.category && (
                  <p className="text-sm text-gray-600 mb-2">
                    Категория: <span className="font-medium">{product.category.name}</span>
                  </p>
                )}
              </div>
              
              {/* Блок цены и кнопок справа */}
              <div className="flex flex-col items-end gap-4 min-w-[250px]">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Цена:</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {/* Кнопки добавления в корзину и избранное */}
                <div className="w-full flex gap-2">
                  <AddToCartButton
                    product={product}
                    onAddToCart={handleAddToCart}
                    className="flex-grow"
                  />
                  <FavoriteButton product={product} />
                </div>
              </div>
            </div>
          </div>

          {/* Описание */}
          {product.description && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Описание</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Характеристики */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Основные характеристики</h3>
            <div className="space-y-2">
              {product.part_number && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Артикул</span>
                  <span className="font-semibold text-gray-900">{product.part_number}</span>
                </div>
              )}
              {product.brand && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Бренд</span>
                  <span className="font-semibold text-gray-900">{product.brand.name}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Цена</span>
                <span className="font-semibold text-gray-900">{formatPrice(product.price)}</span>
              </div>
              {product.category && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Категория</span>
                  <span className="font-semibold text-gray-900">{product.category.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
