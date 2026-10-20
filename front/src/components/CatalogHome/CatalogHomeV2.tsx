import { sameCategory } from "./categoryIdentity";
import PresentationPicker from '../PresentationPicker';
import { canChooseHalf, addPresentation } from '../../utils/presentation';
import RetailHero from "./RetailHero";
import { useEffect, useMemo, useState } from 'react';

import { Link, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { normalizeCapToKg } from '../../utils/weight';

import PaymentNotice from '../PaymentNotice/PaymentNotice';

type Product = { _id: string; name: string; images?: string[]; price?: number; state?: boolean; description?: string; category?: { _id: string; name: string }; typeOfFractionation?: 'No' | 'Unitario' | 'Pesado'; cap?: number };
type Category = { _id: string; name: string; categories: { _id: string; name: string }[] };
type CartItem = { id: string; title: string; image: string; quantity: number; price: number; typeOfFractionation?: Product['typeOfFractionation']; cap?: number };
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const brands = ['Ramolac', 'El Jumial', 'Santa María', 'La Quesera', 'La Ausonia', 'Santa Ana', 'Spalen', 'Brescialat', '3L', 'LCA'];
const brandOf = (p: Product) => brands.find(b => norm(p.name).includes(norm(b))) || '';
const shortName = (p: Product) => p.name.replace(/\s*\(.*?\)/g, '').replace(/\s*precio[_ ]*x\s*kg.*$/i, '').replace(/\s*\*?oferta.*$/i, '').replace(/\s*promo.*$/i, '').replace(/^queso\s+/i, '').trim();
const rank = (p: Product) => {
  const s = norm(p.name);
  if (s.startsWith('queso cremoso ramolac')) return 0;
  if (s.startsWith('queso cremoso el jumial')) return 1;
  if (s.includes('port salut ramolac')) return 2;
  if (s.includes('port salut santa maria')) return 3;
  return 10;
};
function CartIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 3h3l3 13h11l3-10H6M9 20h.01M18 20h.01" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function Card({ p }: { p: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [half, setHalf] = useState(false);
  const [notice, setNotice] = useState('');
  const [badImage, setBadImage] = useState(false);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 2400); return () => window.clearTimeout(timer); }, [notice]);
  const add = () => {
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(cart)) throw new Error('Invalid cart');
      const existing = cart.find(item => item.id === p._id);
      const previous = existing?.quantity || 0;
      const next = canChooseHalf(p) ? addPresentation(previous, quantity, half) : previous + quantity;
      if (existing) existing.quantity = next;
      else cart.push({ id: p._id, title: p.name, image: p.images?.[0] || '', quantity:next, price: p.price || 0, typeOfFractionation: p.typeOfFractionation, cap: p.typeOfFractionation === 'Pesado' ? normalizeCapToKg(p.cap) : undefined });
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
      setNotice(next === previous ? 'Ya tenés una media horma en tu pedido' : 'Agregado a tu pedido');
    } catch { setNotice('No se pudo agregar. Revisá tu carrito.'); }
  };
  const weighed = p.typeOfFractionation === 'Pesado';
  const kg = weighed ? normalizeCapToKg(p.cap) : undefined;
  return <article className="v2-card" aria-label={p.name}>
    <Link className="v2-product-link" to={'/productos/' + p._id} state={{ id:p._id, title:p.name, image:p.images?.[0], description:p.description, price:p.price, categoryName:p.category?.name || '', typeOfFractionation:p.typeOfFractionation, cap:p.cap }} title={p.name}>
      <div className="v2-product-photo">{!badImage && p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" onError={() => setBadImage(true)} /> : <span>Imagen no disponible</span>}</div>
      <h3>{shortName(p)}</h3><span className="v2-brand">{brandOf(p) || p.category?.name}</span>
      <span className="v2-unit">{weighed && kg ? `Horma aprox. ${kg} kg` : 'Presentación según producto'}</span>
    </Link>
    <div className="v2-price"><span>{weighed ? 'Precio por kg' : 'Precio'}</span><strong>{typeof p.price === 'number' ? p.price.toLocaleString('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:2 }) : 'Consultar'}</strong></div>
    {canChooseHalf(p) && <><PresentationPicker half={half} onChange={setHalf} name={p.name}/>{half && <small className="dl-half-hint">1 media · aprox. {Number(kg)/2} kg · máximo una</small>}</>}
    <div className="v2-card-actions"><div className="v2-stepper"><button type="button" aria-label={'Restar ' + p.name} disabled={half || quantity <= 1} onClick={() => setQuantity(n => Math.max(1, n-1))}>−</button><output aria-label={'Cantidad de ' + p.name}>{half ? 1 : quantity}</output><button type="button" aria-label={'Sumar ' + p.name} disabled={half || quantity >= 99} onClick={() => setQuantity(n => Math.min(99, n+1))}>+</button></div><button type="button" className="v2-add" onClick={add} disabled={typeof p.price !== 'number'} aria-label={'Agregar ' + p.name}><CartIcon/>Agregar</button></div>
    <span className="v2-notice" role="status">{notice}</span>
  </article>;
}
export default function CatalogHomeV2() {
  const [products, setProducts] = useState<Product[]>([]), [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState(''), [brand, setBrand] = useState('');
  const [limit, setLimit] = useState(12), [loading, setLoading] = useState(true), [error, setError] = useState(false), [attempt, setAttempt] = useState(0), [count, setCount] = useState(0);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || location.state?.query || '';
  const setQuery = (value: string) => setSearchParams(value ? {q:value} : {}, {replace:true});
  useEffect(() => { setBrand(''); setLimit(12); }, [query]);
  useEffect(() => {
    const sync = () => { try { const cart = JSON.parse(localStorage.getItem('cart') || '[]'); setCount(Array.isArray(cart) ? cart.length : 0); } catch { setCount(0); } };
    sync(); window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    let active = true; setLoading(true); setError(false);
    const api = import.meta.env.VITE_BACK_APP_URI;
    Promise.all([axios.get(api+'/store/products'), axios.get(api+'/items')]).then(([p,c]) => {
      if (!active) return;
      const list: Product[] = p.data.filter((item: Product) => item.state === true);
      const groups: Category[] = c.data.filter((group: Category) => group.categories.some(sub => list.some(item => sameCategory(item.category, sub))));
      setProducts(list); setCategories(groups); setSelected(location.pathname === '/productos' ? '' : groups.find(g => norm(g.name)==='quesos')?._id || '');
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, location.pathname]);
  const category = categories.find(c => c._id === selected);
  const inCategory = useMemo(() => products.filter(p => query.trim() ? norm(p.name).includes(norm(query.trim())) : !category || category.categories.some(c => sameCategory(c, p.category))).sort((a,b) => rank(a)-rank(b)), [products,category,query]);
  const availableBrands = [...new Set(inCategory.map(brandOf).filter(Boolean))].sort();
  const visible = inCategory.filter(p => !brand || brandOf(p) === brand);
  const choose = (id: string) => { setSelected(id); setQuery(''); setBrand(''); setLimit(12); };
  const priority = ['quesos','fiambres','lacteos','congelados','limpieza'];
  const topCategories = priority.map(name => categories.find(c => norm(c.name) === name)).filter((c): c is Category => !!c);
  const others = categories.filter(c => !topCategories.includes(c));
  return <main className="catalog-v2">
    {!query && <RetailHero cheeses={products.filter(p=>categories.find(c=>norm(c.name)==='quesos')?.categories.some(c=>sameCategory(c,p.category))&&p.images?.[0]).sort((a,b)=>rank(a)-rank(b)).slice(0,3).map(p=>({src:p.images![0],name:p.name}))} coldcuts={products.filter(p=>categories.find(c=>norm(c.name)==='fiambres')?.categories.some(c=>sameCategory(c,p.category))&&/jamon|bondiola|salame/.test(norm(p.name))&&p.images?.[0]).sort((a,b)=>Number(!norm(a.name).includes('jamon cocido'))-Number(!norm(b.name).includes('jamon cocido'))).slice(0,3).map(p=>({src:p.images![0],name:p.name}))} onCatalog={()=>{choose('');document.getElementById('v2-products')?.scrollIntoView({behavior:'smooth'});}} onFiambres={()=>{choose(categories.find(c=>norm(c.name)==='fiambres')?._id||'');document.getElementById('v2-products')?.scrollIntoView({behavior:'smooth'});}}/>}
    <div className="v2-navrow"><nav aria-label="Categorías" className="v2-tabs">{topCategories.map(c => <button key={c._id} aria-pressed={selected === c._id && !query} onClick={() => choose(c._id)}>{norm(c.name)==='lacteos' ? 'Lácteos' : c.name.charAt(0)+c.name.slice(1).toLowerCase()}</button>)}<select aria-label="Más categorías" value={others.some(c => c._id === selected) ? selected : ''} onChange={e => choose(e.target.value)}><option value="">Más categorías</option>{others.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select><button aria-pressed={!selected && !query} onClick={() => choose('')}>Todos</button></nav><span className="v2-nav-promise">Todo para tu negocio<small>Variedad y atención cercana</small></span></div>
    <PaymentNotice showLink />
    <section id="v2-products" aria-busy={loading}><div className="v2-section-head"><h2>{query ? `Resultados para “${query}”` : category ? `${category.name.charAt(0)+category.name.slice(1).toLowerCase()} para tu negocio` : 'Productos para tu negocio'}</h2><label>Filtrar por marca:<select value={brand} onChange={e => { setBrand(e.target.value); setLimit(12); }}><option value="">Todas las marcas</option>{availableBrands.map(b => <option key={b}>{b}</option>)}</select></label></div>
      {error ? <div className="v2-empty" role="alert">No pudimos cargar los productos. <button onClick={() => setAttempt(n => n+1)}>Reintentar</button></div> : loading ? <div className="v2-grid">{[0,1,2,3].map(n => <div key={n} className="v2-loading"/>)}</div> : <><div className="v2-grid">{visible.slice(0,limit).map(p => <Card key={p._id} p={p}/>)}</div>{!visible.length && <div className="v2-empty">No encontramos productos. <button onClick={() => choose('')}>Ver todos</button></div>}{visible.length > limit && <button className="v2-more" onClick={() => setLimit(n => n+12)}>Ver más productos ↓</button>}</>}
    </section><Link className="v2-mobile-cart" to="/carrito"><CartIcon/>Ver mi pedido ({count})<span>→</span></Link>
  </main>;
}
