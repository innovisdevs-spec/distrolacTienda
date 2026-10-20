import { formatMoney } from "../../../../utils/money";
import PresentationPicker from '../../../PresentationPicker';
import { canChooseHalf, addPresentation } from '../../../../utils/presentation';
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ProductDetail.css";
import "./ProductDetailLayout.css";
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
  const [half, setHalf] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState("");
  const [alertEvent, setAlertEvent] = useState(false);

  const capKg = normalizeCapToKg(product?.cap);
  const isPesado = product?.typeOfFractionation === "Pesado" && capKg > 0;

  useEffect(() => {
    setHalf(false); setQuantity(1); setLoading(true);
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
    if (!Number.isFinite(quantity) || quantity <= 0 || (canChooseHalf(product) && !half && !Number.isInteger(quantity))) {
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

    const previous = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    let next;
    try { next = canChooseHalf(product) ? addPresentation(previous, quantity, half) : previous + quantity; }
    catch { setAlertMessage('Revisá la cantidad que ya tenés en el carrito.'); setAlertStatus('error'); setShowAlert(true); return; }
    if (existingIndex >= 0) {
      cart[existingIndex].quantity = next;
    } else {
      cart.push({
        id: product._id,
        title: product.name,
        image: product.images?.[0],
        quantity: next,
        price: product.price || 0, // PRECIO POR KG SI ES PESADO
        cap: capKg, // KG POR HORMA NORMALIZADO
        typeOfFractionation: product.typeOfFractionation,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setQuantity(1);

    setAlertMessage(next === previous ? 'Ya tenés una media horma en tu pedido' : 'Producto agregado al carrito');
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

          {canChooseHalf(product) && <><PresentationPicker half={half} onChange={setHalf} name={product.name}/>{half && <p className="dl-half-hint">Una media horma por producto · aprox. {capKg / 2} kg</p>}</>}
          <div className="productdetail-buttons-container">
            <div>
              <p>Cantidad ({half ? 'Media horma' : isPesado ? "Hormas enteras" : "Unidades"})</p>

              <div className="productdetail-quantityline">
                {isPesado ? (
                  <input
                    type="number"
                    step={canChooseHalf(product) ? 1 : 0.1}
                    min={1}
                    disabled={half}
                    value={half ? 1 : quantity === 0 ? "" : quantity}
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
                  Total aprox: {((half ? 0.5 : quantity) * capKg).toFixed(2)} kg
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
