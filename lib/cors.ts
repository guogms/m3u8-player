// lib/cors.ts
// CORS 配置和工具函数

/**
 * 允许的域名列表
 */
export const ALLOWED_ORIGINS = [
  'https://www.8kkjj.com',
  'https://www.5yxy5.com',
  'https://u2.8kkjj.com',
  'https://www.8kjy.com',
  'https://277.8kkjj.com',
  'https://www.8kja.com',
  'localhost:8000',
];

/**
 * 检查请求来源是否被允许
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * 获取 CORS 响应头
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 小时
  };

  // 如果来源在允许列表中，设置该来源
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    // 如果不在列表中，允许所有来源（可选，根据安全需求调整）
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * 为 NextResponse 添加 CORS 头部
 */
export function addCorsHeaders(headers: Headers, origin: string | null): void {
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}
