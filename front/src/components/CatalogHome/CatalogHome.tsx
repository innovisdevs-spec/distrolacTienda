import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductCard from "../Products/ProductsList/ProductCard";
import "../Products/ProductsList/ProductList.css";

type Product = { _id: string; name: string; images?: string[]; price?: number; state?: boolean; description?: string; category?: {name: string}; typeOfFractionation?: "No" | "Unitario" | "Pesado"; cap?: number };
type Category = { _id: string; name: string; categories: {name: string}[] };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const api = import.meta.env.VITE_BACK_APP_URI;

export default function CatalogHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => { try { const cart = JSON.parse(localStorage.getItem("cart") || "[]"); setCount(Array.isArray(cart) ? cart.length : 0); } catch { setCount(0); } };
    sync(); window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    Promise.all([axios.get(`${api}/store/products`), axios.get(`${api}/items`)])
      .then(([p, c]) => {
        if (!active) return;
        const items: Category[] = c.data;
        setProducts(p.data.filter((item: Product) => item.state === true));
        setCategories(items.filter(group => group.categories.some(sub => p.data.some((item: Product) => item.state === true && item.category?.name === sub.name))));
        setSelected(items.find(item => normalize(item.name) === "quesos")?._id || "");
      }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  const category = categories.find(item => item._id === selected);
  const visible = useMemo(() => products.filter(p => {
    if (query.trim()) return normalize(p.name).includes(normalize(query.trim()));
    if (category && !category.categories.some(c => c.name === p.category?.name)) return false;
    return !kind || p.category?.name === kind;
  }), [products, category, query, kind]);
  const cheeses = products.filter(p => /^queso.*(cremoso|port salut)/i.test(p.name) && p.images?.[0]).slice(0, 3);
  const choose = (id: string) => { setSelected(id); setQuery(""); setKind(""); setLimit(12); };
  return <div className="catalog-home">
    <div className="catalog-search-wrap">
      <label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar productos" placeholder="Buscar productos o marcas…" value={query} onChange={e => { setQuery(e.target.value); setLimit(12); }} /><a href="#catalog-products" aria-label="Ver resultados de búsqueda">Buscar</a></label>
      <span className="catalog-search-note">Todo para tu negocio, en un solo lugar</span>
    </div>
    <nav className="catalog-tabs" aria-label="Categorías de productos">
      <button className={!selected && !query ? "selected" : ""} aria-pressed={!selected && !query} onClick={() => choose("")}>Todos</button>
      {[...categories].sort((a,b) => (normalize(a.name) === "quesos" ? -1 : normalize(b.name) === "quesos" ? 1 : 0)).map(c => <button key={c._id} className={selected === c._id && !query ? "selected" : ""} aria-pressed={selected === c._id && !query} onClick={() => choose(c._id)}>{c.name}</button>)}
    </nav>
    {!query && <section className="catalog-hero" aria-label="Bienvenido a Distrolac">
      <div className="catalog-hero-copy"><span className="catalog-eyebrow">TU MAYORISTA DE CONFIANZA</span><h1>Tus compras al<br/><em>precio más bajo</em></h1><p>Todo lo que necesitás para abastecer tu negocio.</p><a className="catalog-primary" href="#catalog-products">Explorar productos <span aria-hidden="true">→</span></a><div className="catalog-benefits"><span>Gran variedad</span><span>Compra simple</span><span>Atención cercana</span></div></div>
      <div className="catalog-hero-images" aria-hidden="true">{cheeses.map(p => <img key={p._id} src={p.images![0]} alt="" />)}<span className="catalog-hero-seal">Elegí calidad.<br/>Elegí Distrolac.</span></div>
    </section>}
    <section id="catalog-products" className="catalog-products" aria-busy={loading}>
      <div className="catalog-section-heading"><div><span className="catalog-eyebrow">NUESTRO CATÁLOGO</span><h2>{query ? `Resultados para “${query}”` : category ? `${category.name} para tu negocio` : "Encontrá tus productos"}</h2><p role="status">{loading ? "Cargando productos…" : `${visible.length} productos disponibles`}</p></div>
        {category && !query && <label className="catalog-filter">Filtrar por tipo<select value={kind} onChange={e => { setKind(e.target.value); setLimit(12); }}><option value="">Todos los tipos</option>{category.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>}
      </div>
      {error ? <div className="catalog-message" role="alert">No pudimos cargar el catálogo. <button onClick={() => setAttempt(n => n+1)}>Volver a intentar</button></div> : loading ? <div className="catalog-grid">{[0,1,2,3].map(n => <div className="catalog-skeleton" key={n} />)}</div> : <>
        <div className="catalog-grid">{visible.slice(0,limit).map(p => <ProductCard key={p._id} id={p._id} title={p.name} image={p.images?.[0]} price={p.price} description={p.description || ""} categoryName={p.category?.name || ""} typeOfFractionation={p.typeOfFractionation} cap={p.cap} />)}</div>
        {!visible.length && <div className="catalog-message">No encontramos productos con esa selección. <button onClick={() => choose("")}>Ver todos los productos</button></div>}
        {visible.length > limit && <button className="catalog-more" onClick={() => setLimit(n => n+12)}>Ver más productos ↓</button>}
      </>}
    </section>
    <section className="catalog-help"><div><h2>Tu próximo pedido empieza acá</h2><p>Elegí tus productos y revisá las cantidades en el carrito.</p></div><Link to="/comocomprar">Cómo comprar →</Link></section>
    <Link className="catalog-mobile-cart" to="/carrito">Ver mi pedido <span>{count} {count === 1 ? "producto" : "productos"} →</span></Link>
  </div>;
}
