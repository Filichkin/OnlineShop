import { Link } from "react-router-dom";
import { getImageUrl } from "../utils";
import { typography, effects } from "../styles/designSystem";

function BrandCard({ brand }) {
  return (
    <Link
      to={`/brand/${brand.slug}`}
      className="group block"
    >
      <div className={`relative bg-white ${effects.rounded['3xl']} ${effects.shadow.sm} hover:shadow-lg hover:shadow-blue-300/60 hover:-translate-y-0.5 ${effects.transition.shadow} transition-transform duration-300 overflow-hidden flex flex-col h-full`}>
        {/* Название бренда
        <div className="px-4 pt-4 min-h-[2.5rem] flex items-start ml-1 mb-2">
          <h3 className={`${typography.fontFamily} ${typography.fontWeight.medium} ${typography.fontSize.md} ${typography.textColor.primary} ${typography.lineHeight.tight}`}>
            {brand.name}
          </h3>
        </div> */}

        {/* Изображение бренда */}
        <div className="px-4 pb-4">
          <div className={`w-full aspect-[4/3] ${effects.rounded.DEFAULT} overflow-hidden`}>
            {brand.image ? (
              <img
                className="w-full h-full object-cover"
                src={getImageUrl(brand.image)}
                alt={`${brand.name} brand`}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Нет изображения</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default BrandCard;
