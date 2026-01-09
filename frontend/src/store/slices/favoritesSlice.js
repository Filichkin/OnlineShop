import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoritesAPI } from '../../api';
import { logger } from '../../utils/logger';
import { validateFavoritesResponse } from '../../utils/validators';

/**
 * Favorites Slice для управления избранными товарами
 *
 * Этот slice обеспечивает централизованное управление состоянием избранного,
 * предотвращает повторные загрузки при переходах между страницами
 * и использует оптимистичные обновления для улучшения UX
 *
 * Поддерживает работу для гостей через localStorage с автоматической
 * синхронизацией после входа в систему
 */

// LocalStorage keys
const FAVORITES_STORAGE_KEY = 'guest_favorites';

// Helper functions for localStorage
const loadFavoritesFromStorage = () => {
  try {
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (savedFavorites) {
      return JSON.parse(savedFavorites);
    }
  } catch (error) {
    logger.error('Error loading favorites from localStorage:', error);
  }
  return { items: [], favoriteIds: [], totalItems: 0 };
};

const saveFavoritesToStorage = (items) => {
  try {
    logger.info('Saving favorites to localStorage, items count:', items.length);
    const favorites = {
      items,
      favoriteIds: items.map(item => item.id),
      totalItems: items.length,
    };
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    logger.info('Favorites saved to localStorage successfully');
  } catch (error) {
    logger.error('Error saving favorites to localStorage:', error);
  }
};

const clearFavoritesFromStorage = () => {
  try {
    logger.info('Clearing favorites from localStorage...');
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    logger.info('Favorites localStorage cleared successfully');
  } catch (error) {
    logger.error('Error clearing favorites from localStorage:', error);
  }
};

// Initial state with guest favorites from localStorage
const guestFavorites = loadFavoritesFromStorage();
const initialState = {
  // Полный список избранных товаров (массив объектов товаров)
  items: guestFavorites.items,
  // Массив ID избранных товаров для быстрой проверки
  favoriteIds: guestFavorites.favoriteIds,
  // Количество избранных товаров
  totalItems: guestFavorites.totalItems,
  isLoading: false,
  error: null,
  // Отслеживание товаров в процессе обновления (массив ID)
  updatingItems: [],
  // Флаг успешной загрузки (для предотвращения повторных запросов)
  isLoaded: false,
  // Флаг отсутствия авторизации
  isUnauthorized: false,
  // Флаг гостевого режима (работа с localStorage)
  isGuest: guestFavorites.items.length > 0,
  // Флаг синхронизации гостевого избранного
  isSyncing: false,
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
      // Validate response data
      const validatedData = validateFavoritesResponse(data);
      return validatedData;
    } catch (error) {
      const status = error?.status;
      if (status === 401) {
        return rejectWithValue({ type: 'unauthorized' });
      }
      return rejectWithValue({
        message: error?.message || 'Не удалось загрузить избранное',
        status,
      });
    }
  }
);

/**
 * Добавление товара в избранное
 * Поддерживает работу для гостей через localStorage
 * @param {number|object} payload - productId or { productId, productData }
 */
export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (payload, { getState, rejectWithValue }) => {
    const productId = typeof payload === 'object' ? payload.productId : payload;
    const productData = typeof payload === 'object' ? payload.productData : null;

    const state = getState();
    const isGuest = state.favorites.isUnauthorized || state.favorites.isGuest;

    if (isGuest) {
      // Guest user - use localStorage
      const currentItems = state.favorites.items;
      const existingItem = currentItems.find(item => item.id === productId);

      if (existingItem) {
        // Item already in favorites
        return { productId, isGuest: true, alreadyExists: true };
      }

      // Add new item
      const newItem = productData || { id: productId };
      const updatedItems = [...currentItems, newItem];

      saveFavoritesToStorage(updatedItems);
      return {
        productId,
        item: { product: newItem },
        isGuest: true,
        alreadyExists: false,
      };
    }

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
 * Поддерживает работу для гостей через localStorage
 * @param {number} productId - ID товара
 */
export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (productId, { getState, rejectWithValue }) => {
    const state = getState();
    const isGuest = state.favorites.isUnauthorized || state.favorites.isGuest;

    if (isGuest) {
      // Guest user - use localStorage
      const currentItems = state.favorites.items;
      const updatedItems = currentItems.filter(item => item.id !== productId);

      saveFavoritesToStorage(updatedItems);
      return { productId, isGuest: true };
    }

    try {
      await favoritesAPI.removeFromFavorites(productId);
      // Возвращаем объект с productId для консистентности с гостевым режимом
      return { productId, isGuest: false };
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
 * Поддерживает работу для гостей через localStorage
 * @param {number|object} payload - productId or { productId, productData }
 */
export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (payload, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const productId = typeof payload === 'object' ? payload.productId : payload;
      const productData = typeof payload === 'object' ? payload.productData : null;

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
        const addPayload = productData ? { productId, productData } : productId;
        await dispatch(addToFavorites(addPayload)).unwrap();
        return { productId, action: 'added' };
      }
    } catch (error) {
      const productId = typeof payload === 'object' ? payload.productId : payload;
      return rejectWithValue({
        message: error.message || 'Не удалось переключить избранное',
        productId,
      });
    }
  }
);

/**
 * Синхронизация гостевого избранного с сервером после входа
 * Вызывается автоматически после успешной авторизации
 */
