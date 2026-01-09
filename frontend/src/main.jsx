import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./store/store.js";
import { fetchCart } from "./store/slices/cartSlice.js";
import { fetchFavorites } from "./store/slices/favoritesSlice.js";
import { getCurrentUser } from "./store/slices/authSlice.js";

/**
 * AppInitializer - инициализация приложения
 *
 * Загружает корзину и проверяет авторизацию при старте приложения
 * для обеспечения актуального состояния во всех компонентах
 */
function AppInitializer() {
  const dispatch = useDispatch();
  const { authChecked } = useSelector((state) => state.auth);

  useEffect(() => {
    // Проверяем авторизацию при инициализации приложения
    // Если есть валидная сессия (httpOnly cookie), пользователь будет авторизован
    // Если сессия истекла или отсутствует, будет возвращена ошибка и isAuthenticated останется false
    dispatch(getCurrentUser());
  }, [dispatch]);

  // Load cart and favorites AFTER auth check completes
  // This ensures fetchCart/fetchFavorites know if user is authenticated or guest
  useEffect(() => {
    if (authChecked) {
      // Auth check completed - now we can safely fetch cart and favorites
      // fetchCart/fetchFavorites will check auth.isAuthenticated to decide
      // whether to load from server or localStorage
      dispatch(fetchCart());
      dispatch(fetchFavorites());
    }
  }, [authChecked, dispatch]);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AppInitializer />
    </Provider>
  </StrictMode>
);
