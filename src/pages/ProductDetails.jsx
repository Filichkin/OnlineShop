import { useParams } from 'react-router-dom';

import { products } from "../data/data";

function ProductDetails() {
    const { productId } = useParams();

    const product = products.find(product => product.id === parseInt(productId, 10));

    if (!product) {
        return <div>Product not found</div>;
    }

    return (
        <div>
            {product ? (
                <>
                  <h1>Product details</h1>
                  <h2>{product.name}</h2>
                  <p>Price: {product.price}$</p>
                  <img 
                    src={product.img} 
                    alt={product.name} 
                    style={{ width: "150px" }}
                  />
                </>
                    ) : (
                        <p>Not found</p>
                    )}
        </div>
    )
}

export default ProductDetails
