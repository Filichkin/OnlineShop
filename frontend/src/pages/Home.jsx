import { useLoaderData } from "react-router-dom";
import { useMemo } from "react";
import CategoryCard from "../components/CategoryCard";

function Home() {
  const categories = useLoaderData();

  // Валидация и сортировка категорий
  const sortedCategories = useMemo(() => {
    if (!Array.isArray(categories)) {
      return [];
    }

    return categories
      .filter(category => category && category.id && category.name)
      .sort((a, b) => {
        // Алфавитная сортировка с учетом локали (кириллица)
        return a.name.localeCompare(b.name, 'ru', {
          sensitivity: 'base',
          ignorePunctuation: true
        });
      });
  }, [categories]);

  return (
    <div className="py-10 bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(219,234,254,0.25)_50%,rgba(219,234,254,0.4)_100%)]">
      <div className="container">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-600">Категории не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 auto-rows-fr gap-2.5">
            {sortedCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
