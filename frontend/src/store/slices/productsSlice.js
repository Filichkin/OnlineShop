import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../api';

// Асинхронные действия
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ skip = 0, limit = 10, categoryId = null, search = null, minPrice = null, maxPrice = null } = {}) => {
    const response = await productsAPI.getProducts(skip, limit, categoryId, search, minPrice, maxPrice);
    return response;
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (productId) => {
    const response = await productsAPI.getProduct(productId);
    return response;
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async ({ categoryId, formData }) => {
    const response = await productsAPI.createProduct(categoryId, formData);
    return response;
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
        state.error = action.error.message;
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
