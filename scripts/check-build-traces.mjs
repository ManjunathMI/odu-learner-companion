// Verify the server bundle includes article sources but excludes private local artifacts.
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const manifest=JSON.parse(await readFile('lib/documents/manifest.json','utf8'));
const forbidden=new Set(['.agents','.local','.codex','.claude','.continue','.vscode']);
let checked=0;let articleTrace=false;
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const filename=path.join(directory,entry.name);
  if(entry.isDirectory()){await walk(filename);continue;}
  if(!entry.name.endsWith('.nft.json'))continue;
  checked++;
  const files=JSON.parse(await readFile(filename,'utf8')).files??[];
  const resolved=new Set(files.map(file=>path.resolve(path.dirname(filename),file)));
  for(const file of resolved){
   const segments=path.relative(root,file).split(path.sep);
   if(segments.some(segment=>forbidden.has(segment))||path.basename(file).startsWith('.env'))throw new Error(`Private local artifact included in deployment trace: ${path.relative(root,file)}`);
  }
  if(path.relative(root,filename).split(path.sep).join('/').includes('/app/docs/[slug]/page.js.nft.json')){
   articleTrace=true;
   for(const source of manifest)if(!resolved.has(path.resolve(root,source.source_path)))throw new Error(`Article missing from deployment trace: ${source.source_path}`);
  }
 }
}
await walk('.next');
if(!checked||!articleTrace)throw new Error('Expected documentation server traces were not generated');
console.log(`Deployment traces passed: ${manifest.length} Markdown sources included; private local artifacts excluded.`);
