import { createBrowserRouter, RouterProvider } from "react-router-dom";

import About from "./pages/About";
import Cart from "./pages/Cart";
import Categories from "./pages/Categories";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProductDetails from "./pages/ProductDetails";

const router = createBrowserRouter([
  { path: "/", 
    element: (
      <>
        <Header />
        <Home />
        <Footer />
      </>
    ) 
  },
  { path: "about", element: (
      <>
        <Header />
        <About/>
        <Footer />
      </>
    )  },
  { path: "cart", element: (
      <>
        <Header />
        <Cart />
        <Footer />
      </>
    )  },
  { path: "categories", element: (
      <>
        <Header />
        <Categories />
        <Footer />
      </>
    )  },
  { path: "product", element: (
      <>
        <Header />
        <ProductDetails />
        <Footer />
      </>
    )  },
  { path: "*", element: (
      <>
        <Header />
        <NotFound/>
        <Footer />
      </>
    )  },
]);

function App() {
  return <RouterProvider router={router}/>;
}

export default App;
