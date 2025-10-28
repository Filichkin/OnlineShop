import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../api';

// Асинхронные действия
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ skip = 0, limit = 10, categoryId = null, search = null, minPrice = null, maxPrice = null, isActive = true } = {}) => {
    // Убеждаемся, что isActive не null
    const activeFilter = isActive === null ? undefined : isActive;
    const response = await productsAPI.getProducts(skip, limit, categoryId, search, minPrice, maxPrice, activeFilter);
    return response;
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async ({ productId, isActive = true }) => {
    const response = await productsAPI.getProduct(productId, isActive);
    return response;
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async ({ categoryId, formData }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.createProduct(categoryId, formData);
      return response;
    } catch (error) {
      // Если ошибка содержит детальную информацию от сервера
      if (error.response && error.response.data && error.response.data.detail) {
        return rejectWithValue(error.response.data);
      }
      // Иначе возвращаем общую ошибку
      return rejectWithValue({ detail: error.message || 'Ошибка при создании продукта' });
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ categoryId, productId, formData }) => {
    const response = await productsAPI.updateProduct(categoryId, productId, formData);
    return response;
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async ({ categoryId, productId }) => {
    const response = await productsAPI.deleteProduct(categoryId, productId);
    return response;
  }
);

export const restoreProduct = createAsyncThunk(
  'products/restoreProduct',
  async ({ categoryId, productId }) => {
    const response = await productsAPI.restoreProduct(categoryId, productId);
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
    limit: 10,
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
        // Извлекаем детальное сообщение об ошибке из ответа сервера
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
