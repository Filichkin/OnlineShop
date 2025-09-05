export default async function fetchProductLoader() {
    const response = await fetch("http://localhost:9000/products");
    if(!response.ok) {
        throw new Error("Failed to fetch product data")
    }
    return response.json();
}