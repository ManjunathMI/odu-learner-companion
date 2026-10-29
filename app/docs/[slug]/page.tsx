import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {resolveDocument,visibleDocuments,documentUrl} from '@/lib/documents/server';
import Article from '@/components/documents/Article';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const document=await resolveDocument(slug);
 if(!document||document.item.visibility!=='public'||document.item.status!=='published')return {title:'Documentation',robots:{index:false,follow:false,googleBot:{index:false,follow:false}},openGraph:{title:'Documentation',description:'Restricted documentation'}};
 const {item}=document;
 return {title:item.title,description:item.description,alternates:{canonical:documentUrl(item)},robots:{index:true,follow:true},openGraph:{title:item.title,description:item.description,url:documentUrl(item),type:'article'},twitter:{card:'summary',title:item.title,description:item.description}};
}
export default async function DocumentPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const document=await resolveDocument(slug);if(!document)notFound();
 return <Article entry={document.item} markdown={document.markdown} related={await visibleDocuments()}/>;
}
