import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const REMOTE_ORIGIN = process.env.REMOTE_FILE_ORIGIN || 'https://video-202501.pages.dev';
const HOP_BY_HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade']);

// 使用 Node.js runtime 以兼容 Cloudflare OpenNext
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(request, params.path);
}

export async function OPTIONS(request: NextRequest) {
  const headers = buildCorsHeaders();
  return new NextResponse(null, { status: 200, headers });
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: cloneRequestHeaders(request.headers),
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
  });

  const headers = cloneResponseHeaders(upstreamResponse.headers);
  ensureContentDisposition(headers, path);
  applyCors(headers);

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}

function buildTargetUrl(pathSegments: string[], query: string) {
  const joined = pathSegments.map((segment) => encodeURIComponent(segment)).join('/');
  const normalized = `${REMOTE_ORIGIN.replace(/\/$/, '')}/${joined}`;
  return `${normalized}${query}`;
}

function cloneRequestHeaders(headers: Headers) {
  const clone = new Headers(headers);
  clone.delete('host');
  return clone;
}

function cloneResponseHeaders(headers: Headers) {
  const result = new Headers();
  headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    result.set(key, value);
  });
  return result;
}

function ensureContentDisposition(headers: Headers, path: string[]) {
  if (headers.has('content-disposition')) return;
  const fallbackName = path[path.length - 1] || 'file';
  headers.set('Content-Disposition', `attachment; filename="${fallbackName}"`);
}

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function applyCors(headers: Headers) {
  const cors = buildCorsHeaders();
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
}
