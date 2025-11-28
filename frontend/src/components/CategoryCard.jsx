import { Link } from "react-router-dom";
import { getImageUrl } from "../utils";
import { typography, effects } from "../styles/designSystem";

function CategoryCard({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group block"
    >
      <div className={`relative bg-white ${effects.rounded['3xl']} ${effects.shadow.sm} hover:shadow-lg ${effects.transition.shadow} overflow-hidden flex flex-col`}>
        {/* Иконка категории */}
        {category.icon_url && category.icon_url.trim() !== '' && (
          <div className="flex justify-start px-4">
            <div className="h-20 w-20 flex items-center justify-center bg-white overflow-hidden">
              <img
                src={getImageUrl(category.icon_url)}
                alt="icon"
                className="h-22 w-22 object-contain"
              />
            </div>
          </div>
        )}

        {/* Название категории */}
        <div className="px-4 min-h-[4rem] flex items-center">
          <h3 className={`${typography.fontFamily} ${typography.fontWeight.medium} ${typography.fontSize.md} ${typography.textColor.primary} group-hover:text-blue-600 ${effects.transition.colors} ${typography.lineHeight.tight}`}>
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
