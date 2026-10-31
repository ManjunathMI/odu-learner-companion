export type DocumentSummary={title:string;description:string;section:string;url:string;group:string};
export const sectionLabels:Record<string,string>={about:'About ODU',blog:'Blog',help:'Help & Guides',technical:'Technical Guide'};
const folderLabels:Record<string,string>={engineering:'Development',api:'API Handbook',product:'Product & Plans',operations:'Operations',decisions:'Design Decisions'};
const sectionOrder=['help','about','blog','technical'];
export function folderLabel(group:string){return group.split('/').map(part=>folderLabels[part]??part.replace(/[-_]/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())).join(' / ');}
export function documentGroup(sourcePath:string,section:string){return sourcePath.split('/').slice(section==='technical'?1:2,-1).join('/');}
export function orderDocuments(entries:DocumentSummary[]){
 return [...entries].sort((a,b)=>{
  const sectionDifference=sectionOrder.indexOf(a.section)-sectionOrder.indexOf(b.section);
  if(sectionDifference)return sectionDifference;
  if(a.section==='help')return Number(b.url==='/docs/how-to-use')-Number(a.url==='/docs/how-to-use');
  return 0;
 });
}
export function navigationGroups(entries:DocumentSummary[]){
 return sectionOrder.flatMap(section=>{
  const articles=orderDocuments(entries).filter(item=>item.section===section);
  if(!articles.length)return [];
  const groups=[...new Set(articles.map(item=>item.group))].sort().map(group=>({key:group,label:group?folderLabel(group):'',articles:articles.filter(item=>item.group===group)}));
  return [{key:section,label:sectionLabels[section],groups}];
 });
}
