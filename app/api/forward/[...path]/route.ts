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
  let targetUrl;

  try {
    let tempUrl = new URL(request.url);
    let tempDomain = tempUrl.origin;
    let spilt_str = tempDomain.split('//')[1] + "/api/forward/";
    const tempPath = tempUrl.href.split(spilt_str).pop();

    if (tempPath) {
      tempUrl = new URL(tempPath);
    }

    targetUrl = `${tempUrl.protocol}//${tempUrl.hostname}${tempUrl.pathname}${tempUrl.search}`;
  } catch (error) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  console.log('请求转发到:', targetUrl);

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
