import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import './store-options.css';

export function ZoneSelector() {
  const [open, setOpen] = useState(false);
  const [uco, setUco] = useState(false);
  return <><div className="store-zone"><span><span aria-hidden="true">📍</span> Zona de compra: <strong>Gran Mendoza</strong></span><button onClick={() => { setUco(false); setOpen(true); }}>Cambiar</button></div>
    <Modal show={open} onHide={() => setOpen(false)} centered><Modal.Header closeButton><Modal.Title>¿Dónde querés comprar?</Modal.Title></Modal.Header><Modal.Body>
      {!uco ? <div className="store-zone-choices"><button onClick={() => setOpen(false)}><strong>Gran Mendoza</strong><span>Seguir comprando en esta tienda</span></button><button onClick={() => setUco(true)}><strong>Valle de Uco</strong><span>Local de Tunuyán · Pedidos por WhatsApp</span></button></div> : <div className="store-zone-detail"><h3>Comprá en nuestro local de Tunuyán</h3><p>Consultá sus productos, precios y zonas de entrega directamente con el equipo.</p><a className="store-whatsapp-link" href={'https://wa.me/5492622647552?text='+encodeURIComponent('Hola! Vengo desde la web de Distrolac y quisiera consultar precios y hacer un pedido en el local de Tunuyán.')} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a><button className="store-back" onClick={() => setUco(false)}>Volver a las zonas</button></div>}
    </Modal.Body></Modal></>;
}

function buildOrderMessage(items: unknown): string {
  const lines = ['Hola! Vengo desde la tienda de Distrolac Gran Mendoza y quisiera coordinar este pedido:'];
  if (Array.isArray(items)) for (const item of items) {
    if (!item || typeof item.title !== 'string' || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) continue;
    lines.push(`- ${Number(item.quantity)} ${item.typeOfFractionation === 'Pesado' ? 'horma(s)' : 'unidad(es)'} de ${item.title.replace(/[\r\n]+/g, ' ').slice(0,250)}`);
  }
  if (lines.length === 1) return 'Hola! Vengo desde la tienda de Distrolac Gran Mendoza y quisiera hacer un pedido por WhatsApp.';
  return lines.join('\n')+'\n\nPor favor, confirmen disponibilidad, importe final y entrega. Entiendo que este mensaje no confirma automáticamente el pedido en el sistema.';
}

export function WhatsAppOrder() {
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const prepare = () => { let cart: unknown = []; try { cart=JSON.parse(localStorage.getItem('cart') || '[]'); } catch { cart = []; } setMessage(buildOrderMessage(cart)); setOpen(true); };
  const tooLong = encodeURIComponent(message).length > 6500;
  return <aside className="store-order-help"><strong>¿Preferís pedir por WhatsApp?</strong><p>También podemos ayudarte sin crear una cuenta.</p><button type="button" className="store-whatsapp-link" onClick={prepare}>Continuar mi pedido por WhatsApp</button><small>Gran Mendoza · Revisá el resumen antes de enviarlo.</small>
    <Modal show={open} onHide={() => setOpen(false)} centered><Modal.Header closeButton><Modal.Title>Tu pedido por WhatsApp</Modal.Title></Modal.Header><Modal.Body><p>Se enviarán únicamente los productos y cantidades que aparecen abajo. No incluimos DNI, contraseña ni datos del formulario.</p><textarea aria-label="Resumen del pedido para WhatsApp" className="store-order-preview" value={message} readOnly/><p>El carrito se conserva. El pedido queda pendiente de que lo envíes por WhatsApp y nuestro equipo lo confirme; no se registra automáticamente en el sistema.</p>{tooLong ? <p>Tu pedido es largo: copiá el resumen y pegalo en la conversación.</p> : null}<a className="store-whatsapp-link" href={'https://wa.me/5492616605818?text='+encodeURIComponent(tooLong ? 'Hola! Quiero enviar un pedido de la tienda. Voy a pegar el detalle a continuación.' : message)} target="_blank" rel="noopener noreferrer">Abrir WhatsApp de Gran Mendoza</a></Modal.Body></Modal>
  </aside>;
}
