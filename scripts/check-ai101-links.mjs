// Explicit network-only reference check; never reads Supabase credentials or writes database data.
import {readFile,writeFile} from 'node:fs/promises';
const course=JSON.parse(await readFile(new URL('../curricula/ai-101-beginners/course.json',import.meta.url),'utf8'));
const resources=[...course.modules.flatMap(module=>module.resources),...course.references];
const unique=[...new Map(resources.map(resource=>[resource.url,resource])).values()];
const results=[];
for(let start=0;start<unique.length;start+=4){
 const batch=await Promise.all(unique.slice(start,start+4).map(async resource=>{
  try{
   const response=await fetch(resource.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'ODU-course-link-check/1.0'}});
   await response.body?.cancel();
   return {title:resource.title,url:resource.url,status:response.status,resolvedUrl:response.url,result:response.ok?'http-accessible-content-not-reviewed':response.status===404?'not-found':'unverified-or-blocked'};
  }catch{return {title:resource.title,url:resource.url,result:'unverified-network-error'};}
 }));results.push(...batch);
}
const report={checkedAt:new Date().toISOString(),note:'HTTP reachability only; not proof of video availability, content relevance, free access or full external-course completion.',results};
if(process.argv.includes('--write-results'))await writeFile(new URL('../curricula/ai-101-beginners/link-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
