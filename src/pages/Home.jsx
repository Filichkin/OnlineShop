import { Link, useLocation } from "react-router-dom";

import { categories } from "../data/data";

function Home() {
  const location = useLocation();
  console.log(location);

  return (
    <div className="py-10">
      <h1 className="mb-8 text-2xl font-semibold text-center">Categories</h1>
      <ul className="grid grid-cols-3 gap-4 px-5">
        {categories.map((category) => (
          <li key={category.id}>
            <Link to={`/category/${category.name}`}>
              {category.name}
              <img src={category.img} alt={category.name} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
