import { ZoneSelector } from "./components/StoreOptions/StoreOptions";
import CatalogHome from "./components/CatalogHome/CatalogHomeV2";
import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import NavBar from "../src/components/NavBar/NavBar";

import About from "./components/About/About";
import HowToBuy from "./components/HowToBuy/HowToBuyV2";
import Work from "./components/Work/Work";
import Cart from "./components/Cart/Cart";
import Login from "./components/Login/Login";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import ProductDetail from "./components/Products/ProductsList/ProductDetail/ProductDetail";
import CartDetail from "./components/Cart/CartDetail/CartDetail";
import ShippingDetail from "./components/Cart/ShippingDetail/ShippingDetail";
import Footer from "./components/Footer/Footer";
import Profile from "./components/Profile/Profile";
import Orders from "./components/Profile/MyOrders/MyOrders";
import WhatsAppButton from "./components/whatsappButton/WhatsAppButton";
function App() {
  const location = useLocation();
  const hideNavAndFooter = location.pathname === "/login";

  return (
    <div className="app-container">
      <main className="main-content">
        {!hideNavAndFooter && (
          <>
            <ZoneSelector /><NavBar />
            {location.pathname !== "/carrito" && <WhatsAppButton />}
          </>
        )}

        <div className="store-page"><Routes>
          <Route
            path="/"
            element={
              <CatalogHome />
            }
          />

          <Route path="/productos" element={<CatalogHome />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/sobrenosotros" element={<About />} />
          <Route path="/comocomprar" element={<HowToBuy />} />
          <Route path="/trabaja" element={<Work />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/detalledepedido" element={<CartDetail />} />
          <Route path="/editarpedido" element={<ShippingDetail />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/mispedidos" element={<Orders />} />
        </Routes></div>
        {!hideNavAndFooter && <Footer />}
      </main>
    </div>
  );
}

export default App;
