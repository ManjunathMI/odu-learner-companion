# Release checklist

Use this checklist with the deployment guide; it records work to verify, not proof that production is already configured.

## Code and database

- Lint, retained tests and production build pass.
- Review the diff and required additive migrations.
- Confirm environment variables, staging separation, backup/restore and rollback ownership.
- Keep service keys, local agent integrations, sessions and generated credentials out of Git.

## Learner journey

- Request a fresh email link and return to the originating app.
- Discover a public path, request membership, approve it with the appropriate facilitator, and continue learning.
- Save progress and private notes, refresh and verify persistence.
- Check desktop/mobile layout and keyboard navigation.

## Owner and documentation

- Owner can open Admin and manage the intended QA accounts.
- Owner can review deployed Markdown sources and save visibility/status.
- A new file registers as a draft without changing existing publishing choices.
- Public About, Blog and Help links work when signed out.
- Ordinary learners cannot read technical articles, drafts or their metadata.
- Sitemap contains only published public articles and approved public paths.
- Missing source files never render from stale catalogue rows.

## Deployment outcome

Record the Git revision, deployment URL, migration versions, smoke-test results and unresolved limitations. QA email forwarding and permanent account deletion remain separate unfinished features until explicitly verified.
