import { categoriesAPI } from "../api";

export default async function fetchProductLoader({ params }) {
  try {
    const { slug } = params;

    if (!slug) {
      throw new Response('Слаг категории не указан', { status: 400 });
    }

    // Получаем категорию по слагу, чтобы вернуть categoryId для ProductDetails
    const category = await categoriesAPI.getCategoryBySlug(slug, true);

    // Валидация данных категории
    if (!category || !category.id) {
      throw new Error('Получены некорректные данные категории');
    }

    const products = await categoriesAPI.getCategoryProductsBySlug(slug, 0, 100);

    // Валидация данных продуктов
    if (!Array.isArray(products)) {
      throw new Error('Получены некорректные данные о продуктах');
    }

    // Валидируем каждый продукт на наличие обязательных полей
    const validProducts = products.filter(product => {
      if (!product || !product.id || !product.name || product.price === undefined) {
        console.warn('Обнаружен продукт с некорректными данными:', product);
        return false;
      }
      return true;
    });

    return { products: validProducts, categoryId: category.id };
  } catch (error) {
    console.error('Ошибка загрузки продуктов:', error);

    if (error.message.includes('Failed to fetch')) {
      throw new Response('Не удалось загрузить продукты', { status: 500 });
    }

    throw new Response(error.message || 'Категория не найдена', { status: 404 });
  }
}
