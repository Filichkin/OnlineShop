import { Link } from "react-router-dom";
import { getImageUrl } from "../utils";

function CategoryCard({ category }) {
  return (
    <Link 
      to={`/category/${category.slug}`}
      className="group block h-full"
    >
      <div className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        {/* Иконка категории */}
        {category.icon_url && category.icon_url.trim() !== '' && (
          <div className="flex justify-start px-4 pt-4 pb-1">
            <div className="h-16 w-16 flex items-center justify-center bg-white overflow-hidden">
              <img
                src={getImageUrl(category.icon_url)}
                alt="icon"
                className="h-16 w-16 object-cover"
              />
            </div>
          </div>
        )}
        
        {/* Название категории */}
        <div className="px-4 pb-2 h-16 flex items-center">
          <h3 className="text-lg text-gray-600 group-hover:text-blue-600 transition-colors duration-300 leading-tight" style={{fontWeight: 600}}>
            {category.name}
          </h3>
        </div>
        
        {/* Изображение категории */}
        <div className="px-4 pb-4 flex-1 flex items-center">
          <img
            className="w-full h-32 object-cover rounded-md"
            src={getImageUrl(category.image_url)}
            alt={`${category.name} category`}
          />
        </div>
      </div>
    </Link>
  );
}

export default CategoryCard;
