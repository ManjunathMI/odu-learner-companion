import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Only these versioned trees are content. Never scan secrets, agent notes or arbitrary URLs.
export async function scanDocuments(root=process.cwd()) {
 const result=[];
 async function walk(directory) {
  for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})) {
   const sourcePath=`${directory}/${entry.name}`;
   if(entry.isDirectory()) { await walk(sourcePath); continue; }
   if(!entry.isFile() || !entry.name.endsWith('.md') || entry.name==='README.md') continue;
   const markdown=await readFile(path.join(root,sourcePath),'utf8');
   const slug=entry.name.slice(0,-3);
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Use a lowercase, hyphenated Markdown filename: ${sourcePath}`);
   const section=sourcePath.startsWith('content/')?sourcePath.split('/')[1]:'technical';
   if(!['about','blog','help','technical'].includes(section)) throw new Error(`Unknown content section: ${sourcePath}`);
   const title=markdown.match(/^#\s+(.+)$/m)?.[1] ?? slug;
   const description=markdown.split('\n').find(line=>line.trim()&&!/^(#|>|\||```|- |\d+\.)/.test(line))?.slice(0,180) ?? title;
   result.push({source_path:sourcePath,slug,title,description,section,hash:createHash('sha256').update(markdown).digest('hex')});
  }
 }
 await walk('content'); await walk('docs');
 const slugs=new Set();for(const item of result){if(slugs.has(item.slug))throw new Error(`Duplicate article slug: ${item.slug}`);slugs.add(item.slug);}
 return result.sort((a,b)=>a.source_path.localeCompare(b.source_path));
}
