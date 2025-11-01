import { Outlet } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";
import Header from "./Header";
import Footer from "./Footer";
import { fetchFavorites } from "../store/slices/favoritesSlice";

/**
 * Layout компонент
 *
 * ОПТИМИЗАЦИЯ:
 * 1. Удален key={location.pathname} из Suspense для предотвращения
 *    размонтирования компонентов при переходах. Теперь состояние компонентов
 *    (включая Redux state) сохраняется между навигацией.
 * 2. Загружает избранное при первом монтировании для синхронизации badge счетчика
 */
function Layout() {
  const dispatch = useDispatch();

  // Загрузка избранного при первом монтировании приложения
  // Это гарантирует, что badge счетчик будет отображаться правильно
  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="text-center">Загрузка...</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default Layout;
