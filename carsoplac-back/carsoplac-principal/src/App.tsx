import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import MobileOnly from "./components/layout/MobileOnly";
import PaymentSuccess from "./pages/PaymentSuccess";
import AboutPage from "./pages/about";
import ContactPage from "./pages/contact";
import Login from "./pages/Login";

function App() {
  return (
    <MobileOnly>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/productos/:id" element={<ProductDetailPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentSuccess />} />
          <Route path="/payment/pending" element={<PaymentSuccess />} />
        </Route>
      </Routes>
    </MobileOnly>
  );
}

export default App;
