-- FixMate initial schema for Supabase PostgreSQL.
-- Run this entire file in Supabase SQL Editor on a new project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  suburb text,
  account_role text not null default 'both' check (account_role in ('customer','provider','both')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default '🔧',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider_type text not null check (provider_type in ('individual','business')),
  display_name text not null,
  description text,
  service_suburbs text[] not null default '{}',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_services (
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete cascade,
  primary key (provider_id, category_id)
);

create table if not exists public.job_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.service_categories(id),
  title text not null,
  description text not null,
  suburb text not null,
  status text not null default 'open' check (status in ('open','provider_selected','in_progress','completed','cancelled','expired')),
  preferred_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_requests_status_created_idx on public.job_requests(status, created_at desc);
create index if not exists job_requests_customer_idx on public.job_requests(customer_id, created_at desc);

create table if not exists public.job_request_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_requests(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_requests(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  message text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn','expired')),
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, provider_id)
);
create index if not exists quotations_job_idx on public.quotations(job_id, created_at);
create index if not exists quotations_provider_idx on public.quotations(provider_id, created_at desc);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.job_requests(id) on delete cascade,
  customer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.provider_profiles(user_id),
  quote_id uuid not null unique references public.quotations(id),
  agreed_amount numeric(12,2) not null check (agreed_amount > 0),
  status text not null default 'confirmed' check (status in ('confirmed','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.job_requests(id) on delete set null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(job_id, customer_id, provider_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  job_id uuid references public.job_requests(id) on delete set null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','actioned','dismissed')),
  admin_note text,
  created_at timestamptz not null default now()
);

-- New auth users automatically receive a profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Atomic quote acceptance: only the job owner can accept, and only one booking can be created.
create or replace function public.accept_quotation(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_quote public.quotations%rowtype;
  v_job public.job_requests%rowtype;
  v_booking_id uuid;
begin
  select * into v_quote from public.quotations where id = p_quote_id for update;
  if not found then raise exception 'Quotation not found'; end if;
  select * into v_job from public.job_requests where id = v_quote.job_id for update;
  if not found then raise exception 'Job request not found'; end if;
  if v_job.customer_id <> auth.uid() then raise exception 'Only the customer who posted this job can accept a quotation'; end if;
  if v_job.status <> 'open' then raise exception 'This job is no longer open'; end if;
  if v_quote.status <> 'pending' then raise exception 'This quotation is no longer pending'; end if;
  update public.quotations set status = case when id = p_quote_id then 'accepted' else 'declined' end, updated_at = now()
    where job_id = v_job.id and status = 'pending';
  update public.job_requests set status = 'provider_selected', updated_at = now() where id = v_job.id;
  insert into public.bookings(job_id,customer_id,provider_id,quote_id,agreed_amount,status)
    values(v_job.id,v_job.customer_id,v_quote.provider_id,v_quote.id,v_quote.amount,'confirmed') returning id into v_booking_id;
  return v_booking_id;
end; $$;
revoke all on function public.accept_quotation(uuid) from public;
grant execute on function public.accept_quotation(uuid) to authenticated;

-- Protect immutable booking parties and amount from client-side edits.
create or replace function public.guard_booking_update()
returns trigger language plpgsql as $$
begin
  if new.job_id <> old.job_id or new.customer_id <> old.customer_id or new.provider_id <> old.provider_id
     or new.quote_id <> old.quote_id or new.agreed_amount <> old.agreed_amount then
    raise exception 'Booking details cannot be changed after creation';
  end if;
  if new.status not in ('confirmed','in_progress','completed','cancelled') then
    raise exception 'Invalid booking status';
  end if;
  return new;
end; $$;
drop trigger if exists guard_booking_update_trigger on public.bookings;
create trigger guard_booking_update_trigger before update on public.bookings
for each row execute procedure public.guard_booking_update();

-- Prevent users from granting themselves admin privileges through their own profile.
revoke update on public.profiles from authenticated;
grant update(full_name, phone, suburb, account_role, updated_at) on public.profiles to authenticated;

-- Verification is admin-managed; provider owners cannot mark themselves verified.
create or replace function public.guard_provider_verification()
returns trigger language plpgsql as $$
begin
  if new.is_verified is distinct from old.is_verified then
    raise exception 'Provider verification can only be changed by an administrator';
  end if;
  return new;
end; $$;
drop trigger if exists guard_provider_verification_trigger on public.provider_profiles;
create trigger guard_provider_verification_trigger before update on public.provider_profiles
for each row execute procedure public.guard_provider_verification();

-- Keep the related job lifecycle in sync with booking progress.
create or replace function public.sync_job_from_booking()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'in_progress' then
      update public.job_requests set status='in_progress', updated_at=now() where id=new.job_id;
    elsif new.status = 'completed' then
      update public.job_requests set status='completed', updated_at=now() where id=new.job_id;
    elsif new.status = 'cancelled' then
      update public.job_requests set status='cancelled', updated_at=now() where id=new.job_id;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists sync_job_from_booking_trigger on public.bookings;
create trigger sync_job_from_booking_trigger after update on public.bookings
for each row execute procedure public.sync_job_from_booking();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_services enable row level security;
alter table public.job_requests enable row level security;
alter table public.job_request_photos enable row level security;
alter table public.quotations enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

-- Profiles: users can read/update their own private profile; provider directory uses public provider_profiles.
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

 drop policy if exists "categories readable" on public.service_categories;
create policy "categories readable" on public.service_categories for select to authenticated using (is_active or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));

