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
            {currentCategoryArray.length > 0 ? (
                <>
                    <h1>Category {categoryId}</h1>
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
                ) : (
                    <p>Category not found</p>
                )}
        </div>
    )
}

export default Category
