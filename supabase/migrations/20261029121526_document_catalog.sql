-- Content remains in Git. Only publication metadata is stored here.
create table public.document_catalog (
  source_path text primary key check (source_path ~ '^(content|docs)/[a-zA-Z0-9_/-]+\.md$'),
  visibility text not null default 'platform_admin' check (visibility in ('public','platform_admin')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.document_catalog enable row level security;
revoke all on public.document_catalog from public, anon, authenticated;
grant select, insert, update on public.document_catalog to service_role;
create index document_catalog_updated_by_idx on public.document_catalog(updated_by) where updated_by is not null;
comment on table public.document_catalog is 'Git Markdown catalogue. Server-only access; owner manages publishing, platform admins read protected documents.';

-- Initial reviewed sources only; future files use draft/restricted defaults.
insert into public.document_catalog (source_path, visibility, status) values
  ('content/about/about-odu.md', 'public', 'published'),
  ('content/blog/learning-together.md', 'public', 'published'),
  ('content/help/account-and-access.md', 'public', 'published'),
  ('content/help/create-a-learning-space.md', 'public', 'published'),
  ('content/help/how-to-use.md', 'public', 'published'),
  ('content/help/learning-and-notes.md', 'public', 'published'),
  ('docs/api/handbook.md', 'platform_admin', 'published'),
  ('docs/decisions/content-publishing.md', 'platform_admin', 'published'),
  ('docs/engineering/architecture.md', 'platform_admin', 'published'),
  ('docs/engineering/development.md', 'platform_admin', 'published'),
  ('docs/operations/database.md', 'platform_admin', 'published'),
  ('docs/operations/deployment.md', 'platform_admin', 'published'),
  ('docs/operations/release-checklist.md', 'platform_admin', 'published'),
  ('docs/product/business-guide.md', 'platform_admin', 'published'),
  ('docs/product/roadmap.md', 'platform_admin', 'published')
on conflict (source_path) do nothing;
