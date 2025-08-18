import { Link } from "react-router-dom"
import { useParams } from "react-router-dom"

import { products } from "../data/data"


function Category() {
    const { categoryId } = useParams();
    const currentCategoryArray = products.filter(
        (product) => (product.categoryId === categoryId)
    );

    return (
        <div>
            <h1>Category {categoryId}</h1>
            <ul style={{ display: "flex" }}>
                {currentCategoryArray.map((product) => (
                    <li key={product.id}>
                        <Link to={`/product/${product.id}`}>
                          <img src={product.img} alt={product.name} style={{ width: "150px" }}/>
                          <h2>{product.name}</h2>
                          <p>Price: {product.price}$</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Category
