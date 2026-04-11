-- 1) Portfolio content (single-row JSON document)
create table if not exists public.portfolio_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.portfolio_content enable row level security;

-- Public read for website visitors
drop policy if exists "portfolio_content_public_read" on public.portfolio_content;
create policy "portfolio_content_public_read"
on public.portfolio_content
for select
to anon, authenticated
using (true);

-- Authenticated admin write
drop policy if exists "portfolio_content_admin_write" on public.portfolio_content;
create policy "portfolio_content_admin_write"
on public.portfolio_content
for all
to authenticated
using (true)
with check (true);

-- 2) Optional username -> email mapping table (for login form username support)
create table if not exists public.admin_users (
  username text primary key,
  email text unique not null
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_read_for_login" on public.admin_users;
create policy "admin_users_read_for_login"
on public.admin_users
for select
to anon, authenticated
using (true);

drop policy if exists "admin_users_insert_own_email" on public.admin_users;
create policy "admin_users_insert_own_email"
on public.admin_users
for insert
to authenticated
with check (email = auth.jwt() ->> 'email');

drop policy if exists "admin_users_update_own_email" on public.admin_users;
create policy "admin_users_update_own_email"
on public.admin_users
for update
to authenticated
using (email = auth.jwt() ->> 'email')
with check (email = auth.jwt() ->> 'email');

drop policy if exists "admin_users_delete_own_email" on public.admin_users;
create policy "admin_users_delete_own_email"
on public.admin_users
for delete
to authenticated
using (email = auth.jwt() ->> 'email');

-- 3) Seed initial portfolio row (optional)
insert into public.portfolio_content (id, data)
values (
  'primary',
  '{"version":1,"updatedAt":"1970-01-01T00:00:00.000Z","categories":[]}'::jsonb
)
on conflict (id) do nothing;

-- 4) Storage bucket + upload policies
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

drop policy if exists "portfolio_images_public_read" on storage.objects;
create policy "portfolio_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-images');

drop policy if exists "portfolio_images_authenticated_upload" on storage.objects;
create policy "portfolio_images_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-images');

drop policy if exists "portfolio_images_authenticated_update" on storage.objects;
create policy "portfolio_images_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-images')
with check (bucket_id = 'portfolio-images');

drop policy if exists "portfolio_images_authenticated_delete" on storage.objects;
create policy "portfolio_images_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-images');
