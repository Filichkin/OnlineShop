import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider, useDispatch } from "react-redux";
import store from "./store/store.js";
import { fetchCart } from "./store/slices/cartSlice.js";
import { getCurrentUser } from "./store/slices/authSlice.js";

/**
 * AppInitializer - инициализация приложения
 *
 * Загружает корзину и проверяет авторизацию при старте приложения
 * для обеспечения актуального состояния во всех компонентах
 */
function AppInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Проверяем авторизацию при инициализации приложения
    // Если есть валидная сессия (httpOnly cookie), пользователь будет авторизован
    // Если сессия истекла или отсутствует, будет возвращена ошибка и isAuthenticated останется false
    dispatch(getCurrentUser());
    
    // Загружаем корзину при инициализации приложения
    dispatch(fetchCart());
  }, [dispatch]);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AppInitializer />
    </Provider>
  </StrictMode>
);
