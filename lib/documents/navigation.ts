export type DocumentSummary={title:string;description:string;section:string;url:string;group:string};
export const sectionLabels:Record<string,string>={about:'About ODU',blog:'Blog',help:'Help & Guides',technical:'Technical Guide'};
const folderLabels:Record<string,string>={engineering:'Development',api:'API Handbook',product:'Product & Plans',operations:'Operations',decisions:'Design Decisions'};
export function folderLabel(group:string){return group.split('/').map(part=>folderLabels[part]??part.replace(/[-_]/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())).join(' / ');}
export function documentGroup(sourcePath:string,section:string){return sourcePath.split('/').slice(section==='technical'?1:2,-1).join('/');}
export function navigationGroups(entries:DocumentSummary[]){
 return ['about','blog','help','technical'].flatMap(section=>{
  const articles=entries.filter(item=>item.section===section);
  if(!articles.length)return [];
  const groups=[...new Set(articles.map(item=>item.group))].sort().map(group=>({key:group,label:group?folderLabel(group):'',articles:articles.filter(item=>item.group===group)}));
  return [{key:section,label:sectionLabels[section],groups}];
 });
}
