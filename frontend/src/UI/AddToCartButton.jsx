import { useState } from 'react';
import { cartAPI } from '../api';

function AddToCartButton({ product, onAddToCart, quantity = 1, className = "" }) {
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddToCart = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Вызываем реальный API для добавления товара в корзину
      await cartAPI.addItem(product.id, quantity);

      // Вызываем callback функцию если она передана (для обновления UI)
      if (onAddToCart) {
        onAddToCart(product);
      }

      setIsAdded(true);

      // Автоматически сбрасываем состояние через 2 секунды
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);

    } catch (error) {
      console.error('Ошибка при добавлении товара в корзину:', error);
      setError(error.message || 'Не удалось добавить товар в корзину');

      // Сбрасываем ошибку через 3 секунды
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-md flex items-center justify-center gap-2
          transition-all duration-200 font-medium text-sm
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${error
            ? 'bg-red-700 text-white focus:ring-red-600 hover:bg-red-800'
            : isAdded
              ? 'bg-green-600 text-white focus:ring-green-600 hover:bg-green-700'
              : isLoading
                ? 'bg-gray-500 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover:shadow-lg'
          }
          ${className}
        `}
        title={error ? error : isLoading ? 'Добавление...' : isAdded ? 'Добавлено!' : 'Добавить в корзину'}
      >
        {error ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Ошибка</span>
          </>
        ) : isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Добавление...</span>
          </>
        ) : isAdded ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Добавлено</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span>Добавить</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10">
          {error}
        </div>
      )}
    </div>
  );
}

export default AddToCartButton;
