import { Outlet } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Header from "./Header";
import Footer from "./Footer";
import SessionExpiredHandler from "./SessionExpiredHandler";
import LoginModal from "./LoginModal";
import { fetchFavorites } from "../store/slices/favoritesSlice";

/**
 * Layout компонент
 *
 * ОПТИМИЗАЦИЯ:
 * 1. Удален key={location.pathname} из Suspense для предотвращения
 *    размонтирования компонентов при переходах. Теперь состояние компонентов
 *    (включая Redux state) сохраняется между навигацией.
 * 2. Загружает избранное при первом монтировании для синхронизации badge счетчика
 * 3. Обрабатывает истечение сессии с помощью SessionExpiredHandler
 */
function Layout() {
  const dispatch = useDispatch();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Загрузка избранного при первом монтировании приложения
  // Это гарантирует, что badge счетчик будет отображаться правильно
  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <>
      <Header onOpenLoginModal={handleOpenLoginModal} />
      <main>
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
    </>
  );
}

export default Layout;
