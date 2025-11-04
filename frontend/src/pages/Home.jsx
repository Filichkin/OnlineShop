import { useLoaderData } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";

function Home() {
  const categories = useLoaderData();

  // Дополнительная валидация данных на стороне компонента
  const validCategories = Array.isArray(categories)
    ? categories.filter(category => category && category.id && category.name)
    : [];

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        {validCategories.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-600">Категории не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {validCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
