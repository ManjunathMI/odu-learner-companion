// Offline only: generates reviewed SQL. Never loads credentials or connects to a database.
import {readFile,writeFile} from 'node:fs/promises';
import {ai101ImportSql,ai101ProductionSql} from '../lib/curricula/ai101-import.mjs';
const course=JSON.parse(await readFile(new URL('../curricula/ai-101-beginners/course.json',import.meta.url),'utf8'));
const args=process.argv.slice(2);
const flag=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:undefined;};
const allowed=new Set(['--owner-id','--owner-email','--output','--publish','--production']);
for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw new Error(`Unknown option: ${args[i]}`);if(!['--publish','--production'].includes(args[i]))i++;}
if(!flag('--output')||!flag('--owner-id')){
 console.log(`AI 101: ${course.modules.length} modules; ${course.totalMinutes} study minutes; 7 completion items.\nGenerate development SQL: npm run course:ai101 -- --owner-id <development-auth-uuid> --output /tmp/ai101.sql [--publish]\nProduction SQL (includes migration): add --production --owner-email <verified-owner-email>.\nThis utility never connects to a database. No SQL was executed.`);
}else{
 const production=args.includes('--production');
 const sql=production?ai101ProductionSql(course,flag('--owner-id'),flag('--owner-email'),await readFile(new URL('../supabase/migrations/20261029182558_learning_material.sql',import.meta.url),'utf8')):ai101ImportSql(course,flag('--owner-id'),{publish:args.includes('--publish')});
 await writeFile(flag('--output'),sql,{mode:0o600,flag:'wx'});
 console.log(`${production?'Production installation':'Development'} SQL written to ${flag('--output')}. No database connection was made. Review the file and target project before execution.`);
}
