import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import About from "./pages/About";
import Cart from "./pages/Cart";
import Category from "./pages/Category";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductDetails from "./pages/ProductDetails";

import Layout from "./components/Layout";
import Thanks from "./pages/Thanks";
import fetchCategoryLoader from "./loaders/categoryLoader";
import fetchProductLoader from "./loaders/productsLoader";
import ErrorBoundary from "./components/ErrorBoundary";


const router = createBrowserRouter(
  [
    {
      path: "/", 
      element: <Layout />,
      children: [
        { index: true, element: <Home />, loader: fetchCategoryLoader, errorElement: <ErrorBoundary /> },
        { path: "old-home", element: <Navigate to={"/"} /> },
        { path: "about", element: <About /> },
        { path: "cart", element: <Cart /> },
        {path: "thanks", element: <Thanks />},
        {path: "category/:categoryId", element: <Category />, loader: fetchProductLoader, errorElement: <ErrorBoundary /> },
        {path: "product/:productId", element: <ProductDetails />},
        {path: "*", element: <NotFound />}
      ],
    }
  ]
)

function App() {
  return <RouterProvider router={router}/>;
}

export default App;