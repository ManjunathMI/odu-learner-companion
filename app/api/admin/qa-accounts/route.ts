import { NextRequest } from 'next/server';
import { getSession, requirePlatformOwner } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { unauthorized, forbidden } from '@/lib/path-auth';
import { qaEmail, deliveryEmail } from '@/lib/qa-accounts';
import { PLATFORM_OWNER_EMAIL } from '@/lib/platform-owner';
import type { User } from '@supabase/supabase-js';

async function authorize(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePlatformOwner(user))) return forbidden('Platform owner access required');
  return null;
}
function isQa(user: User) { return user.app_metadata.role === 'test' && Boolean(qaEmail(user.email)); }
async function users() {
  const result: User[] = [];
  for (let page = 1; ; page++) {
    const {data,error} = await adminClient.auth.admin.listUsers({page,perPage:100});
    if (error) throw new Error('Unable to load Auth users');
    result.push(...data.users);
    if (data.users.length < 100) return result;
  }
}
export async function GET(req: NextRequest) {
  const denied = await authorize(req); if (denied) return denied;
  try {
    const accounts = (await users()).filter(isQa).map(user=>({
      user_id:user.id,email:user.email,
      delivery_email:deliveryEmail(user.app_metadata.qa_delivery_email) ?? PLATFORM_OWNER_EMAIL,
      enabled:user.app_metadata.qa_enabled !== false && !(user.banned_until && new Date(user.banned_until).getTime()>Date.now()),
    }));
    return Response.json(accounts,{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Unable to load QA accounts'}, {status:502}); }
}
export async function POST(req: NextRequest) {
  const denied = await authorize(req); if (denied) return denied;
  const body = await req.json().catch(()=>null);
  const email=qaEmail(body?.email), recipient=deliveryEmail(body?.delivery_email);
  if (!email || !recipient) return Response.json({error:'Use an @odu.local QA address and a valid delivery email.'},{status:400});
  try {
    const existing=(await users()).find(user=>user.email?.toLowerCase()===email);
    if (existing) return Response.json({error:'This Auth user already exists. Edit its row instead.'},{status:409});
    const {error}=await adminClient.auth.admin.createUser({email,email_confirm:true,app_metadata:{role:'test',qa_delivery_email:recipient,qa_enabled:true}});
    if(error) return Response.json({error:'Unable to create QA account'},{status:502});
    return Response.json({ok:true},{status:201});
  }catch{return Response.json({error:'Unable to inspect Auth accounts'},{status:502});}
}
export async function PATCH(req: NextRequest) {
  const denied = await authorize(req); if (denied) return denied;
  const body=await req.json().catch(()=>null), recipient=deliveryEmail(body?.delivery_email);
  if(typeof body?.user_id!=='string'||!recipient||typeof body.enabled!=='boolean') return Response.json({error:'Account, delivery email and enabled status required'},{status:400});
  const {data,error}=await adminClient.auth.admin.getUserById(body.user_id);
  if(error||!data.user||!isQa(data.user)) return forbidden('Only explicitly marked QA accounts can be managed here');
  const {error:saveError}=await adminClient.auth.admin.updateUserById(data.user.id,{
    app_metadata:{...data.user.app_metadata,qa_delivery_email:recipient,qa_enabled:body.enabled},
    ban_duration:body.enabled?'none':'876000h',
  });
  if(saveError) return Response.json({error:'Unable to update QA account'},{status:502});
  return Response.json({ok:true});
}
