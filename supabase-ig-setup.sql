-- IG Biology Quiz — 账号系统建表 SQL
-- 用法：打开 https://supabase.com/dashboard（项目 shbrzimzhoqremvxhzib）
--       左侧 SQL Editor → New query → 粘贴本文件全部内容 → Run

-- 1) 用户表：学号 8 位数字为主键，密码只存 SHA-256 哈希
create table if not exists ig_users (
  student_id text primary key check (char_length(student_id) = 8 and student_id ~ '^[0-9]{8}$'),
  pass_hash text not null,
  created_at timestamptz not null default now()
);

-- 2) 答题记录表：每一题每一次作答一行（对错都记）
--    错题本 = 其中 correct = false 的记录；自适应算法的数据源也是它
create table if not exists ig_answers (
  id bigint generated always as identity primary key,
  student_id text not null references ig_users(student_id) on delete cascade,
  q_path text not null,            -- 如 ch5_enzymes/q12.jpg
  chapter text not null,           -- 章节目录名，如 ch5_enzymes
  correct boolean not null,
  answered_at timestamptz not null default now()
);
create index if not exists ig_answers_student on ig_answers(student_id);
create index if not exists ig_answers_student_q on ig_answers(student_id, q_path);
create index if not exists ig_answers_q on ig_answers(q_path);

-- 3) 排行榜视图：每人不同题目数、总作答数、正确率（只统计已注册用户）
create or replace view ig_leaderboard as
with per_q as (
  -- 每道题只算一次最终结果（最近一次作答），避免重刷同一题灌水
  select distinct on (student_id, q_path)
    student_id, q_path, chapter, correct, answered_at
  from ig_answers
  order by student_id, q_path, answered_at desc
)
select
  u.student_id,
  count(*) as unique_questions,
  sum(case when correct then 1 else 0 end) as correct_count,
  round(100.0 * sum(case when correct then 1 else 0 end) / greatest(count(*), 1), 1) as accuracy
from ig_users u
join per_q p on p.student_id = u.student_id
group by u.student_id
order by unique_questions desc, accuracy desc;

-- 4) RLS 策略：anon 可读写（校内公开刷题场景；密码已哈希，无敏感数据）
alter table ig_users enable row level security;
alter table ig_answers enable row level security;
drop policy if exists "ig_users read" on ig_users;
drop policy if exists "ig_users insert" on ig_users;
drop policy if exists "ig_answers all" on ig_answers;
create policy "ig_users read" on ig_users for select using (true);
create policy "ig_users insert" on ig_users for insert with check (true);
create policy "ig_answers all" on ig_answers for all using (true) with check (true);
-- 注：ig_users 不开放 update/delete（密码修改/注销后续按需再加）
