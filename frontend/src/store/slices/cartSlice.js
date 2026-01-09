import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api';
import { logger } from '../../utils/logger';
import { validateCartResponse } from '../../utils/validators';

/**
 * Cart Slice для управления корзиной покупок
 *
 * Этот slice обеспечивает централизованное управление состоянием корзины,
 * предотвращает повторные загрузки при переходах между страницами
 * и использует оптимистичные обновления для улучшения UX
 *
 * Поддерживает работу для гостей через localStorage с автоматической
 * синхронизацией после входа в систему
 */

// LocalStorage keys
const CART_STORAGE_KEY = 'guest_cart';

// Helper functions for localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);

      // Validate the structure of loaded data
      if (!parsedCart || typeof parsedCart !== 'object') {
        logger.warn('Invalid cart data structure in localStorage');
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], totalItems: 0, totalPrice: 0 };
      }

      // Ensure items is an array
      if (!Array.isArray(parsedCart.items)) {
        logger.warn('Cart items is not an array in localStorage');
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], totalItems: 0, totalPrice: 0 };
      }

      // Validate each cart item using existing validator
      try {
        const validatedCart = validateCartResponse(parsedCart);
        return validatedCart;
      } catch (validationError) {
        logger.warn('Cart validation failed for localStorage data:', validationError);
        localStorage.removeItem(CART_STORAGE_KEY);
        return { items: [], totalItems: 0, totalPrice: 0 };
      }
    }
  } catch (error) {
    logger.error('Error loading cart from localStorage:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      logger.error('Error clearing corrupted cart data:', e);
    }
  }
  return { items: [], totalItems: 0, totalPrice: 0 };
};

const saveCartToStorage = (items) => {
  try {
    const cart = {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + (item.price_at_addition || 0) * item.quantity, 0),
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    logger.error('Error saving cart to localStorage:', error);
  }
};

const clearCartFromStorage = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    logger.error('Error clearing cart from localStorage:', error);
  }
};

// Initial state with guest cart from localStorage
const guestCart = loadCartFromStorage();
const initialState = {
  items: guestCart.items,
  totalItems: guestCart.totalItems,
  totalPrice: guestCart.totalPrice,
  isLoading: false,
  error: null,
  // Отслеживание товаров в процессе обновления (массив ID вместо Set для сериализации)
  updatingItems: [],
  // Флаг успешной загрузки (для предотвращения повторных запросов)
  isLoaded: false,
  // Флаг отсутствия авторизации для отображения соответствующего UX
  isUnauthorized: false,
  // Флаг гостевого режима (работа с localStorage)
  isGuest: guestCart.items.length > 0,
  // Флаг синхронизации гостевой корзины
  isSyncing: false,
};

// Async thunks

/**
 * Загрузка корзины с сервера
 * Используется один раз при загрузке приложения
 */
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const data = await cartAPI.getCart();
      // Validate response data
      const validatedData = validateCartResponse(data);
      return validatedData;
    } catch (error) {
      const status = error?.status;
      if (status === 401) {
        return rejectWithValue({ type: 'unauthorized' });
      }
      return rejectWithValue({
        message: error?.message || 'Не удалось загрузить корзину',
        status,
      });
    }
  }
);

/**
 * Добавление товара в корзину
 * Поддерживает работу для гостей через localStorage
 * @param {Object} payload - { productId: number, quantity: number, productData: object }
 */
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1, productData }, { getState, rejectWithValue }) => {
    const state = getState();
    const isGuest = state.cart.isUnauthorized || state.cart.isGuest;

    if (isGuest) {
      // Guest user - use localStorage
      const currentItems = state.cart.items;
      const existingItemIndex = currentItems.findIndex(
        item => item.product?.id === productId
      );

      let updatedItems;
      if (existingItemIndex !== -1) {
        // Update existing item
        updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
      } else {
        // Add new item
        const newItem = {
          product: productData || { id: productId },
          quantity,
          price_at_addition: productData?.price || 0,
        };
        updatedItems = [...currentItems, newItem];
      }

      saveCartToStorage(updatedItems);
      return { items: updatedItems, isGuest: true };
    }

    try {
      const data = await cartAPI.addItem(productId, quantity);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось добавить товар в корзину');
    }
  }
);

/**
 * Обновление количества товара в корзине
 * Поддерживает работу для гостей через localStorage
 * @param {Object} payload - { productId: number, quantity: number }
 */
