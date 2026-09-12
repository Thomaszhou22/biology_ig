// settings.js — IG Biology Quiz 设置：语言（EN/中文）+ 主题（亮/暗）
/* global renderAuthUI, renderDrawerUser */

const IG_SETTINGS_KEY = '***';

function igLoadSettings() {
  try { return JSON.parse(localStorage.getItem(IG_SETTINGS_KEY) || '{}'); } catch { return {}; }
}
function igSaveSettings(s) {
  try { localStorage.setItem(IG_SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  applyIgSettings();
}

function applyIgSettings() {
  const s = igLoadSettings();
  // 主题
  document.documentElement.dataset.theme = s.theme === 'dark' ? 'dark' : 'light';
  // 语言
  document.documentElement.lang = s.lang === 'zh' ? 'zh-CN' : 'en';
  igApplyI18n();
}

function igApplyI18n() {
  const s = igLoadSettings();
  const dict = IG_I18N[s.lang === 'zh' ? 'zh' : 'en'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (dict[k] !== undefined) el.textContent = dict[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.dataset.i18nPh;
    if (dict[k] !== undefined) el.placeholder = dict[k];
  });
}

// ===== 词典（覆盖主要 UI；游戏内动态文案保持英文）=====
const IG_I18N = {
  en: {
    'nav.quiz': 'Quiz', 'nav.mock': 'Mock Exam', 'nav.pk': '1v1 PK',
    'nav.mistakes': 'Mistake Collection', 'nav.leaderboard': 'Leaderboard', 'nav.ai': 'AI Analysis',
    'home.start': 'Select Chapters', 'home.counter': 'Select chapters to start',
    'mock.title': 'Mock Exam',
    'mock.desc': 'A 45-minute mock exam with 40 questions. Wrong questions are weighted to appear more often. Your timer runs in the top bar area while active.',
    'mock.start': 'Start Mock Exam',
    'mistakes.title': 'Mistake Collection', 'mistakes.gen': 'Generate a Paper from Mistakes',
    'mistakes.count': 'Number of questions (weighted by wrong count)', 'mistakes.go': 'Start Paper',
    'mistakes.empty': 'No mistakes yet. Keep it up!',
    'lb.title': 'Leaderboard', 'lb.loading': 'Loading…', 'lb.empty': 'No records yet — go answer some questions!',
    'lb.rank': 'Rank', 'lb.sid': 'Student ID', 'lb.qs': 'Questions', 'lb.acc': 'Accuracy',
    'ai.title': 'AI Analysis',
    'ai.desc': 'Configure your AI provider and API key first, then analyze your mistakes for weak points and study suggestions.',
    'settings.title': 'Settings', 'settings.lang': 'Language', 'settings.theme': 'Theme',
    'settings.light': 'Light', 'settings.dark': 'Dark', 'settings.close': 'Close',
    'gate.signin': 'Sign in', 'gate.signup': 'Sign up',
    'gate.hint': 'Please sign in with your student ID'
  },
  zh: {
    'nav.quiz': '刷题', 'nav.mock': '模拟考试', 'nav.pk': '1v1 对战',
    'nav.mistakes': '错题本', 'nav.leaderboard': '排行榜', 'nav.ai': 'AI 分析',
    'home.start': '选择章节', 'home.counter': '选择章节开始刷题',
    'mock.title': '模拟考试',
    'mock.desc': '45 分钟 40 题的模拟考试，错题有更高概率再次出现，计时器显示在顶部。',
    'mock.start': '开始模拟考试',
    'mistakes.title': '错题本', 'mistakes.gen': '从错题生成一套卷子',
    'mistakes.count': '题目数量（按错误次数加权）', 'mistakes.go': '开始做题',
    'mistakes.empty': '还没有错题，继续保持！',
    'lb.title': '排行榜', 'lb.loading': '加载中…', 'lb.empty': '还没有记录——快去刷题吧！',
    'lb.rank': '排名', 'lb.sid': '学号', 'lb.qs': '做题数', 'lb.acc': '正确率',
    'ai.title': 'AI 分析',
    'ai.desc': '先配置 AI 服务商和 API Key，再分析错题的薄弱点与学习建议。',
    'settings.title': '设置', 'settings.lang': '语言', 'settings.theme': '主题',
    'settings.light': '日间', 'settings.dark': '夜间', 'settings.close': '关闭',
    'gate.signin': '登录', 'gate.signup': '注册',
    'gate.hint': '请使用学号登录'
  }
};

// ===== 设置弹窗 =====
function openSettingsModal() {
  let ov = document.getElementById('ig-settings-modal');
  if (ov) { ov.style.display = 'flex'; syncSettingsUI(); return; }
  ov = document.createElement('div');
  ov.id = 'ig-settings-modal';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(30,41,59,.4);display:flex;align-items:center;justify-content:center;z-index:9800;padding:20px;';
  ov.innerHTML = `
    <div style="background:var(--ig-card,#fff);border-radius:20px;padding:26px;width:min(340px,92vw);box-shadow:0 12px 40px rgba(0,0,0,.3);">
      <h3 data-i18n="settings.title" style="margin:0 0 18px;text-align:center;font-weight:800;font-size:1.15rem;">Settings</h3>
      <div style="margin-bottom:16px;">
        <div style="font-size:.8rem;font-weight:800;color:#78716c;margin-bottom:8px;" data-i18n="settings.lang">Language</div>
        <div style="display:flex;gap:8px;">
          <button id="ig-lang-en" style="flex:1;padding:10px;border:2px solid rgba(180,130,70,.15);border-radius:12px;background:#fff;cursor:pointer;font-family:inherit;font-weight:700;">English</button>
          <button id="ig-lang-zh" style="flex:1;padding:10px;border:2px solid rgba(180,130,70,.15);border-radius:12px;background:#fff;cursor:pointer;font-family:inherit;font-weight:700;">中文</button>
        </div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-size:.8rem;font-weight:800;color:#78716c;margin-bottom:8px;" data-i18n="settings.theme">Theme</div>
        <div style="display:flex;gap:8px;">
          <button id="ig-theme-light" style="flex:1;padding:10px;border:2px solid rgba(180,130,70,.15);border-radius:12px;background:#fff;cursor:pointer;font-family:inherit;font-weight:700;">☀️ Light</button>
          <button id="ig-theme-dark" style="flex:1;padding:10px;border:2px solid rgba(180,130,70,.15);border-radius:12px;background:#fff;cursor:pointer;font-family:inherit;font-weight:700;">🌙 Dark</button>
        </div>
      </div>
      <button id="ig-settings-close" data-i18n="settings.close" style="width:100%;padding:11px;border:2px solid rgba(180,130,70,.12);border-radius:12px;background:none;color:#c4943a;font-weight:700;cursor:pointer;font-family:inherit;">Close</button>
    </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.style.display = 'none'; });
  document.getElementById('ig-settings-close').onclick = () => ov.style.display = 'none';
  document.getElementById('ig-lang-en').onclick = () => { const s = igLoadSettings(); s.lang = 'en'; igSaveSettings(s); syncSettingsUI(); location.reload(); };
  document.getElementById('ig-lang-zh').onclick = () => { const s = igLoadSettings(); s.lang = 'zh'; igSaveSettings(s); syncSettingsUI(); location.reload(); };
  document.getElementById('ig-theme-light').onclick = () => { const s = igLoadSettings(); s.theme = 'light'; igSaveSettings(s); syncSettingsUI(); };
  document.getElementById('ig-theme-dark').onclick = () => { const s = igLoadSettings(); s.theme = 'dark'; igSaveSettings(s); syncSettingsUI(); };
  syncSettingsUI();
}

function syncSettingsUI() {
  const s = igLoadSettings();
  const mark = (id, on) => {
    const b = document.getElementById(id);
    if (b) { b.style.borderColor = on ? '#f59e0b' : 'rgba(180,130,70,.15)'; b.style.background = on ? 'rgba(245,158,11,.12)' : '#fff'; }
  };
  mark('ig-lang-en', s.lang !== 'zh');
  mark('ig-lang-zh', s.lang === 'zh');
  mark('ig-theme-light', s.theme !== 'dark');
  mark('ig-theme-dark', s.theme === 'dark');
}

document.addEventListener('DOMContentLoaded', applyIgSettings);
if (document.readyState !== 'loading') applyIgSettings();
