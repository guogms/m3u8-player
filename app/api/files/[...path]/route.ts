export const runtime = 'edge';

import { type NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    return handleRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
    return handleRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
    return handleRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
    return handleRequest(request, params.path);
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    });
}

async function handleRequest(request: NextRequest, path: string[]) {
    const url = new URL(request.url);
    const targetUrl = `https://video-202501.pages.dev/${path.join("/")}${url.search}`;

    const options: RequestInit = {
        method: request.method,
        headers: request.headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
        options.body = await request.arrayBuffer();
    }

    try {
        const response = await fetch(targetUrl, options);
        return handleResponse(response);
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: "Proxy failed" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
}

async function handleResponse(response: Response) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");

    const contentDisposition = response.headers.get('Content-Disposition');
    if (!contentDisposition) {
        const filename = path.join('/').split('/').pop() || 'file';
        newHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
    }

    const contentType = response.headers.get("Content-Type");
    if (contentType && (contentType.includes("application/octet-stream") || contentType.includes("video/") || contentType.includes("audio/") || contentType.includes("image/"))) {
        return new NextResponse(response.body, {
            status: response.status,
            headers: newHeaders,
        });
    }

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
        status: response.status,
        headers: newHeaders,
    });
}