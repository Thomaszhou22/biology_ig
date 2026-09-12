// auth.js — IG Biology Quiz 强制账号门（Supabase）
// 未登录 = 全屏登录门（Sign in / Sign up，全英文，配色与站点一致）
// Signup：学号（8 位）+ 密码 + 确认密码，一键注册并进入
// Sign in：学号 + 密码。登录后：答题逐题上报云端、错题本云端合并、排行榜。
/* global crypto */

const SB_URL = 'https://api.igmcq.com'; // Cloudflare Worker 中转，国内直连
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYnJ6aW16aG9xcmVtdnhoemliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjYwOTcsImV4cCI6MjA5NTA0MjA5N30.UBLG-XCvMwn1D7U77AY_6IGJWSKMnc1Ii2qQIJW-NMI';
const SB_TABLE_USERS = 'ig_users';
const SB_TABLE_ANSWERS = 'ig_answers';

let currentUser = null;
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
    let msg = String(res.status);
    try { const j = await res.json(); msg = j.message || j.msg || msg; } catch (e) {}
    throw new Error(msg);
  }
  const text = await res.text();
  if (!text) return null; // 204 or empty body (Prefer: return=minimal)
  try { return JSON.parse(text); } catch (e) { return null; }
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeAuthHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// === 全屏登录门 ===
function ensureGate() {
  if (document.getElementById('auth-gate')) return;
  const gate = document.createElement('div');
  gate.id = 'auth-gate';
  gate.style.cssText = `position:fixed;inset:0;z-index:9000;background:radial-gradient(ellipse at top, rgba(245,158,11,0.06) 0%, transparent 60%), #f5f0e8;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;`;
  gate.innerHTML = `
    <div style="background:#faf6ee;border-radius:24px;padding:34px 36px;width:min(380px,94vw);box-shadow:0 1px 3px rgba(0,0,0,0.06),0 0 0 1px #ece4d4,0 12px 40px rgba(0,0,0,.12);border:1px solid #ece4d4;text-align:center;">
      <div style="font-size:44px;margin-bottom:8px;">🧬</div>
      <h1 style="margin:0 0 4px;font-size:1.5rem;font-weight:800;color:#1e293b;letter-spacing:-.3px;">IG Biology Quiz</h1>
      <p style="margin:0 0 22px;font-size:0.85rem;color:#78716c;font-weight:600;">Please sign in with your student ID</p>
      <div style="display:flex;gap:10px;margin-bottom:18px;">
        <button id="gate-signin-btn" style="flex:1;padding:13px;border:none;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(245,158,11,.25);transition:all .25s;">Sign in</button>
        <button id="gate-signup-btn" style="flex:1;padding:13px;border:2px solid rgba(180,130,70,.25);border-radius:14px;background:#fff;color:#c4943a;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;transition:all .25s;">Sign up</button>
      </div>
      <div id="gate-form" style="display:none;text-align:left;">
        <div id="gate-form-title" style="font-size:0.95rem;font-weight:800;color:#1e293b;text-align:center;margin-bottom:12px;"></div>
        <input id="gate-sid" placeholder="Student ID (8 digits)" maxlength="8" inputmode="numeric" autocomplete="username" style="width:100%;box-sizing:border-box;padding:12px 14px;border:2px solid rgba(180,130,70,.15);border-radius:12px;font-size:15px;font-family:inherit;text-align:center;letter-spacing:2px;margin-bottom:8px;">
        <input id="gate-pass" type="password" placeholder="Password" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:12px 14px;border:2px solid rgba(180,130,70,.15);border-radius:12px;font-size:15px;font-family:inherit;text-align:center;margin-bottom:8px;">
        <input id="gate-pass2" type="password" placeholder="Confirm password" style="width:100%;box-sizing:border-box;padding:12px 14px;border:2px solid rgba(180,130,70,.15);border-radius:12px;font-size:15px;font-family:inherit;text-align:center;margin-bottom:6px;display:none;">
        <p id="gate-msg" style="font-size:0.78rem;color:#ef4444;text-align:center;font-weight:600;min-height:1.2em;margin:0 0 10px;"></p>
        <button id="gate-go-btn" style="width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">Continue</button>
        <button id="gate-back-btn" style="width:100%;padding:9px;margin-top:6px;border:none;background:none;color:#a8a29e;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">Back</button>
      </div>
    </div>`;
  document.body.appendChild(gate);
  document.getElementById('gate-signin-btn').onclick = () => showGateForm('signin');
  document.getElementById('gate-signup-btn').onclick = () => showGateForm('signup');
  document.getElementById('gate-back-btn').onclick = () => {
    document.getElementById('gate-form').style.display = 'none';
    toggleGateChoice(true);
  };
  document.getElementById('gate-go-btn').onclick = doGateAuth;
  ['gate-sid', 'gate-pass', 'gate-pass2'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doGateAuth(); });
  });
}

