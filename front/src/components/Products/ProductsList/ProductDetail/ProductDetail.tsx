import { formatMoney } from "../../../../utils/money";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ProductDetail.css";
import Alert from "../../../Alert/Alert";
import Breadcrums from "../../../Breadcrumbs/Breadcrums";
import { formatCapWeight, normalizeCapToKg } from "../../../../utils/weight";
const BACKEND_URI = import.meta.env.VITE_BACK_APP_URI;
interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price?: number; // PRECIO POR KG si es pesado
  category?: {
    name?: string;
  };
  typeOfFractionation?: "No" | "Unitario" | "Pesado";
  cap?: number; // KG POR HORMA
}

interface CartStorageItem {
  id: string;
  quantity: number;
  title?: string;
  image?: string;
  price?: number;
  cap?: number;
  typeOfFractionation?: "No" | "Unitario" | "Pesado";
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // 👇 ahora soporta decimales
  const [quantity, setQuantity] = useState<number>(1);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState("");
  const [alertEvent, setAlertEvent] = useState(false);

  const capKg = normalizeCapToKg(product?.cap);
  const isPesado = product?.typeOfFractionation === "Pesado" && capKg > 0;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${BACKEND_URI}/store/products/${id}`);
        if (!res.ok) throw new Error("Error al traer el producto");
        const data = await res.json();

        setProduct(data);
      } catch (error) {
        console.error(error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    // 🚨 validación clave para pesados
    if (isPesado && quantity <= 0) {
      setAlertMessage("Ingresá una cantidad válida");
      setAlertStatus("error");
      setShowAlert(true);
      setAlertEvent((prev) => !prev);
      return;
    }

    const cart: CartStorageItem[] = JSON.parse(
      localStorage.getItem("cart") || "[]",
    );

    const existingIndex = cart.findIndex(
      (item) => item.id === product._id,
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product._id,
        title: product.name,
        image: product.images?.[0],
        quantity, // hormas o unidades (decimal si pesado)
        price: product.price || 0, // PRECIO POR KG SI ES PESADO
        cap: capKg, // KG POR HORMA NORMALIZADO
        typeOfFractionation: product.typeOfFractionation,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setQuantity(1);

    setAlertMessage("Producto agregado al carrito");
    setAlertStatus("success");
    setShowAlert(true);
    setAlertEvent((prev) => !prev);

    window.dispatchEvent(new Event("storage"));
  };

  if (loading) return <div>Cargando producto...</div>;
  if (!product) return <div>Producto no encontrado</div>;

  return (
    <div className="productdetail-container">
      <Alert
        message={alertMessage}
        status={alertStatus}
        show={showAlert}
        onClose={() => setShowAlert(false)}
        event={() => setAlertEvent(!alertEvent)}
      />

      <div className="productdetail-details">
        <div className="breadcrum-container">
          <Breadcrums
            items={[
              { label: "Productos", to: "/productos" },
              { label: product.category?.name || "", to: "/productos" },
              { label: product.name },
            ]}
          />
        </div>

        <div className="productdetail-image-border">
          <img src={product.images?.[0]} alt={product.name} />
        </div>

        <div className="product-info-container">
          <h2>{product.name}</h2>

          <h3>
            {formatMoney(product.price)}
            {isPesado && " / kg"}
          </h3>

          {isPesado && (
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              Cada horma pesa aprox. {formatCapWeight(product.cap)}
            </p>
          )}

          <div className="productdetail-buttons-container">
            <div>
              <p>Cantidad ({isPesado ? "Hormas" : "Unidades"})</p>

              <div className="productdetail-quantityline">
                {isPesado ? (
                  <input
                    type="number"
                    step={0.1}
                    value={quantity === 0 ? "" : quantity}
                    className="quantity-input"
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = value === "" ? 0 : Number(value);
                      if (isNaN(parsed)) return;
                      setQuantity(parsed);
                    }}
                    onBlur={() => {
                      if (quantity < 0) setQuantity(0);
                    }}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <p>{quantity}</p>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </>
                )}
              </div>

              {isPesado && (
                <p style={{ fontSize: 13 }}>
                  Total aprox: {(quantity * capKg).toFixed(2)} kg
                </p>
              )}
            </div>

            <button className="productdetail-addbtn" onClick={handleAddToCart}>
              + AÑADIR AL CARRITO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
