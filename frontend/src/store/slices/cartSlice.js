import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../api';

/**
 * Cart Slice для управления корзиной покупок
 *
 * Этот slice обеспечивает централизованное управление состоянием корзины,
 * предотвращает повторные загрузки при переходах между страницами
 * и использует оптимистичные обновления для улучшения UX
 */

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
  // Отслеживание товаров в процессе обновления (массив ID вместо Set для сериализации)
  updatingItems: [],
  // Флаг успешной загрузки (для предотвращения повторных запросов)
  isLoaded: false,
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
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось загрузить корзину');
    }
  }
);

/**
 * Добавление товара в корзину
 * @param {Object} payload - { productId: number, quantity: number }
 */
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
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
 * @param {Object} payload - { productId: number, quantity: number }
 */
export const updateQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
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
 * @param {number} productId - ID товара
 */
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
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
 */
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartAPI.clearCart();
      return null;
    } catch (error) {
      return rejectWithValue(error.message || 'Не удалось очистить корзину');
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
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.isLoaded = true;
        // Вычисляем общую информацию
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + item.price_at_addition * item.quantity,
          0
        );
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isLoaded = false;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
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
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Update quantity
    builder
      .addCase(updateQuantity.pending, (state, action) => {
        const { productId, quantity } = action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;

        // Оптимистичное обновление UI
        const item = state.items.find((item) => item.product.id === productId);
        if (item) {
          item.quantity = quantity;
          // Пересчитываем итоги
          state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.totalPrice = state.items.reduce(
            (sum, item) => sum + item.price_at_addition * item.quantity,
            0
          );
        }
      })
      .addCase(updateQuantity.fulfilled, (state, action) => {
        const { productId, data } = action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);

        // API возвращает обновленный товар (CartItemResponse)
        // Обновляем товар в массиве данными с сервера (подтверждение)
        const itemIndex = state.items.findIndex(item => item.product.id === productId);
        if (itemIndex !== -1) {
          state.items[itemIndex] = data;
        }

        // Пересчитываем итоги
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + item.price_at_addition * item.quantity,
          0
        );
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        const { productId } = action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);
        state.error = action.payload.message;

        // Откатываем оптимистичное обновление
        // В идеале нужно хранить previousQuantity, но для упрощения перезагрузим корзину
        // Или можно реализовать полноценный rollback через мета-данные
      });

    // Remove from cart
    builder
      .addCase(removeFromCart.pending, (state, action) => {
        const productId = action.meta.arg;
        if (!state.updatingItems.includes(productId)) {
          state.updatingItems.push(productId);
        }
        state.error = null;

        // Оптимистичное удаление из UI
        state.items = state.items.filter((item) => item.product.id !== productId);
        // Пересчитываем итоги
        state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.totalPrice = state.items.reduce(
          (sum, item) => sum + item.price_at_addition * item.quantity,
          0
        );
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const productId = action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);
        // Товар уже удален в pending, ничего делать не нужно
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        const { productId } = action.payload;
        state.updatingItems = state.updatingItems.filter(id => id !== productId);
        state.error = action.payload.message;

        // Откатываем удаление - нужно перезагрузить корзину
        // Для полноценного rollback можно сохранить removedItem в мета-данных
      });

    // Clear cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.error = null;
        // Оптимистичная очистка
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
      })
      .addCase(clearCart.fulfilled, (state) => {
        // Корзина уже очищена в pending
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
        // Откатываем очистку - нужно перезагрузить корзину
      });
  },
});

// Actions
export const { addUpdatingItem, removeUpdatingItem, clearError } = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotalItems = (state) => state.cart.totalItems;
export const selectCartTotalPrice = (state) => state.cart.totalPrice;
export const selectCartIsLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;
export const selectCartIsLoaded = (state) => state.cart.isLoaded;
export const selectUpdatingItems = (state) => state.cart.updatingItems;

// Reducer
export default cartSlice.reducer;
