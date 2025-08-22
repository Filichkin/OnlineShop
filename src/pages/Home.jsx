import { Link, useLocation } from "react-router-dom";

import { categories } from "../data/data";

function Home() {
  const location = useLocation();
  console.log(location);

  return (
    <div>
      <h1>Categories</h1>
      <ul style={{ display: "flex" }}>
        {categories.map((category) => (
          <li key={category.id}>
            <Link to={`/category/${category.name}`}>
              {category.name}
              <img src={category.img} alt={category.name} style={{ width: "150px" }} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
