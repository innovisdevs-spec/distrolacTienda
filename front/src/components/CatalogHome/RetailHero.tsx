import { useEffect, useRef, useState } from 'react';
import './campaign-hero.css';
type Photo = {src:string;name:string};
type Props = {cheeses:Photo[];coldcuts:Photo[];onCatalog:()=>void;onFiambres:()=>void};
const groups = [
 [{src:'santamaria',name:'Cremoso Santa María'}, {src:'ramolac',name:'Cremoso Ramolac'}, {src:'portsalut',name:'Port Salut Ramolac'}],
 [{src:'131',name:'Paleta 131 Piamontesa'}, {src:'cagnoli',name:'Jamón cocido Cagnoli'}, {src:'chacra',name:'Salame Milán Chacra 43'}],
];
export default function RetailHero({onCatalog}:Props) {
 const [slide,setSlide]=useState(0),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[reduced,setReduced]=useState(true),[interaction,setInteraction]=useState(0);
 const touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(q.matches);sync();q.addEventListener('change',sync);return()=>q.removeEventListener('change',sync);},[]);
 useEffect(()=>{if(hover||focus||reduced)return;const id=window.setInterval(()=>{if(!document.hidden)setSlide(n=>1-n);},6500);return()=>clearInterval(id);},[hover,focus,reduced,interaction]);
 const choose=(n:number)=>{setSlide(n);setInteraction(n=>n+1);};
 return <section className="campaign-carousel" aria-label="Novedades de Distrolac" aria-roledescription="carrusel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocus(false);}} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};setInteraction(n=>n+1);}} onTouchEnd={e=>{const p=touch.current;touch.current=null;if(p){const dx=e.changedTouches[0].clientX-p.x,dy=e.changedTouches[0].clientY-p.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))choose(1-slide);}}}>
 {[0,1].map(n=><div className="campaign-slide" hidden={slide!==n} key={n} role="group" aria-label={`${n+1} de 2: ${n?'Fiambres':'Quesos'}`}>
  <div className={`campaign-native ${n?'campaign-coldcuts':'campaign-cheeses'}`}>
   <div className="campaign-copy">
    <h2>{n?<>Pedilo esta noche.<br/><strong>Recibilo mañana.</strong></>:<>Tus compras al<br/><strong>precio más bajo</strong></>}</h2>
    <p>{n?<>Todo para tu casa o negocio.<br/><b>Pagá al recibir.</b></>:<>Todo para tu negocio,<br/>en un solo lugar.</>}</p>
    <button type="button" className="campaign-cta" onClick={onCatalog}>{n?'Armar mi pedido':'Ver catálogo'}<span aria-hidden="true">→</span></button>
    {n===1&&<small>Entregas en Gran Mendoza</small>}
   </div>
   <div className="campaign-products" aria-label={n?'Fiambres seleccionados':'Quesos seleccionados'}>
    <span className="campaign-ribbon" aria-hidden="true"/>
    <span className="campaign-stage" aria-hidden="true"/>
    {groups[n].map((p,i)=><img key={p.src} className={`campaign-pack campaign-pack-${i}`} src={`/campaign-crisp/${p.src}.webp`} alt={p.name} width="800" height={p.src==='santamaria'||p.src==='portsalut'||p.src==='chacra'?667:602} loading="eager" decoding="async"/>)}
   </div>
  </div>
 </div>)}
 <div className="campaign-dots">{[0,1].map(n=><button key={n} type="button" aria-label={`Mostrar banner de ${n?'fiambres':'quesos'}`} aria-pressed={slide===n} onClick={()=>choose(n)}><span/></button>)}</div>
 </section>;
}