let gateMode = null;
function toggleGateChoice(show) {
  document.getElementById('gate-signin-btn').style.display = show ? '' : 'none';
  document.getElementById('gate-signup-btn').style.display = show ? '' : 'none';
}
function showGateForm(mode) {
  gateMode = mode;
  toggleGateChoice(false);
  const form = document.getElementById('gate-form');
  const pass2 = document.getElementById('gate-pass2');
  form.style.display = 'block';
  document.getElementById('gate-form-title').textContent = mode === 'signup' ? 'Create your account' : 'Welcome back';
  pass2.style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('gate-msg').textContent = mode === 'signup' ? 'Use your student ID (8 digits) to register' : '';
  document.getElementById('gate-go-btn').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
  document.getElementById('gate-sid').value = '';
  document.getElementById('gate-pass').value = '';
  pass2.value = '';
  document.getElementById('gate-sid').focus();
}

async function doGateAuth() {
  const sid = document.getElementById('gate-sid').value.trim();
  const pass = document.getElementById('gate-pass').value;
  const pass2 = document.getElementById('gate-pass2').value;
  const msg = document.getElementById('gate-msg');
  if (!/^\d{8}$/.test(sid)) { msg.textContent = 'Student ID must be exactly 8 digits'; return; }
  if (pass.length < 4) { msg.textContent = 'Password must be at least 4 characters'; return; }
  if (gateMode === 'signup' && pass !== pass2) { msg.textContent = 'Passwords do not match'; return; }
  msg.style.color = '#64748b';
  msg.textContent = 'Please wait…';
  try {
    const hash = await sha256Hex(pass);
    const users = await sbFetch(`/rest/v1/${SB_TABLE_USERS}?student_id=eq.${sid}&select=student_id,pass_hash`);
    if (gateMode === 'signup') {
      if (users && users.length) { msg.style.color = '#ef4444'; msg.textContent = 'This student ID is already registered — sign in instead'; return; }
      await sbFetch(`/rest/v1/${SB_TABLE_USERS}`, { method: 'POST', body: JSON.stringify({ student_id: sid, pass_hash: hash }) });
    } else {
      if (!users || !users.length) { msg.style.color = '#ef4444'; msg.textContent = 'No account for this ID — sign up first'; return; }
      if (users[0].pass_hash !== hash) { msg.style.color = '#ef4444'; msg.textContent = 'Wrong password'; return; }
    }
    currentUser = { studentId: sid };
    sessionStorage.setItem('ig-auth-user', JSON.stringify(currentUser));
    openGate(false);
    renderAuthUI();
    renderDrawerUser();
    syncCloudToLocal();
  } catch (err) {
    msg.style.color = '#ef4444';
    msg.textContent = 'Error: ' + (err.message || 'network problem');
  }
}

function openGate(open) {
  ensureGate();
  document.getElementById('auth-gate').style.display = open ? 'flex' : 'none';
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('ig-auth-user');
  renderAuthUI();
  renderDrawerUser();
  openGate(true);
  showGateForm('signin');
}

// 抽屉底部显示当前用户
function renderDrawerUser() {
  const foot = document.getElementById('drawer-user');
  if (foot && currentUser) foot.textContent = 'Signed in as ' + currentUser.studentId;
}

// 供 app.js 使用的接口
function igCurrentUser() { return currentUser; }
async function loadLeaderboardRows() {
  return await sbFetch('/rest/v1/ig_leaderboard?select=*&order=unique_questions.desc&limit=100');
}