export const syncGuestFavorites = createAsyncThunk(
  'favorites/syncGuestFavorites',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const guestItems = state.favorites.items;

      if (guestItems.length === 0) {
        return { items: [], total_items: 0 };
      }

      // Send guest favorite items to backend for merging
      // We need to add each item individually to merge with existing server favorites
      const promises = guestItems.map(item =>
        favoritesAPI.addToFavorites(item.id)
      );

      await Promise.all(promises);

      // Clear localStorage after successful sync
      clearFavoritesFromStorage();

      // Fetch updated favorites from server
      const data = await favoritesAPI.getFavorites();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось синхронизировать избранное');
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
      // CRITICAL: Clear localStorage FIRST before clearing state
      // This prevents race conditions where state changes trigger saves to localStorage
      clearFavoritesFromStorage();

      // Then clear all state
      state.items = [];
      state.favoriteIds = [];
      state.totalItems = 0;
      state.isLoading = false;
      state.error = null;
      state.updatingItems = [];
      state.isLoaded = true; // Mark as loaded to prevent fetchFavorites from being called
      state.isUnauthorized = true; // User is now unauthorized (logged out)
      state.isGuest = true; // User is now in guest mode
      state.isSyncing = false;
    },
    // Переключение в гостевой режим (при logout)
    setGuestMode: (state) => {
      state.isGuest = true;
      state.isUnauthorized = true;
      // Load guest favorites from storage if exists
      const guestFavorites = loadFavoritesFromStorage();
      state.items = guestFavorites.items;
      state.favoriteIds = guestFavorites.favoriteIds;
      state.totalItems = guestFavorites.totalItems;
    },
  },
  extraReducers: (builder) => {
    // Fetch favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isUnauthorized = false;
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
        state.isUnauthorized = false;
        state.isGuest = false; // User is authenticated
        // Clear guest favorites from storage after successful fetch
        clearFavoritesFromStorage();
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.type === 'unauthorized') {
          // Load guest favorites from localStorage for unauthorized users
          const guestFavorites = loadFavoritesFromStorage();
          state.items = guestFavorites.items;
          state.favoriteIds = guestFavorites.favoriteIds;
          state.totalItems = guestFavorites.totalItems;
          state.isLoaded = true;
          state.isUnauthorized = true;
          state.isGuest = true;
          state.error = null;
          return;
        }
        state.error = action.payload?.message || action.error?.message || 'Не удалось загрузить избранное';
        state.isLoaded = false;
      });

    // Add to favorites
    builder
      .addCase(addToFavorites.pending, (state, action) => {
        const productId = typeof action.meta.arg === 'object' ? action.meta.arg.productId : action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const productId = typeof action.meta.arg === 'object' ? action.meta.arg.productId : action.meta.arg;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);

        if (action.payload.isGuest) {
          // Guest user update
          if (!action.payload.alreadyExists) {
            const product = action.payload.item.product;
            if (!state.favoriteIds.includes(product.id)) {
              state.items.push(product);
              state.favoriteIds.push(product.id);
              state.totalItems = state.items.length;
            }
          }
          state.isGuest = true;
        } else {
          // API возвращает {message, product_id, item: {product: {...}}}
          const product = action.payload?.item?.product;
          if (product && !state.favoriteIds.includes(product.id)) {
            state.items.push(product);
            state.favoriteIds.push(product.id);
            state.totalItems = state.items.length;
          }
          state.isGuest = false;
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
        // Используем productId из payload объекта (теперь всегда возвращается объект)
        // или из meta.arg как fallback для надежности
        const productId = action.payload?.productId ?? action.meta.arg;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);
        // Товар уже удален в pending, ничего делать не нужно
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        // Получаем productId из payload или из meta.arg как fallback
        const productId = action.payload?.productId ?? action.meta.arg;
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

    // Sync guest favorites
    builder
      .addCase(syncGuestFavorites.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncGuestFavorites.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.isGuest = false;
        state.isUnauthorized = false;

        // Update with merged favorites from server
        const items = action.payload?.items || [];
        state.items = items.map(item => item.product);
        state.favoriteIds = state.items.map(product => product.id);
        state.totalItems = action.payload?.total_items || state.items.length;

        // Clear localStorage after successful sync
        clearFavoritesFromStorage();
      })
      .addCase(syncGuestFavorites.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload || 'Не удалось синхронизировать избранное';
        // Keep guest data on error
      });
  },
});

// Actions
export const { clearError, resetLoaded, resetFavorites, setGuestMode } = favoritesSlice.actions;

// Selectors
export const selectFavorites = (state) => state.favorites;
export const selectFavoriteItems = (state) => state.favorites.items;
export const selectFavoriteIds = (state) => state.favorites.favoriteIds;
export const selectFavoritesTotalItems = (state) => state.favorites.totalItems;
export const selectFavoritesIsLoading = (state) => state.favorites.isLoading;
export const selectFavoritesError = (state) => state.favorites.error;
export const selectFavoritesIsLoaded = (state) => state.favorites.isLoaded;
export const selectFavoritesUpdatingItems = (state) => state.favorites.updatingItems;
export const selectFavoritesIsUnauthorized = (state) => state.favorites.isUnauthorized;
export const selectFavoritesIsGuest = (state) => state.favorites.isGuest;
export const selectFavoritesIsSyncing = (state) => state.favorites.isSyncing;

// Helper selectors
export const selectIsFavorite = (productId) => (state) =>
  state.favorites.favoriteIds.includes(productId);

export const selectIsUpdatingFavorite = (productId) => (state) =>
  state.favorites.updatingItems.includes(productId);

// Reducer
export default favoritesSlice.reducer;
