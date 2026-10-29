export type Publication = {visibility: 'public'|'platform_admin'; status:'draft'|'published'|'archived'};
export function canReadDocument(publication: Publication, platformAdmin: boolean, owner=false) {
 return owner || (publication.status==='published' && (publication.visibility==='public'||platformAdmin));
}
export function validPublication(value: unknown): value is Publication {
 if(!value||typeof value!=='object')return false;
 const input=value as Record<string,unknown>;
 return ['public','platform_admin'].includes(String(input.visibility))&&['draft','published','archived'].includes(String(input.status));
}
export function headingId(text:string,index:number) {
 return `${text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-')||'section'}-${index}`;
}
