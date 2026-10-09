import { formatMoney } from "../../../utils/money";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../types";
import { Alert } from "react-bootstrap";
import "./CartDetail.css";
import Breadcrums from "../../Breadcrumbs/Breadcrums";
import { normalizeCapToKg } from "../../../utils/weight";

interface CartItem {
  id: string;
  title: string;
  image: string;
  quantity: number;
  price: number;
  cap?: number;
  typeOfFractionation?: "Unitario" | "Pesado" | "No";
}

interface ShippingData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  comments?: string;
  dni: string;
  alias: string;
}

const dniRegex = /^\d{8}$/;

export default function CartDetail() {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!userInfo?.token) {
      navigate("/login?redirect=detalledepedido&reason=checkout", {
        replace: true,
      });
    }
  }, [userInfo, navigate]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState("");

  const [shippingData, setShippingData] = useState<ShippingData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phone: "",
    comments: "",
    dni: "",
    alias: "",
  });

  useEffect(() => {
    const cartData = localStorage.getItem("cart");
    if (cartData) setCartItems(JSON.parse(cartData));

    if (userInfo) {
      setShippingData({
        username: userInfo.username || "",
        firstName: userInfo.firstName || "",
        lastName: userInfo.lastName || "",
        email: userInfo.email || "",
        address: userInfo.address || "",
        phone: userInfo.phone || "",
        comments: "",
        dni: userInfo.dni || "",
        alias: userInfo.alias || "",
      });
    }
  }, [userInfo]);

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const capKg = normalizeCapToKg(item.cap);

      if (item.typeOfFractionation === "Pesado" && capKg > 0) {
        return acc + item.price * capKg * item.quantity;
      }
      return acc + item.price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal().toFixed(2);

  // 🔹 Input handler mejorado (genera alias automáticamente)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setShippingData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "dni") {
        const cleaned = value.replace(/\D/g, "");
        next.dni = cleaned;
        next.alias = cleaned ? `${cleaned}.distrolac` : "";
      }

      return next;
    });
  };

  const validateForm = () => {
    if (
      !shippingData.email ||
      !shippingData.address ||
      !shippingData.firstName ||
      !shippingData.lastName ||
      !shippingData.phone ||
      !shippingData.dni
    ) {
      setError("Por favor, complete todos los campos obligatorios");
      return false;
    }

    if (!dniRegex.test(shippingData.dni)) {
      setError("El DNI debe tener exactamente 8 dígitos.");
      return false;
    }

    if (!shippingData.alias) {
      setError("No se pudo generar el alias automáticamente.");
      return false;
    }

    return true;
  };

  const handleGoToShipping = () => {
    if (!userInfo?.token) {
      navigate("/login?redirect=detalledepedido");
      return;
    }

    if (!validateForm()) return;

    localStorage.setItem("shippingData", JSON.stringify(shippingData));
    localStorage.setItem("total", subtotal);
    navigate("/editarpedido");
  };

  return (
    <div className="cart-detail-full-container">
      <div className="cartdetail-container-1">
        <div className="breadcrum-container">
          <Breadcrums
            items={[
              { label: "Mi carrito", to: "/carrito" },
              { label: "Detalles del pedido" },
            ]}
          />
        </div>

        <div className="red-underline">
          <h1>DETALLES DEL PEDIDO</h1>
        </div>

        <div className="cartdetail-container">
          <div>
            <div className="cartdetail-leftcolumn">
              {error && <Alert variant="danger">{error}</Alert>}

              <fieldset className="cartdetail-form">
                <legend>Contacto</legend>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={shippingData.email}
                  onChange={handleInputChange}
                />
              </fieldset>

              <fieldset className="cartdetail-form">
                <legend>Datos de envío</legend>

                <div className="cartdetail-row">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Nombre"
                    value={shippingData.firstName}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Apellido"
                    value={shippingData.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                <input
                  type="text"
                  name="dni"
                  placeholder="DNI (8 dígitos)"
                  value={shippingData.dni}
                  onChange={handleInputChange}
                />

                {shippingData.alias && (
                  <small style={{ opacity: 0.7 }}>
                    Alias generado: {shippingData.alias}
                  </small>
                )}

                <input
                  type="text"
                  name="address"
                  placeholder="Dirección completa"
                  value={shippingData.address}
                  onChange={handleInputChange}
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Teléfono"
                  value={shippingData.phone}
                  onChange={handleInputChange}
                />

                <input
                  type="text"
                  name="comments"
                  placeholder="Comentarios (Opcional)"
                  value={shippingData.comments}
                  onChange={handleInputChange}
                />
              </fieldset>
            </div>

            <div className="cartdetail-rightcolumn">
              <h2>Detalle del Pedido</h2>

              <ul className="cartdetail-items">
                {cartItems.map((item) => {
                  const isPesado = item.typeOfFractionation === "Pesado";
                  const capKg = normalizeCapToKg(item.cap);
                  const kgTotales =
                    isPesado && capKg > 0 ? capKg * item.quantity : null;

                  const subtotalProducto =
                    isPesado && kgTotales
                      ? item.price * kgTotales
                      : item.price * item.quantity;

                  return (
                    <li key={item.id} className="cartdetail-item">
                      <img src={item.image} alt={item.title} />
                      <div>
                        <h3>{item.title}</h3>

                        {!isPesado && (
                          <>
                            <p>{formatMoney(item.price)}</p>
                            <p>
                              {item.quantity} unidades · Subtotal {formatMoney(subtotalProducto)}
                            </p>
                          </>
                        )}

                        {isPesado && kgTotales && (
                          <>
                            <p>{formatMoney(item.price)} / kg</p>
                            <p>
                              {item.quantity} horma
                              {item.quantity > 1 && "s"} (~
                              {kgTotales.toFixed(2)} kg)
                            </p>
                            <p>
                              Subtotal producto: {formatMoney(subtotalProducto)}
                            </p>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="cartdetail-summary">
                <div className="cartdetail-totals">
                  <div>
                    <span>Subtotal</span>
                    <span className="subtotal-span">{formatMoney(subtotal)}</span>
                  </div>
                  <div>
                    <span>Envío</span>
                    <span className="free-delivery">Gratis</span>
                  </div>
                  <div className="cartdetail-total-row">
                    <span>Total</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cartdetail-buttons">
            <button onClick={handleGoToShipping}>Continuar con el envío</button>
          </div>
        </div>
      </div>
    </div>
  );
}
