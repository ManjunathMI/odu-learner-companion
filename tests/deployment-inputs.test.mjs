import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

test('Vercel exclusions preserve app Supabase modules, Markdown and build utilities',()=>{
 // Vercel follows gitignore-style matching. --no-index checks tracked source too.
 const required=['lib/supabase/client.ts','lib/supabase/server.ts','lib/documents/source.mjs','content/help/how-to-use.md','docs/engineering/architecture.md','scripts/generate-document-manifest.mjs','scripts/check-build-traces.mjs'];
 const excluded=['supabase/setup/platform-owner.sql','supabase/migrations/example.sql','scripts/test-login.mjs','.local/test-login/learner.json','.env.local','.agents/skills/supabase/SKILL.md'];
 const result=spawnSync('git',['-c',`core.excludesfile=${path.resolve('.vercelignore')}`,'check-ignore','--no-index','--stdin'],{encoding:'utf8',input:[...required,...excluded].join('\n')+'\n'});
 assert.ok(result.status===0||result.status===1,result.stderr);
 const ignored=new Set(result.stdout.trim().split('\n'));
 for(const source of required)assert.equal(ignored.has(source),false,`Required deployment source excluded: ${source}`);
 for(const source of excluded)assert.equal(ignored.has(source),true,`Local-only artifact was included: ${source}`);
});
