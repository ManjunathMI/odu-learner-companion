import {NextRequest} from 'next/server';
import {getSession,requirePlatformOwner} from '@/lib/auth';
import {catalog,documentSources} from '@/lib/documents/server';
import {validPublication} from '@/lib/documents/policy';
import {adminClient} from '@/lib/supabase/server';
import {unauthorized,forbidden} from '@/lib/path-auth';
export async function GET(req:NextRequest){
 const user=await getSession(req);if(!user)return unauthorized();
 if(!(await requirePlatformOwner(user)))return forbidden('Platform owner access required');
 try{return Response.json(await catalog(),{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'Unable to load the document catalogue'},{status:503});}
}
export async function PATCH(req:NextRequest){
 const user=await getSession(req);if(!user)return unauthorized();
 if(!(await requirePlatformOwner(user)))return forbidden('Platform owner access required');
 const body=await req.json().catch(()=>null);
 const sourcePath=body?.source_path;
 if(!validPublication(body)||typeof sourcePath!=='string')return Response.json({error:'Valid source, visibility and status required'},{status:400});
 const source=documentSources.find(item=>item.source_path===sourcePath);
 if(!source)return Response.json({error:'Source is absent from this deployment'},{status:404});
 // Operational and planning sources cannot be exposed accidentally through a selector.
 if(source.section==='technical'&&body.visibility==='public')return Response.json({error:'Technical documents must remain restricted. Move a reviewed public article into content/ in Git.'},{status:400});
 const {data,error}=await adminClient.from('document_catalog').update({visibility:body.visibility,status:body.status,updated_by:user.id,updated_at:new Date().toISOString()}).eq('source_path',source.source_path).select('source_path').maybeSingle();
 if(error)return Response.json({error:'Unable to save publication settings'},{status:500});
 if(!data)return Response.json({error:'Reload the catalogue to register this source first'},{status:409});
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
