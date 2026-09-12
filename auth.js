// auth.js — IG Biology Quiz 账号系统（Supabase）
// 设计：localStorage 仍是主数据源（未登录体验完全不变）；登录后逐题上报云端，
// 登录时拉取云端记录并合并本地错题本，自适应算法读 getWrongBook() 即自动同步。
/* global crypto, fetch */

// === Supabase 配置（复用 quiz-system 项目）===
const SB_URL = 'https://shbrzimzhoqremvxhzib.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnJ6aW16aG9xcmVtdnhoemliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjYwOTcsImV4cCI6MjA5NTA0MjA5N30.UBLG-XCvMwn1D7U77AY_6IGJWSKMnc1Ii2qQIJW-NMI';
const SB_TABLE_USERS = 'ig_users';
const SB_TABLE_ANSWERS = 'ig_answers';

// === 会话状态（内存 + sessionStorage，关标签即退出）===
let currentUser = null; // { studentId }
try {
  const s = sessionStorage.getItem('ig-auth-user');
  if (s) currentUser = JSON.parse(s);
} catch (e) {}

async function sbFetch(path, opts) {
  const res = await fetch(SB_URL + path, Object.assign({
    headers: {
      'apikey': SB_ANON_KEY,
      'Authorization': 'Bearer ' + SB_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  }, opts || {}));
  if (!res.ok) {
    let msg = res.status + '';
    try { const j = await res.json(); msg = j.message || j.msg || msg; } catch (e) {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// === UI 渲染 ===
function renderAuthUI() {
  const box = document.getElementById('auth-box');
  if (!box) return;
  if (currentUser) {
    box.innerHTML = `
      <span style="font-size:12px;font-weight:700;color:#1e293b;">🆔 ${escapeAuthHtml(currentUser.studentId)}</span>
      <button id="auth-logout-btn" style="padding:6px 14px;border-radius:10px;border:1.5px solid rgba(180,130,70,0.2);background:#fff;color:#c4943a;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">退出登录</button>
      <button id="leaderboard-btn" style="padding:6px 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">🏆 排行榜</button>`;
    document.getElementById('auth-logout-btn').onclick = logout;
    document.getElementById('leaderboard-btn').onclick = openLeaderboard;
  } else {
    box.innerHTML = `
      <button id="auth-login-btn" style="padding:6px 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">🆔 学号登录</button>`;
    document.getElementById('auth-login-btn').onclick = openAuthModal;
  }
}

function escapeAuthHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// === 登录/注册弹窗 ===
function openAuthModal() {
  let overlay = document.getElementById('auth-modal');
  if (overlay) { overlay.style.display = 'flex'; return; }
  overlay = document.createElement('div');
  overlay.id = 'auth-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(245,240,232,0.9);display:flex;align-items:center;justify-content:center;z-index:4000;padding:20px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:28px;width:min(360px,92vw);box-shadow:0 12px 40px rgba(0,0,0,.25);border:1px solid #e0d8c8;font-family:inherit;">
      <h2 style="margin:0 0 6px;font-size:1.25rem;font-weight:800;color:#1e293b;text-align:center;">🆔 学号登录</h2>
      <p style="font-size:0.8rem;color:#64748b;text-align:center;margin:0 0 16px;">请用学号注册（8 位数字）<br>登录后刷题记录与错题本云端同步</p>
      <input id="auth-sid" placeholder="学号（8 位数字）" maxlength="8" inputmode="numeric" style="width:100%;box-sizing:border-box;padding:12px 14px;border:2px solid rgba(180,130,70,0.15);border-radius:12px;font-size:16px;font-family:inherit;text-align:center;letter-spacing:2px;margin-bottom:10px;">
      <input id="auth-pass" type="password" placeholder="设置 / 输入密码" style="width:100%;box-sizing:border-box;padding:12px 14px;border:2px solid rgba(180,130,70,0.15);border-radius:12px;font-size:16px;font-family:inherit;text-align:center;margin-bottom:6px;">
      <p id="auth-msg" style="font-size:0.78rem;color:#ef4444;text-align:center;font-weight:600;min-height:1.2em;margin:0 0 10px;"></p>
      <button id="auth-do-btn" style="width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">登录 / 注册</button>
      <button id="auth-cancel-btn" style="width:100%;padding:10px;margin-top:8px;border:2px solid rgba(180,130,70,0.12);border-radius:12px;background:none;color:#c4943a;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">取消</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
  document.getElementById('auth-cancel-btn').onclick = () => overlay.style.display = 'none';
  document.getElementById('auth-sid').focus();
  const doAuth = async () => {
    const sid = document.getElementById('auth-sid').value.trim();
    const pass = document.getElementById('auth-pass').value;
    const msg = document.getElementById('auth-msg');
    if (!/^\d{8}$/.test(sid)) { msg.textContent = '学号必须是 8 位数字'; return; }
    if (pass.length < 4) { msg.textContent = '密码至少 4 位'; return; }
    msg.textContent = '处理中…';
    msg.style.color = '#64748b';
    try {
      const hash = await sha256Hex(pass);
      // 查用户是否存在
      const users = await sbFetch(`/rest/v1/${SB_TABLE_USERS}?student_id=eq.${sid}&select=student_id,pass_hash`);
      if (users && users.length) {
        if (users[0].pass_hash !== hash) { msg.style.color = '#ef4444'; msg.textContent = '密码错误'; return; }
      } else {
        await sbFetch(`/rest/v1/${SB_TABLE_USERS}`, { method: 'POST', body: JSON.stringify({ student_id: sid, pass_hash: hash }) });
      }
      currentUser = { studentId: sid };
      sessionStorage.setItem('ig-auth-user', JSON.stringify(currentUser));
      overlay.style.display = 'none';
      renderAuthUI();
      await syncCloudToLocal();
    } catch (err) {
      msg.style.color = '#ef4444';
      msg.textContent = '失败：' + (err.message || '网络错误');
    }
  };
  document.getElementById('auth-do-btn').onclick = doAuth;
  document.getElementById('auth-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doAuth(); });
  document.getElementById('auth-sid').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('auth-pass').focus(); });
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('ig-auth-user');
  renderAuthUI();
}

// === 云端同步 ===
// 答一题上报（挂在 handleAnswer 里）
async function recordAnswerCloud(qItem, correct) {
  if (!currentUser || !qItem) return;
  try {
    await sbFetch(`/rest/v1/${SB_TABLE_ANSWERS}`, {
      method: 'POST',
      body: JSON.stringify({
        student_id: currentUser.studentId,
        q_path: qItem.q,
        chapter: (qItem.q || '').split('/')[0] || '',
        correct: !!correct
      })
    });
  } catch (e) { /* 静默：本地记录已生效，云端失败不阻塞答题 */ }
}

// 登录后：拉云端全部作答，重建/合并错题本
async function syncCloudToLocal() {
  if (!currentUser) return;
  try {
    const rows = await sbFetch(`/rest/v1/${SB_TABLE_ANSWERS}?student_id=eq.${currentUser.studentId}&select=q_path,chapter,correct,answered_at&order=answered_at.desc&limit=10000`);
    if (!rows || !rows.length) return;
    // 云端每题取最近一次结果
    const latest = {};
    for (const r of rows) {
      if (!latest[r.q_path]) latest[r.q_path] = r;
    }
    const cloudWrong = Object.values(latest).filter(r => !r.correct);
    // 本地错题本：保留（含时间戳等展示数据），云端的错题补充进来（去重）
    const local = (typeof getWrongBook === 'function') ? getWrongBook() : [];
    const localSet = new Set(local.map(r => r.question));
    const chapterNames = (typeof QUESTION_CHAPTERS !== 'undefined') ? QUESTION_CHAPTERS : [];
    const chName = chId => {
      const c = chapterNames.find(x => x.id === chId);
      return c ? c.name : chId;
    };
    const merged = local.slice();
    for (const r of cloudWrong) {
      if (localSet.has(r.q_path)) continue;
      merged.push({ question: r.q_path, img: true, questionIndex: null, answer: '?', timestamp: Date.parse(r.answered_at) || Date.now(), chapter: chName(r.chapter) });
    }
    if (typeof saveWrongBook === 'function') saveWrongBook(merged);
    if (typeof updateWrongBookBadge === 'function') updateWrongBookBadge();
    // 已答题目集合，供 UI 展示用（不改变现有答题流程）
    window.igAnsweredSet = new Set(Object.keys(latest));
  } catch (e) { /* 静默降级为本地模式 */ }
}

// === 排行榜 ===
async function openLeaderboard() {
  let overlay = document.getElementById('lb-modal');
  if (overlay) { overlay.style.display = 'flex'; }
  else {
    overlay = document.createElement('div');
    overlay.id = 'lb-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(245,240,232,0.9);display:flex;align-items:center;justify-content:center;z-index:4000;padding:20px;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:28px;width:min(480px,92vw);max-height:85vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);border:1px solid #e0d8c8;">
        <h2 style="margin:0 0 16px;font-size:1.25rem;font-weight:800;color:#1e293b;text-align:center;">🏆 排行榜</h2>
        <div id="lb-body" style="font-size:0.9rem;color:#64748b;text-align:center;">加载中…</div>
        <button id="lb-close-btn" style="width:100%;padding:11px;margin-top:16px;border:2px solid rgba(180,130,70,0.12);border-radius:12px;background:none;color:#c4943a;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">关闭</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
    document.getElementById('lb-close-btn').onclick = () => overlay.style.display = 'none';
  }
  overlay.style.display = 'flex';
  const body = document.getElementById('lb-body');
  try {
    const data = await sbFetch('/rest/v1/ig_leaderboard?select=*&order=unique_questions.desc&limit=100');
    if (!data || !data.length) { body.innerHTML = '<p>还没有记录，先去刷题吧！</p>'; return; }
    const me = currentUser ? currentUser.studentId : null;
    body.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
      <thead><tr style="border-bottom:2px solid #e0d8c8;color:#78716c;font-size:0.78rem;">
        <th style="padding:8px 6px;text-align:center;">#</th>
        <th style="padding:8px 6px;text-align:left;">学号</th>
        <th style="padding:8px 6px;text-align:right;">做题数</th>
        <th style="padding:8px 6px;text-align:right;">正确率</th>
      </tr></thead>
      <tbody>${data.map((row, i) => `
        <tr style="border-bottom:1px solid #f0ebe0;${row.student_id === me ? 'background:rgba(245,158,11,0.12);font-weight:800;' : ''}">
          <td style="padding:8px 6px;text-align:center;">${i + 1}</td>
          <td style="padding:8px 6px;">${escapeAuthHtml(row.student_id)}</td>
          <td style="padding:8px 6px;text-align:right;font-weight:700;">${row.unique_questions}</td>
          <td style="padding:8px 6px;text-align:right;color:${row.accuracy >= 80 ? '#10b981' : row.accuracy >= 60 ? '#f59e0b' : '#ef4444'};font-weight:700;">${row.accuracy}%</td>
        </tr>`).join('')}</tbody>
    </table>`;
  } catch (e) {
    body.innerHTML = '<p style="color:#ef4444;">加载失败：' + escapeAuthHtml(e.message || '网络错误') + '</p>';
  }
}

// === 初始化 ===
document.addEventListener('DOMContentLoaded', renderAuthUI);
if (document.readyState !== 'loading') renderAuthUI();
