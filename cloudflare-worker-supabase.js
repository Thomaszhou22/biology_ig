// Cloudflare Worker — Supabase API 中转（igmcq.com）
// 作用：国内直连 api.igmcq.com，由 Cloudflare 边缘转发到被墙的 supabase.co
// 部署：Cloudflare 面板 → Workers & Pages → Create Worker → 粘贴本代码 → Deploy
// 路由：DNS 加一条 api.igmcq.com 的 A/AAAA 记录（Proxy 开橙云），或 Worker 路由 api.igmcq.com/*

export default {
  async fetch(request) {
    const UPSTREAM = 'https://shbrzimzhoqremvxhzib.supabase.co';
    const url = new URL(request.url);

    // 只转发 REST/Auth 路径，其他一律 404
    const path = url.pathname;
    if (!path.startsWith('/rest/v1') && !path.startsWith('/auth/v1')) {
      return new Response('Not Found', { status: 404 });
    }

    const upstream = new URL(UPSTREAM + path + url.search);

    // 转发请求（保留方法和头）
    const headers = new Headers(request.headers);
    headers.set('Host', upstream.hostname);
    // 让 Supabase 认真实客户端协议
    headers.set('X-Forwarded-Host', url.hostname);
    headers.delete('cf-connecting-ip');

    const init = {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    };

    const resp = await fetch(upstream, init);

    // 回传响应，加上 CORS（浏览器直连场景需要）
    const outHeaders = new Headers(resp.headers);
    outHeaders.set('Access-Control-Allow-Origin', '*');
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};
