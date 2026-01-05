import { categoriesAPI } from "../api";
import { logger } from "../utils/logger";

export default async function fetchCategoryLoader() {
  try {
    const categories = await categoriesAPI.getCategories(0, 100);

    // Валидация ответа API: проверяем, что данные получены и имеют правильную структуру
    if (!categories) {
      throw new Error('Не удалось получить данные о категориях');
    }

    if (!Array.isArray(categories)) {
      throw new Error('Получены некорректные данные о категориях');
    }

    // Валидируем каждую категорию на наличие обязательных полей
    const validCategories = categories.filter(category => {
      if (!category || !category.id || !category.name) {
        console.warn('Обнаружена категория с некорректными данными:', category);
        return false;
      }
      return true;
    });

    return validCategories;
  } catch (error) {
    logger.error('Ошибка загрузки категорий:', error);
    throw new Response(error.message || 'Не удалось загрузить категории', { status: 500 });
  }
}
