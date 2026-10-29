'use client';
import {useState} from 'react';
import Link from 'next/link';
import './documents.css';
type Summary={title:string;description:string;section:string;url:string};
export default function Library({title,description,entries}:{title:string;description:string;entries:Summary[]}){
 const [query,setQuery]=useState('');
 const matches=entries.filter(item=>`${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase().trim()));
 return <div className="content-index"><p className="document-kicker">Learn anything. Together.</p><h1>{title}</h1><p className="content-intro">{description}</p><nav className="content-tabs" aria-label="Reading sections"><Link href="/about">About ODU</Link><Link href="/blog">Blog</Link><Link href="/docs">Help & Guides</Link></nav><label className="content-search">Search articles<input type="search" placeholder="Try sign-in, notes, or learning paths" value={query} onChange={event=>setQuery(event.target.value)}/></label><div className="content-cards">{matches.map(item=><Link className="content-card" href={item.url} key={item.url}><small>{item.section==='technical'?'Platform admins':item.section==='help'?'Guide':item.section}</small><h2>{item.title}</h2><p>{item.description}</p><span>Read article →</span></Link>)}</div>{!matches.length&&<p role="status">No articles found. Try another search.</p>}</div>;
}
