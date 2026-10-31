'use client';
import {useState} from 'react';
import Link from 'next/link';
import {folderLabel,orderDocuments,sectionLabels,type DocumentSummary} from '@/lib/documents/navigation';
import DocumentNavigation from './DocumentNavigation';
import './documents.css';
export default function Library({title,description,entries,section='',group=''}:{title:string;description:string;entries:DocumentSummary[];section?:string;group?:string}){
 const [query,setQuery]=useState('');
 const matches=orderDocuments(entries).filter(item=>(!section||item.section===section)&&(!group||item.group===group)&&`${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase().trim()));
 const heading=section?(group?folderLabel(group):sectionLabels[section]??title):title;
 const navigation=<DocumentNavigation entries={entries} section={section} group={group}/>;
 return <div className="document-layout document-library"><aside className="document-sidebar"><details className="document-mobile-menu"><summary>Browse documentation</summary>{navigation}</details><div className="document-desktop-menu">{navigation}</div></aside><div className="content-index"><p className="document-kicker">Learn anything. Together.</p><h1>{heading}</h1><p className="content-intro">{description}</p><label className="content-search">Search articles<input type="search" placeholder="Try sign-in, notes, or learning paths" value={query} onChange={event=>setQuery(event.target.value)}/></label>{(section||group)&&<Link href="/docs">View all guides & articles</Link>}<div className="content-cards">{matches.map(item=><Link className="content-card" href={item.url} key={item.url}><small>{sectionLabels[item.section]}{item.group?` · ${folderLabel(item.group)}`:''}</small><h2>{item.title}</h2><p>{item.description}</p><span>Read article →</span></Link>)}</div>{!matches.length&&<p role="status">No articles found. Try another search or category.</p>}</div></div>;
}
