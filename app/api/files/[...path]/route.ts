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
  const url = new URL(request.url)
  const searchParams = url.searchParams
  
  // 获取domain参数
  const domain = searchParams.get('domain')

  // Construct the target URL
  const targetDomain = domain || 'video-202501.pages.dev'
  const targetUrl = `https://${targetDomain}/${path.join("/")}${url.search}`

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
