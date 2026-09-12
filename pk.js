// pk.js — IG Biology Quiz 1v1 PK
// 房间制：房主建房（选章节/题数）→ 对方输码加入 → 3-2-1 → 同题同序对战
// 同步方式：Supabase pk_rooms 表轮询（经 api.igmcq.com Worker 中转，国内直连）
// 历史记录：localStorage
/* global crypto, QUESTION_CHAPTERS, loadQuestionsFromChapters, renderCurrentQuestion,
   deepQuestions, questionIndex, currentQuestionItem, isAnswering, totalCorrect, totalWrong,
   recordAnswerCloud, getWrongBook, addWrongQuestionRecord, igCurrentUser, ASSET_BASE */

const PK_TABLE = 'pk_rooms';

// ============ PK 历史（localStorage）============
const PK_HISTORY_KEY = 'ig-quiz-pk-history';
function getPKHistory() { try { return JSON.parse(localStorage.getItem(PK_HISTORY_KEY) || '[]'); } catch { return []; } }
function addPKHistory(entry) {
  const h = getPKHistory();
  h.unshift(entry);
  localStorage.setItem(PK_HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
}

// ============ Supabase helper（复用 auth.js 的 fetch 风格）============
async function pkApi(path, opts) {
  const ANON = (typeof SB_ANON_KEY !== 'undefined') ? SB_ANON_KEY : '';
  const res = await fetch('https://api.igmcq.com' + path, Object.assign({
    headers: { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json' }
  }, opts || {}));
  const text = await res.text();
  if (!res.ok) throw new Error((text || '').slice(0, 120) || ('HTTP ' + res.status));
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function pkMyId() {
  // 登录账号优先：同一账号在任何设备上是同一个 id（用于拦截自己和自己 PK）
  const u = (typeof igCurrentUser === 'function') && igCurrentUser();
  if (u && u.studentId) return 'sid_' + u.studentId;
  let id = localStorage.getItem('ig-pk-id');
  if (!id) { id = 'u' + Math.random().toString(36).slice(2, 10); localStorage.setItem('ig-pk-id', id); }
  return id;
}
function pkMyName() {
  const u = (typeof igCurrentUser === 'function') && igCurrentUser();
  return u ? u.studentId : 'Guest-' + pkMyId().slice(1, 4).toUpperCase();
}

// ============ 状态 ============
let pkState = null;

// PK 会话持久化：刷新后重连房间
const PK_STATE_KEY = 'ig-pk-session';
function pkSaveSession() {
  if (!pkState) { try { localStorage.removeItem(PK_STATE_KEY); } catch (e) {} return; }
  const s = pkState;
  try {
    localStorage.setItem(PK_STATE_KEY, JSON.stringify({
      role: s.role, code: s.code, questions: s.questions, qCount: s.qCount,
      myScore: s.myScore, oppScore: s.oppScore, myAnswered: s.myAnswered,
      oppAnswered: s.oppAnswered, status: s.status, myDone: s.myDone, oppDone: s.oppDone
    }));
  } catch (e) {}
}
function pkLoadSession() {
  try { return JSON.parse(localStorage.getItem(PK_STATE_KEY) || 'null'); } catch { return null; }
}
function pkClearSession() { try { localStorage.removeItem(PK_STATE_KEY); } catch (e) {} }
// { role: 'host'|'guest', code, questions, qCount, chapters, myScore, oppScore,
//   myAnswered, oppAnswered, status, pollTimer, myDone, oppDone }

function pkEscape(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// 刷新恢复：查房间，活着就回到对战界面
async function pkTryResume() {
  const saved = pkLoadSession();
  if (!saved || !saved.code || saved.status === 'finished') return;
  try {
    const rows = await pkApi(`/rest/v1/${PK_TABLE}?code=***}&select=*`);
    if (!rows || !rows.length) { pkClearSession(); return; }  // 房间已结算删除
    const room = rows[0];
    // 恢复本地状态
    pkState = Object.assign({}, saved, { pollTimer: null });
    // 回到对应界面
    document.getElementById('pk-lobby').style.display = 'none';
    if (pkState.status === 'waiting') {
      document.getElementById('pk-waiting').style.display = 'block';
      document.getElementById('pk-wait-code').textContent = pkState.code;
      pkPoll();
    } else {
      // playing / done：恢复对战界面（无倒计时）
      document.getElementById('pk-game').style.display = 'block';
      pkUpdateScoreboard();
      if (pkState.myDone) {
        document.getElementById('pk-q-area').innerHTML = '<p style="text-align:center;color:#a8a29e;font-weight:700;padding:20px 0;">Waiting for opponent…</p>';
      } else if (pkState.myAnswered >= pkState.qCount) {
        pkMarkDone();
      } else {
        pkShowQuestion();
      }
      pkPoll();
    }
  } catch (e) {}
}

// ============ PK 云端排行榜 ============
async function loadPKLeaderboard(period) {
  // 已注册用户全部上榜（无 PK 记录显示 0）；period: week/month/all
  const table = period === 'week' ? 'pk_results_week' : period === 'month' ? 'pk_results_month' : 'pk_results';
  const users = await pkApi('/rest/v1/ig_users?select=student_id&limit=1000');
  const rows = await pkApi(`/rest/v1/${table}?select=student_id,result&limit=10000`);
  const agg = new Map();
  for (const u of users || []) {
    agg.set(u.student_id, { student_id: u.student_id, wins: 0, losses: 0, ties: 0, total: 0 });
  }
  for (const r of rows || []) {
    if (!agg.has(r.student_id)) agg.set(r.student_id, { student_id: r.student_id, wins: 0, losses: 0, ties: 0, total: 0 });
    const a = agg.get(r.student_id);
    a.total++;
    if (r.result === 'win') a.wins++;
    else if (r.result === 'loss') a.losses++;
    else a.ties++;
  }
  return [...agg.values()].sort((a, b) => b.wins - a.wins || (b.wins / (b.total || 1)) - (a.wins / (a.total || 1)));
}

// ============ 房间码 ============
function pkGenCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
  return c;
}

// ============ UI：PK 页 ============
function renderPKView() {
  const body = document.getElementById('view-pk-body');
  const title = document.getElementById('view-pk-title');
  title.textContent = '1v1 PK';
  body.innerHTML = `
    <p style="color:#78716c;font-size:.92rem;margin:0 0 18px;">Challenge a classmate to a real-time duel on the same questions.</p>

    <div id="pk-lobby">
      <button id="pk-create-btn" style="width:100%;padding:14px;margin-bottom:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">Create Room</button>
      <div style="display:flex;gap:10px;margin-bottom:4px;">
        <input id="pk-join-input" placeholder="enter code to join an existing room" maxlength="4" autocomplete="off" autocapitalize="characters" style="flex:1;min-width:0;text-transform:uppercase;font-family:inherit;font-weight:700;font-size:14px;letter-spacing:1px;padding:12px 14px;border:2px solid rgba(99,102,241,.2);border-radius:12px;">
        <button id="pk-join-btn" style="padding:12px 18px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;white-space:nowrap;">Join</button>
      </div>
      <div id="pk-join-note" style="width:100%;font-size:.72rem;color:#d97706;font-weight:700;text-align:center;opacity:0;transition:opacity .3s;margin-bottom:10px;"></div>
      <button id="pk-history-btn" style="width:100%;padding:10px;border:2px solid rgba(180,130,70,.12);border-radius:12px;background:none;color:#c4943a;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">🏆 PK History</button>
    </div>

    <div id="pk-setup" style="display:none;">
      <h3 style="margin:0 0 10px;font-size:1rem;color:#1e293b;">Room Setup</h3>
      <p style="font-size:.8rem;color:#78716c;margin:0 0 8px;">Select chapters (leave empty = all)</p>
      <div id="pk-chapters" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;max-height:200px;overflow-y:auto;margin-bottom:12px;"></div>
      <p style="font-size:.8rem;color:#78716c;margin:0 0 6px;">Number of questions</p>
      <input id="pk-count" type="number" min="5" max="50" value="10" style="width:100%;box-sizing:border-box;padding:10px;border:2px solid rgba(180,130,70,.15);border-radius:12px;font-family:inherit;margin-bottom:12px;">
      <button id="pk-go-btn" style="width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">Create & Wait</button>
    </div>

    <div id="pk-waiting" style="display:none;text-align:center;padding:24px 0;">
      <p style="font-weight:800;color:#1e293b;font-size:1.05rem;margin:0 0 6px;">Waiting for opponent…</p>
      <p style="color:#78716c;font-size:.85rem;margin:0 0 14px;">Share this room code:</p>
      <div id="pk-wait-code" style="font-size:2.4rem;font-weight:800;letter-spacing:10px;color:#92400e;background:rgba(245,158,11,.1);border-radius:16px;padding:12px;margin-bottom:14px;"></div>
      <p id="pk-wait-status" style="color:#a8a29e;font-size:.8rem;">polling…</p>
      <button id="pk-cancel-btn" style="padding:10px 24px;border:2px solid rgba(220,53,69,.2);border-radius:12px;background:#fff;color:#dc3545;font-weight:700;cursor:pointer;font-family:inherit;">Cancel</button>
    </div>

    <div id="pk-game" style="display:none;">
      <div id="pk-scoreboard" style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #ece4d4;border-radius:14px;padding:12px 16px;margin-bottom:12px;">
        <div style="text-align:center;flex:1;"><div id="pk-me-name" style="font-size:.75rem;font-weight:800;color:#78716c;"></div><div id="pk-me-score" style="font-size:1.6rem;font-weight:800;color:#d97706;">0</div></div>
        <div style="font-size:.85rem;font-weight:800;color:#a8a29e;">VS</div>
        <div style="text-align:center;flex:1;"><div id="pk-opp-name" style="font-size:.75rem;font-weight:800;color:#78716c;"></div><div id="pk-opp-score" style="font-size:1.6rem;font-weight:800;color:#6366f1;">0</div></div>
      </div>
      <div id="pk-q-area"></div>
    </div>

    <div id="pk-result" style="display:none;text-align:center;padding:24px 0;"></div>
  `;

  // 房间码输入过滤：仅大写字母与数字，小写自动转大写；中文输入法直接拦截
  const joinInput = document.getElementById('pk-join-input');
  joinInput.addEventListener('input', () => {
    const v = joinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (joinInput.value !== v) joinInput.value = v;
  });
  // keydown 层拦截：非英文/数字按键（含中文输入法组合键）直接吃掉
  joinInput.addEventListener('keydown', (e) => {
    // 放行控制键（退格、方向、全选复制粘贴等）
    if (e.key.length > 1 || e.metaKey || e.ctrlKey) return;
    // 只放行 a-z 0-9（英文输入法）；其他可见字符（含中文/全角/符号）拦截
    if (!/[a-zA-Z0-9]/.test(e.key)) e.preventDefault();
  });
  // compositionstart 时切英文提示（中文输入法开始组合即拦）
  joinInput.addEventListener('compositionstart', () => {
    const note = document.getElementById('pk-join-note');
    if (note) { note.textContent = 'Please use the English keyboard for room codes (A-Z, 0-9)'; note.style.opacity = '1'; }
  });
  joinInput.addEventListener('compositionend', () => {
    const v = joinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (joinInput.value !== v) joinInput.value = v;
  });

  // 刷新恢复：若会话存档存在，验证房间还活着后直接重连
  pkTryResume();

  document.getElementById('pk-create-btn').onclick = pkShowSetup;
  document.getElementById('pk-join-btn').onclick = pkJoinRoom;
  document.getElementById('pk-history-btn').onclick = pkShowHistory;
  document.getElementById('pk-go-btn').onclick = pkCreateRoom;
  document.getElementById('pk-cancel-btn').onclick = pkLeaveRoom;
}

// ============ 章节选择（房主）============
function pkShowSetup() {
  document.getElementById('pk-lobby').style.display = 'none';
  const setup = document.getElementById('pk-setup');
  setup.style.display = 'block';
  if (setup.dataset.built) return;
  setup.dataset.built = '1';
  const box = document.getElementById('pk-chapters');
  const CHS = (typeof QUESTION_CHAPTERS !== 'undefined') ? QUESTION_CHAPTERS : [];
  box.innerHTML = CHS.map(c => `
    <label style="display:flex;align-items:center;gap:6px;padding:6px 8px;border:1.5px solid rgba(99,102,241,.1);border-radius:10px;cursor:pointer;font-size:.75rem;color:#334155;">
      <input type="checkbox" value="${pkEscape(c.id)}" style="accent-color:#c4943a;">${pkEscape(c.name || c.id)}
    </label>`).join('');
}

// ============ 建房 ============
async function pkCreateRoom() {
  const checked = [...document.querySelectorAll('#pk-chapters input:checked')].map(i => i.value);
  const count = Math.max(5, Math.min(50, parseInt(document.getElementById('pk-count').value) || 10));
  // 组题（与 loadQuestionsFromChapters 相同的抽题逻辑，本地完成）
  const CHS = (typeof QUESTION_CHAPTERS !== 'undefined') ? QUESTION_CHAPTERS : [];
  const chIds = checked.length ? checked : CHS.map(c => c.id);
  // 生成候选
  const pool = [];
  for (const ch of CHS) {
    if (!chIds.includes(ch.id)) continue;
    for (let i = 1; i <= (ch.count || 0); i++) {
      const num = String(i).padStart(2, '0');
      const ans = ch.answers ? ch.answers[i - 1] : null;
      pool.push({ q: ch.id + '/q' + num + '.jpg', img: true, a: ans ? ans.a : '?', chapter: ch.name });
    }
  }
  if (pool.length < count) { alert('Not enough questions in selected chapters.'); return; }
  // 洗牌取前 N
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const qs = pool.slice(0, count).map(q => ({ q: q.q, a: q.a }));

  const code = pkGenCode();
  try {
    await pkApi(`/rest/v1/${PK_TABLE}`, { method: 'POST', body: JSON.stringify({
      code, host_id: pkMyId(), chapters: chIds, q_count: count, questions: qs, status: 'waiting'
    })});
  } catch (e) { alert('Create failed: ' + e.message); return; }

  pkState = { role: 'host', code, questions: qs, qCount: count, myScore: 0, oppScore: 0, myAnswered: 0, oppAnswered: 0, status: 'waiting', myDone: false, oppDone: false };
  document.getElementById('pk-setup').style.display = 'none';
  document.getElementById('pk-waiting').style.display = 'block';
  document.getElementById('pk-wait-code').textContent = code;
  pkSaveSession();
  pkPoll();
}

// ============ 加入 ============
async function pkJoinRoom() {
  const code = (document.getElementById('pk-join-input').value || '').trim().toUpperCase();
  if (code.length !== 4) { alert('Room code is 4 characters.'); return; }
  try {
    const rows = await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${code}&select=*`);
    if (!rows || !rows.length) { alert('Room not found.'); return; }
    const room = rows[0];
    if (room.status !== 'waiting') { alert('Room already started or finished.'); return; }
    if (room.host_id === pkMyId()) { alert('You cannot join your own room (same account).'); return; }
    await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${code}`, { method: 'PATCH', body: JSON.stringify({
      guest_id: pkMyId(), status: 'countdown', start_at: new Date().toISOString()
    })});
    pkState = { role: 'guest', code, questions: room.questions, qCount: room.q_count, myScore: 0, oppScore: 0, myAnswered: 0, oppAnswered: 0, status: 'countdown', myDone: false, oppDone: false };
    document.getElementById('pk-lobby').style.display = 'none';
    pkStartGame(room);
  } catch (e) { alert('Join failed: ' + e.message); }
}

// 对手逃跑：逃跑方判负，留守方判胜并正常结算进战绩
async function pkOnOpponentFled() {
  if (!pkState || pkState.status === 'finished') return;
  const s = pkState;
  // 留守方判胜（对手弃权）
  const myScore = s.myScore, oppScore = s.oppScore;
  // 对手名（逃跑方）
  let oppNameF = 'Opponent';
  const oppSidF = s.oppStudentId && String(s.oppStudentId).startsWith('sid_') ? s.oppStudentId.slice(4) : null;
  if (oppSidF) {
    oppNameF = oppSidF;
    try {
      const namesF = (typeof igPrefetchNames === 'function') ? await igPrefetchNames([oppSidF]) : {};
      if (namesF[oppSidF]) oppNameF = namesF[oppSidF];
    } catch (e) {}
  }
  addPKHistory({ date: new Date().toISOString(), code: s.code, myScore, oppScore, result: 'win', fled: true, opp: oppNameF });
  // 云端上报（PK 排行榜）：逃跑判负场景留守方记一胜
  const meU = (typeof igCurrentUser === 'function') && igCurrentUser();
  if (meU && /^\d{8}$/.test(meU.studentId) && Number.isFinite(myScore) && myScore >= 0 && myScore <= s.qCount * 1500 + 100) {
    pkApi('/rest/v1/pk_results', { method: 'POST', body: JSON.stringify({
      student_id: meU.studentId, code: s.code, my_score: Math.round(myScore), opp_score: Math.round(oppScore), result: 'win'
    })}).catch(() => {});
  }
  if (typeof commitSessionRecords === 'function') commitSessionRecords();
  pkClearSession();
  if (s.pollTimer) clearTimeout(s.pollTimer);
  pkState = null;
  const game = document.getElementById('pk-game');
  if (game) game.style.display = 'none';
  const result = document.getElementById('pk-result');
  result.style.display = 'block';
  result.innerHTML = `
    <div style="font-size:3rem;margin-bottom:6px;">🏆</div>
    <h2 style="margin:0 0 4px;font-size:1.4rem;color:#1e293b;">Victory (Walkover)</h2>
    <p style="font-size:.95rem;font-weight:700;color:#78716c;margin:0 0 16px;">Your opponent left the duel — you win by forfeit.</p>
    <button id="pk-fled-back-btn" style="padding:12px 28px;border:none;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">Back to Lobby</button>`;
  document.getElementById('pk-fled-back-btn').onclick = () => {
    result.style.display = 'none';
    document.getElementById('pk-lobby').style.display = 'block';
  };
}

// ============ 轮询 ============
function pkPoll() {
  if (pkState && pkState.pollTimer) clearTimeout(pkState.pollTimer);
  if (!pkState) return;
  pkState.pollTimer = setTimeout(async () => {
    if (!pkState) return;
    try {
      const rows = await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${pkState.code}&select=*`);
      if (rows && rows.length) await pkOnRoom(rows[0]);
      else if (pkState && pkState.status !== 'finished' && !pkState.myDone) {
        // 房间消失且自己没完成 = 对方逃跑（我方判胜）
        pkOnOpponentFled();
      }
      // 心跳：告诉对方我还在线
      if (pkState && pkState.status !== 'finished') {
        const hb = pkState.role === 'host' ? { host_seen: new Date().toISOString() } : { guest_seen: new Date().toISOString() };
        pkApi(`/rest/v1/${PK_TABLE}?code=eq.${pkState.code}`, { method: 'PATCH', body: JSON.stringify(hb) }).catch(() => {});
      }
    } catch (e) {}
    if (pkState && pkState.status !== 'finished') pkPoll();
  }, 1500);
}

async function pkOnRoom(room) {
  const s = pkState;
  if (!s) return;

  if (s.role === 'host' && s.status === 'waiting' && room.status === 'countdown') {
    s.status = 'countdown';
    document.getElementById('pk-waiting').style.display = 'none';
    pkStartGame(room);
    return;
  }

  // 逃跑检测：仅在对手确实已加入且开局后才启用（waiting 阶段 guest 未进房，心跳为空是正常的）
  const opponentJoined = s.role === 'host' ? !!room.guest_id : true;
  if (opponentJoined && room.status !== 'waiting' && room.status !== 'finished') {
    const oppSeenField = s.role === 'host' ? 'guest_seen' : 'host_seen';
    const oppSeen = room[oppSeenField] ? Date.parse(room[oppSeenField]) : 0;
    if (oppSeen && Date.now() - oppSeen > 10000) {
      // 对手跑了：清理房间，留守方判胜
      try { await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${s.code}`, { method: 'DELETE' }); } catch (e) {}
      pkOnOpponentFled();
      return;
    }
  }

  // 对手进度更新
  s.oppStudentId = s.role === 'host' ? room.guest_id : room.host_id;
  const oppScoreField = s.role === 'host' ? 'guest_score' : 'host_score';
  const oppAnsField = s.role === 'host' ? 'guest_answered' : 'host_answered';
  s.oppScore = room[oppScoreField] || 0;
  s.oppAnswered = room[oppAnsField] || 0;
  // 对手完成 = 对方那侧的 done 标记（host 的对手是 guest_done，反之亦然）
  const oppDoneStatus = s.role === 'host' ? 'guest_done' : 'host_done';
  s.oppDone = room.status === oppDoneStatus || room.status === 'finished';

  pkUpdateScoreboard();

  // 对手完成而我也完成 → 结算
  if (s.myDone && (s.oppDone || (room.status === 'finished'))) {
    pkFinish(room);
  }
}

// ============ 开局（3-2-1 + 答题区）============
async function pkStartGame(room) {
  const s = pkState;
  // 倒计时浮层
  const cd = document.createElement('div');
  cd.style.cssText = 'position:fixed;inset:0;z-index:9600;background:rgba(245,240,232,.9);display:flex;align-items:center;justify-content:center;pointer-events:none;';
  cd.innerHTML = '<span style="font-size:110px;font-weight:800;color:#1e293b;"></span>';
  document.body.appendChild(cd);
  const num = cd.firstChild;
  let n = 3;
  num.textContent = n;
  await new Promise(r => { const iv = setInterval(() => { n--; if (n <= 0) { clearInterval(iv); cd.remove(); r(); } else num.textContent = n; }, 1000); });

  // 进入答题区
  document.getElementById('pk-game').style.display = 'block';
  pkUpdateScoreboard();
  s.myScore = 0; s.myAnswered = 0; s.status = 'playing';
  pkSaveSession();
  pkShowQuestion();
  pkPoll();
}

async function pkUpdateScoreboard() {
  const s = pkState; if (!s) return;
  const me = document.getElementById('pk-me-name'), opp = document.getElementById('pk-opp-name');
  if (me) me.textContent = pkMyName() + ' (you)';
  if (opp) {
    // 对手显示 preferred name（从房间数据取对手学号，异步查名）
    const oppSid = s.oppStudentId || null;
    opp.textContent = s.role === 'host' ? 'Opponent' : 'Host';
    if (oppSid && typeof igPrefetchNames === 'function') {
      const names = await igPrefetchNames([oppSid]);
      if (names[oppSid]) opp.textContent = names[oppSid];
    }
  }
  const ms = document.getElementById('pk-me-score'), os = document.getElementById('pk-opp-score');
  if (ms) ms.textContent = s.myScore;
  if (os) os.textContent = s.oppScore;
}

// ============ PK 答题区（自渲染，不碰主页 quiz 面板）============
function pkShowQuestion() {
  const s = pkState; if (!s) return;
  const area = document.getElementById('pk-q-area');
  if (s.myAnswered >= s.qCount) { pkMarkDone(); return; }
  s.qStartTime = Date.now();
  const item = s.questions[s.myAnswered];
  area.innerHTML = `
    <div style="text-align:center;font-weight:800;color:#78716c;font-size:.85rem;margin-bottom:8px;">Question ${s.myAnswered + 1} / ${s.qCount}</div>
    <img src="${(typeof ASSET_BASE !== 'undefined' ? ASSET_BASE : '/') + 'questions/' + pkEscape(item.q)}" style="max-width:100%;border-radius:12px;margin-bottom:12px;cursor:zoom-in;" onclick="zoomImage(this.src)">
    <div style="display:flex;gap:10px;justify-content:center;">
      ${['A','B','C','D'].map(l => `<button class="pk-opt" data-l="${l}" style="flex:1;max-width:90px;padding:14px;border:2px solid rgba(99,102,241,.2);border-radius:12px;background:#fff;font-weight:800;font-size:16px;cursor:pointer;font-family:inherit;">${l}</button>`).join('')}
    </div>`;
  area.querySelectorAll('.pk-opt').forEach(b => {
    b.onclick = () => pkAnswer(b.dataset.l, b);
  });
}

async function pkAnswer(letter, btn) {
  const s = pkState; if (!s || s.myDone) return;
  const item = s.questions[s.myAnswered];
  const correct = letter === item.a;
  // 时间积分：10秒答对=1000分，20秒=500分（1500-50/秒），答错=0分，保底100分
  if (correct) {
    const sec = (Date.now() - (s.qStartTime || Date.now())) / 1000;
    s.myScore += Math.max(100, Math.round(1500 - 50 * sec));
  }
  s.myAnswered++;
  // 高亮
  btn.style.borderColor = correct ? '#10b981' : '#ef4444';
  btn.style.background = correct ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)';
  // 云端同步（更新自己一侧分数）
  const patch = s.role === 'host'
    ? { host_score: s.myScore, host_answered: s.myAnswered }
    : { guest_score: s.myScore, guest_answered: s.myAnswered };
  try { await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${s.code}`, { method: 'PATCH', body: JSON.stringify(patch) }); } catch (e) {}
  // 云端答题记录（正常计分入排行榜，走既有通道）
  if (typeof recordAnswerCloud === 'function') recordAnswerCloud({ q: item.q, img: true, a: item.a }, correct);
  // 错题入本会话缓冲（跑完提交，退出丢弃——与单刷规则一致）
  if (!correct && typeof pendingWrongRecords !== 'undefined') pendingWrongRecords.push({ qItem: { q: item.q, img: true, a: item.a }, qNumber: s.myAnswered });

  pkSaveSession();
  pkUpdateScoreboard();
  setTimeout(() => pkShowQuestion(), 450);
}

async function pkMarkDone() {
  const s = pkState; if (!s || s.myDone) return;
  s.myDone = true;
  // 状态标记：host_done / guest_done（对方轮询能看到）
  const st = s.role === 'host' ? 'host_done' : 'guest_done';
  // 若对方已完成 → 直接 finish
  try {
    const rows = await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${s.code}&select=status`);
    const oppDoneAlready = rows && rows.length && (rows[0].status === 'host_done' || rows[0].status === 'guest_done');
    await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${s.code}`, { method: 'PATCH', body: JSON.stringify({ status: oppDoneAlready ? 'finished' : st }) });
    if (oppDoneAlready) await pkFinish(null);
  } catch (e) {}
  pkSaveSession();
  document.getElementById('pk-q-area').innerHTML = '<p style="text-align:center;color:#a8a29e;font-weight:700;padding:20px 0;">Waiting for opponent…</p>';
}

async function pkFinish(room) {
  const s = pkState; if (!s || s.status === 'finished') return;
  s.status = 'finished';
  if (s.pollTimer) clearTimeout(s.pollTimer);
  if (!room) {
    try { room = (await pkApi(`/rest/v1/${PK_TABLE}?code=eq.${s.code}&select=*`))[0]; } catch (e) {}
  }
  // 提交会话缓冲（错题入库）
  if (typeof commitSessionRecords === 'function') commitSessionRecords();
  const myScore = s.myScore, oppScore = s.oppScore;
  pkClearSession(); // 对局结束，清会话存档
  const win = myScore > oppScore, tie = myScore === oppScore;
  // 历史记录
  const myResult = win ? 'win' : tie ? 'tie' : 'loss';
  addPKHistory({ date: new Date().toISOString(), code: s.code, myScore, oppScore, result: myResult, opp: oppName });
  // 云端上报（PK 排行榜数据源）；失败静默（本地历史仍有效）
  const meU = (typeof igCurrentUser === 'function') && igCurrentUser();
  // 对手显示名：preferred name 优先，无则用对手玩家 id（学号）截短
  let oppName = 'Opponent';
  const oppSid = s.oppStudentId && String(s.oppStudentId).startsWith('sid_') ? s.oppStudentId.slice(4) : null;
  if (oppSid) {
    oppName = oppSid;
    try {
      const names = (typeof igPrefetchNames === 'function') ? await igPrefetchNames([oppSid]) : {};
      if (names[oppSid]) oppName = names[oppSid];
    } catch (e) {}
  }
  if (meU && /^\d{8}$/.test(meU.studentId) && Number.isFinite(myScore) && myScore >= 0 && myScore <= s.qCount * 1500 + 100) {
    pkApi('/rest/v1/pk_results', { method: 'POST', body: JSON.stringify({
      student_id: meU.studentId, code: s.code, my_score: Math.round(myScore), opp_score: Math.round(oppScore), result: myResult
    })}).catch(() => {});
  }
  // 房间保留 60 秒再删：让后完成的一方也能轮询到终局数据拿到结算
  setTimeout(() => { try { pkApi(`/rest/v1/${PK_TABLE}?code=eq.${s.code}`, { method: 'DELETE' }).catch(() => {}); } catch (e) {} }, 60000);

  const game = document.getElementById('pk-game');
  if (game) game.style.display = 'none';
  const result = document.getElementById('pk-result');
  result.style.display = 'block';
  result.innerHTML = `
    <div style="font-size:3.2rem;margin-bottom:6px;">${win ? '🏆' : tie ? '🤝' : '💪'}</div>
    <h2 style="margin:0 0 4px;font-size:1.5rem;color:#1e293b;">${win ? 'Victory!' : tie ? 'Draw' : 'Defeat'}</h2>
    <p style="font-size:1.1rem;font-weight:800;color:#78716c;margin:0 0 16px;">You ${myScore} pts — ${oppScore} pts Opponent</p>
    <button id="pk-again-btn" style="padding:12px 28px;border:none;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">Back to Lobby</button>`;
  document.getElementById('pk-again-btn').onclick = () => {
    result.style.display = 'none';
    document.getElementById('pk-lobby').style.display = 'block';
    pkState = null;
  };
}

function pkLeaveRoom() {
  if (pkState && pkState.pollTimer) clearTimeout(pkState.pollTimer);
  pkState = null;
  pkClearSession();
  renderPKView();
}

// ============ 历史 ============
function pkShowHistory() {
  let ov = document.getElementById('pk-history-modal');
  if (ov) ov.remove();
  ov = document.createElement('div');
  ov.id = 'pk-history-modal';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(245,240,232,.9);display:flex;align-items:center;justify-content:center;z-index:9700;padding:20px;';
  const h = getPKHistory();
  ov.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px;width:min(420px,92vw);max-height:75vh;overflow:auto;box-shadow:0 12px 40px rgba(0,0,0,.2);">
      <h3 style="margin:0 0 14px;text-align:center;font-weight:800;color:#1e293b;">🏆 PK History</h3>
      ${h.length ? h.map(e => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #f0ebe0;border-radius:12px;margin-bottom:8px;">
          <div style="font-size:.8rem;color:#78716c;">${new Date(e.date).toLocaleDateString()} <span style="color:#a8a29e;">#${pkEscape(e.code)}</span> · vs <b style="color:#475569;">${pkEscape(e.opp || 'Opponent')}</b>${e.fled ? ' <span style="font-size:.68rem;color:#d97706;">(left early)</span>' : ''}</div>
          <div style="font-weight:800;font-size:.9rem;color:${e.result === 'win' ? '#10b981' : e.result === 'tie' ? '#d97706' : '#ef4444'};">${e.result === 'win' ? 'WIN' : e.result === 'tie' ? 'DRAW' : 'LOSS'} ${e.myScore}–${e.oppScore}</div>
        </div>`).join('') : '<p style="text-align:center;color:#a8a29e;font-weight:600;">No PK history yet.</p>'}
      <button onclick="document.getElementById('pk-history-modal').remove()" style="width:100%;padding:10px;margin-top:6px;border:2px solid rgba(180,130,70,.12);border-radius:12px;background:none;color:#c4943a;font-weight:700;cursor:pointer;font-family:inherit;">Close</button>
    </div>`;
  document.body.appendChild(ov);
}
