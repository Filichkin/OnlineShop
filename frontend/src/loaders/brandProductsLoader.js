import { brandsAPI } from "../api";
import { logger } from "../utils/logger";

export default async function fetchBrandProductsLoader({ params }) {
  try {
    const { slug } = params;

    if (!slug) {
      throw new Response('Слаг бренда не указан', { status: 400 });
    }

    // Получаем бренд по слагу, чтобы вернуть brandId для ProductDetails
    const brand = await brandsAPI.getBrandBySlug(slug, true);

    // Валидация данных бренда
    if (!brand || !brand.id) {
      throw new Error('Получены некорректные данные бренда');
    }

    const products = await brandsAPI.getBrandProductsBySlug(slug, 0, 100);

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

    return { products: validProducts, brandId: brand.id };
  } catch (error) {
    logger.error('Ошибка загрузки продуктов бренда:', error);

    if (error.message.includes('Failed to fetch')) {
      throw new Response('Не удалось загрузить продукты', { status: 500 });
    }

    throw new Response(error.message || 'Бренд не найден', { status: 404 });
  }
}
