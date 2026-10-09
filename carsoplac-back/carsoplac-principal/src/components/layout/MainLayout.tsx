import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import TopBanner from "./TopBanner";
import FooterAcordeonMobile from "./FooterAcordeonMobile";
import MobileMenu from "./MobileMenu";
import SearchDrawer from "./SearchDrawer";
import { useState } from "react";
import CartDrawer from "./CartDrawer";
import WhatsAppButton from "../ui/WhatsAppButton";

export default function MainLayout() {
  const [openCart, setOpenCart] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-midnight-forest flex flex-col">
      <TopBanner />

      {/* Navbar premium con búsqueda, cuenta y carrito */}
      <Navbar
        onOpenCart={() => setOpenCart(true)}
        onOpenSearch={() => setOpenSearch(true)}
        onOpenMobileMenu={() => setOpenMobileMenu(true)}
      />

      {/* Drawers / menús */}
      <SearchDrawer open={openSearch} onClose={() => setOpenSearch(false)} />
      <MobileMenu open={openMobileMenu} onClose={() => setOpenMobileMenu(false)} />
      <CartDrawer open={openCart} onClose={() => setOpenCart(false)} />

      <main className="flex-1">
        {/* Outlet: las páginas reciben { setOpenCart } via useOutletContext */}
        <Outlet context={{ setOpenCart }} />
      </main>

      <FooterAcordeonMobile />

      {/* Botón flotante de WhatsApp global */}
      <WhatsAppButton />
    </div>
  );
}
