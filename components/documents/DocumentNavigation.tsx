import Link from 'next/link';
import {navigationGroups,type DocumentSummary} from '@/lib/documents/navigation';
export default function DocumentNavigation({entries,currentUrl,section,group}:{entries:DocumentSummary[];currentUrl?:string;section?:string;group?:string}){
 return <nav aria-label="Documentation categories" className="document-tree"><Link className="document-tree-home" href="/docs">All guides & articles</Link>{navigationGroups(entries).map(category=><section key={category.key} className="document-category"><Link className="document-category-title" aria-current={!currentUrl&&section===category.key&&!group?'page':undefined} href={`/docs?section=${category.key}`}>{category.label}</Link>{category.groups.map(folder=>{
 const links=<ul>{folder.articles.map(item=><li key={item.url}><Link href={item.url} aria-current={currentUrl===item.url?'page':undefined}>{item.title}</Link></li>)}</ul>;
 return folder.key?<details key={folder.key} open={folder.articles.some(item=>item.url===currentUrl)||(section===category.key&&group===folder.key)}><summary>{folder.label}</summary><Link className="document-folder-all" href={`/docs?section=${category.key}&group=${encodeURIComponent(folder.key)}`}>View {folder.label.toLowerCase()}</Link>{links}</details>:<div key="articles">{links}</div>;
 })}</section>)}</nav>;
}
