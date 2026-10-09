import { Link } from 'react-router-dom';

export default function PaymentNotice({ showLink = false }: { showLink?: boolean }) {
  return <aside className="delivery-payment-note" aria-label="Pago al recibir">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3 3 7v6c0 4 9 8 9 8s9-4 9-8V7l-9-4Z"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    <div><strong>Pagás al recibir</strong><p>En tu casa o negocio. No cobramos nada por adelantado.</p></div>
    {showLink && <Link to="/comocomprar">Cómo comprar <span aria-hidden="true">→</span></Link>}
  </aside>;
}
