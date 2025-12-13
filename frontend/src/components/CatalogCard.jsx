import { Link } from "react-router-dom";
import { typography, effects } from "../styles/designSystem";
import catalogImage from "../assets/images/catalog.webp";

/**
 * CatalogCard Component
 * Displays a card linking to the main catalog page
 * Features hover effects matching BrandCard styling
 */
function CatalogCard() {
  return (
    <Link
      to="/catalog"
      className="group block h-full"
    >
      <div
        className={`
          relative
          h-full w-full
          bg-white ${effects.rounded['3xl']} ${effects.shadow.sm}
          hover:shadow-lg hover:shadow-blue-300/60
          hover:-translate-y-0.5
          ${effects.transition.shadow}
          transition-transform duration-300
          overflow-hidden
          flex flex-col
        `}
      >
        {/* Название в верхней части */}
        <div className="px-4 pt-4 min-h-[2.5rem] flex items-start ml-1 mb-2">
          <h3 className={`${typography.fontFamily} ${typography.fontWeight.semibold} ${typography.fontSize.xl} ${typography.textColor.primary} ${typography.lineHeight.tight}`}>
            Каталог
          </h3>
        </div>

        {/* Изображение каталога */}
        <div className="px-4 pb-4 flex-1 flex items-center justify-center">
          <div className={`w-full aspect-[4/3] ${effects.rounded.DEFAULT} overflow-hidden`}>
            <img
              className="w-full h-full object-contain"
              src={catalogImage}
              alt="Каталог товаров"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CatalogCard;
