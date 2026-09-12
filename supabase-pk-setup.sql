-- IG Biology Quiz — 1v1 PK 建表 SQL
-- 用法：https://supabase.com/dashboard → 项目 shbrzimzhoqremvxhzib → SQL Editor → 粘贴全部 → Run

-- PK 房间表：一局一行，双方轮询读写
create table if not exists pk_rooms (
  code text primary key,
  host_id text not null,
  guest_id text,
  chapters jsonb not null default '[]',
  q_count int not null default 10,
  questions jsonb not null default '[]',
  status text not null default 'waiting',   -- waiting|countdown|playing|host_done|guest_done|abandoned
  start_at timestamptz,
  host_score int not null default 0,
  guest_score int not null default 0,
  host_answered int not null default 0,
  guest_answered int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS：公开读写（房间码即凭据，无敏感数据）
alter table pk_rooms enable row level security;
drop policy if exists "pk_rooms all" on pk_rooms;
create policy "pk_rooms all" on pk_rooms for all using (true) with check (true);
