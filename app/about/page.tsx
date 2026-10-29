import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Article from '@/components/documents/Article';
import {resolveDocument,visibleDocuments} from '@/lib/documents/server';
export const dynamic='force-dynamic';
export async function generateMetadata():Promise<Metadata>{const doc=await resolveDocument('about-odu');return doc&&doc.item.status==='published'&&doc.item.visibility==='public'?{title:'About ODU',description:doc.item.description,alternates:{canonical:'/about'},openGraph:{title:'About ODU',description:doc.item.description,url:'/about'}}:{title:'About ODU',robots:{index:false,follow:false,googleBot:{index:false,follow:false}}};}
export default async function About(){const doc=await resolveDocument('about-odu');if(!doc)notFound();return <Article entry={doc.item} markdown={doc.markdown} related={await visibleDocuments()}/>;}
