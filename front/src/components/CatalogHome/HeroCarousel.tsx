import deliBoard from "../../assets/hero-fiambres-tabla.webp";
import { ReactNode, useEffect, useRef, useState } from 'react';
import './hero-carousel.css';
export default function HeroCarousel({children, onFiambres}:{children:ReactNode;onFiambres:()=>void}) {
 const [slide,setSlide]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false),[reduced,setReduced]=useState(true);
 const touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 useEffect(()=>{if(paused||hover||reduced)return;const t=window.setInterval(()=>{if(!document.hidden)setSlide(n=>1-n);},6000);return()=>window.clearInterval(t);},[paused,hover,reduced]);
 const select=(n:number)=>{setSlide(n);setPaused(true);};
 return <section className="hero-carousel" aria-label="Novedades de Distrolac" aria-roledescription="carrusel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setPaused(true)} onTouchStart={e=>{setPaused(true);touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{const start=touch.current;touch.current=null;if(start){const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))select(1-slide);}}}>
 <div className="hero-carousel-stage">
 <div className="hero-carousel-slide" hidden={slide!==0} role="group" aria-label="1 de 2: Quesos">{children}</div>
 <div className="hero-carousel-slide" hidden={slide!==1} role="group" aria-label="2 de 2: Fiambres y entrega mañana"><section className="v2-hero hero-next-day"><div className="v2-hero-copy"><span className="hero-next-label">FIAMBRES PARA TU NEGOCIO</span><h2>Pedilo esta noche.<br/><em>Recibilo mañana.</em></h2><p>Todo para tu casa o negocio.<br/><strong>Pagá al recibir.</strong></p><button className="v2-cta" onClick={onFiambres}>Ver fiambres <span aria-hidden="true">→</span></button><small>Entregas en Gran Mendoza</small></div><img className="hero-deli-board" src={deliBoard} alt="Tabla con jamón, bondiola y salame"/></section></div>
 </div><div className="hero-carousel-controls"><button aria-label="Mostrar banner de quesos" aria-pressed={slide===0} onClick={()=>select(0)}>1</button><button aria-label="Mostrar banner de fiambres" aria-pressed={slide===1} onClick={()=>select(1)}>2</button>{!reduced&&<button className="hero-play" onClick={()=>setPaused(p=>!p)}>{paused?'Reanudar':'Pausar'}</button>}</div>
 </section>;
}
