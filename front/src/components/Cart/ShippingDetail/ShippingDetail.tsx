import { formatMoney } from "../../../utils/money";
import { canChooseHalf, validHormaQuantity, hormaLabel, presentationMetadata } from '../../../utils/presentation';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import emailjs from "@emailjs/browser";
import { RootState } from "../../../types";
import "./ShippingDetail.css";
import "./OrderConfirmation.css";
import "./OrderReview.css";
import Breadcrums from "../../Breadcrumbs/Breadcrums";
import Alert from "../../Alert/Alert";
import Spinner from "../../Spinner/Spinner";
import { normalizeCapToKg } from "../../../utils/weight";

const EMAIL_SERVICE_ID = "service_szd7tra";
const EMAIL_TEMPLATE_CLIENT_ID = "template_9afqj0i";
const EMAIL_TEMPLATE_ADMIN_ID = "template_qnvxrh8";
const EMAIL_PUBLIC_KEY = "ouk745ASI3P1s6qZj";
const ADMIN_EMAIL = "distrolacpedidos@gmail.com";

interface ShippingData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string; // Campo unificado de dirección
  phone: string;
  dni?: string; // Asegurarse de que dni esté presente
  alias?: string; // Asegurarse de que alias esté presente
  comments?: string;
}

interface CartItem {
  id: string;
  sku?: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  priceListId?: string;
  typeOfFractionation?: "No" | "Unitario" | "Pesado";
  cap?: number;
}

