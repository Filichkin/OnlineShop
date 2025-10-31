import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { Suspense } from "react";

/**
 * Layout компонент
 *
 * ОПТИМИЗАЦИЯ: Удален key={location.pathname} из Suspense для предотвращения
 * размонтирования компонентов при переходах. Теперь состояние компонентов
 * (включая Redux state) сохраняется между навигацией.
 */
function Layout() {
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
