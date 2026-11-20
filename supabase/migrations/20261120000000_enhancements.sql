-- =============================================================
-- Nuru Ecommerce — Database Migration Script
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pafqchmiccupefpwypjz/sql/new
-- =============================================================

-- ── 1. Splash-screen / User Preferences ──────────────────────
-- (optional) track which users have seen the splash, server-side
create table if not exists public.user_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  splash_seen boolean not null default false,
  updated_at timestamptz default now()
);
alter table public.user_preferences enable row level security;
create policy if not exists "Users manage own preferences"
  on public.user_preferences for all using (auth.uid() = id);

-- ── 2. Contact form submissions ───────────────────────────────
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);
alter table public.contact_submissions enable row level security;
-- Allow anon insert so non-logged-in users can submit contact form
create policy if not exists "Anyone can submit contact form"
  on public.contact_submissions for insert with check (true);
create policy if not exists "Admin reads contact submissions"
  on public.contact_submissions for select using (auth.role() = 'service_role');

-- ── 3. Order status history (audit trail) ────────────────────
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz default now()
);
alter table public.order_status_history enable row level security;
create policy if not exists "Users read own order history"
  on public.order_status_history for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));

-- Trigger to auto-log status changes
create or replace function public.log_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if OLD.status is distinct from NEW.status then
    insert into public.order_status_history (order_id, old_status, new_status)
    values (NEW.id, OLD.status, NEW.status);
  end if;
  return NEW;
end;$$;

drop trigger if exists order_status_audit on public.orders;
create trigger order_status_audit
  after update of status on public.orders
  for each row execute procedure public.log_order_status_change();

-- ── 4. Admin role guard on orders ─────────────────────────────
-- Allow service_role (and authenticated with is_admin flag) full access
create policy if not exists "Admin can manage all orders"
  on public.orders for all using (auth.role() = 'service_role');

create policy if not exists "Admin can manage all order items"
  on public.order_items for all using (auth.role() = 'service_role');

create policy if not exists "Admin can manage all payments"
  on public.payments for all using (auth.role() = 'service_role');

-- ── 5. Realtime enable for live order alerts ─────────────────
-- Enable Realtime on orders so the admin dashboard receives live pushes
-- (Do this in the Supabase Dashboard > Database > Replication > Tables
--  OR via the CLI, but the SQL way is to add it to the publication)
alter publication supabase_realtime add table public.orders;

-- ── 6. Product views (analytics) ─────────────────────────────
create table if not exists public.product_views (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz default now()
);
alter table public.product_views enable row level security;
create policy if not exists "Anyone can record a product view"
  on public.product_views for insert with check (true);

-- ── 7. Extend profiles with more delivery fields ──────────────
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists default_address text,
  add column if not exists is_admin boolean not null default false;

-- ── 8. Add "featured" flag to products ───────────────────────
alter table public.products
  add column if not exists is_featured boolean not null default false;

-- Mark some products as featured
update public.products set is_featured = true
where slug in ('smartphone', 'smart-tv', 'bluetooth-speaker', 'wireless-headphones');

-- ── 9. Full-text search index on products ────────────────────
alter table public.products
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
    ) stored;

create index if not exists products_search_idx on public.products using gin(search_vector);

-- ── 10. Seed: ensure categories and products are present ─────
insert into public.categories (name, slug) values
  ('All',     'all'),
  ('Phone',   'phone'),
  ('TV',      'tv'),
  ('Speaker', 'speaker'),
  ('Home',    'home'),
  ('Wear',    'wear'),
  ('Bags',    'bags')
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price_kes, stock, tint, category_id, sizes, image_url, is_featured) values
  ('Pro 5G Smartphone',          'smartphone',         '6.7-inch OLED display, triple 8K camera system, fast charging, and all-day battery life.',              48000, 25, 'sky',  (select id from public.categories where slug='phone'),   array['128GB','256GB','512GB'],            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80', true),
  ('55" 4K Smart OLED TV',       'smart-tv',           'Ultra-slim 4K UHD smart television with Dolby Vision, HDR10+, and built-in apps.',                       68000, 12, 'sage', (select id from public.categories where slug='tv'),      array['50-inch','55-inch','65-inch'],      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80', true),
  ('Portable Bluetooth Speaker', 'bluetooth-speaker',  '360-degree deep acoustic bass, IPX7 waterproof casing, and 20 hours battery.',                           6500,  40, 'sand', (select id from public.categories where slug='speaker'), array['Standard','Plus with Strap'],      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', true),
  ('Studio Wireless Headphones', 'wireless-headphones','Active noise cancellation with high-fidelity studio acoustics and memory-foam earcups.',                 14500, 35, 'rose', (select id from public.categories where slug='speaker'), array['Midnight Black','Sand Dune'],      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', true),
  ('Linen shirt',                'linen-shirt',        'A breathable everyday shirt in washed linen. Relaxed fit, easy to layer.',                                3200,  50, 'sage', (select id from public.categories where slug='wear'),    array['S','M','L','XL'],                  'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80', false),
  ('Ceramic mug',                'ceramic-mug',        'Hand-thrown ceramic mug. Holds 300ml. Dishwasher safe.',                                                   950, 100, 'sand', (select id from public.categories where slug='home'),    array['One size'],                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', false),
  ('Canvas tote',                'canvas-tote',        'Heavy-duty canvas tote bag. 15L capacity. Inside zip pocket.',                                            1800,  75, 'sky',  (select id from public.categories where slug='bags'),    array['One size'],                        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', false),
  ('Desk lamp',                  'desk-lamp',          'Minimalist LED desk lamp with 3 colour temperatures. USB-C powered.',                                     4500,  30, 'rose', (select id from public.categories where slug='home'),    array['One size'],                        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', false)
on conflict (slug) do update set
  is_featured = excluded.is_featured,
  image_url   = excluded.image_url,
  description = excluded.description,
  price_kes   = excluded.price_kes;
