import { brandsAPI } from "../api";

export default async function fetchBrandLoader() {
  try {
    const brands = await brandsAPI.getBrands(0, 100);

    // Валидация ответа API: проверяем, что данные получены и имеют правильную структуру
    if (!brands) {
      throw new Error('Не удалось получить данные о брендах');
    }

    if (!Array.isArray(brands)) {
      throw new Error('Получены некорректные данные о брендах');
    }

    // Валидируем каждый бренд на наличие обязательных полей
    const validBrands = brands.filter(brand => {
      if (!brand || !brand.id || !brand.name) {
        console.warn('Обнаружен бренд с некорректными данными:', brand);
        return false;
      }
      return true;
    });

    return validBrands;
  } catch (error) {
    console.error('Ошибка загрузки брендов:', error);
    throw new Response(error.message || 'Не удалось загрузить бренды', { status: 500 });
  }
}
