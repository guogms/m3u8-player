export const runtime = 'edge';

import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

async function handleRequest(request: NextRequest, path: string[]) {
  let targetUrl, tempDomain;

  
  try {
    let tempUrl = new URL(decodeURIComponent(request.url));
    tempDomain = tempUrl.origin;
    let spilt_str = tempDomain.split('//')[1] + "/api/forward/";
    const tempPath = tempUrl.href.split(spilt_str).pop();

    

    if (tempPath) {
      tempUrl = new URL(tempPath);
    }

    targetUrl = decodeURIComponent(`${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`);

    console.log('请求转发到:', targetUrl);


  } catch (error) {
    return new NextResponse("Invalid URL", { status: 400 });
  }


  // 复制请求头（避免某些 Header 影响转发）
  const headers = new Headers(request.headers);
  headers.delete("host");

  const options: RequestInit = {
    method: request.method,
    headers,
    body: request.method !== "GET" ? request.body : null, // 直接传递 body 以支持流式数据
  };

  // 发送请求
  const response = await fetch(targetUrl, options);
  const contentType = response.headers.get("Content-Type") || "";

  
  // 处理 HTML，替换网页中的资源地址为代理地址
  if (contentType.includes("text/html")) {

      // 删除 `host` 头，防止跨域问题
      const headers = new Headers(request.headers);
      headers.delete("host");

      const options: RequestInit = {
        method: request.method,
        headers,
        body: request.method !== "GET" ? await request.arrayBuffer() : null,
      };

      const response = await fetch(targetUrl, options);

      // 复制响应头
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "*");
      const html = await response.text();
      const proxiedHtml = rewriteHtmlUrls(tempDomain, html, targetUrl);
      return new NextResponse(proxiedHtml, {
        status: response.status,
        headers: newHeaders,
      });
  }
  // 复制响应头
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "*");

  // 确保文件下载时的 `Content-Disposition`
  const contentDisposition = response.headers.get("Content-Disposition");
  if (!contentDisposition && response.headers.get("Content-Type")?.includes("application/octet-stream")) {
    newHeaders.set("Content-Disposition", "attachment");
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: newHeaders,
  });
 

}

// 处理 HTML，替换网页中的 URL 为代理地址
function rewriteHtmlUrls(tempDomain: string, html: string, baseUrl: string): string | undefined {
  const baseDomain = new URL(baseUrl).origin;
  if (baseDomain !==''){
    return html.replace(/(href|src|action)=["'](.*?)["']/gi, (match, attr, url) => {
      if (url.startsWith("/") || url.startsWith(baseDomain)) {
        return `${attr}="/api/forward/${encodeURIComponent(new URL(url, baseDomain).href)}"`;
      }
      return match;
    }).replace(/fetch\(["'](.*?)["']\)/gi, (match, url) => {
      if (url.startsWith("/") || url.startsWith(baseDomain)) {
        return `fetch("/api/forward/${encodeURIComponent(new URL(url, baseDomain).href)}")`;
      }
      return match;
    });
  }
  else{

    return html.replace(/(href|src|action)=["'](.*?)["']/gi, (match, attr, url) => {
      if (url.startsWith("/") || url.startsWith(tempDomain)) {
        return `${attr}="/api/forward/${encodeURIComponent(new URL(url, tempDomain).href)}"`;
      }
      return match;
    }).replace(/fetch\(["'](.*?)["']\)/gi, (match, url) => {
      if (url.startsWith("/") || url.startsWith(tempDomain)) {
        return `fetch("/api/forward/${encodeURIComponent(new URL(url, tempDomain).href)}")`;
      }
      return match;
    });
  }
}
