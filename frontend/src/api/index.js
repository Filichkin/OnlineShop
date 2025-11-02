// Use proxy to avoid CORS issues with cookies
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Функция для получения токена из localStorage
const getToken = () => localStorage.getItem('token');

// Функция для создания заголовков с авторизацией
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// API для категорий
export const categoriesAPI = {
  // Получить все категории
  getCategories: async (skip = 0, limit = 10, isActive = true) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/categories/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Получить категорию по ID
  getCategory: async (categoryId, isActive = true) => {
    const params = new URLSearchParams();
    
    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch category');
    return response.json();
  },

  // Получить категорию по слагу
  getCategoryBySlug: async (slug, isActive = true) => {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch category by slug');
    return response.json();
  },

  // Создать категорию
  createCategory: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  // Обновить категорию
  updateCategory: async (categoryId, formData) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
  },

  // Удалить категорию
  deleteCategory: async (categoryId) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return response.json();
  },

  // Восстановить категорию
  restoreCategory: async (categoryId) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to restore category');
    return response.json();
  },

  // Получить продукты категории
  getCategoryProducts: async (categoryId, skip = 0, limit = 10, isActive = true) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch category products');
    return response.json();
  },

  // Получить продукты категории по слагу
  getCategoryProductsBySlug: async (slug, skip = 0, limit = 10, isActive = true) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}/products/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch category products by slug');
    return response.json();
  },

  // Получить продукт категории
  getCategoryProduct: async (categoryId, productId) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch category product');
    return response.json();
  },
};

// API для продуктов
export const productsAPI = {
  // Получить все продукты
  getProducts: async (skip = 0, limit = 10, categoryId = null, search = null, minPrice = null, maxPrice = null, isActive = true) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);

    const response = await fetch(`${API_BASE_URL}/products/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Получить продукт по ID
  getProduct: async (productId, isActive = true) => {
    const params = new URLSearchParams();
    
    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  // Создать продукт в категории
  createProduct: async (categoryId, formData) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || 'Failed to create product');
      error.response = { data: errorData };
      throw error;
    }
    return response.json();
  },

  // Обновить продукт
  updateProduct: async (categoryId, productId, formData) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  // Удалить продукт
  deleteProduct: async (categoryId, productId) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  // Восстановить продукт
  restoreProduct: async (categoryId, productId) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to restore product');
    return response.json();
  },
};

// API для брендов
export const brandsAPI = {
  // Получить все бренды
  getBrands: async (skip = 0, limit = 100, isActive = true) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/brands/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch brands');
    return response.json();
  },

  // Получить бренд по ID
  getBrand: async (brandId) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`);
    if (!response.ok) throw new Error('Failed to fetch brand');
    return response.json();
  },

  // Создать бренд
  createBrand: async (brandData) => {
    const response = await fetch(`${API_BASE_URL}/brands/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandData),
    });
    if (!response.ok) throw new Error('Failed to create brand');
    return response.json();
  },

  // Обновить бренд
  updateBrand: async (brandId, brandData) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandData),
    });
    if (!response.ok) throw new Error('Failed to update brand');
    return response.json();
  },

  // Удалить бренд
  deleteBrand: async (brandId) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete brand');
    return response.json();
  },

  // Восстановить бренд
  restoreBrand: async (brandId) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/restore`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to restore brand');
    return response.json();
  },
};

// API для аутентификации
export const authAPI = {
  // Регистрация нового пользователя
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || 'Ошибка регистрации');
        error.status = response.status;
        error.details = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Логин с phone или email
  login: async (identifier, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_or_phone: identifier,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Неверный логин или пароль';

        if (response.status === 400) {
          errorMessage = errorData.detail || 'Неверные данные для входа';
        } else if (response.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (response.status === 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже';
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Восстановление пароля
  forgotPassword: async (identifier) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || 'Ошибка при восстановлении пароля');
        error.status = response.status;
        error.details = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Получить текущего пользователя
  getCurrentUser: async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Токен не найден');
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          throw new Error('Сессия истекла. Войдите снова');
        }
        throw new Error('Не удалось получить данные пользователя');
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Обновить профиль пользователя
  updateProfile: async (userData) => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Токен не найден');
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Сессия истекла. Войдите снова');
        }

        const error = new Error(errorData.detail || 'Ошибка при обновлении профиля');
        error.status = response.status;
        error.details = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },
};

// Helper function for handling cart API errors
const handleCartError = async (response) => {
  let errorMessage = 'Произошла ошибка при работе с корзиной';

  try {
    const errorData = await response.json();
    errorMessage = errorData.detail || errorMessage;
  } catch {
    // If JSON parsing fails, use status-based messages
    switch (response.status) {
      case 404:
        errorMessage = 'Корзина или товар не найдены';
        break;
      case 400:
        errorMessage = 'Некорректные данные запроса';
        break;
      case 500:
        errorMessage = 'Ошибка сервера. Попробуйте позже';
        break;
      default:
        errorMessage = `Ошибка: ${response.statusText}`;
    }
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  throw error;
};

// API для корзины
export const cartAPI = {
  // Получить корзину с товарами
  getCart: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/`, {
        credentials: 'include', // Важно для отправки cookies
      });
      if (!response.ok) {
        await handleCartError(response);
      }
      return response.json();
    } catch (error) {
      // Handle network errors
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Получить краткую информацию о корзине
  getCartSummary: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/summary`, {
        credentials: 'include',
      });
      if (!response.ok) {
        await handleCartError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Добавить товар в корзину
  addItem: async (product_id, quantity = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id,
          quantity,
        }),
      });
      if (!response.ok) {
        await handleCartError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Обновить количество товара в корзине
  updateItem: async (product_id, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items/${product_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity,
        }),
      });
      if (!response.ok) {
        await handleCartError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Удалить товар из корзины
  removeItem: async (product_id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items/${product_id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        await handleCartError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Очистить корзину
  clearCart: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        await handleCartError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },
};

// Helper function for handling favorites API errors
const handleFavoritesError = async (response) => {
  let errorMessage = 'Произошла ошибка при работе с избранным';

  try {
    const errorData = await response.json();
    errorMessage = errorData.detail || errorMessage;
  } catch {
    // If JSON parsing fails, use status-based messages
    switch (response.status) {
      case 404:
        errorMessage = 'Товар не найден';
        break;
      case 409:
        errorMessage = 'Товар уже в избранном';
        break;
      case 400:
        errorMessage = 'Некорректные данные запроса';
        break;
      case 500:
        errorMessage = 'Ошибка сервера. Попробуйте позже';
        break;
      default:
        errorMessage = `Ошибка: ${response.statusText}`;
    }
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  throw error;
};

// API для избранного
export const favoritesAPI = {
  // Получить список избранных товаров
  getFavorites: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/`, {
        credentials: 'include', // Важно для отправки cookies
      });
      if (!response.ok) {
        await handleFavoritesError(response);
      }
      return response.json();
    } catch (error) {
      // Handle network errors
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Добавить товар в избранное
  addToFavorites: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        // 409 Conflict означает что товар уже в избранном - не критичная ошибка
        if (response.status === 409) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.detail || 'Товар уже в избранном');
          error.status = 409;
          error.isConflict = true; // Флаг для обработки в UI
          throw error;
        }
        await handleFavoritesError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Удалить товар из избранного
  removeFromFavorites: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        await handleFavoritesError(response);
      }
      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },
};