import { Link } from "react-router-dom";
import { getImageUrl } from "../utils";

function CategoryCard({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group block"
    >
      <div className="relative bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
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
          <h3 className="font-roboto font-[450] text-[18px] text-gray-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
            {category.name}
          </h3>
        </div>

        {/* Изображение категории */}
        <div className="px-4">
          <div className="w-full aspect-[4/3] rounded-md overflow-hidden">
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
