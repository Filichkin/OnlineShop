import { Link } from "react-router-dom";
import { typography, effects } from "../styles/designSystem";
import catalogImage from "../assets/images/logo_catalog.webp";
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
          bg-slate-50
          border border-slate-100
          ${effects.rounded['3xl']}
          ${effects.shadow.sm}
          hover:shadow-lg
          hover:shadow-blue-300/60
          hover:-translate-y-0.5
          ${effects.transition.shadow}
          transition-transform
          duration-300
          overflow-hidden
          flex
          flex-col
          h-full
        `}
      >
        {/* Верхняя часть с иконкой и текстом */}
        <div className="px-4 pt-4 pb-2">
          {/* Иконка каталога - сдвинута влево */}
          <div className="mb-2 -ml-8">
            <img
              src={catalogIcon}
              alt="Catalog icon"
              className="w-32 h-32 object-contain"
            />
          </div>

          {/* Основной заголовок */}
          <h3 className={`${typography.fontFamily} ${typography.fontWeight.semibold} ${typography.fontSize['xl']} text-gray-900 ${typography.lineHeight.tight} mb-1`}>
            Полный каталог
          </h3>

          {/* Подзаголовок */}
          <p className={`${typography.fontFamily} ${typography.fontSize.sm} text-gray-500 ${typography.lineHeight.tight}`}>
            Поиск по параметрам
          </p>
        </div>

        {/* Блок с изображением фильтра - увеличенное изображение */}
        <div className="flex-1 px-4 pb-4 flex items-end overflow-hidden">
          <div className="w-full overflow-hidden">
            <img
              className="w-full h-auto object-contain transition-transform duration-300 scale-[1.4]"
              src={catalogImage}
              alt="Каталог запчастей"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CatalogCard;
