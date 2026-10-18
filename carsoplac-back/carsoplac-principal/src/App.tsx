import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const AboutPage = lazy(() => import("./pages/about"));
const ContactPage = lazy(() => import("./pages/contact"));
const ServicesPage = lazy(() => import("./pages/servicios"));
const Login = lazy(() => import("./pages/Login"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function App() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando…</div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/productos/:id" element={<ProductDetailPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mi-cuenta" element={<ProfilePage />} />
          <Route path="/cuenta" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/pending" element={<PaymentPending />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
