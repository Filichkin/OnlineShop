import { Outlet } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import Footer from "./Footer";
import SessionExpiredHandler from "./SessionExpiredHandler";
import LoginModal from "./LoginModal";
import { fetchFavorites, selectFavoritesIsLoaded, selectFavoritesIsLoading } from "../store/slices/favoritesSlice";
import { getCurrentUser } from "../store/slices/authSlice";

/**
 * Layout компонент
 *
 * ОПТИМИЗАЦИЯ:
 * 1. Удален key={location.pathname} из Suspense для предотвращения
 *    размонтирования компонентов при переходах. Теперь состояние компонентов
 *    (включая Redux state) сохраняется между навигацией.
 * 2. Загружает избранное при первом монтировании для синхронизации badge счетчика
 * 3. Загружает данные пользователя при первом монтировании, если токен существует
 * 4. Обрабатывает истечение сессии с помощью SessionExpiredHandler
 */
function Layout() {
  const dispatch = useDispatch();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const authChecked = useSelector((state) => state.auth.authChecked);
  const favoritesLoaded = useSelector(selectFavoritesIsLoaded);
  const favoritesLoading = useSelector(selectFavoritesIsLoading);

  // Загрузка данных пользователя при первом монтировании приложения
  // Это гарантирует, что имя пользователя и статус администратора
  // отображаются в Header сразу после загрузки страницы
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  // Загрузка избранного при первом монтировании приложения
  // Это гарантирует, что badge счетчик будет отображаться правильно
  // Добавлена проверка на isLoaded и isLoading для предотвращения дублирующих запросов
  // Wait for auth check to complete before fetching (handled in main.jsx, but this is a fallback)
  useEffect(() => {
    if (authChecked && !favoritesLoaded && !favoritesLoading) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, authChecked, favoritesLoaded, favoritesLoading]);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onOpenLoginModal={handleOpenLoginModal} />
      <main className="flex-grow">
        <Suspense fallback={<div className="text-center">Загрузка...</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />

      {/* Session expiration handler */}
      <SessionExpiredHandler onOpenLoginModal={handleOpenLoginModal} />

      {/* Global login modal for session expiration */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default Layout;
