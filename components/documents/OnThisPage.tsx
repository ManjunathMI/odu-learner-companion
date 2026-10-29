'use client';
import {useEffect,useState,useRef} from 'react';
export type OutlineItem={id:string;title:string;level:number};
export default function OnThisPage({headings}:{headings:OutlineItem[]}){
 const [active,setActive]=useState('');
 const details=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const viewport=window.matchMedia('(max-width:1000px)');const resize=()=>{if(details.current)details.current.open=!viewport.matches;};resize();viewport.addEventListener('change',resize);return()=>viewport.removeEventListener('change',resize);},[]);
 useEffect(()=>{
  const elements=headings.map(item=>document.getElementById(item.id)).filter((item):item is HTMLElement=>Boolean(item));
  function update(){let current=elements[0]?.id??'';for(const element of elements){if(element.getBoundingClientRect().top<=160)current=element.id;}setActive(current);}
  update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);
 },[headings]);
 if(!headings.length)return null;
 return <nav aria-label="On this page" className="outline"><details ref={details} open><summary>On this page</summary><ul>{headings.map(item=><li key={item.id} style={{paddingLeft:item.level===3?'0.8rem':0}}><a href={`#${item.id}`} aria-current={active===item.id?'location':undefined}>{item.title}</a></li>)}</ul></details><style jsx>{`.outline{font-size:.85rem}summary{font-weight:700}ul{list-style:none;padding:0;border-left:1px solid var(--border-color)}li{margin:.65rem 0}a{display:block;padding-left:.8rem;color:var(--text-secondary);text-decoration:none}a[aria-current]{color:var(--accent-primary);font-weight:700;border-left:2px solid var(--accent-primary)}`}</style></nav>;
}
