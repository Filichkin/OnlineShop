import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { lazy } from "react";

import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Thanks from "./pages/Thanks";
import ProtectedRoute from "./components/ProtectedRoute";
import fetchCategoryLoader from "./loaders/categoryLoader";
import fetchProductLoader from "./loaders/productsLoader";
import ErrorBoundary from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Cart = lazy(() => import("./pages/Cart"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    hydrateFallbackElement: <div className="text-center">Загрузка...</div>,
    children: [
      {
        index: true,
        element: <Home />,
        loader: fetchCategoryLoader,
        errorElement: <ErrorBoundary />,
      },
      { path: "old-home", element: <Navigate to="/" /> },
      { path: "about", element: <About /> },
      { path: "cart", element: <Cart /> },
      { path: "thanks", element: <Thanks /> },
      {
        path: "category/:slug",
        element: <Category />,
        loader: fetchProductLoader,
        errorElement: <ErrorBoundary />,
      },
      { path: "product/:productId", element: <ProductDetails /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/admin",
    children: [
      {
        index: true,
        element: <Navigate to="/admin/login" replace />,
      },
      {
        path: "login",
        element: <AdminLogin />,
      },
      {
        path: "panel",
        element: (
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
