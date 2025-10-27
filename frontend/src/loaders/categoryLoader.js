import { categoriesAPI } from "../api";

export default async function fetchCategoryLoader() {
  try {
    const categories = await categoriesAPI.getCategories(0, 100);
    return categories;
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    throw new Response('Не удалось загрузить категории', { status: 500 });
  }
}
