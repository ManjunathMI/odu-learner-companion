# Optional curated course SQL

These files are versioned recovery/installation content, not automatic migrations.
Normal application redeployment does **not** require rerunning them. The running app
reads the database, not these files.

| File | Purpose |
|---|---|
| `python-foundations.sql` | Reusable eight-phase, 40-lesson Python course; configurable installation owner. |
| `ai101.sql` | Reusable seven-phase, seven-lesson AI 101 course; reconstructed from committed source/importer at `6ab81e9`, not the original executed SQL. |
| `archive/python-foundations-original.sql` | Unmodified `/tmp/odu-python.sql` supplied for the owner's reported production import. Contains the original owner's UUID/email; archival evidence only, not a template to execute. |

Python archive SHA-256:
`deb020d88491a7b8d0cd337dfbadd445c32779459dde527b51348c49b7abc189`.
The archive matches the local original exactly; the SQL Editor execution itself was
reported by the owner, not independently audited during this cleanup.

## New installation / white-label setup

1. Follow [recreate installation](../../docs/operations/recreate-installation.md):
   run `docs/DB-schema.sql` only on a fresh database; configure Auth/hosting and
   bootstrap your own verified platform administrator using
   `supabase/setup/platform-owner.sql`. Do not copy production users or credentials.
2. Ensure the selected owner has sufficient creator quota for the chosen courses.
   The seeds do not grant roles or increase quotas.
3. In a trusted SQL Editor session, prepend the following settings to the **entire**
   chosen seed, replace the identity placeholders, and run together:

```sql
set odu.course_owner_id = 'YOUR-VERIFIED-AUTH-USER-UUID';
set odu.course_owner_email = 'your-owner@example.com';
-- Choose exactly the confirmation for the seed being executed:
set odu.allow_production_seed = 'python-foundations-production-approved';
-- For ai101.sql use instead:
-- set odu.allow_production_seed = 'ai101-production-approved';
-- Paste the complete corresponding seed below these settings.
```

The confirmation setting is required even for a new installation. A separate SQL
Editor execution may use a different session; keep settings and seed together.
Existing databases need the current schema/RPCs already installed: never replay
`docs/DB-schema.sql` or the original combined AI installer there.

4. Inspect the imported course in the application. New courses are private and
   pending review. In path Settings select Public, then approve through the normal
   platform-admin publication queue before expecting public Explore discovery.

## Re-import and recovery boundaries

Stable course/phase/day/completion-item UUIDs are preserved. Each lesson has one
completion item. Repeating an unchanged seed skips curriculum replacement and
preserves membership, progress, notes and publication settings. Seeds validate the
owner and reject identity collisions; they do not transfer existing courses to a
new owner. Do not modify IDs to repair presentation issues.

Re-import can restore the seed's course text over subsequent editorial changes;
review differences and back up an existing database first. These files restore
starter curriculum, **not** learner records or a full database backup. Shared stable
course IDs are safe across separate white-label databases; creating multiple copies
inside one database is not supported by these seeds.

The original JSON sources were removed only after checking that lesson text,
objectives, activities, outcomes, resource titles/URLs, overview details and stable
IDs survived in SQL. Historical link-check summaries remain in the development
guide; links require periodic rechecking. `npm test` exercises both seeds offline,
including confirmation/owner validation, structure, idempotency and learner activity
preservation. Never execute these files automatically as part of a web build.
