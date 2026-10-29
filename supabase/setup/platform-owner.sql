-- New installations only. First sign in normally so Supabase Auth creates a confirmed user.
-- In the SAME SQL Editor session, set the intended owner before running this file:
-- select set_config('odu.owner_email', 'your-owner@example.com', false);
-- This does not create Auth users, reset passwords, or alter path memberships.
do $$
declare
  v_email text := nullif(btrim(current_setting('odu.owner_email', true)), '');
  v_user_id uuid;
begin
  if v_email is null then
    raise exception 'Set odu.owner_email in this session first';
  end if;
  select id into v_user_id from auth.users
    where lower(email) = lower(v_email) and email_confirmed_at is not null;
  if v_user_id is null then
    raise exception 'The intended owner must sign in and confirm their email first';
  end if;
  insert into public.platform_admins(user_id) values(v_user_id) on conflict(user_id) do nothing;
  raise notice 'Set server environment PLATFORM_OWNER_ID=% and PLATFORM_OWNER_EMAIL=%', v_user_id, lower(v_email);
end;
$$;
