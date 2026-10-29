# Launch candidate review

This review records what is included in the launch branch and why old paths are removed. It is not a production deployment approval. The application changes have not yet been promoted to production; the three reviewed database changes have already been applied to the current Supabase project.

## Push contents

- Application fixes: email-only sign-in with origin-aware callbacks, owner Admin restrictions, QA-account metadata management, and partial admin-load error handling.
- Learning data safety: atomic curriculum saves, stable IDs, optimistic revisions, confirmed removals, private note reads/restoration and membership safeguards.
- Documentation: Git-backed About, Blog and learner guides; protected engineering/product documentation; metadata-only publishing catalogue; shared Markdown rendering, article search and heading outline.
- Release assets: dependencies/lockfile, CI, offline tests, opt-in QA diagnostics, full installation schema, additive migrations, owner setup SQL, environment template and operations guides.

## Document removal and preservation audit

| Old path | Replacement and disposition |
|---|---|
| docs/business-guide.md | docs/product/business-guide.md retains product vision, terminology, roles, workflows and business rules. |
| docs/roadmap.md | docs/product/roadmap.md preserves planning and assessment history, with current verification clearly separated. |
| docs/architecture.md | docs/engineering/architecture.md retains system/tenant design, identity, authorization, SEO and UI architecture. The obsolete password-login claim is corrected. |
| docs/development.md | docs/engineering/development.md retains setup, environment, QA diagnostics, verification and Git boundaries; adds current instructions. |
| docs/api.md | docs/api/handbook.md retains endpoint contracts and adds documentation publishing; owner-only workspace wording is corrected. |
| docs/database-operations.md | docs/operations/database.md retains SQL operations, seed guidance, safety decisions and advisory notes; invalid example IDs were changed to UUID-shaped fixtures. |
| docs/how-to-use.md | content/help/how-to-use.md and the account/access, learning/notes and creator guides replace the mixed-role walkthrough. Role definitions, platform operations, detailed routes, product concepts and future scope are retained in the business/architecture/API/roadmap documents. |
| DEPLOYMENT.md | docs/operations/deployment.md covers Vercel setup, environment, redirects, verification, monitoring and recovery. The incorrect schema-pull-as-data-backup procedure was deliberately retired. |
| VERCEL-CHECKLIST.md | docs/operations/release-checklist.md consolidates the release gates. Stale Node/config claims, blanket deletion of local dependencies, and unconditional git-add/main-push instructions were deliberately retired. |
| README.md (shortened) | The introduction and quick start remain. Detailed product rules, architecture, routes, contribution guidance, mobile plans and roadmap already live in the linked canonical documents. No license was invented; a distribution license remains a product decision. |
| .continue/rules/CONTINUE.md | Local integration copy preserved and ignored. Shared project rules remain in AGENTS.md, the reusable GitHub prompt and canonical docs; no application implementation is removed. |
| .vscode/settings.json | Empty editor settings removed from Git's index; local copy preserved. |
| CLAUDE.md | Only an AGENTS.md pointer; local copy preserved. AGENTS.md remains tracked. |
| components/LoginForm.js | Unreferenced legacy component importing auth helpers that no longer exist. Removed; components/AuthForm.tsx implements the active email-only journey. No active route imported the legacy component. |

SQL installation and migration files are retained. Documentation source files are not deleted from the project as a category; their replacements are included in the same commit. Old content remains recoverable in Git history. The audit does not require deleting ignored local skills, secrets, sessions, caches or design materials from disk.

## Files excluded from the push

Real environment files and service credentials; downloaded agent skills; local editor/connector settings; generated sign-in links and sessions; node_modules; .next and build caches; local test reports; Supabase CLI temporary state. The placeholder-only .env.example is intentionally tracked. The deployment package includes Markdown and its build utility but excludes QA/session tools and tests.

## SQL completeness and installation

See [Recreate an installation](recreate-installation.md) for the full installer, migration ordering, owner setup and required external configuration. Fresh-install and upgrade tests are independent so an upgrade cannot mask an incomplete installer. No production Auth users, passwords, learner records or publishing settings were changed by these offline tests.

## Remaining production checks

- Signed-in owner save/unpublish/republish in the content manager, followed by a separate visitor check. Owner UI publishing was not impersonated during automated checks.
- Production email callback, canonical base URL, private spaces, approval, progress/notes persistence and rollback rehearsal.
- Hosting environment variables, SMTP/rate limits, backup/restore and monitoring ownership.
- QA forwarded-email delivery and permanent deletion remain unfinished. Their settings/UI must not be interpreted as working forwarding/deletion.
- A license must be selected before distributing the code under a license grant. No license has been chosen on the owner's behalf.

## Review and deployment boundary

Push the candidate to a codex/ review branch and inspect the pull request before merging. Main is not changed by this review push. Vercel may create a preview deployment for a branch; production promotion is a separate step. Do not roll application code back to the old destructive curriculum handler after using the hardened database, or restore broad browser write grants to make an old build work.

## Candidate verification

The standard npm run build (Turbopack) exposed and then verified fixes for a route configuration re-export and overly broad filesystem tracing. Article reads now use statically scoped content/ and docs/ roots. postbuild verifies that all manifest sources are packaged and private local artifacts are excluded. The standard production build passes; lint has only the two pre-existing image warnings; all 26 offline tests pass; production npm audit reports zero known vulnerabilities. These checks do not replace the remaining production smoke tests above.
