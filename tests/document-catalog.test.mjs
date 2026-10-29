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
  await db.exec(await readFile(new URL('../supabase/migrations/20261029120712_document_catalog.sql',import.meta.url),'utf8'));
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
