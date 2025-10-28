import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesAPI } from '../../api';

// Асинхронные действия
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async ({ skip = 0, limit = 10, isActive = true } = {}) => {
    // Убеждаемся, что isActive не null
    const activeFilter = isActive === null ? undefined : isActive;
    const response = await categoriesAPI.getCategories(skip, limit, activeFilter);
    return response;
  }
);

export const fetchCategory = createAsyncThunk(
  'categories/fetchCategory',
  async ({ categoryId, isActive = true }) => {
    const response = await categoriesAPI.getCategory(categoryId, isActive);
    return response;
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (formData) => {
    const response = await categoriesAPI.createCategory(formData);
    return response;
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ categoryId, formData }) => {
    const response = await categoriesAPI.updateCategory(categoryId, formData);
    return response;
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (categoryId) => {
    const response = await categoriesAPI.deleteCategory(categoryId);
    return response;
  }
);

export const restoreCategory = createAsyncThunk(
  'categories/restoreCategory',
  async (categoryId) => {
    const response = await categoriesAPI.restoreCategory(categoryId);
    return response;
  }
);

const initialState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
  filters: {
    isActive: true,
  },
  pagination: {
    skip: 0,
    limit: 10,
    total: 0,
  },
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        isActive: true,
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Получение списка категорий
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Получение одной категории
      .addCase(fetchCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Создание категории
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Обновление категории
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        if (state.currentCategory && state.currentCategory.id === action.payload.id) {
          state.currentCategory = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Удаление категории
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(cat => cat.id !== action.payload.id);
        if (state.currentCategory && state.currentCategory.id === action.payload.id) {
          state.currentCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Восстановление категории
      .addCase(restoreCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(restoreCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { 
  clearError, 
  clearCurrentCategory, 
  setFilters, 
  clearFilters, 
  setPagination 
} = categoriesSlice.actions;
export default categoriesSlice.reducer;
