import { Link, useParams, useSearchParams } from "react-router-dom"

import { products } from "../data/data"


function Category() {
    const { categoryId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : Infinity;

    const currentCategoryArray = products.filter(
        (product) => (product.categoryId === categoryId) && (product.price <= maxPrice)
    );

    function handleChange(event) {
      const value = event.target.value;
      setSearchParams(value ? { maxPrice: value } : {});

    }

    return (
        <div>
          <>
            <h1>Category {categoryId}</h1>
            <div>
              <label htmlFor="maxPrice"></label>
              <input 
                type="number" 
                id="maxPrice"
                placeholder="Enter Max Price"
                value={searchParams.get("maxPrice") || ""}
                onChange={handleChange}
              />
            </div>
            <ul style={{ display: "flex" }}>
              {currentCategoryArray.map((product) => (
                <li key={product.id}>
                  <Link to={`/product/${product.id}`}>
                  <h2>{product.name}</h2>
                  <img 
                      src={product.img}
                      alt={product.name}
                      style={{ width: "150px" }}
                  />
                  <p>Price: {product.price}$</p>
                  </Link>
                </li>
                ))}
            </ul>
          </>
              
        </div>
    )
}

export default Category
