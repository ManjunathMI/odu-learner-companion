# Git-backed documentation publishing

## Decision

Keep article content as Markdown in the application repository. Store publication status and visibility in one Supabase table, document_catalog. The website manages these settings only; it cannot create, edit, delete or commit source files.

## Content structure

- content/about: public product explanation.
- content/blog: editorial articles and product philosophy.
- content/help: task-oriented learner and creator guides.
- docs/product: business rules and roadmap.
- docs/engineering: architecture and contributor setup.
- docs/api: developer API handbook.
- docs/operations: deployment, database and recovery guidance.
- docs/decisions: important decisions, context and consequences.

README files are indexes, not published articles. Agent instructions, downloaded skills, credentials, generated login links and SQL files are never article sources.

## Registration and publishing

The prebuild and predev scripts generate a manifest from Markdown files in content/ and docs/. File basenames are stable, unique article slugs and must use lowercase letters, numbers and hyphens. Each file starts with a single H1 title. The first ordinary paragraph supplies its listing description. Renaming a file changes its identity: register the new path as a draft, and retain the old row as missing-source history. Preserve filenames when editing an existing article.

On the first catalogue read after deployment, the server inserts missing entries with draft status and platform-admin visibility. Insert-only synchronization preserves existing publication settings. No database credentials are needed to generate the manifest or run the offline build. A new Git file becomes discoverable to Admin after a deployment, or after restarting development mode; saving a file does not invoke a hosted Git webhook.

The initial migration publishes the reviewed starter articles: content/ is public and technical docs are platform-admin-only. Subsequent new sources are drafts. Owner previews include drafts and archived entries. Missing sources are not served. The catalogue never stores Markdown text.

Existing published documents update with the deployed Git version. There is no independent content version pin or Git editor. Deploy code and content together; use a separate Supabase project for staging if publication settings must be isolated from production.

## Access and search

Only the verified platform owner can change catalogue settings. Published technical documents are readable by platform admins, including synthetic QA platform admins; path-admin status alone is insufficient. Technical sources cannot be made public in the UI: publish a reviewed copy in content/ when a public explanation is needed.

The catalogue has RLS enabled, no browser-role grants, and no browser policies. Only the server service role reads/writes it. Every rendering path filters visibility before returning article bodies or listing metadata. Public search receives only accessible titles and descriptions, not a bundled index of protected articles. New sources fail closed until explicitly published. Dynamic pages use request-time authorization; protected articles and drafts receive noindex metadata and are excluded from sitemaps.

## Reader experience

Public About, Blog, and Help links appear in the shared header/footer. Articles use the same safe Markdown renderer, category navigation and a heading outline that highlights the current section while scrolling. On mobile the outline is collapsible. Raw HTML is skipped and executable MDX is unsupported. Relative Markdown links resolve only to registered article sources; SQL and other repository files are not exposed through a file-download API.

## Maintenance

Add content in Git, build/deploy, then open Admin → Documentation publishing to review the new draft. Preview, choose the audience, and publish. Set draft or archived to remove an article from reader listings and public access. Refresh catalogue reloads saved settings and registers deployed sources; save pending changes first. No website action pushes to Git.

The database and source repository have separate visibility. A public repository exposes its Markdown regardless of website access controls. Never commit secrets or confidential material to a public repository.
