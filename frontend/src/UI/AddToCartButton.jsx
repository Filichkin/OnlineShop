import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity, removeFromCart, selectCartItems, selectUpdatingItems } from '../store/slices/cartSlice';
import { logger } from '../utils/logger';
import { typography, effects } from '../styles/designSystem';

// Size variants configuration for flexible button sizing
const SIZE_VARIANTS = {
  sm: {
    button: "h-8 px-3 min-w-[120px]",
    controls: "h-8 min-w-[120px]",
    icon: "w-5 h-5",
    spinner: "h-3 w-3",
    text: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  default: {
    button: 'h-8 px-4',
    controls: 'h-8 px-2',
    icon: 'w-4 h-4',
    spinner: 'h-4 w-4',
    text: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  lg: {
    button: "h-12 px-6 min-w-[180px]",
    controls: "h-12 min-w-[180px]",
    icon: "w-7 h-7",
    spinner: "h-5 w-5",
    text: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal
  },
};

/**
 * Кнопка добавления товара в корзину с переключением на контролы количества
 *
 * ОПТИМИЗАЦИЯ: Интегрирована с Redux для автоматического обновления
 * состояния корзины во всем приложении (Header badge, Cart page)
 *
 * ПОВЕДЕНИЕ:
 * - Если товар НЕ в корзине: показывает кнопку "Добавить"
 * - Если товар В корзине: показывает контролы количества (-, количество, +)
 *
 * @param {Object} product - Объект товара с id
 * @param {Function} onAddToCart - Опциональный callback после добавления
 * @param {number} quantity - Количество для добавления (по умолчанию 1)
 * @param {string} className - Дополнительные CSS классы
 * @param {string} size - Размер кнопки: 'sm', 'default', 'lg' (по умолчанию 'default')
 * @param {Object} customSize - Кастомная конфигурация размеров (переопределяет size)
 * @param {boolean} showIcon - Показывать ли иконку корзины (по умолчанию true)
 * @param {boolean} fullWidth - Кнопка на всю ширину родителя (по умолчанию false)
 * @param {string} textSize - Переопределение размера текста из варианта
 * @param {string} fontWeight - Переопределение жирности шрифта из варианта
 * @param {string} buttonText - Текст кнопки (по умолчанию "Добавить")
 */
function AddToCartButton({
  product,
  onAddToCart,
  quantity = 1,
  className = "",
  size = "default",
  customSize = null,
  showIcon = true,
  fullWidth = false,
  textSize = null,
  fontWeight = null,
  buttonText = "Добавить",
}) {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // Получаем список товаров в корзине и список обновляющихся товаров
  const cartItems = useSelector(selectCartItems);
  const updatingItems = useSelector(selectUpdatingItems);

  // Проверяем, есть ли товар в корзине
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const isInCart = !!cartItem;
  const currentQuantity = cartItem ? cartItem.quantity : 0;
  const isUpdating = updatingItems.includes(product.id);

  // Получаем размеры из варианта или кастомной конфигурации
  const sizeConfig = customSize || SIZE_VARIANTS[size] || SIZE_VARIANTS.default;
  const finalTextSize = textSize || sizeConfig.text;
  const finalFontWeight = fontWeight || sizeConfig.fontWeight;

  // Добавление товара в корзину
  const handleAddToCart = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Вызываем Redux action для добавления товара в корзину
      // Передаем полные данные продукта для поддержки гостевых пользователей с localStorage
      await dispatch(addToCart({
        productId: product.id,
        quantity,
        productData: product  // Pass full product object for guest users
      })).unwrap();

      // Вызываем callback функцию если она передана (для обновления UI)
      if (onAddToCart) {
        onAddToCart(product);
      }

    } catch (err) {
      logger.error('Ошибка при добавлении товара в корзину:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Изменение количества товара в корзине
  const handleQuantityChange = async (e, newQuantity) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isUpdating) return;

    // Если количество меньше 1, удаляем товар из корзины
    if (newQuantity < 1) {
      try {
        await dispatch(removeFromCart(product.id)).unwrap();
      } catch (err) {
        logger.error('Ошибка при удалении товара из корзины:', err);
      }
      return;
    }

    try {
      await dispatch(updateQuantity({ productId: product.id, quantity: newQuantity })).unwrap();
    } catch (err) {
      logger.error('Ошибка при обновлении количества:', err);
    }
  };

  // Если товар уже в корзине, показываем контролы количества
  if (isInCart) {
    return (
      <div className={`${sizeConfig.controls} ${typography.fontFamily} grid grid-cols-3 items-center border border-gray-200 ${effects.rounded.DEFAULT} bg-white ${fullWidth ? 'w-full' : ''} ${className}`}>
        {/* Кнопка уменьшения количества */}
        <button
          onClick={(e) => handleQuantityChange(e, currentQuantity - 1)}
          disabled={isUpdating}
          className={`flex items-center justify-center hover:bg-gray-100 ${effects.transition.colors} disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md`}
          aria-label="Уменьшить количество"
          title="Уменьшить количество"
        >
          <svg className={sizeConfig.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Отображение текущего количества */}
        <span className={`flex items-center justify-center ${finalFontWeight} ${finalTextSize} ${typography.textColor.primary}`}>
          {currentQuantity}
        </span>

        {/* Кнопка увеличения количества */}
        <button
          onClick={(e) => handleQuantityChange(e, currentQuantity + 1)}
          disabled={isUpdating}
          className={`flex items-center justify-center hover:bg-gray-100 ${effects.transition.colors} disabled:opacity-50 disabled:cursor-not-allowed rounded-r-md`}
          aria-label="Увеличить количество"
          title="Увеличить количество"
        >
          <svg className={sizeConfig.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Если товар НЕ в корзине, показываем кнопку "Добавить"
  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`
        ${sizeConfig.button} ${typography.fontFamily} ${effects.rounded.DEFAULT} flex items-center justify-center gap-2
        ${effects.transition.DEFAULT} ${finalFontWeight} ${finalTextSize}
        ${effects.focus.DEFAULT}
        ${fullWidth ? 'w-full' : ''}
        ${isLoading
          ? 'bg-gray-500 text-white cursor-not-allowed'
          : 'bg-gray-800 text-white hover:bg-gray-900 hover:shadow-lg'
        }
        ${className}
      `}
      title={isLoading ? 'Добавление...' : 'Добавить в корзину'}
    >
      {isLoading ? (
        <>
          {showIcon && (
            <svg className={`animate-spin ${sizeConfig.spinner} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>Добавление...</span>
        </>
      ) : (
        <>
          {showIcon && (
            <svg className={sizeConfig.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 7h16l-2 12H6L4 7z" />
              <path d="M9 7l3-4 3 4" />
              <path d="M9 12v4M12 12v4M15 12v4"/>
            </svg>
          )}
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}

export default AddToCartButton;
