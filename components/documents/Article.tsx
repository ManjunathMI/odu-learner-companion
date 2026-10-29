import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {headingId} from '@/lib/documents/policy';
import {markdownLink,documentUrl,type CatalogEntry} from '@/lib/documents/server';
import OnThisPage from './OnThisPage';
import './documents.css';
function outline(markdown:string){
 let fenced=false;
 return markdown.split('\n').flatMap((line,index)=>{
  if(/^\s*(```|~~~)/.test(line)){fenced=!fenced;return [];}
  const match=!fenced&&/^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
  return match?[{id:headingId(match[2],index+1),title:match[2].replace(/[*`]/g,''),level:match[1].length,line:index+1}]:[];
 });

}
export default function Article({entry,markdown,related}:{entry:CatalogEntry;markdown:string;related:CatalogEntry[]}){
 const headings=outline(markdown);
 return <div className="document-layout">
  <aside className="document-sidebar"><Link href="/docs">Help & Guides</Link><h2>{entry.section==='technical'?'Technical library':entry.section==='blog'?'From the blog':'Keep exploring'}</h2><nav aria-label="Related articles">{related.filter(item=>item.section===entry.section).map(item=><Link key={item.source_path} href={documentUrl(item)} aria-current={item.slug===entry.slug?'page':undefined}>{item.title}</Link>)}</nav></aside>
  <article className="markdown-article"><p className="document-kicker">{entry.section==='technical'?'Platform admin documentation':entry.section==='help'?'Help & Guides':entry.section==='blog'?'ODU Blog':'About ODU'}</p>{entry.status!=='published'&&<p className="document-notice">Owner preview · {entry.status}</p>}{entry.visibility==='platform_admin'&&<p className="document-notice">Restricted to platform administrators</p>}
   <Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
    h2:({node,children})=><h2 id={headings.find(item=>item.line===node?.position?.start.line)?.id}>{children}</h2>,
    h3:({node,children})=><h3 id={headings.find(item=>item.line===node?.position?.start.line)?.id}>{children}</h3>,
    a:({href,children})=>{const target=href?markdownLink(href,entry.source_path):undefined;return target?<a href={target}>{children}</a>:<span>{children}</span>;},
    img:({alt})=><span>{alt}</span>,
    table:({children})=><div className="document-table"><table>{children}</table></div>,
   }}>{markdown}</Markdown>
  </article><aside className="document-outline"><OnThisPage headings={headings}/></aside>
 </div>;
}
