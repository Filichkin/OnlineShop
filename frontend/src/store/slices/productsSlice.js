import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI, brandProductsAPI, catalogAPI } from '../../api';

// ============================================================================
// DEPRECATED THUNKS - Используйте новые API через brandProductsAPI или catalogAPI
// ============================================================================

// DEPRECATED: Используйте fetchCatalogProducts
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    const {
      skip = 0,
      limit = 20,
      categoryId = null,
      search = null,
      minPrice = null,
      maxPrice = null
    } = params;

    const isActive = 'isActive' in params ? params.isActive : true;

    const response = await productsAPI.getProducts(skip, limit, categoryId, search, minPrice, maxPrice, isActive);
    return response;
  }
);

// DEPRECATED: Используйте fetchCatalogProduct
export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async ({ productId, isActive = true }) => {
    const response = await productsAPI.getProduct(productId, isActive);
    return response;
  }
);

// DEPRECATED: Используйте createBrandProduct
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async ({ categoryId, formData }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.createProduct(categoryId, formData);
      return response;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ detail: error.message || 'Ошибка при создании продукта' });
    }
  }
);

// DEPRECATED: Используйте updateBrandProduct
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ categoryId, productId, formData }) => {
    const response = await productsAPI.updateProduct(categoryId, productId, formData);
    return response;
  }
);

// DEPRECATED: Используйте deleteBrandProduct
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async ({ categoryId, productId }) => {
    const response = await productsAPI.deleteProduct(categoryId, productId);
    return response;
  }
);

// DEPRECATED: Используйте restoreBrandProduct
export const restoreProduct = createAsyncThunk(
  'products/restoreProduct',
  async ({ categoryId, productId }) => {
    const response = await productsAPI.restoreProduct(categoryId, productId);
    return response;
  }
);

// ============================================================================
// НОВЫЕ THUNKS ДЛЯ РАБОТЫ С БРЕНДАМИ (ADMIN)
// ============================================================================

// Получить все продукты бренда (ADMIN)
export const fetchBrandProducts = createAsyncThunk(
  'products/fetchBrandProducts',
  async ({ brandSlug, params = {} }) => {
    const response = await brandProductsAPI.getAll(brandSlug, params);
    return response;
  }
);

// Получить один продукт бренда (ADMIN)
export const fetchBrandProduct = createAsyncThunk(
  'products/fetchBrandProduct',
  async ({ brandSlug, productId }) => {
    const response = await brandProductsAPI.getOne(brandSlug, productId);
    return response;
  }
);

// Создать продукт для бренда (ADMIN)
export const createBrandProduct = createAsyncThunk(
  'products/createBrandProduct',
  async ({ brandSlug, formData }, { rejectWithValue }) => {
    try {
      const response = await brandProductsAPI.create(brandSlug, formData);
      return response;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ detail: error.message || 'Ошибка при создании продукта' });
    }
  }
);

// Обновить продукт бренда (ADMIN)
export const updateBrandProduct = createAsyncThunk(
  'products/updateBrandProduct',
  async ({ brandSlug, productId, formData }) => {
    const response = await brandProductsAPI.update(brandSlug, productId, formData);
    return response;
  }
);

// Удалить продукт бренда (ADMIN)
export const deleteBrandProduct = createAsyncThunk(
  'products/deleteBrandProduct',
  async ({ brandSlug, productId }) => {
    const response = await brandProductsAPI.delete(brandSlug, productId);
    return response;
  }
);

// Восстановить продукт бренда (ADMIN)
export const restoreBrandProduct = createAsyncThunk(
  'products/restoreBrandProduct',
  async ({ brandSlug, productId }) => {
    const response = await brandProductsAPI.restore(brandSlug, productId);
    return response;
  }
);

// ============================================================================
// НОВЫЕ THUNKS ДЛЯ КАТАЛОГА (для всех пользователей)
// ============================================================================

// Получить все продукты каталога с фильтрами
export const fetchCatalogProducts = createAsyncThunk(
  'products/fetchCatalogProducts',
  async (filters = {}) => {
    const response = await catalogAPI.getAll(filters);
    return response;
  }
);

// Получить один продукт из каталога
export const fetchCatalogProduct = createAsyncThunk(
  'products/fetchCatalogProduct',
  async (productId) => {
    const response = await catalogAPI.getOne(productId);
    return response;
  }
);

const initialState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  filters: {
    categoryId: null,
    search: null,
    minPrice: null,
    maxPrice: null,
    isActive: true,
  },
  pagination: {
    skip: 0,
    limit: 20,
    total: 0,
  },
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        categoryId: null,
        search: null,
        minPrice: null,
        maxPrice: null,
        isActive: true,
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ====================================================================
      // DEPRECATED - Старые обработчики (оставлены для совместимости)
      // ====================================================================

      // Получение списка продуктов
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Получение одного продукта
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Создание продукта
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.detail) {
          state.error = action.payload.detail;
        } else if (action.error.message) {
          state.error = action.error.message;
        } else {
          state.error = 'Ошибка при создании продукта';
        }
      })

      // Обновление продукта
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(prod => prod.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct && state.currentProduct.id === action.payload.id) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Удаление продукта
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(prod => prod.id !== action.payload.id);
        if (state.currentProduct && state.currentProduct.id === action.payload.id) {
          state.currentProduct = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Восстановление продукта
      .addCase(restoreProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(restoreProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // ====================================================================
      // НОВЫЕ ОБРАБОТЧИКИ - Brand Products (ADMIN)
      // ====================================================================

      // Получение продуктов бренда
      .addCase(fetchBrandProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrandProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchBrandProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Получение одного продукта бренда
      .addCase(fetchBrandProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrandProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchBrandProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Создание продукта бренда
      .addCase(createBrandProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBrandProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(createBrandProduct.rejected, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.detail) {
          state.error = action.payload.detail;
        } else if (action.error.message) {
          state.error = action.error.message;
        } else {
          state.error = 'Ошибка при создании продукта';
        }
      })

      // Обновление продукта бренда
      .addCase(updateBrandProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBrandProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(prod => prod.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct && state.currentProduct.id === action.payload.id) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateBrandProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Удаление продукта бренда
      .addCase(deleteBrandProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBrandProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(prod => prod.id !== action.payload.id);
        if (state.currentProduct && state.currentProduct.id === action.payload.id) {
          state.currentProduct = null;
        }
      })
      .addCase(deleteBrandProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Восстановление продукта бренда
      .addCase(restoreBrandProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreBrandProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })
      .addCase(restoreBrandProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // ====================================================================
      // НОВЫЕ ОБРАБОТЧИКИ - Catalog Products (PUBLIC)
      // ====================================================================

      // Получение продуктов каталога
      .addCase(fetchCatalogProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalogProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchCatalogProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Получение одного продукта каталога
      .addCase(fetchCatalogProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatalogProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchCatalogProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { 
  clearError, 
  clearCurrentProduct, 
  setFilters, 
  clearFilters, 
  setPagination 
} = productsSlice.actions;
export default productsSlice.reducer;
