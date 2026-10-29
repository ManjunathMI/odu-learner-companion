import {writeFile} from 'node:fs/promises';
import {scanDocuments} from '../lib/documents/source.mjs';
const entries=await scanDocuments();
await writeFile('lib/documents/manifest.json',JSON.stringify(entries,null,2)+'\n');
console.log(`Registered ${entries.length} Git Markdown sources in the build manifest.`);
