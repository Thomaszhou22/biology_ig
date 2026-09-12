# IG Biology Quiz

**Cambridge IGCSE Biology (0610) practice platform — 777 questions · 21 chapters · accounts, mock exams, 1v1 PK, leaderboards.**

[![Live](https://img.shields.io/badge/Live-igmcq.com-f59e0b)](https://igmcq.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://thomaszhou22.github.io/biology_ig/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black)](https://biologyjumpig.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**▶ Play now: [igmcq.com](https://igmcq.com)** (China-friendly custom domain, no VPN needed)

Backup mirrors: [biologyjumpig.vercel.app](https://biologyjumpig.vercel.app) · [thomaszhou22.github.io/biology_ig](https://thomaszhou22.github.io/biology_ig/)

---

## Features

### Quiz
- Chapter selection with per-chapter question limits
- Wrong-answer tracking with per-question wrong counts
- Adaptive weighting: the more times you get a question wrong, the more often it reappears (2+2n, capped at 10×)
- Session buffering: quit mid-quiz and nothing counts; finish it and everything commits

### Mistake Collection
- Grouped by chapter, lazy-loaded images (click a chapter to expand)
- Wrong-count badges (×2 orange, ×3+ red)
- **Generate a Paper from Mistakes**: weighted sampling by wrong count, chapter selection, count capped at available mistakes — mistakes are permanent, the only way out is to get them right
- Runs at its own URL: `/mistakes/paper`

### Mock Exam
- 45-minute, 40-question weighted exam (wrong questions appear more often)
- AIME-style answer grid: blue fill = answered, blue outline = blank, orange dot = flagged, click to jump
- Silent answering: no correct/wrong reveal, answers changeable, Previous/Next navigation
- Mid-exam navigation locked (Home auto-settles); quit returns to the mock landing page
- Refresh-safe: exam state persists across reloads (answers, flags, timer)
- Result card: answered/unanswered breakdown, accuracy

### 1v1 PK
- Room-based duels: create a room (chapter select, 5–50 questions), opponent joins with a 4-character code
- Synchronized 3-2-1 countdown, same questions in the same order
- Time-based scoring: `max(100, 1500 − 50/s)` — answer in 10s for 1000 points, wrong = 0
- Live scoreboard synced every 1.5s; settles only when both players finish
- PK history (last 50 duels, local) + cloud PK leaderboard ranked by wins

### Leaderboards
- **Quiz board**: ranked by correct answers (questions × accuracy, hidden computation), per-question dedup so re-answering can't farm score
- **PK board**: ranked by wins, with W/L/T breakdown
- Gold/silver/bronze for top 3, your row highlighted

### Accounts
- Student-ID login (8 digits, validated), signup with password confirmation
- Passwords stored as salted SHA-256 (per-user salt); verification runs server-side via a rate-limited RPC — password hashes are never readable by the client
- Answers and PK results sync to the cloud per-account

## Architecture

```
Browser (static SPA, zero build step)
  ├── GitHub Pages / Vercel   — static hosting + CDN
  ├── igmcq.com               — custom domain (Cloudflare DNS → Vercel)
  └── api.igmcq.com           — Cloudflare Worker relay → Supabase (China-friendly)
        └── Supabase Postgres — users, answers, PK rooms/results (RLS-hardened)
```

- **No build tooling**: plain HTML/JS/CSS — `pk.js`, `auth.js`, `app.js` layered on the original single-file quiz engine
- **China access**: custom domain + Worker relay means students need no VPN
- **Data safety (4 layers)**: column-level grants hide password hashes; login via `SECURITY DEFINER` RPC with 0.3s anti-brute-force delay; answers/PK records are insert+select only (no client-side edits or deletes); input constraints on every table

## Pages

| URL | Content |
|---|---|
| `/` | Quiz (chapter select) |
| `/mock-exam` | Mock exam |
| `/pk` | 1v1 PK |
| `/mistakes` | Mistake collection (+ paper generator) |
| `/mistakes/paper` | Mistake paper runner |
| `/leaderboard` | Quiz + PK leaderboards |
| `/ai-analysis` | AI analysis (bring your own API key) |

## Tech Stack

Vanilla JS · Supabase (Postgres + RLS + RPC) · Cloudflare Workers · Vercel · GitHub Pages · Lucide icons (inline SVG)

## Setup

```bash
git clone https://github.com/Thomaszhou22/biology_jump_ig.git
cd biology_jump_ig
python3 -m http.server 8901   # any static server
```

Database setup: run the SQL files in order in Supabase SQL Editor —
`supabase-ig-setup.sql` → `supabase-pk-setup.sql` → `supabase-security-hardening.sql`.
Update the Supabase URL/key in `auth.js`/`pk.js` if using your own project.

## License

MIT