export const updateQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { getState, rejectWithValue }) => {
    const state = getState();
    const isGuest = state.cart.isUnauthorized || state.cart.isGuest;

    if (isGuest) {
      // Guest user - use localStorage
      const currentItems = state.cart.items;
      const itemIndex = currentItems.findIndex(item => item.product?.id === productId);

      if (itemIndex === -1) {
        return rejectWithValue({
          message: 'Товар не найден в корзине',
          productId,
        });
      }

      const updatedItems = [...currentItems];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity,
      };

      saveCartToStorage(updatedItems);
      return { productId, quantity, data: updatedItems[itemIndex], isGuest: true };
    }

    try {
      const data = await cartAPI.updateItem(productId, quantity);
      return { productId, quantity, data };
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Не удалось обновить количество товара',
        productId,
      });
    }
  }
);

/**
 * Удаление товара из корзины
 * Поддерживает работу для гостей через localStorage
 * @param {number} productId - ID товара
 */
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { getState, rejectWithValue }) => {
    const state = getState();
    const isGuest = state.cart.isUnauthorized || state.cart.isGuest;

    if (isGuest) {
      // Guest user - use localStorage
      const currentItems = state.cart.items;
      const updatedItems = currentItems.filter(item => item.product?.id !== productId);

      saveCartToStorage(updatedItems);
      return { productId, isGuest: true };
    }

    try {
      await cartAPI.removeItem(productId);
      return productId;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Не удалось удалить товар из корзины',
        productId,
      });
    }
  }
);

