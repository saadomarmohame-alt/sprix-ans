-- Run this whole file in Supabase Dashboard -> SQL Editor -> New query.
create table if not exists public.membership_codes (
  code text primary key,
  days integer not null check (days between 1 and 3650),
  used boolean not null default false,
  used_device_hash text,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  device_hash text primary key,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.membership_codes enable row level security;
alter table public.memberships enable row level security;

-- No public policies: only the server's service-role key accesses these tables.
revoke all on public.membership_codes from anon, authenticated;
revoke all on public.memberships from anon, authenticated;

create or replace function public.check_membership(p_device_hash text)
returns table(active boolean, expires_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select (m.expires_at > now()) as active, m.expires_at
  from public.memberships m
  where m.device_hash = p_device_hash
  limit 1;
$$;

create or replace function public.redeem_membership_code(p_code text, p_device_hash text)
returns table(days integer, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer;
  v_used boolean;
  v_old_expiry timestamptz;
  v_new_expiry timestamptz;
begin
  select c.days, c.used into v_days, v_used
  from public.membership_codes c
  where c.code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'CODE_NOT_FOUND';
  end if;
  if v_used then
    raise exception 'CODE_ALREADY_USED';
  end if;

  select m.expires_at into v_old_expiry
  from public.memberships m
  where m.device_hash = p_device_hash;

  v_new_expiry := greatest(coalesce(v_old_expiry, now()), now()) + make_interval(days => v_days);

  update public.membership_codes
    set used = true, used_device_hash = p_device_hash, used_at = now()
    where code = upper(trim(p_code));

  insert into public.memberships(device_hash, expires_at, updated_at)
    values (p_device_hash, v_new_expiry, now())
  on conflict (device_hash) do update
    set expires_at = excluded.expires_at, updated_at = now();

  return query select v_days, v_new_expiry;
end;
$$;

revoke all on function public.check_membership(text) from public, anon, authenticated;
revoke all on function public.redeem_membership_code(text, text) from public, anon, authenticated;
grant execute on function public.check_membership(text) to service_role;
grant execute on function public.redeem_membership_code(text, text) to service_role;
