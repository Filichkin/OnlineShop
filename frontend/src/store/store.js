import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import categoriesReducer from './slices/categoriesSlice';
import productsReducer from './slices/productsSlice';
import cartReducer from './slices/cartSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    products: productsReducer,
    cart: cartReducer,
  },
});

export default store;