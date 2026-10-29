-- Existing databases: additive launch migration; no learner rows are rewritten.
alter table public.learning_paths add column if not exists plan_revision integer not null default 0;

-- Sensitive writes use authenticated Next.js handlers or the quota-checked RPC.
-- Journey still reads memberships directly through RLS.
revoke all on public.learning_paths, public.path_memberships, public.phases, public.days, public.lesson_items, public.progress from public, anon, authenticated;
grant select on public.learning_paths, public.path_memberships, public.phases, public.days, public.lesson_items, public.progress to authenticated;
grant select, insert, update, delete on public.learning_paths, public.path_memberships, public.phases, public.days, public.lesson_items, public.progress, public.notes to service_role;

drop policy if exists "read notes on shared paths" on public.notes;
drop policy if exists "owner reads personal notes" on public.notes;
create policy "owner reads personal notes" on public.notes for select to authenticated
  using (user_id = (select auth.uid()) and public.is_approved_member(path_id));
revoke all on public.notes from public, anon, authenticated;
grant select on public.notes to authenticated;
-- Notes and progress writes already go through handlers validating lesson ownership.

-- Do not expose administrative entry points anonymously. Role lookup helpers are
-- intentionally still usable by RLS; these two RPCs validate caller identity.
revoke execute on function public.create_learning_path_with_entitlement(text,text,text[],uuid) from public, anon;
revoke execute on function public.review_quota_request(uuid,text,uuid) from public, anon;
revoke execute on function public.handle_new_path() from public, anon, authenticated;
grant execute on function public.create_learning_path_with_entitlement(text,text,text[],uuid) to authenticated, service_role;
grant execute on function public.review_quota_request(uuid,text,uuid) to authenticated, service_role;

create index if not exists phases_path_sort_idx on public.phases(path_id, sort_order);
create index if not exists days_phase_sort_idx on public.days(phase_id, sort_order);
create index if not exists lesson_items_day_sort_idx on public.lesson_items(day_id, sort_order);
create index if not exists notes_owner_path_item_idx on public.notes(user_id, path_id, item_key, created_at);

-- One SQL statement gives readers a consistent curriculum + revision snapshot.
create or replace function public.read_learning_plan(p_path_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('revision', lp.plan_revision, 'phases', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'title', p.title, 'goal', p.goal, 'days', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', d.id, 'dayLabel', d.day_label, 'title', d.title, 'hours', d.hours,
          'items', coalesce((select jsonb_agg(jsonb_build_object(
            'id', i.id, 'title', i.title, 'url', i.url, 'tag', i.tag
          ) order by i.sort_order, i.id) from public.lesson_items i where i.day_id = d.id), '[]'::jsonb)
        ) order by d.sort_order, d.id) from public.days d where d.phase_id = p.id
      ), '[]'::jsonb)
    ) order by p.sort_order, p.id) from public.phases p where p.path_id = lp.id
  ), '[]'::jsonb)) from public.learning_paths lp where lp.id = p_path_id;
$$;
revoke all on function public.read_learning_plan(uuid) from public, anon, authenticated;
grant execute on function public.read_learning_plan(uuid) to service_role;

