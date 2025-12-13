import { Link } from "react-router-dom";
import AddToCartButton from "../UI/AddToCartButton";
import FavoriteButton from "../UI/FavoriteButton";
import { getImageUrl, formatPrice } from "../utils";
import { typography, effects } from "../styles/designSystem";

/**
 * ProductCard Component
 * Displays a product card with image, price, name, article number, and action buttons
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data object
 * @param {number} props.brandId - Brand ID for navigation state (optional)
 * @param {string} props.linkPrefix - URL prefix for product links (default: "/product")
 * @param {Function} props.onAddToCart - Callback function when adding to cart
 */
function ProductCard({ product, brandId, linkPrefix = "/product", onAddToCart }) {
  return (
    <div
      className={`relative flex flex-col h-full bg-white ${effects.rounded.lg} ${effects.shadow.DEFAULT} hover:shadow-xl ${effects.transition.shadow} overflow-hidden`}
    >
      {/* Кнопка избранного в правом верхнем углу */}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton product={product} className="w-12 h-9" iconSize="w-6 h-6"/>
      </div>

      {/* Изображение товара */}
      <Link
        to={`${linkPrefix}/${product.id}`}
        state={{ brandId }}
        className="block aspect-square overflow-hidden mt-12 flex-shrink-0 relative"
      >
        <img
          src={getImageUrl(product.main_image)}
          alt={product.name}
          className="
            object-cover
            w-full h-full
            scale-[0.9] hover:scale-[0.95]
            transition-transform duration-500
          "
        />
      </Link>

      {/* Информационная секция */}
      <div className="flex flex-col flex-1 p-3 border-t border-gray-200">
        {/* 1. Цена - в самом верху */}
        <div className="mb-1">
          <span className={`${typography.fontSize.lg} ${typography.fontWeight.extrabold} ${typography.fontFamily} ${typography.textColor.primary}`}>
            {formatPrice(product.price)}
          </span>
        </div>

        {/* 2. Название товара - фиксированная высота 2 строки */}
        <Link
          to={`${linkPrefix}/${product.id}`}
          state={{ brandId }}
          className={`hover:text-blue-600 ${effects.transition.colors} block h-[2.5rem] mb-2`}
        >
          <h3
            className={`hover:text-blue-500 ${typography.fontSize.base} ${typography.fontWeight.light} ${typography.fontFamily} text-gray-600`}
            >
            {product.name}
          </h3>
        </Link>

        {/* 3. Артикул - фиксированная высота */}
        <p className={`${typography.fontSize.sm} ${typography.fontWeight.normal} ${typography.fontFamily} ${typography.textColor.tertiary} h-5 mb-3`}>
          {product.part_number ? `Артикул: ${product.part_number}` : '\u00A0'}
        </p>

        {/* 4. Кнопка "Добавить в корзину" - на всю ширину, в самом низу */}
        <div className="mt-auto">
          <AddToCartButton
            product={product}
            onAddToCart={onAddToCart}
            size="sm"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
