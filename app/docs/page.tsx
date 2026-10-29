import type {Metadata} from 'next';
import {visibleDocuments,documentUrl} from '@/lib/documents/server';
import {documentGroup} from '@/lib/documents/navigation';
import Library from '@/components/documents/Library';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Guides & Documentation',description:'Get started with ODU, join a Learning Space, track your progress, and find account help.',alternates:{canonical:'/docs'}};
export default async function DocsPage({searchParams}:{searchParams:Promise<{section?:string;group?:string}>}){
 const {section,group}=await searchParams;
 const entries=await visibleDocuments();
 return <Library section={section} group={group} title="Guides & Documentation" description="Find your next step, learn at your own pace, and get help when you need it." entries={entries.map(item=>({title:item.title,description:item.description,section:item.section,url:documentUrl(item),group:documentGroup(item.source_path,item.section)}))}/>;
}
