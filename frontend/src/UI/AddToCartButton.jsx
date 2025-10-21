import { useState } from 'react';

function AddToCartButton({ product, onAddToCart, className = "" }) {
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Имитация асинхронной операции
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Вызываем callback функцию для добавления товара в корзину
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center 
        transition-all duration-200 shadow-lg hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isAdded 
          ? 'bg-green-600 text-white focus:ring-green-600 hover:bg-green-700' 
          : isLoading 
            ? 'bg-gray-500 text-white cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 hover:scale-110'
        }
        ${className}
      `}
      title={isLoading ? 'Добавление...' : isAdded ? 'Добавлено!' : 'Добавить в корзину'}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : isAdded ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
      )}
    </button>
  );
}

export default AddToCartButton;
