import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { lazy } from "react";

import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Thanks from "./pages/Thanks";
import ProtectedRoute from "./components/ProtectedRoute";
import fetchBrandLoader from "./loaders/brandLoader";
import fetchBrandProductsLoader from "./loaders/brandProductsLoader";
import ErrorBoundary from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Profile = lazy(() => import("./pages/Profile"));
const Brand = lazy(() => import("./pages/Brand"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Catalog = lazy(() => import("./pages/Catalog"));
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    hydrateFallbackElement: <div className="text-center">Загрузка...</div>,
    children: [
      {
        index: true,
        element: <Home />,
        loader: fetchBrandLoader,
        errorElement: <ErrorBoundary />,
      },
      { path: "old-home", element: <Navigate to="/" /> },
      { path: "about", element: <About /> },
      { path: "information", element: <About /> }, // TODO: Создать отдельную страницу Information
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order-success", element: <OrderSuccess /> },
      { path: "order/:orderId", element: <OrderDetails /> },
      { path: "favorites", element: <Favorites /> },
      { path: "profile", element: <Profile /> },
      { path: "thanks", element: <Thanks /> },
      // Каталог
      { path: "catalog", element: <Catalog /> },
      { path: "catalog/:productId", element: <ProductDetails /> },
      // Старый роут продукта (для совместимости)
      { path: "product/:productId", element: <ProductDetails /> },
      {
        path: "admin",
        element: (
          <ProtectedRoute requireSuperuser={true}>
            <AdminPanel />
          </ProtectedRoute>
        ),
      },
      // Страница бренда с продуктами
      { path: "brand/:slug/products/:productId", element: <ProductDetails /> },
      {
        path: "brand/:slug",
        element: <Brand />,
        loader: fetchBrandProductsLoader,
        errorElement: <ErrorBoundary />,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
