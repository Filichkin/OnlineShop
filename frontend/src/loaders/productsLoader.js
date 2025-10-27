import { categoriesAPI } from "../api";

export default async function fetchProductLoader({ params }) {
  try {
    const { categoryId } = params;
    
    if (!categoryId) {
      throw new Response('ID категории не указан', { status: 400 });
    }
    
    const products = await categoriesAPI.getCategoryProducts(categoryId, 0, 100);
    return { products, categoryId };
  } catch (error) {
    console.error('Ошибка загрузки продуктов:', error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Response('Не удалось загрузить продукты', { status: 500 });
    }
    
    throw new Response('Категория не найдена', { status: 404 });
  }
}
