// app.js — IG Biology Quiz 应用壳：顶栏 + 抽屉导航 + 页面视图
// 图标：Lucide (https://lucide.dev) inline SVG, ISC license, 免费
/* global getWrongBook, clearAllWrongBook, startMockExam, isMockExamActive, escapeHtml, loadLeaderboardRows, igAuthLogout, igCurrentUser */

const ICONS = {
  menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  dna: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 4-8 6-8 10s8 6 8 10"/><path d="M12 2c0 4 8 6 8 10s-8 6-8 10"/><path d="M8 8h8"/><path d="M8 16h8"/></svg>',
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  book: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
  trophy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  sparkles: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
  swords: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></svg>',
  quiz: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>',
  logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
};

const PAGES = [
  { id: 'home', label: 'Quiz', icon: 'quiz' },
  { id: 'mock', label: 'Mock Exam', icon: 'clock' },
  { id: 'mistakes', label: 'Mistake Collection', icon: 'book' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { id: 'ai', label: 'AI Analysis', icon: 'sparkles' },
  { id: 'pk', label: '1v1 PK', icon: 'swords' }
];

let currentPage = 'home';
let infoPanelHome = null; // #info-panel 的原始父容器

// === URL 路由（真分页：/leaderboard 等）===
const ROUTES = { home: '', mock: '/mock-exam', mistakes: '/mistakes', leaderboard: '/leaderboard', ai: '/ai-analysis', pk: '/pk' };
// 站点根：剥掉 index.html 与任何已知路由后缀（/mock-exam/leaderboard 这类嵌套也剥干净）
let BASE = location.pathname.replace(/\/index\.html?$/, '');
let _again = true;
while (_again) {
  _again = false;
  for (const rt of Object.values(ROUTES)) {
    if (rt && BASE.endsWith(rt)) { BASE = BASE.slice(0, -rt.length); _again = true; }
  }
}
BASE = BASE.replace(/\/$/, '');
// 素材绝对路径（在子路由页面上相对路径会 404）
const ASSET_BASE = BASE + '/';
function pageFromPath() {
  const p = (location.pathname.slice(BASE.length) || '/') ;
  for (const [page, route] of Object.entries(ROUTES)) {
    if (route && (p === route || p === route + '/')) return page;
  }
  return 'home';
}

function $(id) { return document.getElementById(id); }

function buildShell() {
  if ($('app-topbar')) return;

  // 顶栏
  const bar = document.createElement('div');
  bar.id = 'app-topbar';
  bar.innerHTML = `
    <button id="nav-toggle" title="Menu" aria-label="Open menu">${ICONS.menu}</button>
    <div class="topbar-title">${ICONS.dna}<span>IG Biology Quiz</span></div>
    <div id="topbar-auth"></div>`;
  document.body.prepend(bar);

  // 遮罩 + 抽屉
  const scrim = document.createElement('div');
  scrim.id = 'nav-scrim';
  const drawer = document.createElement('nav');
  drawer.id = 'nav-drawer';
  drawer.innerHTML = `
    <div class="drawer-head">
      <div class="drawer-title">${ICONS.dna}<span>IG Biology Quiz</span></div>
      <button id="nav-close" aria-label="Close menu">${ICONS.x}</button>
    </div>
    <div class="drawer-list">
      ${PAGES.map(p => `<button class="drawer-item" data-page="${p.id}">${ICONS[p.icon]}<span>${p.label}</span></button>`).join('')}
    </div>
    <div id="nav-lock-note" style="margin:0 16px 8px;padding:8px 12px;border-radius:10px;background:rgba(124,58,237,.08);color:#7c3aed;font-size:.75rem;font-weight:700;text-align:center;opacity:0;transition:opacity .3s;"></div>
    <div class="drawer-foot" id="drawer-user"></div>`;
  document.body.append(scrim, drawer);

  $('nav-toggle').onclick = () => { drawer.classList.add('open'); scrim.classList.add('show'); };
  const closeNav = () => { drawer.classList.remove('open'); scrim.classList.remove('show'); };
  $('nav-close').onclick = closeNav;
  scrim.onclick = closeNav;
  drawer.querySelectorAll('.drawer-item').forEach(btn => {
    btn.onclick = () => { navigate(btn.dataset.page, true); closeNav(); };
  });
  window.addEventListener('popstate', () => navigate(pageFromPath(), false));
  // mock 完整结算：Done 点击后回 Mock 落地页
  window.addEventListener('mock-finished', () => {
    const btn = document.getElementById('finish-restart-btn');
    if (!btn) return;
    const handler = () => {
      btn.removeEventListener('click', handler);
      navigate('mock', true);
      const start = $('mock-start-btn');
      if (start) start.style.display = '';
      const desc = document.querySelector('#view-mock-body > p');
      if (desc) desc.style.display = '';
    };
    btn.addEventListener('click', handler);
  });

  // 中途退出 mock：回 Mock 落地页（紫色 Start 界面）
  window.addEventListener('mock-abandoned', () => {
    // 先把题目面板移回主页并整体隐藏，避免 "Select chapters to start" 落在落地页下方
    const panel = $('info-panel');
    if (panel) {
      if (infoPanelHome && panel.parentElement !== infoPanelHome) infoPanelHome.appendChild(panel);
      panel.style.display = 'none';
    }
    navigate('mock', true);
    const btn = $('mock-start-btn');
    if (btn) btn.style.display = '';
    const desc = document.querySelector('#view-mock-body > p');
    if (desc) desc.style.display = '';
  });
  // mock 进行中给抽屉项加禁用样式（每 500ms 刷新状态）
  setInterval(() => {
    const active = (typeof isMockExamActive === 'function') && isMockExamActive();
    drawer.querySelectorAll('.drawer-item').forEach(btn => {
      const lock = active && btn.dataset.page !== 'home';
      btn.style.opacity = lock ? '.4' : '';
      btn.style.pointerEvents = lock ? 'none' : '';
    });
  }, 500);

  // 页面视图（覆盖层）
  const mk = (id, cls) => {
    const d = document.createElement('div');
    d.id = 'view-' + id;
    d.className = 'view-page ' + (cls || '');
    d.innerHTML = `
      <div class="view-card">
        <div class="view-head">
          <h2 id="view-${id}-title"></h2>
          <button class="view-close" data-back>${ICONS.x}</button>
        </div>
        <div class="view-body" id="view-${id}-body"></div>
      </div>`;
    document.body.append(d);
    d.querySelector('[data-back]').onclick = () => navigate('home');
    return d;
  };
  mk('mock'); mk('mistakes'); mk('leaderboard'); mk('ai'); mk('pk');
  // PK 页去掉关闭叉（完整页面）
  const pkClose = document.querySelector('#view-pk .view-close');
  if (pkClose) pkClose.remove();
  // Mock Exam 是独立完整页面：去掉右上角叉
  const mockClose = document.querySelector('#view-mock .view-close');
  if (mockClose) mockClose.remove();
  const mockHead = document.querySelector('#view-mock .view-head');
  if (mockHead) mockHead.style.marginBottom = '14px';

  injectStyles();
}

function injectStyles() {
  if ($('app-shell-css')) return;
  const css = document.createElement('style');
  css.id = 'app-shell-css';
  css.textContent = `
#app-topbar { position:fixed; top:0; left:0; right:0; height:56px; z-index:6000; display:flex; align-items:center; gap:12px; padding:0 16px; background:rgba(250,246,238,.92); backdrop-filter:blur(8px); border-bottom:1px solid #ece4d4; }
#nav-toggle { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border:none; border-radius:12px; background:none; color:#1e293b; cursor:pointer; }
#nav-toggle:hover { background:rgba(99,102,241,.08); }
.topbar-title { display:flex; align-items:center; gap:8px; font-weight:800; color:#1e293b; font-size:1.05rem; letter-spacing:-.3px; flex:1; }
#topbar-auth { display:flex; align-items:center; gap:8px; }
#nav-scrim { position:fixed; inset:0; background:rgba(30,41,59,.35); z-index:6900; opacity:0; pointer-events:none; transition:opacity .2s; }
#nav-scrim.show { opacity:1; pointer-events:auto; }
#nav-drawer { position:fixed; top:0; left:0; bottom:0; width:min(280px,82vw); background:#faf6ee; z-index:7000; transform:translateX(-100%); transition:transform .25s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; box-shadow:8px 0 32px rgba(0,0,0,.12); }
#nav-drawer.open { transform:none; }
.drawer-head { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 12px; border-bottom:1px solid #ece4d4; }
.drawer-title { display:flex; align-items:center; gap:8px; font-weight:800; color:#1e293b; }
#nav-close { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border:none; border-radius:10px; background:none; color:#78716c; cursor:pointer; }
#nav-close:hover { background:rgba(99,102,241,.08); }
.drawer-list { flex:1; padding:10px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
.drawer-item { display:flex; align-items:center; gap:12px; padding:12px 14px; border:none; border-radius:14px; background:none; color:#334155; font-family:inherit; font-size:0.95rem; font-weight:600; cursor:pointer; text-align:left; transition:all .15s; }
.drawer-item:hover { background:rgba(99,102,241,.06); }
.drawer-item.active { background:linear-gradient(135deg,rgba(245,158,11,.14),rgba(217,119,6,.08)); color:#92400e; }
.drawer-foot { padding:14px 16px; border-top:1px solid #ece4d4; font-size:0.8rem; color:#78716c; font-weight:700; display:flex; align-items:center; gap:8px; }
.view-page { position:fixed; inset:0; z-index:5000; background:radial-gradient(ellipse at top, rgba(245,158,11,0.06) 0%, transparent 60%), #f5f0e8; display:none; overflow-y:auto; padding:76px 16px 32px; box-sizing:border-box; }
.view-page.show { display:block; }
.view-card { background:#faf6ee; border:1px solid #ece4d4; border-radius:24px; box-shadow:0 1px 3px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.08); max-width:760px; margin:0 auto; padding:26px 28px; }
.view-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.view-head h2 { margin:0; font-size:1.3rem; font-weight:800; color:#1e293b; letter-spacing:-.3px; display:flex; align-items:center; gap:10px; }
.view-close { display:flex; align-items:center; justify-content:center; width:38px; height:38px; border:none; border-radius:12px; background:none; color:#a8a29e; cursor:pointer; }
.view-close:hover { background:rgba(99,102,241,.08); color:#334155; }
.topbar-btn { display:flex; align-items:center; gap:6px; padding:8px 14px; border:none; border-radius:12px; font-family:inherit; font-size:12.5px; font-weight:700; cursor:pointer; }
.medal-gold { background:linear-gradient(135deg,#fef3c7,#fde68a) !important; color:#92400e !important; }
.medal-silver { background:linear-gradient(135deg,#f1f5f9,#e2e8f0) !important; color:#475569 !important; }
.medal-bronze { background:linear-gradient(135deg,#fed7aa,#fdba74) !important; color:#9a3412 !important; }
.mistake-item { border:1px solid #ece4d4; border-radius:16px; padding:14px 16px; margin-bottom:10px; background:#fff; }
.mistake-item img { max-width:220px; border-radius:8px; cursor:zoom-in; }
.view-action-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px; border:none; border-radius:14px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-family:inherit; font-weight:800; font-size:14px; cursor:pointer; }
.view-action-btn.purple { background:linear-gradient(135deg,#7c3aed,#6d28d9); }
.view-action-btn:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(245,158,11,.3); transition:all .2s; }
.page-empty { text-align:center; color:#a8a29e; font-weight:600; padding:28px 0; }
body { padding-top:56px; }`;
  document.head.append(css);
}

// === 页面导航 ===
function navigate(page, push) {
  // Mock exam in progress: lock navigation — only Home allowed (auto-settles)
  const mockActive = (typeof isMockExamActive === 'function') && isMockExamActive();
  if (mockActive && page !== 'home') {
    // 轻提示 + 拒绝跳转
    const note = document.getElementById('nav-lock-note');
    if (note) {
      note.textContent = 'Mock exam in progress — only Home is available';
      note.style.opacity = '1';
      setTimeout(() => { note.style.opacity = '0'; }, 1800);
    }
    return;
  }
  currentPage = page;
  if (push !== false && window.history && history.pushState) {
    try { history.pushState(null, '', (BASE + (ROUTES[page] || '')) || '/'); } catch (e) {}
  }
  // 高亮抽屉
  document.querySelectorAll('.drawer-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  // 显示对应视图
  PAGES.forEach(p => {
    const v = $('view-' + p.id);
    if (v) v.classList.toggle('show', p.id === page);
  });

  if (page === 'home') {
    // 把 info-panel 移回原处并恢复显示（mock 退出时曾被隐藏）
    const panel = $('info-panel');
    if (panel) {
      if (infoPanelHome && panel.parentElement !== infoPanelHome) infoPanelHome.appendChild(panel);
      panel.style.display = '';
    }
    document.body.classList.remove('view-mode');
    // Mock 进行中回主页 = 提前结束 → 自动结算
    if ((typeof isMockExamActive === 'function') && isMockExamActive() && typeof settleMockExam === 'function') {
      settleMockExam();
    }
  } else {
    if (!infoPanelHome) infoPanelHome = $('info-panel').parentElement;
    if (page === 'mistakes') renderMistakesView();
    if (page === 'leaderboard') renderLeaderboardView();
    if (page === 'ai') renderAiView();
    if (page === 'pk' && typeof renderPKView === 'function') renderPKView();
    if (page === 'mock') renderMockView();
  }
}

// === Mock Exam 页 ===
function renderMockView() {
  const body = $('view-mock-body');
  const active = typeof isMockExamActive === 'function' ? isMockExamActive() : false;
  if (!body.dataset.built) {
    body.dataset.built = '1';
    body.innerHTML = `
      <p style="color:#78716c;font-size:.92rem;margin:0 0 16px;">A 45-minute mock exam with 40 questions. Wrong questions are weighted to appear more often. Your timer runs in the top bar area while active.</p>
      <button class="view-action-btn purple" id="mock-start-btn">${ICONS.play}<span>Start Mock Exam</span></button>
      <div id="mock-page-quiz"></div>`;
    $('mock-start-btn').onclick = () => {
      if (typeof startMockExam === 'function') startMockExam();
      // 开始后：题目面板直接进入本页，隐藏开始按钮，无需再点任何东西
      const host = $('mock-page-quiz');
      const panel = $('info-panel');
      if (panel) panel.style.display = '';
      if (panel && host && panel.parentElement !== host) host.appendChild(panel);
      const btn = $('mock-start-btn');
      if (btn) btn.style.display = 'none';
    };
  }
  // 若考试进行中，把题目面板移进来
  if (active) {
    const host = $('mock-page-quiz');
    const panel = $('info-panel');
    if (panel) panel.style.display = '';
    if (panel && host && panel.parentElement !== host) host.appendChild(panel);
    const btn = $('mock-start-btn');
    if (btn) btn.style.display = 'none';
  }
  $('view-mock-title').innerHTML = ICONS.clock + ' Mock Exam';
}

// === Mistake Collection 页 ===
function renderMistakesView() {
  $('view-mistakes-title').innerHTML = ICONS.book + ' Mistake Collection';
  const body = $('view-mistakes-body');
  const records = (typeof getWrongBook === 'function') ? getWrongBook() : [];
  if (!records.length) {
    body.innerHTML = `<p class="page-empty">No mistakes yet. Keep it up!</p>`;
    return;
  }
  // 按题目聚合：显示每题累计错误次数
  const byQ = new Map();
  for (const r of records) {
    const k = r.question || JSON.stringify(r);
    if (!byQ.has(k)) byQ.set(k, { ...r, count: 0, lastTs: 0 });
    const e = byQ.get(k);
    e.count++;
    if (r.timestamp && r.timestamp > e.lastTs) e.lastTs = r.timestamp;
  }
  const items = [...byQ.values()].sort((a, b) => b.count - a.count || b.lastTs - a.lastTs);
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <span style="font-weight:800;color:#334155;font-size:.95rem;">${items.length} question(s) · ${records.length} wrong attempt(s)</span>
      <button id="mistakes-clear-btn" class="topbar-btn" style="background:#fff;border:1.5px solid rgba(220,53,69,.25);color:#dc3545;">${ICONS.trash} Clear All</button>
    </div>
    ${items.map(r => `
      <div class="mistake-item">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:.82rem;color:#78716c;">
            <strong style="color:#334155;">${escapeHtml((r.question || '').split('/')[0])}</strong> ·
            ${r.img ? 'image question' : escapeHtml(String(r.question || '').slice(0, 80))}
            ${r.lastTs ? ' · ' + new Date(r.lastTs).toLocaleDateString() : ''}
          </div>
          <span style="flex-shrink:0;margin-left:10px;padding:3px 10px;border-radius:99px;font-size:.72rem;font-weight:800;background:${r.count >= 3 ? '#fee2e2' : r.count === 2 ? '#fef3c7' : '#f1f5f9'};color:${r.count >= 3 ? '#dc2626' : r.count === 2 ? '#d97706' : '#64748b'};">wrong ×${r.count}</span>
        </div>
        <div>${r.img
          ? `<img src="${ASSET_BASE}questions/${escapeHtml(r.question)}" onclick="zoomImage(this.src)" alt="question image">`
          : `<div style="color:#1e293b;font-weight:600;">${escapeHtml(String(r.question || ''))}</div>`}
        </div>
      </div>`).join('')}`;
  $('mistakes-clear-btn').onclick = () => {
    if (confirm('Clear ALL wrong-question records?')) {
      if (typeof clearAllWrongBook === 'function') clearAllWrongBook();
      renderMistakesView();
    }
  };
}

// === Leaderboard 页 ===
async function renderLeaderboardView() {
  $('view-leaderboard-title').innerHTML = ICONS.trophy + ' Leaderboard';
  const body = $('view-leaderboard-body');
  body.innerHTML = `<p class="page-empty">Loading…</p>`;
  try {
    const data = (typeof loadLeaderboardRows === 'function') ? await loadLeaderboardRows() : null;
    if (!data || !data.length) {
      body.innerHTML = `<p class="page-empty">No records yet — go answer some questions!</p>`;
      return;
    }
    const me = (typeof igCurrentUser === 'function') ? igCurrentUser() : null;
    const myRank = me ? data.findIndex(r => r.student_id === me.studentId) + 1 : 0;
    const medal = i => i === 1 ? 'medal-gold' : i === 2 ? 'medal-silver' : i === 3 ? 'medal-bronze' : '';
    const medalIcon = i => i === 1 ? '🥇' : i === 2 ? '🥈' : i === 3 ? '🥉' : i;
    body.innerHTML = `
      ${myRank ? `
      <div style="background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(217,119,6,.06));border:1.5px solid rgba(245,158,11,.3);border-radius:18px;padding:16px 18px;margin-bottom:18px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:1.6rem;font-weight:800;color:#92400e;">#${myRank}</div>
        <div style="flex:1;font-size:.88rem;color:#78716c;font-weight:600;">Your rank among ${data.length} student(s)<br>
          <span style="color:#334155;">${data[myRank - 1].unique_questions} questions · ${data[myRank - 1].accuracy}% accuracy</span></div>
      </div>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
        <thead><tr style="border-bottom:2px solid #ece4d4;color:#a8a29e;font-size:.78rem;">
          <th style="padding:10px 8px;text-align:center;">Rank</th>
          <th style="padding:10px 8px;text-align:left;">Student ID</th>
          <th style="padding:10px 8px;text-align:right;">Questions</th>
          <th style="padding:10px 8px;text-align:right;">Accuracy</th>
        </tr></thead>
        <tbody>
        ${data.map((row, i) => `
          <tr class="${medal(i + 1)}" style="border-radius:12px;${me && row.student_id === me.studentId && i + 1 > 3 ? 'outline:2px solid rgba(245,158,11,.5);outline-offset:-2px;font-weight:800;' : ''}">
            <td style="padding:12px 8px;text-align:center;font-weight:800;">${medalIcon(i + 1)}</td>
            <td style="padding:12px 8px;font-weight:${i < 3 ? 800 : 500};">${escapeHtml(row.student_id)}</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;">${row.unique_questions}</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:${row.accuracy >= 80 ? '#10b981' : row.accuracy >= 60 ? '#f59e0b' : '#ef4444'};">${row.accuracy}%</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    body.innerHTML = `<p class="page-empty" style="color:#ef4444;">Failed to load: ${escapeHtml(e.message || 'network error')}</p>`;
  }
}

// === AI Analysis 页 ===
function renderAiView() {
  $('view-ai-title').innerHTML = ICONS.sparkles + ' AI Analysis';
  const body = $('view-ai-body');
  if (!body.dataset.built) {
    body.dataset.built = '1';
    body.innerHTML = `
      <p style="color:#78716c;font-size:.92rem;margin:0 0 16px;">Configure your AI provider and API key first, then analyze your mistakes for weak points and study suggestions.</p>
      <div id="ai-page-settings"></div>
      <button class="view-action-btn" id="ai-page-analyze" style="margin-top:14px;" disabled>Analyze My Mistakes</button>
      <div id="ai-page-status" style="font-size:.8rem;color:#78716c;font-weight:600;min-height:1.4em;margin-top:10px;text-align:center;"></div>`;
  }
  // 把既有设置面板 DOM 移植进来（保留全部绑定逻辑）
  const settings = $('ai-settings-panel');
  const host = $('ai-page-settings');
  if (settings && settings.parentElement !== host) {
    settings.style.display = 'block';
    host.appendChild(settings);
  }
  // 分析按钮状态跟随顶栏按钮
  const topBtn = $('ai-analyze-top-btn');
  const pageBtn = $('ai-page-analyze');
  if (topBtn && pageBtn) {
    pageBtn.disabled = topBtn.disabled;
    pageBtn.textContent = topBtn.textContent.replace(/^[^\w]+/, '').trim() || 'Analyze My Mistakes';
    pageBtn.onclick = () => { if (typeof analyzeWrongBook === 'function') analyzeWrongBook(); };
  }
}

// === 启动 ===
function shellInit() {
  buildShell();
  // 按 URL 初始页进入（支持直接访问 /leaderboard 等）
  let target = pageFromPath();
  // GH Pages 404 回退：?page=/leaderboard
  const qp = new URLSearchParams(location.search).get('page');
  if (qp) {
    for (const [page, route] of Object.entries(ROUTES)) if (qp === route) target = page;
    try { history.replaceState(null, '', (BASE + ROUTES[target]) || '/'); } catch (e) {}
  }
  navigate(target, false);
  // 键盘快捷键：Esc 关抽屉
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const d = $('nav-drawer');
      if (d && d.classList.contains('open')) {
        d.classList.remove('open');
        $('nav-scrim').classList.remove('show');
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', shellInit);
if (document.readyState !== 'loading') shellInit();
