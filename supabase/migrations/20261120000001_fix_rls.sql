-- =============================================================
-- CRITICAL FIX: Orders RLS policies
-- Users need INSERT on orders to place orders,
-- and INSERT on order_items for order line items.
-- Run this in Supabase SQL Editor immediately.
-- =============================================================

-- Allow authenticated users to INSERT their own orders
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='orders'
    and policyname='Users can place orders'
  ) then
    create policy "Users can place orders"
      on public.orders for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Allow authenticated users to INSERT order items for their own orders
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='order_items'
    and policyname='Users can insert own order items'
  ) then
    create policy "Users can insert own order items"
      on public.order_items for insert
      with check (
        exists (
          select 1 from public.orders o
          where o.id = order_id and o.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Allow service_role to do everything on orders (admin access)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='orders'
    and policyname='Service role full access orders'
  ) then
    create policy "Service role full access orders"
      on public.orders for all
      using (auth.role() = 'service_role');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='order_items'
    and policyname='Service role full access order items'
  ) then
    create policy "Service role full access order items"
      on public.order_items for all
      using (auth.role() = 'service_role');
  end if;
end $$;

-- Add is_admin column to profiles if not already there
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Add contact submissions table
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);
alter table public.contact_submissions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='contact_submissions'
    and policyname='Anyone can submit contact form'
  ) then
    create policy "Anyone can submit contact form"
      on public.contact_submissions for insert with check (true);
  end if;
end $$;

-- Mark featured products
alter table public.products add column if not exists is_featured boolean not null default false;
update public.products set is_featured = true
where slug in ('smartphone','smart-tv','bluetooth-speaker','wireless-headphones');

-- Enable Realtime on orders
alter publication supabase_realtime add table public.orders;

select 'RLS fix applied successfully' as status;
