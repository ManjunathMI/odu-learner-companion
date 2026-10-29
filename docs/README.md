# Engineering and product documentation

Git is the canonical source for these documents. The website renders the same Markdown for authorized platform administrators. Learner-facing material lives in content/.

## Product and decisions

- [Business guide](product/business-guide.md): product vocabulary, roles and rules.
- [Roadmap](product/roadmap.md): delivery history, current priorities and future scope.
- [Content publishing](decisions/content-publishing.md): source ownership, registration, visibility and maintenance.

## Build and integrate

- [Development](engineering/development.md): local setup and retained tests.
- [Architecture](engineering/architecture.md): tenant boundaries, identity and system design.
- [API handbook](api/handbook.md): authentication, endpoints and data contracts.

## Operate

- [Launch candidate review](operations/release-review.md): push scope, deletion audit and remaining checks.
- [Recreate an installation](operations/recreate-installation.md): complete SQL/setup paths for a new project.

- [Database operations](operations/database.md): migrations, inspection and QA setup.
- [Deployment](operations/deployment.md): environments, release and recovery.
- [Release checklist](operations/release-checklist.md): repeatable verification.

The canonical installation schema remains [DB-schema.sql](DB-schema.sql). Existing databases use reviewed additive migrations in supabase/migrations/; never rerun installation SQL against an existing database.
