-- BarGo Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null check (role in ('admin', 'waiter', 'bar', 'kitchen')),
  pin text not null unique,
  created_at timestamptz default now()
);

alter table profiles disable row level security;

-- ─── tables ──────────────────────────────────────────────────────────────────
create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  zone text,
  status text not null default 'free' check (status in ('free', 'occupied')),
  created_at timestamptz default now()
);

alter table tables disable row level security;

-- ─── categories ──────────────────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name_es text not null,
  name_zh text not null,
  station text not null check (station in ('bar', 'kitchen')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table categories disable row level security;

-- ─── products ────────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name_es text not null,
  name_zh text not null,
  price numeric(10,2) not null default 0,
  category_id uuid not null references categories(id) on delete cascade,
  active boolean not null default true,
  image_url text,
  created_at timestamptz default now()
);

alter table products disable row level security;

-- ─── orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references tables(id) on delete cascade,
  waiter_id uuid not null references profiles(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

alter table orders disable row level security;

-- ─── order_items ─────────────────────────────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  name_es text not null,
  name_zh text not null,
  price numeric(10,2) not null,
  qty integer not null default 1,
  note text,
  status text not null default 'pending' check (status in ('pending', 'ready')),
  station text not null check (station in ('bar', 'kitchen')),
  created_at timestamptz default now()
);

alter table order_items disable row level security;

-- ─── indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_station_status on order_items(station, status);
create index if not exists idx_orders_table_status on orders(table_id, status);
create index if not exists idx_orders_created_at on orders(created_at);

-- ─── seed data ───────────────────────────────────────────────────────────────

-- Tables (Mesa 1-6)
insert into tables (number, zone, status) values
  (1, 'Interior', 'free'),
  (2, 'Interior', 'free'),
  (3, 'Interior', 'free'),
  (4, 'Terraza', 'free'),
  (5, 'Terraza', 'free'),
  (6, 'Barra', 'free')
on conflict (number) do nothing;

-- Categories
insert into categories (id, name_es, name_zh, station, sort_order, active) values
  ('00000000-0000-0000-0001-000000000001', 'Bebidas', '饮料', 'bar', 1, true),
  ('00000000-0000-0000-0001-000000000002', 'Cócteles', '鸡尾酒', 'bar', 2, true),
  ('00000000-0000-0000-0001-000000000003', 'Entrantes', '前菜', 'kitchen', 3, true),
  ('00000000-0000-0000-0001-000000000004', 'Platos principales', '主菜', 'kitchen', 4, true)
on conflict (id) do nothing;

-- Bar products (Bebidas)
insert into products (name_es, name_zh, price, category_id, active) values
  ('Cerveza', '啤酒', 2.50, '00000000-0000-0000-0001-000000000001', true),
  ('Vino tinto', '红葡萄酒', 3.00, '00000000-0000-0000-0001-000000000001', true),
  ('Agua mineral', '矿泉水', 1.50, '00000000-0000-0000-0001-000000000001', true),
  ('Refresco', '汽水', 2.00, '00000000-0000-0000-0001-000000000001', true),
  ('Zumo de naranja', '橙汁', 2.50, '00000000-0000-0000-0001-000000000001', true)
on conflict do nothing;

-- Bar products (Cócteles)
insert into products (name_es, name_zh, price, category_id, active) values
  ('Mojito', '莫吉托', 8.00, '00000000-0000-0000-0001-000000000002', true),
  ('Gin Tonic', '金汤力', 9.00, '00000000-0000-0000-0001-000000000002', true),
  ('Sangría', '桑格利亚', 7.00, '00000000-0000-0000-0001-000000000002', true),
  ('Margarita', '玛格丽塔', 9.00, '00000000-0000-0000-0001-000000000002', true),
  ('Cosmopolitan', '大都会', 9.50, '00000000-0000-0000-0001-000000000002', true)
on conflict do nothing;

-- Kitchen products (Entrantes)
insert into products (name_es, name_zh, price, category_id, active) values
  ('Patatas bravas', '辣味土豆', 6.00, '00000000-0000-0000-0001-000000000003', true),
  ('Ensalada mixta', '混合沙拉', 7.50, '00000000-0000-0000-0001-000000000003', true),
  ('Croquetas', '可乐饼', 7.00, '00000000-0000-0000-0001-000000000003', true),
  ('Pan con tomate', '番茄面包', 3.50, '00000000-0000-0000-0001-000000000003', true),
  ('Jamón ibérico', '伊比利亚火腿', 14.00, '00000000-0000-0000-0001-000000000003', true)
on conflict do nothing;

-- Kitchen products (Platos principales)
insert into products (name_es, name_zh, price, category_id, active) values
  ('Paella valenciana', '瓦伦西亚海鲜饭', 18.00, '00000000-0000-0000-0001-000000000004', true),
  ('Pollo a la plancha', '烤鸡', 14.00, '00000000-0000-0000-0001-000000000004', true),
  ('Merluza al horno', '烤鳕鱼', 16.00, '00000000-0000-0000-0001-000000000004', true),
  ('Filete de ternera', '小牛排', 20.00, '00000000-0000-0000-0001-000000000004', true),
  ('Tortilla española', '西班牙煎蛋饼', 9.00, '00000000-0000-0000-0001-000000000004', true)
on conflict do nothing;

-- Staff profiles
insert into profiles (full_name, role, pin) values
  ('Administrador', 'admin', '0000'),
  ('Camarero 1', 'waiter', '1111'),
  ('Barra', 'bar', '2222'),
  ('Cocina', 'kitchen', '3333')
on conflict (pin) do nothing;

-- Enable realtime for order_items and orders
-- Run these in Supabase dashboard > Database > Replication
-- alter publication supabase_realtime add table order_items;
-- alter publication supabase_realtime add table orders;
