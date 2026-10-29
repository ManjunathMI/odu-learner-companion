import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('new-project owner SQL requires a confirmed identity and is safe to repeat',async()=>{
 const db=new PGlite();
 try{
  await db.exec('create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz); create table public.platform_admins(user_id uuid primary key references auth.users(id));');
  const setup=await readFile(new URL('../supabase/setup/platform-owner.sql',import.meta.url),'utf8');
  await assert.rejects(db.exec(setup),/Set odu.owner_email/);
  await db.exec("select set_config('odu.owner_email','new-owner@example.com',false)");
  await assert.rejects(db.exec(setup),/must sign in/);
  await db.exec("insert into auth.users values ('00000000-0000-4000-8000-000000000001','new-owner@example.com',null)");
  await assert.rejects(db.exec(setup),/must sign in/);
  await db.exec('update auth.users set email_confirmed_at=now()');
  await db.exec(setup);await db.exec(setup);
  assert.equal((await db.query('select count(*)::int as count from platform_admins')).rows[0].count,1);
 }finally{await db.close();}
});
