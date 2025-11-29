import { Link } from "react-router-dom";
import { getImageUrl } from "../utils";
import { typography, effects } from "../styles/designSystem";

function CategoryCard({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group block"
    >
      <div className={`relative bg-white ${effects.rounded['3xl']} ${effects.shadow.sm} hover:shadow-lg hover:shadow-blue-300/60 hover:-translate-y-0.5 ${effects.transition.shadow} transition-transform duration-300 overflow-hidden flex flex-col h-full`}>
        {/* Иконка категории */}
        {category.icon_url && category.icon_url.trim() !== '' && (
          <div className="flex justify-start">
            <div className="h-[84px] w-[84px] flex items-center justify-center bg-white overflow-hidden">
              <img
                src={getImageUrl(category.icon_url)}
                alt="icon"
                className="h-[72px] w-[72px] object-contain"
              />
            </div>
          </div>
        )}

        {/* Название категории */}
        <div className="px-4 min-h-[2.5rem] flex items-start ml-1 mb-2">
          <h3 className={`${typography.fontFamily} ${typography.fontWeight.medium} ${typography.fontSize.md} ${typography.textColor.primary} ${typography.lineHeight.tight}`}>
            {category.name}
          </h3>
        </div>

        {/* Изображение категории */}
        <div className="px-4">
          <div className={`w-full aspect-[4/3] ${effects.rounded.DEFAULT} overflow-hidden`}>
            <img
              className="w-full h-full object-cover"
              src={getImageUrl(category.image_url)}
              alt={`${category.name} category`}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CategoryCard;
