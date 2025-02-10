export const runtime = 'edge';

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params.path)
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  })
}

async function handleRequest(request: NextRequest, path: string[]) {

  // // 解码url
  // const decodedUrl = decodeURIComponent(request.url.split("?url=")[1]);

  // // 构造请求url
  let targetUrl;

  // // 如果请求由浏览器窗口中发起
  // if(decodedUrl){
  //   console.log('decodedUrl',decodedUrl);



    let tempDomain, spilt_str;
    let tempurl = new URL(request.url);
    
    // 获取初始的域名
    tempDomain = tempurl.hostname;
    spilt_str = tempDomain + "/api/forward/";
    
    // 循环查找直到不能找到 /api/forward/ 为止
    while (request.url.includes(spilt_str)) {
        // 获取下一个 URL 部分
        const tempPath = request.url.split("/api/forward/")[1];
        
        // 更新 URL 和 spilt_str
        const url = new URL(tempPath);
        
        // 更新 request.url，继续循环
        request.url = url.href;
    }
    // 获取协议头
    const protocol = url.protocol
  
    // 获取domain参数
    const domain = url.hostname
  
    // 路径名
    const pathname = url.pathname
  
    // 后缀
    const search = url.search
  
    targetUrl = `${protocol}//${domain}${pathname}${search}`
    
  // }
  // // 否则认为浏览器主动发起
  // else
  // {
  //   console.log('not decodedUrl');
    
  //   const url = new URL(request.url.split("/api/forward/")[1]);
  
  //   // 获取协议头
  //   const protocol = url.protocol
  
  //   // 获取domain参数
  //   const domain = url.hostname
  
  //   // 路径名
  //   const pathname = url.pathname
  
  //   // 后缀
  //   const search = url.search

  //   targetUrl = `${protocol}//${domain}/${path.join("/")}${search}`;
  // }

  console.log('打印日志',targetUrl);
  
  // Prepare fetch options
  const options: RequestInit = {
    method: request.method,
    headers: request.headers,
  }

  // Include body for non-GET requests
  if (request.method !== "GET") {
    options.body = await request.arrayBuffer()
  }

  // Forward the request to the target URL
  const response = await fetch(targetUrl, options)

  // Prepare new headers with CORS
  const newHeaders = new Headers(response.headers)
  newHeaders.set("Access-Control-Allow-Origin", "*")
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  newHeaders.set("Access-Control-Allow-Headers", "*")

  // For binary files, we need to return the response as-is
  const contentType = response.headers.get("Content-Type")
  if (
    contentType &&
    (contentType.includes("application/octet-stream") ||
      contentType.includes("video/") ||
      contentType.includes("audio/") ||
      contentType.includes("image/"))
  ) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: newHeaders,
    })
  }

  // For text-based responses, we can return them as before
  const responseBody = await response.text()
  return new NextResponse(responseBody, {
    status: response.status,
    headers: newHeaders,
  })
}
