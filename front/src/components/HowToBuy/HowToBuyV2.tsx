import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Map from '../../assets/mapawork.png';

const whatsapp = 'https://wa.me/5492616605818?text=Hola!%20Quer%C3%ADa%20hacer%20una%20consulta%20%F0%9F%98%8A';
const steps = [
  ['Elegí tus productos', 'Recorré el catálogo, elegí las cantidades y agregá lo que necesitás al carrito.'],
  ['Completá tus datos', 'Ingresá o creá tu cuenta y completá la dirección de tu casa o negocio.'],
  ['Confirmá tu pedido', 'Revisá los productos y tus datos antes de confirmar. Coordinamos la entrega con vos.'],
  ['Recibí y pagá', 'El pago se realiza cuando recibís la mercadería. No te cobramos por adelantado.'],
];
export default function HowToBuyV2() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return <main className="buy-guide">
    <nav className="buy-breadcrumb" aria-label="Ubicación"><Link to="/" onClick={() => window.scrollTo(0, 0)}>Inicio</Link><span aria-hidden="true">/</span><span>Cómo comprar</span></nav>
    <section className="buy-hero" aria-labelledby="buy-title">
      <div><span className="buy-eyebrow">TU PEDIDO, PASO A PASO</span><h1 id="buy-title">Elegís hoy.<br/><em>Pagás al recibir.</em></h1><p>Comprá para tu casa o negocio, sin pagos por adelantado.</p><Link className="buy-primary" to="/" onClick={() => window.scrollTo(0, 0)}>Empezar mi pedido <span aria-hidden="true">→</span></Link></div>
      <div className="buy-promise"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m32 5 22 9v17c0 13-22 25-22 25S10 44 10 31V14L32 5Z"/><path d="m22 30 8 8 15-18" strokeLinecap="round" strokeLinejoin="round"/></svg><strong>Primero lo recibís.<br/>Después pagás.</strong><p>Aplica a todos los pedidos de la tienda.</p></div>
    </section>
    <section className="buy-steps-section" aria-labelledby="buy-steps-title"><div className="buy-section-heading"><span className="buy-eyebrow">ASÍ DE SIMPLE</span><h2 id="buy-steps-title">Tu compra en 4 pasos</h2></div><ol className="buy-steps">{steps.map(([title, text], i) => <li key={title}><span className="buy-step-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
    <section className="buy-info-grid" aria-label="Pago y entrega"><article><span className="buy-eyebrow">SIN ANTICIPOS</span><h2>Pagá cuando llegue</h2><p>No cobramos nada hasta que recibas tu pedido en tu casa o negocio.</p><p>En tu domicilio podés pagar en <strong>efectivo o por transferencia bancaria</strong>.</p><p>Los pagos con <strong>tarjeta se aceptan únicamente en el local</strong>.</p></article><article><span className="buy-eyebrow">ENTREGA COORDINADA</span><h2>Contanos dónde lo recibís</h2><p>Completá tu dirección con calle, número y localidad. Nuestro equipo coordina la entrega con vos.</p><p>¿Tenés dudas sobre tu zona o el reparto? <a href={whatsapp} target="_blank" rel="noopener noreferrer">Consultanos por WhatsApp</a>.</p></article></section>
    <section className="buy-questions" aria-labelledby="buy-faq-title"><h2 id="buy-faq-title">Antes de confirmar, te contamos</h2>
      <details><summary>¿Tengo que pagar para confirmar el pedido?</summary><p>No. En todos los pedidos de la tienda pagás al recibir la mercadería en tu casa o negocio. No cobramos nada por adelantado.</p></details>
      <details><summary>¿Cómo se calculan los productos por peso?</summary><p>El precio se indica por kilo y el carrito muestra un importe estimado según el peso aproximado. El importe final se ajusta al peso real.</p></details>
      <details><summary>¿Por qué me piden el DNI?</summary><p>Lo usamos para identificar tu cuenta y generar tu alias de transferencias. Si ya tenés cuenta, ingresá o recuperá tu contraseña: no hace falta crear otra.</p></details>
      <details><summary>¿Puedo revisar las cantidades antes de confirmar?</summary><p>Sí. En el carrito podés revisar los productos, cambiar las cantidades y quitar lo que no necesites antes de continuar.</p><Link to="/carrito">Ir a mi carrito →</Link></details>
      <details><summary>¿Hacen entregas en mi zona?</summary><p>Consultá el mapa de cobertura que figura en la tienda. Si necesitás confirmar tu dirección o el día de reparto, escribinos antes de hacer el pedido.</p><img className="buy-map" src={Map} alt="Mapa de cobertura de entregas de Distrolac" loading="lazy"/><a href={whatsapp} target="_blank" rel="noopener noreferrer">Consultar mi zona por WhatsApp →</a></details>
    </section>
    <section className="buy-bottom"><div><h2>¿Armamos tu próximo pedido?</h2><p>Elegí lo que necesitás. Pagás cuando lo recibís.</p></div><Link className="buy-primary" to="/" onClick={() => window.scrollTo(0, 0)}>Ver catálogo <span aria-hidden="true">→</span></Link></section>
  </main>;
}
