export const runtime = 'edge';

import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path);
}

export async function OPTIONS(request: NextRequest) {
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
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  // 获取domain参数，并去除前缀 '/'
  const domain = searchParams.get('domain')?.replace('/','') || 'video-202501.pages.dev'; 
  
  const remainingPath = request.nextUrl.pathname.substring(request.nextUrl.origin.length + 3);  // 截取域名之后的路径
  const filteredPath = remainingPath.split('/').filter(segment => segment !== "api" && segment !== "files"); 
  const targetPath = filteredPath.map(segment => segment.split('/').filter(part => part).join('/')).join('/'); 

  // 构造目标URL
  const targetUrl = `https://${domain}/${targetPath}${url.search}`;

  // 准备请求选项
  const options: RequestInit = {
    method: request.method,
    headers: request.headers,
  };
  // 包含非GET请求的请求体
  if (request.method !== "GET") {
    options.body = await request.arrayBuffer();
  }
  // 转发请求到目标URL
  const response = await fetch(targetUrl, options);
  // 准备新的响应头，包含CORS设置
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "*");
  // 处理二进制文件，直接返回响应体
  const contentType = response.headers.get("Content-Type");
  if (
    contentType &&
    (
      contentType.includes("application/octet-stream") ||
      contentType.includes("video/") ||
      contentType.includes("audio/") ||
      contentType.includes("image/")
    )
  ) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
  // 处理基于文本的响应，返回响应内容
  const responseBody = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: newHeaders,
  });
}
