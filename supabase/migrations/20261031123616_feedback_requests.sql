create table public.feedback_requests (
	id uuid primary key default public.uuid_generate_v4(),
	user_id uuid references auth.users(id) on delete set null,
	name text not null check (length(btrim(name)) between 1 and 100),
	email text not null check (
		email = lower(btrim(email))
		and length(email) <= 320
		and email ~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$'
	),
	phone text check (phone is null or (length(phone) <= 40 and phone ~ '^[+()0-9 .-]+$')),
	request_type text not null check (request_type in ('query', 'feedback', 'bug', 'business_enquiry')),
	message text not null check (
		length(btrim(message)) between 10 and 4000
		and position('<' in message) = 0
		and position('>' in message) = 0
	),
	status text not null default 'open' check (status in ('open', 'in_progress', 'answered', 'closed')),
	response_text text check (
		response_text is null
		or (length(btrim(response_text)) between 1 and 5000 and position('<' in response_text) = 0 and position('>' in response_text) = 0)
	),
	responded_by uuid references auth.users(id) on delete set null,
	responded_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint feedback_requests_response_timestamp_check check ((response_text is null) = (responded_at is null)),
	constraint feedback_requests_answered_response_check check (status <> 'answered' or response_text is not null)
);

create index feedback_requests_open_email_idx
	on public.feedback_requests (email)
	where status in ('open', 'in_progress');

create index feedback_requests_admin_queue_idx
	on public.feedback_requests (request_type, status, created_at desc);

alter table public.feedback_requests enable row level security;
revoke all on table public.feedback_requests from public, anon, authenticated;
grant select, insert, update on table public.feedback_requests to service_role;

create function public.submit_feedback_request(
	p_name text,
	p_email text,
	p_phone text,
	p_request_type text,
	p_message text,
	p_user_id uuid default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
	v_email text;
	v_open_count integer;
	v_request_id uuid;
begin
	if p_name is null or length(btrim(p_name)) not between 1 and 100
		 or position('<' in p_name) > 0 or position('>' in p_name) > 0 then
		raise exception 'invalid_feedback_name' using errcode = '22023';
	end if;

	if p_email is null or length(btrim(p_email)) > 320
		 or btrim(p_email) !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$' then
		raise exception 'invalid_feedback_email' using errcode = '22023';
	end if;

	if p_phone is not null and (length(p_phone) > 40 or p_phone !~ '^[+()0-9 .-]+$') then
		raise exception 'invalid_feedback_phone' using errcode = '22023';
	end if;

	if p_request_type is null or p_request_type not in ('query', 'feedback', 'bug', 'business_enquiry') then
		raise exception 'invalid_feedback_type' using errcode = '22023';
	end if;

	if p_message is null or length(btrim(p_message)) not between 10 and 4000
		 or position('<' in p_message) > 0 or position('>' in p_message) > 0 then
		raise exception 'invalid_feedback_message' using errcode = '22023';
	end if;

	v_email := lower(btrim(p_email));
	perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_email, 0));

	select count(*)::integer into v_open_count
	from public.feedback_requests
	where email = v_email and status in ('open', 'in_progress');

	if v_open_count >= 2 then
		raise exception 'feedback_open_request_limit' using errcode = 'P0001';
	end if;

	insert into public.feedback_requests (name, email, phone, request_type, message, user_id)
	values (btrim(p_name), v_email, nullif(btrim(p_phone), ''), p_request_type, btrim(p_message), p_user_id)
	returning id into v_request_id;

	return v_request_id;
end;
$$;

revoke all on function public.submit_feedback_request(text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.submit_feedback_request(text, text, text, text, text, uuid) to service_role;
