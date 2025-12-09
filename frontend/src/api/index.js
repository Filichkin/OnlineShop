// Use proxy to avoid CORS issues with cookies
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Import CSRF utility
import { getCsrfTokenFromCookie } from '../utils/csrf';

// Функция для получения CSRF токена
const getCsrfToken = () => {
  return getCsrfTokenFromCookie();
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
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = 'Не удалось создать категорию';

      // Обработка ошибок валидации FastAPI (422)
      if (response.status === 422 && errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Извлекаем читаемые сообщения об ошибках
          const messages = errorData.detail.map(err => {
            if (err.loc && err.loc.includes('image')) {
              return 'Изображение категории обязательно';
            }
            if (err.loc && err.loc.includes('icon')) {
              return 'Иконка категории обязательна';
            }
            if (err.msg) {
              return err.msg;
            }
            return String(err);
          });
          errorMessage = messages.join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else {
        switch (response.status) {
          case 400:
            errorMessage = 'Некорректные данные категории';
            break;
          case 401:
            errorMessage = 'Необходимо войти в систему';
            break;
          case 403:
            errorMessage = 'Недостаточно прав для создания категории';
            break;
          case 500:
            errorMessage = 'Ошибка сервера. Попробуйте позже';
            break;
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    return response.json();
  },

  // Обновить категорию
  updateCategory: async (categoryId, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
  },

  // Удалить категорию
  deleteCategory: async (categoryId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete category');
    return response.json();
  },

  // Восстановить категорию
  restoreCategory: async (categoryId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/restore`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
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

// API для изображений продуктов
export const productsImageAPI = {
  // Получить все изображения продукта
  getImages: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch images');
    return response.json();
  },

  // Добавить изображения к продукту
  addImages: async (productId, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add images');
    }
    return response.json();
  },

  // Установить главное изображение
  updateMainImage: async (productId, imageId) => {
    const csrfToken = getCsrfToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/images/${imageId}/main`,
      {
        method: 'PATCH',
        headers,
        credentials: 'include',
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update main image');
    }
    return response.json();
  },

  // Удалить изображение
  deleteImage: async (productId, imageId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers,
        credentials: 'include',
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete image');
    }
    return response.json();
  },
};

// API для продуктов (DEPRECATED - используйте brandProductsAPI или catalogAPI)
export const productsAPI = {
  // Получить все продукты (DEPRECATED)
  getProducts: async (skip = 0, limit = 10, categoryId = null, search = null, minPrice = null, maxPrice = null, isActive) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    // Добавляем is_active только если он не undefined
    // undefined = не фильтровать, загрузить все продукты
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }

    if (categoryId) params.append('category_id', categoryId);
    if (search) params.append('search', search);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);

    const url = `${API_BASE_URL}/products/?${params}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Получить продукт по ID (DEPRECATED)
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

  // DEPRECATED: Используйте brandProductsAPI.create
  createProduct: async (categoryId, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/`, {
      method: 'POST',
      headers,
      credentials: 'include',
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

  // DEPRECATED: Используйте brandProductsAPI.update
  updateProduct: async (categoryId, productId, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  // DEPRECATED: Используйте brandProductsAPI.delete
  deleteProduct: async (categoryId, productId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  // DEPRECATED: Используйте brandProductsAPI.restore
  restoreProduct: async (categoryId, productId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products/${productId}/restore`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to restore product');
    return response.json();
  },
};

// API для управления продуктами бренда (ADMIN)
export const brandProductsAPI = {
  // Получить все продукты бренда
  getAll: async (brandSlug, params = {}) => {
    const {
      skip = 0,
      limit = 20,
      is_active = true,
      sort_by = 'name',
      sort_order = 'asc'
    } = params;

    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (is_active !== undefined) {
      queryParams.append('is_active', is_active.toString());
    }
    if (sort_by) queryParams.append('sort_by', sort_by);
    if (sort_order) queryParams.append('sort_order', sort_order);

    const response = await fetch(
      `${API_BASE_URL}/brands/${brandSlug}/products/?${queryParams}`,
      { credentials: 'include' }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch brand products');
    }
    return response.json();
  },

  // Получить один продукт бренда
  getOne: async (brandSlug, productId) => {
    const response = await fetch(
      `${API_BASE_URL}/brands/${brandSlug}/products/${productId}`,
      { credentials: 'include' }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch product');
    }
    return response.json();
  },

  // Создать продукт для бренда (ADMIN)
  create: async (brandSlug, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/brands/${brandSlug}/products/`, {
      method: 'POST',
      headers,
      credentials: 'include',
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

  // Обновить продукт (ADMIN)
  update: async (brandSlug, productId, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(
      `${API_BASE_URL}/brands/${brandSlug}/products/${productId}`,
      {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: formData,
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update product');
    }
    return response.json();
  },

  // Удалить продукт (мягкое удаление) (ADMIN)
  delete: async (brandSlug, productId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(
      `${API_BASE_URL}/brands/${brandSlug}/products/${productId}`,
      {
        method: 'DELETE',
        headers,
        credentials: 'include',
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete product');
    }
    return response.json();
  },

  // Восстановить продукт (ADMIN)
  restore: async (brandSlug, productId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(
      `${API_BASE_URL}/brands/${brandSlug}/products/${productId}/restore`,
      {
        method: 'PATCH',
        headers,
        credentials: 'include',
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to restore product');
    }
    return response.json();
  },
};

// API для каталога продуктов (для всех пользователей)
export const catalogAPI = {
  // Получить все продукты с фильтрами
  getAll: async (filters = {}) => {
    const {
      skip = 0,
      limit = 20,
      brand_slug,
      search,
      min_price,
      max_price,
      is_active = true,
      sort_by = 'name',
      sort_order = 'asc'
    } = filters;

    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (is_active !== undefined) {
      params.append('is_active', is_active.toString());
    }
    if (brand_slug) params.append('brand_slug', brand_slug);
    if (search) params.append('search', search);
    if (min_price !== undefined && min_price !== null && min_price !== '') {
      params.append('min_price', min_price.toString());
    }
    if (max_price !== undefined && max_price !== null && max_price !== '') {
      params.append('max_price', max_price.toString());
    }
    if (sort_by) params.append('sort_by', sort_by);
    if (sort_order) params.append('sort_order', sort_order);

    const response = await fetch(`${API_BASE_URL}/catalog/?${params}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch catalog products');
    }
    return response.json();
  },

  // Получить один продукт из каталога
  getOne: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/catalog/${productId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch product');
    }
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
  getBrand: async (brandId, isActive = true) => {
    const params = new URLSearchParams();

    // Добавляем is_active только если он не undefined
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }

    const response = await fetch(`${API_BASE_URL}/brands/${brandId}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch brand');
    return response.json();
  },

  // Получить бренд по слагу
  getBrandBySlug: async (slug, isActive = true) => {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    const response = await fetch(`${API_BASE_URL}/brands/slug/${slug}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch brand by slug');
    return response.json();
  },

  // Создать бренд
  createBrand: async (formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/brands/`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = 'Не удалось создать бренд';

      // Обработка ошибок валидации FastAPI (422)
      if (response.status === 422 && errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => {
            if (err.msg) {
              return err.msg;
            }
            return String(err);
          });
          errorMessage = messages.join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    return response.json();
  },

  // Обновить бренд
  updateBrand: async (brandId, formData) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update brand');
    return response.json();
  },

  // Удалить бренд
  deleteBrand: async (brandId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete brand');
    return response.json();
  },

  // Восстановить бренд
  restoreBrand: async (brandId) => {
    const csrfToken = getCsrfToken();
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/restore`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to restore brand');
    return response.json();
  },

  // Получить продукты бренда по слагу
  getBrandProductsBySlug: async (slug, skip = 0, limit = 100, isActive = true) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (isActive !== undefined) {
      params.append('is_active', isActive.toString());
    }
    const response = await fetch(`${API_BASE_URL}/brands/${slug}/products/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch brand products by slug');
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
        credentials: 'include', // Send session cookie for cart/favorites merge
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.detail || 'Ошибка регистрации';

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            errorMessage = `Слишком много попыток регистрации. Попробуйте через ${retryAfter} секунд`;
          } else {
            errorMessage = 'Слишком много попыток регистрации. Попробуйте позже';
          }
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorData;
        error.retryAfter = response.headers.get('Retry-After');
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
        credentials: 'include', // Send session cookie for cart/favorites merge
        body: JSON.stringify({
          email_or_phone: identifier,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Неверный логин или пароль';

        if (response.status === 429) {
          // Handle rate limiting
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            errorMessage = `Слишком много попыток входа. Попробуйте через ${retryAfter} секунд`;
          } else {
            errorMessage = 'Слишком много попыток входа. Попробуйте позже';
          }
        } else if (response.status === 400) {
          errorMessage = errorData.detail || 'Неверные данные для входа';
        } else if (response.status === 401) {
          errorMessage = 'Неверный логин или пароль';
        } else if (response.status === 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже';
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorData;
        error.retryAfter = response.headers.get('Retry-After');
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
        let errorMessage = errorData.detail || 'Ошибка при восстановлении пароля';

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            errorMessage = `Слишком много попыток. Попробуйте через ${retryAfter} секунд`;
          } else {
            errorMessage = 'Слишком много попыток. Попробуйте позже';
          }
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.details = errorData;
        error.retryAfter = response.headers.get('Retry-After');
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
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include', // Send httpOnly cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or invalid
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
      const csrfToken = getCsrfToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers,
        credentials: 'include', // Send httpOnly cookies
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
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

// Helper function to get headers for cart/favorites
const getCartFavoritesHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
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
        headers: getCartFavoritesHeaders(),
        credentials: 'include', // Keep for backward compatibility with session cookies
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
        headers: getCartFavoritesHeaders(),
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
      const csrfToken = getCsrfToken();
      const headers = getCartFavoritesHeaders();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers,
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
      const csrfToken = getCsrfToken();
      const headers = getCartFavoritesHeaders();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/cart/items/${product_id}`, {
        method: 'PATCH',
        headers,
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
      const csrfToken = getCsrfToken();
      const headers = getCartFavoritesHeaders();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/cart/items/${product_id}`, {
        method: 'DELETE',
        headers,
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
      const csrfToken = getCsrfToken();
      const headers = getCartFavoritesHeaders();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/cart/`, {
        method: 'DELETE',
        headers,
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
        headers: getCartFavoritesHeaders(),
        credentials: 'include', // Keep for backward compatibility with session cookies
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
      const csrfToken = getCsrfToken();
      const headers = getCartFavoritesHeaders();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
        method: 'POST',
        headers,
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
      const csrfToken = getCsrfToken();
      const headers = getCartFavoritesHeaders();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
        method: 'DELETE',
        headers,
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

// Helper function for handling orders API errors
const handleOrderError = async (response) => {
  let errorMessage = 'Произошла ошибка при работе с заказами';

  try {
    const errorData = await response.json();
    // Handle FastAPI validation errors (422)
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        // FastAPI validation errors are arrays
        const messages = errorData.detail.map(err => {
          if (typeof err === 'object' && err.msg) {
            return `${err.loc?.join('.') || 'field'}: ${err.msg}`;
          }
          return String(err);
        });
        errorMessage = messages.join('; ');
      } else {
        errorMessage = errorData.detail;
      }
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
  } catch {
    // If JSON parsing fails, use status-based messages
    switch (response.status) {
      case 400:
        errorMessage = 'Некорректные данные заказа';
        break;
      case 401:
        errorMessage = 'Необходимо войти в систему';
        break;
      case 404:
        errorMessage = 'Корзина пуста или товары не найдены';
        break;
      case 422:
        errorMessage = 'Ошибка валидации данных запроса';
        break;
      case 429:
        // Handle rate limiting
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          errorMessage = `Слишком много заказов. Попробуйте через ${retryAfter} секунд`;
        } else {
          errorMessage = 'Слишком много заказов. Попробуйте позже';
        }
        break;
      case 500:
        errorMessage = 'Ошибка сервера. Попробуйте позже';
        break;
      default:
        errorMessage = `Ошибка: ${response.statusText || response.status}`;
    }
  }

  const error = new Error(errorMessage);
  error.status = response.status;
  error.response = response;
  error.retryAfter = response.headers.get('Retry-After');
  throw error;
};

// API для заказов
export const ordersAPI = {
  // Создать новый заказ
  createOrder: async (orderData) => {
    try {
      const csrfToken = getCsrfToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/orders/`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        await handleOrderError(response);
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Получить список заказов пользователя
  getOrders: async (skip = 0, limit = 10) => {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/orders/?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await handleOrderError(response);
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Получить заказ по ID
  getOrder: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await handleOrderError(response);
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Отменить заказ
  cancelOrder: async (orderId) => {
    try {
      const csrfToken = getCsrfToken();
      const headers = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        await handleOrderError(response);
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

// API для админ-панели заказов
export const adminOrdersAPI = {
  // Получить все заказы (только для администратора)
  getAllOrders: async (skip = 0, limit = 20, status = null) => {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${API_BASE_URL}/orders/admin/all?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await handleOrderError(response);
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Получить заказ по ID (только для администратора)
  getOrderById: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        await handleOrderError(response);
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Обновить статус заказа (только для администратора)
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const csrfToken = getCsrfToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        await handleOrderError(response);
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

// API для управления пользователями (администратор)
export const adminUsersAPI = {
  // Получить всех пользователей (с пагинацией)
  getAllUsers: async (skip = 0, limit = 20) => {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch users');
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Получить пользователя по ID
  getUserById: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch user');
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Ошибка сети. Проверьте подключение к интернету');
      }
      throw error;
    }
  },

  // Обновить пользователя
  updateUser: async (userId, userData) => {
    try {
      const csrfToken = getCsrfToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update user');
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