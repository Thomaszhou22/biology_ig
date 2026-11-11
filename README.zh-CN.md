# IG Biology Quiz — IGCSE 生物刷题平台

[![Live](https://img.shields.io/badge/在线-igmcq.com-f59e0b)](https://igmcq.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://thomaszhou22.github.io/biology_ig/)
[![Vercel](https://img.shields.io/badge/Vercel-已部署-black)](https://biologyjumpig.vercel.app)
[![License](https://img.shields.io/badge/许可证-MIT-yellow)](LICENSE)

**[English](README.md)** | **中文**

剑桥 IGCSE 生物（0610）刷题平台——**777 道真题 · 21 章 · 账号系统 · 模拟考试 · 1v1 对战 · 排行榜**

**▶ 立即使用：[igmcq.com](https://igmcq.com)**（国内直连，无需 VPN）

备用镜像：[biologyjumpig.vercel.app](https://biologyjumpig.vercel.app) · [thomaszhou22.github.io/biology_ig](https://thomaszhou22.github.io/biology_ig/)

---

## 目录

<details>
<summary>点击展开</summary>

- [功能](#功能)
- [架构](#架构)
- [页面路由](#页面路由)
- [技术栈](#技术栈)
- [本地运行](#本地运行)
- [许可证](#许可证)

</details>

## 功能

### 刷题
- 按章节选题（每章可设题目数量）
- 错题追踪（每道题的累计错误次数）
- 自适应加权：错得越多，重现概率越高（2+2n，上限 10 倍）
- 会话缓冲：中途退出不计分，答完全部提交才生效

### 错题本
- 按章节分组，懒加载题目图片（点开章节才加载）
- 错误次数徽章（×2 橙色，×3+ 红色）
- **从错题生成试卷**：按错误次数加权抽题、可选章节、数量上限——错题永久存在，唯一消除方式是答对它
- 独立路由：`/mistakes/paper`

### 模拟考试
- 45 分钟 / 40 题（自适应题量）
- 错题优先出题
- 逐题网格导航（已答/未答/标记一目了然）
- 自动交卷 + 成绩报告

### 1v1 PK
- 实时对战（走 api.igmcq.com 后端）
- 房间创建 / 邀请码加入
- 同题同步（双方看到第 1 题的时间一致）
- 逃跑判定（15 秒无响应判负）
- 战绩记录 + 排行榜

### AI 分析
- 弱项分析（按章节统计正确率）
- 错题趋势（错误次数变化）
- 自带 API Key（支持 OpenAI / Anthropic / Gemini / DeepSeek / 自定义）

### 账号系统
- 学号登录（8 位数字）
- 昵称 + 班级设置
- 云端同步（答题记录、错题本、成绩全上云）
- 排行榜显示昵称

## 架构

```
┌─────────────────────────────────────────────┐
│  前端（纯 HTML + CSS + JS，零框架）          │
│  index.html / auth.js / app.js / pk.js     │
├─────────────────────────────────────────────┤
│  静态资源                                    │
│  questions/chXX/qNN.jpg（777 张题图）        │
├─────────────────────────────────────────────┤
│  后端                                        │
│  Supabase (PostgreSQL + Auth + Storage)     │
│  api.igmcq.com (Cloudflare Worker → PK 路由)│
├─────────────────────────────────────────────┤
│  部署                                        │
│  igmcq.com (Vercel + 自定义域名)             │
│  备用：GitHub Pages / Vercel 默认域名         │
└─────────────────────────────────────────────┘
```

## 页面路由

| 路径 | 功能 |
|---|---|
| `/` | 首页 + 刷题入口 |
| `/mock-exam` | 模拟考试 |
| `/pk` | 1v1 PK |
| `/mistakes` | 错题本 |
| `/mistakes/paper` | 从错题生成试卷 |
| `/leaderboard` | 排行榜 |
| `/ai-analysis` | AI 弱项分析 |
| `/account` | 账号设置 |

## 技术栈

- **前端**：纯 HTML + CSS + JavaScript（零框架，零构建）
- **后端**：Supabase（PostgreSQL + Auth + Storage）
- **PK 对战**：api.igmcq.com（Cloudflare Worker）
- **部署**：Vercel（自定义域名）+ GitHub Pages 备用
- **无依赖**：不需要 npm install，浏览器打开即用

## 本地运行

```bash
git clone https://github.com/Thomaszhou22/biology_ig.git
cd biology_ig
# 用任意静态服务器打开
python3 -m http.server 8000
# 打开 http://localhost:8000
```

无需安装依赖，无需配置环境变量（Supabase 配置已内置）。

## 许可证

MIT
