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
  github: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.2.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
  gear: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
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
  { id: 'pk', label: '1v1 PK', icon: 'swords' },
  { id: 'mistakes', label: 'Mistake Collection', icon: 'book' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { id: 'ai', label: 'AI Analysis', icon: 'sparkles' },
  { id: 'account', label: 'Account', icon: 'user' }
];

let currentPage = 'home';
let infoPanelHome = null; // #info-panel 的原始父容器

// === URL 路由（真分页：/leaderboard 等）===
const ROUTES = { home: '', mock: '/mock-exam', mistakes: '/mistakes', 'mistakes/paper': '/mistakes/paper', leaderboard: '/leaderboard', ai: '/ai-analysis', pk: '/pk', account: '/account' };
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
    <div style="display:flex;align-items:center;gap:6px;">
      <a id="topbar-github" href="https://github.com/Thomaszhou22/biology_jump_ig" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;color:#334155;text-decoration:none;">${ICONS.github}</a>
      <div id="topbar-auth"></div>
    </div>`;
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
  // 开考：隐藏 Quiz 落地页
  window.addEventListener('quiz-started', () => {
    const landing = $('quiz-landing');
    if (landing) landing.style.display = 'none';
  });
  // 章节弹窗取消：未开考回落地页
  const backBtn = document.getElementById('back-to-names-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      setTimeout(() => {
        if (!deepQuestionsActive()) {
          const landing = $('quiz-landing');
          if (landing) landing.style.display = '';
        }
      }, 50);
    });
  }
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

  // 错题组卷：进入/退出 paper 子路由
  window.addEventListener('paper-started', () => navigate('mistakes/paper', true));
  window.addEventListener('paper-finished', () => { navigate('mistakes', true); renderMistakesView(); });
  window.addEventListener('paper-abandoned', () => { navigate('mistakes', true); renderMistakesView(); });

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
      const lock = active && btn.dataset.page !== 'home' && btn.dataset.page !== 'mock';
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
  mk('mock'); mk('mistakes'); mk('leaderboard'); mk('ai'); mk('pk'); mk('account');
  const accClose = document.querySelector('#view-account .view-close');
  if (accClose) accClose.remove();
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
.view-card { background:#faf6ee; border:1px solid #ece4d4; border-radius:24px; box-shadow:0 1px 3px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.08); max-width:760px; margin:0 auto; padding:26px 28px; font-size:.95rem; }
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
.view-action-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:15px; border:none; border-radius:14px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-family:inherit; font-weight:700; font-size:15px; cursor:pointer; letter-spacing:.3px; }
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
  if (mockActive && page !== 'home' && page !== 'mock') {
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
    // Quiz 落地页：与 Mock 落地页同款（Start Quiz → 章节选择弹窗）；做题中才显示题目面板
    if (!deepQuestionsActive()) {
      renderQuizLanding();
    } else {
      const panel = $('info-panel');
      if (panel) {
        if (infoPanelHome && panel.parentElement !== infoPanelHome) infoPanelHome.appendChild(panel);
        panel.style.display = '';
      }
    }
    document.body.classList.remove('view-mode');
    // Mock 进行中回主页 = 提前结束 → 自动结算
    if ((typeof isMockExamActive === 'function') && isMockExamActive() && typeof settleMockExam === 'function') {
      settleMockExam();
    }
  } else {
    if (!infoPanelHome) infoPanelHome = $('info-panel').parentElement;
    if (page === 'mistakes' || page === 'mistakes/paper') renderMistakesView();
    if (page === 'leaderboard') renderLeaderboardView();
    if (page === 'ai') renderAiView();
    if (page === 'pk' && typeof renderPKView === 'function') renderPKView();
    if (page === 'account') renderAccountPage();
    if (page === 'mock') renderMockView();
  }
}

// === Mock Exam 页 ===
// 做题进行中？（普通 quiz / 错题卷；mock 除外）
function deepQuestionsActive() {
  try {
    return (typeof deepQuestions !== 'undefined') && deepQuestions && deepQuestions.length > 0
      && (typeof isMockExam === 'undefined' || !isMockExam);
  } catch (e) { return false; }
}

// Quiz 落地页：复刻 Mock 落地页
function renderQuizLanding() {
  let landing = $('quiz-landing');
  if (!landing) {
    landing = document.createElement('div');
    landing.id = 'quiz-landing';
    landing.className = 'view-page show';
    landing.innerHTML = `
      <div class="view-card">
        <div class="view-head" style="margin-bottom:14px;">
          <h2>${ICONS.quiz} Quiz</h2>
        </div>
        <p style="color:#78716c;margin:0 0 16px;">Practice with chapter selection, adaptive wrong-question weighting, and per-chapter question counts. Your answers sync to your account.</p>
        <button class="view-action-btn" id="quiz-start-btn">${ICONS.play}<span>Start Quiz</span></button>
      </div>`;
    document.body.appendChild(landing);
    $('quiz-start-btn').onclick = () => {
      landing.style.display = 'none';
      const panel = $('info-panel');
      if (panel) panel.style.display = '';
      if (typeof openChapterModal === 'function') openChapterModal();
    };
  }
  landing.style.display = '';
  const panel = $('info-panel');
  if (panel) panel.style.display = 'none';
}

function renderMockView() {
  const body = $('view-mock-body');
  const active = typeof isMockExamActive === 'function' ? isMockExamActive() : false;
  if (!body.dataset.built) {
    body.dataset.built = '1';
    body.innerHTML = `
      <p style="color:#78716c;margin:0 0 16px;">A 45-minute mock exam with 40 questions. Wrong questions are weighted to appear more often. Your timer runs in the top bar area while active.</p>
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

  // 按题目聚合（错误次数），再按章节分组
  const byQ = new Map();
  for (const r of records) {
    const k = r.question || JSON.stringify(r);
    if (!byQ.has(k)) byQ.set(k, { ...r, count: 0, lastTs: 0 });
    const e = byQ.get(k);
    e.count++;
    if (r.timestamp && r.timestamp > e.lastTs) e.lastTs = r.timestamp;
  }
  const chapters = new Map(); // chId -> { name, items }
  const CHS = (typeof QUESTION_CHAPTERS !== 'undefined') ? QUESTION_CHAPTERS : [];
  for (const it of byQ.values()) {
    const chId = (it.question || '').split('/')[0] || 'other';
    const chName = (CHS.find(c => c.id === chId) || {}).name || chId;
    if (!chapters.has(chId)) chapters.set(chId, { name: chName, items: [] });
    chapters.get(chId).items.push(it);
  }
  const chArr = [...chapters.entries()].map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.items.reduce((s, i) => s + i.count, 0) - a.items.reduce((s, i) => s + i.count, 0));

  // Render: chapter accordion（点击展开才加载图片 —— 懒加载）
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <span style="font-weight:800;color:#334155;font-size:.95rem;">${chArr.length} chapter(s) · ${byQ.size} question(s) · ${records.length} wrong attempt(s)</span>
    </div>
    <button id="mistakes-generate-btn" class="view-action-btn" style="margin-bottom:16px;">
      ${ICONS.sparkles}<span>Generate a Paper from Mistakes</span></button>
    <div id="mistakes-gen-setup" style="display:none;margin-bottom:16px;background:#fff;border:1px solid #ece4d4;border-radius:14px;padding:14px;">
      <p style="font-size:.8rem;color:#78716c;margin:0 0 8px;font-weight:700;">Select chapters (leave empty = all)</p>
      <div id="mistakes-paper-chapters" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;max-height:180px;overflow-y:auto;margin-bottom:10px;">
        ${chArr.map(c => `<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;border:1.5px solid rgba(99,102,241,.1);border-radius:10px;cursor:pointer;font-size:.75rem;color:#334155;">
          <input type="checkbox" value="${escapeHtml(c.id)}" data-max="${c.items.length}" style="accent-color:#c4943a;">${escapeHtml(c.name)} <span style="color:#a8a29e;">(${c.items.length})</span>
        </label>`).join('')}
      </div>
      <p style="font-size:.8rem;color:#78716c;margin:0 0 6px;font-weight:700;">Number of questions (weighted by wrong count)</p>
      <div style="display:flex;gap:8px;align-items:center;">
        <input id="mistakes-paper-count" type="number" min="1" max="50" value="10" style="width:80px;padding:8px;border:2px solid rgba(180,130,70,.15);border-radius:10px;font-family:inherit;font-weight:700;text-align:center;">
        <button id="mistakes-paper-go" style="flex:1;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;">Start Paper</button>
      </div>
    </div>
    <div id="mistakes-chapters-list">
      ${chArr.map((c, ci) => `
      <div class="mistake-chapter" data-ch="${ci}" style="margin-bottom:10px;">
        <button class="mk-ch-head" style="width:100%;display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border:1px solid #ece4d4;border-radius:14px;cursor:pointer;font-family:inherit;text-align:left;">
          <span style="font-size:.9rem;font-weight:800;color:#334155;flex:1;">${escapeHtml(c.name)}</span>
          <span style="font-size:.75rem;color:#a8a29e;font-weight:700;">${c.items.length} Q · ${c.items.reduce((s, i) => s + i.count, 0)} wrong</span>
          <span class="mk-arrow" style="color:#a8a29e;font-size:.8rem;transition:transform .2s;">▾</span>
        </button>
        <div class="mk-ch-body" style="display:none;padding-top:8px;"></div>
      </div>`).join('')}
    </div>`;

  // 章节折叠/展开（懒加载：展开时才渲染图片）
  body.querySelectorAll('.mk-ch-head').forEach(head => {
    head.onclick = () => {
      const wrap = head.closest('.mistake-chapter');
      const chBody = wrap.querySelector('.mk-ch-body');
      const arrow = head.querySelector('.mk-arrow');
      const opening = chBody.style.display === 'none';
      chBody.style.display = opening ? 'block' : 'none';
      arrow.style.transform = opening ? 'rotate(180deg)' : '';
      if (opening && !chBody.dataset.loaded) {
        chBody.dataset.loaded = '1';
        const c = chArr[+wrap.dataset.ch];
        chBody.innerHTML = c.items.map(r => `
          <div class="mistake-item">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div style="font-size:.82rem;color:#78716c;">${escapeHtml(String(r.question || '').split('/').pop())}
                ${r.lastTs ? ' · ' + new Date(r.lastTs).toLocaleDateString() : ''}</div>
              <span style="flex-shrink:0;margin-left:10px;padding:3px 10px;border-radius:99px;font-size:.72rem;font-weight:800;background:${r.count >= 3 ? '#fee2e2' : r.count === 2 ? '#fef3c7' : '#f1f5f9'};color:${r.count >= 3 ? '#dc2626' : r.count === 2 ? '#d97706' : '#64748b'};">wrong ×${r.count}</span>
            </div>
            ${r.img ? `<img loading="lazy" src="${ASSET_BASE}questions/${escapeHtml(r.question)}" onclick="zoomImage(this.src)" alt="question image" style="max-width:220px;border-radius:8px;cursor:zoom-in;">` : ''}
          </div>`).join('');
      }
    };
  });

  // Generate Paper 流程（章节选择 + 题数上限校验）
  const genBtn = $('mistakes-generate-btn');
  const setupBox = $('mistakes-gen-setup');
  genBtn.onclick = () => { setupBox.style.display = setupBox.style.display === 'none' ? 'block' : 'none'; };
  $('mistakes-paper-go').onclick = () => {
    const checked = [...setupBox.querySelectorAll('#mistakes-paper-chapters input:checked')].map(i => i.value);
    const pool = checked.length ? [...byQ.values()].filter(it => checked.includes((it.question || '').split('/')[0])) : [...byQ.values()];
    const max = pool.length;
    const countInput = $('mistakes-paper-count');
    const want = parseInt(countInput.value) || 10;
    if (want > max) { countInput.value = max; alert('Only ' + max + ' wrong question(s) available — count adjusted.'); return; }
    mistakesStartPaper(pool);
  };
}

// === 错题组卷：错误次数越多越可能被抽中 ===
// 按题目路径从题库反查正确答案（云端同步/历史记录可能丢失答案）
function igLookupAnswer(qPath) {
  try {
    const parts = String(qPath || '').split('/');
    const chId = parts[0];
    const m = (parts[1] || '').match(/^q(\d+)\.jpg$/);
    if (!m) return '?';
    const ch = (typeof QUESTION_CHAPTERS !== 'undefined') ? QUESTION_CHAPTERS.find(c => c.id === chId) : null;
    if (ch && ch.answers) {
      const a = ch.answers[parseInt(m[1]) - 1];
      if (a && a.a) return a.a;
    }
  } catch (e) {}
  return '?';
}

function mistakesStartPaper(items) {
  if (!items || !items.length) return;
  const count = Math.max(1, Math.min(50, parseInt($('mistakes-paper-count').value) || 10));
  // 加权抽样（不放回）：weight = 错误次数
  const pool = items.map(it => ({ q: it.question, a: (it.answer && it.answer !== '?') ? it.answer : igLookupAnswer(it.question), img: it.img !== false, chapter: (it.question || '').split('/')[0], w: Math.max(1, it.count || 1) }));
  const picked = [];
  const remaining = pool.slice();
  while (picked.length < count && remaining.length > 0) {
    const totalW = remaining.reduce((s, q) => s + q.w, 0);
    let r = Math.random() * totalW;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i].w;
      if (r <= 0) { picked.push(remaining[i]); remaining.splice(i, 1); break; }
    }
  }
  if (picked.length < 1) { alert('No wrong questions available.'); return; }
  // 启动做题（与主页 quiz 相同引擎，paper 标记在 index.html 全局）
  if (typeof startPaperQuiz === 'function') startPaperQuiz(picked);
}

// === Leaderboard 页 ===
async function renderLeaderboardView(tab) {
  tab = tab || (renderLeaderboardView._tab || 'quiz');
  renderLeaderboardView._tab = tab;
  $('view-leaderboard-title').innerHTML = ICONS.trophy + ' Leaderboard';
  const body = $('view-leaderboard-body');
  const period = renderLeaderboardView._period || 'all';
  renderLeaderboardView._period = period;
  const pbtn = (id, label, on) => `<button id="lb-p-${id}" class="topbar-btn" style="flex:1;${on ? 'background:#334155;color:#fff;border:none;' : 'background:#fff;border:1.5px solid rgba(51,65,85,.15);color:#64748b;'}">${label}</button>`;
  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button id="lb-tab-quiz" class="topbar-btn" style="flex:1;${tab === 'quiz' ? 'background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;' : 'background:#fff;border:1.5px solid rgba(180,130,70,.15);color:#c4943a;'}">Quiz</button>
      <button id="lb-tab-pk" class="topbar-btn" style="flex:1;${tab === 'pk' ? 'background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;' : 'background:#fff;border:1.5px solid rgba(99,102,241,.2);color:#6366f1;'}">1v1 PK</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      ${pbtn('week', 'Week', period === 'week')}
      ${pbtn('month', 'Month', period === 'month')}
      ${pbtn('all', 'All Time', period === 'all')}
    </div>
    <div id="lb-body-inner"></div>
    <div id="lb-quiz-body"></div>`;
  $('lb-tab-quiz').onclick = () => renderLeaderboardView('quiz');
  $('lb-tab-pk').onclick = () => renderLeaderboardView('pk');
  $('lb-p-week').onclick = () => { renderLeaderboardView._period = 'week'; renderLeaderboardView(tab); };
  $('lb-p-month').onclick = () => { renderLeaderboardView._period = 'month'; renderLeaderboardView(tab); };
  $('lb-p-all').onclick = () => { renderLeaderboardView._period = 'all'; renderLeaderboardView(tab); };
  const inner = $('lb-body-inner');

  if (tab === 'pk') {
    inner.innerHTML = `<p class="page-empty">Loading…</p>`;
    try {
      const data = (typeof loadPKLeaderboard === 'function') ? await loadPKLeaderboard(period) : [];
      if (!data.length) { inner.innerHTML = `<p class="page-empty">No PK records yet — challenge someone!</p>`; return; }
      const me = (typeof igCurrentUser === 'function') && igCurrentUser();
      const names = (typeof igPrefetchNames === 'function') ? await igPrefetchNames(data.map(r => r.student_id)) : {};
      const medalIcon = i => i === 1 ? '🥇' : i === 2 ? '🥈' : i === 3 ? '🥉' : i;
      const medalCls = i => i === 1 ? 'medal-gold' : i === 2 ? 'medal-silver' : i === 3 ? 'medal-bronze' : '';
      inner.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:.95rem;">
        <thead><tr style="border-bottom:2px solid #ece4d4;color:#a8a29e;font-size:.78rem;">
          <th style="padding:10px 8px;text-align:center;">Rank</th>
          <th style="padding:10px 8px;text-align:left;">Student ID</th>
          <th style="padding:10px 8px;text-align:right;">Wins</th>
          <th style="padding:10px 8px;text-align:right;">W/L/T</th>
        </tr></thead>
        <tbody>
        ${data.map((row, i) => `
          <tr class="${medalCls(i + 1)}" style="${me && row.student_id === me.studentId && i + 1 > 3 ? 'outline:2px solid rgba(99,102,241,.4);outline-offset:-2px;font-weight:800;' : ''}">
            <td style="padding:12px 8px;text-align:center;font-weight:800;">${medalIcon(i + 1)}</td>
            <td style="padding:12px 8px;font-weight:${i < 3 ? 800 : 500};">${names[row.student_id] ? escapeHtml(names[row.student_id]) + ' <span style="color:#a8a29e;font-size:.75rem;">(' + escapeHtml(row.student_id) + ')</span>' : escapeHtml(row.student_id)}</td>
            <td style="padding:12px 8px;text-align:right;font-weight:800;color:#6366f1;">${row.wins}</td>
            <td style="padding:12px 8px;text-align:right;color:#a8a29e;font-weight:600;">${row.wins}/${row.losses}/${row.ties}</td>
          </tr>`).join('')}
        </tbody></table>`;
    } catch (e) {
      inner.innerHTML = `<p class="page-empty" style="color:#ef4444;">Failed to load: ${escapeHtml(e.message || 'network error')}</p>`;
    }
    return;
  }

  // ===== Quiz 榜（渲染到独立容器，不覆盖 Tab）=====
  const qb = $('lb-quiz-body');
  qb.innerHTML = `<p class="page-empty">Loading…</p>`;
  try {
    let data = (typeof loadLeaderboardRows === 'function') ? await loadLeaderboardRows(period) : null;
    if (!data || !data.length) {
      qb.innerHTML = `<p class="page-empty">No records yet — go answer some questions!</p>`;
      return;
    }
    // 排序：正确题数（题数×正确率，隐性计算，不显示该列）优先，其次正确率
    data = data.slice().sort((a, b) =>
      (b.correct_count ?? Math.round((b.unique_questions * b.accuracy) / 100)) -
      (a.correct_count ?? Math.round((a.unique_questions * a.accuracy) / 100)) ||
      (b.accuracy - a.accuracy));
    const me = (typeof igCurrentUser === 'function') ? igCurrentUser() : null;
    const myRank = me ? data.findIndex(r => r.student_id === me.studentId) + 1 : 0;
    const names = (typeof igPrefetchNames === 'function') ? await igPrefetchNames(data.map(r => r.student_id)) : {};
    const medal = i => i === 1 ? 'medal-gold' : i === 2 ? 'medal-silver' : i === 3 ? 'medal-bronze' : '';
    const medalIcon = i => i === 1 ? '🥇' : i === 2 ? '🥈' : i === 3 ? '🥉' : i;
    qb.innerHTML = `
      ${myRank ? `
      <div style="background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(217,119,6,.06));border:1.5px solid rgba(245,158,11,.3);border-radius:18px;padding:16px 18px;margin-bottom:18px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:1.6rem;font-weight:800;color:#92400e;">#${myRank}</div>
        <div style="flex:1;font-size:.88rem;color:#78716c;font-weight:600;">Your rank among ${data.length} student(s)<br>
          <span style="color:#334155;">${data[myRank - 1].unique_questions} questions · ${data[myRank - 1].accuracy}% accuracy</span></div>
      </div>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:.95rem;">
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
            <td style="padding:12px 8px;font-weight:${i < 3 ? 800 : 500};">${names[row.student_id] ? escapeHtml(names[row.student_id]) + ' <span style="color:#a8a29e;font-size:.75rem;">(' + escapeHtml(row.student_id) + ')</span>' : escapeHtml(row.student_id)}</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;">${row.unique_questions}</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:${row.accuracy >= 80 ? '#10b981' : row.accuracy >= 60 ? '#f59e0b' : '#ef4444'};">${row.accuracy}%</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    qb.innerHTML = `<p class="page-empty" style="color:#ef4444;">Failed to load: ${escapeHtml(e.message || 'network error')}</p>`;
  }
}

// === AI Analysis 页 ===
function renderAiView() {
  $('view-ai-title').innerHTML = ICONS.sparkles + ' AI Analysis';
  const body = $('view-ai-body');
  if (!body.dataset.built) {
    body.dataset.built = '1';
    body.innerHTML = `
      <p style="color:#78716c;margin:0 0 16px;">Configure your AI provider and API key first, then analyze your mistakes for weak points and study suggestions.</p>
      <div id="ai-page-settings"></div>
      <button class="view-action-btn" id="ai-page-analyze" style="margin-top:14px;" disabled>Analyze My Mistakes</button>
      <div id="ai-page-status" style="font-size:.8rem;color:#78716c;font-weight:600;min-height:1.4em;margin-top:10px;text-align:center;"></div>
      <div id="account-section" style="margin-top:28px;padding-top:20px;border-top:1px solid #ece4d4;"></div>`;
  }
  // Account 已独立成页面（菜单项），AI 页不再挂载
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
  // 刷新前在 mock 考试中：直接落回 /mock-exam（bootQuiz 已恢复考试状态）
  if (typeof isMockExamActive === 'function' && isMockExamActive()) target = 'mock';
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


// ===== Account 独立页面 =====
async function renderAccountPage() {
  const tEl = document.getElementById('view-account-title');
  if (tEl && typeof ICONS !== 'undefined' && ICONS.user) tEl.innerHTML = ICONS.user + ' Account';
  const box = document.getElementById('view-account-body');
  if (!box) return;
  const me = (typeof igCurrentUser === 'function') && igCurrentUser();
  if (!me) { box.innerHTML = ''; return; }

  box.innerHTML = `
    <h3 style="margin:0 0 14px;font-size:1.05rem;font-weight:800;color:#1e293b;">👤 Account</h3>
    <div style="background:#fff;border:1px solid #ece4d4;border-radius:14px;padding:16px;margin-bottom:14px;">
      <p style="font-size:.8rem;color:#78716c;font-weight:700;margin:0 0 8px;">Student ID</p>
      <p style="font-size:1rem;font-weight:800;color:#1e293b;margin:0 0 16px;">${escapeHtml(me.studentId)}</p>
      <p style="font-size:.8rem;color:#78716c;font-weight:700;margin:0 0 8px;">Preferred Name <span style="color:#a8a29e;font-weight:500;">(shown in PK & leaderboards)</span></p>
      <div style="display:flex;gap:8px;">
        <input id="acc-pname" maxlength="20" placeholder="e.g. Tom" style="flex:1;padding:10px 12px;border:2px solid rgba(180,130,70,.15);border-radius:10px;font-family:inherit;">
        <button id="acc-pname-save" style="padding:10px 16px;border:none;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;">Save</button>
      </div>
      <p id="acc-pname-msg" style="font-size:.75rem;color:#10b981;font-weight:700;min-height:1.2em;margin:6px 0 0;"></p>
    </div>
    <div style="background:#fff;border:1px solid #ece4d4;border-radius:14px;padding:16px;margin-bottom:14px;">
      <p style="font-size:.8rem;color:#78716c;font-weight:700;margin:0 0 10px;">Change Password</p>
      <input id="acc-old-pass" type="password" placeholder="Current password" style="width:100%;box-sizing:border-box;padding:10px 12px;border:2px solid rgba(180,130,70,.15);border-radius:10px;font-family:inherit;margin-bottom:8px;">
      <input id="acc-new-pass" type="password" placeholder="New password (min 4 chars)" style="width:100%;box-sizing:border-box;padding:10px 12px;border:2px solid rgba(180,130,70,.15);border-radius:10px;font-family:inherit;margin-bottom:10px;">
      <button id="acc-pass-btn" style="width:100%;padding:11px;border:none;border-radius:10px;background:#334155;color:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;">Update Password</button>
      <p id="acc-pass-msg" style="font-size:.75rem;font-weight:700;min-height:1.2em;margin:6px 0 0;"></p>
    </div>
    <div style="background:#fef2f2;border:1.5px solid rgba(220,53,69,.25);border-radius:14px;padding:16px;">
      <p style="font-size:.9rem;font-weight:800;color:#dc2626;margin:0 0 4px;">⚠️ Danger Zone</p>
      <p style="font-size:.75rem;color:#a8a29e;margin:0 0 12px;">Deleting your account permanently removes all answers, PK history, and the account itself. This cannot be undone.</p>
      <input id="acc-del-pass" type="password" placeholder="Password to confirm deletion" style="width:100%;box-sizing:border-box;padding:10px 12px;border:2px solid rgba(220,53,69,.2);border-radius:10px;font-family:inherit;margin-bottom:10px;">
      <button id="acc-del-btn" style="width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;">Delete My Account</button>
      <p id="acc-del-msg" style="font-size:.75rem;font-weight:700;min-height:1.2em;margin:6px 0 0;"></p>
    </div>`;

  // Preferred name：加载现有值 + 保存
  const pnameInput = document.getElementById('acc-pname');
  const pn = await loadMyPreferredName();
  if (pn) pnameInput.value = pn;
  document.getElementById('acc-pname-save').onclick = async () => {
    const msg = document.getElementById('acc-pname-msg');
    const ok = await savePreferredName(pnameInput.value);
    msg.style.color = ok ? '#10b981' : '#ef4444';
    msg.textContent = ok ? 'Saved ✓' : 'Save failed';
    if (ok && typeof igCurrentUser === 'function') {
      const u = igCurrentUser();
      if (u) { u.preferredName = pnameInput.value.trim(); sessionStorage.setItem('ig-auth-user', JSON.stringify(u)); }
    }
  };

  // 改密码
  document.getElementById('acc-pass-btn').onclick = async () => {
    const msg = document.getElementById('acc-pass-msg');
    const oldP = document.getElementById('acc-old-pass').value;
    const newP = document.getElementById('acc-new-pass').value;
    if (newP.length < 4) { msg.style.color = '#ef4444'; msg.textContent = 'New password must be at least 4 characters'; return; }
    msg.style.color = '#78716c'; msg.textContent = 'Updating…';
    const r = await changeMyPassword(oldP, newP);
    msg.style.color = r.ok ? '#10b981' : '#ef4444';
    msg.textContent = r.ok ? 'Password updated ✓' : r.msg;
    if (r.ok) { document.getElementById('acc-old-pass').value = ''; document.getElementById('acc-new-pass').value = ''; }
  };

  // 注销（二次 confirm）
  document.getElementById('acc-del-btn').onclick = async () => {
    const pass = document.getElementById('acc-del-pass').value;
    if (!pass) { const m = document.getElementById('acc-del-msg'); m.style.color = '#ef4444'; m.textContent = 'Enter your password to confirm'; return; }
    if (!confirm('Delete your account and ALL data? This cannot be undone.')) return;
    if (!confirm('Are you REALLY sure? Final confirmation.')) return;
    const msg = document.getElementById('acc-del-msg');
    msg.style.color = '#78716c'; msg.textContent = 'Deleting…';
    const r = await deleteMyAccount(pass);
    if (r.ok) {
      if (typeof logout === 'function') logout();
      alert('Account deleted. Goodbye.');
    } else {
      msg.style.color = '#ef4444'; msg.textContent = r.msg;
    }
  };
}
