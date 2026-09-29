import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProductPage from "./pages/ProductPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Fix: sincronizado con navigate('/products') del Login */}
        <Route path="/products" element={<ProductPage />} />
        {/* Alias legacy por si acaso */}
        <Route path="/product" element={<Navigate to="/products" replace />} />
        {/* Fallback para rutas inexistentes: no más pantalla en blanco */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
