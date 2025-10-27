import { Link, useLoaderData } from "react-router-dom";
import { getImageUrl } from "../utils";

function Home() {
  const categories = useLoaderData();

  return (
    <div className="py-10">
      <ul className="grid grid-cols-3 gap-4 px-5">
        {categories.map((category) => (
          <li key={category.id}>
            <Link 
              className="relative flex flex-col items-center justify-center group" 
              to={`/category/${category.id}`}
            >
              <span className="absolute z-10 text-xl font-semibold text-white transition-all group-hover:text-2xl">
                {category.name}
              </span>
              <img
                className="rounded-md"
                src={getImageUrl(category.image_url)}
                alt={`${category.name} category - Click to view products`}
              />
              <div className="absolute inset-0 bg-gray-900 rounded-md opacity-40"></div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
