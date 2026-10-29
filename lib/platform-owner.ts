// Explicit UUID + verified Auth email + platform_admins membership are required.
// Defaults preserve this existing installation; new installations configure both server variables.
const DEFAULT_OWNER_ID = 'a76b3f06-88fa-4a1a-8b2e-7ea55ef6ba15';
const DEFAULT_OWNER_EMAIL = 'immanjunath@outlook.com';
export function ownerConfiguration(id?:string,email?:string) {
  if(id===undefined&&email===undefined)return {id:DEFAULT_OWNER_ID,email:DEFAULT_OWNER_EMAIL};
  return {id:id?.trim()??'',email:email?.trim().toLowerCase()??''};
}
const owner=ownerConfiguration(process.env.PLATFORM_OWNER_ID,process.env.PLATFORM_OWNER_EMAIL);
export const PLATFORM_OWNER_ID=owner.id;
export const PLATFORM_OWNER_EMAIL=owner.email;
export function isOwnerIdentity(user: { id: string; email?: string | null }) {
  return Boolean(PLATFORM_OWNER_ID&&PLATFORM_OWNER_EMAIL) && user.id === PLATFORM_OWNER_ID && user.email?.toLowerCase() === PLATFORM_OWNER_EMAIL;
}
