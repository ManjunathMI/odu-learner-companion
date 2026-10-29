import type {Metadata} from 'next';
import {visibleDocuments,documentUrl} from '@/lib/documents/server';
import Library from '@/components/documents/Library';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Help & Guides',description:'Get started with ODU, join a Learning Space, track your progress, and find account help.',alternates:{canonical:'/docs'}};
export default async function DocsPage(){
 const entries=await visibleDocuments();
 return <Library title="Help & Guides" description="Find your next step, learn at your own pace, and get help when you need it." entries={entries.map(item=>({title:item.title,description:item.description,section:item.section,url:documentUrl(item)}))}/>;
}
