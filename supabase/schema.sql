create extension if not exists "pgcrypto";

create type order_status as enum ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled');
create type payment_method as enum ('cod');

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text not null,
  story text not null default '',
  price integer not null check (price > 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price > price),
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  is_best_seller boolean not null default false,
  badge text,
  benefits text[] not null default '{}',
  specs text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text not null,
  sort_order integer not null default 0
);

create table variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  color text not null,
  stock integer not null default 0 check (stock >= 0)
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references variants(id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  city text not null,
  area text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null,
  area text not null,
  address text not null,
  note text,
  status order_status not null default 'pending',
  payment_method payment_method not null default 'cod',
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  attribution jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  variant_id text not null,
  product_name text not null,
  variant_name text not null,
  unit_price integer not null check (unit_price > 0),
  quantity integer not null check (quantity > 0),
  total integer not null check (total >= 0)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  author text not null,
  location text,
  rating integer not null check (rating between 1 and 5),
  quote text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  amount integer not null default 0 check (amount >= 0),
  minimum_subtotal integer not null default 0 check (minimum_subtotal >= 0),
  active boolean not null default true,
  expires_at timestamptz
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id text,
  product_id text,
  order_id uuid,
  value integer,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table variants enable row level security;
alter table reviews enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public categories are readable" on categories for select using (true);
create policy "Published products are readable" on products for select using (published = true);
create policy "Product images are readable" on product_images for select using (true);
create policy "Variants are readable" on variants for select using (true);
create policy "Published reviews are readable" on reviews for select using (published = true);

-- Inserts for orders/order_items should be performed through the server-side service role.
