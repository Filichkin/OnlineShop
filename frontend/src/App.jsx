import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { lazy } from "react";

import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Thanks from "./pages/Thanks";
import fetchCategoryLoader from "./loaders/categoryLoader";
import fetchProductLoader from "./loaders/productsLoader";
import ErrorBoundary from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Cart = lazy(() => import("./pages/Cart"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
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
        path: "category/:categoryId",
        element: <Category />,
        loader: fetchProductLoader,
        errorElement: <ErrorBoundary />,
      },
      { path: "product/:productId", element: <ProductDetails /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
