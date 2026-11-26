-- TRACKED PATH INVITATIONS
create table public.path_invitations (
  id uuid primary key,
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  path_title text not null,
  sender_id uuid not null references auth.users(id),
  sender_email text not null,
  recipient_email text not null check (char_length(recipient_email) between 3 and 254 and recipient_email = lower(btrim(recipient_email))),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  accepted_user_id uuid references auth.users(id),
  accepted_at timestamptz,
  unique (sender_id, path_id, recipient_email)
);

create table public.path_invitation_deliveries (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.path_invitations(id) on delete cascade,
  kind text not null check (kind in ('initial', 'reminder')),
  status text not null default 'reserved' check (status in ('reserved', 'sent', 'failed', 'unknown')),
  provider text not null,
  provider_message_id text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index path_invitations_recipient_idx on public.path_invitations(recipient_email);
create index path_invitations_path_id_idx on public.path_invitations(path_id);
create index path_invitations_recent_idx on public.path_invitations(created_at desc, id desc);
create index path_invitations_sender_recent_idx on public.path_invitations(sender_id, created_at desc, id desc);
create index path_invitation_deliveries_history_idx on public.path_invitation_deliveries(invitation_id, created_at desc);
create index path_invitation_deliveries_recent_idx on public.path_invitation_deliveries(created_at);
create unique index path_invitation_deliveries_initial_idx on public.path_invitation_deliveries(invitation_id) where kind = 'initial';

alter table public.path_invitations enable row level security;
alter table public.path_invitation_deliveries enable row level security;
revoke all on public.path_invitations, public.path_invitation_deliveries from public, anon, authenticated, service_role;
grant select, insert, update on public.path_invitations, public.path_invitation_deliveries to service_role;

create function public.reserve_path_invitation_delivery(
  p_sender uuid, p_sender_email text, p_path uuid, p_invitation uuid,
  p_recipient text, p_token_hash text, p_provider text, p_reminder boolean
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_invite public.path_invitations;
  v_path public.learning_paths;
  v_delivery uuid;
  v_reminders integer;
begin
  -- Serialize reservations so concurrent requests cannot bypass sender or project limits.
  perform pg_advisory_xact_lock(hashtextextended('odu:path-invitation-delivery', 0));

  if p_reminder then
    select * into v_invite from public.path_invitations
      where id = p_invitation and sender_id = p_sender for update;
    if not found then return jsonb_build_object('status', 'unavailable'); end if;
    p_path := v_invite.path_id;
  end if;

  select * into v_path from public.learning_paths
    where id = p_path and visibility = 'public' and wall_status = 'approved';
  if not found then return jsonb_build_object('status', 'unavailable'); end if;

  if p_reminder then
    if v_invite.token_hash is distinct from p_token_hash
      or v_invite.expires_at <= now()
      or exists (select 1 from public.path_memberships where path_id = p_path and user_id = v_invite.accepted_user_id)
      then return jsonb_build_object('status', 'unavailable'); end if;

    select count(*) into v_reminders from public.path_invitation_deliveries
      where invitation_id = p_invitation and kind = 'reminder';
    if v_reminders >= 2 or exists (
      select 1 from public.path_invitation_deliveries where invitation_id = p_invitation
        and (created_at > now() - interval '24 hours' or status in ('reserved', 'unknown'))
    ) then return jsonb_build_object('status', 'reminder_limited'); end if;
  elsif p_recipient = p_sender_email or exists (
    select 1 from public.path_invitations
    where sender_id = p_sender and path_id = p_path and recipient_email = p_recipient
  ) then return jsonb_build_object('status', 'duplicate'); end if;

  if (select count(*) from public.path_invitation_deliveries d join public.path_invitations i on i.id = d.invitation_id
       where i.recipient_email = coalesce(v_invite.recipient_email, p_recipient) and d.created_at > now() - interval '24 hours') >= 3
    or (select count(*) from public.path_invitation_deliveries where created_at > now() - interval '24 hours') >= 80
    or (select count(*) from public.path_invitation_deliveries d join public.path_invitations i on i.id = d.invitation_id
        where i.sender_id = p_sender and d.created_at > now() - interval '24 hours') >= 20
    then return jsonb_build_object('status', 'rate_limited'); end if;

  if not p_reminder then
    insert into public.path_invitations (id,path_id,path_title,sender_id,sender_email,recipient_email,token_hash)
      values (p_invitation,p_path,v_path.title,p_sender,p_sender_email,p_recipient,p_token_hash)
      returning * into v_invite;
  end if;
  insert into public.path_invitation_deliveries (invitation_id,kind,provider)
    values (p_invitation, case when p_reminder then 'reminder' else 'initial' end, p_provider)
    returning id into v_delivery;

  return jsonb_build_object('status','reserved','deliveryId',v_delivery,'recipient',v_invite.recipient_email,
    'title',v_path.title,'description',v_path.description);
end;
$$;

create function public.accept_path_invitation(p_hash text, p_user uuid, p_email text)
returns uuid
language sql
set search_path = ''
as $$
  update public.path_invitations i
  set accepted_at = coalesce(i.accepted_at, now()), accepted_user_id = p_user
  from public.learning_paths p
  where i.token_hash = p_hash and i.recipient_email = p_email and i.expires_at > now()
    and (i.accepted_user_id is null or i.accepted_user_id = p_user)
    and p.id = i.path_id and p.visibility = 'public' and p.wall_status = 'approved'
  returning i.path_id;
$$;

create view public.path_invitation_status with (security_invoker = true) as
select i.id, i.path_id, i.path_title, i.sender_id, i.sender_email, i.recipient_email,
  i.created_at, i.expires_at, i.accepted_at,
  case
    when pm.status = 'approved' then 'joined'
    when pm.status = 'pending' then 'join_pending'
    when pm.status = 'rejected' then 'join_declined'
    when i.accepted_at is not null then 'accepted'
    when i.expires_at <= now() then 'expired'
    when d.last_status = 'sent' then 'sent'
    when d.last_status = 'failed' then 'failed'
    else 'unconfirmed'
  end as status,
  d.last_status, d.last_attempt_at, d.reminders, d.initial_sent,
  (p.visibility = 'public' and p.wall_status = 'approved' and i.expires_at > now()
    and pm.id is null and d.reminders < 2 and not d.has_unconfirmed
    and d.last_attempt_at <= now() - interval '24 hours') as can_remind,
  (pm.status = 'approved' and pm.joined_at >= i.accepted_at) is true as joined_after_acceptance
from public.path_invitations i
join public.learning_paths p on p.id = i.path_id
left join public.path_memberships pm on pm.path_id = i.path_id and pm.user_id = i.accepted_user_id
cross join lateral (
  select (array_agg(status order by created_at desc, id desc))[1] as last_status,
    max(created_at) as last_attempt_at, count(*) filter (where kind = 'reminder') as reminders,
    coalesce(bool_or(kind = 'initial' and status = 'sent'), false) as initial_sent,
    coalesce(bool_or(status in ('unknown', 'reserved')), false) as has_unconfirmed
  from public.path_invitation_deliveries where invitation_id = i.id
) d;

revoke all on public.path_invitation_status from public, anon, authenticated, service_role;
grant select on public.path_invitation_status to service_role;
revoke execute on function public.reserve_path_invitation_delivery(uuid,text,uuid,uuid,text,text,text,boolean),
  public.accept_path_invitation(text,uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_path_invitation_delivery(uuid,text,uuid,uuid,text,text,text,boolean),
  public.accept_path_invitation(text,uuid,text) to service_role;

create function public.path_invitation_totals(p_sender uuid)
returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'sent', count(*) filter (where initial_sent),
    'reminders', coalesce(sum(reminders), 0),
    'accepted', count(*) filter (where accepted_at is not null),
    'joined', count(*) filter (where joined_after_acceptance)
  )
  from public.path_invitation_status
  where p_sender is null or sender_id = p_sender;
$$;
revoke execute on function public.path_invitation_totals(uuid) from public, anon, authenticated;
grant execute on function public.path_invitation_totals(uuid) to service_role;