/**
 * Очистка корзины
 * Поддерживает работу для гостей через localStorage
 */
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const isGuest = state.cart.isUnauthorized || state.cart.isGuest;

    if (isGuest) {
      // Guest user - clear localStorage
      clearCartFromStorage();
      return { isGuest: true };
    }

    try {
      await cartAPI.clearCart();
      return null;
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Не удалось очистить корзину';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Синхронизация гостевой корзины с сервером после входа
 * Вызывается автоматически после успешной авторизации
 */
export const syncGuestCart = createAsyncThunk(
  'cart/syncGuestCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const guestItems = state.cart.items;

      if (guestItems.length === 0) {
        return { items: [] };
      }

      // Send guest cart items to backend for merging
      // We need to add each item individually to merge with existing server cart
      const promises = guestItems.map(item =>
        cartAPI.addItem(item.product.id, item.quantity)
      );

      await Promise.all(promises);

      // Clear localStorage after successful sync
      clearCartFromStorage();

      // Fetch updated cart from server
      const data = await cartAPI.getCart();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось синхронизировать корзину');
    }
  }
);

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Добавление товара в список обновляющихся
    addUpdatingItem: (state, action) => {
      if (!state.updatingItems.includes(action.payload)) {
        state.updatingItems.push(action.payload);
      }
    },
    // Удаление товара из списка обновляющихся
    removeUpdatingItem: (state, action) => {
      state.updatingItems = state.updatingItems.filter(id => id !== action.payload);
    },
    // Очистка ошибки
    clearError: (state) => {
      state.error = null;
    },
    // Сброс корзины (при logout)
    resetCart: (state) => {
      // CRITICAL: Clear localStorage FIRST before clearing state
      // This prevents race conditions where state changes trigger saves to localStorage
      clearCartFromStorage();

      // Then clear all state
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.isLoading = false;
      state.error = null;
      state.updatingItems = [];
      state.isLoaded = false;
      state.isUnauthorized = false;
      state.isGuest = false;
      state.isSyncing = false;
    },
    // Переключение в гостевой режим (при logout)
    setGuestMode: (state) => {
      state.isGuest = true;
      state.isUnauthorized = true;
      // Load guest cart from storage if exists
      const guestCart = loadCartFromStorage();
      state.items = guestCart.items;
      state.totalItems = guestCart.totalItems;
      state.totalPrice = guestCart.totalPrice;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isUnauthorized = false;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.isLoaded = true;
        state.isUnauthorized = false;
        state.isGuest = false; // User is authenticated
        // Вычисляем общую информацию
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + item.price_at_addition * item.quantity,
          0
        );
        // Clear guest cart from storage after successful fetch
        clearCartFromStorage();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.type === 'unauthorized') {
          // Load guest cart from localStorage for unauthorized users
          const guestCart = loadCartFromStorage();
          state.items = guestCart.items;
          state.totalItems = guestCart.totalItems;
          state.totalPrice = guestCart.totalPrice;
          state.isLoaded = true;
          state.error = null;
          state.isUnauthorized = true;
          state.isGuest = true;
          return;
        }
        state.error = action.payload?.message || action.error?.message || 'Не удалось загрузить корзину';
        state.isLoaded = false;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        if (action.payload.isGuest) {
          // Guest user update
          state.items = action.payload.items;
          state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.totalPrice = state.items.reduce(
            (sum, item) => sum + (item.price_at_addition || 0) * item.quantity,
            0
          );
          state.isGuest = true;
        } else {
          // API возвращает один добавленный/обновленный товар (CartItemResponse)
          const addedItem = action.payload;

          // Проверяем, есть ли товар уже в корзине
          const existingItemIndex = state.items.findIndex(
            item => item.product.id === addedItem.product.id
          );

          if (existingItemIndex !== -1) {
            // Обновляем существующий товар
            state.items[existingItemIndex] = addedItem;
          } else {
            // Добавляем новый товар
            state.items.push(addedItem);
          }

          // Пересчитываем итоги
          state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.totalPrice = state.items.reduce(
            (sum, item) => sum + item.price_at_addition * item.quantity,
            0
          );
          state.isGuest = false;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update quantity
    builder
      .addCase(updateQuantity.pending, (state, action) => {
        const { productId } = action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;
      })
      .addCase(updateQuantity.fulfilled, (state, action) => {
        const { productId, data } = action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);

        // API возвращает обновленный товар (CartItemResponse)
        // Обновляем товар в массиве данными с сервера
        const itemIndex = state.items.findIndex(item => item.product.id === productId);
        if (itemIndex !== -1) {
          state.items[itemIndex] = data;
        }

        // Пересчитываем итоги
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + (item.price_at_addition || 0) * item.quantity,
          0
        );
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        const { productId } = action.payload || {};
        if (productId) {
          state.updatingItems = state.updatingItems.filter(id => id !== productId);
        }
        state.error = action.payload?.message || 'Ошибка обновления количества';

        // При ошибке в гостевом режиме не перезагружаем
        if (!state.isGuest) {
          state.isLoaded = false;
        }
      });

    // Remove from cart
    builder
      .addCase(removeFromCart.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const productId = action.payload.productId || action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);

        // Удаляем товар из корзины
        state.items = state.items.filter((item) => item.product.id !== productId);
        // Пересчитываем итоги
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + (item.price_at_addition || 0) * item.quantity,
          0
        );
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        const { productId } = action.payload || {};
        if (productId) {
          state.updatingItems = state.updatingItems.filter(id => id !== productId);
        }
        state.error = action.payload?.message || 'Ошибка удаления товара';

        // При ошибке в гостевом режиме не перезагружаем
        if (!state.isGuest) {
          state.isLoaded = false;
        }
      });

    // Clear cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.error = null;
        state.isLoading = true;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        // Очищаем корзину после успешного ответа от сервера
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
        state.isLoading = false;

        // Clear localStorage for guest users
        if (action.payload?.isGuest) {
          clearCartFromStorage();
        }
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
        // Корзина остается без изменений при ошибке
      });

    // Sync guest cart
    builder
      .addCase(syncGuestCart.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncGuestCart.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.isGuest = false;
        state.isUnauthorized = false;

        // Update with merged cart from server
        state.items = action.payload.items || [];
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + item.price_at_addition * item.quantity,
          0
        );

        // Clear localStorage after successful sync
        clearCartFromStorage();
      })
      .addCase(syncGuestCart.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.payload || 'Не удалось синхронизировать корзину';
        // Keep guest data on error
      });
  },
});

// Actions
export const {
  addUpdatingItem,
  removeUpdatingItem,
  clearError,
  resetCart,
  setGuestMode,
} = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotalItems = (state) => state.cart.totalItems;
export const selectCartTotalPrice = (state) => state.cart.totalPrice;
export const selectCartIsLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;
export const selectCartIsLoaded = (state) => state.cart.isLoaded;
export const selectUpdatingItems = (state) => state.cart.updatingItems;
export const selectCartIsUnauthorized = (state) => state.cart.isUnauthorized;
export const selectCartIsGuest = (state) => state.cart.isGuest;
export const selectCartIsSyncing = (state) => state.cart.isSyncing;

// Reducer
export default cartSlice.reducer;
