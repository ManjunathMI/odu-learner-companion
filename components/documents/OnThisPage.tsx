'use client';
import {useEffect,useState} from 'react';
export type OutlineItem={id:string;title:string;level:number};
export default function OnThisPage({headings}:{headings:OutlineItem[]}){
 const [active,setActive]=useState('');
 useEffect(()=>{
  const elements=headings.map(item=>document.getElementById(item.id)).filter((item):item is HTMLElement=>Boolean(item));
  function update(){let current=elements[0]?.id??'';for(const element of elements){if(element.getBoundingClientRect().top<=160)current=element.id;}setActive(current);}
  update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);
 },[headings]);
 if(!headings.length)return null;
 return <nav aria-label="On this page" className="outline"><details open><summary>On this page</summary><ul>{headings.map(item=><li key={item.id} style={{paddingLeft:item.level===3?'0.8rem':0}}><a href={`#${item.id}`} aria-current={active===item.id?'location':undefined}>{item.title}</a></li>)}</ul></details><style jsx>{`.outline{position:sticky;top:120px;font-size:.85rem;max-height:calc(100vh - 150px);overflow:auto}summary{font-weight:700}ul{list-style:none;padding:0;border-left:1px solid var(--border-color)}li{margin:.65rem 0}a{display:block;padding-left:.8rem;color:var(--text-secondary);text-decoration:none}a[aria-current]{color:var(--accent-primary);font-weight:700;border-left:2px solid var(--accent-primary)}@media(max-width:1100px){.outline{position:static;max-height:none;margin-bottom:1.5rem}}`}</style></nav>;
}
