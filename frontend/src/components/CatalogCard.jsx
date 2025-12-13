import { Link } from "react-router-dom";
import { typography, effects } from "../styles/designSystem";
import catalogImage from "../assets/images/catalog.webp";
import catalogIcon from "../assets/images/catalog_icon.webp";

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
          ${effects.rounded['3xl']} ${effects.shadow.sm}
          hover:shadow-lg hover:shadow-blue-300/60
          hover:-translate-y-0.5
          ${effects.transition.shadow}
          transition-transform duration-300
          overflow-hidden
          flex flex-col
          bg-white
        `}
      >
        {/* Верхняя часть с иконкой и текстом */}
        <div className="px-4 pt-6 pb-4">
          {/* Иконка */}
          <div className="mb-">
            <img
              src={catalogIcon}
              alt="Catalog icon"
              className="w-16 h-16 object-contain self-start -ml-2"
            />
          </div>

          {/* Текст "Каталог" */}
          <h3 className={`${typography.fontFamily} ${typography.fontWeight.semibold} ${typography.fontSize['xl']} text-gray-600 ${typography.lineHeight.tight} mb-1`}>
            Полный каталог
          </h3>
        </div>

        {/* Блок с изображением - отдельный для возможности смены фона */}
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
          <img
            className="w-full h-full object-contain scale-[1.3] transition-transform duration-300 group-hover:scale-[1.35]"
            src={catalogImage}
            alt="Каталог товаров"
          />
        </div>
      </div>
    </Link>
  );
}

export default CatalogCard;
