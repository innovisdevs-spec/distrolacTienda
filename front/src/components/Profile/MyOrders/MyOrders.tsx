import { formatMoney } from "../../../utils/money";
// src/components/MyOrders/MyOrders.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Table, Button, Container, Modal } from "react-bootstrap";
import AddIcon from "@mui/icons-material/Add";
import { RootState } from "../../../types";
import "./MyOrders.css";
import Breadcrums from "../../Breadcrumbs/Breadcrums";
import Spinner from "../../Spinner/Spinner";

const BASE_URL = import.meta.env.VITE_BACK_APP_URI;

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  _id: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    comments?: string;
  };
  orderItems: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  orderDate: string;
  createdAt: string;
}

interface Balance {
  _id: string;
  createdAt: string;
  resultingBalance: number;
  previousBalance: number;
  amount: number;
  operation: string;
  reason: string;
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);

  const { userInfo } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOrderId = searchParams.get('pedido');
  useEffect(() => {
    if (!requestedOrderId) return;
    const order = orders.find(item => item._id === requestedOrderId);
    if (order) { setSelectedOrder(order); setShowModal(true); }
  }, [orders, requestedOrderId]);
  const closeOrderDetail = () => {
    setShowModal(false);
    if (requestedOrderId) { const next = new URLSearchParams(searchParams); next.delete('pedido'); setSearchParams(next, {replace:true}); }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/store/orders/myorders`, {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar los pedidos");
        }

        const data = await response.json();
        console.log("data ordenes", data);
        setOrders(data);
      } catch (error) {
        setError("Error al cargar tus pedidos");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBalances = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/balancemovements/${userInfo?.email}`,
          {
            headers: {
              Authorization: `Bearer ${userInfo?.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        console.log("data balances", data.balanceMovements);
        setBalances(data.balanceMovements);
      } catch (error) {
        setError("Error al cargar tus pedidos");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo?.token) {
      fetchOrders();
      fetchBalances();
    }
  }, [userInfo]);

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const OrderDetailModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        show={showModal}
        onHide={closeOrderDetail}
        size="lg"
        className="order-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalle del pedido</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{overflowWrap:'anywhere'}}>Referencia: <strong>{selectedOrder._id}</strong></p>
          <div className="order-detail-section">
            <h5>Información del Cliente</h5>
            <p>
              <strong>Nombre:</strong> {selectedOrder.customerInfo.firstName}{" "}
              {selectedOrder.customerInfo.lastName}
            </p>
            <p>
              <strong>Email:</strong> {selectedOrder.customerInfo.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {selectedOrder.customerInfo.phone}
            </p>
            <p>
              <strong>Dirección:</strong> {selectedOrder.customerInfo.address}
            </p>
            {selectedOrder.customerInfo.comments && (
              <p>
                <strong>Comentarios:</strong>{" "}
                {selectedOrder.customerInfo.comments}
              </p>
            )}
          </div>

          <div className="order-detail-section mt-4">
            <h5>Productos</h5>
            <Table responsive className="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.orderItems.map((item, index) => (
                  <tr key={index}>
                    <td data-label="Producto">
                      <div className="product-info">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="product-image"
                        />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td data-label="Cantidad">{item.quantity}</td>
                    <td data-label="Precio Unit.">{formatMoney(item.price)}</td>
                    <td data-label="Subtotal">
                      {formatMoney((item.quantity * item.price))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="order-detail-section mt-4">
            <h5>Resumen del Pedido</h5>
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatMoney(selectedOrder.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Envío:</span>
                <span>
                  {selectedOrder.shippingCost === 0
                    ? "Gratis"
                    : formatMoney(selectedOrder.shippingCost)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatMoney(selectedOrder.total)}</span>
              </div>
            </div>
          </div>

          <div className="order-detail-section mt-4">
            <p>
              <strong>Fecha del pedido:</strong>{" "}
              {new Date(selectedOrder.orderDate).toLocaleDateString()}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeOrderDetail}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const BalanceDetailModal = () => {
    if (!selectedBalance) return null;

    return (
      <Modal
        show={showBalanceModal}
        onHide={() => setShowBalanceModal(false)}
        size="lg"
        className="order-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalle de movimiento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="order-detail-section">
            <h5>Información del Movimiento</h5>
            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(selectedBalance?.createdAt ?? "").toLocaleDateString()}
            </p>
            <p>
              <strong>Tipo:</strong>{" "}
              {selectedBalance?.operation === "payment" ? "Pago" : "Pedido"}
            </p>
            <p>
              <strong>Saldo anterior:</strong>{" "}
              {formatMoney(selectedBalance?.previousBalance)}
            </p>
            <p>
              <strong>Monto:</strong> {formatMoney(selectedBalance?.amount)}
            </p>
            <p>
              <strong>Saldo resultante:</strong>{" "}
              {formatMoney(selectedBalance?.resultingBalance)}
            </p>
            <p>
              <strong>Razón:</strong> {selectedBalance?.reason}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBalanceModal(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  if (loading) {
    return (
      <>
        <Spinner />
      </>
    );
  }

  if (error) {
    return (
      <Container className="mt-4 mb-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <div className="my-orders-full-container">
      <div className="my-orders-container">
        <div className="breadcrum-container">
          <Breadcrums items={[{ label: "Mis pedidos" }]} />
        </div>
        <div className="red-underline">
          <h1 className="cart-title">MIS PEDIDOS</h1>
        </div>
        {orders.length === 0 ? (
          <div className="text-center mt-4 mb-4">
            <p>No tienes pedidos realizados aún.</p>
            <Button
              onClick={() => navigate("/productos")}
              className="btn-orders"
            >
              Ir a Productos
            </Button>
          </div>
        ) : (
          <>
            <Table
              striped
              bordered
              hover
              responsive
              className="orders-table mt-3"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Dirección de Entrega</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td data-label="Fecha">
                      {new Date(order.orderDate).toLocaleDateString()}
                      <small style={{display:'block',overflowWrap:'anywhere'}}>Ref. {order._id}</small>
                    </td>
                    <td data-label="Dirección de Entrega">
                      {`${order.customerInfo?.address}` || ""}
                    </td>
                    <td data-label="Total">{formatMoney(order.total)}</td>
                    <td data-label="Acciones">
                      <Button
                        size="sm"
                        onClick={() => handleShowDetails(order)}
                        className="detail-button"
                        aria-label="Ver detalle del pedido"
                        title="Ver mas"
                      >
                        <AddIcon className="detail-button-icon" fontSize="small" />
                        <span>Ver mas</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <OrderDetailModal />
          </>
        )}
        <div className="balances-container">
          <div className="red-underline">
            <h1 className="cart-title history-title">HISTORIAL DE MOVIMIENTOS</h1>
          </div>
          {balances?.length === 0 || !balances ? (
            <div className="text-center mt-4">
              <p>No tienes movimientos registrados.</p>
            </div>
          ) : (
            <>
              <Table
                striped
                bordered
                hover
                responsive
                className="balances-table mt-3"
              >
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Saldo anterior</th>
                    <th>Monto</th>
                    <th>Saldo Resultante</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {balances?.map((balance, index) => (
                    <tr
                      key={index}
                      className={
                        balance.operation === "payment"
                          ? "movement-payment"
                          : "movement-order"
                      }
                    >
                      <td data-label="Fecha">
                        {new Date(balance.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        data-label="Tipo"
                        className={
                          balance.operation === "payment"
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        {balance.operation === "order" ? "Pedido" : "Pago"}
                      </td>
                      <td data-label="Saldo anterior" className="movement-amount">
                        {formatMoney(balance.previousBalance)}
                      </td>
                      <td
                        data-label="Monto"
                        className={`movement-amount ${balance.amount < 0 ? "text-danger" : "text-success"}`}
                      >
                        {formatMoney(balance.amount)}
                      </td>
                      <td data-label="Saldo Resultante" className="movement-amount movement-total">
                        {formatMoney(balance.resultingBalance)}
                      </td>
                      <td data-label="Acciones">
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowBalanceModal(true);
                            setSelectedBalance(balance);
                          }}
                          className="detail-button"
                          aria-label="Ver detalle del movimiento"
                          title="Ver mas"
                        >
                          <AddIcon className="detail-button-icon" fontSize="small" />
                          <span>Ver mas</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <BalanceDetailModal />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
