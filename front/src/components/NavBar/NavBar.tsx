import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';
import { RootState } from '../../types';
import Logo from '../../assets/logo-catalogo.png';

function Icon({kind}:{kind:'search'|'person'|'cart'|'menu'}) {
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='search'?<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>:kind==='person'?<><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/></>:kind==='cart'?<><path d="M2 3h3l3 13h11l3-10H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></>:<path d="M3 5h18M3 12h18M3 19h18"/>}</svg>;
}
function cartCount(){try{const cart:unknown=JSON.parse(localStorage.getItem('cart')||'[]');return Array.isArray(cart)?cart.length:0;}catch{return 0;}}
export default function NavBar(){
 const location=useLocation(),navigate=useNavigate(),dispatch=useDispatch();
 const {userInfo}=useSelector((state:RootState)=>state.auth);
 const [menu,setMenu]=useState(false),[account,setAccount]=useState(false),[count,setCount]=useState(cartCount);
 const [query,setQuery]=useState(()=>new URLSearchParams(location.search).get('q')||'');
 const root=useRef<HTMLElement>(null),accountButton=useRef<HTMLButtonElement>(null),menuButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setQuery(new URLSearchParams(location.search).get('q')||'');setMenu(false);setAccount(false);},[location.pathname,location.search]);
 useEffect(()=>{const sync=()=>setCount(cartCount());window.addEventListener('storage',sync);window.addEventListener('cart:updated',sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('cart:updated',sync);};},[]);
 useEffect(()=>{const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target)){setMenu(false);setAccount(false);}};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
 const searchPath=(value:string)=>'/productos'+(value.trim()?'?q='+encodeURIComponent(value):'');
 return <header className="store-header" ref={root} onKeyDown={e=>{if(e.key==='Escape'){if(account)accountButton.current?.focus();else if(menu)menuButton.current?.focus();setAccount(false);setMenu(false);}}}>
  <div className="store-header-row">
   <Link to="/" className="store-logo" aria-label="Distrolac - Inicio"><img src={Logo} alt="Distrolac" width="240" height="72"/></Link>
   <form role="search" className="store-search" onSubmit={e=>{e.preventDefault();navigate(searchPath(query));}}><Icon kind="search"/><input type="search" aria-label="Buscar productos" placeholder="Buscar productos o marcas…" value={query} onChange={e=>{const value=e.target.value;setQuery(value);if(location.pathname==='/'||location.pathname==='/productos')navigate((location.pathname==='/'?'/':'/productos')+(value?'?q='+encodeURIComponent(value):''),{replace:true});}}/><button type="submit" aria-label="Buscar"><Icon kind="search"/></button></form>
   <div className="store-header-actions">
    <div className="store-account">{userInfo?<button ref={accountButton} className="store-icon-link" aria-label="Mi cuenta" aria-expanded={account} aria-controls="store-account-panel" onClick={()=>{setAccount(!account);setMenu(false);}}><Icon kind="person"/><span>Mi cuenta</span></button>:<Link className="store-icon-link" to="/login" aria-label="Mi cuenta"><Icon kind="person"/><span>Mi cuenta</span></Link>}
     {account&&userInfo&&<div id="store-account-panel" className="store-dropdown"><strong>Hola, {userInfo.username}</strong><Link to="/perfil">Mi perfil</Link><Link to="/mispedidos">Mis pedidos</Link><button onClick={()=>{dispatch(logout());setAccount(false);navigate('/login');}}>Cerrar sesión</button></div>}
    </div>
    <Link className="store-icon-link store-cart-link" to="/carrito" aria-label={`Mi pedido (${count} productos)`}><span className="store-cart-icon"><Icon kind="cart"/>{count>0&&<b>{count}</b>}</span><span>Mi pedido</span></Link>
    <button ref={menuButton} className="store-icon-link store-menu-toggle" aria-label={menu?'Cerrar menú':'Abrir menú'} aria-expanded={menu} aria-controls="store-main-menu" onClick={()=>{setMenu(!menu);setAccount(false);}}><Icon kind="menu"/></button>
   </div>
  </div>
  {menu&&<nav id="store-main-menu" className="store-main-menu" aria-label="Navegación principal"><Link to="/productos">Catálogo</Link><Link to="/comocomprar">Cómo comprar</Link><Link to="/sobrenosotros">Sobre nosotros</Link><Link to="/trabaja">Trabajá con nosotros</Link><Link to={userInfo?'/perfil':'/login'}>Mi cuenta</Link><Link to="/carrito">Mi pedido</Link></nav>}
 </header>;
}
