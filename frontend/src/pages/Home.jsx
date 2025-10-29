import { useLoaderData } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";

function Home() {
  const categories = useLoaderData();

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
