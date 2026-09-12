-- IG Biology Quiz — 数据清空 + 多层安全加固
-- 执行方式：Supabase PAT via Management API（或 SQL Editor 手动运行）

-- ========== 0) 清空所有账号数据 ==========
truncate ig_answers;
delete from ig_users;
delete from pk_results;
delete from pk_rooms;

-- ========== 1) 层一：密码哈希不可读（列级权限） ==========
-- 登录改为 RPC 函数校验（下方），anon 只能读 ig_users 的 student_id 列，
-- pass_hash 永远不暴露给前端 —— 之前任何人拿 anon key 就能拉走全部哈希表。
revoke select on ig_users from anon;
grant select (student_id) on ig_users to anon;

-- ========== 2) 层二：登录走 SECURITY DEFINER 函数（服务端校验） ==========
-- 内置 0.3s 延迟：暴力破解被服务端限速（~12000 次/小时上限，实际更慢）
-- 密码加盐：sha256(password || student_id)，每用户盐不同，彩虹表失效
create or replace function verify_ig_login(p_sid text, p_pass text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hash text;
begin
  perform pg_sleep(0.3);
  select pass_hash into v_hash from ig_users where student_id = p_sid;
  if v_hash is null then return null; end if;
  return encode(sha256((p_pass || p_sid)::bytea), 'hex') = v_hash;
end;
$$;
grant execute on function verify_ig_login(text, text) to anon;

-- ========== 3) 层三：答题/PK 记录防篡改（只增可读，禁改禁删） ==========
drop policy if exists "ig_answers all" on ig_answers;
create policy "ig_answers select" on ig_answers for select using (true);
create policy "ig_answers insert" on ig_answers for insert with check (true);

drop policy if exists "pk_results all" on pk_results;
create policy "pk_results select" on pk_results for select using (true);
create policy "pk_results insert" on pk_results for insert with check (true);

-- 用户表：注册可插，客户端不可删
drop policy if exists "ig_users read" on ig_users;
drop policy if exists "ig_users insert" on ig_users;
create policy "ig_users select" on ig_users for select using (true);
create policy "ig_users insert" on ig_users for insert with check (true);

-- ========== 4) 层四：输入约束加固 ==========
alter table ig_answers drop constraint if exists ig_answers_qpath_fmt;
alter table ig_answers add constraint ig_answers_qpath_fmt
  check (q_path ~ '^ch[0-9]+_[a-z_]+/q[0-9]{2}\.jpg$');
alter table ig_answers add constraint ig_answers_student_fmt
  check (student_id ~ '^[0-9]{8}$');
alter table pk_results add constraint pk_results_student_fmt
  check (student_id ~ '^[0-9]{8}$');
alter table pk_results add constraint pk_results_score_range
  check (my_score >= 0 and my_score <= 60000 and opp_score >= 0 and opp_score <= 60000);