create or replace function public.save_learning_plan(
  p_path_id uuid, p_actor uuid, p_phases jsonb,
  p_expected_revision integer default null, p_confirm_removals boolean default false
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_revision integer;
  v_phase jsonb; v_day jsonb; v_item jsonb;
  v_phase_id uuid; v_day_id uuid; v_item_id uuid;
  v_phase_ids uuid[] := '{}'; v_day_ids uuid[] := '{}'; v_item_ids uuid[] := '{}';
  v_phase_order integer := 0; v_day_order integer; v_item_order integer;
begin
  -- Only service_role has EXECUTE, but actor authorization is checked again here.
  if not exists (select 1 from public.platform_admins where user_id = p_actor)
    and not exists (select 1 from public.path_memberships where user_id = p_actor
      and path_id = p_path_id and role = 'admin' and status = 'approved') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select plan_revision into v_revision from public.learning_paths where id = p_path_id for update;
  if not found then raise exception 'Path not found' using errcode = 'P0002'; end if;
  if (p_expected_revision is null and exists (select 1 from public.phases where path_id = p_path_id))
    or (p_expected_revision is not null and p_expected_revision <> v_revision) then
    raise exception 'The curriculum changed. Reload before saving.' using errcode = '40001';
  end if;
  if jsonb_typeof(p_phases) is distinct from 'array' or jsonb_array_length(p_phases) > 100
    or octet_length(p_phases::text) > 1048576 then
    raise exception 'Invalid or oversized curriculum' using errcode = '22023';
  end if;
  for v_phase in select value from jsonb_array_elements(p_phases) loop
    if jsonb_typeof(v_phase->'title') is distinct from 'string' or length(btrim(v_phase->>'title')) not between 1 and 500
      or jsonb_typeof(v_phase->'days') is distinct from 'array' or jsonb_array_length(v_phase->'days') > 100 then
      raise exception 'Each phase needs a title and days array (maximum 100 days)' using errcode = '22023';
    end if;
    v_phase_id := coalesce((v_phase->>'id')::uuid, gen_random_uuid());
    if v_phase_id = any(v_phase_ids) or (v_phase ? 'id' and not exists
      (select 1 from public.phases where id = v_phase_id and path_id = p_path_id)) then
      raise exception 'Invalid or duplicate phase ID' using errcode = '22023';
    end if;
    v_phase_ids := array_append(v_phase_ids, v_phase_id);
    insert into public.phases(id,path_id,title,goal,sort_order)
      values(v_phase_id,p_path_id,btrim(v_phase->>'title'),nullif(btrim(v_phase->>'goal'),''),v_phase_order)
      on conflict(id) do update set title=excluded.title, goal=excluded.goal, sort_order=excluded.sort_order;
    v_phase_order := v_phase_order + 1;
    v_day_order := 0;
    for v_day in select value from jsonb_array_elements(v_phase->'days') loop
      if jsonb_typeof(v_day->'title') is distinct from 'string' or length(btrim(v_day->>'title')) not between 1 and 500
        or jsonb_typeof(v_day->'dayLabel') is distinct from 'string' or length(btrim(v_day->>'dayLabel')) not between 1 and 100
        or jsonb_typeof(v_day->'items') is distinct from 'array' or jsonb_array_length(v_day->'items') > 200 then
        raise exception 'Each day needs a title, label and items array (maximum 200 items)' using errcode = '22023';
      end if;
      v_day_id := coalesce((v_day->>'id')::uuid,gen_random_uuid());
      if v_day_id = any(v_day_ids) or (v_day ? 'id' and not exists
        (select 1 from public.days where id=v_day_id and phase_id=v_phase_id)) then
        raise exception 'Invalid or duplicate day ID' using errcode = '22023';
      end if;
      v_day_ids := array_append(v_day_ids,v_day_id);
      insert into public.days(id,phase_id,day_label,title,hours,sort_order)
        values(v_day_id,v_phase_id,btrim(v_day->>'dayLabel'),btrim(v_day->>'title'),nullif(btrim(v_day->>'hours'),''),v_day_order)
        on conflict(id) do update set day_label=excluded.day_label,title=excluded.title,hours=excluded.hours,sort_order=excluded.sort_order;
      v_day_order := v_day_order + 1;
      v_item_order := 0;
      for v_item in select value from jsonb_array_elements(v_day->'items') loop
        if jsonb_typeof(v_item->'title') is distinct from 'string' or length(btrim(v_item->>'title')) not between 1 and 500
          or jsonb_typeof(v_item->'url') is distinct from 'string'
          or length(v_item->>'url') > 4096 or btrim(v_item->>'url') !~* '^https?://[^[:space:]]+$'
          or (v_item->>'tag' is not null and v_item->>'tag' not in ('','hands','exam')) then
          raise exception 'Each lesson needs a title, an HTTP(S) resource URL and a valid type' using errcode = '22023';
        end if;
        v_item_id := coalesce((v_item->>'id')::uuid,gen_random_uuid());
        if v_item_id = any(v_item_ids) or (v_item ? 'id' and not exists
          (select 1 from public.lesson_items where id=v_item_id and day_id=v_day_id)) then
          raise exception 'Invalid or duplicate lesson ID' using errcode = '22023';
        end if;
        v_item_ids := array_append(v_item_ids,v_item_id);
        insert into public.lesson_items(id,day_id,title,url,tag,sort_order)
          values(v_item_id,v_day_id,btrim(v_item->>'title'),btrim(v_item->>'url'),nullif(v_item->>'tag',''),v_item_order)
          on conflict(id) do update set title=excluded.title,url=excluded.url,tag=excluded.tag,sort_order=excluded.sort_order;
        v_item_order := v_item_order + 1;
      end loop;
    end loop;
  end loop;
  if not coalesce(p_confirm_removals,false) and (
    exists(select 1 from public.phases where path_id=p_path_id and not(id=any(v_phase_ids))) or
    exists(select 1 from public.days d join public.phases p on p.id=d.phase_id where p.path_id=p_path_id and not(d.id=any(v_day_ids))) or
    exists(select 1 from public.lesson_items i join public.days d on d.id=i.day_id join public.phases p on p.id=d.phase_id
      where p.path_id=p_path_id and not(i.id=any(v_item_ids)))
  ) then raise exception 'Confirm curriculum removals before saving' using errcode = '22023'; end if;
  delete from public.lesson_items i using public.days d, public.phases p
    where i.day_id=d.id and d.phase_id=p.id and p.path_id=p_path_id and not(i.id=any(v_item_ids));
  delete from public.days d using public.phases p
    where d.phase_id=p.id and p.path_id=p_path_id and not(d.id=any(v_day_ids));
  delete from public.phases where path_id=p_path_id and not(id=any(v_phase_ids));
  update public.learning_paths set plan_revision=plan_revision+1, updated_at=now() where id=p_path_id;
  return public.read_learning_plan(p_path_id);
end;
$$;
revoke all on function public.save_learning_plan(uuid,uuid,jsonb,integer,boolean) from public, anon, authenticated;
grant execute on function public.save_learning_plan(uuid,uuid,jsonb,integer,boolean) to service_role;