// === 登录后顶栏 UI（排行榜 + 退出）===
function renderAuthUI() {
  // 渲染到 app 壳顶栏（右上角）
  const bar = document.getElementById('topbar-auth');
  if (bar) {
    if (currentUser) {
      bar.innerHTML = `
        <span style="font-size:12px;font-weight:700;color:#1e293b;">ID ${escapeAuthHtml(currentUser.studentId)}</span>
        <button id="auth-logout-btn" style="display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:10px;border:1.5px solid rgba(180,130,70,0.2);background:#fff;color:#c4943a;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit;">Log out</button>`;
      const lb = document.getElementById('auth-logout-btn');
      if (lb) lb.onclick = logout;
    } else {
      bar.innerHTML = '';
    }
  }
  // 旧容器兼容（登录门内不需要）
  const box = document.getElementById('auth-box');
  if (box) box.innerHTML = '';
}

// === 云同步 ===
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
  } catch (e) {}
}

async function syncCloudToLocal() {
  if (!currentUser) return;
  try {
    const rows = await sbFetch(`/rest/v1/${SB_TABLE_ANSWERS}?student_id=eq.${currentUser.studentId}&select=q_path,chapter,correct,answered_at&order=answered_at.desc&limit=10000`);
    if (!rows || !rows.length) return;
    const latest = {};
    for (const r of rows) if (!latest[r.q_path]) latest[r.q_path] = r;
    const cloudWrong = Object.values(latest).filter(r => !r.correct);
    const local = (typeof getWrongBook === 'function') ? getWrongBook() : [];
    const localSet = new Set(local.map(r => r.question));
    const merged = local.slice();
    for (const r of cloudWrong) {
      if (localSet.has(r.q_path)) continue;
      merged.push({ question: r.q_path, img: true, questionIndex: null, answer: '?', timestamp: Date.parse(r.answered_at) || Date.now() });
    }
    if (typeof saveWrongBook === 'function') saveWrongBook(merged);
    window.igAnsweredSet = new Set(Object.keys(latest));
  } catch (e) {}
}

// === 排行榜（全英文）===
async function openLeaderboard() {
  let overlay = document.getElementById('lb-modal');
  if (overlay) { overlay.style.display = 'flex'; }
  else {
    overlay = document.createElement('div');
    overlay.id = 'lb-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(245,240,232,0.9);display:flex;align-items:center;justify-content:center;z-index:9500;padding:20px;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:28px;width:min(480px,92vw);max-height:85vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.25);border:1px solid #e0d8c8;">
        <h2 style="margin:0 0 16px;font-size:1.25rem;font-weight:800;color:#1e293b;text-align:center;">🏆 Leaderboard</h2>
        <div id="lb-body" style="font-size:0.9rem;color:#64748b;text-align:center;">Loading…</div>
        <button id="lb-close-btn" style="width:100%;padding:11px;margin-top:16px;border:2px solid rgba(180,130,70,0.12);border-radius:12px;background:none;color:#c4943a;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">Close</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
    document.getElementById('lb-close-btn').onclick = () => overlay.style.display = 'none';
  }
  overlay.style.display = 'flex';
  const body = document.getElementById('lb-body');
  try {
    const data = await sbFetch('/rest/v1/ig_leaderboard?select=*&order=unique_questions.desc&limit=100');
    if (!data || !data.length) { body.innerHTML = '<p>No records yet — go answer some questions!</p>'; return; }
    const me = currentUser ? currentUser.studentId : null;
    body.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
      <thead><tr style="border-bottom:2px solid #e0d8c8;color:#78716c;font-size:0.78rem;">
        <th style="padding:8px 6px;text-align:center;">#</th>
        <th style="padding:8px 6px;text-align:left;">Student ID</th>
        <th style="padding:8px 6px;text-align:right;">Questions</th>
        <th style="padding:8px 6px;text-align:right;">Accuracy</th>
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
    body.innerHTML = '<p style="color:#ef4444;">Failed to load: ' + escapeAuthHtml(e.message || 'network error') + '</p>';
  }
}

// === 启动：未登录强制弹门，已登录直接进 ===
function authInit() {
  renderAuthUI();
  if (!currentUser) openGate(true);
}
document.addEventListener('DOMContentLoaded', authInit);
if (document.readyState !== 'loading') authInit();
