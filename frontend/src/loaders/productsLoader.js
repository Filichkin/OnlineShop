import { categoriesAPI } from "../api";

export default async function fetchProductLoader({ params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      throw new Response('Слаг категории не указан', { status: 400 });
    }
    
    // Получаем категорию по слагу, чтобы вернуть categoryId для ProductDetails
    const category = await categoriesAPI.getCategoryBySlug(slug, true);
    const products = await categoriesAPI.getCategoryProductsBySlug(slug, 0, 100);
    return { products, categoryId: category.id };
  } catch (error) {
    console.error('Ошибка загрузки продуктов:', error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Response('Не удалось загрузить продукты', { status: 500 });
    }
    
    throw new Response('Категория не найдена', { status: 404 });
  }
}
