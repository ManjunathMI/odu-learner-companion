-- ACCOUNT SUSPENSION
create schema if not exists private;

create table public.account_suspension_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  actor_id uuid not null references auth.users(id),
  suspended boolean not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  created_at timestamptz not null default now(),
  check (actor_id <> user_id)
);
create index account_suspension_events_user_id_id_idx
  on public.account_suspension_events (user_id, id desc);
alter table public.account_suspension_events enable row level security;
revoke all on public.account_suspension_events from public, anon, authenticated, service_role;
grant select, insert on public.account_suspension_events to service_role;

create function private.current_account_is_active()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not coalesce((
    select suspended from public.account_suspension_events
    where user_id = (select auth.uid())
    order by id desc limit 1
  ), false);
$$;
revoke execute on function private.current_account_is_active() from public, anon, authenticated, service_role;
grant execute on function private.current_account_is_active() to authenticated;

do $$
declare target text;
begin
  foreach target in array array[
    'learning_paths', 'path_memberships', 'profiles', 'platform_admins', 'user_entitlements',
    'quota_requests', 'phases', 'days', 'lesson_items', 'progress', 'notes', 'feedback',
    'badge_definitions', 'badge_awards', 'document_catalog', 'feedback_requests'
  ] loop
    execute format(
      'create policy active_account_required on public.%I as restrictive for all to authenticated using ((select private.current_account_is_active())) with check ((select private.current_account_is_active()))',
      target
    );
  end loop;
end;
$$;

-- These write RPCs also support direct signed-in callers and run with definer rights.
alter function public.create_learning_path_with_entitlement(text,text,text[],uuid) set schema private;
alter function public.review_quota_request(uuid,text,uuid) set schema private;
revoke execute on function private.create_learning_path_with_entitlement(text,text,text[],uuid) from public, anon, authenticated, service_role;
revoke execute on function private.review_quota_request(uuid,text,uuid) from public, anon, authenticated, service_role;

create function public.create_learning_path_with_entitlement(
  p_title text, p_description text, p_tags text[], p_created_by uuid
)
returns table (id uuid, title text, visibility text, wall_status text)
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.current_account_is_active() then
    raise exception 'Account suspended' using errcode = '42501';
  end if;
  return query select * from private.create_learning_path_with_entitlement(p_title,p_description,p_tags,p_created_by);
end;
$$;

create function public.review_quota_request(p_request_id uuid, p_decision text, p_reviewer uuid)
returns public.quota_requests
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.current_account_is_active() then
    raise exception 'Account suspended' using errcode = '42501';
  end if;
  return private.review_quota_request(p_request_id,p_decision,p_reviewer);
end;
$$;

revoke execute on function public.create_learning_path_with_entitlement(text,text,text[],uuid) from public, anon;
revoke execute on function public.review_quota_request(uuid,text,uuid) from public, anon;
grant execute on function public.create_learning_path_with_entitlement(text,text,text[],uuid) to authenticated, service_role;
grant execute on function public.review_quota_request(uuid,text,uuid) to authenticated, service_role;

create function public.current_account_is_active()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.current_account_is_active();
$$;
revoke execute on function public.current_account_is_active() from public, anon, authenticated, service_role;
grant execute on function public.current_account_is_active() to authenticated;
