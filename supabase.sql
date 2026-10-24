create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null default 0 check (price >= 0),
  description text not null default '',
  category text not null default 'tops' check (category in ('tops','bottoms','sets','outerwear')),
  badge text not null default 'CORE',
  sizes text[] not null default array['S','M','L'],
  image_urls text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select
to anon, authenticated using (is_active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all
to authenticated using (true) with check (true);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute procedure public.set_updated_at();

insert into storage.buckets (id,name,public)
values ('product-images','product-images',true)
on conflict (id) do update set public=true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects for select
to anon, authenticated using (bucket_id='product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects for insert
to authenticated with check (bucket_id='product-images');

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects for update
to authenticated using (bucket_id='product-images') with check (bucket_id='product-images');

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects for delete
to authenticated using (bucket_id='product-images');

-- Create the admin account manually in Supabase:
-- Authentication -> Users -> Add user.
