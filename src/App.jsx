import { createBrowserRouter, RouterProvider } from "react-router-dom";

import About from "./pages/About";
import Cart from "./pages/Cart";
import Category from "./pages/Category";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductDetails from "./pages/ProductDetails";

import Layout from "./components/Layout";


const router = createBrowserRouter(
  [
    {
      path: "/", 
      element: <Layout />,
      children: [
        {index: true, element: <Home />},
        {path: "about", element: <About />},
        {path: "cart", element: <Cart />},
        {path: "category/:categoryId", element: <Category />},
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