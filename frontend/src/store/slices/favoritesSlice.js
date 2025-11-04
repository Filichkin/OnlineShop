import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoritesAPI } from '../../api';

/**
 * Favorites Slice для управления избранными товарами
 *
 * Этот slice обеспечивает централизованное управление состоянием избранного,
 * предотвращает повторные загрузки при переходах между страницами
 * и использует оптимистичные обновления для улучшения UX
 */

// Initial state
const initialState = {
  // Полный список избранных товаров (массив объектов товаров)
  items: [],
  // Массив ID избранных товаров для быстрой проверки
  favoriteIds: [],
  // Количество избранных товаров
  totalItems: 0,
  isLoading: false,
  error: null,
  // Отслеживание товаров в процессе обновления (массив ID)
  updatingItems: [],
  // Флаг успешной загрузки (для предотвращения повторных запросов)
  isLoaded: false,
};

// Async thunks

/**
 * Загрузка списка избранных товаров с сервера
 * Используется один раз при загрузке приложения или страницы избранного
 */
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const data = await favoritesAPI.getFavorites();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось загрузить избранное');
    }
  }
);

/**
 * Добавление товара в избранное
 * @param {number} productId - ID товара
 */
export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (productId, { rejectWithValue }) => {
    try {
      const data = await favoritesAPI.addToFavorites(productId);
      return data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Не удалось добавить товар в избранное',
        productId,
      });
    }
  }
);

/**
 * Удаление товара из избранного
 * @param {number} productId - ID товара
 */
export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (productId, { rejectWithValue }) => {
    try {
      await favoritesAPI.removeFromFavorites(productId);
      return productId;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Не удалось удалить товар из избранного',
        productId,
      });
    }
  }
);

/**
 * Переключение состояния избранного (добавить или удалить)
 * @param {number} productId - ID товара
 */
export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (productId, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();

      // Предотвращаем множественные запросы для одного товара
      if (state.favorites.updatingItems.includes(productId)) {
        return rejectWithValue({
          message: 'Операция уже выполняется',
          productId,
        });
      }

      const isFavorite = state.favorites.favoriteIds.includes(productId);

      if (isFavorite) {
        await dispatch(removeFromFavorites(productId)).unwrap();
        return { productId, action: 'removed' };
      } else {
        await dispatch(addToFavorites(productId)).unwrap();
        return { productId, action: 'added' };
      }
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Не удалось переключить избранное',
        productId,
      });
    }
  }
);

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    // Сброс состояния загрузки
    resetLoaded: (state) => {
      state.isLoaded = false;
    },
    // Сброс избранного (при logout)
    resetFavorites: (state) => {
      state.items = [];
      state.favoriteIds = [];
      state.totalItems = 0;
      state.isLoading = false;
      state.error = null;
      state.updatingItems = [];
      state.isLoaded = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        // API возвращает объект {items: [], total_items: N, ...}
        const items = action.payload?.items || [];
        // Извлекаем product из каждого item
        state.items = items.map(item => item.product);
        state.favoriteIds = state.items.map(product => product.id);
        state.totalItems = action.payload?.total_items || state.items.length;
        state.isLoaded = true;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isLoaded = false;
      });

    // Add to favorites
    builder
      .addCase(addToFavorites.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const productId = action.meta.arg;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);

        // API возвращает {message, product_id, item: {product: {...}}}
        const product = action.payload?.item?.product;
        if (product && !state.favoriteIds.includes(product.id)) {
          state.items.push(product);
          state.favoriteIds.push(product.id);
          state.totalItems = state.items.length;
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        const { productId } = action.payload || {};
        if (productId) {
          state.updatingItems = state.updatingItems.filter(id => id !== productId);
        }
        // Не показываем ошибку для 409 Conflict (товар уже в избранном)
        if (action.error?.message !== 'Товар уже в избранном') {
          state.error = action.payload?.message || action.error?.message;
        }
      });

    // Remove from favorites
    builder
      .addCase(removeFromFavorites.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;

        // Сохраняем удаляемый товар для возможного отката
        const removedItem = state.items.find(item => item.id === productId);
        if (removedItem) {
          // Сохраняем удаленный товар в meta для rollback
          action.meta.removedItem = { ...removedItem };
        }

        // Оптимистичное удаление из UI
        state.items = state.items.filter(item => item.id !== productId);
        state.favoriteIds = state.favoriteIds.filter(id => id !== productId);
        state.totalItems = state.items.length;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const productId = action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);
        // Товар уже удален в pending, ничего делать не нужно
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        const { productId } = action.payload || {};
        if (productId) {
          state.updatingItems = state.updatingItems.filter(id => id !== productId);
        }
        state.error = action.payload?.message || 'Ошибка удаления из избранного';

        // Откатываем удаление используя сохраненный товар
        const removedItem = action.meta?.removedItem;
        if (removedItem) {
          // Восстанавливаем товар в избранном
          state.items.push(removedItem);
          state.favoriteIds.push(removedItem.id);
          state.totalItems = state.items.length;
        }
      });

    // Toggle favorite (doesn't need specific handlers as it uses add/remove)
    builder
      .addCase(toggleFavorite.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.error = action.payload?.message;
      });
  },
});

// Actions
export const { clearError, resetLoaded, resetFavorites } = favoritesSlice.actions;

// Selectors
export const selectFavorites = (state) => state.favorites;
export const selectFavoriteItems = (state) => state.favorites.items;
export const selectFavoriteIds = (state) => state.favorites.favoriteIds;
export const selectFavoritesTotalItems = (state) => state.favorites.totalItems;
export const selectFavoritesIsLoading = (state) => state.favorites.isLoading;
export const selectFavoritesError = (state) => state.favorites.error;
export const selectFavoritesIsLoaded = (state) => state.favorites.isLoaded;
export const selectFavoritesUpdatingItems = (state) => state.favorites.updatingItems;

// Helper selectors
export const selectIsFavorite = (productId) => (state) =>
  state.favorites.favoriteIds.includes(productId);

export const selectIsUpdatingFavorite = (productId) => (state) =>
  state.favorites.updatingItems.includes(productId);

// Reducer
export default favoritesSlice.reducer;
