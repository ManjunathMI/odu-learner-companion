import type {Metadata} from 'next';
import {documentGroup} from '@/lib/documents/navigation';
import Library from '@/components/documents/Library';
import {visibleDocuments,documentUrl} from '@/lib/documents/server';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ODU Blog',description:'Ideas about structured learning, shared goals, and the philosophy behind ODU.',alternates:{canonical:'/blog'}};
export default async function Blog(){return <Library section="blog" title="The ODU Blog" description="Ideas about learning, community, and the thinking behind ODU." entries={(await visibleDocuments()).map(item=>({title:item.title,description:item.description,section:item.section,url:documentUrl(item),group:documentGroup(item.source_path,item.section)}))}/>;}
