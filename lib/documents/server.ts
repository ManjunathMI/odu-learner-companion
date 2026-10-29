import 'server-only';
import {cache} from 'react';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {adminClient,createClient} from '@/lib/supabase/server';
import {isPlatformAdmin,requirePlatformOwner} from '@/lib/auth';
import manifest from './manifest.json';
import {canReadDocument} from './policy';
export type Source = typeof manifest[number];
export const documentSources: Source[]=manifest;
export type CatalogEntry=Source & {visibility:'public'|'platform_admin';status:'draft'|'published'|'archived';updated_at:string;missing?:boolean};

// Insert-only registration. It cannot republish an archived article or change visibility.
export const catalog = cache(async ():Promise<CatalogEntry[]>=>{
 const {error:syncError}=await adminClient.from('document_catalog').upsert(documentSources.map(source=>({source_path:source.source_path})),{onConflict:'source_path',ignoreDuplicates:true});
 if(syncError)throw new Error('Documentation catalogue unavailable');
 const {data,error}=await adminClient.from('document_catalog').select('*');
 if(error)throw new Error('Documentation catalogue unavailable');
 return (data??[]).map(row=>{
  const source=documentSources.find(item=>item.source_path===row.source_path);
  return {...(source??{source_path:row.source_path,slug:'',title:row.source_path,description:'Source file is absent from this deployment.',section:'technical',hash:''}),visibility:row.visibility,status:row.status,updated_at:row.updated_at,missing:!source};
 });
});
export const documentReader=cache(async()=>{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 return {platformAdmin:user?await isPlatformAdmin(user.id):false,owner:user?await requirePlatformOwner(user):false};
});
export async function visibleDocuments(publicOnly=false){
 const reader=publicOnly?{platformAdmin:false,owner:false}:await documentReader();
 return (await catalog()).filter(item=>!item.missing&&canReadDocument(item,reader.platformAdmin,reader.owner));
}
export const resolveDocument=cache(async(slug:string)=>{
 const aliases:Record<string,string>={'api':'handbook','database-operations':'database'};
 const item=(await catalog()).find(entry=>entry.slug===(aliases[slug]??slug)&&!entry.missing);
 if(!item)return null;
 const reader=await documentReader();
 if(!canReadDocument(item,reader.platformAdmin,reader.owner))return null;
 const markdown=item.source_path.startsWith('content/')
  ? await readFile(path.join(process.cwd(),'content',item.source_path.slice('content/'.length)),'utf8')
  : await readFile(path.join(process.cwd(),'docs',item.source_path.slice('docs/'.length)),'utf8');
 return {item,markdown};
});
export function documentUrl(item:Pick<Source,'slug'|'section'>){
 return item.section==='about'?'/about':item.section==='blog'?`/blog/${item.slug}`:`/docs/${item.slug}`;
}
export function markdownLink(href:string,currentPath:string){
 if(href.startsWith('#')||!href.endsWith('.md'))return href;
 const normalized=path.posix.normalize(path.posix.join(path.posix.dirname(currentPath),href));
 const target=documentSources.find(item=>item.source_path===normalized);
 return target?documentUrl(target):undefined;
}
