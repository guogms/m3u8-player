import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade']);

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: buildCorsHeaders(),
  });
}

async function handleProxy(request: NextRequest, path: string[]) {
  const target = resolveTargetUrl(request, path);
  if (!target) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const upstreamResponse = await fetch(target.toString(), {
    method: request.method,
    headers: cloneRequestHeaders(request.headers),
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
  });

  const headers = cloneResponseHeaders(upstreamResponse.headers);
  applyCors(headers);
  ensureAttachmentHeader(headers);

  const contentType = upstreamResponse.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await upstreamResponse.text();
    const rewritten = rewriteHtml(target, html);
    return new NextResponse(rewritten, { status: upstreamResponse.status, headers });
  }

  return new NextResponse(upstreamResponse.body, { status: upstreamResponse.status, headers });
}

function resolveTargetUrl(request: NextRequest, path: string[]) {
  const joined = path.join('/');
  const fallback = request.nextUrl.searchParams.get('target');
  const raw = joined || fallback;
  if (!raw) return null;

  const decoded = decodeURIComponent(raw);
  try {
    return new URL(decoded);
  } catch {
    try {
      return new URL(`https://${decoded}`);
    } catch {
      return null;
    }
  }
}

function cloneRequestHeaders(headers: Headers) {
  const clone = new Headers(headers);
  clone.delete('host');
  return clone;
}

function cloneResponseHeaders(headers: Headers) {
  const filtered = new Headers();
  headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    filtered.set(key, value);
  });
  return filtered;
}

function ensureAttachmentHeader(headers: Headers) {
  if (headers.has('content-disposition')) return;
  if ((headers.get('content-type') || '').includes('application/octet-stream')) {
    headers.set('Content-Disposition', 'attachment');
  }
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

function rewriteHtml(baseUrl: URL, html: string) {
  const rewriteAttribute = (_: string, attr: string, value: string) => `${attr}="${rewriteUrl(baseUrl, value)}"`;
  const rewriteFetch = (_: string, url: string) => `fetch("${rewriteUrl(baseUrl, url)}")`;

  return html
    .replace(/(href|src|action)=["'](.*?)["']/gi, rewriteAttribute)
    .replace(/fetch\(["'](.*?)["']\)/gi, rewriteFetch);
}

function rewriteUrl(base: URL, value: string) {
  if (!value || value.startsWith('data:') || value.startsWith('mailto:') || value.includes('/api/forward/')) {
    return value;
  }

  let target: string;

  if (/^https?:\/\//i.test(value)) {
    target = value;
  } else if (value.startsWith('//')) {
    target = `${base.protocol}${value}`;
  } else if (value.startsWith('/')) {
    target = `${base.origin}${value}`;
  } else {
    target = new URL(value, base).toString();
  }

  return `/api/forward/${encodeURIComponent(target)}`;
}
