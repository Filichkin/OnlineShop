export default async function fetchCategoryLoader() {
    const response = await fetch("http://localhost:9000/categories");
    if(!response.ok) {
        throw new Error("Failed to fetch categories data")
    }
    return response.json();
}