interface PriceList {
  _id: string;
  name: string;
  marginInPercentage: number;
  sellerComissionInPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export default function ShippingDetail() {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state: RootState) => state.auth);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    address: "", // Campo unificado de dirección
    phone: "",
    comments: "",
    alias: "", // Asegurarse de que alias esté presente
    dni: "", // Asegurarse de que dni esté presente
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [emailFailed, setEmailFailed] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertStatus, setAlertStatus] = useState<string>("");
  const [alertEvent, setAlertEvent] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const getOrderQuantity = (item: CartItem) => {
    const isPesado = item.typeOfFractionation === "Pesado";
    const capKg = normalizeCapToKg(item.cap);

    if (isPesado && capKg > 0) {
      return Number((item.quantity * capKg).toFixed(3));
    }

    return Number(item.quantity);
  };

  const getOrderLineTotal = (item: CartItem) => {
    return Number((item.price * getOrderQuantity(item)).toFixed(2));
  };

  // Función para obtener directamente el perfil del usuario
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch("/api/store/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener el perfil");
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener perfil completo:", error);
      return null;
    }
  };

  // Cargar datos del localStorage y userInfo al iniciar
  useEffect(() => {
    const storedShippingData = localStorage.getItem("shippingData");
    const storedCartItems = localStorage.getItem("cart");
    const storedTotal = localStorage.getItem("total");

    if (storedShippingData) {
      const parsedData = JSON.parse(storedShippingData);
      console.log("Datos de envío almacenados:", parsedData);
      setShippingData(parsedData);
    } else if (userInfo) {
      console.log("UserInfo para shipping:", userInfo);

      // Intentar obtener datos de respaldo
      let savedAddress = "";
      let savedPhone = "";

      try {
        const savedData = localStorage.getItem("userProfileData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          savedAddress = parsedData.address || "";
          savedPhone = parsedData.phone || "";
          console.log("Datos recuperados de perfil guardado:", parsedData);
        }
      } catch (err) {
        console.error("Error al recuperar datos guardados:", err);
      }

      console.log("Datos del usuario:", userInfo);

      setShippingData({
        username: userInfo.username || "",
        firstName: userInfo.firstName || "",
        lastName: userInfo.lastName || "",
        email: userInfo.email || "",
        address: userInfo.address || savedAddress || "", // Campo unificado
        phone: userInfo.phone || savedPhone || "",
        dni: userInfo.dni || "", // Asegurarse de que dni esté presente
        alias: userInfo.alias || "", // Asegurarse de que alias esté presente
        comments: "",
      });
    }

    if (storedCartItems) setCartItems(JSON.parse(storedCartItems));
    if (storedTotal) setTotal(parseFloat(storedTotal));
  }, [userInfo]);

  // Obtener el perfil directamente del backend si no tenemos address
  useEffect(() => {
    const getProfileData = async () => {
      // Solo intentamos obtener el perfil si:
      // 1. Hay un usuario logueado con token
      // 2. No tenemos dirección o la dirección está vacía
      if (
        userInfo?.token &&
        (!shippingData.address || shippingData.address.trim() === "")
      ) {
        setIsLoadingProfile(true);

        try {
          const profileData = await fetchUserProfile(userInfo.token);

          if (profileData) {
            console.log(
              "Perfil obtenido directamente del backend:",
              profileData,
            );

            // Actualizar con los datos obtenidos
            setShippingData((prev) => ({
              ...prev,
              address: profileData.address || prev.address,
              phone: profileData.phone || prev.phone,
              alias: profileData.alias || prev.alias, // Asegurarse de que alias esté presente
              dni: profileData.dni || prev.dni, // Asegurarse de que
              // Mantener otros datos si es necesario
            }));

            // Guardar en localStorage para futuros accesos
            localStorage.setItem(
              "userProfileData",
              JSON.stringify({
                address: profileData.address || "",
                phone: profileData.phone || "",
              }),
            );
          }
        } catch (error) {
          console.error("Error al obtener perfil del usuario:", error);
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    getProfileData();
  }, [userInfo, shippingData.address]);

  const formatOrderDetails = (items: CartItem[]) => {
    return items
      .map(
        (item) => {
          const isPesado = item.typeOfFractionation === "Pesado";
          const quantityToSend = getOrderQuantity(item);
          const unitLabel = isPesado ? "kg" : "un";
          const weightedInfo =
            isPesado && normalizeCapToKg(item.cap) > 0
              ? ` (${hormaLabel(item.quantity)})`
              : "";

          return `
      Producto: ${item.title}
      ${item.sku ? `SKU: ${item.sku}` : ""}
      Cantidad: ${quantityToSend} ${unitLabel}${weightedInfo}
      Precio unitario: ${formatMoney(item.price)}
      Subtotal: ${formatMoney(getOrderLineTotal(item))}
      ------------------------
    `;
        },
      )
      .join("\n");
  };

  const getStoreVendor = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BACK_APP_URI;
      const url = `${baseUrl}/users/store-vendor`;

      console.log("Calling URL:", url);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (userInfo?.token) {
        headers.Authorization = `Bearer ${userInfo.token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        let errorData: { message?: string } | null = null;
        try {
          errorData = await response.json();
        } catch {
          // noop
        }
        throw new Error(
          errorData?.message || "Error al obtener el vendedor de tienda",
        );
      }

      const storeVendor = await response.json();
      return storeVendor._id;
    } catch (error) {
      console.error("Error obteniendo vendedor de tienda:", error);
      throw error;
    }
  };

  const getStorePriceList = async (): Promise<PriceList> => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (userInfo?.token) {
        headers.Authorization = `Bearer ${userInfo.token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACK_APP_URI}/price-lists`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(
          `Error al obtener las listas de precios: ${response.status}`,
        );
      }

      const priceLists = await response.json();
      const storePriceList = priceLists.find(
        (list: PriceList) => list.name === "Lista Tienda Online",
      );

      if (!storePriceList) {
        throw new Error("No se encontró la lista de precios de la tienda");
      }

      return storePriceList;
    } catch (error) {
      console.error("Error al obtener la lista de precios:", error);
      throw error;
    }
  };

  const validateCartItem = (item: CartItem) => {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || (canChooseHalf(item) && !validHormaQuantity(item.quantity))) return false;
    if (!item.title) console.error("Falta title en item:", item);
    if (!item.quantity) console.error("Falta quantity en item:", item);
    if (!item.price) console.error("Falta price en item:", item);
    if (!item.image) console.error("Falta image en item:", item);
    if (!item.id) console.error("Falta id en item:", item);

    if (item.typeOfFractionation === "Pesado" && normalizeCapToKg(item.cap) <= 0) {
      console.error("Producto pesado sin cap válido:", item);
      return false;
    }

    return item.title && item.quantity && item.price && item.image && item.id;
  };

  const handleConfirmOrder = async () => {
    if (isSubmitting || showConfirmation || cartItems.length === 0) return;

    try {
      setLoading(true);
      setIsSubmitting(true);

      if (!cartItems.every(validateCartItem)) {
        handleShowAlert(
          "Algunos productos no tienen todos los campos requeridos",
          "error",
        );
        throw new Error(
          "Algunos productos no tienen todos los campos requeridos",
        );
      }

      const priceList = await getStorePriceList();
      const storeVendorId = await getStoreVendor();
      const payloadTotal = Number(
        cartItems.reduce((acc, item) => acc + getOrderLineTotal(item), 0).toFixed(2),
      );

      // Extraer información de la dirección completa para compatibilidad
      // En caso de que el backend aún espere street y streetNumber
      let street = "";
      let streetNumber = "";

      if (shippingData.address) {
        const addressParts = shippingData.address.split(" ");
        if (addressParts.length >= 2) {
          streetNumber = addressParts.pop() || "";
          street = addressParts.join(" ");
        } else {
          street = shippingData.address;
        }
      }

      const orderData = {
        storeOrder: {
          user: userInfo?._id || null,
          customerInfo: {
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            email: shippingData.email,
            phone: shippingData.phone,
            dni: shippingData.dni,
            alias: shippingData.alias,
            address: shippingData.address, // Dirección completa
            street: street, // Para compatibilidad
            streetNumber: streetNumber, // Para compatibilidad
            fullName: `${shippingData.firstName} ${shippingData.lastName}`,
          },
          orderItems: cartItems.map((item) => ({
            ...presentationMetadata(item),
            title: item.title,
            quantity: getOrderQuantity(item),
            price: item.price,
            image: item.image,
            systemProductId: item.id,
          })),
          subtotal: payloadTotal,
          shippingCost: 0,
          total: payloadTotal,
          status: "pendiente",
        },
        systemOrder: {
          orderType: "store",
          orderNumber: `ST-${Date.now()}`,
          storeClient: {
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            email: shippingData.email,
            phone: shippingData.phone,
            dni: shippingData.dni,
            alias: shippingData.alias,
            fullName: `${shippingData.firstName} ${shippingData.lastName}`,
            isStoreClient: true,
          },
          seller: storeVendorId,
          products: cartItems.map((item) => ({
            ...presentationMetadata(item),
            product: item.id,
            quantity: getOrderQuantity(item),
            price: item.price,
            selectedPriceList: priceList._id,
            totalPrice: getOrderLineTotal(item),
          })),
          totalAmount: payloadTotal,
          orderStatus: "pending",
          orderDate: new Date().toISOString(),
          delivery: {
            status: "NO ENTREGADO",
            address: shippingData.address,
          },
          notes: [shippingData.comments, ...cartItems.filter(item=>canChooseHalf(item)).map(item=>`${item.title}: ${hormaLabel(item.quantity)} (peso estimado; ajustar al preparar).`)].filter(Boolean).join('\n'),
        },
      };

      console.log("Enviando datos de orden:", orderData);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (userInfo?.token) {
        headers.Authorization = `Bearer ${userInfo.token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACK_APP_URI}/store/orders`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(orderData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);

        if (errorData.duplicateFields) {
          handleShowAlert("Ya existe un registro similar", "error");
          throw new Error(
            `Ya existe un registro similar: ${errorData.duplicateFields.join(", ")}`,
          );
        }

        handleShowAlert("Error al crear la orden", "error");
        throw new Error(
          `Error al crear la orden: ${errorData.message || response.statusText}`,
        );
      }

      const savedOrder = await response.json();
      console.log("Orden creada exitosamente:", savedOrder);

      // The order is already persisted. Email delivery must never turn this
      // success into a retryable purchase error or keep the cart populated.
      const orderId = savedOrder.storeOrder?._id;
      setConfirmedOrderId(typeof orderId === 'string' ? orderId : '');
      localStorage.removeItem("cart");
      localStorage.removeItem("total");
      localStorage.removeItem("shippingData");
      window.dispatchEvent(new Event('cart:updated'));
      window.dispatchEvent(new Event('storage'));
      setCartItems([]);
      setTotal(0);
      setShowConfirmation(true);
      setLoading(false);

      const commonTemplateParams = {
        to_name: `${shippingData.firstName} ${shippingData.lastName}`,
        customer_phone: shippingData.phone,
        customer_address: shippingData.address,
        order_details: formatOrderDetails(cartItems),
        order_subtotal: formatMoney(payloadTotal),
        order_shipping: "Gratis",
        order_total: formatMoney(payloadTotal),
        order_date: new Date().toLocaleDateString(),
        comments: shippingData.comments || "Sin comentarios",
      };

      const notifications = await Promise.allSettled([emailjs.send(
        EMAIL_SERVICE_ID,
        EMAIL_TEMPLATE_CLIENT_ID,
        {
          ...commonTemplateParams,
          to_email: shippingData.email,
        },
        EMAIL_PUBLIC_KEY,
      ), emailjs.send(
        EMAIL_SERVICE_ID,
        EMAIL_TEMPLATE_ADMIN_ID,
        {
          ...commonTemplateParams,
          to_email: ADMIN_EMAIL,
          customer_email: shippingData.email,
        },
        EMAIL_PUBLIC_KEY,
      )]);
      setEmailFailed(notifications.some(result => result.status === 'rejected'));
    } catch (error) {
      console.error("Error detallado:", error);
      handleShowAlert(
        "Error al procesar el pedido. Por favor, inténtalo de nuevo más tarde.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleShowAlert = (message: string, status: string) => {
    setAlertMessage(message);
    setAlertStatus(status);
    setShowAlert(true);
    setAlertEvent((prev) => !prev);
  };

  return (
    <div className="shipping-full-container dl-order-review">
      {loading && <Spinner />}
      <Alert
        message={alertMessage}
        status={alertStatus}
        onClose={() => setShowAlert(false)}
        show={showAlert}
        event={() => setAlertEvent(!alertEvent)}
      />
      <div className="shipping-container-1">
        <div className="breadcrum-container">
          <Breadcrums
            items={[
              { label: "Mi carrito", to: "/carrito" },
              { label: "Detalles del pedido", to: "/detalledepedido" },
              { label: "Confirmar pedido" },
            ]}
          />
        </div>
        <div className="dl-review-heading">
          <span>YA CASI ESTÁ</span>
          <h1>Revisá tu pedido</h1>
          <p>Un último vistazo y lo dejamos listo.</p>
        </div>
        <div className="shipping-container">
          <div className="shipping-leftcolumn">
            <div className="shipping-info">
              <h2>Tus datos de entrega</h2>
              <div className="shipping-info-row">
                <span>Email</span>
                <span>{shippingData.email || "No especificado"}</span>
                <button aria-label="Editar email" onClick={() => navigate("/detalledepedido")}>
                  Editar
                </button>
              </div>
              <div className="shipping-info-row">
                <span>Teléfono</span>
                <span>{shippingData.phone || "No especificado"}</span>
                <button aria-label="Editar teléfono" onClick={() => navigate("/detalledepedido")}>
                  Editar
                </button>
              </div>
              <div className="shipping-info-row">
                <span>Nombre completo</span>
                <span>
                  {shippingData.firstName && shippingData.lastName
                    ? `${shippingData.firstName} ${shippingData.lastName}`
                    : "No especificado"}
                </span>
                <button aria-label="Editar nombre" onClick={() => navigate("/detalledepedido")}>
                  Editar
                </button>
              </div>
              <div className="shipping-info-row">
                <span>Dirección</span>
                <span>
                  {shippingData.address
                    ? shippingData.address
                    : "No especificado"}
                </span>
                <button aria-label="Editar dirección" onClick={() => navigate("/detalledepedido")}>
                  Editar
                </button>
              </div>
            </div>

            <fieldset className="shipping-method">
              <legend>La entrega</legend>
              <div className="shipping-method-option">
                <div className="dl-shipping-included">
                  <span className="dl-shipping-included__check" aria-hidden="true">✓</span>
                  <div><strong>Envío gratis</strong><span>Entrega a domicilio</span></div>
                </div>
              </div>
            </fieldset>

            <div className="dl-review-payment">
              <span aria-hidden="true">✓</span>
              <div><strong>Pagás cuando lo recibís</strong><p>No cobramos nada por adelantado.</p><small>En tu domicilio: efectivo o transferencia.</small></div>
            </div>

            <div className="shipping-buttons">
              <button type="button"
                className="shipping-back"
                onClick={() => navigate("/detalledepedido")}
              >
                ← Volver a mis datos
              </button>
              <button
                className="shipping-confirm"
                onClick={handleConfirmOrder}
                disabled={isSubmitting || showConfirmation || isLoadingProfile || cartItems.length === 0}
              >
                {isSubmitting
                  ? "Procesando..."
                  : isLoadingProfile
                    ? "Cargando datos..."
                    : showConfirmation
                      ? "Procesado"
                      : "Confirmar mi pedido"}
              </button>
            </div>
          </div>

          <div className="shipping-rightcolumn">
            <h2>Tu pedido</h2>
            <ul className="shipping-cartitems">
              {cartItems.map((item) => (
                <li key={item.id} className="shipping-cartitem">
                  <img src={item.image} alt={item.title} />
                  <div>
                    <h3 className="title-item-detail">{item.title}</h3>
                    {/* <p>${Number(item.price).toFixed(2)}</p> */}
                  </div>
                  <span>{item.typeOfFractionation === 'Pesado' ? hormaLabel(item.quantity) : `x${item.quantity}`}</span>
                </li>
              ))}
            </ul>
            <hr className="red-line-login" />
            <div className="shipping-summary">
              <div className="shipping-totals">
                <div>
                  <span>Subtotal</span>
                  <span>{formatMoney(total)}</span>
                </div>
                <div>
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div className="shipping-total-row">
                  <span>Total estimado</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
              {cartItems.some(item => item.typeOfFractionation === 'Pesado') && <p className="dl-review-weight-note">Los productos por peso se ajustan al peso final.</p>}
            </div>
          </div>

          {showConfirmation && (
            <div className="confirmation-popup dl-order-confirmation" role="dialog" aria-modal="true" aria-labelledby="order-confirmed-title" aria-describedby="order-confirmed-description">
              <div className="confirmation-content dl-order-confirmation__card">
                <div className="dl-order-confirmation__check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></div>
                <span className="dl-order-confirmation__eyebrow">GRACIAS POR ELEGIR DISTROLAC</span>
                <h3 id="order-confirmed-title">¡Pedido confirmado!</h3>
                <p id="order-confirmed-description">
                  Ya recibimos tu pedido. Podés consultar el detalle cuando quieras.
                </p>
                <div className="dl-order-confirmation__payment"><strong>Pagás al recibir</strong><span>Sin anticipos. En tu casa o negocio.</span></div>
                {confirmedOrderId && <div className="dl-order-confirmation__reference"><span>Referencia de tu pedido</span><strong>{confirmedOrderId}</strong></div>}
                {emailFailed && <p className="dl-order-confirmation__notice" role="status">No pudimos enviar la confirmación por correo. Tu pedido está guardado; no hace falta volver a realizarlo.</p>}
                <button className="dl-order-confirmation__button" autoFocus type="button" onClick={() => navigate(confirmedOrderId ? `/mispedidos?pedido=${encodeURIComponent(confirmedOrderId)}` : '/mispedidos', {replace:true})}>Ver {confirmedOrderId ? 'mi pedido' : 'mis pedidos'} <span aria-hidden="true">→</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
