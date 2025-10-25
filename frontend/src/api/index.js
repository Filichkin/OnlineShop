const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  getCategories: async (skip = 0, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/categories/?skip=${skip}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Получить категорию по ID
  getCategory: async (categoryId) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`);
    if (!response.ok) throw new Error('Failed to fetch category');
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
  getCategoryProducts: async (categoryId, skip = 0, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/?skip=${skip}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch category products');
    return response.json();
  },
};

// API для продуктов
export const productsAPI = {
  // Получить все продукты
  getProducts: async (skip = 0, limit = 10, categoryId = null, search = null, minPrice = null, maxPrice = null) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);

    const response = await fetch(`${API_BASE_URL}/products/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Получить продукт по ID
  getProduct: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
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
    if (!response.ok) throw new Error('Failed to create product');
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

// API для аутентификации
export const authAPI = {
  // Логин
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/jwt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    });
    if (!response.ok) throw new Error('Failed to login');
    return response.json();
  },

  // Получить текущего пользователя
  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },
};