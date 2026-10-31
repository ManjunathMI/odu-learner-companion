import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {scanDocuments} from '../lib/documents/source.mjs';
import {canReadDocument,validPublication,headingId} from '../lib/documents/policy.ts';

test('article access fails closed for drafts, archived material and private sources',()=>{
 for(const status of ['draft','archived'])for(const visibility of ['public','platform_admin']){
  assert.equal(canReadDocument({status,visibility},false),false);
  assert.equal(canReadDocument({status,visibility},true),false);
  assert.equal(canReadDocument({status,visibility},false,true),true);
 }
 assert.equal(canReadDocument({status:'published',visibility:'public'},false),true);
 assert.equal(canReadDocument({status:'published',visibility:'platform_admin'},false),false);
 assert.equal(canReadDocument({status:'published',visibility:'platform_admin'},true),true);
 assert.equal(validPublication({status:'published',visibility:'everyone'}),false);
 assert.equal(validPublication({status:'draft',visibility:'platform_admin'}),true);
 assert.notEqual(headingId('Same heading',1),headingId('Same heading',5));
});
test('Journey creator stays mounted in an accessible native dialog with public help links',async()=>{
 const [journey,form,manifestText,guide]=await Promise.all([
  readFile(new URL('../components/journey/JourneyDashboard.tsx',import.meta.url),'utf8'),
  readFile(new URL('../components/CreatePathForm.tsx',import.meta.url),'utf8'),
  readFile(new URL('../lib/documents/manifest.json',import.meta.url),'utf8'),
  readFile(new URL('../content/help/create-a-learning-space.md',import.meta.url),'utf8'),
 ]);
 const dialog=journey.slice(journey.indexOf('<dialog'),journey.indexOf('</dialog>'));
 const guideEntry=JSON.parse(manifestText).find(item=>item.slug==='create-a-learning-space');
 assert.equal(guideEntry?.section,'help');
 assert.match(journey,/aria-labelledby="create-path-dialog-title"/);
 assert.match(journey,/dialog\.showModal\(\)/);
 assert.match(dialog,/onCancel=\{\(event\)\s*=>\s*\{\s*event\.preventDefault\(\);\s*closeCreate\(\);/);
 assert.match(dialog,/<CreatePathForm onCancel=\{closeCreate\} \/>/);
 assert.doesNotMatch(journey,/showCreate\s*&&\s*\(?\s*<CreatePathForm/);
 assert.match(journey,/requestAnimationFrame\(\(\)\s*=>\s*createOpenerRef\.current\?\.focus\(\)\)/);
 assert.match(journey,/href="\/docs\/create-a-learning-space#create-your-path-5"[\s\S]*target="_blank"[\s\S]*noopener noreferrer/);
 assert.match(form,/href="\/docs\/create-a-learning-space#build-the-learning-plan-9"[\s\S]*target="_blank"[\s\S]*noopener noreferrer/);
 assert.match(guide,/^## Create your path$/m);
 assert.match(guide,/^## Build the learning plan$/m);
 assert.equal(headingId('Create your path',5),'create-your-path-5');
 assert.equal(headingId('Build the learning plan',9),'build-the-learning-plan-9');
});
test('manifest scans only Markdown article trees and rejects duplicate slugs',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'odu-docs-'));
 try{
  await mkdir(path.join(root,'content/help'),{recursive:true});await mkdir(path.join(root,'docs/engineering'),{recursive:true});
  await writeFile(path.join(root,'content/help/start.md'),'# Start learning\n\nTake your first step.\n');
  await writeFile(path.join(root,'docs/README.md'),'# Index');
  await writeFile(path.join(root,'docs/DB-schema.sql'),'private sql');
  const entries=await scanDocuments(root);assert.equal(entries.length,1);assert.equal(entries[0].section,'help');assert.equal(entries[0].description,'Take your first step.');
  await writeFile(path.join(root,'docs/engineering/start.md'),'# Duplicate');await assert.rejects(scanDocuments(root),/Duplicate/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('catalogue migration denies browser roles and insert-only sync preserves owner settings',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
  await db.exec(await readFile(new URL('../supabase/migrations/20261029121526_document_catalog.sql',import.meta.url),'utf8'));
  const before=await db.query('select source_path from public.document_catalog limit 1');const source=before.rows[0].source_path;
  await db.query("update public.document_catalog set status='archived',visibility='platform_admin' where source_path=$1",[source]);
  await db.query('insert into public.document_catalog(source_path) values($1) on conflict(source_path) do nothing',[source]);
  assert.equal((await db.query('select status from public.document_catalog where source_path=$1',[source])).rows[0].status,'archived');
  await db.exec("insert into public.document_catalog(source_path) values('content/help/new-source.md')");
  const row=(await db.query("select * from public.document_catalog where source_path='content/help/new-source.md'")).rows[0];assert.equal(row.status,'draft');assert.equal(row.visibility,'platform_admin');
  for(const role of ['anon','authenticated']){
   assert.equal((await db.query("select has_table_privilege($1,'public.document_catalog','select') as allowed",[role])).rows[0].allowed,false);
   assert.equal((await db.query("select has_table_privilege($1,'public.document_catalog','update') as allowed",[role])).rows[0].allowed,false);
  }
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.document_catalog'::regclass")).rows[0].relrowsecurity,true);
 }finally{await db.close();}
});

test('navigation groups only supplied readable documents and follows Git subfolders',async()=>{
 const {navigationGroups,documentGroup}=await import('../lib/documents/navigation.ts');
 const publicEntries=[{title:'Start',description:'Start learning',section:'help',url:'/docs/how-to-use',group:''}];
 assert.deepEqual(navigationGroups(publicEntries).map(group=>group.key),['help']);
 assert.equal(documentGroup('docs/engineering/architecture.md','technical'),'engineering');
 const entries=[...publicEntries,{title:'Architecture',description:'Design',section:'technical',url:'/docs/architecture',group:'engineering'}];
 const groups=navigationGroups(entries);
 assert.equal(groups[1].label,'Technical Guide');
 assert.equal(groups[1].groups[0].label,'Development');
 assert.equal(groups[1].groups[0].articles[0].url,'/docs/architecture');
});