drop policy if exists "provider directory readable" on public.provider_profiles;
create policy "provider directory readable" on public.provider_profiles for select to authenticated using (true);
drop policy if exists "provider owner insert" on public.provider_profiles;
create policy "provider owner insert" on public.provider_profiles for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "provider owner update" on public.provider_profiles;
create policy "provider owner update" on public.provider_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "provider services readable" on public.provider_services;
create policy "provider services readable" on public.provider_services for select to authenticated using (true);
drop policy if exists "provider services owner manage" on public.provider_services;
create policy "provider services owner manage" on public.provider_services for all to authenticated using (provider_id=auth.uid()) with check (provider_id=auth.uid());

-- A customer sees their own requests; signed-in providers can see open requests to quote.
drop policy if exists "job requests visible to participants" on public.job_requests;
create policy "job requests visible to participants" on public.job_requests for select to authenticated using (
 customer_id=auth.uid() or (status='open' and exists(select 1 from public.provider_profiles pp where pp.user_id=auth.uid()))
 or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin)
);
drop policy if exists "customers create own jobs" on public.job_requests;
create policy "customers create own jobs" on public.job_requests for insert to authenticated with check (customer_id=auth.uid());
drop policy if exists "customers update own jobs" on public.job_requests;
create policy "customers update own jobs" on public.job_requests for update to authenticated using (customer_id=auth.uid()) with check (customer_id=auth.uid());

drop policy if exists "job photos participant read" on public.job_request_photos;
create policy "job photos participant read" on public.job_request_photos for select to authenticated using (exists(select 1 from public.job_requests j where j.id=job_id and (j.customer_id=auth.uid() or j.status='open')));
drop policy if exists "job owner photo insert" on public.job_request_photos;
create policy "job owner photo insert" on public.job_request_photos for insert to authenticated with check (exists(select 1 from public.job_requests j where j.id=job_id and j.customer_id=auth.uid()));

drop policy if exists "quotes visible to job parties" on public.quotations;
create policy "quotes visible to job parties" on public.quotations for select to authenticated using (
 provider_id=auth.uid() or exists(select 1 from public.job_requests j where j.id=job_id and j.customer_id=auth.uid())
 or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin)
);
drop policy if exists "providers create own quotes" on public.quotations;
create policy "providers create own quotes" on public.quotations for insert to authenticated with check (
 provider_id=auth.uid() and exists(select 1 from public.provider_profiles pp where pp.user_id=auth.uid())
 and exists(select 1 from public.job_requests j where j.id=job_id and j.status='open' and j.customer_id<>auth.uid())
);
drop policy if exists "providers update own pending quotes" on public.quotations;
create policy "providers update own pending quotes" on public.quotations for update to authenticated using (provider_id=auth.uid() and status='pending') with check (provider_id=auth.uid());

 drop policy if exists "booking parties read" on public.bookings;
create policy "booking parties read" on public.bookings for select to authenticated using (customer_id=auth.uid() or provider_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
drop policy if exists "booking parties update" on public.bookings;
create policy "booking parties update" on public.bookings for update to authenticated using (customer_id=auth.uid() or provider_id=auth.uid()) with check (customer_id=auth.uid() or provider_id=auth.uid());

drop policy if exists "conversation participants read" on public.conversations;
create policy "conversation participants read" on public.conversations for select to authenticated using (customer_id=auth.uid() or provider_id=auth.uid());
drop policy if exists "conversation participant create" on public.conversations;
create policy "conversation participant create" on public.conversations for insert to authenticated with check (customer_id=auth.uid() or provider_id=auth.uid());
drop policy if exists "message participants read" on public.messages;
create policy "message participants read" on public.messages for select to authenticated using (exists(select 1 from public.conversations c where c.id=conversation_id and (c.customer_id=auth.uid() or c.provider_id=auth.uid())));
drop policy if exists "conversation participants send" on public.messages;
create policy "conversation participants send" on public.messages for insert to authenticated with check (sender_id=auth.uid() and exists(select 1 from public.conversations c where c.id=conversation_id and (c.customer_id=auth.uid() or c.provider_id=auth.uid())));

drop policy if exists "reviews publicly readable" on public.reviews;
create policy "reviews publicly readable" on public.reviews for select to authenticated using (true);
drop policy if exists "customer review completed booking" on public.reviews;
create policy "customer review completed booking" on public.reviews for insert to authenticated with check (customer_id=auth.uid() and exists(select 1 from public.bookings b where b.id=booking_id and b.customer_id=auth.uid() and b.status='completed' and b.provider_id=provider_id));

drop policy if exists "reporter creates own report" on public.reports;
create policy "reporter creates own report" on public.reports for insert to authenticated with check (reporter_id=auth.uid());
drop policy if exists "reporter and admin read reports" on public.reports;
create policy "reporter and admin read reports" on public.reports for select to authenticated using (reporter_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));

-- Starter service categories. Safe to re-run.
insert into public.service_categories(name,icon) values
 ('Plumbing','🚰'),('Electrical','💡'),('Cleaning','🧹'),('Painting','🖌️'),('Gardening','🌿'),
 ('Carpentry','🪚'),('Appliance repairs','🔧'),('Moving','📦'),('Building & renovations','🏠'),('Other','🛠️')
on conflict(name) do nothing;
