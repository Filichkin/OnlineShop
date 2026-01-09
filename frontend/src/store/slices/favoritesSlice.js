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
      const parsed = JSON.parse(savedFavorites);
      logger.info('loadFavoritesFromStorage: Found', parsed?.items?.length || 0, 'items');
      return parsed;
    }
  } catch (error) {
    logger.error('Error loading favorites from localStorage:', error);
  }
  return { items: [], favoriteIds: [], totalItems: 0 };
};

const saveFavoritesToStorage = (items) => {
  try {
    logger.info('Saving favorites to localStorage, items count:', items?.length || 0);
    
    if (!items || !Array.isArray(items)) {
      logger.warn('saveFavoritesToStorage: items is not an array');
      return;
    }
    
    // Save only minimal data needed for sync and display
    // Avoid saving nested objects like brand to prevent circular reference issues
    const minimalItems = items.map(item => ({
      id: item?.id,
      name: item?.name || '',
      price: item?.price || 0,
      main_image: item?.main_image || '',
      slug: item?.slug || '',
    }));
    
    const favorites = {
      items: minimalItems,
      favoriteIds: minimalItems.map(item => item.id).filter(Boolean),
      totalItems: minimalItems.length,
    };
    
    const favoritesJson = JSON.stringify(favorites);
    localStorage.setItem(FAVORITES_STORAGE_KEY, favoritesJson);
    logger.info('Favorites saved to localStorage successfully, data:', favoritesJson.substring(0, 200));
  } catch (error) {
    logger.error('Error saving favorites to localStorage:', error?.message || error);
  }
};

const clearFavoritesFromStorage = () => {
  try {
    logger.info('Clearing favorites from localStorage...');
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      logger.info('Favorites localStorage cleared successfully');
    }
  } catch (error) {
    // Log detailed error info
    logger.error('Error clearing favorites from localStorage:', error?.message || JSON.stringify(error) || error);
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
      // Use JSON.parse/stringify to break Proxy references from Redux/Immer
      const currentItems = JSON.parse(JSON.stringify(state.favorites.items || []));
      const existingItem = currentItems.find(item => item.id === productId);

      if (existingItem) {
        // Item already in favorites
        return { productId, isGuest: true, alreadyExists: true };
      }

      // Add new item - create clean object without Proxy
      const cleanProductData = productData ? {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        main_image: productData.main_image,
        slug: productData.slug,
      } : { id: productId };
      
      const updatedItems = [...currentItems, cleanProductData];

      saveFavoritesToStorage(updatedItems);
      return {
        productId,
        item: { product: cleanProductData },
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
      // Use JSON.parse/stringify to break Proxy references from Redux/Immer
      const currentItems = JSON.parse(JSON.stringify(state.favorites.items || []));
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
  async (_, { rejectWithValue }) => {
    try {
      // Read raw data from localStorage first to debug
      const rawFavoritesData = localStorage.getItem(FAVORITES_STORAGE_KEY);
      logger.info('syncGuestFavorites: Raw localStorage data:', rawFavoritesData);
      
      if (!rawFavoritesData) {
        logger.info('syncGuestFavorites: No data in localStorage, fetching server favorites');
        const data = await favoritesAPI.getFavorites();
        return data;
      }
      
      // Parse raw data without validation to see what's there
      let parsedFavorites;
      try {
        parsedFavorites = JSON.parse(rawFavoritesData);
        logger.info('syncGuestFavorites: Parsed favorites:', JSON.stringify(parsedFavorites));
        logger.info('syncGuestFavorites: Items in parsed favorites:', parsedFavorites?.items?.length || 0);
      } catch (parseError) {
        logger.error('syncGuestFavorites: Failed to parse localStorage:', parseError);
        const data = await favoritesAPI.getFavorites();
        return data;
      }
      
      // Get items directly from parsed data (skip validation for sync)
      const guestItems = parsedFavorites?.items || [];
      
      if (guestItems.length === 0) {
        logger.info('syncGuestFavorites: No items to sync, fetching server favorites');
        const data = await favoritesAPI.getFavorites();
        return data;
      }

      // Send guest favorite items to backend for merging
      logger.info('syncGuestFavorites: Sending', guestItems.length, 'items to server for merge...');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const item of guestItems) {
        const productId = item.id;
        logger.info('syncGuestFavorites: Adding item - productId:', productId);
        
        if (productId) {
          try {
            await favoritesAPI.addToFavorites(productId);
            logger.info('syncGuestFavorites: Item added successfully');
            successCount++;
          } catch (itemError) {
            // 409 Conflict means item already in favorites - count as success
            if (itemError?.status === 409 || itemError?.isConflict) {
              logger.info('syncGuestFavorites: Item already in favorites (conflict)');
              successCount++;
            } else {
              logger.error('syncGuestFavorites: Failed to add item:', itemError?.message || itemError);
              failCount++;
            }
          }
        } else {
          logger.warn('syncGuestFavorites: Invalid item data - productId:', productId);
          failCount++;
        }
      }
      
      logger.info('syncGuestFavorites: Processed', successCount, 'success,', failCount, 'failed');

      // Only clear localStorage if at least some items were synced successfully
      if (successCount > 0) {
        clearFavoritesFromStorage();
        logger.info('syncGuestFavorites: localStorage cleared after successful sync');
      } else if (failCount > 0) {
        logger.warn('syncGuestFavorites: NOT clearing localStorage - all items failed to sync');
      }

      // Fetch updated favorites from server
      logger.info('syncGuestFavorites: Fetching merged favorites from server...');
      const data = await favoritesAPI.getFavorites();
      logger.info('syncGuestFavorites: Sync completed, total items:', data.items?.length || 0);
      return data;
    } catch (error) {
      logger.error('syncGuestFavorites: Error during sync:', error);
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
        // NOTE: Don't clear localStorage here - let syncGuestFavorites handle it
        // This prevents race conditions where fetch runs before sync and loses guest data
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
        logger.info('syncGuestFavorites.fulfilled: payload received:', JSON.stringify(action.payload).substring(0, 500));
        logger.info('syncGuestFavorites.fulfilled: items count:', action.payload?.items?.length || 0);
        
        state.isSyncing = false;
        state.isGuest = false;
        state.isUnauthorized = false;
        state.isLoaded = true; // Mark as loaded to prevent duplicate fetches

        // Update with merged favorites from server
        const items = action.payload?.items || [];
        state.items = items.map(item => item.product);
        state.favoriteIds = state.items.map(product => product?.id).filter(Boolean);
        state.totalItems = action.payload?.total_items || state.items.length;
        
        logger.info('syncGuestFavorites.fulfilled: state updated, items:', state.items.length);
        // NOTE: localStorage is cleared in the thunk, not here
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
