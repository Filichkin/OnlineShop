import { useParams } from "react-router-dom";
import { products } from "../data/data";

function ProductDetails() {
  const { productId } = useParams();

  const product = products.find((p) => p.id === parseInt(productId, 10));

  console.log(product);

  return (
    <div className="px-6 py-10">
      {product ? (
        <>
          <h1 className="mb-6 text-3xl font-semibold text-center">Информация о товаре</h1>
          <div className="flex flex-col items-center p-6 bg-white rounded-md">
            <h2 
              className="mb-2 text-xl font-semibold">
                {product.name}
            </h2>
            <p className="text-lg text-gray-700">Price: {product.price}$</p>
            <img 
              className="w-40 h-40 mb-4 rounded" 
              src={product.img} alt={product.name}
            />
          </div>
          
        </>
      ) : (
        <p className="text-xl font-bold text-center text-red-500">Not Found</p>
      )}
    </div>
  );
}

export default ProductDetails;
