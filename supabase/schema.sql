-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles (auto-created from auth.users by trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    phone = coalesce(excluded.phone, profiles.phone);
  return new;
end;$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Categories
create table if not exists public.categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique
);
alter table public.categories enable row level security;
create policy "Anyone can read categories" on public.categories for select using (true);

insert into public.categories (name, slug) values
  ('All', 'all'),
  ('Phone', 'phone'),
  ('TV', 'tv'),
  ('Speaker', 'speaker'),
  ('Home', 'home'),
  ('Wear', 'wear'),
  ('Bags', 'bags')
on conflict (slug) do nothing;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_kes integer not null,
  stock integer not null default 0,
  is_active boolean not null default true,
  image_url text,
  tint text default 'sage',
  category_id integer references public.categories(id),
  sizes text[] default '{}',
  created_at timestamptz default now()
);
alter table public.products enable row level security;
create policy "Anyone can read active products" on public.products for select using (is_active = true);

-- Seed sample products
insert into public.products (name, slug, description, price_kes, stock, tint, category_id, sizes, image_url) values
  ('Pro 5G Smartphone', 'smartphone', '6.7-inch OLED display, triple 8K camera system, fast charging, and all-day battery life.', 48000, 25, 'sky', (select id from public.categories where slug='phone'), array['128GB','256GB','512GB'], 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'),
  ('55" 4K Smart OLED TV', 'smart-tv', 'Ultra-slim 4K UHD smart television with Dolby Vision, HDR10+, and built-in apps.', 68000, 12, 'sage', (select id from public.categories where slug='tv'), array['50-inch','55-inch','65-inch'], 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80'),
  ('Portable Bluetooth Speaker', 'bluetooth-speaker', '360-degree deep acoustic bass, IPX7 waterproof casing, and 20 hours battery.', 6500, 40, 'sand', (select id from public.categories where slug='speaker'), array['Standard','Plus with Strap'], 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80'),
  ('Studio Wireless Headphones', 'wireless-headphones', 'Active noise cancellation with high-fidelity studio acoustics and memory-foam earcups.', 14500, 35, 'rose', (select id from public.categories where slug='speaker'), array['Midnight Black','Sand Dune'], 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'),
  ('Linen shirt', 'linen-shirt', 'A breathable everyday shirt in washed linen. Relaxed fit, easy to layer.', 3200, 50, 'sage', (select id from public.categories where slug='wear'), array['S','M','L','XL'], 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80'),
  ('Ceramic mug', 'ceramic-mug', 'Hand-thrown ceramic mug. Holds 300ml. Dishwasher safe.', 950, 100, 'sand', (select id from public.categories where slug='home'), array['One size'], 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'),
  ('Canvas tote', 'canvas-tote', 'Heavy-duty canvas tote bag. 15L capacity. Inside zip pocket.', 1800, 75, 'sky', (select id from public.categories where slug='bags'), array['One size'], 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'),
  ('Desk lamp', 'desk-lamp', 'Minimalist LED desk lamp with 3 colour temperatures. USB-C powered.', 4500, 30, 'rose', (select id from public.categories where slug='home'), array['One size'], 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80')
on conflict (slug) do nothing;

-- Cart items
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default 'One size',
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id, size)
);
alter table public.cart_items enable row level security;
create policy "Users manage own cart" on public.cart_items for all using (auth.uid() = user_id);

-- Orders
create sequence if not exists public.order_no_seq start 1000;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no integer not null default nextval('public.order_no_seq'),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','paid','shipped','delivered','cancelled')),
  subtotal_kes integer not null,
  delivery_kes integer not null default 250,
  total_kes integer not null,
  ship_name text,
  ship_phone text,
  ship_address text,
  paystack_reference text unique,
  created_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Users read own orders" on public.orders for select using (auth.uid() = user_id);

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  unit_price_kes integer not null,
  size text,
  quantity integer not null
);
alter table public.order_items enable row level security;
create policy "Users read own order items" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  reference text not null unique,
  amount_kes integer not null,
  channel text,
  status text,
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz default now()
);
alter table public.payments enable row level security;
create policy "Users read own payments" on public.payments for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- fulfil_order function
create or replace function public.fulfil_order(
  p_reference text, p_amount_kes integer, p_currency text,
  p_channel text, p_paid_at timestamptz, p_raw jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where paystack_reference = p_reference for update;
  if not found then raise exception 'Unknown reference %', p_reference; end if;
  if o.status <> 'pending' then return; end if; -- already handled
  if p_currency <> 'KES' or p_amount_kes <> o.total_kes then
    raise exception 'Amount mismatch for %', p_reference;
  end if;

  insert into public.payments (order_id, reference, amount_kes, channel, status, raw, paid_at)
  values (o.id, p_reference, p_amount_kes, p_channel, 'success', p_raw, p_paid_at)
  on conflict (reference) do nothing;

  update public.orders set status = 'paid' where id = o.id;

  update public.products p set stock = greatest(p.stock - oi.quantity, 0)
  from public.order_items oi where oi.order_id = o.id and oi.product_id = p.id;

  delete from public.cart_items where user_id = o.user_id;
end $$;

revoke all on function public.fulfil_order from public, anon, authenticated;
